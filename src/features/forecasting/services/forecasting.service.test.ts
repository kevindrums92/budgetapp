import { describe, it, expect, vi } from 'vitest';
import type { Transaction } from '@/types/budget.types';
import {
  calculateWeightedAverage,
  calculateCurrentBalance,
  getBalanceZone,
  getHistoryMonths,
  projectFutureBalance,
} from './forecasting.service';

// Mock todayISO to control "today"
vi.mock('@/services/dates.service', () => ({
  todayISO: () => '2026-02-15',
}));

// Mock scheduler — not needed for most tests but required by projectFutureBalance
vi.mock('@/shared/services/scheduler.service', () => ({
  generateVirtualTransactions: () => [],
}));

// --- Helpers ---

function makeTx(
  type: 'income' | 'expense',
  amount: number,
  date: string,
  opts?: { scheduleEnabled?: boolean }
): Transaction {
  return {
    id: `tx-${Math.random().toString(36).slice(2)}`,
    name: 'Test TX',
    amount,
    type,
    category: 'cat-1',
    date,
    createdAt: Date.now(),
    ...(opts?.scheduleEnabled
      ? { schedule: { enabled: true, frequency: 'monthly' as const, interval: 1, startDate: date } }
      : {}),
  };
}

// --- Tests ---

describe('calculateWeightedAverage', () => {
  it('should calculate weighted average for 3 months of expenses', () => {
    // Today is 2026-02-15, so last 3 months are Jan, Dec, Nov
    const transactions: Transaction[] = [
      makeTx('expense', 300000, '2026-01-10'), // Jan (weight 3)
      makeTx('expense', 200000, '2025-12-10'), // Dec (weight 2)
      makeTx('expense', 100000, '2025-11-10'), // Nov (weight 1)
    ];

    const result = calculateWeightedAverage(transactions, 'expense', 3);
    // (300000*3 + 200000*2 + 100000*1) / (3+2+1) = (900000+400000+100000)/6 = 1400000/6
    expect(result).toBeCloseTo(1400000 / 6);
  });

  it('should calculate weighted average for income', () => {
    const transactions: Transaction[] = [
      makeTx('income', 5000000, '2026-01-01'), // Jan (weight 3)
      makeTx('income', 4000000, '2025-12-01'), // Dec (weight 2)
      makeTx('income', 3000000, '2025-11-01'), // Nov (weight 1)
    ];

    const result = calculateWeightedAverage(transactions, 'income', 3);
    // (5M*3 + 4M*2 + 3M*1) / 6 = (15M+8M+3M)/6 = 26M/6
    expect(result).toBeCloseTo(26000000 / 6);
  });

  it('should return 0 when no transactions exist', () => {
    const result = calculateWeightedAverage([], 'expense', 3);
    expect(result).toBe(0);
  });

  it('should ignore transactions of the wrong type', () => {
    const transactions: Transaction[] = [
      makeTx('income', 500000, '2026-01-10'),
      makeTx('income', 300000, '2025-12-10'),
    ];

    const result = calculateWeightedAverage(transactions, 'expense', 3);
    expect(result).toBe(0);
  });

  it('should handle months with zero transactions (zero contribution)', () => {
    // Only Jan has data, Dec and Nov have 0
    const transactions: Transaction[] = [
      makeTx('expense', 600000, '2026-01-05'),
    ];

    const result = calculateWeightedAverage(transactions, 'expense', 3);
    // (600000*3 + 0*2 + 0*1) / 6 = 1800000/6 = 300000
    expect(result).toBe(300000);
  });

  it('should sum multiple transactions in the same month', () => {
    const transactions: Transaction[] = [
      makeTx('expense', 100000, '2026-01-05'),
      makeTx('expense', 200000, '2026-01-15'),
      makeTx('expense', 50000, '2026-01-25'),
    ];

    const result = calculateWeightedAverage(transactions, 'expense', 3);
    // Jan total: 350000 (weight 3), Dec: 0 (weight 2), Nov: 0 (weight 1)
    // (350000*3) / 6 = 175000
    expect(result).toBe(175000);
  });

  it('should use custom reference month when provided', () => {
    const transactions: Transaction[] = [
      makeTx('expense', 100000, '2025-09-10'), // Sep (weight 3 from Oct ref)
      makeTx('expense', 200000, '2025-08-10'), // Aug (weight 2)
      makeTx('expense', 300000, '2025-07-10'), // Jul (weight 1)
    ];

    const result = calculateWeightedAverage(transactions, 'expense', 3, '2025-10');
    // (100000*3 + 200000*2 + 300000*1) / 6 = (300000+400000+300000)/6
    expect(result).toBeCloseTo(1000000 / 6);
  });

  it('should ignore transactions from the current month', () => {
    // Today is 2026-02-15; Feb transactions should NOT count
    const transactions: Transaction[] = [
      makeTx('expense', 999999, '2026-02-10'), // Current month — excluded
      makeTx('expense', 300000, '2026-01-10'), // Jan (weight 3)
    ];

    const result = calculateWeightedAverage(transactions, 'expense', 3);
    // Only Jan counts: (300000*3) / 6 = 150000
    expect(result).toBe(150000);
  });
});

describe('calculateCurrentBalance', () => {
  it('should return income minus expenses for all past transactions', () => {
    const transactions: Transaction[] = [
      makeTx('income', 5000000, '2026-01-01'),
      makeTx('expense', 1000000, '2026-01-15'),
      makeTx('expense', 500000, '2026-02-01'),
    ];

    const result = calculateCurrentBalance(transactions);
    expect(result).toBe(5000000 - 1000000 - 500000);
  });

  it('should return 0 for no transactions', () => {
    expect(calculateCurrentBalance([])).toBe(0);
  });

  it('should return negative balance when expenses exceed income', () => {
    const transactions: Transaction[] = [
      makeTx('income', 1000000, '2026-01-01'),
      makeTx('expense', 2000000, '2026-01-15'),
    ];

    expect(calculateCurrentBalance(transactions)).toBe(-1000000);
  });

  it('should exclude future transactions (after today)', () => {
    // Today is 2026-02-15
    const transactions: Transaction[] = [
      makeTx('income', 5000000, '2026-01-01'),
      makeTx('expense', 1000000, '2026-02-10'), // Before today — included
      makeTx('expense', 9000000, '2026-03-01'), // After today — excluded
    ];

    const result = calculateCurrentBalance(transactions);
    expect(result).toBe(5000000 - 1000000); // Future excluded
  });

  it('should include transaction on today', () => {
    const transactions: Transaction[] = [
      makeTx('income', 1000000, '2026-02-15'), // Exactly today
    ];

    expect(calculateCurrentBalance(transactions)).toBe(1000000);
  });
});

describe('getBalanceZone', () => {
  it('should return green when balance >= 20% of income', () => {
    expect(getBalanceZone(200000, 1000000)).toBe('green'); // 200K = 20% of 1M
    expect(getBalanceZone(500000, 1000000)).toBe('green'); // 50% — very safe
  });

  it('should return yellow when balance is between 0 and 20% of income', () => {
    expect(getBalanceZone(100000, 1000000)).toBe('yellow'); // 10% < 20%
    expect(getBalanceZone(1, 1000000)).toBe('yellow'); // Barely positive
  });

  it('should return red when balance is negative', () => {
    expect(getBalanceZone(-1, 1000000)).toBe('red');
    expect(getBalanceZone(-500000, 1000000)).toBe('red');
  });

  it('should return red when balance is exactly 0', () => {
    expect(getBalanceZone(0, 1000000)).toBe('red');
  });

  it('should handle zero income (green if positive, red if negative)', () => {
    expect(getBalanceZone(100000, 0)).toBe('green');
    expect(getBalanceZone(-100000, 0)).toBe('red');
    expect(getBalanceZone(0, 0)).toBe('red');
  });

  it('should handle negative income (green if positive, red if negative)', () => {
    expect(getBalanceZone(100000, -500000)).toBe('green');
    expect(getBalanceZone(-100000, -500000)).toBe('red');
  });

  it('should return green at exactly 20% threshold', () => {
    expect(getBalanceZone(200000, 1000000)).toBe('green'); // Exactly 20%
  });
});

describe('getHistoryMonths', () => {
  it('should return 0 for empty transactions', () => {
    expect(getHistoryMonths([])).toBe(0);
  });

  it('should count unique months', () => {
    const transactions: Transaction[] = [
      makeTx('expense', 100000, '2026-01-10'),
      makeTx('expense', 200000, '2026-01-20'), // Same month
      makeTx('expense', 300000, '2026-02-05'),
      makeTx('income', 500000, '2025-12-01'),
    ];

    expect(getHistoryMonths(transactions)).toBe(3); // Jan, Feb, Dec
  });

  it('should count 1 when all transactions are in the same month', () => {
    const transactions: Transaction[] = [
      makeTx('expense', 100000, '2026-02-01'),
      makeTx('expense', 200000, '2026-02-15'),
      makeTx('expense', 300000, '2026-02-28'),
    ];

    expect(getHistoryMonths(transactions)).toBe(1);
  });

  it('should count months across different years', () => {
    const transactions: Transaction[] = [
      makeTx('expense', 100000, '2025-11-01'),
      makeTx('expense', 100000, '2025-12-01'),
      makeTx('expense', 100000, '2026-01-01'),
      makeTx('expense', 100000, '2026-02-01'),
    ];

    expect(getHistoryMonths(transactions)).toBe(4);
  });
});

describe('projectFutureBalance', () => {
  it('should return projection points at 30-day intervals', () => {
    const transactions: Transaction[] = [
      makeTx('income', 5000000, '2026-01-01'),
      makeTx('expense', 1000000, '2026-01-15'),
    ];

    const result = projectFutureBalance(transactions, 90);

    // Should have 4 points: 0, 30, 60, 90
    expect(result).toHaveLength(4);
    expect(result[0].dayOffset).toBe(0);
    expect(result[1].dayOffset).toBe(30);
    expect(result[2].dayOffset).toBe(60);
    expect(result[3].dayOffset).toBe(90);
  });

  it('should start with current balance at dayOffset 0', () => {
    const transactions: Transaction[] = [
      makeTx('income', 3000000, '2026-01-01'),
      makeTx('expense', 1000000, '2026-02-01'),
    ];

    const result = projectFutureBalance(transactions, 90);

    expect(result[0].dayOffset).toBe(0);
    expect(result[0].balance).toBe(2000000); // 3M - 1M
  });

  it('should project 30-day intervals for 60-day projection', () => {
    const transactions: Transaction[] = [
      makeTx('income', 1000000, '2026-01-01'),
    ];

    const result = projectFutureBalance(transactions, 60);

    // Should have 3 points: 0, 30, 60
    expect(result).toHaveLength(3);
    expect(result[0].dayOffset).toBe(0);
    expect(result[1].dayOffset).toBe(30);
    expect(result[2].dayOffset).toBe(60);
  });

  it('should have rounded balance values', () => {
    const transactions: Transaction[] = [
      makeTx('income', 3333333, '2026-01-01'),
    ];

    const result = projectFutureBalance(transactions, 90);

    for (const point of result) {
      expect(point.balance).toBe(Math.round(point.balance));
    }
  });

  it('should include date strings in YYYY-MM-DD format', () => {
    const transactions: Transaction[] = [
      makeTx('income', 1000000, '2026-01-01'),
    ];

    const result = projectFutureBalance(transactions, 90);

    for (const point of result) {
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('should set first point date to today', () => {
    const transactions: Transaction[] = [
      makeTx('income', 1000000, '2026-01-01'),
    ];

    const result = projectFutureBalance(transactions, 30);

    expect(result[0].date).toBe('2026-02-15');
  });
});
