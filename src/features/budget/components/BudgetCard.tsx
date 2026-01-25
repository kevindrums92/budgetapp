import { useMemo } from "react";
import { icons, Repeat } from "lucide-react";
import type { Budget, Transaction } from "@/types/budget.types";
import { calculateBudgetProgress } from "../services/budget.service";
import { useCurrency } from "@/features/currency";
import { kebabToPascal } from "@/shared/utils/string.utils";
import { useTranslation } from "react-i18next";

type BudgetCardProps = {
  budget: Budget;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  transactions: Transaction[];
  onClick?: () => void;
};

export default function BudgetCard({
  budget,
  categoryName,
  categoryIcon,
  categoryColor,
  transactions,
  onClick,
}: BudgetCardProps) {
  const { t } = useTranslation("budget");
  const { formatAmount } = useCurrency();

  const progress = useMemo(
    () => calculateBudgetProgress(budget, transactions),
    [budget, transactions]
  );

  const IconComponent = icons[kebabToPascal(categoryIcon) as keyof typeof icons];

  // Determine progress bar color
  const getProgressColor = () => {
    if (progress.isOverBudget) return "bg-red-500";
    if (progress.percentage >= 90) return "bg-yellow-500";
    if (progress.percentage >= 75) return "bg-yellow-400";
    return "bg-emerald-500";
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      {/* Header: Icon + Category Name + Recurring indicator */}
      <div className="flex items-center gap-3 mb-3">
        {/* Icon */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: categoryColor + "20" }}
        >
          {IconComponent && (
            <IconComponent className="h-5 w-5" style={{ color: categoryColor }} />
          )}
        </div>

        {/* Category Name + Recurring indicator */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-50 truncate">
              {categoryName}
            </span>
            {budget.isRecurring && (
              <Repeat size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className={`h-full ${getProgressColor()} transition-all duration-300`}
            style={{ width: `${Math.min(progress.percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Amounts: Spent / Budgeted */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span
            className={`text-lg font-semibold ${
              progress.isOverBudget
                ? "text-red-600 dark:text-red-400"
                : "text-gray-900 dark:text-gray-50"
            }`}
          >
            {formatAmount(progress.spent)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            / {formatAmount(progress.budgeted)}
          </span>
        </div>

        {/* Percentage */}
        <span
          className={`text-sm font-medium ${
            progress.isOverBudget
              ? "text-red-600 dark:text-red-400"
              : progress.percentage >= 90
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {Math.round(progress.percentage)}%
        </span>
      </div>

      {/* Remaining amount (optional) */}
      {!progress.isOverBudget && progress.remaining > 0 && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t("card.remaining", { amount: formatAmount(progress.remaining) })}
        </p>
      )}

      {progress.isOverBudget && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          {t("card.exceeded", { amount: formatAmount(Math.abs(progress.remaining)) })}
        </p>
      )}
    </button>
  );
}
