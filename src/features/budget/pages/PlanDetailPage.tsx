import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useBudgetStore } from "@/state/budget.store";
import { useCurrency } from "@/features/currency";
import { icons, Trash2, TrendingDown } from "lucide-react";
import { kebabToPascal } from "@/shared/utils/string.utils";
import PageHeader from "@/shared/components/layout/PageHeader";
import AddEditBudgetModal from "@/features/budget/components/AddEditBudgetModal";
import BudgetAlertDetailSheet from "@/features/forecasting/components/BudgetAlertDetailSheet";
import { getBudgetAnalysis } from "@/features/forecasting/services/budgetPrediction.service";

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const { t } = useTranslation("forecasting");

  const store = useBudgetStore();
  const getBudgetProgress = store.getBudgetProgress;
  const deleteBudget = store.deleteBudget;
  const transactions = store.transactions;
  const budgets = store.budgets;

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Get budget progress
  const progress = useMemo(() => {
    if (!id) return null;
    return getBudgetProgress(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- budgets triggers recompute when budget is edited/deleted
  }, [id, getBudgetProgress, budgets]);

  // Filter transactions for this budget's category within the period
  const relevantTransactions = useMemo(() => {
    if (!progress) return [];

    return transactions
      .filter((tx) => {
        if (tx.category !== progress.budget.categoryId) return false;
        if (progress.budget.type === "limit" && tx.type !== "expense") return false;
        if (progress.budget.type === "goal" && tx.type !== "expense") return false;

        return tx.date >= progress.budget.period.startDate && tx.date <= progress.budget.period.endDate;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, progress]);

  // Calculate intelligent metrics
  const intelligentMetrics = useMemo(() => {
    if (!progress) return null;

    const isCompletedBudget = progress.budget.status === "completed";

    if (isCompletedBudget) {
      // For completed budgets, show final results
      const startDate = new Date(progress.budget.period.startDate + "T12:00:00");
      const endDate = new Date(progress.budget.period.endDate + "T12:00:00");
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const dailyAverage = progress.budget.type === "limit" ? progress.spent / totalDays : progress.saved / totalDays;

      return {
        type: progress.budget.type,
        dailyAverage,
        totalDays,
        isCompleted: true as const,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const endDate = new Date(progress.budget.period.endDate + "T23:59:59"); // End of the day
    const daysRemaining = Math.max(1, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    if (progress.budget.type === "limit") {
      // Daily suggestion for limits
      const dailySuggestion = progress.remaining / daysRemaining;
      return {
        type: "limit" as const,
        dailySuggestion,
        daysRemaining,
        isCompleted: false as const,
      };
    } else {
      // Daily suggestion for goals (how much to save per day to reach goal)
      const dailySuggestion = progress.remaining / daysRemaining;

      return {
        type: "goal" as const,
        dailySuggestion,
        daysRemaining,
        isCompleted: false as const,
      };
    }
  }, [progress]);

  // Burn rate analysis (only for active limit budgets in current period)
  const budgetAnalysis = useMemo(() => {
    if (!progress) return null;
    return getBudgetAnalysis(progress.budget, transactions);
  }, [progress, transactions]);

  // Redirect if budget not found
  useEffect(() => {
    if (id && !progress) {
      navigate("/plan", { replace: true });
    }
  }, [id, progress, navigate]);

  if (!progress || !id || !intelligentMetrics) return null;

  const { budget, category, spent, saved, percentage, remaining, isExceeded, isCompleted } = progress;

  const isCompletedBudget = budget.status === "completed";

  const IconComponent = icons[kebabToPascal(category.icon) as keyof typeof icons];

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
    });
  };

  const handleDelete = () => {
    deleteBudget(id);
    navigate("/plan", { replace: true });
  };

  // Progress bar color
  const getProgressColor = () => {
    if (budget.type === "limit") {
      if (isExceeded) return "#EF4444"; // red-500
      if (percentage >= 90) return "#EAB308"; // yellow-500
      return "#18B7B0"; // teal
    } else {
      return "#18B7B0"; // teal
    }
  };

  return (
    <>
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
        {/* Header */}
        <PageHeader
          title="Detalle del Plan"
          rightActions={
            <div className="flex items-center gap-2">
              {!isCompletedBudget && (
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="h-5 w-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-full p-2 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                <Trash2 className="h-5 w-5 text-red-500" />
              </button>
            </div>
          }
        />

        {/* Content */}
        <div className="flex-1 px-4 pt-6 pb-8">
          {/* Hero Card */}
          <div className="mb-6 rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm">
            {/* Icon + Name */}
            <div className="mb-4 flex items-center justify-center">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl"
                style={{ backgroundColor: category.color + "30" }}
              >
                {IconComponent && (
                  <IconComponent className="h-10 w-10" style={{ color: category.color }} />
                )}
              </div>
            </div>

            <h1 className="mb-1 text-center text-xl font-bold text-gray-900 dark:text-gray-50">
              {category.name}
            </h1>
            <div className="mb-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {budget.type === "limit" ? "Límite de Gasto" : "Meta de Ahorro"}
                </p>
                {isCompletedBudget && (
                  <span className="rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                    Completado
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {formatDate(budget.period.startDate)} – {formatDate(budget.period.endDate)}
                {!intelligentMetrics.isCompleted
                  ? ` · ${intelligentMetrics.daysRemaining} días restantes`
                  : ` · ${intelligentMetrics.totalDays} días`
                }
              </p>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={`text-3xl font-bold ${
                    budget.type === "limit"
                      ? isExceeded
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-900 dark:text-gray-50"
                      : "text-teal-600 dark:text-teal-400"
                  }`}
                >
                  {Math.round(percentage)}%
                </span>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {budget.type === "limit" ? "Total Gastado" : "Total Aportado"}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    {formatAmount(budget.type === "limit" ? spent : saved)}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-2 h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: getProgressColor(),
                  }}
                />
              </div>

              <div className="flex items-center justify-end text-sm">
                <span className="font-medium text-gray-900 dark:text-gray-50">
                  Objetivo {formatAmount(budget.amount)}
                </span>
              </div>
            </div>

            {/* Status Message */}
            {budget.type === "limit" && isExceeded && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/30 p-3 border border-red-200 dark:border-red-800">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Te pasaste por {formatAmount(Math.abs(remaining))}
                </p>
              </div>
            )}

            {budget.type === "goal" && isCompleted && (
              <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 p-3 border border-teal-200 dark:border-teal-800">
                <p className="text-sm font-medium text-teal-700 dark:text-teal-400">
                  ¡Meta alcanzada! 🎉
                </p>
              </div>
            )}
          </div>

          {/* Burn Rate Analysis Link */}
          {budgetAnalysis && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowAnalysis(true)}
                className="w-full flex items-center justify-between rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm transition-colors active:bg-gray-50 dark:active:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    budgetAnalysis.urgency === "safe"
                      ? "bg-emerald-500/10 dark:bg-emerald-500/20"
                      : budgetAnalysis.urgency === "high"
                        ? "bg-red-500/10 dark:bg-red-500/20"
                        : "bg-orange-500/10 dark:bg-orange-500/20"
                  }`}>
                    <TrendingDown size={18} className={
                      budgetAnalysis.urgency === "safe"
                        ? "text-emerald-500"
                        : budgetAnalysis.urgency === "high"
                          ? "text-red-500"
                          : "text-orange-500"
                    } />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                      {t("budgetAlerts.dailyRate", { amount: formatAmount(budgetAnalysis.dailyBurnRate) })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {intelligentMetrics && !intelligentMetrics.isCompleted && intelligentMetrics.dailySuggestion > 0
                        ? t("budgetAlerts.dailyTarget", { amount: formatAmount(intelligentMetrics.dailySuggestion) })
                        : budgetAnalysis.daysUntilExceeded === 0
                          ? t("budgetAlerts.alreadyExceeded")
                          : t("budgetAlerts.projected", { amount: formatAmount(budgetAnalysis.projectedTotal) })
                      }
                    </p>
                  </div>
                </div>
                <svg className="h-5 w-5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Recent Activity */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
              Actividad Reciente
            </h3>

            {relevantTransactions.length === 0 ? (
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay movimientos registrados aún
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {relevantTransactions.slice(0, 10).map((tx) => (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => navigate(`/edit/${tx.id}`)}
                    className="w-full flex items-center gap-3 rounded-xl bg-white dark:bg-gray-900 p-3 shadow-sm text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {/* Icon */}
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: category.color + "20" }}
                    >
                      {IconComponent && (
                        <IconComponent className="h-5 w-5" style={{ color: category.color }} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
                        {tx.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(tx.date)}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p
                        className={`whitespace-nowrap text-sm font-semibold ${
                          budget.type === "goal"
                            ? "text-teal-600 dark:text-teal-400"
                            : "text-gray-900 dark:text-gray-50"
                        }`}
                      >
                        {budget.type === "goal" ? "+" : "-"}
                        {formatAmount(tx.amount)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal (only for active budgets) */}
      {!isCompletedBudget && (
        <AddEditBudgetModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          budgetId={id}
        />
      )}

      {/* Burn Rate Analysis Sheet */}
      <BudgetAlertDetailSheet
        open={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        prediction={budgetAnalysis}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              Eliminar Plan
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {isCompletedBudget
                ? `¿Estás seguro de que deseas eliminar este plan completado de "${category.name}"? Se perderá todo el historial del período. Esta acción no se puede deshacer.`
                : `¿Estás seguro de que deseas eliminar "${category.name}" de tu plan? Esta acción no se puede deshacer.`
              }
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
