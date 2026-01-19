import { useNavigate } from "react-router-dom";
import { icons, Repeat } from "lucide-react";
import { formatCOP } from "@/features/transactions/transactions.utils";
import type { Transaction, Category } from "@/types/budget.types";

// Convert kebab-case to PascalCase for lucide-react icons
function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
}

export default function TransactionItem({
  transaction,
  category,
}: TransactionItemProps) {
  const navigate = useNavigate();

  const IconComponent = category
    ? icons[kebabToPascal(category.icon) as keyof typeof icons]
    : null;

  return (
    <button
      type="button"
      onClick={() => navigate(`/edit/${transaction.id}`)}
      className="w-full flex items-center gap-3 bg-white px-4 py-3 active:bg-gray-50 transition-colors"
    >
      {/* Category Icon - tamaño reducido */}
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
      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-1.5">
          <p className="truncate font-semibold text-gray-900 text-sm">
            {transaction.name}
          </p>
          {transaction.isRecurring && (
            <Repeat className="h-3 w-3 shrink-0 text-gray-400" />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-gray-500">
            {category?.name || transaction.category}
          </p>
          {transaction.status && transaction.status !== "paid" && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                transaction.status === "pending"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              {transaction.status === "pending" ? "Pendiente" : "Planeado"}
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        <p
          className={`whitespace-nowrap font-semibold text-sm ${
            transaction.type === "income" ? "text-emerald-600" : "text-gray-900"
          }`}
        >
          {transaction.type === "income" ? "+" : "-"}{formatCOP(transaction.amount)}
        </p>
      </div>
    </button>
  );
}
