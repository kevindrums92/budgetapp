import { useNavigate } from "react-router-dom";
import { Calendar, FileText, X } from "lucide-react";
import { formatCOP } from "@/shared/utils/currency.utils";
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
  const addTransaction = useBudgetStore((s) => s.addTransaction);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const handleMaterialize = () => {
    // Convert virtual to real transaction
    const realTx = materializeTransaction(transaction);
    addTransaction(realTx);
    onClose();
    // Navigate to edit the new transaction
    navigate(`/edit/${realTx.id}`);
  };

  const handleViewTemplate = () => {
    // Navigate to the template transaction
    navigate(`/edit/${transaction.templateId}`);
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
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
            Programada
          </span>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">
            {transaction.name}
          </h3>
          <p className="text-sm text-gray-500">{categoryName}</p>
        </div>

        {/* Details */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(transaction.date)}</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {transaction.type === "income" ? "+" : "-"}
            {formatCOP(transaction.amount)}
          </div>
        </div>

        {/* Info */}
        <p className="mb-4 text-xs text-gray-500">
          Esta transaccion se generara automaticamente en la fecha indicada.
          Puedes registrarla ahora o ver la plantilla original.
        </p>

        {/* Actions */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleMaterialize}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
          >
            <Calendar className="h-4 w-4" />
            Registrar ahora
          </button>
          <button
            type="button"
            onClick={handleViewTemplate}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            <FileText className="h-4 w-4" />
            Ver plantilla
          </button>
        </div>
      </div>
    </div>
  );
}
