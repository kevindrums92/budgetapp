import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, X, Calculator, ChevronRight, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import BalanceCard from "@/features/transactions/components/BalanceCard";
import TransactionList from "@/features/transactions/components/TransactionList";
import AddActionSheet from "@/features/transactions/components/AddActionSheet";
import ScheduledBanner from "@/features/transactions/components/ScheduledBanner";
import { useBudgetStore } from "@/state/budget.store";
import { useCurrency } from "@/features/currency";
import { generateVirtualTransactions, generatePastDueTransactions, materializeTransaction, type VirtualTransaction } from "@/shared/services/scheduler.service";
import { todayISO } from "@/services/dates.service";
import { requestPermissions, checkPermissionStatus, updatePreferences } from "@/services/pushNotification.service";
import { shouldShowBanner, recordDismiss, markAsEnabled } from "@/services/pushBannerTracking.service";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/types/notifications";

export default function HomePage() {
  const { t } = useTranslation('home');
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [hideDailyBudgetSession, setHideDailyBudgetSession] = useState(false);
  const [showDailyBudgetConfirm, setShowDailyBudgetConfirm] = useState(false);
  const [hideScheduledBannerSession, setHideScheduledBannerSession] = useState(false);
  const [showPushBanner, setShowPushBanner] = useState(false);
  const [isEnablingPush, setIsEnablingPush] = useState(false);

  // Check if daily budget banner is permanently hidden
  const isDailyBudgetPermanentlyHidden = useMemo(() => {
    return localStorage.getItem("budget.hideDailyBudgetBanner") === "1";
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

  // Check if push notification banner should be shown
  useEffect(() => {
    async function checkBannerConditions() {
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
      const permissionStatus = await checkPermissionStatus();
      if (permissionStatus === "granted") {
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

  // Check if there are transactions in current month
  const hasTransactions = useMemo(() => {
    return transactions.some((t) => t.date.slice(0, 7) === selectedMonth);
  }, [transactions, selectedMonth]);

  // Calculate daily budget based on current balance
  const dailyBudgetInfo = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      if (t.date.slice(0, 7) !== selectedMonth) continue;
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }

    const balance = income - expense;

    // Daily budget calculation
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const isCurrentMonth = selectedMonth === currentMonthKey;

    if (!isCurrentMonth) return null;

    const currentDay = today.getDate();
    const daysRemaining = daysInMonth - currentDay;

    if (daysRemaining <= 0) return null;

    const dailyBudget = balance / daysRemaining;

    return { dailyBudget, daysRemaining };
  }, [transactions, selectedMonth]);

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
      const granted = await requestPermissions();
      if (granted) {
        // Configure default preferences (daily reminder at 9pm, quiet hours 11pm-6am)
        await updatePreferences(DEFAULT_NOTIFICATION_PREFERENCES);
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
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors">
      <BalanceCard />

      {/* Daily Budget Banner */}
      {dailyBudgetInfo &&
        dailyBudgetInfo.dailyBudget > 0 &&
        !isDailyBudgetPermanentlyHidden &&
        !hideDailyBudgetSession && (
        <div className="mx-auto max-w-xl px-4 mt-6">
          <section className="bg-teal-50 dark:bg-teal-900/30 border border-teal-100/50 dark:border-teal-800/50 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden transition-all duration-300">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-teal-100/40 dark:from-teal-800/20 to-transparent" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 text-[#18B7B0] flex items-center justify-center shadow-sm border border-teal-50 dark:border-teal-800 shrink-0">
                <Calculator size={20} strokeWidth={2} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#18B7B0] mb-0.5">
                  {t('dailyBudget.remaining', { count: dailyBudgetInfo.daysRemaining })}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200 font-medium leading-tight">
                  {t('dailyBudget.couldSpend', { amount: formatAmount(dailyBudgetInfo.dailyBudget) })}
                </p>
              </div>
            </div>
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowDailyBudgetConfirm(true)}
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full hover:bg-teal-100/60 dark:hover:bg-teal-800/40 active:scale-95 transition-all z-10"
            >
              <X className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </button>
          </section>
        </div>
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
                  Notificaciones
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200 font-medium leading-tight mb-2">
                  Recibe alertas cuando te acerques al límite de tu presupuesto
                </p>
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={isEnablingPush}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-500 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isEnablingPush ? "Activando..." : "Activar ahora"}
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

      {/* Navigation to History */}
      {hasTransactions && (
        <div className="mx-auto max-w-xl px-4 pt-6 pb-3">
          <button
            type="button"
            onClick={() => navigate('/history', { state: { resetFilters: true } })}
            className="flex items-center gap-1 py-2 text-sm font-medium text-[#18B7B0] active:scale-95 transition-all"
          >
            <span>Ver historial completo</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <main className="pb-28 pt-4">
        {/* Scheduled transactions banner */}
        {!hideScheduledBannerSession &&
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

        <TransactionList />
      </main>

      {/* FAB para agregar transacción */}
      <button
        type="button"
        data-testid="fab-add-transaction"
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

      {/* Daily Budget Dismiss Confirmation Modal */}
      {showDailyBudgetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            onClick={() => setShowDailyBudgetConfirm(false)}
          />

          {/* Modal Card */}
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t('hideDailyBudget.title')}
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              {t('hideDailyBudget.message')}
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("budget.hideDailyBudgetBanner", "1");
                  setShowDailyBudgetConfirm(false);
                  // Force re-render by navigating to same page
                  window.location.reload();
                }}
                className="w-full rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {t('hideDailyBudget.neverShow')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setHideDailyBudgetSession(true);
                  setShowDailyBudgetConfirm(false);
                }}
                className="w-full rounded-xl bg-emerald-500 dark:bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                {t('hideDailyBudget.hideOnce')}
              </button>
              <button
                type="button"
                onClick={() => setShowDailyBudgetConfirm(false)}
                className="w-full rounded-xl py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                {t('hideDailyBudget.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
