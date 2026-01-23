import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, X, Search, Calculator, SlidersHorizontal, Check } from "lucide-react";
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
  const [filterType, setFilterType] = useState<"all" | "expense" | "income" | "pending" | "recurring">("all");
  const [showExportModal, setShowExportModal] = useState(false);
  const [hideScheduledBannerSession, setHideScheduledBannerSession] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

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
        <div className="mx-auto max-w-xl px-4 mt-6">
          <section className="bg-teal-50 border border-teal-100/50 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden transition-all duration-300">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-teal-100/40 to-transparent" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-full bg-white text-[#18B7B0] flex items-center justify-center shadow-sm border border-teal-50 shrink-0">
                <Calculator size={20} strokeWidth={2} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#18B7B0] mb-0.5">
                  Al mes le quedan {dailyBudgetInfo.daysRemaining} días
                </p>
                <p className="text-sm text-gray-700 font-medium leading-tight">
                  Podrías gastar <span className="text-lg font-bold text-teal-700">{formatCOP(dailyBudgetInfo.dailyBudget)}</span> / día
                </p>
              </div>
            </div>
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowDailyBudgetConfirm(true)}
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full hover:bg-teal-100/60 active:scale-95 transition-all z-10"
            >
              <X className="h-4 w-4 text-teal-600" />
            </button>
          </section>
        </div>
      )}

      {/* Sticky Search Bar & Filter Dropdown */}
      {hasTransactions && (
        <div
          className="sticky top-[80px] z-20 bg-gray-50 pb-3 pt-6"
          onClick={() => showFilterMenu && setShowFilterMenu(false)}
        >
          <div className="mx-auto max-w-xl px-4">
            <div className="flex gap-3 relative">
              {/* Search Input */}
              <div className="relative flex-1 group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#18B7B0] transition">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-10 text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#18B7B0] focus:ring-2 focus:ring-[#18B7B0]/20 shadow-sm transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter Button & Dropdown Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFilterMenu(!showFilterMenu);
                  }}
                  className={`w-11 h-11 border rounded-xl flex items-center justify-center shadow-sm transition active:scale-95 ${
                    filterType !== "all" || showFilterMenu
                      ? "bg-teal-50 border-teal-200 text-[#18B7B0]"
                      : "bg-white border-gray-200 text-gray-500 hover:border-teal-300 hover:text-[#18B7B0]"
                  }`}
                >
                  <SlidersHorizontal size={20} />
                </button>

                {/* Dropdown Menu */}
                {showFilterMenu && (
                  <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <p className="px-3 py-2 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      Filtrar por
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setFilterType("all");
                        setShowFilterMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-50 flex items-center justify-between group"
                    >
                      <span className={filterType === "all" ? "text-[#18B7B0]" : "text-gray-700"}>
                        Todos
                      </span>
                      {filterType === "all" && <Check size={14} className="text-[#18B7B0]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFilterType("expense");
                        setShowFilterMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-50 flex items-center justify-between group"
                    >
                      <span className={filterType === "expense" ? "text-rose-600" : "text-gray-700"}>
                        Gastos
                      </span>
                      {filterType === "expense" && <Check size={14} className="text-rose-600" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFilterType("income");
                        setShowFilterMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-50 flex items-center justify-between group"
                    >
                      <span className={filterType === "income" ? "text-[#18B7B0]" : "text-gray-700"}>
                        Ingresos
                      </span>
                      {filterType === "income" && <Check size={14} className="text-[#18B7B0]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFilterType("pending");
                        setShowFilterMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-50 flex items-center justify-between group"
                    >
                      <span className={filterType === "pending" ? "text-[#18B7B0]" : "text-gray-700"}>
                        Pendientes
                      </span>
                      {filterType === "pending" && <Check size={14} className="text-[#18B7B0]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFilterType("recurring");
                        setShowFilterMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-50 flex items-center justify-between group"
                    >
                      <span className={filterType === "recurring" ? "text-[#18B7B0]" : "text-gray-700"}>
                        Recurrentes
                      </span>
                      {filterType === "recurring" && <Check size={14} className="text-[#18B7B0]" />}
                    </button>
                  </div>
                )}
              </div>
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
