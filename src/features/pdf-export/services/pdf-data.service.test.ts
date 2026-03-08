import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prepareFinancialReportData, prepareTripReportData } from './pdf-data.service';
import type { FinancialReportLabels, TripReportLabels } from './pdf-data.service';
import type { Transaction, Category, Trip, TripExpense } from '@/types/budget.types';
import type { CurrencyInfo } from '@/features/currency/utils/currency.constants';

// ==================== MOCK DATA ====================

const mockCurrency: CurrencyInfo = {
  code: 'COP',
  symbol: '$',
  name: 'Peso Colombiano',
  flag: '🇨🇴',
  locale: 'es-CO',
  decimals: 0,
  region: 'america',
};

const mockLabels: FinancialReportLabels = {
  title: 'Financial Report',
  totalIncome: 'Total Income',
  totalExpenses: 'Total Expenses',
  netBalance: 'Net Balance',
  savingsRate: 'Savings Rate',
  transactionsInPeriod: 'transactions in period',
  expensesByCategory: 'Expenses by Category',
  analysis: 'Analysis',
  dailyAverage: 'Daily average',
  topCategory: 'Top category',
  topDay: 'Top day',
  daysInRange: 'Days in range',
  transactionDetails: 'Transaction Details',
  generatedWith: 'Generated with SmartSpend',
};

const mockTripLabels: TripReportLabels = {
  title: 'Trip Report',
  budget: 'Budget',
  spent: 'Spent',
  available: 'Available',
  exceeded: 'Exceeded',
  budgetUsed: 'budget used',
  expensesByCategory: 'Expenses by Category',
  expenseDetails: 'Expense Details',
  total: 'Total',
  generatedWith: 'Generated with SmartSpend',
  since: 'Since',
  statusPlanning: 'Planning',
  statusActive: 'Active',
  statusCompleted: 'Completed',
  categoryTransport: 'Transport',
  categoryAccommodation: 'Accommodation',
  categoryFood: 'Food',
  categoryActivities: 'Activities',
  categoryShopping: 'Shopping',
  categoryOther: 'Other',
};

function makeTx(overrides: Partial<Transaction> & Pick<Transaction, 'id' | 'name' | 'amount' | 'date' | 'category'>): Transaction {
  return {
    type: 'expense',
    createdAt: Date.now(),
    ...overrides,
  } as Transaction;
}

function makeCat(overrides: Partial<Category> & Pick<Category, 'id' | 'name'>): Category {
  return {
    icon: 'circle',
    color: '#10B981',
    type: 'expense',
    groupId: 'g1',
    isDefault: false,
    createdAt: Date.now(),
    ...overrides,
  } as Category;
}

const categories: Category[] = [
  makeCat({ id: 'food', name: 'Comida', color: '#F59E0B' }),
  makeCat({ id: 'transport', name: 'Transporte', color: '#3B82F6' }),
  makeCat({ id: 'salary', name: 'Salario', color: '#10B981', type: 'income' }),
  makeCat({ id: 'rent', name: 'Arriendo', color: '#EF4444' }),
];

// ==================== TESTS ====================

describe('pdf-data.service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T14:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('prepareFinancialReportData', () => {
    it('should compute correct summary for mixed transactions', () => {
      const transactions: Transaction[] = [
        makeTx({ id: '1', name: 'Almuerzo', amount: 15000, date: '2026-03-01', category: 'food' }),
        makeTx({ id: '2', name: 'Taxi', amount: 8000, date: '2026-03-02', category: 'transport' }),
        makeTx({ id: '3', name: 'Salario', amount: 5000000, date: '2026-03-01', category: 'salary', type: 'income' }),
      ];

      const result = prepareFinancialReportData(
        transactions, categories, '2026-03-01', '2026-03-31', mockCurrency, 'es-CO', mockLabels,
      );

      expect(result.summary.totalIncome).toBe(5000000);
      expect(result.summary.totalExpenses).toBe(23000);
      expect(result.summary.netBalance).toBe(5000000 - 23000);
      expect(result.summary.transactionCount).toBe(3);
    });

    it('should compute savingsRate correctly', () => {
      const transactions: Transaction[] = [
        makeTx({ id: '1', name: 'Salario', amount: 1000000, date: '2026-03-01', category: 'salary', type: 'income' }),
        makeTx({ id: '2', name: 'Gasto', amount: 300000, date: '2026-03-01', category: 'food' }),
      ];

      const result = prepareFinancialReportData(
        transactions, categories, '2026-03-01', '2026-03-31', mockCurrency, 'es-CO', mockLabels,
      );

      // savingsRate = (1000000 - 300000) / 1000000 * 100 = 70
      expect(result.summary.savingsRate).toBe(70);
    });

    it('should return savingsRate 0 when no income', () => {
      const transactions: Transaction[] = [
        makeTx({ id: '1', name: 'Gasto', amount: 50000, date: '2026-03-01', category: 'food' }),
      ];

      const result = prepareFinancialReportData(
        transactions, categories, '2026-03-01', '2026-03-31', mockCurrency, 'es-CO', mockLabels,
      );

      expect(result.summary.savingsRate).toBe(0);
    });

    it('should filter transactions by date range', () => {
      const transactions: Transaction[] = [
        makeTx({ id: '1', name: 'In range', amount: 10000, date: '2026-03-15', category: 'food' }),
        makeTx({ id: '2', name: 'Before range', amount: 5000, date: '2026-02-28', category: 'food' }),
        makeTx({ id: '3', name: 'After range', amount: 7000, date: '2026-04-01', category: 'food' }),
        makeTx({ id: '4', name: 'Start boundary', amount: 3000, date: '2026-03-01', category: 'food' }),
        makeTx({ id: '5', name: 'End boundary', amount: 2000, date: '2026-03-31', category: 'food' }),
      ];

      const result = prepareFinancialReportData(
        transactions, categories, '2026-03-01', '2026-03-31', mockCurrency, 'es-CO', mockLabels,
      );

      expect(result.summary.transactionCount).toBe(3);
      expect(result.summary.totalExpenses).toBe(10000 + 3000 + 2000);
    });

    it('should limit category breakdown to top 8', () => {
      const manyCategories: Category[] = Array.from({ length: 10 }, (_, i) =>
        makeCat({ id: `cat-${i}`, name: `Cat ${i}`, color: `#${String(i).padStart(6, '0')}` }),
      );

      const transactions: Transaction[] = Array.from({ length: 10 }, (_, i) =>
        makeTx({
          id: `tx-${i}`,
          name: `Expense ${i}`,
          amount: (10 - i) * 1000,
          date: '2026-03-10',
          category: `cat-${i}`,
        }),
      );

      const result = prepareFinancialReportData(
        transactions, manyCategories, '2026-03-01', '2026-03-31', mockCurrency, 'es-CO', mockLabels,
      );

      expect(result.categoryBreakdown.length).toBe(8);
      // Should be sorted by amount desc
      expect(result.categoryBreakdown[0].amount).toBeGreaterThanOrEqual(result.categoryBreakdown[1].amount);
    });

    it('should limit transactions to 200', () => {
      const transactions: Transaction[] = Array.from({ length: 250 }, (_, i) =>
        makeTx({
          id: `tx-${i}`,
          name: `Expense ${i}`,
          amount: 1000,
          date: '2026-03-10',
          category: 'food',
        }),
      );

      const result = prepareFinancialReportData(
        transactions, categories, '2026-03-01', '2026-03-31', mockCurrency, 'es-CO', mockLabels,
      );

      expect(result.transactions.length).toBe(200);
    });

    it('should handle empty transactions', () => {
      const result = prepareFinancialReportData(
        [], categories, '2026-03-01', '2026-03-31', mockCurrency, 'es-CO', mockLabels,
      );

      expect(result.summary.totalIncome).toBe(0);
      expect(result.summary.totalExpenses).toBe(0);
      expect(result.summary.netBalance).toBe(0);
      expect(result.summary.savingsRate).toBe(0);
      expect(result.summary.transactionCount).toBe(0);
      expect(result.categoryBreakdown).toHaveLength(0);
      expect(result.transactions).toHaveLength(0);
      expect(result.insights.topCategory).toBeNull();
      expect(result.insights.topDay).toBeNull();
    });

    it('should compute category percentages correctly', () => {
      const transactions: Transaction[] = [
        makeTx({ id: '1', name: 'Comida', amount: 60000, date: '2026-03-01', category: 'food' }),
        makeTx({ id: '2', name: 'Taxi', amount: 40000, date: '2026-03-01', category: 'transport' }),
      ];

      const result = prepareFinancialReportData(
        transactions, categories, '2026-03-01', '2026-03-31', mockCurrency, 'es-CO', mockLabels,
      );

      expect(result.categoryBreakdown[0].name).toBe('Comida');
      expect(result.categoryBreakdown[0].percentage).toBe(60);
      expect(result.categoryBreakdown[1].percentage).toBe(40);
    });

    it('should compute daily average', () => {
      const transactions: Transaction[] = [
        makeTx({ id: '1', name: 'Gasto', amount: 30000, date: '2026-03-01', category: 'food' }),
      ];

      // 1 Mar to 3 Mar = ~3 days
      const result = prepareFinancialReportData(
        transactions, categories, '2026-03-01', '2026-03-03', mockCurrency, 'es-CO', mockLabels,
      );

      expect(result.insights.daysInRange).toBeGreaterThanOrEqual(2);
      expect(result.insights.dailyAverage).toBe(30000 / result.insights.daysInRange);
    });

    it('should identify top category', () => {
      const transactions: Transaction[] = [
        makeTx({ id: '1', name: 'Comida 1', amount: 50000, date: '2026-03-01', category: 'food' }),
        makeTx({ id: '2', name: 'Comida 2', amount: 30000, date: '2026-03-02', category: 'food' }),
        makeTx({ id: '3', name: 'Taxi', amount: 10000, date: '2026-03-01', category: 'transport' }),
      ];

      const result = prepareFinancialReportData(
        transactions, categories, '2026-03-01', '2026-03-31', mockCurrency, 'es-CO', mockLabels,
      );

      expect(result.insights.topCategory).not.toBeNull();
      expect(result.insights.topCategory!.name).toBe('Comida');
      expect(result.insights.topCategory!.amount).toBe(80000);
    });

    it('should pass through labels and currency info', () => {
      const result = prepareFinancialReportData(
        [], categories, '2026-03-01', '2026-03-31', mockCurrency, 'es-CO', mockLabels,
      );

      expect(result.labels).toBe(mockLabels);
      expect(result.currencyInfo.code).toBe('COP');
      expect(result.currencyInfo.locale).toBe('es-CO');
      expect(result.locale).toBe('es-CO');
    });

    it('should sort transactions by date descending', () => {
      const transactions: Transaction[] = [
        makeTx({ id: '1', name: 'First', amount: 1000, date: '2026-03-01', category: 'food' }),
        makeTx({ id: '2', name: 'Last', amount: 2000, date: '2026-03-15', category: 'food' }),
        makeTx({ id: '3', name: 'Middle', amount: 3000, date: '2026-03-10', category: 'food' }),
      ];

      const result = prepareFinancialReportData(
        transactions, categories, '2026-03-01', '2026-03-31', mockCurrency, 'es-CO', mockLabels,
      );

      expect(result.transactions[0].date).toBe('2026-03-15');
      expect(result.transactions[1].date).toBe('2026-03-10');
      expect(result.transactions[2].date).toBe('2026-03-01');
    });

    it('should use fallback values for unknown categories', () => {
      const transactions: Transaction[] = [
        makeTx({ id: '1', name: 'Unknown', amount: 5000, date: '2026-03-01', category: 'nonexistent' }),
      ];

      const result = prepareFinancialReportData(
        transactions, categories, '2026-03-01', '2026-03-31', mockCurrency, 'es-CO', mockLabels,
      );

      expect(result.transactions[0].categoryName).toBe('nonexistent');
      expect(result.transactions[0].categoryColor).toBe('#9CA3AF');
      expect(result.categoryBreakdown[0].name).toBe('nonexistent');
      expect(result.categoryBreakdown[0].color).toBe('#9CA3AF');
    });

    it('should only include expense categories in breakdown', () => {
      const transactions: Transaction[] = [
        makeTx({ id: '1', name: 'Income', amount: 5000000, date: '2026-03-01', category: 'salary', type: 'income' }),
        makeTx({ id: '2', name: 'Expense', amount: 10000, date: '2026-03-01', category: 'food' }),
      ];

      const result = prepareFinancialReportData(
        transactions, categories, '2026-03-01', '2026-03-31', mockCurrency, 'es-CO', mockLabels,
      );

      expect(result.categoryBreakdown).toHaveLength(1);
      expect(result.categoryBreakdown[0].name).toBe('Comida');
    });
  });

  describe('prepareTripReportData', () => {
    const trip: Trip = {
      id: 'trip-1',
      name: 'Cartagena Vacation',
      destination: 'Cartagena, Colombia',
      budget: 2000000,
      startDate: '2026-03-01',
      endDate: '2026-03-10',
      status: 'active',
      createdAt: Date.now(),
    };

    const tripExpenses: TripExpense[] = [
      { id: 'e1', tripId: 'trip-1', category: 'food', name: 'Almuerzo', amount: 30000, date: '2026-03-02', createdAt: Date.now() },
      { id: 'e2', tripId: 'trip-1', category: 'transport', name: 'Taxi', amount: 15000, date: '2026-03-01', createdAt: Date.now() },
      { id: 'e3', tripId: 'trip-1', category: 'food', name: 'Cena', amount: 45000, date: '2026-03-03', createdAt: Date.now() },
      { id: 'e4', tripId: 'other-trip', category: 'food', name: 'Other trip expense', amount: 99999, date: '2026-03-01', createdAt: Date.now() },
    ];

    it('should compute summary correctly', () => {
      const result = prepareTripReportData(trip, tripExpenses, mockCurrency, 'es-CO', mockTripLabels);

      expect(result.summary.totalBudget).toBe(2000000);
      expect(result.summary.totalSpent).toBe(30000 + 15000 + 45000);
      expect(result.summary.remaining).toBe(2000000 - 90000);
      expect(result.summary.isOverBudget).toBe(false);
    });

    it('should filter expenses by tripId', () => {
      const result = prepareTripReportData(trip, tripExpenses, mockCurrency, 'es-CO', mockTripLabels);

      expect(result.expenses).toHaveLength(3);
      expect(result.expenses.every((e) => e.name !== 'Other trip expense')).toBe(true);
    });

    it('should detect over-budget', () => {
      const smallBudgetTrip: Trip = { ...trip, budget: 50000 };
      const result = prepareTripReportData(smallBudgetTrip, tripExpenses, mockCurrency, 'es-CO', mockTripLabels);

      expect(result.summary.isOverBudget).toBe(true);
      expect(result.summary.remaining).toBeLessThan(0);
    });

    it('should compute progress percent capped at 100', () => {
      const smallBudgetTrip: Trip = { ...trip, budget: 50000 };
      const result = prepareTripReportData(smallBudgetTrip, tripExpenses, mockCurrency, 'es-CO', mockTripLabels);

      expect(result.summary.progressPercent).toBe(100);
    });

    it('should compute correct progress percent within budget', () => {
      const result = prepareTripReportData(trip, tripExpenses, mockCurrency, 'es-CO', mockTripLabels);

      // 90000 / 2000000 * 100 = 4.5 → rounded to 5
      expect(result.summary.progressPercent).toBe(Math.min(Math.round((90000 / 2000000) * 100), 100));
    });

    it('should return 0 progress when budget is 0', () => {
      const zeroBudgetTrip: Trip = { ...trip, budget: 0 };
      const result = prepareTripReportData(zeroBudgetTrip, tripExpenses, mockCurrency, 'es-CO', mockTripLabels);

      expect(result.summary.progressPercent).toBe(0);
    });

    it('should build category breakdown sorted by amount', () => {
      const result = prepareTripReportData(trip, tripExpenses, mockCurrency, 'es-CO', mockTripLabels);

      expect(result.categoryBreakdown.length).toBe(2);
      // Food (30000 + 45000 = 75000) > Transport (15000)
      expect(result.categoryBreakdown[0].category).toBe('food');
      expect(result.categoryBreakdown[0].amount).toBe(75000);
      expect(result.categoryBreakdown[1].category).toBe('transport');
      expect(result.categoryBreakdown[1].amount).toBe(15000);
    });

    it('should compute category percentages', () => {
      const result = prepareTripReportData(trip, tripExpenses, mockCurrency, 'es-CO', mockTripLabels);

      // Food: 75000/90000 = 83%, Transport: 15000/90000 = 17%
      expect(result.categoryBreakdown[0].percentage).toBe(83);
      expect(result.categoryBreakdown[1].percentage).toBe(17);
    });

    it('should use translated category names from labels', () => {
      const result = prepareTripReportData(trip, tripExpenses, mockCurrency, 'es-CO', mockTripLabels);

      expect(result.categoryBreakdown[0].name).toBe('Food');
      expect(result.categoryBreakdown[1].name).toBe('Transport');
    });

    it('should handle trip with no expenses', () => {
      const result = prepareTripReportData(trip, [], mockCurrency, 'es-CO', mockTripLabels);

      expect(result.summary.totalSpent).toBe(0);
      expect(result.summary.remaining).toBe(2000000);
      expect(result.summary.isOverBudget).toBe(false);
      expect(result.summary.progressPercent).toBe(0);
      expect(result.categoryBreakdown).toHaveLength(0);
      expect(result.expenses).toHaveLength(0);
    });

    it('should sort expenses by date descending', () => {
      const result = prepareTripReportData(trip, tripExpenses, mockCurrency, 'es-CO', mockTripLabels);

      expect(result.expenses[0].date).toBe('2026-03-03');
      expect(result.expenses[1].date).toBe('2026-03-02');
      expect(result.expenses[2].date).toBe('2026-03-01');
    });

    it('should pass through trip, labels, and currency info', () => {
      const result = prepareTripReportData(trip, tripExpenses, mockCurrency, 'es-CO', mockTripLabels);

      expect(result.trip).toBe(trip);
      expect(result.labels).toBe(mockTripLabels);
      expect(result.currencyInfo.code).toBe('COP');
      expect(result.locale).toBe('es-CO');
    });
  });
});
