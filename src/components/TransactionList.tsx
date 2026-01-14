import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { icons } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { formatCOP } from "@/features/transactions/transactions.utils";
import ConfirmDialog from "@/components/ConfirmDialog";
import RowMenu from "@/components/RowMenu";
import type { Transaction, Category } from "@/types/budget.types";

// Convert kebab-case to PascalCase for lucide-react icons
function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export default function TransactionList() {
  const navigate = useNavigate();

  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const deleteTransaction = useBudgetStore((s) => s.deleteTransaction);

  // Helper to get category by ID
  const getCategoryById = (id: string): Category | undefined => {
    return categoryDefinitions.find((c) => c.id === id);
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const isCurrent = selectedMonth === currentMonth;

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
    navigate(`/edit/${tx.id}`);
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
        <div className="mb-3 border bg-white p-3 text-xs text-gray-600">
          Estás viendo un mes diferente al actual. Puedes agregar movimientos igual, pero revisa la fecha.
        </div>
      )}

      {list.length === 0 ? (
        <div className="border bg-white p-6 text-center text-sm text-gray-600">
          Aún no tienes movimientos este mes.
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((t) => {
            const category = getCategoryById(t.category);
            const IconComponent = category
              ? icons[kebabToPascal(category.icon) as keyof typeof icons]
              : null;

            return (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"
              >
                {/* Category Icon */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: category ? category.color + "20" : "#f3f4f6",
                  }}
                >
                  {IconComponent ? (
                    <IconComponent
                      className="h-5 w-5"
                      style={{ color: category?.color }}
                    />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-gray-300" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">
                    {category?.name || t.category} • {t.date}
                  </p>
                </div>

                {/* Amount */}
                <div
                  className={`whitespace-nowrap font-semibold ${
                    t.type === "income" ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"} {formatCOP(t.amount)}
                </div>

                <RowMenu onEdit={() => onEdit(t)} onDelete={() => onAskDelete(t)} />
              </div>
            );
          })}
        </div>
      )}

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
