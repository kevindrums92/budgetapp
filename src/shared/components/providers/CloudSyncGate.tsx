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
  const trips = useBudgetStore((s) => s.trips);
  const tripExpenses = useBudgetStore((s) => s.tripExpenses);

  const initializedRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  async function pushSnapshot(snapshot: ReturnType<typeof getSnapshot>) {
    if (!navigator.onLine) {
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
      logger.info("CloudSync", "No session found, switching to guest mode");
      // Regla tuya: deslogueado => no queda data local
      clearPendingSnapshot();
      clearState();
      replaceAllData({ schemaVersion: 3, transactions: [], categories: [], categoryDefinitions: createDefaultCategories(), categoryGroups: createDefaultCategoryGroups(), trips: [], tripExpenses: [] });

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
    if (!navigator.onLine) {
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

        // Check if cloud data has empty categoryDefinitions - inject defaults
        if (!Array.isArray(cloud.categoryDefinitions) || cloud.categoryDefinitions.length === 0) {
          logger.info("CloudSync", "Cloud missing categoryDefinitions, injecting defaults");
          cloud.categoryDefinitions = createDefaultCategories();
          needsPush = true;
        }

        // Check if cloud data has empty categoryGroups - inject defaults (migration to v3)
        if (!Array.isArray(cloud.categoryGroups) || cloud.categoryGroups.length === 0) {
          logger.info("CloudSync", "Cloud missing categoryGroups, injecting defaults (migration to v3)");
          cloud.categoryGroups = createDefaultCategoryGroups();
          cloud.schemaVersion = 3;
          needsPush = true;
        }

        // Migrate v4 to v5: Convert isRecurring to schedule
        logger.info("CloudSync", `Schema version check: cloud.schemaVersion=${cloud.schemaVersion}`);

        if (cloud.schemaVersion === 4 || cloud.schemaVersion === 3) {
          const recurringCount = cloud.transactions.filter((tx: any) => tx.isRecurring).length;
          logger.info("CloudSync", `Migrating cloud data from v${cloud.schemaVersion} to v5 (isRecurring → schedule)`);
          logger.info("CloudSync", `Found ${recurringCount} transactions with isRecurring=true`);

          cloud.transactions = cloud.transactions.map((tx: any) => {
            // If has isRecurring=true, convert to schedule
            if (tx.isRecurring) {
              const schedule = convertLegacyRecurringToSchedule(tx);
              logger.info("CloudSync", `Converting transaction "${tx.name}" to scheduled:`, schedule);
              return {
                ...tx,
                schedule,
                // Keep isRecurring for backward compat but it's deprecated
              };
            }
            return tx;
          });
          cloud.schemaVersion = 5;
          needsPush = true;
          logger.info("CloudSync", "Migration complete, schemaVersion now 5, needsPush=true");
        }

        // Migrate v5 to v6: Deduplicate schedule templates
        if (cloud.schemaVersion === 5) {
          logger.info("CloudSync", "Migrating cloud data from v5 to v6 (deduplicate schedule templates)");
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

          cloud.transactions = [...templatesMap.values(), ...nonTemplates];
          cloud.schemaVersion = 6;
          needsPush = true;
          logger.info("CloudSync", `Migration v5→v6 complete: deduplicated to ${templatesMap.size} schedule templates`);
        }

        if (cloud.schemaVersion >= 6) {
          logger.info("CloudSync", `No migration needed, schema version is ${cloud.schemaVersion}`);
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

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
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
        replaceAllData({ schemaVersion: 3, transactions: [], categories: [], categoryDefinitions: createDefaultCategories(), categoryGroups: createDefaultCategoryGroups(), trips: [], tripExpenses: [] });

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
    if (!navigator.onLine) {
      setCloudStatus("offline");
      setPendingSnapshot(getSnapshot());
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      pushNow();
    }, 1200);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, categories, categoryDefinitions, categoryGroups, trips, tripExpenses]);

  const mode = useBudgetStore.getState().cloudMode;

  return (
    <>
      <BackupScheduler />
      {mode === "cloud" && <CloudBackupScheduler />}
    </>
  );
}
