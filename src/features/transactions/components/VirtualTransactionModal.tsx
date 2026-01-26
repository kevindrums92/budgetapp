import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Pencil, Power, X } from "lucide-react";
import { useCurrency } from "@/features/currency";
import { useBudgetStore } from "@/state/budget.store";
import {
  materializeTransaction,
  type VirtualTransaction,
} from "@/shared/services/scheduler.service";


interface VirtualTransactionModalProps {
  transaction: VirtualTransaction;
  categoryName?: string;
  onClose: () => void;
}

export default function VirtualTransactionModal({
  transaction,
  categoryName,
  onClose,
}: VirtualTransactionModalProps) {
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const addTransaction = useBudgetStore((s) => s.addTransaction);
  const updateTransaction = useBudgetStore((s) => s.updateTransaction);
  const transactions = useBudgetStore((s) => s.transactions);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const handleConfirm = () => {
    // Convert virtual to real transaction and add to store
    const realTx = materializeTransaction(transaction);
    addTransaction(realTx);
    // Just close the modal - user stays on the list and can click the new transaction to edit
    onClose();
  };

  const handleEdit = () => {
    // Navigate to edit template with virtual date context
    // This allows the edit page to know we came from a virtual transaction
    navigate(`/edit/${transaction.templateId}`, {
      state: { virtualDate: transaction.date },
    });
    onClose();
  };

  const handleDisable = () => {
    // Find the template and disable its schedule
    const template = transactions.find((t) => t.id === transaction.templateId);
    if (template && template.schedule) {
      updateTransaction(transaction.templateId, {
        schedule: {
          ...template.schedule,
          enabled: false,
        },
      });
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <span className="rounded-full bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
            Programada
          </span>
          <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
            {transaction.name.trim() || categoryName || "Sin descripción"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{categoryName}</p>
        </div>

        {/* Details */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(transaction.date)}</span>
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {transaction.type === "income" ? "+" : "-"}
            {formatAmount(transaction.amount)}
          </div>
        </div>

        {/* Info */}
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          Esta transaccion se generara automaticamente en la fecha indicada.
        </p>

        {/* Actions - 3 buttons in a row */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
          >
            <Calendar className="h-4 w-4" />
            Confirmar
          </button>
          <button
            type="button"
            onClick={handleEdit}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-orange-50 dark:bg-orange-900/30 py-3 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50"
          >
            <Power className="h-4 w-4" />
            Desactivar
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />

          {/* Modal Card */}
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              Desactivar programación
            </h3>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              Esto desactivará la programación de "{transaction.name}".
              No se generarán más transacciones automáticamente.
            </p>
            <div className="mb-4 rounded-lg bg-orange-50 dark:bg-orange-900/30 p-3">
              <p className="text-xs font-medium text-orange-700 dark:text-orange-300">
                Esta acción es irreversible. Si deseas activarla de nuevo, deberás crear una nueva programación.
              </p>
            </div>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              Las transacciones ya registradas no se verán afectadas.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDisable}
                className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-medium text-white hover:bg-orange-600"
              >
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
