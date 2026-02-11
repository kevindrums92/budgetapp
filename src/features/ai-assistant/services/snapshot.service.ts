/**
 * Snapshot Service
 * Builds a FULL FinancialSnapshot from BudgetState for the AI assistant.
 * Sends ALL user data so the model can answer any question.
 * Gemini 2.5 Flash-Lite has 1M token context — even 1000+ transactions are fine.
 */

import type { Transaction, Category, CategoryGroup, Budget, BudgetProgress, Trip, TripExpense } from "@/types/budget.types";
import type {
  FinancialSnapshot,
  TransactionCompact,
  CategoryCompact,
  BudgetSnapshot,
  TripSnapshot,
  MonthSummary,
} from "../types/assistant.types";

type SnapshotInput = {
  transactions: Transaction[];
  categoryDefinitions: Category[];
  categoryGroups: CategoryGroup[];
  budgets: Budget[];
  trips: Trip[];
  tripExpenses: TripExpense[];
  getBudgetProgress: (budgetId: string) => BudgetProgress | null;
  getBudgetHealthCheck: () => {
    exceededLimits: number;
    totalLimits: number;
    goalPercentage: number;
    totalGoals: number;
  };
  currency: string;
  locale: string;
};

/**
 * Build a FULL FinancialSnapshot from the current BudgetState.
 * Includes ALL transactions, categories, budgets, and trips.
 */
export function buildFinancialSnapshot(input: SnapshotInput): FinancialSnapshot {
  // Build category name lookup
  const catNameMap = new Map<string, string>();
  for (const cat of input.categoryDefinitions) {
    catNameMap.set(cat.id, cat.name);
  }

  // Build category group name lookup
  const groupNameMap = new Map<string, string>();
  for (const g of input.categoryGroups) {
    groupNameMap.set(g.id, g.name);
  }

  // ALL transactions in compact format (sorted by date desc)
  const sortedTxns = [...input.transactions].sort(
    (a, b) => b.date.localeCompare(a.date),
  );

  const transactions: TransactionCompact[] = sortedTxns.map((t) => ({
    date: t.date,
    name: t.name,
    category: catNameMap.get(t.category) || t.category,
    amount: t.amount,
    type: t.type,
  }));

  // ALL categories
  const categories: CategoryCompact[] = input.categoryDefinitions.map((c) => ({
    name: c.name,
    type: c.type,
    group: groupNameMap.get(c.groupId) || "Sin grupo",
  }));

  // ALL budgets with progress
  const budgets: BudgetSnapshot[] = input.budgets
    .map((b) => {
      const progress = input.getBudgetProgress(b.id);
      if (!progress) return null;

      return {
        categoryName: progress.category.name,
        type: b.type,
        amount: b.amount,
        spent: progress.spent,
        saved: progress.saved,
        percentage: Math.round(progress.percentage * 10) / 10,
        remaining: progress.remaining,
        isExceeded: progress.isExceeded,
        isCompleted: progress.isCompleted,
        status: b.status,
        isRecurring: b.isRecurring,
        period: {
          type: b.period.type,
          startDate: b.period.startDate,
          endDate: b.period.endDate,
        },
      };
    })
    .filter((b): b is BudgetSnapshot => b !== null);

  // ALL trips with expenses
  const trips: TripSnapshot[] = input.trips.map((trip) => {
    const expenses = input.tripExpenses
      .filter((e) => e.tripId === trip.id)
      .map((e) => ({
        name: e.name,
        amount: e.amount,
        category: e.category,
        date: e.date,
      }));

    const spent = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      name: trip.name,
      destination: trip.destination,
      budget: trip.budget,
      spent,
      startDate: trip.startDate,
      endDate: trip.endDate,
      status: trip.status,
      expenses,
    };
  });

  // Monthly breakdown for ALL months
  const monthMap = new Map<string, { income: number; expenses: number; count: number }>();
  for (const t of input.transactions) {
    const monthKey = t.date.slice(0, 7);
    const existing = monthMap.get(monthKey) || { income: 0, expenses: 0, count: 0 };
    if (t.type === "income") {
      existing.income += t.amount;
    } else {
      existing.expenses += t.amount;
    }
    existing.count += 1;
    monthMap.set(monthKey, existing);
  }

  const monthlyBreakdown: MonthSummary[] = Array.from(monthMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, data]) => ({
      key,
      income: data.income,
      expenses: data.expenses,
      balance: data.income - data.expenses,
      transactionCount: data.count,
    }));

  // Summary stats
  const totalIncome = input.transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = input.transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const dates = input.transactions.map((t) => t.date).sort();

  return {
    transactions,
    categories,
    budgets,
    trips,
    summary: {
      totalTransactions: input.transactions.length,
      totalIncome,
      totalExpenses,
      firstTransactionDate: dates[0] || null,
      lastTransactionDate: dates[dates.length - 1] || null,
      monthlyBreakdown,
    },
    budgetHealthCheck: input.getBudgetHealthCheck(),
    currency: input.currency,
    locale: input.locale,
  };
}
