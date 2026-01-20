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
        console.warn("[CloudSync] ⚠️ Sync already in progress in another tab/window");
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
      console.warn("[CloudSync] ⚠️ Attempting to push empty snapshot. Blocking to prevent data loss.");
      console.warn("[CloudSync] Snapshot details:", {
        transactions: snapshot.transactions.length,
        trips: snapshot.trips.length,
        categoryDefinitions: snapshot.categoryDefinitions.length,
      });
      setCloudStatus("error");
      return;
    }

    try {
      setCloudStatus("syncing");
      console.log("[CloudSync] Pushing snapshot:", {
        transactions: snapshot.transactions.length,
        trips: snapshot.trips.length,
        schemaVersion: snapshot.schemaVersion,
      });
      await upsertCloudState(snapshot);
      clearPendingSnapshot();
      setCloudStatus("ok");
    } catch (err) {
      console.error("[CloudSync] Push failed:", err);
      setCloudStatus(isNetworkError(err) ? "offline" : "error");
      setPendingSnapshot(snapshot);
    }
  }

  async function initForSession() {
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      console.log("[CloudSync] No session found, switching to guest mode");
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
      return;
    }

    console.log("[CloudSync] Session found, user:", session.user.id);

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
      console.warn("[CloudSync] Could not acquire sync lock, another sync in progress");
      setCloudStatus("ok");
      initializedRef.current = true;
      return;
    }

    try {
      setCloudStatus("syncing");

      // ✅ 1) Si hay cambios pendientes locales, PUSH primero y NO hacer PULL
      const pending = getPendingSnapshot();
      if (pending) {
        console.log("[CloudSync] Found pending snapshot, pushing first:", {
          transactions: pending.transactions.length,
          trips: pending.trips.length,
        });
        await pushSnapshot(pending);
        initializedRef.current = true;
        return;
      }

      // ✅ 2) No hay pendientes: flujo normal (pull)
      console.log("[CloudSync] No pending changes, pulling from cloud...");
      const cloud = await getCloudState();

      if (cloud) {
        console.log("[CloudSync] Cloud data found:", {
          transactions: cloud.transactions.length,
          trips: cloud.trips?.length ?? 0,
          schemaVersion: cloud.schemaVersion,
        });

        let needsPush = false;

        // Check if cloud data has empty categoryDefinitions - inject defaults
        if (!Array.isArray(cloud.categoryDefinitions) || cloud.categoryDefinitions.length === 0) {
          console.log("[CloudSync] Cloud missing categoryDefinitions, injecting defaults");
          cloud.categoryDefinitions = createDefaultCategories();
          needsPush = true;
        }

        // Check if cloud data has empty categoryGroups - inject defaults (migration to v3)
        if (!Array.isArray(cloud.categoryGroups) || cloud.categoryGroups.length === 0) {
          console.log("[CloudSync] Cloud missing categoryGroups, injecting defaults (migration to v3)");
          cloud.categoryGroups = createDefaultCategoryGroups();
          cloud.schemaVersion = 3;
          needsPush = true;
        }

        replaceAllData(cloud);

        // Push the fixed data back to cloud if we added defaults
        if (needsPush) {
          console.log("[CloudSync] Pushing migrated data back to cloud");
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
          console.log("[CloudSync] New account detected, pushing local data to cloud:", {
            transactions: localSnapshot.transactions.length,
            trips: localSnapshot.trips.length,
            categoryDefinitions: localSnapshot.categoryDefinitions.length,
          });
          await upsertCloudState(localSnapshot);
        } else {
          // WARNING: Local is empty, do NOT overwrite cloud
          // This could be a SIGNED_OUT->SIGNED_IN race condition
          console.warn("[CloudSync] ⚠️ Cloud is null but local is also empty. NOT pushing to prevent data loss.");
          console.warn("[CloudSync] If this is truly a new account, defaults will be used.");
          // Keep the defaults that were hydrated from defaultState
        }
      }

      setCloudStatus("ok");
      initializedRef.current = true;
    } catch (err) {
      console.error("[CloudSync] Init failed:", err);
      setCloudStatus(isNetworkError(err) ? "offline" : "error");
      // dejamos pendiente el snapshot actual para reintentar
      setPendingSnapshot(getSnapshot());
      initializedRef.current = true;
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
