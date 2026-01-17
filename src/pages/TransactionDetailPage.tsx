import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";
import { icons } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { formatCOP } from "@/features/transactions/transactions.utils";
import { formatDateGroupHeader } from "@/services/dates.service";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { Category } from "@/types/budget.types";

// Convert kebab-case to PascalCase for lucide-react icons
function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export default function TransactionDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();

  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const deleteTransaction = useBudgetStore((s) => s.deleteTransaction);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const transaction = useMemo(() => {
    if (!params.id) return null;
    return transactions.find((t) => t.id === params.id) ?? null;
  }, [params.id, transactions]);

  const category = useMemo<Category | undefined>(() => {
    if (!transaction) return undefined;
    return categoryDefinitions.find((c) => c.id === transaction.category);
  }, [transaction, categoryDefinitions]);

  // Si la transacción no existe => volvemos
  useEffect(() => {
    if (!transaction && params.id) navigate("/", { replace: true });
  }, [transaction, params.id, navigate]);

  function onEdit() {
    if (!transaction) return;
    navigate(`/edit/${transaction.id}`);
  }

  function onAskDelete() {
    setConfirmOpen(true);
  }

  function onConfirmDelete() {
    if (!transaction) return;
    deleteTransaction(transaction.id);
    setConfirmOpen(false);
    navigate("/", { replace: true });
  }

  if (!transaction) return null;

  const IconComponent = category
    ? icons[kebabToPascal(category.icon) as keyof typeof icons]
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm font-medium text-gray-700 active:text-gray-900"
        >
          <ChevronLeft size={20} />
          <span>Volver</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 active:bg-gray-200"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={onAskDelete}
            className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 active:bg-red-100"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-xl p-4">
        {/* Icono y monto principal */}
        <div className="mb-6 flex flex-col items-center justify-center py-8">
          <div
            className="mb-4 flex h-20 w-20 items-center justify-center rounded-full"
            style={{
              backgroundColor: category ? category.color + "20" : "#f3f4f6",
            }}
          >
            {IconComponent ? (
              <IconComponent
                className="h-10 w-10"
                style={{ color: category?.color }}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-300" />
            )}
          </div>

          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            {transaction.name}
          </h1>

          <p
            className={`text-4xl font-bold ${
              transaction.type === "income" ? "text-emerald-600" : "text-gray-900"
            }`}
          >
            {transaction.type === "income" ? "+" : "-"}
            {formatCOP(transaction.amount)}
          </p>
        </div>

        {/* Detalles */}
        <div className="space-y-3">
          {/* Categoría */}
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs font-medium uppercase text-gray-500">
              Categoría
            </p>
            <p className="text-base font-semibold text-gray-900">
              {category?.name || transaction.category}
            </p>
          </div>

          {/* Tipo */}
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs font-medium uppercase text-gray-500">
              Tipo
            </p>
            <p className="text-base font-semibold text-gray-900">
              {transaction.type === "income" ? "Ingreso" : "Gasto"}
            </p>
          </div>

          {/* Fecha */}
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs font-medium uppercase text-gray-500">
              Fecha
            </p>
            <p className="text-base font-semibold text-gray-900">
              {formatDateGroupHeader(transaction.date.slice(0, 10))}
            </p>
          </div>

          {/* Notas (si existen) */}
          {transaction.notes && (
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="mb-1 text-xs font-medium uppercase text-gray-500">
                Notas
              </p>
              <p className="text-base text-gray-900">{transaction.notes}</p>
            </div>
          )}
        </div>
      </main>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar movimiento"
        message={`¿Seguro que deseas eliminar "${transaction.name}" por ${formatCOP(transaction.amount)}?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        destructive
        onConfirm={onConfirmDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
