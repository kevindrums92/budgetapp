import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { icons, Plus, ChevronRight } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { useCurrency } from "@/features/currency";
import BudgetOnboardingWizard from "@/features/budget/components/BudgetOnboardingWizard";
import type { Category } from "@/types/budget.types";
import { kebabToPascal } from "@/shared/utils/string.utils";

export default function BudgetPage() {
  const { t } = useTranslation('budget');
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const budgetOnboardingSeen = useBudgetStore((s) => s.budgetOnboardingSeen);
  const setBudgetOnboardingSeen = useBudgetStore((s) => s.setBudgetOnboardingSeen);

  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check onboarding on mount
  useEffect(() => {
    if (!budgetOnboardingSeen) {
      setShowOnboarding(true);
    }
  }, [budgetOnboardingSeen]);

  const handleCloseOnboarding = () => {
    setBudgetOnboardingSeen(true);
    setShowOnboarding(false);
  };

  // Calculate spent per category for current month
  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) {
      if (t.date.slice(0, 7) !== selectedMonth) continue;
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    }
    return map;
  }, [transactions, selectedMonth]);

  // Separate expense and income categories
  const expenseCategories = useMemo(() => {
    return categoryDefinitions
      .filter((c) => c.type === "expense")
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [categoryDefinitions]);

  const incomeCategories = useMemo(() => {
    return categoryDefinitions
      .filter((c) => c.type === "income")
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [categoryDefinitions]);

  // Calculate totals (Placeholder - nueva implementación vendrá después)
  const totals = useMemo(() => {
    const totalBudgeted = 0; // TODO: Calcular desde budgets array

    const totalSpent = expenseCategories.reduce(
      (sum, c) => sum + (spentByCategory[c.id] ?? 0),
      0
    );

    const totalIncome = incomeCategories.reduce(
      (sum, c) => sum + (spentByCategory[c.id] ?? 0),
      0
    );

    return { totalBudgeted, totalSpent, totalIncome };
  }, [expenseCategories, incomeCategories, spentByCategory]);

  const renderCategoryRow = (category: Category) => {
    const spent = spentByCategory[category.id] ?? 0;
    const IconComponent = icons[kebabToPascal(category.icon) as keyof typeof icons];

    return (
      <div
        key={category.id}
        className="flex w-full items-center gap-3 rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm"
      >
        {/* Icon */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: category.color + "20" }}
        >
          {IconComponent && (
            <IconComponent className="h-5 w-5" style={{ color: category.color }} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900 dark:text-gray-50 truncate">{category.name}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {formatAmount(spent)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
        <main className="mx-auto max-w-xl px-4 pt-6 pb-28">
          {/* Summary Section */}
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-3">{t('summary.title')}</h2>
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm mb-6">

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t('summary.budgeted')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {formatAmount(totals.totalBudgeted)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t('summary.spent')}</p>
                <p
                  className={`text-lg font-semibold ${
                    totals.totalSpent > totals.totalBudgeted && totals.totalBudgeted > 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-900 dark:text-gray-50"
                  }`}
                >
                  {formatAmount(totals.totalSpent)}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
              Funcionalidad de presupuesto en desarrollo
            </p>
          </div>

          {/* Expense Categories */}
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-3">{t('sections.expenses')}</h3>
          <div className="space-y-2 mb-8">
            {expenseCategories.map((cat) => renderCategoryRow(cat))}
          </div>

          {/* Income Categories */}
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-3">{t('sections.income')}</h3>
          <div className="space-y-2 mb-8">
            {incomeCategories.map((cat) => renderCategoryRow(cat))}
          </div>
        </main>
      </div>

      {/* Onboarding Wizard */}
      <BudgetOnboardingWizard
        open={showOnboarding}
        onClose={handleCloseOnboarding}
      />
    </>
  );
}
