import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useBudgetStore } from "@/state/budget.store";
import { X, User, FolderOpen, ChevronRight, Shield } from "lucide-react";

export default function ProfilePage() {
  const navigate = useNavigate();

  // ✅ Read from Zustand store (single source of truth)
  const user = useBudgetStore((s) => s.user);

  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Online/offline listeners
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Auth actions
  async function signInWithGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (error) setLoading(false);
  }

  async function signOut() {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    navigate("/");
  }

  const isLoggedIn = !!user.email;

  // Generate initials for avatar fallback
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : null;

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header with close button */}
      <header className="sticky top-0 z-10 bg-gray-50">
        <div className="flex items-center justify-end px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Cerrar"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>
      </header>

      {/* Profile Header */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-100"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 ring-2 ring-gray-100">
              {initials ? (
                <span className="text-xl font-semibold text-emerald-700">
                  {initials}
                </span>
              ) : (
                <User size={28} className="text-emerald-700" />
              )}
            </div>
          )}

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 truncate">
              {isLoggedIn ? user.name || "Usuario" : "Invitado"}
            </h1>
            {isLoggedIn ? (
              <p className="text-sm text-emerald-600 truncate">{user.email}</p>
            ) : (
              <p className="text-sm text-gray-500">No has iniciado sesión</p>
            )}
          </div>
        </div>

        {/* Login button for guests */}
        {!isLoggedIn && (
          <div className="mt-6">
            {!isOnline ? (
              <p className="text-sm text-gray-500 text-center">Sin conexión</p>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={loading}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                {loading ? "Cargando..." : "Continuar con Google"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Menu Sections */}
      <div className="px-4">
        {/* Main Menu */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <MenuItem
            icon={<FolderOpen size={20} />}
            label="Categorías"
            onClick={() => navigate("/categories")}
          />
          <MenuItem
            icon={<Shield size={20} />}
            label="Backup & Restore"
            onClick={() => navigate("/backup")}
          />
        </div>
      </div>

      {/* Footer with logout and version */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
        {/* Logout button - only for logged in users */}
        {isLoggedIn && isOnline && (
          <button
            type="button"
            onClick={signOut}
            disabled={loading}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            <LogoutIcon />
            <span>{loading ? "Cerrando sesión..." : "Cerrar sesión"}</span>
          </button>
        )}
        <p className="text-xs text-gray-400 text-center">
          v{__APP_VERSION__} ({__GIT_HASH__})
        </p>
      </div>
    </div>
  );
}

type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  showBadge?: boolean;
};

function MenuItem({ icon, label, sublabel, onClick, showBadge }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {sublabel && (
          <p className="text-xs text-gray-500 truncate">{sublabel}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showBadge && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            !
          </span>
        )}
        <ChevronRight size={18} className="text-gray-400" />
      </div>
    </button>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-red-500"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
