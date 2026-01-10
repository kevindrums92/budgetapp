import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import CloudStatusMini from "@/components/CloudStatusMini";
import { User } from "lucide-react";

type Props = {
  title: string;
  onOpenUserDrawer: () => void;
};

export default function TopHeader({ title, onOpenUserDrawer }: Props) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;
      const meta: Record<string, unknown> = user?.user_metadata ?? {};
      const url = (meta.avatar_url as string) || (meta.picture as string) || null;
      if (mounted) setAvatarUrl(url);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      const meta: Record<string, unknown> = user?.user_metadata ?? {};
      const url = (meta.avatar_url as string) || (meta.picture as string) || null;
      setAvatarUrl(url);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const Avatar = useMemo(() => {
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="h-9 w-9 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      );
    }
    return (
      <div className="grid h-9 w-9 place-items-center rounded-full border bg-gray-100 text-gray-500">
        <User size={20} strokeWidth={1.8} />
      </div>
    );
  }, [avatarUrl]);

  return (
    <header className="sticky top-0 z-20 border-b bg-white/100 backdrop-blur">
      <div className="mx-auto max-w-xl px-4 py-3">
        <div className="relative flex items-center justify-between">
          {/* Left: avatar + status (clickeable) */}
          <button
            type="button"
            onClick={onOpenUserDrawer}
            className="flex flex-col items-start rounded-full hover:bg-gray-50 active:scale-95"
            aria-label="Abrir perfil"
          >
            <div className="h-10 w-10 flex items-center justify-center">
              {Avatar}
            </div>
            <CloudStatusMini />
          </button>

          {/* Center: title */}
          <div className="pointer-events-none absolute left-0 right-0 flex justify-center">
            <div className="text-sm font-semibold text-gray-900">{title}</div>
          </div>

          {/* Right: empty space for balance */}
          <div className="h-10 w-10" />
        </div>
      </div>
    </header>
  );
}
