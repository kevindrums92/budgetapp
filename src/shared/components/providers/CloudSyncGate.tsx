import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCloudState, upsertCloudState } from "@/services/cloudState.service";
import { useBudgetStore } from "@/state/budget.store";
import { clearState } from "@/services/storage.service";
import {
  getPendingSnapshot,
  setPendingSnapshot,
  clearPendingSnapshot,
} from "@/services/pendingSync.service";
import { createDefaultCategories } from "@/constants/categories/default-categories";
import { createDefaultCategoryGroups } from "@/constants/category-groups/default-category-groups";
import BackupScheduler from "@/features/backup/components/BackupScheduler";
import CloudBackupScheduler from "@/features/backup/components/CloudBackupScheduler";
import { logger } from "@/shared/utils/logger";
import { convertLegacyRecurringToSchedule } from "@/shared/services/scheduler.service";
import { getNetworkStatus, addNetworkListener } from "@/services/network.service";

const SEEN_KEY = "budget.welcomeSeen.v1";
const SYNC_LOCK_KEY = "budget.syncLock";
const SYNC_LOCK_TIMEOUT = 5000; // 5 seconds

function isNetworkError(err: unknown) {
  const msg = String((err as any)?.message ?? err ?? "");
  return (
    !navigator.onLine ||
    msg.includes("Failed to fetch") ||
    msg.includes("ERR_NAME_NOT_RESOLVED") ||
    msg.includes("NetworkError")
  );
}

function acquireSyncLock(): boolean {
  try {
    const now = Date.now();
    const existingLock = localStorage.getItem(SYNC_LOCK_KEY);

    if (existingLock) {
      const lockTime = parseInt(existingLock, 10);
      if (now - lockTime < SYNC_LOCK_TIMEOUT) {
        logger.warn("CloudSync", "⚠️ Sync already in progress in another tab/window");
        return false;
      }
    }

    localStorage.setItem(SYNC_LOCK_KEY, String(now));
    return true;
  } catch {
    return true; // If localStorage fails, proceed anyway
  }
}

function releaseSyncLock() {
  try {
    localStorage.removeItem(SYNC_LOCK_KEY);
  } catch {
    // ignore
  }
}

export default function CloudSyncGate() {
  const getSnapshot = useBudgetStore((s) => s.getSnapshot);
  const replaceAllData = useBudgetStore((s) => s.replaceAllData);

  const setCloudMode = useBudgetStore((s) => s.setCloudMode);
  const setCloudStatus = useBudgetStore((s) => s.setCloudStatus);
  const setUser = useBudgetStore((s) => s.setUser);

  const setWelcomeSeen = useBudgetStore((s) => s.setWelcomeSeen);

  const transactions = useBudgetStore((s) => s.transactions);
  const categories = useBudgetStore((s) => s.categories);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const categoryGroups = useBudgetStore((s) => s.categoryGroups);
  const budgets = useBudgetStore((s) => s.budgets);
  const trips = useBudgetStore((s) => s.trips);
  const tripExpenses = useBudgetStore((s) => s.tripExpenses);
  const welcomeSeen = useBudgetStore((s) => s.welcomeSeen);
  const budgetOnboardingSeen = useBudgetStore((s) => s.budgetOnboardingSeen);
  const excludedFromStats = useBudgetStore((s) => s.excludedFromStats);

  const initializedRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  async function pushSnapshot(snapshot: ReturnType<typeof getSnapshot>) {
    if (!(await getNetworkStatus())) {
      setCloudStatus("offline");
      setPendingSnapshot(snapshot);
      return;
    }

    // ⚠️ CRITICAL SAFEGUARD: Verify snapshot before pushing
    const hasData = snapshot.transactions.length > 0 ||
                   snapshot.trips.length > 0;

    if (!hasData) {
      logger.warn("CloudSync", "⚠️ Attempting to push empty snapshot. Blocking to prevent data loss.");
      logger.warn("CloudSync", "Snapshot details:", {
        transactions: snapshot.transactions.length,
        trips: snapshot.trips.length,
        categoryDefinitions: snapshot.categoryDefinitions.length,
      });
      setCloudStatus("error");
      return;
    }

    try {
      setCloudStatus("syncing");
      logger.info("CloudSync", "Pushing snapshot:", {
        transactions: snapshot.transactions.length,
        trips: snapshot.trips.length,
        schemaVersion: snapshot.schemaVersion,
      });
      await upsertCloudState(snapshot);
      clearPendingSnapshot();
      setCloudStatus("ok");
    } catch (err) {
      logger.error("CloudSync", "Push failed:", err);
      setCloudStatus(isNetworkError(err) ? "offline" : "error");
      setPendingSnapshot(snapshot);
    }
  }

  async function initForSession() {
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      // HMR Protection: If we're in development and already have cloud data,
      // don't clear it - the session might just be loading slowly during HMR
      const currentMode = useBudgetStore.getState().cloudMode;
      const currentUser = useBudgetStore.getState().user;
      const hasExistingCloudSession = currentMode === "cloud" && currentUser.email;

      if (import.meta.env.DEV && hasExistingCloudSession) {
        logger.warn("CloudSync", "HMR detected: Session null but already in cloud mode. Skipping reset.");
        // Re-fetch session after a short delay (Supabase might still be initializing)
        setTimeout(async () => {
          const { data: retryData } = await supabase.auth.getSession();
          if (retryData.session) {
            logger.info("CloudSync", "HMR: Session recovered after retry");
            initForSession();
          }
        }, 500);
        return;
      }

      logger.info("CloudSync", "No session found, switching to guest mode");
      // Regla tuya: deslogueado => no queda data local
      clearPendingSnapshot();
      clearState();
      // Categories will be created during onboarding
      replaceAllData({ schemaVersion: 6, transactions: [], categories: [], categoryDefinitions: [], categoryGroups: createDefaultCategoryGroups(), budgets: [], trips: [], tripExpenses: [] });

      // Reset welcome para que vuelva a salir en guest
      try {
        localStorage.removeItem(SEEN_KEY);
      } catch {}
      setWelcomeSeen(false);

      // ✅ Clear user state atomically
      setUser({
        email: null,
        name: null,
        avatarUrl: null,
      });

      setCloudMode("guest");
      setCloudStatus("idle");
      initializedRef.current = false;

      // Mark CloudSync as ready in guest mode (no sync needed, scheduler can run immediately)
      useBudgetStore.getState().setCloudSyncReady();
      logger.info("CloudSync", "Guest mode - scheduler can run immediately");
      return;
    }

    logger.info("CloudSync", "Session found, user:", session.user.id);

    // ✅ Update user state atomically with cloudMode
    const meta = session.user.user_metadata ?? {};
    setUser({
      email: session.user.email ?? null,
      name: (meta.full_name as string) || (meta.name as string) || null,
      avatarUrl: (meta.avatar_url as string) || (meta.picture as string) || null,
    });

    setCloudMode("cloud");

    // Si inicia offline: marcamos offline y guardamos snapshot como pendiente
    if (!(await getNetworkStatus())) {
      setCloudStatus("offline");
      setPendingSnapshot(getSnapshot());
      initializedRef.current = true;
      return;
    }

    // ⚠️ Acquire sync lock to prevent race conditions from multiple tabs
    if (!acquireSyncLock()) {
      logger.warn("CloudSync", "Could not acquire sync lock, another sync in progress");
      setCloudStatus("ok");
      initializedRef.current = true;
      return;
    }

    try {
      setCloudStatus("syncing");

      // ✅ 1) Si hay cambios pendientes locales, PUSH primero y NO hacer PULL
      const pending = getPendingSnapshot();
      if (pending) {
        logger.info("CloudSync", "Found pending snapshot, pushing first:", {
          transactions: pending.transactions.length,
          trips: pending.trips.length,
        });
        await pushSnapshot(pending);
        initializedRef.current = true;
        return;
      }

      // ✅ 2) No hay pendientes: flujo normal (pull)
      logger.info("CloudSync", "No pending changes, pulling from cloud...");
      const cloud = await getCloudState();

      if (cloud) {
        logger.info("CloudSync", "Cloud data found:", {
          transactions: cloud.transactions.length,
          trips: cloud.trips?.length ?? 0,
          schemaVersion: cloud.schemaVersion,
        });

        let needsPush = false;

        // ✅ IMPORTANT: If cloud has data (categories or transactions), mark onboarding as complete
        // This handles the case where localStorage was cleared but cloud has user's data
        const hasCloudData = (cloud.categoryDefinitions && cloud.categoryDefinitions.length > 0) ||
                             (cloud.transactions && cloud.transactions.length > 0) ||
                             (cloud.trips && cloud.trips.length > 0);

        const onboardingCompleted = localStorage.getItem('budget.onboarding.completed.v2') === 'true';

        if (hasCloudData && !onboardingCompleted) {
          logger.info("CloudSync", "Cloud has data but localStorage was cleared, marking onboarding as complete");
          localStorage.setItem('budget.onboarding.completed.v2', 'true');
          localStorage.setItem('budget.onboarding.timestamp.v2', Date.now().toString());
        }

        // Check if cloud data has empty categoryDefinitions
        // Only inject defaults for legacy users who completed onboarding but have no categories
        // New users will create categories during onboarding
        if (!Array.isArray(cloud.categoryDefinitions) || cloud.categoryDefinitions.length === 0) {
          if (hasCloudData && cloud.transactions && cloud.transactions.length > 0) {
            // Legacy user with transactions but no categories - inject defaults
            logger.info("CloudSync", "Cloud missing categoryDefinitions for legacy user, injecting defaults");
            cloud.categoryDefinitions = createDefaultCategories();
            needsPush = true;
          } else {
            // New user or user in onboarding - leave empty
            logger.info("CloudSync", "Cloud missing categoryDefinitions, leaving empty for onboarding");
            cloud.categoryDefinitions = [];
          }
        }

        // Check if cloud data has empty categoryGroups - inject defaults (migration to v3)
        if (!Array.isArray(cloud.categoryGroups) || cloud.categoryGroups.length === 0) {
          logger.info("CloudSync", "Cloud missing categoryGroups, injecting defaults (migration to v3)");
          cloud.categoryGroups = createDefaultCategoryGroups();
          cloud.schemaVersion = 3;
          needsPush = true;
        }

        // Migrate v4 (or v3) to v5: Full scheduled transactions support
        // - Convert isRecurring to schedule
        // - Deduplicate templates (keep only one per name+category+amount)
        // - Add sourceTemplateId to link generated transactions to their template
        logger.info("CloudSync", `Schema version check: cloud.schemaVersion=${cloud.schemaVersion}`);

        if (cloud.schemaVersion === 4 || cloud.schemaVersion === 3) {
          const recurringCount = cloud.transactions.filter((tx: any) => tx.isRecurring).length;
          logger.info("CloudSync", `Migrating cloud data from v${cloud.schemaVersion} to v5`);
          logger.info("CloudSync", `Found ${recurringCount} transactions with isRecurring=true`);

          // Step 1: Convert isRecurring to schedule
          cloud.transactions = cloud.transactions.map((tx: any) => {
            if (tx.isRecurring) {
              const schedule = convertLegacyRecurringToSchedule(tx);
              logger.info("CloudSync", `Converting "${tx.name}" to scheduled:`, schedule);
              return { ...tx, schedule };
            }
            return tx;
          });

          // Step 2: Deduplicate schedule templates
          const templatesMap = new Map<string, any>();
          const nonTemplates: any[] = [];

          for (const tx of cloud.transactions) {
            if (tx.schedule?.enabled) {
              const key = `${tx.name}|${tx.category}|${tx.amount}`;
              const existing = templatesMap.get(key);

              if (!existing || tx.date > existing.date ||
                  (tx.date === existing.date && tx.createdAt > existing.createdAt)) {
                if (existing) {
                  nonTemplates.push({ ...existing, schedule: undefined });
                }
                templatesMap.set(key, tx);
              } else {
                nonTemplates.push({ ...tx, schedule: undefined });
              }
            } else {
              nonTemplates.push(tx);
            }
          }

          // Step 3: Add sourceTemplateId to link transactions to their templates
          const finalTransactions: any[] = [...templatesMap.values()];

          for (const tx of nonTemplates) {
            if (tx.sourceTemplateId) {
              finalTransactions.push(tx);
              continue;
            }

            const key = `${tx.name}|${tx.category}`;
            let matchedTemplate: any = null;

            for (const template of templatesMap.values()) {
              const templateKey = `${template.name}|${template.category}`;
              if (templateKey === key) {
                matchedTemplate = template;
                break;
              }
            }

            if (matchedTemplate) {
              finalTransactions.push({ ...tx, sourceTemplateId: matchedTemplate.id });
            } else {
              finalTransactions.push(tx);
            }
          }

          cloud.transactions = finalTransactions;
          cloud.schemaVersion = 5;
          needsPush = true;
          logger.info("CloudSync", `Migration v4→v5 complete: ${templatesMap.size} templates, transactions linked`);
        }

        // Always repair: Ensure all transactions have sourceTemplateId if they match a template
        // This fixes transactions that were confirmed before sourceTemplateId was added
        if (cloud.schemaVersion >= 5) {
          logger.info("CloudSync", `Schema version is ${cloud.schemaVersion}, checking for sourceTemplateId repairs...`);

          // Find all templates
          const templates = cloud.transactions.filter((tx: any) => tx.schedule?.enabled);

          if (templates.length > 0) {
            let repairCount = 0;

            cloud.transactions = cloud.transactions.map((tx: any) => {
              // Skip templates themselves and transactions that already have sourceTemplateId
              if (tx.schedule?.enabled || tx.sourceTemplateId) {
                return tx;
              }

              // Try to find a matching template by name + category
              const matchedTemplate = templates.find((template: any) =>
                template.name === tx.name && template.category === tx.category
              );

              if (matchedTemplate) {
                repairCount++;
                logger.info("CloudSync", `Repairing sourceTemplateId for "${tx.name}" (${tx.id}) -> template ${matchedTemplate.id}`);
                return { ...tx, sourceTemplateId: matchedTemplate.id };
              }

              return tx;
            });

            if (repairCount > 0) {
              needsPush = true;
              logger.info("CloudSync", `Repaired ${repairCount} transactions with missing sourceTemplateId`);
            }
          }
        }

        replaceAllData(cloud);

        // Push the fixed data back to cloud if we added defaults
        if (needsPush) {
          logger.info("CloudSync", "Pushing migrated data back to cloud");
          await upsertCloudState(cloud);
        }
      } else {
        // ⚠️ CRITICAL SAFEGUARD: NEVER overwrite cloud with empty state
        // This prevents data loss if there's a race condition or auth issue
        const localSnapshot = getSnapshot();
        const hasData = localSnapshot.transactions.length > 0 ||
                       localSnapshot.trips.length > 0;

        if (hasData) {
          // Safe to push: local has actual user data
          logger.info("CloudSync", "New account detected, pushing local data to cloud:", {
            transactions: localSnapshot.transactions.length,
            trips: localSnapshot.trips.length,
            categoryDefinitions: localSnapshot.categoryDefinitions.length,
          });
          await upsertCloudState(localSnapshot);
        } else {
          // WARNING: Local is empty, do NOT overwrite cloud
          // This could be a SIGNED_OUT->SIGNED_IN race condition
          logger.warn("CloudSync", "⚠️ Cloud is null but local is also empty. NOT pushing to prevent data loss.");
          logger.warn("CloudSync", "If this is truly a new account, defaults will be used.");
          // Keep the defaults that were hydrated from defaultState
        }
      }

      setCloudStatus("ok");
      initializedRef.current = true;

      // Mark CloudSync as ready so SchedulerJob can run
      useBudgetStore.getState().setCloudSyncReady();
      logger.info("CloudSync", "CloudSync initialization complete, scheduler can now run");
    } catch (err) {
      logger.error("CloudSync", "Init failed:", err);
      setCloudStatus(isNetworkError(err) ? "offline" : "error");
      // dejamos pendiente el snapshot actual para reintentar
      setPendingSnapshot(getSnapshot());
      initializedRef.current = true;

      // Even on error, mark as ready so scheduler doesn't hang forever
      useBudgetStore.getState().setCloudSyncReady();
    } finally {
      // Always release the sync lock when done
      releaseSyncLock();
    }
  }

  async function pushNow() {
    // siempre empuja el snapshot actual
    await pushSnapshot(getSnapshot());
  }

  // online/offline listeners
  useEffect(() => {
    async function onOnline() {
      if (!initializedRef.current) return;

      // ✅ Si hay pending, push de inmediato
      const pending = getPendingSnapshot();
      if (pending) {
        await pushSnapshot(pending);
      }
    }

    function onOffline() {
      setCloudStatus("offline");
      // ✅ guardamos snapshot por si cierran la app offline
      setPendingSnapshot(getSnapshot());
    }

    const removeListener = addNetworkListener((isOnline) => {
      if (isOnline) {
        onOnline();
      } else {
        onOffline();
      }
    });

    return () => {
      removeListener();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auth listener + init
  useEffect(() => {
    initForSession();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearPendingSnapshot();
        clearState();
        // Leave categories empty - user will recover them when logging back in
        replaceAllData({ schemaVersion: 6, transactions: [], categories: [], categoryDefinitions: [], categoryGroups: createDefaultCategoryGroups(), budgets: [], trips: [], tripExpenses: [] });

        // Reset welcome
        try {
          localStorage.removeItem(SEEN_KEY);
        } catch {}
        setWelcomeSeen(false);

        // ✅ Clear user state on logout
        setUser({
          email: null,
          name: null,
          avatarUrl: null,
        });

        setCloudMode("guest");
        setCloudStatus("idle");
        initializedRef.current = false;
        return;
      }

      if (event === "SIGNED_IN") {
        initializedRef.current = false;
        initForSession();
      }
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce push cuando cambia data (solo en cloud, ya inicializado)
  useEffect(() => {
    const mode = useBudgetStore.getState().cloudMode;
    if (mode !== "cloud" || !initializedRef.current) return;

    // si estás offline, solo marca pendiente y no intentes push
    async function checkNetworkAndPush() {
      if (!(await getNetworkStatus())) {
        setCloudStatus("offline");
        setPendingSnapshot(getSnapshot());
        return;
      }

      if (debounceRef.current) window.clearTimeout(debounceRef.current);

      debounceRef.current = window.setTimeout(() => {
        pushNow();
      }, 1200);
    }

    checkNetworkAndPush();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, categories, categoryDefinitions, categoryGroups, budgets, trips, tripExpenses, welcomeSeen, budgetOnboardingSeen, excludedFromStats]);

  const mode = useBudgetStore.getState().cloudMode;

  return (
    <>
      <BackupScheduler />
      {mode === "cloud" && <CloudBackupScheduler />}
    </>
  );
}
