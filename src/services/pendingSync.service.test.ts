import { describe, it, expect, beforeEach } from 'vitest';
import {
  setPendingSnapshot,
  getPendingSnapshot,
  clearPendingSnapshot,
  hasPendingSnapshot,
} from './pendingSync.service';
import type { BudgetState } from '@/types/budget.types';

describe('pendingSync.service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockState: BudgetState = {
    schemaVersion: 4,
    transactions: [
      {
        id: '1',
        type: 'expense',
        name: 'Test Transaction',
        category: 'food',
        amount: 50000,
        date: '2026-01-15',
        createdAt: Date.now(),
      },
    ],
    categories: ['food'],
    categoryDefinitions: [],
    categoryGroups: [],
    budgets: [],
    trips: [],
    tripExpenses: [],
  };

  describe('setPendingSnapshot', () => {
    it('should save pending snapshot to localStorage', () => {
      setPendingSnapshot(mockState);

      const saved = localStorage.getItem('budget.pendingSnapshot.v1');
      expect(saved).not.toBeNull();

      if (saved) {
        const parsed = JSON.parse(saved);
        expect(parsed.transactions).toHaveLength(1);
        expect(parsed.transactions[0].name).toBe('Test Transaction');
      }
    });

    it('should overwrite existing pending snapshot', () => {
      const state1: BudgetState = {
        ...mockState,
        transactions: [
          {
            id: '1',
            type: 'expense',
            name: 'First',
            category: 'food',
            amount: 100,
            date: '2026-01-15',
            createdAt: Date.now(),
          },
        ],
      };

      const state2: BudgetState = {
        ...mockState,
        transactions: [
          {
            id: '2',
            type: 'income',
            name: 'Second',
            category: 'salary',
            amount: 1000,
            date: '2026-01-15',
            createdAt: Date.now(),
          },
        ],
      };

      setPendingSnapshot(state1);
      setPendingSnapshot(state2);

      const saved = localStorage.getItem('budget.pendingSnapshot.v1');
      const parsed = JSON.parse(saved!);

      expect(parsed.transactions).toHaveLength(1);
      expect(parsed.transactions[0].name).toBe('Second');
    });

    it('should not throw on localStorage errors', () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('QuotaExceededError');
      };

      expect(() => setPendingSnapshot(mockState)).not.toThrow();

      // Restore
      localStorage.setItem = originalSetItem;
    });
  });

  describe('getPendingSnapshot', () => {
    it('should return null when no pending snapshot exists', () => {
      const snapshot = getPendingSnapshot();
      expect(snapshot).toBeNull();
    });

    it('should retrieve saved pending snapshot', () => {
      setPendingSnapshot(mockState);
      const snapshot = getPendingSnapshot();

      expect(snapshot).not.toBeNull();
      expect(snapshot?.transactions).toHaveLength(1);
      expect(snapshot?.transactions[0].name).toBe('Test Transaction');
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem('budget.pendingSnapshot.v1', 'invalid json');
      const snapshot = getPendingSnapshot();
      expect(snapshot).toBeNull();
    });

    it('should return null on localStorage errors', () => {
      // Mock localStorage.getItem to throw
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = () => {
        throw new Error('Some error');
      };

      const snapshot = getPendingSnapshot();
      expect(snapshot).toBeNull();

      // Restore
      localStorage.getItem = originalGetItem;
    });
  });

  describe('clearPendingSnapshot', () => {
    it('should remove pending snapshot from localStorage', () => {
      setPendingSnapshot(mockState);
      expect(localStorage.getItem('budget.pendingSnapshot.v1')).not.toBeNull();

      clearPendingSnapshot();
      expect(localStorage.getItem('budget.pendingSnapshot.v1')).toBeNull();
    });

    it('should not throw when clearing empty localStorage', () => {
      expect(() => clearPendingSnapshot()).not.toThrow();
    });

    it('should not throw on localStorage errors', () => {
      // Mock localStorage.removeItem to throw
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = () => {
        throw new Error('Some error');
      };

      expect(() => clearPendingSnapshot()).not.toThrow();

      // Restore
      localStorage.removeItem = originalRemoveItem;
    });
  });

  describe('hasPendingSnapshot', () => {
    it('should return false when no pending snapshot exists', () => {
      expect(hasPendingSnapshot()).toBe(false);
    });

    it('should return true when pending snapshot exists', () => {
      setPendingSnapshot(mockState);
      expect(hasPendingSnapshot()).toBe(true);
    });

    it('should return false after clearing', () => {
      setPendingSnapshot(mockState);
      expect(hasPendingSnapshot()).toBe(true);

      clearPendingSnapshot();
      expect(hasPendingSnapshot()).toBe(false);
    });

    it('should return false for invalid JSON', () => {
      localStorage.setItem('budget.pendingSnapshot.v1', 'invalid json');
      expect(hasPendingSnapshot()).toBe(false);
    });
  });

  describe('Empty snapshot validation (Critical for data loss prevention)', () => {
    const emptySnapshot: BudgetState = {
      schemaVersion: 8,
      transactions: [],
      categories: [],
      categoryDefinitions: [],
      categoryGroups: [],
      budgets: [],
      trips: [],
      tripExpenses: [],
    };

    it('should store and retrieve empty snapshot', () => {
      setPendingSnapshot(emptySnapshot);

      const result = getPendingSnapshot();
      expect(result).toBeTruthy();
      expect(result?.transactions).toHaveLength(0);
      expect(result?.categoryDefinitions).toHaveLength(0);
      expect(result?.trips).toHaveLength(0);
      expect(result?.budgets).toHaveLength(0);
    });

    it('should detect snapshot with only transactions as having data', () => {
      const snapshotWithTransactions: BudgetState = {
        ...emptySnapshot,
        transactions: [
          {
            id: '1',
            type: 'expense',
            name: 'Test',
            category: 'food',
            amount: 1000,
            date: '2024-01-01',
            createdAt: Date.now(),
          },
        ],
      };

      setPendingSnapshot(snapshotWithTransactions);

      const result = getPendingSnapshot();
      expect(result?.transactions.length).toBeGreaterThan(0);
    });

    it('should detect snapshot with only categories as having data', () => {
      const snapshotWithCategories: BudgetState = {
        ...emptySnapshot,
        categoryDefinitions: [
          {
            id: 'cat-1',
            name: 'Food',
            icon: 'utensils',
            color: '#FF5733',
            type: 'expense',
            groupId: 'group-1',
          },
        ],
      };

      setPendingSnapshot(snapshotWithCategories);

      const result = getPendingSnapshot();
      expect(result?.categoryDefinitions.length).toBeGreaterThan(0);
    });

    it('should detect snapshot with only trips as having data', () => {
      const snapshotWithTrips: BudgetState = {
        ...emptySnapshot,
        trips: [
          {
            id: 'trip-1',
            name: 'Vacation',
            startDate: '2024-01-01',
            endDate: '2024-01-07',
            budget: 10000,
            createdAt: Date.now(),
          },
        ],
      };

      setPendingSnapshot(snapshotWithTrips);

      const result = getPendingSnapshot();
      expect(result?.trips.length).toBeGreaterThan(0);
    });

    it('should detect snapshot with only budgets as having data', () => {
      const snapshotWithBudgets: BudgetState = {
        ...emptySnapshot,
        budgets: [
          {
            id: 'budget-1',
            name: 'Monthly Budget',
            amount: 50000,
            period: 'monthly',
            startDate: '2024-01-01',
            categoryIds: [],
            createdAt: Date.now(),
          },
        ],
      };

      setPendingSnapshot(snapshotWithBudgets);

      const result = getPendingSnapshot();
      expect(result?.budgets.length).toBeGreaterThan(0);
    });

    it('should distinguish between truly empty snapshot and snapshot with data', () => {
      // First: truly empty
      setPendingSnapshot(emptySnapshot);
      let result = getPendingSnapshot();
      const hasData1 =
        (result?.transactions && result.transactions.length > 0) ||
        (result?.categoryDefinitions && result.categoryDefinitions.length > 0) ||
        (result?.trips && result.trips.length > 0) ||
        (result?.budgets && result.budgets.length > 0);
      expect(hasData1).toBe(false);

      // Second: with data
      const snapshotWithData: BudgetState = {
        ...emptySnapshot,
        transactions: [
          {
            id: '1',
            type: 'expense',
            name: 'Test',
            category: 'food',
            amount: 1000,
            date: '2024-01-01',
            createdAt: Date.now(),
          },
        ],
      };

      setPendingSnapshot(snapshotWithData);
      result = getPendingSnapshot();
      const hasData2 =
        (result?.transactions && result.transactions.length > 0) ||
        (result?.categoryDefinitions && result.categoryDefinitions.length > 0) ||
        (result?.trips && result.trips.length > 0) ||
        (result?.budgets && result.budgets.length > 0);
      expect(hasData2).toBe(true);
    });
  });
});
