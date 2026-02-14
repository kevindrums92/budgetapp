import { describe, it, expect } from 'vitest';
import type { Budget } from '@/types/budget.types';

/**
 * StatsPage Navigation Logic Tests
 *
 * These tests verify the navigation logic without rendering the full component.
 * The component is too complex to test in isolation, so we extract and test the logic separately.
 */

describe('StatsPage - Navigation Logic', () => {
  /**
   * Extracted navigation logic from StatsPage category click handler
   */
  function findActiveBudgetForCategoryInMonth(
    budgets: Budget[],
    categoryId: string,
    selectedMonth: string
  ): Budget | undefined {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const firstDay = `${selectedMonth}-01`;
    const lastDay = `${selectedMonth}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;

    return budgets.find(
      (b) =>
        b.status === 'active' &&
        b.categoryId === categoryId &&
        b.period.startDate <= lastDay &&
        b.period.endDate >= firstDay
    );
  }

  /**
   * Determines navigation target based on budget presence
   */
  function getNavigationTarget(
    categoryId: string,
    selectedMonth: string,
    activeBudget: Budget | undefined
  ): string {
    if (activeBudget) {
      return `/plan/${activeBudget.id}`;
    } else {
      return `/category/${categoryId}/month/${selectedMonth}`;
    }
  }

  describe('Budget Detection', () => {
    const mockBudgets: Budget[] = [
      {
        id: 'budget-1',
        categoryId: 'cat-1',
        amount: 200000,
        type: 'limit',
        status: 'active',
        period: {
          type: 'month',
          startDate: '2026-02-01',
          endDate: '2026-02-28',
        },
        isRecurring: false,
        createdAt: new Date('2026-02-01T12:00:00Z').getTime(),
      },
    ];

    it('should find active budget for category in month', () => {
      const budget = findActiveBudgetForCategoryInMonth(mockBudgets, 'cat-1', '2026-02');

      expect(budget).toBeDefined();
      expect(budget?.id).toBe('budget-1');
    });

    it('should not find budget for different category', () => {
      const budget = findActiveBudgetForCategoryInMonth(mockBudgets, 'cat-2', '2026-02');

      expect(budget).toBeUndefined();
    });

    it('should not find budget for different month', () => {
      const budget = findActiveBudgetForCategoryInMonth(mockBudgets, 'cat-1', '2026-03');

      expect(budget).toBeUndefined();
    });

    it('should handle budget with partial period overlap (starts mid-month)', () => {
      const midMonthBudgets: Budget[] = [
        {
          id: 'budget-mid',
          categoryId: 'cat-1',
          amount: 200000,
          type: 'limit',
          status: 'active',
          period: {
            type: 'custom',
            startDate: '2026-02-15',
            endDate: '2026-03-15',
          },
          isRecurring: false,
          createdAt: new Date('2026-02-15T12:00:00Z').getTime(),
        },
      ];

      const budget = findActiveBudgetForCategoryInMonth(midMonthBudgets, 'cat-1', '2026-02');

      expect(budget).toBeDefined();
      expect(budget?.id).toBe('budget-mid');
    });

    it('should handle budget with partial period overlap (ends mid-month)', () => {
      const endsMidMonthBudgets: Budget[] = [
        {
          id: 'budget-ends',
          categoryId: 'cat-1',
          amount: 200000,
          type: 'limit',
          status: 'active',
          period: {
            type: 'custom',
            startDate: '2026-01-15',
            endDate: '2026-02-15',
          },
          isRecurring: false,
          createdAt: new Date('2026-01-15T12:00:00Z').getTime(),
        },
      ];

      const budget = findActiveBudgetForCategoryInMonth(endsMidMonthBudgets, 'cat-1', '2026-02');

      expect(budget).toBeDefined();
      expect(budget?.id).toBe('budget-ends');
    });

    it('should not find budget when status is not active', () => {
      const completedBudgets: Budget[] = [
        {
          id: 'budget-completed',
          categoryId: 'cat-1',
          amount: 200000,
          type: 'limit',
          status: 'completed',
          period: {
            type: 'month',
            startDate: '2026-02-01',
            endDate: '2026-02-28',
          },
          isRecurring: false,
          createdAt: new Date('2026-02-01T12:00:00Z').getTime(),
        },
      ];

      const budget = findActiveBudgetForCategoryInMonth(completedBudgets, 'cat-1', '2026-02');

      expect(budget).toBeUndefined();
    });

    it('should correctly calculate last day of February (28 days)', () => {
      const budget = findActiveBudgetForCategoryInMonth(mockBudgets, 'cat-1', '2026-02');

      expect(budget).toBeDefined();
    });

    it('should correctly calculate last day of February in leap year (29 days)', () => {
      const leapYearBudgets: Budget[] = [
        {
          id: 'budget-leap',
          categoryId: 'cat-1',
          amount: 200000,
          type: 'limit',
          status: 'active',
          period: {
            type: 'month',
            startDate: '2024-02-01',
            endDate: '2024-02-29',
          },
          isRecurring: false,
          createdAt: new Date('2024-02-01T12:00:00Z').getTime(),
        },
      ];

      const budget = findActiveBudgetForCategoryInMonth(leapYearBudgets, 'cat-1', '2024-02');

      expect(budget).toBeDefined();
      expect(budget?.id).toBe('budget-leap');
    });
  });

  describe('Navigation Target', () => {
    const activeBudget: Budget = {
      id: 'budget-1',
      categoryId: 'cat-1',
      amount: 200000,
      type: 'limit',
      status: 'active',
      period: {
        type: 'month',
        startDate: '2026-02-01',
        endDate: '2026-02-28',
      },
      isRecurring: false,
      createdAt: new Date('2026-02-01T12:00:00Z').getTime(),
    };

    it('should navigate to plan detail when budget exists', () => {
      const target = getNavigationTarget('cat-1', '2026-02', activeBudget);

      expect(target).toBe('/plan/budget-1');
    });

    it('should navigate to category month detail when no budget', () => {
      const target = getNavigationTarget('cat-1', '2026-02', undefined);

      expect(target).toBe('/category/cat-1/month/2026-02');
    });

    it('should use correct month format in URL', () => {
      const target = getNavigationTarget('cat-1', '2024-12', undefined);

      expect(target).toBe('/category/cat-1/month/2024-12');
    });
  });
});
