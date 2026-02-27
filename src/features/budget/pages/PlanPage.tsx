import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Clock, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBudgetStore } from "@/state/budget.store";
import BudgetOnboardingWizard from "@/features/budget/components/BudgetOnboardingWizard";
import BudgetCard from "@/features/budget/components/BudgetCard";
import AddEditBudgetModal from "@/features/budget/components/AddEditBudgetModal";
import BudgetAlertsSection from "@/features/forecasting/components/BudgetAlertsSection";

type BudgetTab = "active" | "completed";

export default function PlanPage() {
  const { t } = useTranslation("budget");
  const navigate = useNavigate();
  const store = useBudgetStore();
  const budgets = store.budgets;
  const selectedMonth = store.selectedMonth;
  const budgetOnboardingSeen = store.budgetOnboardingSeen;
  const setBudgetOnboardingSeen = store.setBudgetOnboardingSeen;
  const getBudgetProgress = store.getBudgetProgress;
  const getBudgetHealthCheck = store.getBudgetHealthCheck;

  // State
  const [activeTab, setActiveTab] = useState<BudgetTab>("active");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | undefined>(undefined);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check onboarding on mount
  useEffect(() => {
    if (!budgetOnboardingSeen) {
      setShowOnboarding(true);
    }
  }, [budgetOnboardingSeen]);

  // Renew expired budgets on mount
  useEffect(() => {
    useBudgetStore.getState().renewExpiredBudgets();
  }, []);

  // Reopen modal if returning from creating a category
  useEffect(() => {
    const newCategoryId = sessionStorage.getItem("newCategoryId");
    if (newCategoryId) {
      // Modal will pick up the category from sessionStorage
      setShowAddBudgetModal(true);
    }
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

  // Get all budgets for current period (active + completed)
  const { activeBudgets, completedBudgets } = useMemo(() => {
    const filtered = budgets.filter((b) => {
      // Include both active and completed budgets
      if (b.status !== "active" && b.status !== "completed") return false;

      // Check if budget period overlaps with current period
      const budgetStart = new Date(b.period.startDate);
      const budgetEnd = new Date(b.period.endDate);
      const periodStart = new Date(currentPeriod.startDate);
      const periodEnd = new Date(currentPeriod.endDate);

      return budgetStart <= periodEnd && budgetEnd >= periodStart;
    });

    return {
      activeBudgets: filtered.filter((b) => b.status === "active"),
      completedBudgets: filtered.filter((b) => b.status === "completed"),
    };
  }, [budgets, currentPeriod]);

  // Filter budgets by active tab
  const displayedBudgets = activeTab === "active" ? activeBudgets : completedBudgets;

  // Show tabs only when there are completed budgets
  const showTabs = completedBudgets.length > 0;

  // Calculate health check
  const healthCheck = useMemo(() => {
    return getBudgetHealthCheck();
  }, [getBudgetHealthCheck]);

  const handleBudgetClick = (budgetId: string) => {
    // Navigate to detail page instead of opening modal
    navigate(`/plan/${budgetId}`);
  };

  const handleCloseModal = () => {
    setShowAddBudgetModal(false);
    setEditingBudgetId(undefined);
  };

  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
        <main className="mx-auto max-w-xl px-4 pt-6 pb-28">
          {/* Tabs (only show when there are completed budgets) */}
          {showTabs && (
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("active")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wide transition-all ${
                  activeTab === "active"
                    ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                }`}
              >
                <Clock size={14} strokeWidth={2.5} />
                {t("page.activeTab")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("completed")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wide transition-all ${
                  activeTab === "completed"
                    ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                }`}
              >
                <CheckCircle size={14} strokeWidth={2.5} />
                {t("page.completedTab")}
              </button>
            </div>
          )}

          {/* Budget Alert Predictions */}
          {activeTab === "active" && <BudgetAlertsSection />}

          {/* Health Check Section (only show when activeTab is "active") */}
          {activeTab === "active" && (healthCheck.exceededLimits > 0 || healthCheck.totalGoals > 0) && (
            <div className="mb-6 space-y-3">
              {healthCheck.exceededLimits > 0 && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/30 p-3 border border-red-200 dark:border-red-800">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    ⚠️ {t("page.limitsExceeded", { count: healthCheck.exceededLimits })}
                  </p>
                </div>
              )}

              {healthCheck.totalGoals > 0 && (
                <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 p-3 border border-teal-200 dark:border-teal-800">
                  <p className="text-sm font-medium text-teal-700 dark:text-teal-400">
                    🎯 {t("page.goalsProgress", { percentage: healthCheck.goalPercentage })}
                  </p>
                </div>
              )}
            </div>
          )}

          {displayedBudgets.length === 0 ? (
            activeTab === "completed" ? (
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("page.noCompletedPlans")}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddBudgetModal(true)}
                className="w-full rounded-2xl bg-white dark:bg-gray-800 p-8 text-center shadow-sm dark:shadow-none transition-all hover:bg-gray-50 dark:hover:bg-gray-750 active:scale-[0.99]"
              >
                {/* Icon Circle with Plus */}
                <div className="mb-6 flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#18B7B0]/30 bg-[#18B7B0]/10">
                    <Plus size={32} className="text-[#18B7B0]" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Title */}
                <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                  {t("page.noPlansTitle")}
                </h3>

                {/* Description */}
                <p className="mb-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {t("page.noPlansDescription")}
                </p>

                {/* CTA Text */}
                <span className="text-sm font-bold uppercase tracking-wide text-[#18B7B0]">
                  {t("page.createFirstPlan")}
                </span>
              </button>
            )
          ) : (
            <div className="space-y-3">
              {displayedBudgets.map((budget) => {
                const progress = getBudgetProgress(budget.id);
                if (!progress) return null;

                return (
                  <BudgetCard
                    key={budget.id}
                    progress={progress}
                    onClick={() => handleBudgetClick(budget.id)}
                  />
                );
              })}
            </div>
          )}
        </main>

        {/* FAB - Add Budget */}
        {(activeBudgets.length > 0 || completedBudgets.length > 0) && (
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
