import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import CloudStatusMini from "@/components/CloudStatusMini";

type Props = {
  title: string;
  onOpenMenu: () => void;
};

export default function TopHeader({ title, onOpenMenu }: Props) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;

      // Google suele venir como user_metadata.avatar_url o picture
      const meta: any = user?.user_metadata ?? {};
      const url = meta.avatar_url || meta.picture || null;

      if (mounted) setAvatarUrl(url);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      const meta: any = user?.user_metadata ?? {};
      const url = meta.avatar_url || meta.picture || null;
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
      <div className="grid h-9 w-9 place-items-center rounded-full border bg-white text-xs font-semibold text-gray-700">
        {/* placeholder */}
        U
      </div>
    );
  }, [avatarUrl]);

  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-xl px-4 py-3">
        <div className="relative flex items-center justify-between">
          {/* Left: hamburger */}
          <button
            type="button"
            onClick={onOpenMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 active:scale-95"
            aria-label="Abrir menú"
          >
            {/* simple hamburger */}
            <span className="block h-5 w-5">
              <span className="block h-[2px] w-full bg-gray-900" />
              <span className="mt-[5px] block h-[2px] w-full bg-gray-900" />
              <span className="mt-[5px] block h-[2px] w-full bg-gray-900" />
            </span>
          </button>

          {/* Center: title */}
          <div className="pointer-events-none absolute left-0 right-0 flex justify-center">
            <div className="text-sm font-semibold text-gray-900">{title}</div>
          </div>

          {/* Right: avatar + status */}
          <div className="flex flex-col items-end">
            <div className="h-10 w-10">{Avatar}</div>
            <CloudStatusMini />
          </div>
        </div>
      </div>
    </header>
  );
}
