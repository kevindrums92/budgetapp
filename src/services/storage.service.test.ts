import { describe, it, expect, beforeEach, vi } from 'vitest';
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
            createdAt: Date.now(),
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
            createdAt: Date.now(),
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
            createdAt: Date.now(),
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
            createdAt: Date.now(),
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

  describe('Schema migrations', () => {
    describe('v1 to v2 migration (string categories to Category objects)', () => {
      it('should migrate legacy v1 state with string categories', () => {
        const v1State = {
          schemaVersion: 1,
          transactions: [
            {
              id: '1',
              type: 'expense',
              name: 'Groceries',
              category: 'Mercado', // String category name (default category)
              amount: 100,
              date: '2026-01-15',
              createdAt: Date.now(),
            },
          ],
          categories: ['Mercado', 'Transporte', 'CustomCategory'],
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(v1State));
        const loaded = loadState();

        expect(loaded).not.toBeNull();
        expect(loaded?.schemaVersion).toBe(5); // Should migrate all the way to v5
        expect(loaded?.categoryDefinitions).toBeDefined();
        expect(Array.isArray(loaded?.categoryDefinitions)).toBe(true);
        expect(loaded!.categoryDefinitions.length).toBeGreaterThan(0);

        // Should have default categories plus custom one
        const customCat = loaded?.categoryDefinitions.find(c => c.name === 'CustomCategory');
        expect(customCat).toBeDefined();
        expect(customCat?.isDefault).toBe(false);
        expect(customCat?.type).toBe('expense');
      });

      it('should migrate transactions to use category IDs instead of names', () => {
        const v1State = {
          schemaVersion: 1,
          transactions: [
            {
              id: '1',
              type: 'expense',
              name: 'Test',
              category: 'Mercado',
              amount: 100,
              date: '2026-01-15',
              createdAt: Date.now(),
            },
          ],
          categories: ['Mercado'],
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(v1State));
        const loaded = loadState();

        // Transaction category should now be a UUID (category ID)
        expect(loaded?.transactions[0].category).toMatch(/^[a-f0-9-]{36}$/);

        // Should match a category definition ID
        const categoryId = loaded?.transactions[0].category;
        const categoryDef = loaded?.categoryDefinitions.find(c => c.id === categoryId);
        expect(categoryDef).toBeDefined();
      });

      it('should handle state without schemaVersion (legacy v1)', () => {
        const legacyState = {
          // No schemaVersion field
          transactions: [
            {
              id: '1',
              type: 'expense',
              name: 'Old Transaction',
              category: 'OldCategory',
              amount: 50,
              date: '2026-01-15',
              createdAt: Date.now(),
            },
          ],
          categories: ['OldCategory'],
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(legacyState));
        const loaded = loadState();

        expect(loaded).not.toBeNull();
        expect(loaded?.schemaVersion).toBe(5);
        expect(loaded?.categoryDefinitions).toBeDefined();
      });

      it('should filter out empty category names during migration', () => {
        const v1State = {
          schemaVersion: 1,
          transactions: [],
          categories: ['ValidCategory', '', '  ', 'AnotherValid'],
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(v1State));
        const loaded = loadState();

        const customCategories = loaded?.categoryDefinitions.filter(c => !c.isDefault);
        const categoryNames = customCategories?.map(c => c.name) || [];

        expect(categoryNames).toContain('ValidCategory');
        expect(categoryNames).toContain('AnotherValid');
        expect(categoryNames).not.toContain('');
        expect(categoryNames).not.toContain('  ');
      });

      it('should not duplicate default categories during migration', () => {
        const v1State = {
          schemaVersion: 1,
          transactions: [],
          categories: ['Mercado', 'MERCADO', 'mercado', 'CustomOne'],
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(v1State));
        const loaded = loadState();

        // Count how many "Mercado" categories exist
        const mercadoCategories = loaded?.categoryDefinitions.filter(
          c => c.name.toLowerCase() === 'mercado'
        );

        // Should only have one (the default), not 3
        expect(mercadoCategories?.length).toBe(1);

        // CustomOne should be added
        const customCat = loaded?.categoryDefinitions.find(c => c.name === 'CustomOne');
        expect(customCat).toBeDefined();
      });
    });

    describe('v2 to v3 migration (add categoryGroups)', () => {
      it('should add categoryGroups to v2 state', () => {
        const v2State = {
          schemaVersion: 2,
          transactions: [],
          categoryDefinitions: [
            {
              id: 'cat-1',
              name: 'Test Category',
              icon: 'shopping-bag',
              color: '#3b82f6',
              type: 'expense' as const,
              groupId: 'miscellaneous',
              isDefault: false,
              createdAt: Date.now(),
            },
          ],
          categories: [],
          trips: [],
          tripExpenses: [],
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(v2State));
        const loaded = loadState();

        expect(loaded?.schemaVersion).toBe(5);
        expect(loaded?.categoryGroups).toBeDefined();
        expect(Array.isArray(loaded?.categoryGroups)).toBe(true);
        expect(loaded!.categoryGroups.length).toBeGreaterThan(0);
      });
    });

    describe('v3 to v4 to v5 migration (add isRecurring, then convert to schedule)', () => {
      it('should add isRecurring field and migrate to schedule', () => {
        const v3State = {
          schemaVersion: 3,
          transactions: [
            {
              id: '1',
              type: 'expense' as const,
              name: 'Rent',
              category: 'cat-1',
              amount: 1000,
              date: '2026-01-01',
              createdAt: Date.now(),
              // No isRecurring field
            },
            {
              id: '2',
              type: 'income' as const,
              name: 'Salary',
              category: 'cat-2',
              amount: 5000,
              date: '2026-01-01',
              createdAt: Date.now(),
              // No isRecurring field
            },
          ],
          categoryDefinitions: [],
          categoryGroups: [],
          categories: [],
          trips: [],
          tripExpenses: [],
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(v3State));
        const loaded = loadState();

        expect(loaded?.schemaVersion).toBe(5);
        expect(loaded?.transactions[0].isRecurring).toBe(false);
        expect(loaded?.transactions[1].isRecurring).toBe(false);
      });

      it('should preserve existing isRecurring values', () => {
        const v3State = {
          schemaVersion: 3,
          transactions: [
            {
              id: '1',
              type: 'expense' as const,
              name: 'Rent',
              category: 'cat-1',
              amount: 1000,
              date: '2026-01-01',
              createdAt: Date.now(),
              isRecurring: true, // Already has value
            },
          ],
          categoryDefinitions: [],
          categoryGroups: [],
          categories: [],
          trips: [],
          tripExpenses: [],
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(v3State));
        const loaded = loadState();

        expect(loaded?.transactions[0].isRecurring).toBe(true);
      });
    });

    describe('Edge cases and data integrity', () => {
      it('should handle missing categories array in v1 state', () => {
        const v1State = {
          schemaVersion: 1,
          transactions: [],
          // No categories array
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(v1State));
        const loaded = loadState();

        expect(loaded).not.toBeNull();
        expect(loaded?.categoryDefinitions).toBeDefined();
        expect(loaded!.categoryDefinitions.length).toBeGreaterThan(0);
      });

      it('should ensure all required arrays exist after migration', () => {
        const minimalV1State = {
          schemaVersion: 1,
          transactions: [],
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(minimalV1State));
        const loaded = loadState();

        expect(Array.isArray(loaded?.transactions)).toBe(true);
        expect(Array.isArray(loaded?.categories)).toBe(true);
        expect(Array.isArray(loaded?.trips)).toBe(true);
        expect(Array.isArray(loaded?.tripExpenses)).toBe(true);
        expect(Array.isArray(loaded?.categoryDefinitions)).toBe(true);
        expect(Array.isArray(loaded?.categoryGroups)).toBe(true);
      });

      it('should handle state with missing categoryDefinitions', () => {
        const stateWithoutCategoryDefs = {
          schemaVersion: 4,
          transactions: [],
          categories: ['OldCategory'],
          trips: [],
          tripExpenses: [],
          // Missing categoryDefinitions
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(stateWithoutCategoryDefs));
        const loaded = loadState();

        expect(loaded?.categoryDefinitions).toBeDefined();
        expect(loaded!.categoryDefinitions.length).toBeGreaterThan(0);

        // Should have default categories
        const mercadoCategory = loaded?.categoryDefinitions.find(
          c => c.name.toLowerCase() === 'mercado'
        );
        expect(mercadoCategory).toBeDefined();
        expect(mercadoCategory?.isDefault).toBe(true);
      });

      it('should handle state with empty categoryDefinitions array', () => {
        const stateWithEmptyCategoryDefs = {
          schemaVersion: 4,
          transactions: [],
          categories: [],
          categoryDefinitions: [], // Empty array
          categoryGroups: [],
          trips: [],
          tripExpenses: [],
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(stateWithEmptyCategoryDefs));
        const loaded = loadState();

        expect(loaded?.categoryDefinitions).toBeDefined();
        expect(loaded!.categoryDefinitions.length).toBeGreaterThan(0);
      });

      it('should handle state with empty categoryGroups array', () => {
        const stateWithEmptyGroups = {
          schemaVersion: 4,
          transactions: [],
          categories: [],
          categoryDefinitions: [
            {
              id: 'cat-1',
              name: 'Test',
              icon: 'icon',
              color: '#000',
              type: 'expense' as const,
              groupId: 'group-1',
              isDefault: false,
              createdAt: Date.now(),
            },
          ],
          categoryGroups: [], // Empty array
          trips: [],
          tripExpenses: [],
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(stateWithEmptyGroups));
        const loaded = loadState();

        expect(loaded?.categoryGroups).toBeDefined();
        expect(loaded!.categoryGroups.length).toBeGreaterThan(0);
      });

      it('should return null for state with invalid transactions array', () => {
        const invalidState = {
          schemaVersion: 4,
          transactions: 'not an array', // Invalid
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(invalidState));
        const loaded = loadState();

        expect(loaded).toBeNull();
      });

      it('should persist migration to localStorage', () => {
        const v1State = {
          schemaVersion: 1,
          transactions: [],
          categories: ['CustomCategory'],
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(v1State));
        loadState(); // Load and trigger migration

        // Read directly from localStorage to verify persistence
        const persisted = localStorage.getItem('budget_app_v1');
        const parsed = JSON.parse(persisted!);

        expect(parsed.schemaVersion).toBe(5);
        expect(parsed.categoryDefinitions).toBeDefined();
        expect(parsed.categoryGroups).toBeDefined();
      });

      it('should handle localStorage.setItem failure during migration persistence', () => {
        const v1State = {
          schemaVersion: 1,
          transactions: [],
          categories: [],
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(v1State));

        // Mock setItem to throw (e.g., quota exceeded)
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = vi.fn(() => {
          throw new Error('QuotaExceededError');
        });

        // Should still return the migrated state, just not persist it
        const loaded = loadState();

        expect(loaded).not.toBeNull();
        expect(loaded?.schemaVersion).toBe(5);

        // Restore original
        localStorage.setItem = originalSetItem;
      });
    });

    describe('Full migration path: v1 → v2 → v3 → v4 → v5', () => {
      it('should migrate through all versions in one loadState call', () => {
        const v1State = {
          schemaVersion: 1,
          transactions: [
            {
              id: '1',
              type: 'expense' as const,
              name: 'Coffee',
              category: 'Café', // String category
              amount: 5,
              date: '2026-01-15',
              createdAt: Date.now(),
              // No isRecurring
            },
          ],
          categories: ['Café', 'Transporte'],
          // No categoryGroups
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(v1State));
        const loaded = loadState();

        // Should be at v5
        expect(loaded?.schemaVersion).toBe(5);

        // v1→v2: categoryDefinitions exist
        expect(loaded?.categoryDefinitions).toBeDefined();
        expect(loaded!.categoryDefinitions.length).toBeGreaterThan(0);

        // v1→v2: transaction category is now ID
        expect(loaded?.transactions[0].category).toMatch(/^[a-f0-9-]{36}$/);

        // v2→v3: categoryGroups exist
        expect(loaded?.categoryGroups).toBeDefined();
        expect(loaded!.categoryGroups.length).toBeGreaterThan(0);

        // v3→v4: isRecurring field exists
        expect(loaded?.transactions[0]).toHaveProperty('isRecurring');
        expect(loaded?.transactions[0].isRecurring).toBe(false);

        // v4→v5: migrations complete (isRecurring without schedule stays as is)
        expect(loaded?.schemaVersion).toBe(5);
      });
    });
  });

  describe('Error handling', () => {
    it('should not throw when saveState fails', () => {
      const state: Partial<BudgetState> = {
        transactions: [],
      };

      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => saveState(state as BudgetState)).not.toThrow();

      localStorage.setItem = originalSetItem;
    });

    it('should not throw when clearState fails', () => {
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => clearState()).not.toThrow();

      localStorage.removeItem = originalRemoveItem;
    });
  });
});
