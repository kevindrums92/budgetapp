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
import {
  initializePushNotifications,
  deactivateToken,
  migrateGuestTokenToUser,
  cleanup as cleanupPushNotifications,
} from "@/services/pushNotification.service";

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
  const updateLastAuthTimestamp = useBudgetStore((s) => s.updateLastAuthTimestamp);

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
  const security = useBudgetStore((s) => s.security);
  // NOTE: subscription is no longer synced to cloud (managed by RevenueCat webhooks)

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
    console.log("[CloudSyncGate] initForSession() called");

    // ⚠️ CRITICAL: Check network status BEFORE attempting any Supabase calls
    // This prevents hanging when app starts offline
    const isOnline = await getNetworkStatus();
    if (!isOnline) {
      logger.info("CloudSync", "App started offline, checking for existing session");

      // ✅ Check if there's a Supabase session stored in localStorage
      // Supabase stores session in localStorage with key: sb-<project-ref>-auth-token
      const supabaseKeys = Object.keys(localStorage).filter(key =>
        key.includes('sb-') && key.includes('-auth-token')
      );

      let storedSessionData: any = null;
      const hasStoredSession = supabaseKeys.length > 0 &&
        supabaseKeys.some(key => {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const parsed = JSON.parse(item);
              if (parsed) {
                storedSessionData = parsed;
                return true;
              }
            }
            return false;
          } catch {
            return false;
          }
        });

      logger.info("CloudSync", `Has stored Supabase session: ${hasStoredSession}`);

      // If there's a stored session, stay in cloud mode (offline)
      // Otherwise, use guest mode
      if (hasStoredSession && storedSessionData) {
        setCloudMode("cloud");

        // Extract user data from stored session (authenticated or anonymous)
        const session = storedSessionData;
        const sessionUser = session.currentSession?.user || session.user;
        if (sessionUser && !sessionUser.is_anonymous) {
          const meta = sessionUser.user_metadata ?? {};
          const appMeta = sessionUser.app_metadata ?? {};
          const provider = (appMeta.provider as string) || sessionUser.identities?.[0]?.provider || null;

          setUser({
            email: sessionUser.email ?? null,
            name: (meta.full_name as string) || (meta.name as string) || null,
            avatarUrl: (meta.avatar_url as string) || (meta.picture as string) || null,
            provider: provider as 'google' | 'apple' | null,
          });
          logger.info("CloudSync", `Offline mode: cloud (loaded user: ${sessionUser.email})`);
        } else {
          // Anonymous user or no user data — still cloud mode, will sync when online
          logger.info("CloudSync", "Offline mode: cloud (anonymous user, will sync when online)");
        }
      } else {
        setCloudMode("guest");
        logger.info("CloudSync", "Offline mode: guest (no session)");
      }

      setCloudStatus("offline");
      initializedRef.current = true;
      useBudgetStore.getState().setCloudSyncReady();
      return;
    }

    const { data } = await supabase.auth.getSession();
    const session = data.session;
    console.log("[CloudSyncGate] Session:", session ? `User ${session.user.id}` : "null");

    // ⚠️ CRITICAL SECURITY: Check if session is pending OTP verification
    // If user closed app without verifying OTP, sign them out
    if (session) {
      const pendingOtp = localStorage.getItem('auth.pendingOtpVerification');
      if (pendingOtp) {
        const timestamp = parseInt(pendingOtp, 10);
        const elapsed = Date.now() - timestamp;
        // If pending OTP is older than 10 minutes, it's definitely abandoned
        if (elapsed > 10 * 60 * 1000) {
          console.warn("[CloudSyncGate] ⚠️ SECURITY: Found abandoned session pending OTP (>10min) - signing out");
          localStorage.removeItem('auth.pendingOtpVerification');
          await supabase.auth.signOut();
          // Refresh to restart the flow
          window.location.reload();
          return;
        } else {
          // Recent pending OTP, user might still be in the flow
          console.log("[CloudSyncGate] Session pending OTP verification (recent), allowing continuation");
        }
      }
    }

    if (!session) {
      // HMR Protection: If we're in development and already have cloud data,
      // don't clear it - the session might just be loading slowly during HMR
      const currentMode = useBudgetStore.getState().cloudMode;
      const currentUser = useBudgetStore.getState().user;
      const hasExistingCloudSession = currentMode === "cloud" && currentUser.email;

      if (import.meta.env.DEV && hasExistingCloudSession) {
        logger.warn("CloudSync", "HMR detected: Session null but already in cloud mode. Skipping reset.");
        setTimeout(async () => {
          const { data: retryData } = await supabase.auth.getSession();
          if (retryData.session) {
            logger.info("CloudSync", "HMR: Session recovered after retry");
            initForSession();
          }
        }, 500);
        return;
      }

      logger.info("CloudSync", "No session found, checking if guest mode or logout");

      // Only clear state if an AUTHENTICATED user lost their session (logout scenario)
      // Anonymous cloud users losing session → preserve data, try to re-create session
      // Guest users with local data → preserve data
      const wasAuthenticated = currentMode === "cloud" && !!currentUser.email;

      if (wasAuthenticated) {
        logger.info("CloudSync", "Authenticated user logged out, clearing local data");
        clearPendingSnapshot();
        clearState();
        replaceAllData({ schemaVersion: 6, transactions: [], categories: [], categoryDefinitions: [], categoryGroups: createDefaultCategoryGroups(), budgets: [], trips: [], tripExpenses: [] });

        try {
          localStorage.removeItem(SEEN_KEY);
        } catch {}
        setWelcomeSeen(false);
      } else {
        logger.info("CloudSync", "No session, preserving local data (guest or anonymous session expired)");
      }

      setUser({
        email: null,
        name: null,
        avatarUrl: null,
        provider: null,
      });

      // Try to create anonymous session → SIGNED_IN handler will activate cloud sync
      if (isOnline) {
        try {
          const { error: anonError } = await supabase.auth.signInAnonymously();
          if (!anonError) {
            console.log("[CloudSyncGate] Anonymous session created, SIGNED_IN will init cloud sync");
            return; // SIGNED_IN handler will call initForSession()
          }
          console.warn("[CloudSyncGate] signInAnonymously failed:", anonError);
        } catch (err) {
          console.warn("[CloudSyncGate] signInAnonymously error:", err);
        }
      }

      // Fallback: no session possible → true guest mode (rare: offline first launch, Supabase down)
      setCloudMode("guest");
      setCloudStatus("idle");
      initializedRef.current = false;
      useBudgetStore.getState().setCloudSyncReady();
      logger.info("CloudSync", "Guest mode fallback - no session available");
      return;
    }

    logger.info("CloudSync", "Session found, user:", session.user.id, "anonymous:", session.user.is_anonymous);

    // ✅ Update user state atomically with cloudMode
    // Anonymous users: email/name/avatar will all be null (expected)
    // UI uses !!user.email to distinguish anonymous from authenticated
    const meta = session.user.user_metadata ?? {};
    const appMeta = session.user.app_metadata ?? {};

    // Get provider from app_metadata or identities
    const provider = (appMeta.provider as string) || session.user.identities?.[0]?.provider || null;

    console.log("[CloudSyncGate] Setting user data and cloud mode for:", session.user.email);
    setUser({
      email: session.user.email ?? null,
      name: (meta.full_name as string) || (meta.name as string) || null,
      avatarUrl: (meta.avatar_url as string) || (meta.picture as string) || null,
      provider: provider as 'google' | 'apple' | null,
    });

    setCloudMode("cloud");
    console.log("[CloudSyncGate] Cloud mode set, starting sync process");

    // Si inicia offline: marcamos offline y guardamos snapshot como pendiente
    const networkStatus = await getNetworkStatus();
    console.log("[CloudSyncGate] Network status check:", { isOnline: networkStatus });
    if (!networkStatus) {
      console.log("[CloudSyncGate] Offline detected, returning early");
      setCloudStatus("offline");
      setPendingSnapshot(getSnapshot());
      initializedRef.current = true;
      useBudgetStore.getState().setCloudSyncReady();
      return;
    }

    // ⚠️ Acquire sync lock to prevent race conditions from multiple tabs
    const lockAcquired = acquireSyncLock();
    console.log("[CloudSyncGate] Sync lock acquisition:", { lockAcquired });
    if (!lockAcquired) {
      logger.warn("CloudSync", "Could not acquire sync lock, another sync in progress");
      setCloudStatus("ok");
      initializedRef.current = true;
      useBudgetStore.getState().setCloudSyncReady();
      return;
    }

    try {
      setCloudStatus("syncing");

      // ✅ 1) Si hay cambios pendientes locales, PUSH primero y NO hacer PULL
      const pending = getPendingSnapshot();
      console.log("[CloudSyncGate] Checking for pending snapshot:", { hasPending: !!pending });
      if (pending) {
        // ⚠️ CRITICAL: Check if pending snapshot has actual data
        // Don't push if it's just an empty state (only schemaVersion, no transactions/categories)
        const hasActualData =
          (pending.transactions && pending.transactions.length > 0) ||
          (pending.categoryDefinitions && pending.categoryDefinitions.length > 0) ||
          (pending.trips && pending.trips.length > 0) ||
          (pending.budgets && pending.budgets.length > 0);

        if (!hasActualData) {
          logger.warn("CloudSync", "Pending snapshot is empty, clearing it and pulling from cloud instead");
          console.log("[CloudSyncGate] Pending snapshot is empty:", { pending });
          clearPendingSnapshot();
          // Continue to pull from cloud (don't return)
        } else {
          logger.info("CloudSync", "Found pending snapshot with data, pushing first:", {
            transactions: pending.transactions.length,
            trips: pending.trips.length,
          });
          await pushSnapshot(pending);
          initializedRef.current = true;
          return;
        }
      }

      // ✅ 2) No hay pendientes: flujo normal (pull)
      logger.info("CloudSync", "No pending changes, pulling from cloud...");
      console.log("[CloudSyncGate] About to call getCloudState()");
      const cloud = await getCloudState();
      console.log("[CloudSyncGate] getCloudState() returned:", { hasCloud: !!cloud, cloudData: cloud ? { transactions: cloud.transactions?.length, categories: cloud.categoryDefinitions?.length } : null });

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

        // Subscription is NO LONGER merged here (v2.0)
        // It's managed separately by RevenueCat SDK + subscription.service.ts
        console.log("[CloudSyncGate] Applying cloud data to local state:", {
          transactions: cloud.transactions.length,
          categories: cloud.categoryDefinitions.length,
        });
        replaceAllData(cloud);

        // Fetch subscription separately from RevenueCat/Supabase
        try {
          const { getSubscription } = await import('@/services/subscription.service');
          const subscription = await getSubscription(session.user.id);
          useBudgetStore.getState().setSubscription(subscription);
          console.log("[CloudSyncGate] Subscription loaded:", subscription?.status ?? 'free');
        } catch (subError) {
          console.error("[CloudSyncGate] Failed to load subscription:", subError);
        }

        // ✅ Mark that user just authenticated (prevent BiometricGate from prompting on login)
        updateLastAuthTimestamp();

        // ✅ Renew expired budgets after loading cloud data
        useBudgetStore.getState().renewExpiredBudgets();

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

          // ✅ Mark that user just authenticated (prevent BiometricGate from prompting on login)
          updateLastAuthTimestamp();
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

      // Initialize push notifications for authenticated users
      initializePushNotifications().then((enabled) => {
        logger.info("CloudSync", `Push notifications initialized: ${enabled ? "enabled" : "not enabled"}`);
      });
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

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        // ✅ Check if this SIGNED_OUT is part of an OAuth transition (anonymous → authenticated).
        // exchangeCodeForSession() emits SIGNED_OUT when replacing the anonymous session
        // with the authenticated one. We must NOT clear data in this case.
        const oauthTransition = localStorage.getItem('budget.oauthTransition');
        if (oauthTransition) {
          const elapsed = Date.now() - parseInt(oauthTransition, 10);
          if (elapsed < 120_000) { // 2 minutes max
            console.log("[CloudSyncGate] SIGNED_OUT during OAuth transition, skipping cleanup");
            return;
          }
          // Stale flag (>2min) — remove it and proceed with normal cleanup
          localStorage.removeItem('budget.oauthTransition');
        }

        // Deactivate push notification token before clearing data
        deactivateToken();
        cleanupPushNotifications();

        clearPendingSnapshot();
        clearState();

        // Clear subscription state on logout
        useBudgetStore.getState().clearSubscription();
        import('@/services/subscription.service').then(({ clearSubscriptionCache }) => {
          clearSubscriptionCache();
        });

        // Leave categories empty - user will recover them when logging back in
        replaceAllData({ schemaVersion: 6, transactions: [], categories: [], categoryDefinitions: [], categoryGroups: createDefaultCategoryGroups(), budgets: [], trips: [], tripExpenses: [] });

        // Reset welcome
        try {
          localStorage.removeItem(SEEN_KEY);
        } catch {}
        setWelcomeSeen(false);

        // Clear user state on logout
        setUser({
          email: null,
          name: null,
          avatarUrl: null,
          provider: null,
        });

        setCloudMode("guest"); // Temporary until anonymous session is created
        setCloudStatus("idle");
        initializedRef.current = false;

        // Re-create anonymous session → SIGNED_IN handler will init cloud sync
        try {
          const { error } = await supabase.auth.signInAnonymously();
          if (error) {
            console.warn("[CloudSyncGate] Failed to re-create anonymous session after logout:", error);
            useBudgetStore.getState().setCloudSyncReady();
          } else {
            console.log("[CloudSyncGate] Anonymous session re-created, SIGNED_IN will init cloud sync");
            // SIGNED_IN handler will call initForSession() and set cloudMode = "cloud"
          }
        } catch (err) {
          console.warn("[CloudSyncGate] signInAnonymously error after logout:", err);
          useBudgetStore.getState().setCloudSyncReady();
        }

        return;
      }

      if (event === "SIGNED_IN") {
        // Clear OAuth transition flag — the transition completed successfully
        localStorage.removeItem('budget.oauthTransition');

        // CRITICAL: Defer all work to next tick with setTimeout(fn, 0).
        // exchangeCodeForSession() emits SIGNED_IN while holding a navigator.locks lock.
        // If we call getSession() (used by initForSession, getCloudState, etc.) synchronously
        // inside this callback, it tries to acquire the SAME lock → deadlock.
        // setTimeout ensures our code runs AFTER the lock is released.

        if (session?.user?.is_anonymous) {
          // Anonymous SIGNED_IN: init cloud sync if not already initialized
          // Guard prevents loop: signInAnonymously → SIGNED_IN → initForSession → (finds session) → done
          if (initializedRef.current && useBudgetStore.getState().cloudMode === "cloud") {
            console.log("[CloudSyncGate] Anonymous SIGNED_IN but already in cloud mode, skipping");
            return;
          }
          console.log("[CloudSyncGate] Anonymous SIGNED_IN, initializing cloud sync");
          initializedRef.current = false;
          setTimeout(() => initForSession(), 0);
          return;
        }

        // Authenticated SIGNED_IN (real login or linkIdentity upgrade)
        console.log("[CloudSyncGate] Authenticated SIGNED_IN, re-initializing...");
        initializedRef.current = false;

        setTimeout(async () => {
          // Migrate RevenueCat to authenticated user (preserves subscription from anonymous session)
          try {
            const { isNative } = await import('@/shared/utils/platform');
            if (isNative() && session?.user) {
              const { Purchases } = await import('@revenuecat/purchases-capacitor');
              await Purchases.logIn({ appUserID: session.user.id });
              console.log("[CloudSyncGate] RevenueCat linked to user:", session.user.id);

              const { getSubscription } = await import('@/services/subscription.service');
              const subscription = await getSubscription(session.user.id);
              useBudgetStore.getState().setSubscription(subscription);
              console.log("[CloudSyncGate] Subscription refreshed post-login:", subscription?.status ?? 'free');
            }
          } catch (err) {
            console.warn("[CloudSyncGate] Failed to migrate RevenueCat (non-blocking):", err);
          }

          // Migrate any guest push token to the authenticated user
          migrateGuestTokenToUser().then((migrated) => {
            if (migrated) {
              console.log("[CloudSyncGate] Guest push token migrated to authenticated user");
            }
          });

          await initForSession();

          // Clean up orphaned anonymous user data (if this was an OAuth transition)
          const previousAnonUserId = localStorage.getItem('budget.previousAnonUserId');
          if (previousAnonUserId) {
            localStorage.removeItem('budget.previousAnonUserId');
            try {
              await supabase.rpc('cleanup_orphaned_anonymous_user', { anon_user_id: previousAnonUserId });
              console.log("[CloudSyncGate] Cleaned up orphaned anonymous user:", previousAnonUserId);
            } catch (err) {
              console.warn("[CloudSyncGate] Failed to cleanup orphaned anonymous user (non-blocking):", err);
            }
          }
        }, 0);
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
  }, [transactions, categories, categoryDefinitions, categoryGroups, budgets, trips, tripExpenses, welcomeSeen, budgetOnboardingSeen, excludedFromStats, security]);

  const mode = useBudgetStore.getState().cloudMode;

  return (
    <>
      <BackupScheduler />
      {mode === "cloud" && <CloudBackupScheduler />}
    </>
  );
}
