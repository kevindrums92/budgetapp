import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCloudState, upsertCloudState } from "@/services/cloudState.service";
import { useBudgetStore } from "@/state/budget.store";
import { clearState } from "@/services/storage.service";

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

  const transactions = useBudgetStore((s) => s.transactions);
  const categories = useBudgetStore((s) => s.categories);

  const initializedRef = useRef(false);
  const pendingRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  async function initForSession() {
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      // si estás deslogueado, por tu regla: limpiar cache local
      clearState();
      replaceAllData({ schemaVersion: 1, transactions: [], categories: [] });

      setCloudMode("guest");
      setCloudStatus("idle");
      initializedRef.current = false;
      pendingRef.current = false;
      return;
    }

    setCloudMode("cloud");

    if (!navigator.onLine) {
      setCloudStatus("offline");
      initializedRef.current = true; // estás en modo cloud pero sin red
      pendingRef.current = true;
      return;
    }

    try {
      setCloudStatus("syncing");

      const cloud = await getCloudState();

      if (cloud) {
        replaceAllData(cloud);
      } else {
        // cuenta nueva: subimos snapshot local actual
        const local = getSnapshot();
        await upsertCloudState(local);
      }

      setCloudStatus("ok");
      initializedRef.current = true;
      pendingRef.current = false;
    } catch (err) {
      setCloudStatus(isNetworkError(err) ? "offline" : "error");
      initializedRef.current = true;
      pendingRef.current = true;
    }
  }

  async function pushNow() {
    if (!navigator.onLine) {
      setCloudStatus("offline");
      pendingRef.current = true;
      return;
    }

    try {
      setCloudStatus("syncing");
      await upsertCloudState(getSnapshot());
      setCloudStatus("ok");
      pendingRef.current = false;
    } catch (err) {
      setCloudStatus(isNetworkError(err) ? "offline" : "error");
      pendingRef.current = true;
    }
  }

  // online/offline listeners
  useEffect(() => {
    function onOnline() {
      if (!initializedRef.current) return;
      if (pendingRef.current) pushNow();
    }
    function onOffline() {
      setCloudStatus("offline");
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
        clearState();
        replaceAllData({ schemaVersion: 1, transactions: [], categories: [] });

        setCloudMode("guest");
        setCloudStatus("idle");
        initializedRef.current = false;
        pendingRef.current = false;
        return;
      }

      if (event === "SIGNED_IN") {
        initializedRef.current = false;
        pendingRef.current = false;
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

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      pushNow();
    }, 1200);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, categories]);

  return null;
}
