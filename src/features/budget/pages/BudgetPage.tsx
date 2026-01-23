import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { icons, Plus, ChevronRight, Download } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { formatCOP } from "@/shared/utils/currency.utils";
import SetLimitModal from "@/features/categories/components/SetLimitModal";
import BudgetOnboardingWizard from "@/features/budget/components/BudgetOnboardingWizard";
import type { Category } from "@/types/budget.types";
import { kebabToPascal } from "@/shared/utils/string.utils";
import { exportBudgetToCSV } from "@/shared/services/export.service";

function getProgressColor(spent: number, limit: number | undefined): string {
  if (!limit) return "bg-gray-200";
  const percent = (spent / limit) * 100;
  if (percent >= 100) return "bg-red-500";
  if (percent >= 75) return "bg-amber-500";
  return "bg-emerald-500";
}

function getTextColor(spent: number, limit: number | undefined): string {
  if (!limit) return "text-gray-500";
  const percent = (spent / limit) * 100;
  if (percent >= 100) return "text-red-600";
  if (percent >= 75) return "text-amber-600";
  return "text-emerald-600";
}

export default function BudgetPage() {
  const { t } = useTranslation('budget');
  const navigate = useNavigate();
  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const setCategoryLimit = useBudgetStore((s) => s.setCategoryLimit);
  const budgetOnboardingSeen = useBudgetStore((s) => s.budgetOnboardingSeen);
  const setBudgetOnboardingSeen = useBudgetStore((s) => s.setBudgetOnboardingSeen);

  const [modalCategory, setModalCategory] = useState<Category | null>(null);
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

  // Calculate totals
  const totals = useMemo(() => {
    const totalBudgeted = expenseCategories
      .filter((c) => c.monthlyLimit)
      .reduce((sum, c) => sum + (c.monthlyLimit ?? 0), 0);

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

  const overallProgress =
    totals.totalBudgeted > 0
      ? Math.min((totals.totalSpent / totals.totalBudgeted) * 100, 100)
      : 0;

  const handleSaveLimit = (limit: number | null) => {
    if (modalCategory) {
      setCategoryLimit(modalCategory.id, limit);
    }
  };

  const handleExportBudget = () => {
    // Create a map of spent per category
    const spentMap = new Map<string, number>();
    Object.entries(spentByCategory).forEach(([catId, amount]) => {
      spentMap.set(catId, amount);
    });

    // Export budget
    exportBudgetToCSV(
      expenseCategories,
      spentMap,
      selectedMonth,
      `presupuesto-${selectedMonth}`
    );
  };

  const renderCategoryRow = (category: Category, showLimit: boolean = true) => {
    const spent = spentByCategory[category.id] ?? 0;
    const limit = category.monthlyLimit;
    const progress = limit ? Math.min((spent / limit) * 100, 100) : 0;
    const IconComponent = icons[kebabToPascal(category.icon) as keyof typeof icons];

    return (
      <button
        key={category.id}
        type="button"
        onClick={() => setModalCategory(category)}
        className="flex w-full items-center gap-3 rounded-xl bg-white p-4 shadow-sm hover:bg-gray-50 transition-colors"
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
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-gray-900 truncate">{category.name}</span>
            <span className={`text-sm font-medium ${getTextColor(spent, limit)}`}>
              {formatCOP(spent)}
              {showLimit && limit && (
                <span className="text-gray-400">/{formatCOP(limit)}</span>
              )}
            </span>
          </div>

          {/* Progress Bar */}
          {showLimit && (
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getProgressColor(spent, limit)}`}
                style={{ width: limit ? `${progress}%` : "0%" }}
              />
            </div>
          )}

          {/* No limit text */}
          {showLimit && !limit && (
            <p className="text-xs text-gray-400 mt-1">{t('setLimit')}</p>
          )}
        </div>

        <ChevronRight className="h-5 w-5 text-gray-300 shrink-0" />
      </button>
    );
  };

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
        <main className="mx-auto max-w-xl px-4 pt-6 pb-28">
          {/* Summary Section */}
          <h2 className="text-base font-semibold mb-3">{t('summary.title')}</h2>
          <div className="rounded-2xl bg-white p-5 shadow-sm mb-6">

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-400">{t('summary.budgeted')}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCOP(totals.totalBudgeted)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">{t('summary.spent')}</p>
                <p
                  className={`text-lg font-semibold ${
                    totals.totalSpent > totals.totalBudgeted && totals.totalBudgeted > 0
                      ? "text-red-600"
                      : "text-gray-900"
                  }`}
                >
                  {formatCOP(totals.totalSpent)}
                </p>
              </div>
            </div>

            {/* Overall Progress */}
            {totals.totalBudgeted > 0 && (
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getProgressColor(
                      totals.totalSpent,
                      totals.totalBudgeted
                    )}`}
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-right">
                  {Math.round((totals.totalSpent / totals.totalBudgeted) * 100)}{t('summary.percentageLabel')}
                </p>
              </div>
            )}

            {totals.totalBudgeted === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">
                {t('emptyState')}
              </p>
            )}
          </div>

          {/* Expense Categories */}
          <h3 className="text-base font-semibold mb-3">{t('sections.expenses')}</h3>
          <div className="space-y-2 mb-8">
            {expenseCategories.map((cat) => renderCategoryRow(cat, true))}
          </div>

          {/* Income Categories */}
          <h3 className="text-base font-semibold mb-3">{t('sections.income')}</h3>
          <div className="space-y-2 mb-8">
            {incomeCategories.map((cat) => renderCategoryRow(cat, false))}
          </div>

          {/* Export Budget Button */}
          <button
            type="button"
            onClick={handleExportBudget}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors mb-3"
          >
            <Download className="h-5 w-5" />
            {t('export')}
          </button>

          {/* Add Category Button */}
          <button
            type="button"
            onClick={() => navigate("/category/new")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm font-medium text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
          >
            <Plus className="h-5 w-5" />
            {t('newCategory')}
          </button>

          {/* Set Limit Modal */}
          <SetLimitModal
            open={!!modalCategory}
            onClose={() => setModalCategory(null)}
            category={modalCategory}
            onSave={handleSaveLimit}
          />
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
