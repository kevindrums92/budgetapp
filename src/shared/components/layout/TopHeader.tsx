import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useBudgetStore } from "@/state/budget.store";
import { useSubscription } from "@/hooks/useSubscription";
import MonthSelector from "@/shared/components/navigation/MonthSelector";
import { User, Bell, Crown } from "lucide-react";

type Props = {
  showMonthSelector?: boolean;
  isProfilePage?: boolean;
};

export default function TopHeader({ showMonthSelector = true, isProfilePage = false }: Props) {
  const { t } = useTranslation('common');

  // ✅ Read from Zustand store (single source of truth)
  const user = useBudgetStore((s) => s.user);
  const cloudMode = useBudgetStore((s) => s.cloudMode);
  const cloudStatus = useBudgetStore((s) => s.cloudStatus);

  // ✅ Check Pro status
  const { isPro } = useSubscription();

  const AvatarContent = useMemo(() => {
    if (user.avatarUrl) {
      return (
        <img
          src={user.avatarUrl}
          alt="Avatar"
          className="h-10 w-10 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      );
    }
    return (
      <div className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
        <User size={20} strokeWidth={1.8} />
      </div>
    );
  }, [user.avatarUrl]);

  // Sync indicator dot (for default mode)
  const syncDot = useMemo(() => {
    if (cloudMode === "guest") {
      return "bg-gray-400";
    }
    if (!navigator.onLine || cloudStatus === "offline") {
      return "bg-gray-400";
    }
    if (cloudStatus === "syncing") {
      return "bg-[#18B7B0]";
    }
    return "bg-green-500"; // ok
  }, [cloudMode, cloudStatus]);

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.30)]">
      <div
        className="mx-auto max-w-xl px-4 pb-2"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}
      >
        <div className="flex items-start justify-between">
          {/* Left: Logo + Content */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl bg-[#18B7B0] shadow-lg shadow-[#18B7B0]/20">
              <svg width="26" height="26" viewBox="0 0 60 60" fill="none">
                <rect x="10" y="35" width="8" height="15" rx="1" fill="white" fillOpacity="0.5"/>
                <rect x="26" y="25" width="8" height="25" rx="1" fill="white" fillOpacity="0.5"/>
                <rect x="42" y="20" width="8" height="30" rx="1" fill="white" fillOpacity="0.5"/>
                <path d="M8 40 L22 28 L36 32 L52 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Profile Mode: Configuration Title */}
            {isProfilePage ? (
              <div>
                <h1 className="text-lg font-bold leading-tight text-gray-900 dark:text-gray-50">{t('settings.title')}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-tight">{t('settings.subtitle')}</p>
              </div>
            ) : (
              /* Default Mode: App Name + Month Selector */
              <div>
                <h1 className="text-lg font-bold leading-tight text-gray-900 dark:text-gray-50">SmartSpend</h1>
                {showMonthSelector && (
                  <div className="mt-1">
                    <MonthSelector />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Notification Bell + Avatar - only show in default mode */}
          {!isProfilePage && (
            <div className="flex items-center gap-3">
              {/* Notification Bell Icon */}
              <button
                type="button"
                onClick={() => {
                  // TODO: Implement notifications functionality
                  console.log('[TopHeader] Notifications clicked - TODO');
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-95 active:bg-gray-100 dark:active:bg-gray-800"
                aria-label="Notificaciones"
              >
                <Bell size={20} className="text-gray-600 dark:text-gray-400" />
              </button>

              {/* Avatar with Pro styling or default */}
              {isPro ? (
                <div className="relative shrink-0">
                  {/* Pro gradient border wrapper */}
                  <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-600 shadow-md">
                    {AvatarContent}
                    {/* Pro Crown Badge (top-right) */}
                    <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-900">
                      <Crown size={10} className="text-white" strokeWidth={2.5} />
                    </div>
                    {/* Sync indicator dot (bottom-left) */}
                    <span className={`absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${syncDot}`} />
                  </div>
                </div>
              ) : (
                <div className="relative flex items-center justify-center">
                  {AvatarContent}
                  {/* Sync indicator dot */}
                  <span className={`absolute top-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${syncDot}`} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
