import { useState } from "react";
import { Lightbulb, X, icons } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/features/currency";
import { kebabToPascal } from "@/shared/utils/string.utils";

type Props = {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  selectedMonth: string;
  onCreateBudget: () => void;
};

export default function BudgetSuggestionBanner({
  categoryId,
  categoryName,
  categoryIcon,
  categoryColor,
  amount,
  selectedMonth,
  onCreateBudget,
}: Props) {
  const { t } = useTranslation("stats");
  const { formatAmount } = useCurrency();

  const storageKey = `budget.dismissedSuggestion.${categoryId}.${selectedMonth}`;

  const [dismissedForMonth, setDismissedForMonth] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  });
  const [dismissedSession, setDismissedSession] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (dismissedForMonth || dismissedSession) return null;

  function handleDismissMonth() {
    setDismissedForMonth(true);
    setShowConfirm(false);
    try {
      localStorage.setItem(storageKey, "true");
    } catch {
      /* noop */
    }
  }

  function handleDismissOnce() {
    setDismissedSession(true);
    setShowConfirm(false);
  }

  const IconComponent =
    icons[kebabToPascal(categoryIcon) as keyof typeof icons];

  return (
    <>
      <div className="mt-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 p-3">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: categoryColor + "20" }}
          >
            {IconComponent ? (
              <IconComponent
                className="h-4 w-4"
                style={{ color: categoryColor }}
              />
            ) : (
              <Lightbulb className="h-4 w-4 text-amber-500" />
            )}
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {t("expensesByCategory.suggestion.title", {
                category: categoryName,
              })}
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {t("expensesByCategory.suggestion.subtitle", {
                amount: formatAmount(amount),
              })}
            </p>

            {/* CTA */}
            <button
              type="button"
              onClick={onCreateBudget}
              className="mt-2 rounded-lg bg-amber-500 dark:bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors active:scale-[0.98] active:bg-amber-600 dark:active:bg-amber-500"
            >
              {t("expensesByCategory.suggestion.cta")}
            </button>
          </div>

          {/* Dismiss */}
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="shrink-0 rounded-full p-1 text-gray-400 dark:text-gray-500 transition-colors active:bg-gray-200 dark:active:bg-gray-700"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Dismiss confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t("expensesByCategory.suggestion.dismissTitle")}
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              {t("expensesByCategory.suggestion.dismissMessage")}
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDismissMonth}
                className="w-full rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {t("expensesByCategory.suggestion.dismissMonth")}
              </button>
              <button
                type="button"
                onClick={handleDismissOnce}
                className="w-full rounded-xl bg-emerald-500 dark:bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                {t("expensesByCategory.suggestion.dismissOnce")}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="w-full rounded-xl py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                {t("expensesByCategory.suggestion.dismissCancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
