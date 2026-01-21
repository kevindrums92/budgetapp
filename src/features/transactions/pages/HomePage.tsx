import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, X, Search, TrendingUp, TrendingDown, Clock, Download } from "lucide-react";
import BalanceCard from "@/features/transactions/components/BalanceCard";
import TransactionList from "@/features/transactions/components/TransactionList";
import AddActionSheet from "@/features/transactions/components/AddActionSheet";
import ScheduledBanner from "@/features/transactions/components/ScheduledBanner";
import { useBudgetStore } from "@/state/budget.store";
import { formatCOP } from "@/shared/utils/currency.utils";
import { exportTransactionsToCSV } from "@/shared/services/export.service";
import { generateVirtualTransactions, generatePastDueTransactions, materializeTransaction, type VirtualTransaction } from "@/shared/services/scheduler.service";
import { todayISO } from "@/services/dates.service";

export default function HomePage() {
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [hideDailyBudgetSession, setHideDailyBudgetSession] = useState(false);
  const [showDailyBudgetConfirm, setShowDailyBudgetConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "expense" | "income" | "pending">("all");
  const [showExportModal, setShowExportModal] = useState(false);
  const [hideScheduledBannerSession, setHideScheduledBannerSession] = useState(false);

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
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const addTransaction = useBudgetStore((s) => s.addTransaction);

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

  const handleExport = () => {
    // Filter transactions by selected month
    const monthTransactions = transactions.filter((t) => t.date.slice(0, 7) === selectedMonth);

    if (monthTransactions.length === 0) {
      alert("No hay transacciones para exportar en este mes");
      return;
    }

    // Export to CSV
    exportTransactionsToCSV(monthTransactions, categoryDefinitions, `transacciones-${selectedMonth}`);
    setShowExportModal(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <BalanceCard />

      {/* Daily Budget Banner */}
      {dailyBudgetInfo &&
        dailyBudgetInfo.dailyBudget > 0 &&
        !isDailyBudgetPermanentlyHidden &&
        !hideDailyBudgetSession && (
        <div className="mx-4 mb-3 mt-4">
          <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white shadow-lg">
            <div className="pr-8">
              <p className="text-xs font-medium uppercase tracking-wide mb-1 opacity-90">
                Disponible Diario ({dailyBudgetInfo.daysRemaining} días restantes)
              </p>
              <p className="text-2xl font-bold tracking-tight">
                {formatCOP(dailyBudgetInfo.dailyBudget)}
                <span className="text-sm font-normal ml-1">/ día</span>
              </p>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowDailyBudgetConfirm(true)}
              className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Sticky Search Bar & Filter Pills */}
      {hasTransactions && (
        <div className="sticky top-[83.7px] z-20 bg-gray-50 pb-3 pt-4">
          <div className="mx-auto max-w-xl px-4">
            {/* Search Bar */}
            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm mb-3">
              <Search size={20} className="shrink-0 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, categoría..."
                className="min-w-0 flex-1 border-0 bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="shrink-0 rounded-full p-1 hover:bg-gray-100"
                >
                  <X size={18} className="text-gray-400" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilterType(filterType === "expense" ? "all" : "expense")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-all active:scale-95 ${
                  filterType === "expense"
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white text-gray-700 shadow-sm"
                }`}
              >
                <TrendingDown size={16} />
                Gastos
              </button>
              <button
                type="button"
                onClick={() => setFilterType(filterType === "income" ? "all" : "income")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-all active:scale-95 ${
                  filterType === "income"
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white text-gray-700 shadow-sm"
                }`}
              >
                <TrendingUp size={16} />
                Ingresos
              </button>
              <button
                type="button"
                onClick={() => setFilterType(filterType === "pending" ? "all" : "pending")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap active:scale-95 ${
                  filterType === "pending"
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white text-gray-700 shadow-sm"
                }`}
              >
                <Clock size={16} />
                Pendientes
              </button>
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap active:scale-95 bg-white text-gray-700 shadow-sm"
              >
                <Download size={16} />
                Exportar
              </button>
            </div>
          </div>
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

        <TransactionList searchQuery={searchQuery} filterType={filterType} />
      </main>

      {/* FAB para agregar transacción */}
      <button
        type="button"
        data-testid="fab-add-transaction"
        onClick={() => setAddSheetOpen(true)}
        className={[
          "fixed right-4 z-40",
          "grid h-14 w-14 place-items-center rounded-full",
          "bg-black text-white",
          "shadow-[0_8px_24px_rgba(0,0,0,0.25)]",
          "active:scale-95 transition-transform",
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
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDailyBudgetConfirm(false)}
          />

          {/* Modal Card */}
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Ocultar presupuesto diario
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              ¿Cómo quieres ocultar este banner?
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
                className="w-full rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                No volver a mostrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setHideDailyBudgetSession(true);
                  setShowDailyBudgetConfirm(false);
                }}
                className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
              >
                Solo por esta vez
              </button>
              <button
                type="button"
                onClick={() => setShowDailyBudgetConfirm(false)}
                className="w-full rounded-xl py-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowExportModal(false)}
          />

          {/* Modal Card */}
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Exportar transacciones
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Se exportarán todas las transacciones de {selectedMonth} a formato CSV.
            </p>

            {/* Info */}
            <div className="mb-6 rounded-xl bg-gray-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total de transacciones:</span>
                <span className="font-semibold text-gray-900">
                  {transactions.filter((t) => t.date.slice(0, 7) === selectedMonth).length}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
              >
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
