import { Repeat } from "lucide-react";
import { icons } from "lucide-react";
import type { BudgetProgress } from "@/types/budget.types";
import { useCurrency } from "@/features/currency";
import { kebabToPascal } from "@/shared/utils/string.utils";

type BudgetCardProps = {
  progress: BudgetProgress;
  onClick?: () => void;
};

export default function BudgetCard({
  progress,
  onClick,
}: BudgetCardProps) {
  const { formatAmount } = useCurrency();

  const { budget, category, spent, saved, percentage, remaining, isExceeded, isCompleted } = progress;

  const isCompletedBudget = budget.status === "completed";

  const IconComponent = icons[kebabToPascal(category.icon) as keyof typeof icons];

  // Determine progress bar color based on budget type
  const getProgressColor = () => {
    if (budget.type === "limit") {
      // Limits: Red if exceeded, yellow if close, teal if normal
      if (isExceeded) return "#EF4444"; // red-500
      if (percentage >= 90) return "#EAB308"; // yellow-500
      if (percentage >= 75) return "#FACC15"; // yellow-400
      return "#18B7B0"; // teal
    } else {
      // Goals: Always teal (positive color)
      return "#18B7B0"; // teal
    }
  };

  // Render text based on budget type
  const renderAmountText = () => {
    if (budget.type === "limit") {
      return (
        <>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-lg font-semibold ${
                isExceeded
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-900 dark:text-gray-50"
              }`}
            >
              {formatAmount(spent)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              / {formatAmount(budget.amount)}
            </span>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-teal-700 dark:text-teal-400">
              {formatAmount(saved)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              / {formatAmount(budget.amount)}
            </span>
          </div>
        </>
      );
    }
  };

  // Format period dates
  const formatPeriodDates = () => {
    const startDate = new Date(budget.period.startDate + "T12:00:00");
    const endDate = new Date(budget.period.endDate + "T12:00:00");

    const startFormatted = startDate.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
    });

    const endFormatted = endDate.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return `${startFormatted} - ${endFormatted}`;
  };

  // Render status message
  const renderStatusMessage = () => {
    if (budget.type === "limit") {
      if (isExceeded) {
        return (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            Excedido por {formatAmount(Math.abs(remaining))}
          </p>
        );
      } else if (isCompletedBudget) {
        const savedAmount = remaining;
        const savedPercentage = budget.amount > 0 ? Math.round((savedAmount / budget.amount) * 100) : 0;
        return (
          <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">
            ✓ Límite respetado · Ahorraste {formatAmount(savedAmount)} ({savedPercentage}%)
          </p>
        );
      } else if (remaining > 0) {
        return (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Te quedan {formatAmount(remaining)}
          </p>
        );
      }
    } else {
      if (isCompleted) {
        const surplus = saved - budget.amount;
        if (surplus > 0) {
          return (
            <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">
              ¡Meta alcanzada! 🎉 · Superaste por {formatAmount(surplus)}
            </p>
          );
        }
        return (
          <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">
            ¡Meta alcanzada! 🎉
          </p>
        );
      } else if (isCompletedBudget) {
        const achievedPercentage = Math.round(percentage);
        const shortfall = budget.amount - saved;
        return (
          <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
            Meta no alcanzada · Lograste {achievedPercentage}% · Faltaron {formatAmount(shortfall)}
          </p>
        );
      } else {
        return (
          <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">
            ¡Faltan {formatAmount(remaining)}!
          </p>
        );
      }
    }
  };


  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      {/* Header: Icon + Category Name + Type label */}
      <div className="flex items-center gap-3 mb-3">
        {/* Icon */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: category.color + "20" }}
        >
          {IconComponent && (
            <IconComponent className="h-5 w-5" style={{ color: category.color }} />
          )}
        </div>

        {/* Category Name + Type indicator */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-50 truncate">
              {category.name}
            </span>
            {budget.isRecurring && (
              <Repeat size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {budget.type === "limit" ? "Límite de gasto" : "Meta de ahorro"}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {formatPeriodDates()}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: getProgressColor(),
            }}
          />
        </div>
      </div>

      {/* Amounts: Spent/Saved and Budgeted/Goal */}
      <div className="flex items-center justify-between">
        {renderAmountText()}

        {/* Percentage */}
        <span
          className={`text-sm font-medium ${
            budget.type === "limit"
              ? isExceeded
                ? "text-red-600 dark:text-red-400"
                : percentage >= 90
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-teal-600 dark:text-teal-400"
              : "text-teal-600 dark:text-teal-400"
          }`}
        >
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Status message */}
      {renderStatusMessage()}
    </button>
  );
}
