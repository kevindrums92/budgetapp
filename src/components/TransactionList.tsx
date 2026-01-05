import { useMemo, useState } from "react";
import { useBudgetStore } from "@/state/budget.store";
import { formatCOP } from "@/features/transactions/transactions.utils";
import AddTransactionModal from "@/components/AddTransactionModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import RowMenu from "@/components/RowMenu";
import type { Transaction } from "@/types/budget.types";

export default function TransactionList() {
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const transactions = useBudgetStore((s) => s.transactions);
  const deleteTransaction = useBudgetStore((s) => s.deleteTransaction);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const isCurrent = selectedMonth === currentMonth;

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);

  // Confirm delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  const list = useMemo(() => {
    return transactions
      .filter((t) => t.date.slice(0, 7) === selectedMonth)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return b.createdAt - a.createdAt;
      });
  }, [transactions, selectedMonth]);

  function onEdit(tx: Transaction) {
    setTxToEdit(tx);
    setEditOpen(true);
  }

  function onAskDelete(tx: Transaction) {
    setTxToDelete(tx);
    setConfirmOpen(true);
  }

  function onConfirmDelete() {
    if (!txToDelete) return;
    deleteTransaction(txToDelete.id);
    setConfirmOpen(false);
    setTxToDelete(null);
  }

  return (
    <div className="mx-auto max-w-xl p-4">
      {!isCurrent && (
        <div className="mb-3 rounded-2xl border bg-white p-3 text-xs text-gray-600">
          Estás viendo un mes diferente al actual. Puedes agregar movimientos igual, pero revisa la fecha.
        </div>
      )}

      {list.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6 text-center text-sm text-gray-600">
          Aún no tienes movimientos este mes.
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{t.name}</p>
                <p className="text-xs text-gray-600">
                  {t.category} • {t.date}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`whitespace-nowrap font-semibold ${
                    t.type === "income" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"} {formatCOP(t.amount)}
                </div>

                <RowMenu onEdit={() => onEdit(t)} onDelete={() => onAskDelete(t)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      <AddTransactionModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        transactionToEdit={txToEdit}
      />

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar movimiento"
        message={
          txToDelete
            ? `¿Seguro que deseas eliminar "${txToDelete.name}" por ${formatCOP(txToDelete.amount)}?`
            : "¿Seguro que deseas eliminar este movimiento?"
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        destructive
        onConfirm={onConfirmDelete}
        onClose={() => {
          setConfirmOpen(false);
          setTxToDelete(null);
        }}
      />
    </div>
  );
}
