/**
 * PDF Data Service
 * Pure functions that aggregate store data into report-ready shapes.
 * No React hooks — these receive raw data as parameters.
 */

import type { Transaction, Category, Trip, TripExpense, TripExpenseCategory } from '@/types/budget.types';
import type { CurrencyInfo } from '@/features/currency/utils/currency.constants';
import { formatTimestamp, getDayOfWeek } from '../utils/pdf-format';

// ==================== TYPES ====================

export interface PDFCurrencyInfo {
  code: string;
  symbol: string;
  locale: string;
  decimals: number;
}

export interface CategoryBreakdownItem {
  name: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface TransactionRow {
  date: string;
  name: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  type: 'income' | 'expense';
}

export interface FinancialReportLabels {
  title: string;
  totalIncome: string;
  totalExpenses: string;
  netBalance: string;
  savingsRate: string;
  transactionsInPeriod: string;
  expensesByCategory: string;
  analysis: string;
  dailyAverage: string;
  topCategory: string;
  topDay: string;
  daysInRange: string;
  transactionDetails: string;
  generatedWith: string;
}

export interface FinancialReportData {
  dateRange: { start: string; end: string };
  currencyInfo: PDFCurrencyInfo;
  labels: FinancialReportLabels;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    savingsRate: number;
    transactionCount: number;
  };
  categoryBreakdown: CategoryBreakdownItem[];
  transactions: TransactionRow[];
  insights: {
    dailyAverage: number;
    topCategory: { name: string; amount: number } | null;
    topDay: { name: string; amount: number } | null;
    daysInRange: number;
  };
  generatedAt: string;
  locale: string;
}

export interface TripReportLabels {
  title: string;
  budget: string;
  spent: string;
  available: string;
  exceeded: string;
  budgetUsed: string;
  expensesByCategory: string;
  expenseDetails: string;
  total: string;
  generatedWith: string;
  since: string;
  statusPlanning: string;
  statusActive: string;
  statusCompleted: string;
  categoryTransport: string;
  categoryAccommodation: string;
  categoryFood: string;
  categoryActivities: string;
  categoryShopping: string;
  categoryOther: string;
}

export interface TripReportData {
  trip: Trip;
  currencyInfo: PDFCurrencyInfo;
  labels: TripReportLabels;
  summary: {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    isOverBudget: boolean;
    progressPercent: number;
  };
  categoryBreakdown: Array<{
    category: TripExpenseCategory;
    name: string;
    amount: number;
    percentage: number;
  }>;
  expenses: Array<{
    date: string;
    name: string;
    category: TripExpenseCategory;
    amount: number;
    notes?: string;
  }>;
  generatedAt: string;
  locale: string;
}

// ==================== FINANCIAL REPORT ====================

const MAX_TRANSACTIONS_IN_PDF = 200;
const MAX_CATEGORIES_IN_BREAKDOWN = 8;

export function prepareFinancialReportData(
  transactions: Transaction[],
  categories: Category[],
  startDate: string,
  endDate: string,
  currencyInfo: CurrencyInfo,
  locale: string,
  labels: FinancialReportLabels,
): FinancialReportData {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Filter transactions in date range
  const filtered = transactions.filter(
    (tx) => tx.date >= startDate && tx.date <= endDate,
  );

  // Summary
  const totalIncome = filtered
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpenses = filtered
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const netBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0
    ? Math.round((netBalance / totalIncome) * 100)
    : 0;

  // Category breakdown (expenses only, top N)
  const categoryTotals = new Map<string, number>();
  for (const tx of filtered) {
    if (tx.type !== 'expense') continue;
    const current = categoryTotals.get(tx.category) ?? 0;
    categoryTotals.set(tx.category, current + tx.amount);
  }

  const sortedCategories = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_CATEGORIES_IN_BREAKDOWN);

  const categoryBreakdown: CategoryBreakdownItem[] = sortedCategories.map(
    ([catId, amount]) => {
      const cat = categoryMap.get(catId);
      return {
        name: cat?.name ?? catId,
        color: cat?.color ?? '#9CA3AF',
        amount,
        percentage: totalExpenses > 0
          ? Math.round((amount / totalExpenses) * 100)
          : 0,
      };
    },
  );

  // Transaction rows (sorted by date desc, limited)
  const txRows: TransactionRow[] = filtered
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_TRANSACTIONS_IN_PDF)
    .map((tx) => {
      const cat = categoryMap.get(tx.category);
      return {
        date: tx.date,
        name: tx.name,
        categoryName: cat?.name ?? tx.category,
        categoryColor: cat?.color ?? '#9CA3AF',
        amount: tx.amount,
        type: tx.type,
      };
    });

  // Insights
  const startMs = new Date(startDate + 'T00:00:00').getTime();
  const endMs = new Date(endDate + 'T23:59:59').getTime();
  const daysInRange = Math.max(1, Math.ceil((endMs - startMs) / 86400000));

  const dailyAverage = totalExpenses / daysInRange;

  // Top category
  const topCategoryEntry = sortedCategories[0] ?? null;
  const topCategory = topCategoryEntry
    ? {
        name: categoryMap.get(topCategoryEntry[0])?.name ?? topCategoryEntry[0],
        amount: topCategoryEntry[1],
      }
    : null;

  // Top day of week
  const dayTotals = new Map<string, number>();
  for (const tx of filtered) {
    if (tx.type !== 'expense') continue;
    const day = getDayOfWeek(tx.date, locale);
    dayTotals.set(day, (dayTotals.get(day) ?? 0) + tx.amount);
  }
  const topDayEntry = [...dayTotals.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  const topDay = topDayEntry
    ? { name: topDayEntry[0], amount: topDayEntry[1] }
    : null;

  return {
    dateRange: { start: startDate, end: endDate },
    currencyInfo: {
      code: currencyInfo.code,
      symbol: currencyInfo.symbol,
      locale: currencyInfo.locale,
      decimals: currencyInfo.decimals,
    },
    labels,
    summary: {
      totalIncome,
      totalExpenses,
      netBalance,
      savingsRate,
      transactionCount: filtered.length,
    },
    categoryBreakdown,
    transactions: txRows,
    insights: {
      dailyAverage,
      topCategory,
      topDay,
      daysInRange,
    },
    generatedAt: formatTimestamp(locale),
    locale,
  };
}

// ==================== TRIP REPORT ====================

export function prepareTripReportData(
  trip: Trip,
  tripExpenses: TripExpense[],
  currencyInfo: CurrencyInfo,
  locale: string,
  labels: TripReportLabels,
): TripReportData {
  const tripCategoryLabels: Record<TripExpenseCategory, string> = {
    transport: labels.categoryTransport,
    accommodation: labels.categoryAccommodation,
    food: labels.categoryFood,
    activities: labels.categoryActivities,
    shopping: labels.categoryShopping,
    other: labels.categoryOther,
  };
  const expenses = tripExpenses
    .filter((e) => e.tripId === trip.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = trip.budget - totalSpent;
  const isOverBudget = totalSpent > trip.budget;
  const progressPercent = trip.budget > 0
    ? Math.min(Math.round((totalSpent / trip.budget) * 100), 100)
    : 0;

  // Category breakdown
  const catTotals = new Map<TripExpenseCategory, number>();
  for (const e of expenses) {
    catTotals.set(e.category, (catTotals.get(e.category) ?? 0) + e.amount);
  }

  const categoryBreakdown = [...catTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amount]) => ({
      category: cat,
      name: tripCategoryLabels[cat] ?? cat,
      amount,
      percentage: totalSpent > 0
        ? Math.round((amount / totalSpent) * 100)
        : 0,
    }));

  return {
    trip,
    currencyInfo: {
      code: currencyInfo.code,
      symbol: currencyInfo.symbol,
      locale: currencyInfo.locale,
      decimals: currencyInfo.decimals,
    },
    labels,
    summary: {
      totalBudget: trip.budget,
      totalSpent,
      remaining,
      isOverBudget,
      progressPercent,
    },
    categoryBreakdown,
    expenses: expenses.map((e) => ({
      date: e.date,
      name: e.name,
      category: e.category,
      amount: e.amount,
      notes: e.notes,
    })),
    generatedAt: formatTimestamp(locale),
    locale,
  };
}
