import { useState, useEffect, useMemo } from "react";
import { Plus, X } from "lucide-react";
import BalanceCard from "@/components/BalanceCard";
import TransactionList from "@/components/TransactionList";
import AddActionSheet from "@/components/AddActionSheet";
import RecurringBanner from "@/components/RecurringBanner";
import RecurringModal from "@/components/RecurringModal";
import { useBudgetStore } from "@/state/budget.store";
import { formatCOP } from "@/features/transactions/transactions.utils";
import type { Transaction } from "@/types/budget.types";
import {
  detectPendingRecurring,
  hasIgnoredThisMonth,
  markIgnoredForMonth,
  replicateTransaction,
} from "@/services/recurringTransactions.service";

export default function HomePage() {
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [pendingRecurring, setPendingRecurring] = useState<Transaction[]>([]);
  const [showBanner, setShowBanner] = useState(false);
  const [hideDailyBudgetSession, setHideDailyBudgetSession] = useState(false);
  const [showDailyBudgetConfirm, setShowDailyBudgetConfirm] = useState(false);

  // Check if daily budget banner is permanently hidden
  const isDailyBudgetPermanentlyHidden = useMemo(() => {
    return localStorage.getItem("budget.hideDailyBudgetBanner") === "1";
  }, []);

  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const addTransaction = useBudgetStore((s) => s.addTransaction);

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

  // Detect pending recurring transactions
  useEffect(() => {
    const pending = detectPendingRecurring(transactions, selectedMonth);
    setPendingRecurring(pending);

    const ignored = hasIgnoredThisMonth(selectedMonth);
    setShowBanner(pending.length > 0 && !ignored);
  }, [transactions, selectedMonth]);

  const handleReplicateAll = () => {
    pendingRecurring.forEach((tx) => {
      const replicated = replicateTransaction(tx, selectedMonth);
      addTransaction({
        ...replicated,
        isRecurring: replicated.isRecurring || false,
      });
    });
    setShowBanner(false);
  };

  const handleReplicateSelected = (selectedIds: string[], amounts: Record<string, number>) => {
    selectedIds.forEach((id) => {
      const tx = pendingRecurring.find((t) => t.id === id);
      if (!tx) return;

      const replicated = replicateTransaction(tx, selectedMonth);
      addTransaction({
        ...replicated,
        amount: amounts[id] || replicated.amount,
        isRecurring: replicated.isRecurring || false,
      });
    });
    setShowBanner(false);
  };

  const handleIgnore = () => {
    markIgnoredForMonth(selectedMonth);
    setShowBanner(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <BalanceCard />
      <main className="pb-28 pt-4">
        {showBanner && (
          <RecurringBanner
            pendingTransactions={pendingRecurring}
            onViewDetails={() => setShowRecurringModal(true)}
            onReplicateAll={handleReplicateAll}
            onIgnore={handleIgnore}
          />
        )}

        {/* Daily Budget Banner */}
        {dailyBudgetInfo &&
          dailyBudgetInfo.dailyBudget > 0 &&
          !isDailyBudgetPermanentlyHidden &&
          !hideDailyBudgetSession && (
          <div className="mx-4 mb-3">
            <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white shadow-lg">
              <p className="text-sm pr-6">
                Tu presupuesto para los próximos{" "}
                <span className="font-bold">{dailyBudgetInfo.daysRemaining} días</span> es{" "}
                <span className="text-lg font-bold">
                  {formatCOP(dailyBudgetInfo.dailyBudget)}
                </span>{" "}
                por día. Gasta sabiamente!
              </p>

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

      <RecurringModal
        open={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        pendingTransactions={pendingRecurring}
        categories={categoryDefinitions}
        targetMonth={selectedMonth}
        onReplicate={handleReplicateSelected}
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
    </div>
  );
}
