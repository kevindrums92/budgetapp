import { describe, it, expect, beforeEach, vi} from 'vitest';
import { saveState, loadState, clearState } from './storage.service';
import type { BudgetState } from '@/types/budget.types';

describe('storage.service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('saveState', () => {
    it('should save state to localStorage', () => {
      const state: Partial<BudgetState> = {
        transactions: [
          {
            id: '1',
            type: 'expense',
            name: 'Test',
            category: 'food',
            amount: 100,
            date: '2026-01-15',
            createdAt: '2026-01-15T12:00:00Z',
          },
        ],
      };

      saveState(state as BudgetState);

      const saved = localStorage.getItem('budget_app_v1');
      expect(saved).not.toBeNull();

      if (saved) {
        const parsed = JSON.parse(saved);
        expect(parsed.transactions).toHaveLength(1);
        expect(parsed.transactions[0].name).toBe('Test');
      }
    });

    it('should overwrite existing state', () => {
      const state1: Partial<BudgetState> = {
        transactions: [
          {
            id: '1',
            type: 'expense',
            name: 'First',
            category: 'food',
            amount: 100,
            date: '2026-01-15',
            createdAt: '2026-01-15T12:00:00Z',
          },
        ],
      };

      const state2: Partial<BudgetState> = {
        transactions: [
          {
            id: '2',
            type: 'income',
            name: 'Second',
            category: 'salary',
            amount: 1000,
            date: '2026-01-15',
            createdAt: '2026-01-15T12:00:00Z',
          },
        ],
      };

      saveState(state1 as BudgetState);
      saveState(state2 as BudgetState);

      const saved = localStorage.getItem('budget_app_v1');
      const parsed = JSON.parse(saved!);

      expect(parsed.transactions).toHaveLength(1);
      expect(parsed.transactions[0].name).toBe('Second');
    });
  });

  describe('loadState', () => {
    it('should return null when no state exists', () => {
      const state = loadState();
      expect(state).toBeNull();
    });

    it('should load saved state from localStorage', () => {
      const state: Partial<BudgetState> = {
        transactions: [
          {
            id: '1',
            type: 'expense',
            name: 'Test Load',
            category: 'food',
            amount: 200,
            date: '2026-01-15',
            createdAt: '2026-01-15T12:00:00Z',
          },
        ],
      };

      saveState(state as BudgetState);
      const loaded = loadState();

      expect(loaded).not.toBeNull();
      expect(loaded?.transactions).toHaveLength(1);
      expect(loaded?.transactions[0].name).toBe('Test Load');
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem('budget_app_v1', 'invalid json');
      const state = loadState();
      expect(state).toBeNull();
    });
  });

  describe('clearState', () => {
    it('should remove state from localStorage', () => {
      const state: Partial<BudgetState> = {
        transactions: [],
      };

      saveState(state as BudgetState);
      expect(localStorage.getItem('budget_app_v1')).not.toBeNull();

      clearState();
      expect(localStorage.getItem('budget_app_v1')).toBeNull();
    });

    it('should not error when clearing empty localStorage', () => {
      expect(() => clearState()).not.toThrow();
    });
  });
});
