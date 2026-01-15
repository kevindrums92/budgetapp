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
import { createDefaultCategories } from "@/constants/default-categories";

const SEEN_KEY = "budget.welcomeSeen.v1";

function isNetworkError(err: unknown) {
  const msg = String((err as any)?.message ?? err ?? "");
  return (
    !navigator.onLine ||
    msg.includes("Failed to fetch") ||
    msg.includes("ERR_NAME_NOT_RESOLVED") ||
    msg.includes("NetworkError")
  );
}

export default function CloudSyncGate() {
  const getSnapshot = useBudgetStore((s) => s.getSnapshot);
  const replaceAllData = useBudgetStore((s) => s.replaceAllData);

  const setCloudMode = useBudgetStore((s) => s.setCloudMode);
  const setCloudStatus = useBudgetStore((s) => s.setCloudStatus);

  const setWelcomeSeen = useBudgetStore((s) => s.setWelcomeSeen);

  const transactions = useBudgetStore((s) => s.transactions);
  const categories = useBudgetStore((s) => s.categories);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
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

    try {
      setCloudStatus("syncing");
      await upsertCloudState(snapshot);
      clearPendingSnapshot();
      setCloudStatus("ok");
    } catch (err) {
      setCloudStatus(isNetworkError(err) ? "offline" : "error");
      setPendingSnapshot(snapshot);
    }
  }

  async function initForSession() {
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      // Regla tuya: deslogueado => no queda data local
      clearPendingSnapshot();
      clearState();
      replaceAllData({ schemaVersion: 2, transactions: [], categories: [], categoryDefinitions: createDefaultCategories(), trips: [], tripExpenses: [] });

      // Reset welcome para que vuelva a salir en guest
      try {
        localStorage.removeItem(SEEN_KEY);
      } catch {}
      setWelcomeSeen(false);

      setCloudMode("guest");
      setCloudStatus("idle");
      initializedRef.current = false;
      return;
    }

    setCloudMode("cloud");

    // Si inicia offline: marcamos offline y guardamos snapshot como pendiente
    if (!navigator.onLine) {
      setCloudStatus("offline");
      setPendingSnapshot(getSnapshot());
      initializedRef.current = true;
      return;
    }

    try {
      setCloudStatus("syncing");

      // ✅ 1) Si hay cambios pendientes locales, PUSH primero y NO hacer PULL
      const pending = getPendingSnapshot();
      if (pending) {
        await pushSnapshot(pending);
        initializedRef.current = true;
        return;
      }

      // ✅ 2) No hay pendientes: flujo normal (pull)
      const cloud = await getCloudState();

      if (cloud) {
        // Check if cloud data has empty categoryDefinitions - inject defaults and push back
        if (!Array.isArray(cloud.categoryDefinitions) || cloud.categoryDefinitions.length === 0) {
          cloud.categoryDefinitions = createDefaultCategories();
          replaceAllData(cloud);
          // Push the fixed data back to cloud
          await upsertCloudState(cloud);
        } else {
          replaceAllData(cloud);
        }
      } else {
        // cuenta nueva => subimos lo local actual como primer estado
        await upsertCloudState(getSnapshot());
      }

      setCloudStatus("ok");
      initializedRef.current = true;
    } catch (err) {
      setCloudStatus(isNetworkError(err) ? "offline" : "error");
      // dejamos pendiente el snapshot actual para reintentar
      setPendingSnapshot(getSnapshot());
      initializedRef.current = true;
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
        replaceAllData({ schemaVersion: 2, transactions: [], categories: [], categoryDefinitions: createDefaultCategories(), trips: [], tripExpenses: [] });

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
  }, [transactions, categories, categoryDefinitions, trips, tripExpenses]);

  return null;
}
