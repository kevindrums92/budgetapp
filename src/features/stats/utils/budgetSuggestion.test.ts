import { describe, it, expect } from 'vitest';
import type { Budget, Transaction } from '@/types/budget.types';

/**
 * These tests validate the budget suggestion logic extracted from StatsPage.
 * The logic determines:
 * 1. Which category IDs have budgets covering a given month (period overlap)
 * 2. Which category to suggest for budget creation (top spend, not recurring, no existing budget)
 */

type CategoryChartItem = {
  id: string;
  name: string;
  icon: string;
  color: string;
  value: number;
};

// --- Extracted logic functions (mirror StatsPage useMemo logic) ---

function getBudgetedCategoryIdsForMonth(budgets: Budget[], selectedMonth: string): Set<string> {
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const firstDay = `${selectedMonth}-01`;
  const lastDay = `${selectedMonth}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;

  return new Set(
    budgets
      .filter((b) => b.status === 'active' && b.period.startDate <= lastDay && b.period.endDate >= firstDay)
      .map((b) => b.categoryId)
  );
}

function getBudgetSuggestion(
  isPro: boolean,
  categoryChartData: CategoryChartItem[],
  budgetedCategoryIdsForMonth: Set<string>,
  transactions: Transaction[],
  selectedMonth: string
): CategoryChartItem | null {
  if (!isPro || categoryChartData.length === 0) return null;

  for (const cat of categoryChartData) {
    if (budgetedCategoryIdsForMonth.has(cat.id)) continue;

    const catTxs = transactions.filter(
      (t) => t.category === cat.id && t.type === 'expense' && t.date.slice(0, 7) === selectedMonth
    );
    const recurringCount = catTxs.filter(
      (t) => t.schedule?.enabled || t.sourceTemplateId
    ).length;
    const recurringRatio = catTxs.length > 0 ? recurringCount / catTxs.length : 0;

    if (recurringRatio <= 0.5) return cat;
  }
  return null;
}

// --- Test Data Helpers ---

function makeBudget(
  id: string,
  categoryId: string,
  startDate: string,
  endDate: string,
  status: 'active' | 'completed' = 'active',
  periodType: 'month' | 'year' | 'quarter' | 'week' | 'custom' = 'month'
): Budget {
  return {
    id,
    categoryId,
    type: 'limit',
    amount: 500000,
    period: { type: periodType, startDate, endDate },
    status,
    isRecurring: false,
    createdAt: Date.now(),
  };
}

function makeTransaction(
  category: string,
  date: string,
  opts?: { recurring?: boolean; sourceTemplateId?: string; type?: 'expense' | 'income' }
): Transaction {
  return {
    id: `tx-${Math.random().toString(36).slice(2)}`,
    name: 'Test TX',
    amount: 50000,
    type: opts?.type ?? 'expense',
    category,
    date,
    createdAt: Date.now(),
    ...(opts?.recurring ? { schedule: { enabled: true, frequency: 'monthly' as const, interval: 1, startDate: date } } : {}),
    ...(opts?.sourceTemplateId ? { sourceTemplateId: opts.sourceTemplateId } : {}),
  };
}

const chartData: CategoryChartItem[] = [
  { id: 'cat-rest', name: 'Restaurantes', icon: 'utensils', color: '#EF4444', value: 450000 },
  { id: 'cat-trans', name: 'Transporte', icon: 'car', color: '#F59E0B', value: 200000 },
  { id: 'cat-bills', name: 'Servicios', icon: 'zap', color: '#3B82F6', value: 150000 },
];

// --- Tests ---

describe('budgetedCategoryIdsForMonth', () => {
  it('should detect monthly budget covering the selected month', () => {
    const budgets = [makeBudget('b1', 'cat-rest', '2026-02-01', '2026-02-28')];
    const result = getBudgetedCategoryIdsForMonth(budgets, '2026-02');

    expect(result.has('cat-rest')).toBe(true);
  });

  it('should detect annual budget covering any month in the year', () => {
    const budgets = [makeBudget('b1', 'cat-rest', '2026-01-01', '2026-12-31', 'active', 'year')];

    // Test multiple months - all should be covered
    for (const month of ['2026-01', '2026-06', '2026-12']) {
      const result = getBudgetedCategoryIdsForMonth(budgets, month);
      expect(result.has('cat-rest')).toBe(true);
    }
  });

  it('should NOT detect annual budget for months outside its range', () => {
    const budgets = [makeBudget('b1', 'cat-rest', '2026-01-01', '2026-12-31', 'active', 'year')];

    const result2025 = getBudgetedCategoryIdsForMonth(budgets, '2025-12');
    expect(result2025.has('cat-rest')).toBe(false);

    const result2027 = getBudgetedCategoryIdsForMonth(budgets, '2027-01');
    expect(result2027.has('cat-rest')).toBe(false);
  });

  it('should detect quarterly budget covering months within the quarter', () => {
    const budgets = [makeBudget('b1', 'cat-rest', '2026-04-01', '2026-06-30', 'active', 'quarter')];

    expect(getBudgetedCategoryIdsForMonth(budgets, '2026-04').has('cat-rest')).toBe(true);
    expect(getBudgetedCategoryIdsForMonth(budgets, '2026-05').has('cat-rest')).toBe(true);
    expect(getBudgetedCategoryIdsForMonth(budgets, '2026-06').has('cat-rest')).toBe(true);
    expect(getBudgetedCategoryIdsForMonth(budgets, '2026-03').has('cat-rest')).toBe(false);
    expect(getBudgetedCategoryIdsForMonth(budgets, '2026-07').has('cat-rest')).toBe(false);
  });

  it('should ignore completed budgets', () => {
    const budgets = [makeBudget('b1', 'cat-rest', '2026-02-01', '2026-02-28', 'completed')];
    const result = getBudgetedCategoryIdsForMonth(budgets, '2026-02');

    expect(result.has('cat-rest')).toBe(false);
  });

  it('should handle custom period overlapping partial month', () => {
    // Budget from Jan 15 to Feb 15 - should cover both January and February
    const budgets = [makeBudget('b1', 'cat-rest', '2026-01-15', '2026-02-15', 'active', 'custom')];

    expect(getBudgetedCategoryIdsForMonth(budgets, '2026-01').has('cat-rest')).toBe(true);
    expect(getBudgetedCategoryIdsForMonth(budgets, '2026-02').has('cat-rest')).toBe(true);
    expect(getBudgetedCategoryIdsForMonth(budgets, '2026-03').has('cat-rest')).toBe(false);
  });

  it('should handle multiple budgets for different categories', () => {
    const budgets = [
      makeBudget('b1', 'cat-rest', '2026-02-01', '2026-02-28'),
      makeBudget('b2', 'cat-trans', '2026-01-01', '2026-12-31', 'active', 'year'),
    ];
    const result = getBudgetedCategoryIdsForMonth(budgets, '2026-02');

    expect(result.has('cat-rest')).toBe(true);
    expect(result.has('cat-trans')).toBe(true);
    expect(result.has('cat-bills')).toBe(false);
  });

  it('should handle February 29 for leap year', () => {
    // 2028 is a leap year
    const budgets = [makeBudget('b1', 'cat-rest', '2028-02-01', '2028-02-29')];
    const result = getBudgetedCategoryIdsForMonth(budgets, '2028-02');

    expect(result.has('cat-rest')).toBe(true);
  });

  it('should handle empty budgets array', () => {
    const result = getBudgetedCategoryIdsForMonth([], '2026-02');
    expect(result.size).toBe(0);
  });
});

describe('getBudgetSuggestion', () => {
  it('should return null for non-Pro users', () => {
    const result = getBudgetSuggestion(false, chartData, new Set(), [], '2026-02');
    expect(result).toBeNull();
  });

  it('should return null when no categories have expenses', () => {
    const result = getBudgetSuggestion(true, [], new Set(), [], '2026-02');
    expect(result).toBeNull();
  });

  it('should return top category when no budgets exist', () => {
    const transactions = [
      makeTransaction('cat-rest', '2026-02-10'),
      makeTransaction('cat-rest', '2026-02-15'),
    ];

    const result = getBudgetSuggestion(true, chartData, new Set(), transactions, '2026-02');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('cat-rest'); // Top by value (450000)
  });

  it('should skip category that already has a budget', () => {
    const budgetedIds = new Set(['cat-rest']);
    const transactions = [
      makeTransaction('cat-rest', '2026-02-10'),
      makeTransaction('cat-trans', '2026-02-10'),
    ];

    const result = getBudgetSuggestion(true, chartData, budgetedIds, transactions, '2026-02');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('cat-trans'); // Second highest
  });

  it('should skip category with >50% recurring transactions', () => {
    const transactions = [
      // 3 recurring out of 4 = 75% recurring → skip
      makeTransaction('cat-rest', '2026-02-10', { recurring: true }),
      makeTransaction('cat-rest', '2026-02-15', { recurring: true }),
      makeTransaction('cat-rest', '2026-02-20', { recurring: true }),
      makeTransaction('cat-rest', '2026-02-25'),
      // cat-trans has non-recurring
      makeTransaction('cat-trans', '2026-02-10'),
    ];

    const result = getBudgetSuggestion(true, chartData, new Set(), transactions, '2026-02');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('cat-trans');
  });

  it('should include category with exactly 50% recurring transactions', () => {
    const transactions = [
      makeTransaction('cat-rest', '2026-02-10', { recurring: true }),
      makeTransaction('cat-rest', '2026-02-15'),
    ];

    const result = getBudgetSuggestion(true, chartData, new Set(), transactions, '2026-02');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('cat-rest'); // 50% recurring → ratio 0.5 <= 0.5 → allowed
  });

  it('should detect sourceTemplateId as recurring', () => {
    const transactions = [
      // 2 out of 3 are from templates = 67% recurring → skip
      makeTransaction('cat-rest', '2026-02-10', { sourceTemplateId: 'tpl-1' }),
      makeTransaction('cat-rest', '2026-02-15', { sourceTemplateId: 'tpl-2' }),
      makeTransaction('cat-rest', '2026-02-20'),
      // cat-trans has non-recurring
      makeTransaction('cat-trans', '2026-02-10'),
    ];

    const result = getBudgetSuggestion(true, chartData, new Set(), transactions, '2026-02');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('cat-trans');
  });

  it('should only consider transactions from the selected month', () => {
    const transactions = [
      // January recurring transactions shouldn't affect February suggestion
      makeTransaction('cat-rest', '2026-01-10', { recurring: true }),
      makeTransaction('cat-rest', '2026-01-15', { recurring: true }),
      // February non-recurring
      makeTransaction('cat-rest', '2026-02-10'),
    ];

    const result = getBudgetSuggestion(true, chartData, new Set(), transactions, '2026-02');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('cat-rest'); // Only Feb transactions count → 0% recurring
  });

  it('should return null when all categories have budgets', () => {
    const budgetedIds = new Set(['cat-rest', 'cat-trans', 'cat-bills']);

    const result = getBudgetSuggestion(true, chartData, budgetedIds, [], '2026-02');

    expect(result).toBeNull();
  });

  it('should return null when all categories are mostly recurring', () => {
    const transactions = [
      makeTransaction('cat-rest', '2026-02-10', { recurring: true }),
      makeTransaction('cat-trans', '2026-02-10', { recurring: true }),
      makeTransaction('cat-bills', '2026-02-10', { recurring: true }),
    ];

    const result = getBudgetSuggestion(true, chartData, new Set(), transactions, '2026-02');

    // All categories have 100% recurring → all skipped → null
    expect(result).toBeNull();
  });

  it('should handle category with no transactions (0 recurring ratio = allowed)', () => {
    // cat-rest has chart data value (from aggregation) but no raw transactions in the array
    // This happens when transactions are pre-aggregated
    const result = getBudgetSuggestion(true, chartData, new Set(), [], '2026-02');

    // 0 transactions → recurringRatio = 0 → 0 <= 0.5 → allowed
    expect(result).not.toBeNull();
    expect(result!.id).toBe('cat-rest');
  });
});
