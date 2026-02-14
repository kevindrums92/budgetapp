import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Transaction, Budget } from '@/types/budget.types';
import { calculateSafeToSpend } from './safeToSpend.service';

// Mock today to 2026-02-15
vi.mock('@/services/dates.service', () => ({
  todayISO: () => '2026-02-15',
}));

// Mock scheduler to return virtual upcoming transactions
const mockVirtualTxs: Transaction[] = [];
vi.mock('@/shared/services/scheduler.service', () => ({
  generateVirtualTransactions: () => mockVirtualTxs,
}));

// Mock budget progress calculation
const mockProgressMap = new Map<string, { remaining: number }>();
vi.mock('@/features/budget/services/budget.service', () => ({
  calculateBudgetProgress: (budget: Budget) => {
    const progress = mockProgressMap.get(budget.id);
    return progress ?? { remaining: 0 };
  },
}));

// --- Helpers ---

function makeTx(
  type: 'income' | 'expense',
  amount: number,
  date: string,
  category: string = 'cat-1'
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

// --- Tests ---

describe('calculateSafeToSpend', () => {
  beforeEach(() => {
    mockVirtualTxs.length = 0;
    mockProgressMap.clear();
  });

  describe('Current Balance', () => {
    it('should calculate balance as income minus expenses for the selected month', () => {
      const transactions = [
        makeTx('income', 5000000, '2026-02-01'),
        makeTx('expense', 1000000, '2026-02-05'),
        makeTx('expense', 500000, '2026-02-10'),
      ];

      const result = calculateSafeToSpend(transactions, [], '2026-02');

      expect(result.currentBalance).toBe(3500000); // 5M - 1M - 500K
    });

    it('should only include transactions from the selected month', () => {
      const transactions = [
        makeTx('income', 5000000, '2026-01-01'),  // January — excluded
        makeTx('income', 3000000, '2026-02-01'),  // February — included
        makeTx('expense', 1000000, '2026-02-10'), // February — included
        makeTx('expense', 500000, '2026-03-01'),  // March — excluded
      ];

      const result = calculateSafeToSpend(transactions, [], '2026-02');

      expect(result.currentBalance).toBe(2000000); // 3M - 1M
    });

    it('should return 0 balance when no transactions in month', () => {
      const result = calculateSafeToSpend([], [], '2026-02');

      expect(result.currentBalance).toBe(0);
      expect(result.safeToSpend).toBe(0);
    });

    it('should handle negative balance (expenses > income)', () => {
      const transactions = [
        makeTx('income', 1000000, '2026-02-01'),
        makeTx('expense', 3000000, '2026-02-10'),
      ];

      const result = calculateSafeToSpend(transactions, [], '2026-02');

      expect(result.currentBalance).toBe(-2000000);
    });
  });

  describe('Current Month — Upcoming Bills', () => {
    it('should subtract upcoming bills from safe to spend', () => {
      const transactions = [
        makeTx('income', 5000000, '2026-02-01'),
      ];

      // Simulate upcoming virtual transactions
      mockVirtualTxs.push(
        {
          id: 'vt-1',
          name: 'Rent',
          amount: 1500000,
          type: 'expense',
          category: 'cat-bills',
          date: '2026-02-20',
          createdAt: Date.now(),
        } as Transaction,
        {
          id: 'vt-2',
          name: 'Internet',
          amount: 100000,
          type: 'expense',
          category: 'cat-bills',
          date: '2026-02-25',
          createdAt: Date.now(),
        } as Transaction
      );

      const result = calculateSafeToSpend(transactions, [], '2026-02');

      expect(result.upcomingBillsTotal).toBe(1600000);
      expect(result.upcomingBills).toHaveLength(2);
      expect(result.safeToSpend).toBe(5000000 - 1600000); // Balance - bills
    });

    it('should only include upcoming bills after today and before end of month', () => {
      const transactions = [
        makeTx('income', 5000000, '2026-02-01'),
      ];

      // One bill before today (should be excluded), one after today, one in March
      mockVirtualTxs.push(
        {
          id: 'vt-1',
          name: 'Past Bill',
          amount: 100000,
          type: 'expense',
          category: 'cat-1',
          date: '2026-02-10', // Before today (Feb 15) — excluded
          createdAt: Date.now(),
        } as Transaction,
        {
          id: 'vt-2',
          name: 'Future Bill',
          amount: 200000,
          type: 'expense',
          category: 'cat-1',
          date: '2026-02-20', // After today — included
          createdAt: Date.now(),
        } as Transaction,
        {
          id: 'vt-3',
          name: 'March Bill',
          amount: 300000,
          type: 'expense',
          category: 'cat-1',
          date: '2026-03-01', // Next month — excluded
          createdAt: Date.now(),
        } as Transaction
      );

      const result = calculateSafeToSpend(transactions, [], '2026-02');

      expect(result.upcomingBillsTotal).toBe(200000);
      expect(result.upcomingBills).toHaveLength(1);
    });

    it('should exclude upcoming income from bills (only expenses)', () => {
      const transactions = [
        makeTx('income', 1000000, '2026-02-01'),
      ];

      mockVirtualTxs.push(
        {
          id: 'vt-1',
          name: 'Salary',
          amount: 5000000,
          type: 'income',
          category: 'cat-1',
          date: '2026-02-20',
          createdAt: Date.now(),
        } as Transaction
      );

      const result = calculateSafeToSpend(transactions, [], '2026-02');

      expect(result.upcomingBillsTotal).toBe(0);
      expect(result.upcomingBills).toHaveLength(0);
    });

    it('should sort upcoming bills by date', () => {
      const transactions = [
        makeTx('income', 5000000, '2026-02-01'),
      ];

      mockVirtualTxs.push(
        {
          id: 'vt-1',
          name: 'Bill B',
          amount: 100000,
          type: 'expense',
          category: 'cat-1',
          date: '2026-02-25',
          createdAt: Date.now(),
        } as Transaction,
        {
          id: 'vt-2',
          name: 'Bill A',
          amount: 200000,
          type: 'expense',
          category: 'cat-1',
          date: '2026-02-18',
          createdAt: Date.now(),
        } as Transaction
      );

      const result = calculateSafeToSpend(transactions, [], '2026-02');

      expect(result.upcomingBills[0].name).toBe('Bill A');
      expect(result.upcomingBills[1].name).toBe('Bill B');
    });
  });

  describe('Current Month — Budget Reserves', () => {
    it('should subtract budget reserves from safe to spend', () => {
      const transactions = [
        makeTx('income', 5000000, '2026-02-01'),
        makeTx('expense', 200000, '2026-02-10'),
      ];

      const budgets = [
        makeBudget('b1', 'cat-food', 500000, '2026-02-01', '2026-02-28'),
      ];

      // Budget has 300K remaining
      mockProgressMap.set('b1', { remaining: 300000 });

      const result = calculateSafeToSpend(transactions, budgets, '2026-02');

      expect(result.budgetReserves).toBe(300000);
      expect(result.currentBalance).toBe(4800000); // 5M - 200K
      expect(result.safeToSpend).toBe(4800000 - 300000); // Balance - reserves
    });

    it('should sum reserves from multiple active budgets', () => {
      const transactions = [
        makeTx('income', 5000000, '2026-02-01'),
      ];

      const budgets = [
        makeBudget('b1', 'cat-food', 500000, '2026-02-01', '2026-02-28'),
        makeBudget('b2', 'cat-transport', 200000, '2026-02-01', '2026-02-28'),
      ];

      mockProgressMap.set('b1', { remaining: 300000 });
      mockProgressMap.set('b2', { remaining: 150000 });

      const result = calculateSafeToSpend(transactions, budgets, '2026-02');

      expect(result.budgetReserves).toBe(450000); // 300K + 150K
    });

    it('should ignore completed budgets', () => {
      const transactions = [
        makeTx('income', 5000000, '2026-02-01'),
      ];

      const budgets = [
        makeBudget('b1', 'cat-1', 500000, '2026-02-01', '2026-02-28', { status: 'completed' }),
      ];

      mockProgressMap.set('b1', { remaining: 300000 });

      const result = calculateSafeToSpend(transactions, budgets, '2026-02');

      expect(result.budgetReserves).toBe(0);
    });

    it('should ignore goal-type budgets (only limit budgets count)', () => {
      const transactions = [
        makeTx('income', 5000000, '2026-02-01'),
      ];

      const budgets = [
        makeBudget('b1', 'cat-1', 500000, '2026-02-01', '2026-02-28', { type: 'goal' }),
      ];

      mockProgressMap.set('b1', { remaining: 300000 });

      const result = calculateSafeToSpend(transactions, budgets, '2026-02');

      expect(result.budgetReserves).toBe(0);
    });

    it('should treat negative remaining as 0 (overspent budget)', () => {
      const transactions = [
        makeTx('income', 5000000, '2026-02-01'),
      ];

      const budgets = [
        makeBudget('b1', 'cat-1', 300000, '2026-02-01', '2026-02-28'),
      ];

      // Budget is overspent — remaining is negative
      mockProgressMap.set('b1', { remaining: -50000 });

      const result = calculateSafeToSpend(transactions, budgets, '2026-02');

      expect(result.budgetReserves).toBe(0); // Math.max(0, -50000) = 0
    });
  });

  describe('Past/Future Months', () => {
    it('should NOT include upcoming bills for past months', () => {
      const transactions = [
        makeTx('income', 5000000, '2026-01-01'),
        makeTx('expense', 1000000, '2026-01-15'),
      ];

      mockVirtualTxs.push({
        id: 'vt-1',
        name: 'Should not appear',
        amount: 999999,
        type: 'expense',
        category: 'cat-1',
        date: '2026-01-20',
        createdAt: Date.now(),
      } as Transaction);

      // Querying January (past month, today is Feb 15)
      const result = calculateSafeToSpend(transactions, [], '2026-01');

      expect(result.upcomingBillsTotal).toBe(0);
      expect(result.upcomingBills).toHaveLength(0);
      expect(result.budgetReserves).toBe(0);
      // SafeToSpend = just the balance for past months
      expect(result.safeToSpend).toBe(4000000); // 5M - 1M
    });

    it('should NOT include budget reserves for future months', () => {
      const transactions = [
        makeTx('income', 3000000, '2026-03-01'),
      ];

      const budgets = [
        makeBudget('b1', 'cat-1', 500000, '2026-03-01', '2026-03-31'),
      ];

      mockProgressMap.set('b1', { remaining: 500000 });

      // Querying March (future month)
      const result = calculateSafeToSpend(transactions, budgets, '2026-03');

      expect(result.budgetReserves).toBe(0);
      expect(result.upcomingBillsTotal).toBe(0);
      expect(result.safeToSpend).toBe(3000000);
    });
  });

  describe('Full Formula', () => {
    it('should compute safeToSpend = balance - bills - reserves', () => {
      const transactions = [
        makeTx('income', 5000000, '2026-02-01'),
        makeTx('expense', 1000000, '2026-02-10'),
      ];

      const budgets = [
        makeBudget('b1', 'cat-food', 500000, '2026-02-01', '2026-02-28'),
      ];

      mockProgressMap.set('b1', { remaining: 200000 });

      mockVirtualTxs.push({
        id: 'vt-1',
        name: 'Rent',
        amount: 1500000,
        type: 'expense',
        category: 'cat-bills',
        date: '2026-02-20',
        createdAt: Date.now(),
      } as Transaction);

      const result = calculateSafeToSpend(transactions, budgets, '2026-02');

      // Balance: 5M - 1M = 4M
      // Bills: 1.5M
      // Reserves: 200K
      // SafeToSpend: 4M - 1.5M - 200K = 2,300,000
      expect(result.currentBalance).toBe(4000000);
      expect(result.upcomingBillsTotal).toBe(1500000);
      expect(result.budgetReserves).toBe(200000);
      expect(result.safeToSpend).toBe(2300000);
    });

    it('should return rounded values', () => {
      const transactions = [
        makeTx('income', 3333333, '2026-02-01'),
        makeTx('expense', 1111111, '2026-02-10'),
      ];

      const result = calculateSafeToSpend(transactions, [], '2026-02');

      expect(result.safeToSpend).toBe(Math.round(result.safeToSpend));
      expect(result.currentBalance).toBe(Math.round(result.currentBalance));
    });

    it('should handle safeToSpend going negative', () => {
      const transactions = [
        makeTx('income', 1000000, '2026-02-01'),
        makeTx('expense', 500000, '2026-02-10'),
      ];

      // Balance: 500K, but bills and reserves exceed it
      const budgets = [
        makeBudget('b1', 'cat-1', 800000, '2026-02-01', '2026-02-28'),
      ];

      mockProgressMap.set('b1', { remaining: 400000 });

      mockVirtualTxs.push({
        id: 'vt-1',
        name: 'Big Bill',
        amount: 300000,
        type: 'expense',
        category: 'cat-bills',
        date: '2026-02-20',
        createdAt: Date.now(),
      } as Transaction);

      const result = calculateSafeToSpend(transactions, budgets, '2026-02');

      // Balance: 500K, Bills: 300K, Reserves: 400K → 500K - 300K - 400K = -200K
      expect(result.safeToSpend).toBe(-200000);
    });
  });
});
