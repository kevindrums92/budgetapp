import { describe, it, expect, vi } from 'vitest';
import type { Transaction, Budget } from '@/types/budget.types';
import { predictBudgetExceeded, getAllBudgetPredictions } from './budgetPrediction.service';

// Mock today to 2026-02-15
vi.mock('@/services/dates.service', () => ({
  todayISO: () => '2026-02-15',
}));

// --- Helpers ---

function makeBudget(
  id: string,
  categoryId: string,
  amount: number,
  startDate: string,
  endDate: string,
  opts?: { status?: 'active' | 'completed'; type?: 'limit' | 'goal' }
): Budget {
  return {
    id,
    categoryId,
    type: opts?.type ?? 'limit',
    amount,
    period: { type: 'month', startDate, endDate },
    status: opts?.status ?? 'active',
    isRecurring: false,
    createdAt: Date.now(),
  };
}

function makeTx(
  category: string,
  amount: number,
  date: string,
  type: 'income' | 'expense' = 'expense'
): Transaction {
  return {
    id: `tx-${Math.random().toString(36).slice(2)}`,
    name: 'Test TX',
    amount,
    type,
    category,
    date,
    createdAt: Date.now(),
  };
}

// --- Tests ---

describe('predictBudgetExceeded', () => {
  describe('Filtering', () => {
    it('should return null for completed budgets', () => {
      const budget = makeBudget('b1', 'cat-1', 500000, '2026-02-01', '2026-02-28', { status: 'completed' });
      expect(predictBudgetExceeded(budget, [])).toBeNull();
    });

    it('should return null for goal-type budgets', () => {
      const budget = makeBudget('b1', 'cat-1', 500000, '2026-02-01', '2026-02-28', { type: 'goal' });
      expect(predictBudgetExceeded(budget, [])).toBeNull();
    });

    it('should return null for budgets outside current period', () => {
      // Period is in March, today is Feb 15
      const budget = makeBudget('b1', 'cat-1', 500000, '2026-03-01', '2026-03-31');
      expect(predictBudgetExceeded(budget, [])).toBeNull();
    });
  });

  describe('Already exceeded', () => {
    it('should return urgency "high" with daysUntilExceeded=0 when spent >= limit', () => {
      const budget = makeBudget('b1', 'cat-1', 300000, '2026-02-01', '2026-02-28');
      const transactions = [
        makeTx('cat-1', 200000, '2026-02-05'),
        makeTx('cat-1', 150000, '2026-02-10'),
      ];

      const result = predictBudgetExceeded(budget, transactions);

      expect(result).not.toBeNull();
      expect(result!.daysUntilExceeded).toBe(0);
      expect(result!.urgency).toBe('high');
      expect(result!.currentSpent).toBe(350000);
      expect(result!.budgetLimit).toBe(300000);
    });
  });

  describe('At risk (will exceed within 14 days)', () => {
    it('should return high urgency when exceeding within 3 days', () => {
      // Budget: 500K for Feb, spent 450K in 15 days
      // Daily burn: 450K/15 = 30K/day, remaining: 50K, days until exceeded: ceil(50K/30K) = 2
      const budget = makeBudget('b1', 'cat-1', 500000, '2026-02-01', '2026-02-28');
      const transactions = [
        makeTx('cat-1', 450000, '2026-02-10'),
      ];

      const result = predictBudgetExceeded(budget, transactions);

      expect(result).not.toBeNull();
      expect(result!.daysUntilExceeded).toBeLessThanOrEqual(3);
      expect(result!.urgency).toBe('high');
    });

    it('should return medium urgency when exceeding within 4-7 days', () => {
      // Budget: 500K for Feb, spent 400K in 15 days
      // Daily burn: 400K/15 ≈ 26667/day, remaining: 100K, days: ceil(100K/26667) ≈ 4
      const budget = makeBudget('b1', 'cat-1', 500000, '2026-02-01', '2026-02-28');
      const transactions = [
        makeTx('cat-1', 400000, '2026-02-10'),
      ];

      const result = predictBudgetExceeded(budget, transactions);

      expect(result).not.toBeNull();
      expect(result!.daysUntilExceeded).toBeGreaterThanOrEqual(4);
      expect(result!.daysUntilExceeded).toBeLessThanOrEqual(7);
      expect(result!.urgency).toBe('medium');
    });

    it('should return low urgency when exceeding within 8-14 days', () => {
      // Budget: 1M for Feb, spent 600K in 15 days
      // Daily burn: 600K/15 = 40K/day, remaining: 400K, days: ceil(400K/40K) = 10
      const budget = makeBudget('b1', 'cat-1', 1000000, '2026-02-01', '2026-02-28');
      const transactions = [
        makeTx('cat-1', 600000, '2026-02-10'),
      ];

      const result = predictBudgetExceeded(budget, transactions);

      expect(result).not.toBeNull();
      expect(result!.daysUntilExceeded).toBeGreaterThanOrEqual(8);
      expect(result!.daysUntilExceeded).toBeLessThanOrEqual(14);
      expect(result!.urgency).toBe('low');
    });
  });

  describe('Not at risk', () => {
    it('should return null when budget will not be exceeded', () => {
      // Budget: 1M for Feb, spent only 100K in 15 days
      // Daily burn: 100K/15 ≈ 6667/day, projected: 100K + 6667*13 ≈ 187K << 1M
      const budget = makeBudget('b1', 'cat-1', 1000000, '2026-02-01', '2026-02-28');
      const transactions = [
        makeTx('cat-1', 100000, '2026-02-10'),
      ];

      const result = predictBudgetExceeded(budget, transactions);
      expect(result).toBeNull();
    });

    it('should return null when exceeding is more than 14 days away', () => {
      // Very low burn rate, won't exceed within 14 days
      const budget = makeBudget('b1', 'cat-1', 5000000, '2026-02-01', '2026-02-28');
      const transactions = [
        makeTx('cat-1', 10000, '2026-02-10'),
      ];

      const result = predictBudgetExceeded(budget, transactions);
      expect(result).toBeNull();
    });

    it('should return null when no transactions exist for the category', () => {
      const budget = makeBudget('b1', 'cat-1', 500000, '2026-02-01', '2026-02-28');
      expect(predictBudgetExceeded(budget, [])).toBeNull();
    });
  });

  describe('Transaction filtering', () => {
    it('should only count expense transactions for the budget category', () => {
      const budget = makeBudget('b1', 'cat-1', 300000, '2026-02-01', '2026-02-28');
      const transactions = [
        makeTx('cat-1', 290000, '2026-02-10'), // This category, expense
        makeTx('cat-2', 500000, '2026-02-10'), // Different category
        makeTx('cat-1', 500000, '2026-02-10', 'income'), // Same category, income
      ];

      const result = predictBudgetExceeded(budget, transactions);

      // Only 290K spent on cat-1 expenses — close to limit but check projection
      expect(result === null || result.currentSpent === 290000).toBe(true);
    });

    it('should only count transactions within the budget period', () => {
      const budget = makeBudget('b1', 'cat-1', 500000, '2026-02-01', '2026-02-28');
      const transactions = [
        makeTx('cat-1', 400000, '2026-01-15'), // Before period — excluded
        makeTx('cat-1', 100000, '2026-02-10'), // In period — included
      ];

      const result = predictBudgetExceeded(budget, transactions);

      // Only 100K should be counted
      if (result) {
        expect(result.currentSpent).toBe(100000);
      }
    });
  });

  describe('Return values', () => {
    it('should include all required fields in the prediction', () => {
      const budget = makeBudget('b1', 'cat-food', 300000, '2026-02-01', '2026-02-28');
      const transactions = [
        makeTx('cat-food', 290000, '2026-02-10'),
      ];

      const result = predictBudgetExceeded(budget, transactions);

      expect(result).not.toBeNull();
      expect(result!.budgetId).toBe('b1');
      expect(result!.categoryId).toBe('cat-food');
      expect(typeof result!.daysUntilExceeded).toBe('number');
      expect(typeof result!.dailyBurnRate).toBe('number');
      expect(typeof result!.projectedTotal).toBe('number');
      expect(result!.budgetLimit).toBe(300000);
      expect(typeof result!.currentSpent).toBe('number');
      expect(['high', 'medium', 'low']).toContain(result!.urgency);
    });

    it('should return rounded values', () => {
      const budget = makeBudget('b1', 'cat-1', 500000, '2026-02-01', '2026-02-28');
      const transactions = [
        makeTx('cat-1', 333333, '2026-02-10'),
      ];

      const result = predictBudgetExceeded(budget, transactions);

      if (result) {
        expect(result.dailyBurnRate).toBe(Math.round(result.dailyBurnRate));
        expect(result.projectedTotal).toBe(Math.round(result.projectedTotal));
        expect(result.currentSpent).toBe(Math.round(result.currentSpent));
      }
    });
  });
});

describe('getAllBudgetPredictions', () => {
  it('should return empty array when no budgets are at risk', () => {
    const budgets = [
      makeBudget('b1', 'cat-1', 5000000, '2026-02-01', '2026-02-28'),
    ];

    const result = getAllBudgetPredictions(budgets, []);
    expect(result).toEqual([]);
  });

  it('should filter out non-at-risk budgets', () => {
    const budgets = [
      makeBudget('b1', 'cat-1', 5000000, '2026-02-01', '2026-02-28'), // Not at risk
      makeBudget('b2', 'cat-2', 100000, '2026-02-01', '2026-02-28'),  // At risk
    ];

    const transactions = [
      makeTx('cat-2', 95000, '2026-02-10'), // 95K of 100K limit
    ];

    const result = getAllBudgetPredictions(budgets, transactions);

    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.every((p) => p.categoryId === 'cat-2')).toBe(true);
  });

  it('should sort predictions by daysUntilExceeded (soonest first)', () => {
    const budgets = [
      makeBudget('b1', 'cat-1', 500000, '2026-02-01', '2026-02-28'),
      makeBudget('b2', 'cat-2', 300000, '2026-02-01', '2026-02-28'),
    ];

    const transactions = [
      makeTx('cat-1', 400000, '2026-02-10'), // Will exceed soon-ish
      makeTx('cat-2', 290000, '2026-02-10'), // Will exceed very soon (closer to limit)
    ];

    const result = getAllBudgetPredictions(budgets, transactions);

    if (result.length >= 2) {
      expect(result[0].daysUntilExceeded).toBeLessThanOrEqual(result[1].daysUntilExceeded);
    }
  });

  it('should handle mix of exceeded and at-risk budgets', () => {
    const budgets = [
      makeBudget('b1', 'cat-1', 200000, '2026-02-01', '2026-02-28'), // Will be exceeded
      makeBudget('b2', 'cat-2', 500000, '2026-02-01', '2026-02-28'), // At risk
    ];

    const transactions = [
      makeTx('cat-1', 250000, '2026-02-10'), // Already exceeded
      makeTx('cat-2', 450000, '2026-02-10'), // Almost exceeded
    ];

    const result = getAllBudgetPredictions(budgets, transactions);

    expect(result.length).toBe(2);
    // Already exceeded (daysUntilExceeded = 0) should be first
    expect(result[0].daysUntilExceeded).toBe(0);
  });

  it('should handle empty budgets array', () => {
    expect(getAllBudgetPredictions([], [])).toEqual([]);
  });
});
