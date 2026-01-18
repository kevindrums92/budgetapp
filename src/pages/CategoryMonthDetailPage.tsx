import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { icons, Repeat } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import PageHeader from "@/components/PageHeader";
import { formatCOP } from "@/features/transactions/transactions.utils";

// Convert kebab-case to PascalCase for lucide-react icons
function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

// Format date for display
function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function CategoryMonthDetailPage() {
  const { categoryId, month } = useParams<{ categoryId: string; month: string }>();
  const navigate = useNavigate();

  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);

  // Find the category
  const category = useMemo(() => {
    return categoryDefinitions.find((c) => c.id === categoryId);
  }, [categoryDefinitions, categoryId]);

  // Filter transactions by category and month
  const filteredTransactions = useMemo(() => {
    if (!categoryId || !month) return [];

    return transactions
      .filter(
        (t) =>
          t.category === categoryId &&
          t.date.slice(0, 7) === month &&
          t.type === "expense"
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, categoryId, month]);

  // Total spent in this category this month
  const totalSpent = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  // Format month for display
  const monthLabel = useMemo(() => {
    if (!month) return "";
    const [year, monthNum] = month.split("-");
    const date = new Date(Number(year), Number(monthNum) - 1, 1);
    return date.toLocaleDateString("es-CO", {
      month: "long",
      year: "numeric",
    });
  }, [month]);

  // Get icon component
  const IconComponent = category
    ? icons[kebabToPascal(category.icon) as keyof typeof icons]
    : null;

  if (!category || !categoryId || !month) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <PageHeader title="Error" />
        <div className="flex-1 px-4 pt-6 pb-8">
          <p className="text-sm text-gray-500">Categoría no encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PageHeader title={category.name} />

      {/* Stats Header */}
      <div className="bg-white px-4 pt-6 pb-5 text-center border-b border-gray-100">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: category.color + "20" }}
          >
            {IconComponent && (
              <IconComponent
                className="h-7 w-7"
                style={{ color: category.color }}
              />
            )}
          </div>
        </div>

        {/* Total */}
        <p className="text-4xl font-bold text-gray-900 mb-2">
          {formatCOP(totalSpent)}
        </p>
        <p className="text-sm text-gray-500">
          {filteredTransactions.length}{" "}
          {filteredTransactions.length === 1 ? "transacción" : "transacciones"}
        </p>
        <p className="text-xs text-gray-400 mt-1 capitalize">
          {monthLabel}
        </p>
      </div>

      <div className="flex-1 px-4 pt-4 pb-8">
        {/* Transactions List */}
        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center mt-4">
              <p className="text-sm text-gray-500">
                No hay transacciones en esta categoría este mes
              </p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <button
                key={transaction.id}
                type="button"
                onClick={() => navigate(`/edit/${transaction.id}`)}
                className="w-full flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm active:bg-gray-50 transition-colors"
              >
                {/* Info */}
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-semibold text-gray-900 text-sm">
                      {transaction.name}
                    </p>
                    {transaction.isRecurring && (
                      <Repeat className="h-3 w-3 shrink-0 text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDate(transaction.date)}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p className="whitespace-nowrap font-semibold text-sm text-gray-900">
                    -{formatCOP(transaction.amount)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
