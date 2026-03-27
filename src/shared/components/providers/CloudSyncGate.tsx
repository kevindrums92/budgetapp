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
import { setSentryUser } from "@/lib/sentry";
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
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

/**
 * Retry an async operation with exponential backoff.
 * Only retries on network/server errors, not on auth or client errors.
 */
async function retryAsync<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isNetworkOrServerError(err)) throw err; // Don't retry client/auth errors
      const delay = RETRY_DELAYS[attempt] ?? 4000;
      logger.warn("CloudSync", `${label} failed (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms...`, err);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

function isNetworkOrServerError(err: unknown) {
  const msg = String((err as any)?.message ?? err ?? "").toLowerCase();
  const status = (err as any)?.status ?? (err as any)?.statusCode ?? 0;
  return (
    !navigator.onLine ||
    msg.includes("failed to fetch") ||
    msg.includes("load failed") ||       // Safari/WebKit equivalent of "failed to fetch"
    msg.includes("err_name_not_resolved") ||
    msg.includes("networkerror") ||
    msg.includes("internal server error") ||
    msg.includes("bad gateway") ||
    msg.includes("service unavailable") ||
    msg.includes("gateway timeout") ||
    msg.includes("timeout") ||
    msg.includes("econnrefused") ||
    msg.includes("econnreset") ||
    (typeof status === "number" && status >= 500 && status < 600)
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

/**
 * Migrate cloud data: inject defaults for missing fields, run schema migrations.
 * Returns the migrated data + whether it needs to be pushed back to cloud.
 */
function migrateCloudData(cloud: any): { data: any; needsPush: boolean } {
  let needsPush = false;

  // Inject default categoryDefinitions for legacy users with transactions but no categories
  if (!Array.isArray(cloud.categoryDefinitions) || cloud.categoryDefinitions.length === 0) {
    if (cloud.transactions && cloud.transactions.length > 0) {
      logger.info("CloudSync", "Cloud missing categoryDefinitions for legacy user, injecting defaults");
      cloud.categoryDefinitions = createDefaultCategories();
      needsPush = true;
    } else {
      cloud.categoryDefinitions = [];
    }
  }

  // Inject default categoryGroups (migration to v3)
  if (!Array.isArray(cloud.categoryGroups) || cloud.categoryGroups.length === 0) {
    logger.info("CloudSync", "Cloud missing categoryGroups, injecting defaults (migration to v3)");
    cloud.categoryGroups = createDefaultCategoryGroups();
    cloud.schemaVersion = 3;
    needsPush = true;
  }

  // Migrate v3/v4 → v5: scheduled transactions support
  if (cloud.schemaVersion === 4 || cloud.schemaVersion === 3) {
    const recurringCount = cloud.transactions.filter((tx: any) => tx.isRecurring).length;
    logger.info("CloudSync", `Migrating cloud data from v${cloud.schemaVersion} to v5 (${recurringCount} recurring)`);

    // Step 1: Convert isRecurring to schedule
    cloud.transactions = cloud.transactions.map((tx: any) => {
      if (tx.isRecurring) {
        const schedule = convertLegacyRecurringToSchedule(tx);
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
          if (existing) nonTemplates.push({ ...existing, schedule: undefined });
          templatesMap.set(key, tx);
        } else {
          nonTemplates.push({ ...tx, schedule: undefined });
        }
      } else {
        nonTemplates.push(tx);
      }
    }

    // Step 3: Add sourceTemplateId to link transactions to templates
    const finalTransactions: any[] = [...templatesMap.values()];
    for (const tx of nonTemplates) {
      if (tx.sourceTemplateId) {
        finalTransactions.push(tx);
        continue;
      }
      const key = `${tx.name}|${tx.category}`;
      let matchedTemplate: any = null;
      for (const template of templatesMap.values()) {
        if (`${template.name}|${template.category}` === key) {
          matchedTemplate = template;
          break;
        }
      }
      finalTransactions.push(matchedTemplate ? { ...tx, sourceTemplateId: matchedTemplate.id } : tx);
    }

    cloud.transactions = finalTransactions;
    cloud.schemaVersion = 5;
    needsPush = true;
    logger.info("CloudSync", `Migration v4→v5 complete: ${templatesMap.size} templates`);
  }

  // Always repair: ensure sourceTemplateId on matching transactions
  if (cloud.schemaVersion >= 5) {
    const templates = cloud.transactions.filter((tx: any) => tx.schedule?.enabled);
    if (templates.length > 0) {
      let repairCount = 0;
      cloud.transactions = cloud.transactions.map((tx: any) => {
        if (tx.schedule?.enabled || tx.sourceTemplateId) return tx;
        const matched = templates.find((t: any) => t.name === tx.name && t.category === tx.category);
        if (matched) {
          repairCount++;
          return { ...tx, sourceTemplateId: matched.id };
        }
        return tx;
      });
      if (repairCount > 0) {
        needsPush = true;
        logger.info("CloudSync", `Repaired ${repairCount} transactions with missing sourceTemplateId`);
      }
    }
  }

  return { data: cloud, needsPush };
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
  const statsLayout = useBudgetStore((s) => s.statsLayout);
  const security = useBudgetStore((s) => s.security);
  const carryOverBalances = useBudgetStore((s) => s.carryOverBalances);
  const monthReviewDismissed = useBudgetStore((s) => s.monthReviewDismissed);
  // NOTE: subscription is no longer synced to cloud (managed by RevenueCat webhooks)

  const initializedRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  async function pushSnapshot(snapshot: ReturnType<typeof getSnapshot>) {
    if (!(await getNetworkStatus())) {
      setCloudStatus("offline");
      setPendingSnapshot(snapshot);
      return;
    }

    // ⚠️ CRITICAL SAFEGUARD: Verify snapshot before pushing.
    // A valid state ALWAYS has categoryDefinitions (created during onboarding).
    // 0 transactions is valid (user deleted all), but 0 categories means corrupt state.
    const hasCoreData = snapshot.categoryDefinitions.length > 0;

    if (!hasCoreData) {
      logger.warn("CloudSync", "⚠️ Attempting to push snapshot with no categories. Blocking to prevent data loss.");
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
      await retryAsync("pushSnapshot", () => upsertCloudState(snapshot));
      clearPendingSnapshot();
      setCloudStatus("ok");
    } catch (err) {
      logger.error("CloudSync", "Push failed after retries:", err);
      setCloudStatus(isNetworkOrServerError(err) ? "offline" : "error");
      setPendingSnapshot(snapshot);
    }
  }

  async function initForSession() {
    // Guard: if already initialized, skip duplicate calls.
    // This prevents a race condition where Supabase's token refresh fires SIGNED_IN
    // during the initial getSession(), scheduling a second initForSession() that would
    // run concurrently with the first one.
    if (initializedRef.current) {
      console.log("[CloudSyncGate] initForSession() skipped — already initialized");
      // Restore cloudSyncReady in case it was reset by the SIGNED_IN handler
      // before this guard blocked the call (scheduler needs it to be true).
      useBudgetStore.getState().setCloudSyncReady();
      return;
    }

    const _localTxCount = useBudgetStore.getState().transactions.length;
    const _localMode = useBudgetStore.getState().cloudMode;
    console.log("[CloudSyncGate] initForSession() called", { localTransactions: _localTxCount, cloudMode: _localMode, initialized: initializedRef.current });

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
          setSentryUser(sessionUser.id, sessionUser.email);
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

    // OFFLINE-FIRST: Wrap getSession() in a timeout to prevent hanging when
    // Supabase's internal initializePromise is stuck refreshing an expired JWT.
    // If it takes >5s or returns a server error, fall back to reading the stored
    // session from localStorage.
    let session: any = null;
    let getSessionFailed = false;
    try {
      const result = await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("getSession timeout")), 5000)
        ),
      ]);
      session = result.data.session;
      // ⚠️ Supabase returns { session: null, error } when token refresh fails (500/network).
      // The session still exists in localStorage — detect this so we don't falsely show "expired".
      if (!session && result.error) {
        console.warn("[CloudSyncGate] getSession() returned error (server/network):", result.error.message);
        getSessionFailed = true;
      }
    } catch {
      console.warn("[CloudSyncGate] getSession() timed out or threw");
      getSessionFailed = true;
    }

    // If getSession() failed (timeout, 500, network error), read from localStorage.
    // Supabase preserves the session in localStorage on retryable errors, so we can
    // use it to keep the user in cloud mode without showing a false "session expired" modal.
    if (!session && getSessionFailed) {
      const storedKeys = Object.keys(localStorage).filter(
        (key) => key.includes("sb-") && key.includes("-auth-token")
      );
      for (const key of storedKeys) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || "");
          if (parsed?.currentSession) {
            session = parsed.currentSession;
            console.log("[CloudSyncGate] Recovered session from localStorage after getSession() failure");
            break;
          }
        } catch { /* skip */ }
      }
    }
    console.log("[CloudSyncGate] Session:", session ? `User ${session.user?.id || session.user_id}` : "null");

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
      // ✅ CRITICAL: Check if an authenticated user lost their session (cold start with expired token)
      // budget.wasAuthenticated is persisted in localStorage and survives app restarts,
      // unlike Zustand cloudMode/user which reset to defaults on cold start.
      const persistedWasAuthenticated = localStorage.getItem('budget.wasAuthenticated') === 'true';

      if (persistedWasAuthenticated) {
        // ⚠️ OFFLINE-FIRST: Re-check network. We entered the online path because
        // getNetworkStatus() returned true, but the token refresh failed (Supabase
        // removed the session). If we're actually offline/flaky, don't show the modal —
        // stay in cloud-offline mode and re-verify when truly online.
        const stillOnline = await getNetworkStatus();
        if (!stillOnline) {
          logger.info("CloudSync", "No session but offline — staying in cloud mode, will re-verify when online");
          setCloudMode("cloud");
          setCloudStatus("offline");
          initializedRef.current = true;
          useBudgetStore.getState().setCloudSyncReady();
          return;
        }

        logger.info("CloudSync", "Session expired for previously authenticated user — showing recovery modal");
        useBudgetStore.getState().setSessionExpired(true);
        setCloudMode("guest");
        setCloudStatus("idle");
        initializedRef.current = true;
        useBudgetStore.getState().setCloudSyncReady();
        return; // DON'T clear data, DON'T create anonymous session
      }

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
      setSentryUser(null);

      // Try to create anonymous session with retries → SIGNED_IN handler will activate cloud sync
      if (isOnline) {
        try {
          console.log("[CloudSyncGate] 🔍 About to signInAnonymously, local transactions:", useBudgetStore.getState().transactions.length);
          const { error: anonError } = await retryAsync("signInAnonymously", async () => {
            const result = await supabase.auth.signInAnonymously();
            if (result.error) throw result.error;
            return result;
          });
          if (!anonError) {
            console.log("[CloudSyncGate] 🔍 Anonymous session created, local transactions BEFORE SIGNED_IN handler:", useBudgetStore.getState().transactions.length);
            return; // SIGNED_IN handler will call initForSession()
          }
        } catch (err) {
          logger.error("CloudSync", "signInAnonymously failed after retries", err instanceof Error ? err : new Error(String(err)));
        }
      }

      // Fallback: no session possible → true guest mode (rare: offline first launch, Supabase down)
      console.log("[CloudSyncGate] 🔍 GUEST MODE FALLBACK. Local transactions:", useBudgetStore.getState().transactions.length);
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
    setSentryUser(session.user.id, session.user.email);

    // ✅ Persist auth flag so we can detect session loss on cold start
    if (session.user.email && !session.user.is_anonymous) {
      localStorage.setItem('budget.wasAuthenticated', 'true');
      localStorage.setItem('budget.lastAuthEmail', session.user.email);
      if (provider) localStorage.setItem('budget.lastAuthProvider', provider);
    }

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
        // ⚠️ CRITICAL: Check if pending snapshot has core data (categories).
        // A valid state always has categoryDefinitions (created during onboarding).
        // 0 transactions is valid (user deleted all), but 0 categories = corrupt state.
        const hasActualData =
          (pending.categoryDefinitions && pending.categoryDefinitions.length > 0);

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

      // ✅ 2) PUSH-ONLY SYNC: Local is ALWAYS the source of truth.
      //    Cloud is a backup — we push local → cloud on every change.
      //    We only pull from cloud when local is empty (new device / fresh install).
      const localSnapshot = getSnapshot();
      const localHasData = localSnapshot.categoryDefinitions.length > 0;

      if (localHasData) {
        // ═══════════════════════════════════════════════════════════════════
        // LOCAL HAS DATA → Push to cloud (no pull needed)
        // ═══════════════════════════════════════════════════════════════════

        // Special case: OAuth transition into an EXISTING account.
        // When an anonymous user logs into an account that already has cloud data,
        // the cloud data represents the user's real account — restore it.
        const isOAuthTransition = !!localStorage.getItem('budget.previousAnonUserId');

        if (isOAuthTransition) {
          logger.info("CloudSync", "OAuth transition detected, checking if target account has cloud data...");
          const cloud = await retryAsync("getCloudState", () => getCloudState());

          if (cloud && cloud.categoryDefinitions && cloud.categoryDefinitions.length > 0) {
            // Existing account with real data → restore from cloud (user's real account)
            logger.info("CloudSync", "OAuth into existing account with data, restoring cloud state:", {
              transactions: cloud.transactions.length,
              categories: cloud.categoryDefinitions.length,
            });

            // Run migrations on cloud data before restoring
            const migrated = migrateCloudData(cloud);
            replaceAllData(migrated.data);

            if (migrated.needsPush) {
              await retryAsync("pushMigration", () => upsertCloudState(migrated.data));
            }
          } else {
            // New account (no cloud data) → push local anonymous data to cloud
            logger.info("CloudSync", "OAuth into new account, pushing local data to cloud:", {
              transactions: localSnapshot.transactions.length,
              categories: localSnapshot.categoryDefinitions.length,
            });
            await retryAsync("pushLocalToCloud", () => upsertCloudState(localSnapshot));
          }
        } else {
          // Normal app start / token refresh → just push local to cloud
          logger.info("CloudSync", "Local has data, pushing to cloud (push-only mode):", {
            transactions: localSnapshot.transactions.length,
            categories: localSnapshot.categoryDefinitions.length,
          });
          await retryAsync("pushLocalToCloud", () => upsertCloudState(localSnapshot));
        }

        // Fetch subscription separately from RevenueCat/Supabase
        try {
          const { getSubscription } = await import('@/services/subscription.service');
          const subscription = await getSubscription(session.user.id);
          useBudgetStore.getState().setSubscription(subscription);
          console.log("[CloudSyncGate] Subscription loaded:", subscription?.status ?? 'free');
        } catch (subError) {
          console.error("[CloudSyncGate] Failed to load subscription:", subError);
        }

        updateLastAuthTimestamp();
        useBudgetStore.getState().renewExpiredBudgets();
      } else {
        // ═══════════════════════════════════════════════════════════════════
        // LOCAL IS EMPTY → One-time restore from cloud (new device / fresh install)
        // ═══════════════════════════════════════════════════════════════════
        logger.info("CloudSync", "Local is empty, pulling from cloud for one-time restore...");
        const cloud = await retryAsync("getCloudState", () => getCloudState());

        if (cloud) {
          logger.info("CloudSync", "Cloud data found, restoring:", {
            transactions: cloud.transactions.length,
            trips: cloud.trips?.length ?? 0,
            schemaVersion: cloud.schemaVersion,
          });

          // Mark onboarding as complete if cloud has real data
          const hasCloudData = (cloud.categoryDefinitions && cloud.categoryDefinitions.length > 0) ||
                               (cloud.transactions && cloud.transactions.length > 0) ||
                               (cloud.trips && cloud.trips.length > 0);

          if (hasCloudData) {
            const onboardingCompleted = localStorage.getItem('budget.onboarding.completed.v2') === 'true';
            if (!onboardingCompleted) {
              logger.info("CloudSync", "Cloud has data, marking onboarding as complete");
              localStorage.setItem('budget.onboarding.completed.v2', 'true');
              localStorage.setItem('budget.onboarding.timestamp.v2', Date.now().toString());
            }
          }

          // Run migrations and restore
          const migrated = migrateCloudData(cloud);
          replaceAllData(migrated.data);

          // Fetch subscription
          try {
            const { getSubscription } = await import('@/services/subscription.service');
            const subscription = await getSubscription(session.user.id);
            useBudgetStore.getState().setSubscription(subscription);
            console.log("[CloudSyncGate] Subscription loaded:", subscription?.status ?? 'free');
          } catch (subError) {
            console.error("[CloudSyncGate] Failed to load subscription:", subError);
          }

          updateLastAuthTimestamp();
          useBudgetStore.getState().renewExpiredBudgets();

          // Push migrated data back to cloud if migrations were applied
          if (migrated.needsPush) {
            logger.info("CloudSync", "Pushing migrated data back to cloud");
            await retryAsync("pushMigration", () => upsertCloudState(migrated.data));
          }
        } else {
          // Cloud is also empty → truly fresh user, nothing to restore
          logger.info("CloudSync", "Both local and cloud are empty. Fresh start.");
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
      setCloudStatus(isNetworkOrServerError(err) ? "offline" : "error");
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

      // ✅ OFFLINE-FIRST: If we deferred session verification while offline
      // (wasAuthenticated exists but sessionExpired is false), verify now.
      const wasAuthenticated = localStorage.getItem('budget.wasAuthenticated');
      const { sessionExpired } = useBudgetStore.getState();
      if (wasAuthenticated && !sessionExpired) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (!data.session && error) {
            // Server/network error — Supabase is down, don't show modal, will retry later
            logger.warn("CloudSync", "getSession failed on reconnect (server error), will retry later", error);
            return;
          }
          if (!data.session) {
            // No error, genuinely no session — session truly expired, show modal
            console.log("[CloudSyncGate] Network back: session confirmed expired, showing recovery modal");
            useBudgetStore.getState().setSessionExpired(true);
            setCloudMode("guest");
            setCloudStatus("idle");
            return;
          }
          // Session recovered successfully
          console.log("[CloudSyncGate] Network back: session recovered, resuming cloud sync");
          setCloudMode("cloud");
          setCloudStatus("ok");
        } catch (err) {
          logger.warn("CloudSync", "Failed to verify session on reconnect, will retry later", err);
        }
      }

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

  // Silent retry: periodically push pending snapshot when status is "error"
  // (Supabase is down but internet is available — onOnline listener won't fire)
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const { cloudMode, cloudStatus } = useBudgetStore.getState();
      if (cloudMode !== "cloud" || !initializedRef.current) return;
      if (cloudStatus !== "error") return;

      const pending = getPendingSnapshot();
      if (!pending) return;

      logger.info("CloudSync", "Retry: attempting to push pending snapshot...");
      await pushSnapshot(pending);
    }, 30_000);

    return () => clearInterval(intervalId);
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

        // ✅ Check if this is a session expiration (not explicit logout)
        // budget.wasAuthenticated is removed by ProfilePage BEFORE calling signOut(),
        // so if it still exists here, the session expired on its own.
        const persistedAuth = localStorage.getItem('budget.wasAuthenticated');
        if (persistedAuth) {
          // ⚠️ OFFLINE-FIRST: If offline, Supabase may fire SIGNED_OUT because it couldn't
          // refresh the expired JWT (network error). Don't show the modal — stay in cloud-offline
          // mode and defer session verification until the network comes back.
          const isCurrentlyOnline = await getNetworkStatus();
          if (!isCurrentlyOnline) {
            console.log("[CloudSyncGate] SIGNED_OUT while offline — deferring session check, staying in cloud mode");
            setCloudMode("cloud");
            setCloudStatus("offline");
            return; // DON'T show modal, DON'T clear data
          }

          console.log("[CloudSyncGate] SIGNED_OUT with wasAuthenticated flag — session expired, showing recovery modal");
          useBudgetStore.getState().setSessionExpired(true);
          setCloudMode("guest");
          setCloudStatus("idle");
          return; // DON'T clear data, DON'T create anonymous session
        }

        // ⚠️ OFFLINE-FIRST: Protect anonymous cloud users from data loss.
        // Anonymous users don't have `wasAuthenticated` flag, so they reach this cleanup path
        // even on network-induced SIGNED_OUT (failed token refresh). If we're in cloud mode
        // with local data, preserve everything and silently re-create the anonymous session.
        const storeState = useBudgetStore.getState();
        const currentCloudMode = storeState.cloudMode;
        const hasData = storeState.transactions.length > 0;
        const isAnonymousUser = !storeState.user.email;

        if (currentCloudMode === "cloud" && hasData && isAnonymousUser) {
          const isCurrentlyOnline = await getNetworkStatus();
          if (!isCurrentlyOnline) {
            console.log("[CloudSyncGate] SIGNED_OUT for anonymous user while offline — preserving data, staying in cloud mode");
            setCloudMode("cloud");
            setCloudStatus("offline");
            return;
          }

          // Online: re-create anonymous session without wiping data
          console.log("[CloudSyncGate] SIGNED_OUT for anonymous user while online — preserving data, re-creating session");
          setCloudMode("guest");
          setCloudStatus("idle");
          try {
            await retryAsync("signInAnonymously (anon-recovery)", async () => {
              const result = await supabase.auth.signInAnonymously();
              if (result.error) throw result.error;
              return result;
            });
            // SIGNED_IN handler will re-init cloud sync and push local data
          } catch (err) {
            logger.warn("CloudSync", "Failed to re-create anonymous session, data preserved locally", err);
            useBudgetStore.getState().setCloudSyncReady();
          }
          return;
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
        setSentryUser(null);

        setCloudMode("guest"); // Temporary until anonymous session is created
        setCloudStatus("idle");
        initializedRef.current = false;

        // Re-create anonymous session with retries → SIGNED_IN handler will init cloud sync
        try {
          await retryAsync("signInAnonymously (post-logout)", async () => {
            const result = await supabase.auth.signInAnonymously();
            if (result.error) throw result.error;
            return result;
          });
          console.log("[CloudSyncGate] Anonymous session re-created, SIGNED_IN will init cloud sync");
        } catch (err) {
          logger.error("CloudSync", "signInAnonymously failed after retries (post-logout)", err instanceof Error ? err : new Error(String(err)));
          useBudgetStore.getState().setCloudSyncReady();
        }

        return;
      }

      if (event === "SIGNED_IN") {
        // Clear OAuth transition flag — the transition completed successfully
        localStorage.removeItem('budget.oauthTransition');
        // Clear logout flag so OnboardingGate won't redirect back to login
        localStorage.removeItem('budget.onboarding.logout.v2');

        // CRITICAL: Defer all work to next tick with setTimeout(fn, 0).
        // exchangeCodeForSession() emits SIGNED_IN while holding a navigator.locks lock.
        // If we call getSession() (used by initForSession, getCloudState, etc.) synchronously
        // inside this callback, it tries to acquire the SAME lock → deadlock.
        // setTimeout ensures our code runs AFTER the lock is released.

        if (session?.user?.is_anonymous) {
          // Anonymous SIGNED_IN: init cloud sync if not already initialized
          // Guard prevents loop: signInAnonymously → SIGNED_IN → initForSession → (finds session) → done
          const _txCount = useBudgetStore.getState().transactions.length;
          if (initializedRef.current && useBudgetStore.getState().cloudMode === "cloud") {
            console.log("[CloudSyncGate] 🔍 Anonymous SIGNED_IN but already in cloud mode, skipping. Local transactions:", _txCount);
            return;
          }
          console.log("[CloudSyncGate] 🔍 Anonymous SIGNED_IN, will call initForSession. Local transactions:", _txCount);
          initializedRef.current = false;
          setTimeout(() => initForSession(), 0);
          return;
        }

        // Authenticated SIGNED_IN (real login, linkIdentity upgrade, OR token refresh)

        // ✅ TOKEN REFRESH: If already initialized AND not an OAuth transition,
        // this is just a token refresh. Local is source of truth — skip re-init.
        const isOAuthUpgrade = !!localStorage.getItem('budget.previousAnonUserId');
        if (initializedRef.current && !isOAuthUpgrade) {
          console.log("[CloudSyncGate] Token refresh detected, skipping re-init (local is source of truth)");

          // Update user metadata in case it changed
          if (session?.user) {
            const meta = session.user.user_metadata ?? {};
            const appMeta = session.user.app_metadata ?? {};
            const provider = (appMeta.provider as string) || session.user.identities?.[0]?.provider || null;

            setUser({
              email: session.user.email ?? null,
              name: (meta.full_name as string) || (meta.name as string) || null,
              avatarUrl: (meta.avatar_url as string) || (meta.picture as string) || null,
              provider: provider as 'google' | 'apple' | null,
            });

            // Re-persist auth flags
            if (session.user.email && !session.user.is_anonymous) {
              localStorage.setItem('budget.wasAuthenticated', 'true');
              localStorage.setItem('budget.lastAuthEmail', session.user.email);
              if (provider) localStorage.setItem('budget.lastAuthProvider', provider);
            }
          }

          // Clear session expired state if it was set
          useBudgetStore.getState().setSessionExpired(false);
          // Ensure cloudSyncReady is true
          useBudgetStore.getState().setCloudSyncReady();
          return;
        }

        // ✅ FIRST AUTHENTICATED SIGNED_IN → full init (login, OAuth upgrade)
        console.log("[CloudSyncGate] First authenticated SIGNED_IN, running full init...");

        useBudgetStore.getState().resetCloudSyncReady();

        // Cancel any pending debounced push — we're about to init
        if (debounceRef.current) {
          window.clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }

        // ✅ Clear session expired state — user successfully authenticated
        useBudgetStore.getState().setSessionExpired(false);
        localStorage.removeItem('budget.wasAuthenticated');
        localStorage.removeItem('budget.lastAuthEmail');
        localStorage.removeItem('budget.lastAuthProvider');

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

          // Revoke all other sessions — only this device should be active
          try {
            await supabase.auth.signOut({ scope: 'others' });
            console.log("[CloudSyncGate] Revoked all other sessions (single-device policy)");
          } catch (err) {
            console.warn("[CloudSyncGate] Failed to revoke other sessions (non-blocking):", err);
          }

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
  }, [transactions, categories, categoryDefinitions, categoryGroups, budgets, trips, tripExpenses, welcomeSeen, budgetOnboardingSeen, excludedFromStats, statsLayout, security, carryOverBalances, monthReviewDismissed]);

  const mode = useBudgetStore.getState().cloudMode;

  return (
    <>
      <BackupScheduler />
      {mode === "cloud" && <CloudBackupScheduler />}
    </>
  );
}
