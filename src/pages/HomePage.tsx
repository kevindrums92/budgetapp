import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import HeaderBalance from "@/components/HeaderBalance";
import TransactionList from "@/components/TransactionList";
import AddActionSheet from "@/components/AddActionSheet";
import RecurringBanner from "@/components/RecurringBanner";
import RecurringModal from "@/components/RecurringModal";
import { useBudgetStore } from "@/state/budget.store";
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

  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const addTransaction = useBudgetStore((s) => s.addTransaction);

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
      <HeaderBalance />
      <main className="pb-28 pt-4">
        {showBanner && (
          <RecurringBanner
            pendingTransactions={pendingRecurring}
            onViewDetails={() => setShowRecurringModal(true)}
            onReplicateAll={handleReplicateAll}
            onIgnore={handleIgnore}
          />
        )}
        <TransactionList />
      </main>

      {/* FAB para agregar transacción */}
      <button
        type="button"
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
    </div>
  );
}
