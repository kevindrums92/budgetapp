import type { Budget, Transaction } from "@/types/budget.types";
import type { BudgetPrediction } from "../types/forecasting.types";
import { todayISO } from "@/services/dates.service";
import {
  isDateInPeriod,
  isPeriodActive,
} from "@/features/budget/utils/period.utils";

/**
 * Calculate the burn rate and predict when a budget will be exceeded.
 */
function calculateBudgetBurnRate(
  budget: Budget,
  transactions: Transaction[],
  today: string
): {
  daysUntilExceeded: number | null;
  dailyBurnRate: number;
  projectedTotal: number;
  currentSpent: number;
} {
  const relevantTxs = transactions.filter(
    (tx) =>
      tx.category === budget.categoryId &&
      tx.type === "expense" &&
      isDateInPeriod(tx.date, budget.period) &&
      tx.date <= today
  );

  const spent = relevantTxs.reduce((sum, tx) => sum + tx.amount, 0);

  const periodStart = new Date(budget.period.startDate + "T12:00:00");
  const periodEnd = new Date(budget.period.endDate + "T12:00:00");
  const todayDate = new Date(today + "T12:00:00");

  const daysElapsed = Math.max(
    1,
    Math.round(
      (todayDate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    )
  );
  const totalDays = Math.round(
    (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.max(0, totalDays - daysElapsed);

  const dailyBurnRate = spent / daysElapsed;
  const projectedTotal = spent + dailyBurnRate * daysRemaining;

  if (projectedTotal <= budget.amount || spent >= budget.amount) {
    return {
      daysUntilExceeded: spent >= budget.amount ? 0 : null,
      dailyBurnRate,
      projectedTotal,
      currentSpent: spent,
    };
  }

  const remaining = budget.amount - spent;
  const daysUntilExceeded =
    dailyBurnRate > 0 ? Math.ceil(remaining / dailyBurnRate) : null;

  return { daysUntilExceeded, dailyBurnRate, projectedTotal, currentSpent: spent };
}

/**
 * Predict when a budget will be exceeded.
 * Returns null if budget is not at risk (>14 days or won't exceed).
 */
export function predictBudgetExceeded(
  budget: Budget,
  transactions: Transaction[]
): BudgetPrediction | null {
  const today = todayISO();

  // Only predict for active limit budgets in current period
  if (
    budget.status !== "active" ||
    budget.type !== "limit" ||
    !isPeriodActive(budget.period, today)
  ) {
    return null;
  }

  const { daysUntilExceeded, dailyBurnRate, projectedTotal, currentSpent } =
    calculateBudgetBurnRate(budget, transactions, today);

  // Already exceeded
  if (daysUntilExceeded === 0) {
    return {
      budgetId: budget.id,
      categoryId: budget.categoryId,
      daysUntilExceeded: 0,
      dailyBurnRate: Math.round(dailyBurnRate),
      projectedTotal: Math.round(projectedTotal),
      budgetLimit: budget.amount,
      currentSpent: Math.round(currentSpent),
      urgency: "high",
    };
  }

  // Not at risk or too far away
  if (daysUntilExceeded === null || daysUntilExceeded > 14) {
    return null;
  }

  let urgency: "high" | "medium" | "low";
  if (daysUntilExceeded <= 3) urgency = "high";
  else if (daysUntilExceeded <= 7) urgency = "medium";
  else urgency = "low";

  return {
    budgetId: budget.id,
    categoryId: budget.categoryId,
    daysUntilExceeded,
    dailyBurnRate: Math.round(dailyBurnRate),
    projectedTotal: Math.round(projectedTotal),
    budgetLimit: budget.amount,
    currentSpent: Math.round(currentSpent),
    urgency,
  };
}

/**
 * Get burn rate analysis for a budget regardless of risk level.
 * Returns null only if budget is not active, not limit, or not in current period.
 * Unlike predictBudgetExceeded, this always returns data for valid budgets.
 */
export function getBudgetAnalysis(
  budget: Budget,
  transactions: Transaction[]
): BudgetPrediction | null {
  const today = todayISO();

  if (
    budget.status !== "active" ||
    budget.type !== "limit" ||
    !isPeriodActive(budget.period, today)
  ) {
    return null;
  }

  const { daysUntilExceeded, dailyBurnRate, projectedTotal, currentSpent } =
    calculateBudgetBurnRate(budget, transactions, today);

  // Already exceeded
  if (daysUntilExceeded === 0) {
    return {
      budgetId: budget.id,
      categoryId: budget.categoryId,
      daysUntilExceeded: 0,
      dailyBurnRate: Math.round(dailyBurnRate),
      projectedTotal: Math.round(projectedTotal),
      budgetLimit: budget.amount,
      currentSpent: Math.round(currentSpent),
      urgency: "high",
    };
  }

  // Won't exceed within the period
  if (daysUntilExceeded === null) {
    return {
      budgetId: budget.id,
      categoryId: budget.categoryId,
      daysUntilExceeded: -1,
      dailyBurnRate: Math.round(dailyBurnRate),
      projectedTotal: Math.round(projectedTotal),
      budgetLimit: budget.amount,
      currentSpent: Math.round(currentSpent),
      urgency: "safe",
    };
  }

  // Will exceed — assign urgency without the 14-day filter
  let urgency: "high" | "medium" | "low";
  if (daysUntilExceeded <= 3) urgency = "high";
  else if (daysUntilExceeded <= 7) urgency = "medium";
  else urgency = "low";

  return {
    budgetId: budget.id,
    categoryId: budget.categoryId,
    daysUntilExceeded,
    dailyBurnRate: Math.round(dailyBurnRate),
    projectedTotal: Math.round(projectedTotal),
    budgetLimit: budget.amount,
    currentSpent: Math.round(currentSpent),
    urgency,
  };
}

/**
 * Get all budget predictions sorted by urgency (soonest first).
 */
export function getAllBudgetPredictions(
  budgets: Budget[],
  transactions: Transaction[]
): BudgetPrediction[] {
  return budgets
    .map((budget) => predictBudgetExceeded(budget, transactions))
    .filter((p): p is BudgetPrediction => p !== null)
    .sort((a, b) => a.daysUntilExceeded - b.daysUntilExceeded);
}
