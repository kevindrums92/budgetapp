import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, X, ChevronRight, Bell, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import BalanceCard from "@/features/transactions/components/BalanceCard";
import TransactionList from "@/features/transactions/components/TransactionList";
import AddActionSheet from "@/features/transactions/components/AddActionSheet";
import ScheduledBanner from "@/features/transactions/components/ScheduledBanner";
import SpotlightTour from "@/features/tour/components/SpotlightTour";
import { useSpotlightTour } from "@/features/tour/hooks/useSpotlightTour";
import { homeTour } from "@/features/tour/tours/homeTour";
import { useBudgetStore } from "@/state/budget.store";
import { generateVirtualTransactions, generatePastDueTransactions, materializeTransaction, type VirtualTransaction } from "@/shared/services/scheduler.service";
import { todayISO } from "@/services/dates.service";
import { requestPermissions, checkPermissionStatus } from "@/services/pushNotification.service";
import { shouldShowBanner, recordDismiss, markAsEnabled } from "@/services/pushBannerTracking.service";
import SafeToSpendCard from "@/features/forecasting/components/SafeToSpendCard";

export default function HomePage() {
  const { t } = useTranslation('home');
  const navigate = useNavigate();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [hideSmartBannerSession, setHideSmartBannerSession] = useState(false);
  const [showSmartBannerConfirm, setShowSmartBannerConfirm] = useState(false);
  const [hideScheduledBannerSession, setHideScheduledBannerSession] = useState(false);
  const [showPushBanner, setShowPushBanner] = useState(false);
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [showVirtual, setShowVirtual] = useState(() => {
    return localStorage.getItem("budget.homeViewFilter") !== "real";
  });
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

  // Spotlight tour
  const { isActive: isTourActive, startTour, completeTour } = useSpotlightTour("home");

  // Check if smart banner is permanently hidden
  const isSmartBannerPermanentlyHidden = useMemo(() => {
    return localStorage.getItem("budget.hideSmartBanner") === "1";
  }, []);

  // Get list of months where scheduled banner is hidden
  const [hiddenScheduledMonths, setHiddenScheduledMonths] = useState<string[]>(() => {
    const stored = localStorage.getItem("budget.hideScheduledBannerMonths");
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  });

  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const transactions = useBudgetStore((s) => s.transactions);
  const addTransaction = useBudgetStore((s) => s.addTransaction);
  const user = useBudgetStore((s) => s.user);

  const today = todayISO();

  // Track if we've already auto-confirmed past-due transactions this session
  const hasAutoConfirmedRef = useRef(false);

  // Auto-confirm past-due scheduled transactions on mount
  useEffect(() => {
    if (hasAutoConfirmedRef.current) return;

    const pastDue = generatePastDueTransactions(transactions, today);

    if (pastDue.length > 0) {
      console.log(`[HomePage] Auto-confirming ${pastDue.length} past-due scheduled transactions`);
      pastDue.forEach((tx) => addTransaction(tx));
      hasAutoConfirmedRef.current = true;
    }
  }, [transactions, today, addTransaction]);

  // Start spotlight tour on first visit
  useEffect(() => {
    startTour();
  }, [startTour]);

  // Auto-request push permissions on first app load (after onboarding completes)
  useEffect(() => {
    async function autoRequestPushPermissions() {
      const hasAutoRequestedPush = localStorage.getItem('push_auto_requested') === 'true';

      // Only auto-request once per user
      if (hasAutoRequestedPush) return;

      // Mark as requested before actually requesting (to avoid duplicate requests)
      localStorage.setItem('push_auto_requested', 'true');

      try {
        console.log('[HomePage] Auto-requesting push permissions on first app load');
        // requestPermissions() automatically applies DEFAULT_NOTIFICATION_PREFERENCES
        const granted = await requestPermissions();

        if (granted) {
          console.log('[HomePage] Push notifications enabled automatically with default preferences');
        } else {
          console.log('[HomePage] User denied push permissions');
        }
      } catch (error) {
        console.error('[HomePage] Failed to auto-request push permissions:', error);
      }
    }

    autoRequestPushPermissions();
  }, []);

  // Check if push notification banner should be shown
  useEffect(() => {
    async function checkBannerConditions() {
      // Only show on PWA/mobile app, NOT on web browser
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    (navigator as any).standalone === true;
      if (!isPWA) {
        setShowPushBanner(false);
        return;
      }

      // Only show to authenticated users
      if (!user.email) {
        setShowPushBanner(false);
        return;
      }

      // Only show if user has several transactions (3+)
      if (transactions.length < 3) {
        setShowPushBanner(false);
        return;
      }

      // Check if push is already enabled
      // BUT also check if user manually disabled (in that case, we SHOULD show the banner)
      const manuallyDisabled = localStorage.getItem('push_notifications_manually_disabled') === 'true';
      const permissionStatus = await checkPermissionStatus();

      if (permissionStatus === "granted" && !manuallyDisabled) {
        // Permissions granted AND not manually disabled → already enabled, don't show banner
        setShowPushBanner(false);
        return;
      }

      // Check if banner tracking allows showing
      const shouldShow = shouldShowBanner();
      setShowPushBanner(shouldShow);
    }

    checkBannerConditions();
  }, [user.email, transactions.length]);

  // Generate virtual transactions for the selected month
  const virtualTransactionsForMonth = useMemo<VirtualTransaction[]>(() => {
    const allVirtual = generateVirtualTransactions(transactions, today);
    // Filter to only show virtuals in the selected month
    return allVirtual.filter((vt) => vt.date.slice(0, 7) === selectedMonth);
  }, [transactions, today, selectedMonth]);

  // Check if there are any transactions in the selected month
  const hasTransactionsInMonth = useMemo(() => {
    return transactions.some((t) => t.date.slice(0, 7) === selectedMonth);
  }, [transactions, selectedMonth]);

  // Check if user has at least 1 transaction (any month) - used to show nav buttons
  const hasAnyTransactions = transactions.length > 0;

  // Register all virtual transactions at once
  const handleRegisterAllScheduled = () => {
    virtualTransactionsForMonth.forEach((vt) => {
      const realTx = materializeTransaction(vt);
      addTransaction(realTx);
    });
    setHideScheduledBannerSession(true);
  };

  // Hide scheduled banner for a specific month (persistent)
  const handleDismissScheduledForMonth = (month: string) => {
    if (!hiddenScheduledMonths.includes(month)) {
      const newMonths = [...hiddenScheduledMonths, month];
      setHiddenScheduledMonths(newMonths);
      localStorage.setItem("budget.hideScheduledBannerMonths", JSON.stringify(newMonths));
    }
  };

  // Check if scheduled banner should be hidden for current month
  const isScheduledBannerHiddenForMonth = hiddenScheduledMonths.includes(selectedMonth);

  // Handle push banner dismiss
  const handleDismissPushBanner = () => {
    recordDismiss();
    setShowPushBanner(false);
  };

  // Handle push notification activation
  const handleEnablePush = async () => {
    setIsEnablingPush(true);
    try {
      // requestPermissions() automatically applies DEFAULT_NOTIFICATION_PREFERENCES
      const granted = await requestPermissions();
      if (granted) {
        markAsEnabled(); // Permanently hide banner
        setShowPushBanner(false);
        console.log("[HomePage] Push notifications enabled successfully with default preferences");
      } else {
        // User denied permission, record as dismiss
        recordDismiss();
        setShowPushBanner(false);
        console.log("[HomePage] Push notifications denied by user");
      }
    } catch (error) {
      console.error("[HomePage] Failed to enable push notifications:", error);
      recordDismiss();
      setShowPushBanner(false);
    } finally {
      setIsEnablingPush(false);
    }
  };


  return (
    <div data-testid="home-page" className="bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors">
      {hasTransactionsInMonth && (
        <>
          <BalanceCard activeFilter={filterType} onFilterChange={setFilterType} />

          {/* Safe to Spend + Daily Budget merged banner */}
          {!isSmartBannerPermanentlyHidden && !hideSmartBannerSession && (
            <SafeToSpendCard onDismiss={() => setShowSmartBannerConfirm(true)} />
          )}

          {/* Push Notification Banner */}
          {showPushBanner && (
            <div className="mx-auto max-w-xl px-4 mt-6">
              <section className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100/50 dark:border-emerald-800/50 rounded-2xl p-4 shadow-sm relative overflow-hidden transition-all duration-300">
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-emerald-100/40 dark:from-emerald-800/20 to-transparent" />
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-500 flex items-center justify-center shadow-sm border border-emerald-50 dark:border-emerald-800 shrink-0">
                    <Bell size={20} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-500 mb-0.5">
                      {t('pushBanner.title')}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-200 font-medium leading-tight mb-2">
                      {t('pushBanner.description')}
                    </p>
                    <button
                      type="button"
                      onClick={handleEnablePush}
                      disabled={isEnablingPush}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-500 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isEnablingPush ? t('pushBanner.enabling') : t('pushBanner.enable')}
                    </button>
                  </div>
                </div>
                {/* Close button */}
                <button
                  type="button"
                  onClick={handleDismissPushBanner}
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full hover:bg-emerald-100/60 dark:hover:bg-emerald-800/40 active:scale-95 transition-all z-10"
                >
                  <X className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                </button>
              </section>
            </div>
          )}

        </>
      )}

      {/* Navigation to History + View Filter - visible when user has any transaction */}
      {hasAnyTransactions && (
        <div className="mx-auto max-w-xl px-4 pt-6 pb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/history', { state: { resetFilters: true } })}
            className="flex items-center gap-1 py-2 text-sm font-medium text-[#18B7B0] active:scale-95 transition-all"
          >
            <span>{t('viewFullHistory')}</span>
            <ChevronRight size={16} />
          </button>
          {virtualTransactionsForMonth.length > 0 && (
            <button
              type="button"
              data-tour="home-projection-toggle"
              onClick={() => {
                const next = !showVirtual;
                setShowVirtual(next);
                localStorage.setItem("budget.homeViewFilter", next ? "all" : "real");
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                showVirtual
                  ? "bg-[#18B7B0]/20 text-[#18B7B0]"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-400"
              }`}
            >
              {showVirtual ? <Eye size={14} /> : <EyeOff size={14} />}
              {t('viewFilter.scheduled', { count: virtualTransactionsForMonth.length })}
            </button>
          )}
        </div>
      )}

      <main className="pb-28 pt-4">
        {/* Scheduled transactions banner (hidden when filtering to real only) */}
        {showVirtual &&
          !hideScheduledBannerSession &&
          !isScheduledBannerHiddenForMonth &&
          virtualTransactionsForMonth.length > 0 && (
          <ScheduledBanner
            virtualTransactions={virtualTransactionsForMonth}
            selectedMonth={selectedMonth}
            onRegisterAll={handleRegisterAllScheduled}
            onDismiss={() => setHideScheduledBannerSession(true)}
            onDismissForMonth={handleDismissScheduledForMonth}
          />
        )}

        <TransactionList showVirtual={showVirtual} filterType={filterType} />
      </main>

      {/* FAB para agregar transacción */}
      <button
        type="button"
        data-testid="fab-add-transaction"
        data-tour="home-fab"
        onClick={() => setAddSheetOpen(true)}
        className={[
          "fixed right-4 z-40",
          "grid h-14 w-14 place-items-center rounded-full",
          "bg-[#18B7B0] text-white",
          "shadow-[0_8px_24px_rgba(24,183,176,0.4)]",
          "active:scale-95 transition-transform hover:bg-[#159d97]",
        ].join(" ")}
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 96px)" }}
        aria-label="Agregar movimiento"
      >
        <Plus size={26} strokeWidth={2.2} />
      </button>

      <AddActionSheet
        open={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
      />

      {/* Smart Banner Dismiss Confirmation Modal */}
      {showSmartBannerConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            onClick={() => setShowSmartBannerConfirm(false)}
          />

          {/* Modal Card */}
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t('hideSmartBanner.title')}
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              {t('hideSmartBanner.message')}
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("budget.hideSmartBanner", "1");
                  setShowSmartBannerConfirm(false);
                  window.location.reload();
                }}
                className="w-full rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {t('hideSmartBanner.neverShow')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setHideSmartBannerSession(true);
                  setShowSmartBannerConfirm(false);
                }}
                className="w-full rounded-xl bg-emerald-500 dark:bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                {t('hideSmartBanner.hideOnce')}
              </button>
              <button
                type="button"
                onClick={() => setShowSmartBannerConfirm(false)}
                className="w-full rounded-xl py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                {t('hideSmartBanner.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spotlight Tour */}
      <SpotlightTour
        config={homeTour}
        isActive={isTourActive}
        onComplete={completeTour}
      />

    </div>
  );
}
