import { useMemo } from "react";
import { AlertTriangle, TrendingDown } from "lucide-react";
import { icons } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/features/currency";
import { useBudgetStore } from "@/state/budget.store";
import { kebabToPascal } from "@/shared/utils/string.utils";
import type { BudgetPrediction } from "../types/forecasting.types";

type Props = {
  prediction: BudgetPrediction;
};

export default function BudgetAlertCard({ prediction }: Props) {
  const { t } = useTranslation("forecasting");
  const { formatAmount } = useCurrency();
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);

  const category = useMemo(
    () => categoryDefinitions.find((c) => c.id === prediction.categoryId),
    [categoryDefinitions, prediction.categoryId]
  );

  const IconComponent = category
    ? (icons[kebabToPascal(category.icon) as keyof typeof icons] as React.ComponentType<{ className?: string; style?: React.CSSProperties }>)
    : null;

  const urgencyColors = {
    high: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800/50",
      badge: "bg-red-500",
      text: "text-red-700 dark:text-red-300",
    },
    medium: {
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-yellow-200 dark:border-yellow-800/50",
      badge: "bg-yellow-500",
      text: "text-yellow-700 dark:text-yellow-300",
    },
    low: {
      bg: "bg-orange-50 dark:bg-orange-900/20",
      border: "border-orange-200 dark:border-orange-800/50",
      badge: "bg-orange-500",
      text: "text-orange-700 dark:text-orange-300",
    },
  };

  const colors = urgencyColors[prediction.urgency];
  const percentage = Math.round(
    (prediction.currentSpent / prediction.budgetLimit) * 100
  );

  return (
    <div
      className={`rounded-2xl ${colors.bg} border ${colors.border} p-4 transition-all`}
    >
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: category ? category.color + "20" : "#9CA3AF20",
          }}
        >
          {IconComponent ? (
            <IconComponent
              className="h-5 w-5"
              style={{ color: category?.color }}
            />
          ) : (
            <AlertTriangle className="h-5 w-5 text-gray-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
              {category?.name || "—"}
            </span>
            <span
              className={`shrink-0 rounded-full ${colors.badge} px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide`}
            >
              {t(`budgetAlerts.urgency.${prediction.urgency}`)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown size={14} className={colors.text} />
            <span className={`text-xs font-medium ${colors.text}`}>
              {prediction.daysUntilExceeded === 0
                ? t("budgetAlerts.alreadyExceeded")
                : t("budgetAlerts.exceedingIn", {
                    days: prediction.daysUntilExceeded,
                    count: prediction.daysUntilExceeded,
                  })}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full bg-gray-200/50 dark:bg-gray-700/50 overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor:
                  prediction.urgency === "high"
                    ? "#EF4444"
                    : prediction.urgency === "medium"
                      ? "#EAB308"
                      : "#F97316",
              }}
            />
          </div>

          {/* Amount info */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatAmount(prediction.currentSpent)} /{" "}
              {formatAmount(prediction.budgetLimit)}
            </span>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {percentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
