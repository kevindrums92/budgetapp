import { useMemo, useState } from "react";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBudgetStore } from "@/state/budget.store";
import { getAllBudgetPredictions } from "../services/budgetPrediction.service";
import BudgetAlertCard from "./BudgetAlertCard";
import BudgetAlertDetailSheet from "./BudgetAlertDetailSheet";
import type { BudgetPrediction } from "../types/forecasting.types";

export default function BudgetAlertsSection() {
  const { t } = useTranslation("forecasting");
  const transactions = useBudgetStore((s) => s.transactions);
  const budgets = useBudgetStore((s) => s.budgets);
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const [selectedPrediction, setSelectedPrediction] =
    useState<BudgetPrediction | null>(null);

  const predictions = useMemo(() => {
    // Alerts only make sense for the current month (burn rate predictions)
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    if (selectedMonth !== currentMonthKey) return [];
    return getAllBudgetPredictions(budgets, transactions);
  }, [budgets, transactions, selectedMonth]);

  if (predictions.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield size={16} className="text-red-500" />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t("budgetAlerts.title")}
        </h3>
      </div>

      <div className="space-y-3">
        {predictions.slice(0, 3).map((prediction) => (
          <BudgetAlertCard
            key={prediction.budgetId}
            prediction={prediction}
            onClick={() => setSelectedPrediction(prediction)}
          />
        ))}
      </div>

      <BudgetAlertDetailSheet
        open={!!selectedPrediction}
        onClose={() => setSelectedPrediction(null)}
        prediction={selectedPrediction}
      />
    </div>
  );
}
