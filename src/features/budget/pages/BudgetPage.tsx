import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { useCurrency } from "@/features/currency";
import BudgetOnboardingWizard from "@/features/budget/components/BudgetOnboardingWizard";
import BudgetCard from "@/features/budget/components/BudgetCard";
import AddEditBudgetModal from "@/features/budget/components/AddEditBudgetModal";
import { calculateAllBudgetsProgress } from "@/features/budget/services/budget.service";

export default function BudgetPage() {
  const { t } = useTranslation('budget');
  const { formatAmount } = useCurrency();
  const store = useBudgetStore();
  const transactions = store.transactions;
  const budgets = store.budgets;
  const categoryDefinitions = store.categoryDefinitions;
  const selectedMonth = store.selectedMonth;
  const budgetOnboardingSeen = store.budgetOnboardingSeen;
  const setBudgetOnboardingSeen = store.setBudgetOnboardingSeen;

  // State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | undefined>(undefined);

  // Check onboarding on mount
  useEffect(() => {
    if (!budgetOnboardingSeen) {
      setShowOnboarding(true);
    }
  }, [budgetOnboardingSeen]);

  // Renew expired budgets on mount
  useEffect(() => {
    store.renewExpiredBudgets();
  }, []);

  const handleCloseOnboarding = () => {
    setBudgetOnboardingSeen(true);
    setShowOnboarding(false);
  };

  // Convert selectedMonth to period
  const currentPeriod = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return {
      type: "month" as const,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  }, [selectedMonth]);

  // Get budgets for current period
  const activeBudgets = useMemo(() => {
    return budgets.filter((b) => {
      if (b.status !== "active") return false;

      // Check if budget period overlaps with current period
      const budgetStart = new Date(b.period.startDate);
      const budgetEnd = new Date(b.period.endDate);
      const periodStart = new Date(currentPeriod.startDate);
      const periodEnd = new Date(currentPeriod.endDate);

      return budgetStart <= periodEnd && budgetEnd >= periodStart;
    });
  }, [budgets, currentPeriod]);

  // Calculate budget progress
  const budgetProgress = useMemo(() => {
    return calculateAllBudgetsProgress(
      activeBudgets,
      transactions,
      currentPeriod.startDate,
      currentPeriod.endDate
    );
  }, [activeBudgets, transactions, currentPeriod]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalBudgeted = budgetProgress.reduce((sum, bp) => sum + bp.budgeted, 0);
    const totalSpent = budgetProgress.reduce((sum, bp) => sum + bp.spent, 0);
    const remaining = totalBudgeted - totalSpent;
    const percentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    return { totalBudgeted, totalSpent, remaining, percentage };
  }, [budgetProgress]);

  const handleBudgetClick = (budgetId: string) => {
    setEditingBudgetId(budgetId);
    setShowAddBudgetModal(true);
  };

  const handleCloseModal = () => {
    setShowAddBudgetModal(false);
    setEditingBudgetId(undefined);
  };

  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
        <main className="mx-auto max-w-xl px-4 pt-6 pb-28">
          {/* Summary Section */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {t('summary.budgeted')}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {formatAmount(totals.totalBudgeted)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {t('summary.spent')}
                </p>
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

            {/* Progress Bar */}
            {totals.totalBudgeted > 0 && (
              <div className="mb-3">
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      totals.percentage > 100
                        ? "bg-red-500"
                        : totals.percentage >= 90
                        ? "bg-yellow-500"
                        : totals.percentage >= 75
                        ? "bg-yellow-400"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(totals.percentage, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Remaining/Over */}
            <div className="text-center">
              {totals.totalBudgeted > 0 ? (
                totals.remaining >= 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('page.remaining', { amount: formatAmount(totals.remaining), percentage: Math.round(totals.percentage) })}
                  </p>
                ) : (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {t('page.exceeded', { amount: formatAmount(Math.abs(totals.remaining)), percentage: Math.round(totals.percentage) })}
                  </p>
                )
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {t('page.noActiveBudgets')}
                </p>
              )}
            </div>
          </div>

          {/* Budgets List */}
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-3">
            {t('page.activeBudgets')}
          </h3>

          {activeBudgets.length === 0 ? (
            <button
              type="button"
              onClick={() => setShowAddBudgetModal(true)}
              className="w-full rounded-2xl bg-gray-900 dark:bg-gray-800 p-8 text-center transition-all hover:bg-gray-800 dark:hover:bg-gray-750 active:scale-[0.99]"
            >
              {/* Icon Circle with Plus */}
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#18B7B0]/30 bg-[#18B7B0]/10">
                  <Plus size={32} className="text-[#18B7B0]" strokeWidth={2.5} />
                </div>
              </div>

              {/* Title */}
              <h3 className="mb-3 text-xl font-bold text-white">
                {t('emptyState.title')}
              </h3>

              {/* Description */}
              <p className="mb-6 text-sm leading-relaxed text-gray-400">
                {t('emptyState.description')}
              </p>

              {/* CTA Text */}
              <span className="text-sm font-bold uppercase tracking-wide text-[#18B7B0]">
                {t('emptyState.cta')}
              </span>
            </button>
          ) : (
            <div className="space-y-3">
              {activeBudgets.map((budget) => {
                const category = categoryDefinitions.find((c) => c.id === budget.categoryId);
                if (!category) return null;

                return (
                  <BudgetCard
                    key={budget.id}
                    budget={budget}
                    categoryName={category.name}
                    categoryIcon={category.icon}
                    categoryColor={category.color}
                    transactions={transactions}
                    onClick={() => handleBudgetClick(budget.id)}
                  />
                );
              })}
            </div>
          )}
        </main>

        {/* FAB - Add Budget */}
        {activeBudgets.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAddBudgetModal(true)}
            className="fixed right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-black dark:bg-emerald-500 text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] active:scale-95 transition-transform"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 96px)" }}
          >
            <Plus size={26} strokeWidth={2.2} />
          </button>
        )}
      </div>

      {/* Onboarding Wizard */}
      <BudgetOnboardingWizard
        open={showOnboarding}
        onClose={handleCloseOnboarding}
      />

      {/* Add/Edit Budget Modal */}
      <AddEditBudgetModal
        open={showAddBudgetModal}
        onClose={handleCloseModal}
        budgetId={editingBudgetId}
      />
    </>
  );
}
