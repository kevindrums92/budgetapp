import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthBar() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) setLoading(false);
  }

  async function signOut() {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-2">
      <div className="flex items-center justify-between border bg-white px-3 py-2">
        <p className="text-xs text-gray-600">
          {loading ? (
            "Cargando sesión…"
          ) : email ? (
            <>
              Conectado como <span className="font-medium">{email}</span>
            </>
          ) : (
            "No has iniciado sesión"
          )}
        </p>

        {email ? (
          <button
            type="button"
            onClick={signOut}
            className="border px-3 py-1 text-xs font-medium hover:bg-gray-50"
          >
            Salir
          </button>
        ) : (
          <button
            type="button"
            onClick={signInWithGoogle}
            className="border px-3 py-1 text-xs font-medium hover:bg-gray-50"
            disabled={loading}
          >
            Entrar con Google
          </button>
        )}
      </div>
    </div>
  );
}
