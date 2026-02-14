import type { Transaction } from "@/types/budget.types";
import type { BalanceProjection } from "../types/forecasting.types";
import { todayISO } from "@/services/dates.service";
import { generateVirtualTransactions } from "@/shared/services/scheduler.service";

/**
 * Get month key (YYYY-MM) for a date offset from a reference month.
 * offset=0 returns the reference month, -1 returns previous, etc.
 */
function getMonthKeyOffset(referenceMonth: string, offset: number): string {
  const [year, month] = referenceMonth.split("-").map(Number);
  const d = new Date(year, month - 1 + offset, 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

/**
 * Add days to a date string and return YYYY-MM-DD.
 */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calculate weighted moving average for expenses or income.
 * Uses last N months with descending weights (recent months weighted higher).
 * Weights: most recent = N, second = N-1, ..., oldest = 1
 */
export function calculateWeightedAverage(
  transactions: Transaction[],
  type: "income" | "expense",
  months: number = 3,
  referenceMonth?: string
): number {
  const today = todayISO();
  const refMonth = referenceMonth || today.slice(0, 7);

  const monthlyTotals: number[] = [];

  for (let i = 1; i <= months; i++) {
    const monthKey = getMonthKeyOffset(refMonth, -i);
    const total = transactions
      .filter((tx) => tx.type === type && tx.date.slice(0, 7) === monthKey)
      .reduce((sum, tx) => sum + tx.amount, 0);
    monthlyTotals.push(total);
  }

  // Weights: most recent = months, second = months-1, ..., oldest = 1
  const weights = monthlyTotals.map((_, idx) => months - idx);
  const weightedSum = monthlyTotals.reduce(
    (sum, total, idx) => sum + total * weights[idx],
    0
  );
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Calculate current balance from all transactions up to today.
 */
export function calculateCurrentBalance(transactions: Transaction[]): number {
  const today = todayISO();
  return transactions
    .filter((tx) => tx.date <= today)
    .reduce((balance, tx) => {
      return tx.type === "income"
        ? balance + tx.amount
        : balance - tx.amount;
    }, 0);
}

/**
 * Calculate the net impact of scheduled transactions in a date range.
 */
function calculateScheduledImpact(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): { income: number; expense: number } {
  const virtualTxs = generateVirtualTransactions(transactions, startDate);

  // generateVirtualTransactions returns only the NEXT occurrence for each template.
  // We also need to check all templates and project their occurrences in the range.
  const templates = transactions.filter((tx) => tx.schedule?.enabled);

  let income = 0;
  let expense = 0;

  // Count virtual transactions that fall in range
  for (const vt of virtualTxs) {
    if (vt.date > startDate && vt.date <= endDate) {
      if (vt.type === "income") income += vt.amount;
      else expense += vt.amount;
    }
  }

  // For longer projections, estimate recurring impact based on frequency
  for (const template of templates) {
    if (!template.schedule) continue;
    const freq = template.schedule.frequency;
    const interval = template.schedule.interval;

    const startD = new Date(startDate + "T12:00:00");
    const endD = new Date(endDate + "T12:00:00");
    const rangeDays =
      Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));

    let occurrencesInRange = 0;
    switch (freq) {
      case "daily":
        occurrencesInRange = Math.floor(rangeDays / interval);
        break;
      case "weekly":
        occurrencesInRange = Math.floor(rangeDays / (7 * interval));
        break;
      case "monthly":
        occurrencesInRange = Math.floor(rangeDays / (30 * interval));
        break;
      case "yearly":
        occurrencesInRange = Math.floor(rangeDays / (365 * interval));
        break;
    }

    // Subtract the ones we already counted from virtualTxs
    const alreadyCounted = virtualTxs.filter(
      (vt) =>
        vt.templateId === template.id &&
        vt.date > startDate &&
        vt.date <= endDate
    ).length;

    const remaining = Math.max(0, occurrencesInRange - alreadyCounted);

    if (template.type === "income") income += remaining * template.amount;
    else expense += remaining * template.amount;
  }

  return { income, expense };
}

/**
 * Project future balance for N days ahead.
 * Combines weighted moving average + scheduled transactions.
 * Returns projection points at 0, 30, 60, 90 day intervals.
 */
export function projectFutureBalance(
  transactions: Transaction[],
  days: number = 90
): BalanceProjection[] {
  const today = todayISO();
  const currentBalance = calculateCurrentBalance(transactions);

  const avgMonthlyIncome = calculateWeightedAverage(transactions, "income", 3);
  const avgMonthlyExpense = calculateWeightedAverage(
    transactions,
    "expense",
    3
  );

  const projections: BalanceProjection[] = [];

  // Generate projection points every 30 days
  const intervals = Array.from(
    { length: Math.floor(days / 30) + 1 },
    (_, i) => i * 30
  );

  for (const dayOffset of intervals) {
    if (dayOffset === 0) {
      projections.push({
        date: today,
        balance: Math.round(currentBalance),
        dayOffset: 0,
      });
      continue;
    }

    const projectedDate = addDays(today, dayOffset);
    const monthsFraction = dayOffset / 30;

    // Estimate from averages
    const avgIncome = avgMonthlyIncome * monthsFraction;
    const avgExpense = avgMonthlyExpense * monthsFraction;

    // Factor in known scheduled transactions
    const scheduled = calculateScheduledImpact(
      transactions,
      today,
      projectedDate
    );

    // Blend: use scheduled data where available, fill gaps with average
    const projectedBalance =
      currentBalance +
      avgIncome -
      avgExpense +
      scheduled.income -
      scheduled.expense;

    projections.push({
      date: projectedDate,
      balance: Math.round(projectedBalance),
      dayOffset,
    });
  }

  return projections;
}

/**
 * Determine the color zone for a projected balance.
 */
export function getBalanceZone(
  balance: number,
  avgMonthlyIncome: number
): "green" | "yellow" | "red" {
  if (avgMonthlyIncome <= 0) {
    return balance > 0 ? "green" : "red";
  }

  const threshold = avgMonthlyIncome * 0.2;

  if (balance >= threshold) return "green";
  if (balance > 0) return "yellow";
  return "red";
}

/**
 * Check if there's enough historical data for projections.
 * Returns the number of months with transaction data.
 */
export function getHistoryMonths(transactions: Transaction[]): number {
  if (transactions.length === 0) return 0;

  const monthSet = new Set<string>();
  for (const tx of transactions) {
    monthSet.add(tx.date.slice(0, 7));
  }

  return monthSet.size;
}
