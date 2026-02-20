import { useMemo, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { icons, Repeat, Target, X } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import PageHeader from "@/shared/components/layout/PageHeader";
import { useCurrency } from "@/features/currency";
import { kebabToPascal } from "@/shared/utils/string.utils";

export default function CategoryMonthDetailPage() {
  const { categoryId, month } = useParams<{ categoryId: string; month: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("categories");
  const { formatAmount } = useCurrency();

  // Format date for display using current locale
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T12:00:00");
    const locale = i18n.language === "en" ? "en-US" : "es-CO";
    return date.toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const budgets = useBudgetStore((s) => s.budgets);

  const [showBudgetBanner, setShowBudgetBanner] = useState(true);

  // Find the category
  const category = useMemo(() => {
    return categoryDefinitions.find((c) => c.id === categoryId);
  }, [categoryDefinitions, categoryId]);

  // Check if there's an active budget for this category in this month
  const hasActiveBudget = useMemo(() => {
    if (!categoryId || !month) return false;

    const [yearStr, monthStr] = month.split("-");
    const year = Number(yearStr);
    const monthNum = Number(monthStr);
    const firstDay = `${month}-01`;
    const lastDay = `${month}-${String(new Date(year, monthNum, 0).getDate()).padStart(2, "0")}`;

    return budgets.some(
      (b) =>
        b.status === "active" &&
        b.categoryId === categoryId &&
        b.period.startDate <= lastDay &&
        b.period.endDate >= firstDay
    );
  }, [budgets, categoryId, month]);

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
    const locale = i18n.language === "en" ? "en-US" : "es-CO";
    return date.toLocaleDateString(locale, {
      month: "long",
      year: "numeric",
    });
  }, [month, i18n.language]);

  // Get icon component
  const IconComponent = category
    ? icons[kebabToPascal(category.icon) as keyof typeof icons]
    : null;

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!category || !categoryId || !month) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
        <PageHeader title="Error" />
        <div className="flex-1 px-4 pt-6 pb-20">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("monthDetail.error")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <PageHeader title={category.name} />

      {/* Stats Header */}
      <div className="bg-white dark:bg-gray-900 px-4 pt-6 pb-5 text-center border-b border-gray-100 dark:border-gray-800">
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
        <p className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-2">
          {formatAmount(totalSpent)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filteredTransactions.length}{" "}
          {filteredTransactions.length === 1 ? t("monthDetail.transaction") : t("monthDetail.transactions")}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 capitalize">
          {monthLabel}
        </p>
      </div>

      {/* Budget Suggestion Banner */}
      {!hasActiveBudget && showBudgetBanner && (
        <div className="mx-4 mt-4">
          <div className="relative rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/30 p-4 shadow-sm overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-emerald-100/40 dark:from-emerald-800/20 to-transparent" />

            <div className="relative flex items-start gap-3">
              {/* Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-emerald-100 dark:border-emerald-800 shadow-sm">
                <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-500 mb-0.5">
                  {t("monthDetail.budgetBanner.title")}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200 font-medium leading-tight mb-3">
                  {t("monthDetail.budgetBanner.description")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    // Set category in sessionStorage and navigate to budgets page
                    if (categoryId) {
                      sessionStorage.setItem("newCategoryId", categoryId);
                      navigate("/plan");
                    }
                  }}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-500 active:scale-95 transition-all"
                >
                  {t("monthDetail.budgetBanner.action")}
                </button>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={() => setShowBudgetBanner(false)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-emerald-100/60 dark:hover:bg-emerald-800/40 active:scale-95 transition-all"
              >
                <X className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 px-4 pt-4 pb-20">
        {/* Transactions List */}
        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="rounded-xl bg-white dark:bg-gray-900 p-8 text-center mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("monthDetail.empty")}
              </p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <button
                key={transaction.id}
                type="button"
                onClick={() => navigate(`/edit/${transaction.id}`)}
                className="w-full flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 shadow-sm active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
              >
                {/* Info */}
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-semibold text-gray-900 dark:text-gray-50 text-sm">
                      {transaction.name.trim() || category?.name || "Sin descripción"}
                    </p>
                    {transaction.isRecurring && (
                      <Repeat className="h-3 w-3 shrink-0 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(transaction.date)}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p className="whitespace-nowrap font-semibold text-sm text-gray-900 dark:text-gray-50">
                    -{formatAmount(transaction.amount)}
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
