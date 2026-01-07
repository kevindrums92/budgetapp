import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCloudState, upsertCloudState } from "@/services/cloudState.service";
import { useBudgetStore } from "@/state/budget.store";
import { clearState } from "@/services/storage.service";

type Mode = "guest" | "cloud";
type Status = "idle" | "syncing" | "ok" | "error";

function StatusPill({ mode, status }: { mode: Mode; status: Status }) {
  const label =
    mode === "guest"
      ? "LOCAL"
      : status === "syncing"
      ? "SYNC…"
      : status === "ok"
      ? "NUBE"
      : "ERROR";

  const dotClass =
    mode === "guest"
      ? "bg-gray-400"
      : status === "syncing"
      ? "bg-[#18B7B0]"
      : status === "ok"
      ? "bg-green-500"
      : "bg-red-500";

  const borderClass =
    mode === "guest"
      ? "border-gray-200 text-gray-600"
      : status === "error"
      ? "border-red-200 text-red-700"
      : "border-gray-200 text-gray-700";

  return (
    <span className={`inline-flex items-center gap-2 border px-2 py-1 text-[11px] font-semibold ${borderClass}`}>
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

  const debounceRef = useRef<number | null>(null);
  const initializedRef = useRef(false);

  async function initForSession() {
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      // LOGOUT → limpiar todo y dejar app vacía
      clearState();
      replaceAllData({ schemaVersion: 1, transactions: [], categories: [] });

      setMode("guest");
      setStatus("idle");
      initializedRef.current = false;
      return;
    }

    setStatus("syncing");

    try {
      const cloud = await getCloudState();

      if (cloud) {
        // Existe data en esa cuenta → carga nube
        replaceAllData(cloud);
      } else {
        // Cuenta nueva → sube local actual como inicial
        const local = getSnapshot();
        await upsertCloudState(local);
      }

      setMode("cloud");
      setStatus("ok");
      initializedRef.current = true;
    } catch {
      setMode("cloud");
      setStatus("error");
    }
  }

  // 1) Init + auth listener
  useEffect(() => {
    initForSession();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearState();
        replaceAllData({ schemaVersion: 1, transactions: [], categories: [] });

        setMode("guest");
        setStatus("idle");
        initializedRef.current = false;
      } else if (event === "SIGNED_IN") {
        initForSession();
      }
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replaceAllData]);

  // 2) Push changes when in cloud mode (debounced)
  useEffect(() => {
    async function pushIfNeeded() {
      if (mode !== "cloud") return;
      if (!initializedRef.current) return;

      if (debounceRef.current) window.clearTimeout(debounceRef.current);

      debounceRef.current = window.setTimeout(async () => {
        try {
          setStatus("syncing");
          const snapshot = getSnapshot();
          await upsertCloudState(snapshot);
          setStatus("ok");
        } catch {
          setStatus("error");
        }
      }, 1200);
    }

    pushIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, categories, mode]);

  return (
    <div className="mx-auto max-w-xl px-4 pb-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-500">
          {mode === "cloud"
            ? "Guardando en la nube"
            : "Modo local (necesitas iniciar sesión para ver tus datos)"}
        </p>

        <StatusPill mode={mode} status={mode === "guest" ? "idle" : status} />
      </div>
    </div>
  );
}
