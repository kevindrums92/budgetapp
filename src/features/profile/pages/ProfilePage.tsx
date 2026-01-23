import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { supabase } from "@/lib/supabaseClient";
import { useBudgetStore } from "@/state/budget.store";
import { useLanguage } from "@/hooks/useLanguage";
import { User, FolderOpen, ChevronRight, Shield, Repeat, RefreshCw, Languages } from "lucide-react";
import LanguageSelector from "@/components/LanguageSelector";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation('profile');
  const { currentLanguageData } = useLanguage();

  // ✅ Read from Zustand store (single source of truth)
  const user = useBudgetStore((s) => s.user);
  const cloudMode = useBudgetStore((s) => s.cloudMode);
  const cloudStatus = useBudgetStore((s) => s.cloudStatus);

  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

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

    // Marcar logout para que OnboardingGate redirija a login
    const { markLogout } = await import('@/features/onboarding/utils/onboarding.helpers');
    markLogout();

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

  // Sync status badge
  const syncBadge = useMemo(() => {
    if (cloudMode === "guest") {
      return { text: t('account.syncStatus.local').toUpperCase(), color: "bg-gray-100 text-gray-600", icon: false };
    }
    if (!navigator.onLine || cloudStatus === "offline") {
      return { text: t('account.syncStatus.offline').toUpperCase(), color: "bg-gray-100 text-gray-600", icon: false };
    }
    if (cloudStatus === "syncing") {
      return { text: t('account.syncStatus.syncing').toUpperCase(), color: "bg-teal-50 text-[#18B7B0]", icon: true };
    }
    return { text: t('account.syncStatus.synced').toUpperCase(), color: "bg-teal-50 text-[#18B7B0]", icon: false };
  }, [cloudMode, cloudStatus, t]);

  return (
    <div className="min-h-dvh bg-gray-50 pb-28">
      {/* User Account Card - Only for logged in users */}
      {isLoggedIn && (
        <div className="px-4 pt-6 pb-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden hover:border-teal-200 transition">
            {/* Decorative element */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-[4rem] -mr-4 -mt-4 transition-transform hover:scale-110" />

            <div className="flex items-center gap-4 relative z-10">
              {/* Avatar with status dot */}
              <div className="relative">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm text-gray-400">
                    {initials ? (
                      <span className="text-2xl font-semibold text-gray-600">
                        {initials}
                      </span>
                    ) : (
                      <User size={32} />
                    )}
                  </div>
                )}
                {/* Status dot - green when synced */}
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg text-gray-900 leading-tight truncate">
                  {user.name || "Usuario"}
                </h2>
                <p className="text-sm text-gray-500 mb-2 truncate">{user.email}</p>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${syncBadge.color} text-xs font-bold uppercase tracking-wider`}>
                  {syncBadge.icon && <RefreshCw size={12} className="animate-spin" />}
                  {!syncBadge.icon && <RefreshCw size={12} />}
                  {syncBadge.text}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login button for guests */}
      {!isLoggedIn && (
        <div className="px-4 pt-6 pb-4">
          {!isOnline ? (
            <p className="text-sm text-gray-500 text-center">{t('noConnection')}</p>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              {loading ? t('loggingOut') : t('loginWithGoogle')}
            </button>
          )}
        </div>
      )}

      {/* Menu Sections */}
      <div className={`px-4 ${isLoggedIn ? 'pt-4' : 'pt-6'}`}>
        {/* Preferencias Section */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            {t('preferences.title')}
          </h3>
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <MenuItem
              icon={<Languages size={20} />}
              label={t('preferences.language.label')}
              sublabel={currentLanguageData.nativeName}
              onClick={() => setShowLanguageSelector(true)}
            />
          </div>
        </div>

        {/* Main Menu */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <MenuItem
            icon={<FolderOpen size={20} />}
            label={t('menu.categories')}
            onClick={() => navigate("/categories")}
          />
          <MenuItem
            icon={<Repeat size={20} />}
            label={t('menu.scheduled')}
            onClick={() => navigate("/scheduled")}
          />
          <MenuItem
            icon={<Shield size={20} />}
            label={t('menu.backup')}
            onClick={() => navigate("/backup")}
          />
        </div>
      </div>

      {/* Footer with logout and version */}
      <div className="px-4 pt-8 pb-4">
        {/* Logout button - only for logged in users */}
        {isLoggedIn && isOnline && (
          <button
            type="button"
            onClick={signOut}
            disabled={loading}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            <LogoutIcon />
            <span>{loading ? t('loggingOut') : t('logout')}</span>
          </button>
        )}
        <p className="text-xs text-gray-400 text-center">
          v{__APP_VERSION__} ({__GIT_HASH__})
        </p>
      </div>

      {/* Language Selector Modal */}
      <LanguageSelector
        open={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
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
