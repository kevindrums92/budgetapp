import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCloudState, upsertCloudState } from "@/services/cloudState.service";
import { useBudgetStore } from "@/state/budget.store";
import { clearState } from "@/services/storage.service";
import {
  setPendingSnapshot,
  getPendingSnapshot,
  clearPendingSnapshot,
  hasPendingSnapshot,
} from "@/services/pendingSync.service";

type Mode = "guest" | "cloud";
type Status = "idle" | "syncing" | "ok" | "error" | "offline";

function isNetworkError(err: unknown): boolean {
  const msg = String((err as any)?.message ?? err ?? "");
  // típicos del browser cuando no hay red/DNS
  return (
    msg.includes("Failed to fetch") ||
    msg.includes("ERR_NAME_NOT_RESOLVED") ||
    msg.includes("NetworkError") ||
    msg.includes("fetch")
  );
}

function StatusPill({ mode, status }: { mode: Mode; status: Status }) {
  const label =
    mode === "guest"
      ? "LOCAL"
      : status === "offline"
        ? "OFFLINE"
        : status === "syncing"
          ? "SYNC…"
          : status === "ok"
            ? "NUBE"
            : "ERROR";

  const dotClass =
    mode === "guest"
      ? "bg-gray-400"
      : status === "offline"
        ? "bg-gray-400"
        : status === "syncing"
          ? "bg-[#18B7B0]"
          : status === "ok"
            ? "bg-green-500"
            : "bg-red-500";

  return (
    <span className="inline-flex items-center gap-2 border px-2 py-1 text-[11px] font-semibold text-gray-700">
      <span className={`h-2 w-2 ${dotClass}`} />
      {label}
    </span>
  );
}

export default function CloudSyncGate() {
  const [mode, setMode] = useState<Mode>("guest");
  const [status, setStatus] = useState<Status>("idle");

  const replaceAllData = useBudgetStore((s) => s.replaceAllData);
  const getSnapshot = useBudgetStore((s) => s.getSnapshot);
  const transactions = useBudgetStore((s) => s.transactions);
  const categories = useBudgetStore((s) => s.categories);

  const initializedRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  async function pushSnapshot(stateToPush: ReturnType<typeof getSnapshot>) {
    try {
      setStatus("syncing");
      await upsertCloudState(stateToPush);
      clearPendingSnapshot();
      setStatus("ok");
      return true;
    } catch (err) {
      // ✅ si es error de red -> OFFLINE
      if (!navigator.onLine || isNetworkError(err)) {
        setStatus("offline");
      } else {
        setStatus("error");
      }
      return false;
    }
  }

  async function attemptPush() {
    const pending = getPendingSnapshot();
    const stateToPush = pending ?? getSnapshot();

    // Siempre guardamos pending antes de intentar, por seguridad
    setPendingSnapshot(stateToPush);

    // si offline, no intentamos
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }

    await pushSnapshot(stateToPush);
  }

  async function initForSession({ forcePull = false }: { forcePull?: boolean } = {}) {
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      clearState();
      clearPendingSnapshot();
      replaceAllData({ schemaVersion: 1, transactions: [], categories: [] });

      setMode("guest");
      setStatus("idle");
      initializedRef.current = false;
      return;
    }

    setMode("cloud");

    // ✅ Si hay cambios pendientes, NUNCA hacemos pull (evita revivir EPM)
    if (hasPendingSnapshot()) {
      initializedRef.current = true;
      setStatus(navigator.onLine ? "syncing" : "offline");
      if (navigator.onLine) await attemptPush();
      return;
    }

    // ✅ Si ya inicializó y no estamos forzando pull, no vuelvas a traer nube
    if (initializedRef.current && !forcePull) {
      setStatus(navigator.onLine ? "ok" : "offline");
      return;
    }

    // ✅ Offline: no pull, queda listo para push luego
    if (!navigator.onLine) {
      initializedRef.current = true;
      setStatus("offline");
      // marcamos snapshot pendiente para que al volver, suba el estado actual
      setPendingSnapshot(getSnapshot());
      return;
    }

    setStatus("syncing");

    try {
      const cloud = await getCloudState();

      if (cloud) {
        replaceAllData(cloud);
        setStatus("ok");
      } else {
        // cuenta nueva → sube local actual como inicial
        const local = getSnapshot();
        setPendingSnapshot(local);
        const ok = await pushSnapshot(local);
        if (!ok) return;
      }

      initializedRef.current = true;
    } catch (err) {
      initializedRef.current = true;
      if (!navigator.onLine || isNetworkError(err)) setStatus("offline");
      else setStatus("error");
      // mantenemos snapshot pendiente por seguridad
      setPendingSnapshot(getSnapshot());
    }
  }

  // auth listener
  useEffect(() => {
    initForSession({ forcePull: true });

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearState();
        clearPendingSnapshot();
        replaceAllData({ schemaVersion: 1, transactions: [], categories: [] });

        setMode("guest");
        setStatus("idle");
        initializedRef.current = false;

        localStorage.removeItem("budget.welcomeSeen.v1");
        useBudgetStore.getState().setWelcomeSeen(false); // 🔥 ESTA ES LA CLAVE

      } else if (event === "SIGNED_IN") {
        initializedRef.current = false;
        initForSession({ forcePull: true });
      }
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replaceAllData]);

  // online/offline listeners
  useEffect(() => {
    async function onOnline() {
      if (mode !== "cloud") return;

      // si hay pending, push
      if (hasPendingSnapshot()) {
        await attemptPush();
      } else {
        setStatus("ok");
      }
    }

    function onOffline() {
      if (mode === "cloud") setStatus("offline");
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [mode]);

  // push on changes (debounced) — cloud mode only
  useEffect(() => {
    if (mode !== "cloud" || !initializedRef.current) return;

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      // al primer cambio, marcamos pending snapshot
      setPendingSnapshot(getSnapshot());

      // si hay internet, intenta
      if (navigator.onLine) {
        attemptPush();
      } else {
        setStatus("offline");
      }
    }, 700);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, categories, mode]);

  return (
    <div className="mx-auto max-w-xl px-4 pb-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-500">
          {mode === "cloud"
            ? navigator.onLine
              ? hasPendingSnapshot()
                ? "Pendiente de sincronizar…"
                : "Guardando en la nube"
              : "Sin conexión — se sincronizará al volver"
            : "Modo local"}
        </p>

        <StatusPill mode={mode} status={mode === "guest" ? "idle" : status} />
      </div>
    </div>
  );
}
