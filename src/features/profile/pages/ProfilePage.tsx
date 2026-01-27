import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { supabase } from "@/lib/supabaseClient";
import { useBudgetStore } from "@/state/budget.store";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "@/features/theme";
import { useCurrency } from "@/features/currency";
import { User, ChevronRight, Shield, Repeat, RefreshCw, Languages, Palette, DollarSign, FileText, Folder, ScrollText, Lock, Fingerprint } from "lucide-react";
import { Capacitor } from '@capacitor/core';
import { authenticateWithBiometrics, checkBiometricAvailability, getBiometryDisplayName } from "@/features/biometric/services/biometric.service";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation('profile');
  const { currentLanguageData } = useLanguage();
  const { theme } = useTheme();
  const { currencyInfo } = useCurrency();

  // ✅ Read from Zustand store (single source of truth)
  const user = useBudgetStore((s) => s.user);
  const cloudMode = useBudgetStore((s) => s.cloudMode);
  const cloudStatus = useBudgetStore((s) => s.cloudStatus);
  const security = useBudgetStore((s) => s.security);
  const toggleBiometricAuth = useBudgetStore((s) => s.toggleBiometricAuth);

  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [biometryType, setBiometryType] = useState<string>('Face ID');

  // Get current theme name for display
  const currentThemeName = useMemo(() => {
    return t(`preferences.theme.${theme}`);
  }, [theme, t]);

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

  const isLoggedIn = !!user.email;

  // Auth actions
  async function signOut() {
    setLoading(true);
    await supabase.auth.signOut();

    // Marcar logout para que OnboardingGate redirija a login
    const { markLogout } = await import('@/features/onboarding/utils/onboarding.helpers');
    markLogout();

    setLoading(false);
    navigate("/");
  }

  // Handle biometric toggle
  async function handleBiometricToggle() {
    const isCurrentlyEnabled = security?.biometricEnabled ?? false;

    // If disabling, just toggle off
    if (isCurrentlyEnabled) {
      console.log('[ProfilePage] Disabling biometric auth');
      toggleBiometricAuth();
      return;
    }

    // If enabling, first check availability then authenticate
    console.log('[ProfilePage] Attempting to enable biometric auth');

    try {
      // Check if biometric is available
      console.log('[ProfilePage] Checking biometric availability...');
      const availability = await checkBiometricAvailability();

      if (!availability.isAvailable) {
        console.log('[ProfilePage] Biometric not available:', availability.reason);
        setErrorMessage(availability.reason || 'Autenticación biométrica no disponible en este dispositivo');
        return;
      }

      // Store the biometry type for display
      const displayName = getBiometryDisplayName(availability.biometryType);
      setBiometryType(displayName);
      console.log('[ProfilePage] Biometry type:', displayName);

      // Request biometric authentication
      const authResult = await authenticateWithBiometrics('Habilitar autenticación biométrica');

      if (authResult.success) {
        console.log('[ProfilePage] Biometric authentication successful, enabling');
        toggleBiometricAuth();
      } else {
        console.log('[ProfilePage] Biometric authentication failed:', authResult.error);
        if (authResult.errorCode === 'NOT_AVAILABLE') {
          setErrorMessage('Face ID no está disponible en este dispositivo');
        } else if (authResult.errorCode !== 'USER_CANCEL') {
          setErrorMessage('No se pudo autenticar. Por favor intenta de nuevo.');
        }
      }
    } catch (error) {
      console.error('[ProfilePage] Error in biometric toggle:', error);
      setErrorMessage('Error al verificar autenticación biométrica');
    }
  }

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
      return { text: t('account.syncStatus.local').toUpperCase(), color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400", icon: false };
    }
    if (!navigator.onLine || cloudStatus === "offline") {
      return { text: t('account.syncStatus.offline').toUpperCase(), color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400", icon: false };
    }
    if (cloudStatus === "syncing") {
      return { text: t('account.syncStatus.syncing').toUpperCase(), color: "bg-teal-50 dark:bg-teal-900/30 text-[#18B7B0]", icon: true };
    }
    return { text: t('account.syncStatus.synced').toUpperCase(), color: "bg-teal-50 dark:bg-teal-900/30 text-[#18B7B0]", icon: false };
  }, [cloudMode, cloudStatus, t]);

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-28 transition-colors">
      {/* User Account Card - Only for logged in users */}
      {isLoggedIn && (
        <div className="px-4 pt-6 pb-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden hover:border-teal-200 dark:hover:border-teal-700 transition">
            {/* Decorative element */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 dark:bg-teal-900/30 rounded-bl-[4rem] -mr-4 -mt-4 transition-transform hover:scale-110" />

            <div className="flex items-center gap-4 relative z-10">
              {/* Avatar with status dot */}
              <div className="relative">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-sm text-gray-400 dark:text-gray-500">
                    {initials ? (
                      <span className="text-2xl font-semibold text-gray-600 dark:text-gray-300">
                        {initials}
                      </span>
                    ) : (
                      <User size={32} />
                    )}
                  </div>
                )}
                {/* Status dot - green when synced */}
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg text-gray-900 dark:text-gray-50 leading-tight truncate">
                  {user.name || "Usuario"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 truncate">{user.email}</p>
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

      {/* Login banner for guests */}
      {!isLoggedIn && (
        <div className="px-4 pt-6 pb-4">
          <button
            type="button"
            onClick={() => navigate('/onboarding/login')}
            className="w-full rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm border border-[#18B7B0] hover:shadow-md transition-all active:scale-[0.98] text-left"
          >
            {/* Cloud icon */}
            <div className="mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#18B7B0]/10">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#18B7B0]"
                >
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div>
              <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-gray-50">
                {t('loginBanner.title', 'Protege tus finanzas')}
              </h3>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('loginBanner.subtitle', 'Inicia sesión para respaldar tus gastos en la nube.')}
              </p>
              <div className="flex items-center gap-1 text-sm font-semibold text-[#18B7B0]">
                <span>{t('loginBanner.action', 'Conectar cuenta')}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Menu Sections */}
      <div className={`px-4 ${isLoggedIn ? 'pt-4' : 'pt-6'}`}>
        {/* Apariencia Section */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
            {t('sections.appearance')}
          </h3>
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <MenuItem
              icon={<Languages size={20} />}
              label={t('preferences.language.label')}
              sublabel={currentLanguageData.nativeName}
              onClick={() => navigate('/settings/language')}
            />
            <MenuItem
              icon={<Palette size={20} />}
              label={t('preferences.theme.label')}
              sublabel={currentThemeName}
              onClick={() => navigate('/settings/theme')}
            />
            <MenuItem
              icon={<DollarSign size={20} />}
              label={t('preferences.currency.label')}
              sublabel={`${currencyInfo.flag} ${currencyInfo.code} - ${currencyInfo.name}`}
              onClick={() => navigate('/settings/currency')}
            />
          </div>
        </div>

        {/* Gestión de Gastos Section */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
            {t('sections.expenseManagement')}
          </h3>
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <MenuItem
              icon={<Folder size={20} />}
              label={t('menu.categories')}
              sublabel={t('menu.categoriesSubtitle')}
              onClick={() => navigate("/categories")}
            />
            <MenuItem
              icon={<Repeat size={20} />}
              label={t('menu.scheduled')}
              sublabel={t('menu.scheduledSubtitle')}
              onClick={() => navigate("/scheduled")}
            />
          </div>
        </div>

        {/* Datos y Seguridad Section */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
            {t('sections.dataSecurity')}
          </h3>
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <MenuItem
              icon={<Shield size={20} />}
              label={t('menu.backup')}
              sublabel={t('menu.backupSubtitle')}
              onClick={() => navigate("/backup")}
            />
            {isLoggedIn && Capacitor.isNativePlatform() && (
              <MenuItem
                icon={<Fingerprint size={20} />}
                label={t('menu.biometric')}
                sublabel={
                  security?.biometricEnabled
                    ? t('menu.biometricEnabled', { type: biometryType })
                    : t('menu.biometricDisabled')
                }
                onClick={handleBiometricToggle}
                showToggle
                toggleValue={security?.biometricEnabled ?? false}
              />
            )}
            <MenuItem
              icon={<FileText size={20} />}
              label={t('menu.exportCSV')}
              sublabel={t('menu.exportCSVSubtitle')}
              onClick={() => navigate('/settings/export-csv')}
            />
          </div>
        </div>

        {/* Legal Section */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
            {t('sections.legal', 'Legal')}
          </h3>
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <MenuItem
              icon={<ScrollText size={20} />}
              label={t('legal.terms.title', 'Términos de Servicio')}
              onClick={() => navigate('/legal/terms')}
            />
            <MenuItem
              icon={<Lock size={20} />}
              label={t('legal.privacy.title', 'Política de Privacidad')}
              onClick={() => navigate('/legal/privacy')}
            />
          </div>
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
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            <LogoutIcon />
            <span>{loading ? t('loggingOut') : t('logout')}</span>
          </button>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          v{__APP_VERSION__} ({__GIT_HASH__})
        </p>
      </div>

      {/* Error modal */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setErrorMessage(null)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              Error
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  showBadge?: boolean;
  showToggle?: boolean;
  toggleValue?: boolean;
};

function MenuItem({ icon, label, sublabel, onClick, showBadge, showToggle, toggleValue }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-50">{label}</span>
        {sublabel && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{sublabel}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showBadge && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            !
          </span>
        )}
        {showToggle ? (
          <div className={`relative h-8 w-14 rounded-full transition-all ${
            toggleValue ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'
          }`}>
            <span className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
              toggleValue ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </div>
        ) : (
          <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
        )}
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
