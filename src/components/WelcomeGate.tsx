import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useBudgetStore } from "@/state/budget.store";

const SEEN_KEY = "budget.welcomeSeen.v1";

export default function WelcomeGate() {
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);

    const setWelcomeSeen = useBudgetStore((s) => s.setWelcomeSeen);
    const welcomeSeen = useBudgetStore((s) => s.welcomeSeen);

    function markSeen() {
        try {
            localStorage.setItem(SEEN_KEY, "1");
        } catch { }
        setWelcomeSeen(true);
        setShow(false);
    }

    useEffect(() => {
        let mounted = true;

        async function boot() {
            // Si ya lo marcaron antes, no mostramos
            if (welcomeSeen) return;

            const seen = localStorage.getItem(SEEN_KEY) === "1";

            // ✅ Si ya hay sesión (token guardado), cerramos automáticamente
            const { data } = await supabase.auth.getSession();
            const hasSession = !!data.session;

            if (!mounted) return;

            if (hasSession) {
                markSeen();
                return;
            }

            // Si no hay sesión, mostramos solo si no se ha visto
            if (!seen) setShow(true);
        }

        boot();

        // ✅ Si el usuario se loguea, cerramos landing
        const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session) {
                setLoading(false);
                markSeen();
            }
        });

        return () => {
            mounted = false;
            sub.subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [welcomeSeen]);

    async function signInWithGoogle() {
        if (!navigator.onLine) return;
        setLoading(true);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.origin },
        });

        if (error) setLoading(false);
    }

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 bg-[#0b1c1b]">
            <div className="mx-auto flex min-h-screen max-w-xl flex-col px-6">
                <div className="flex-1" />

                <div className="text-center">
                    <p className="text-sm text-white/80">
                        Inicia sesión con Google para guardar tu información y sincronizarla
                        entre dispositivos.
                    </p>

                    <button
                        type="button"
                        onClick={signInWithGoogle}
                        disabled={loading || !navigator.onLine}
                        className="mt-6 w-full border border-white/10 bg-[#18B7B0] px-4 py-3 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-60"
                    >
                        {loading ? "Conectando…" : "Continuar con Google"}
                    </button>

                    <button
                        type="button"
                        onClick={markSeen}
                        className="mt-6 text-sm font-medium text-[#18B7B0] hover:underline"
                    >
                        Continuar sin crear una cuenta
                    </button>

                    {!navigator.onLine && (
                        <p className="mt-3 text-xs text-white/60">
                            Estás sin conexión. Puedes continuar sin cuenta y luego iniciar sesión.
                        </p>
                    )}
                </div>

                <div className="flex-1" />

                <div className="pb-8 text-center">
                    <p className="text-[11px] text-white/40">
                        Tu información local se guarda en este dispositivo.
                    </p>
                </div>
            </div>
        </div>
    );
}
