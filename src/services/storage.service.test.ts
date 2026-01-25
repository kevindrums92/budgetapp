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
        expect(loaded?.schemaVersion).toBe(6); // Should migrate all the way to v5
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
        expect(loaded?.schemaVersion).toBe(6);
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

        expect(loaded?.schemaVersion).toBe(6);
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

        expect(loaded?.schemaVersion).toBe(6);
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

        // New users with no transactions should keep empty categoryDefinitions
        // (they're created during onboarding)
        expect(loaded?.categoryDefinitions).toBeDefined();
        expect(loaded!.categoryDefinitions).toEqual([]);
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

        expect(parsed.schemaVersion).toBe(6);
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
        expect(loaded?.schemaVersion).toBe(6);

        // Restore original
        localStorage.setItem = originalSetItem;
      });
    });

    describe('v4 → v5: Full scheduled transactions support', () => {
      it('should deduplicate schedule templates and link transactions', () => {
        const v4State = {
          schemaVersion: 4,
          transactions: [
            // Three "Netflix" transactions with isRecurring - should convert to schedule and deduplicate to 1 template
            {
              id: 'netflix-jan',
              type: 'expense' as const,
              name: 'Netflix',
              category: 'suscripciones',
              amount: 60000,
              date: '2025-01-17',
              createdAt: 1000,
              isRecurring: true,
            },
            {
              id: 'netflix-feb',
              type: 'expense' as const,
              name: 'Netflix',
              category: 'suscripciones',
              amount: 60000,
              date: '2025-02-17',
              createdAt: 2000,
              isRecurring: true,
            },
            {
              id: 'netflix-mar',
              type: 'expense' as const,
              name: 'Netflix',
              category: 'suscripciones',
              amount: 60000,
              date: '2025-03-17',
              createdAt: 3000,
              isRecurring: true,
            },
            // A different subscription - should remain as 1 template
            {
              id: 'spotify-jan',
              type: 'expense' as const,
              name: 'Spotify',
              category: 'suscripciones',
              amount: 30000,
              date: '2025-01-15',
              createdAt: 1000,
              isRecurring: true,
            },
            // Non-recurring transaction - should remain unchanged
            {
              id: 'groceries',
              type: 'expense' as const,
              name: 'Groceries',
              category: 'food',
              amount: 100000,
              date: '2025-01-20',
              createdAt: 4000,
            },
          ],
          categories: [],
          categoryDefinitions: [],
          categoryGroups: [],
          trips: [],
          tripExpenses: [],
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(v4State));
        const loaded = loadState();

        expect(loaded?.schemaVersion).toBe(6);

        // Should have 2 templates (Netflix + Spotify) + 1 groceries + 2 deduplicated Netflix (now without schedule)
        expect(loaded?.transactions.length).toBe(5);

        // Check that only the most recent Netflix is a template
        const netflixTemplates = loaded?.transactions.filter(
          tx => tx.name === 'Netflix' && tx.schedule?.enabled
        );
        expect(netflixTemplates?.length).toBe(1);
        expect(netflixTemplates?.[0].id).toBe('netflix-mar'); // Most recent by date

        // Check that the older Netflix transactions lost their schedule but got sourceTemplateId
        const netflixNonTemplates = loaded?.transactions.filter(
          tx => tx.name === 'Netflix' && !tx.schedule?.enabled
        );
        expect(netflixNonTemplates?.length).toBe(2);
        // They should be linked to the template
        netflixNonTemplates?.forEach(tx => {
          expect(tx.sourceTemplateId).toBe('netflix-mar');
        });

        // Spotify should still have its template
        const spotifyTemplates = loaded?.transactions.filter(
          tx => tx.name === 'Spotify' && tx.schedule?.enabled
        );
        expect(spotifyTemplates?.length).toBe(1);

        // Groceries should be unchanged (no schedule, no sourceTemplateId)
        const groceries = loaded?.transactions.find(tx => tx.name === 'Groceries');
        expect(groceries).toBeDefined();
        expect(groceries?.schedule).toBeUndefined();
        expect(groceries?.sourceTemplateId).toBeUndefined();
      });

      it('should link transactions to templates by name+category', () => {
        const v4State = {
          schemaVersion: 4,
          transactions: [
            // Template transaction with isRecurring
            {
              id: 'template-rent',
              type: 'expense' as const,
              name: 'Rent',
              category: 'housing',
              amount: 1000000,
              date: '2025-01-15',
              createdAt: 1000,
              isRecurring: true,
            },
            // Non-recurring transaction (same name/category) - should get sourceTemplateId
            {
              id: 'rent-manual',
              type: 'expense' as const,
              name: 'Rent',
              category: 'housing',
              amount: 1050000, // Different amount
              date: '2025-02-15',
              createdAt: 2000,
              isRecurring: false,
            },
            // Unrelated transaction
            {
              id: 'groceries',
              type: 'expense' as const,
              name: 'Groceries',
              category: 'food',
              amount: 100000,
              date: '2025-01-20',
              createdAt: 3000,
              isRecurring: false,
            },
          ],
          categories: [],
          categoryDefinitions: [],
          categoryGroups: [],
          trips: [],
          tripExpenses: [],
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(v4State));
        const loaded = loadState();

        expect(loaded?.schemaVersion).toBe(6);

        // Template should NOT have sourceTemplateId
        const template = loaded?.transactions.find(tx => tx.id === 'template-rent');
        expect(template?.sourceTemplateId).toBeUndefined();
        expect(template?.schedule?.enabled).toBe(true);

        // Manual rent should be linked to template (same name+category)
        const manualRent = loaded?.transactions.find(tx => tx.id === 'rent-manual');
        expect(manualRent?.sourceTemplateId).toBe('template-rent');

        // Groceries should NOT be linked (no matching template)
        const groceries = loaded?.transactions.find(tx => tx.id === 'groceries');
        expect(groceries?.sourceTemplateId).toBeUndefined();
      });

      it('should preserve existing sourceTemplateId', () => {
        const v4State = {
          schemaVersion: 4,
          transactions: [
            {
              id: 'template-netflix',
              type: 'expense' as const,
              name: 'Netflix',
              category: 'subscriptions',
              amount: 60000,
              date: '2025-01-17',
              createdAt: 1000,
              isRecurring: true,
            },
            {
              id: 'netflix-feb',
              type: 'expense' as const,
              name: 'Netflix',
              category: 'subscriptions',
              amount: 60000,
              date: '2025-02-17',
              createdAt: 2000,
              isRecurring: false,
              sourceTemplateId: 'some-other-template', // Already has sourceTemplateId
            },
          ],
          categories: [],
          categoryDefinitions: [],
          categoryGroups: [],
          trips: [],
          tripExpenses: [],
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(v4State));
        const loaded = loadState();

        // Should preserve existing sourceTemplateId
        const febTx = loaded?.transactions.find(tx => tx.id === 'netflix-feb');
        expect(febTx?.sourceTemplateId).toBe('some-other-template');
      });
    });

    describe('v4 → v5 migration with real data (statev4withsomerecurrentrecords.json)', () => {
      /**
       * This test uses real production data structure from statev4withsomerecurrentrecords.json
       * It verifies:
       * 1. All isRecurring=true transactions get converted to schedule
       * 2. Duplicate schedule templates are deduplicated (only most recent kept)
       * 3. All non-template transactions with same name+category get sourceTemplateId
       * 4. The repair logic links transactions that were confirmed before sourceTemplateId existed
       */
      it('should correctly migrate real v4 data with recurring transactions', () => {
        // Simulating the key transactions from statev4withsomerecurrentrecords.json
        const v4RealData = {
          schemaVersion: 4,
          trips: [],
          tripExpenses: [],
          categories: [],
          categoryGroups: [
            { id: 'food_drink', name: 'Comida y Bebida', type: 'expense', color: '#D97706', createdAt: 1768671561339, isDefault: true },
            { id: 'home_utilities', name: 'Hogar y Servicios', type: 'expense', color: '#3B82F6', createdAt: 1768671561339, isDefault: true },
            { id: 'lifestyle', name: 'Estilo de Vida', type: 'expense', color: '#EC4899', createdAt: 1768671561339, isDefault: true },
            { id: 'primary_income', name: 'Ingresos Principales', type: 'income', color: '#10B981', createdAt: 1768671561339, isDefault: true },
            { id: 'other_income', name: 'Otros Ingresos', type: 'income', color: '#8B5CF6', createdAt: 1768671561339, isDefault: true },
          ],
          categoryDefinitions: [
            { id: 'c2a7c6e0-c319-4de8-bffb-a5756dcfc001', icon: 'tv', name: 'Suscripciones', type: 'expense', color: '#EC4899', groupId: 'home_utilities', createdAt: 1768671561339, isDefault: true },
            { id: '116fd9da-a36d-4ebf-b219-af51d0ca6e9f', icon: 'key', name: 'Arriendo Recibido', type: 'income', color: '#F59E0B', groupId: 'other_income', createdAt: 1768671561339, isDefault: true },
            { id: 'f10599b5-a071-4328-83a5-199d9ab617ff', icon: 'briefcase', name: 'Salario', type: 'income', color: '#10B981', groupId: 'primary_income', createdAt: 1768671561339, isDefault: true },
          ],
          transactions: [
            // Non-recurring transactions
            { id: '7a295614-1db9-4129-ac7b-2abd73c3cdba', date: '2026-01-20', name: 'Pan trecia', type: 'expense', amount: 50000, category: 'e64b4c1b-5f78-4c36-9581-5198eb6b3969', createdAt: 1768957351665, isRecurring: false },
            { id: 'fbec68b3-9d5a-4914-ade1-3ff017834e3b', date: '2026-01-20', name: 'Mercado', type: 'expense', amount: 32000, category: 'ae7fed8e-b36d-4106-a90f-ef3fc3e69b38', createdAt: 1768957329151, isRecurring: false },

            // Recurring transactions that should become templates
            { id: '1995e3d7-676b-4740-aa20-7d92ab5f29b6', date: '2026-01-05', name: 'Smarfit', type: 'expense', amount: 110000, category: 'd13670ac-be34-459f-8155-fadc7c7dfff9', createdAt: 1768688970756, isRecurring: true },
            { id: 'dbf029d0-5393-4eff-8de6-e359f6625d88', date: '2026-01-14', name: 'Rappi prime', type: 'expense', amount: 33000, category: 'c2a7c6e0-c319-4de8-bffb-a5756dcfc001', createdAt: 1768684243359, isRecurring: true },
            { id: 'b31b9fee-0480-4a7c-a1be-114c27898142', date: '2026-01-14', name: 'Apple', type: 'expense', amount: 60000, category: 'c2a7c6e0-c319-4de8-bffb-a5756dcfc001', createdAt: 1768679804927, isRecurring: true },
            { id: '3a85cd6d-baaa-4aa5-b92c-6b77515bb320', date: '2026-01-05', name: 'Disney plus', type: 'expense', amount: 50000, category: 'c2a7c6e0-c319-4de8-bffb-a5756dcfc001', createdAt: 1768679781725, isRecurring: true },
            { id: '76a139c2-2b1a-4009-ad44-6895d72164aa', date: '2026-01-05', name: 'Netflix', type: 'expense', amount: 60000, category: 'c2a7c6e0-c319-4de8-bffb-a5756dcfc001', createdAt: 1768679744651, isRecurring: true },
            { id: '27ec71b7-ed55-4737-bea5-0ef5238d58e5', date: '2026-01-14', name: 'Claude Max', type: 'expense', amount: 380000, category: '1f7300d9-4bec-444d-83e3-7b941ea58d8b', createdAt: 1768679706017, isRecurring: true },

            // IMPORTANT: "Caña brava" - recurring income (the transaction from user's bug report)
            { id: '4c4e215a-687e-4117-9ca8-56587bfc91c5', date: '2026-01-14', name: 'Caña brava', type: 'income', amount: 850000, category: '116fd9da-a36d-4ebf-b219-af51d0ca6e9f', createdAt: 1768674382199, isRecurring: true },

            // More recurring
            { id: 'f94a97f4-17a6-4d05-8130-0a2dd364c756', date: '2026-01-03', name: 'Administración paseo del parque', type: 'expense', amount: 380000, category: 'dc87aecb-fcc3-4b9f-9fc6-5459c4545f54', createdAt: 1768674000852, isRecurring: true },
            { id: '95755486-5d47-4fa1-b6a7-f8dc35b51fae', date: '2026-01-03', name: 'Epm', type: 'expense', amount: 500000, category: 'dc87aecb-fcc3-4b9f-9fc6-5459c4545f54', createdAt: 1768673959066, isRecurring: true },
            { id: 'a9c49a73-1d6c-48d2-8312-88f954bc6980', date: '2026-01-01', name: 'Aportes en línea', type: 'expense', amount: 1400000, category: '1e565d6a-70ca-4490-9e0a-cc5be2989cb1', createdAt: 1768673937830, isRecurring: true },
            { id: 'c8cb5e6d-c9cf-4a19-bc38-a1c12bac44fd', date: '2026-01-01', name: 'Coomeva estado de cuenta', type: 'expense', amount: 5900000, category: '1e565d6a-70ca-4490-9e0a-cc5be2989cb1', createdAt: 1768673867648, isRecurring: true },
            { id: '56038758-22d2-431b-9fec-50231b93454a', date: '2026-01-01', name: 'Galileo', type: 'income', amount: 29500000, category: 'f10599b5-a071-4328-83a5-199d9ab617ff', createdAt: 1768673765697, isRecurring: true },
          ],
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(v4RealData));
        const loaded = loadState();

        expect(loaded?.schemaVersion).toBe(6);

        // Count recurring templates
        const recurringTransactions = v4RealData.transactions.filter(tx => tx.isRecurring);
        expect(recurringTransactions.length).toBe(12); // 12 recurring transactions

        // After migration, all unique isRecurring=true should become templates with schedule
        const templates = loaded?.transactions.filter(tx => tx.schedule?.enabled);
        expect(templates?.length).toBe(12); // Each one is unique by name+category+amount

        // Verify "Caña brava" became a template with correct schedule
        const canaBrava = loaded?.transactions.find(tx => tx.name === 'Caña brava');
        expect(canaBrava).toBeDefined();
        expect(canaBrava?.schedule?.enabled).toBe(true);
        expect(canaBrava?.schedule?.frequency).toBe('monthly');
        expect(canaBrava?.schedule?.dayOfMonth).toBe(14); // From date 2026-01-14
        expect(canaBrava?.schedule?.startDate).toBe('2026-01-14');

        // Verify non-recurring transactions don't have schedule
        const panTrecia = loaded?.transactions.find(tx => tx.name === 'Pan trecia');
        expect(panTrecia?.schedule).toBeUndefined();
        expect(panTrecia?.sourceTemplateId).toBeUndefined();

        // Verify Galileo (salary) became a template
        const galileo = loaded?.transactions.find(tx => tx.name === 'Galileo');
        expect(galileo?.schedule?.enabled).toBe(true);
        expect(galileo?.schedule?.dayOfMonth).toBe(1); // From date 2026-01-01
      });

      it('should repair transactions missing sourceTemplateId (v5 data repair)', () => {
        // Simulating v5 data that has a transaction that was confirmed BEFORE sourceTemplateId was added
        // This is the bug the user reported with "Caña brava"
        const v5DataNeedingRepair = {
          schemaVersion: 5,
          trips: [],
          tripExpenses: [],
          categories: [],
          categoryGroups: [],
          categoryDefinitions: [],
          transactions: [
            // The template (has schedule)
            {
              id: 'template-cana-brava',
              date: '2026-01-14',
              name: 'Caña brava',
              type: 'income' as const,
              amount: 850000,
              category: '116fd9da-a36d-4ebf-b219-af51d0ca6e9f',
              createdAt: 1768674382199,
              schedule: {
                enabled: true,
                frequency: 'monthly' as const,
                interval: 1,
                startDate: '2026-01-14',
                dayOfMonth: 14,
              },
            },
            // A confirmed transaction from February - MISSING sourceTemplateId (the bug!)
            // This simulates what happens when user confirmed a virtual before our fix
            {
              id: '7d01cd96-6315-4849-9fab-ba928ff25c82',
              date: '2026-02-14',
              name: 'Caña brava',
              type: 'income' as const,
              amount: 800000, // User edited the amount
              category: '116fd9da-a36d-4ebf-b219-af51d0ca6e9f',
              createdAt: 1769874382199,
              status: 'pending' as const,
              isRecurring: true, // Has this legacy field
              // NO sourceTemplateId! This is the bug.
            },
            // An unrelated transaction
            {
              id: 'groceries',
              date: '2026-02-15',
              name: 'Groceries',
              type: 'expense' as const,
              amount: 100000,
              category: 'food',
              createdAt: 1769984382199,
            },
          ],
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(v5DataNeedingRepair));
        const loaded = loadState();

        expect(loaded?.schemaVersion).toBe(6);

        // The February "Caña brava" should now have sourceTemplateId (repaired!)
        const febCanaBrava = loaded?.transactions.find(tx => tx.id === '7d01cd96-6315-4849-9fab-ba928ff25c82');
        expect(febCanaBrava).toBeDefined();
        expect(febCanaBrava?.sourceTemplateId).toBe('template-cana-brava');

        // The template should NOT have sourceTemplateId (it IS the template)
        const template = loaded?.transactions.find(tx => tx.id === 'template-cana-brava');
        expect(template?.sourceTemplateId).toBeUndefined();

        // Groceries should not get linked (different name)
        const groceries = loaded?.transactions.find(tx => tx.id === 'groceries');
        expect(groceries?.sourceTemplateId).toBeUndefined();
      });

      it('should not link transactions to wrong templates (different category)', () => {
        const v5Data = {
          schemaVersion: 5,
          trips: [],
          tripExpenses: [],
          categories: [],
          categoryGroups: [],
          categoryDefinitions: [],
          transactions: [
            // Template for "Rent" in housing category
            {
              id: 'template-rent',
              date: '2026-01-15',
              name: 'Rent',
              type: 'expense' as const,
              amount: 1000000,
              category: 'housing',
              createdAt: 1000,
              schedule: { enabled: true, frequency: 'monthly' as const, interval: 1, startDate: '2026-01-15', dayOfMonth: 15 },
            },
            // Transaction with same name but DIFFERENT category - should NOT be linked
            {
              id: 'rent-different-cat',
              date: '2026-02-15',
              name: 'Rent',
              type: 'expense' as const,
              amount: 500000,
              category: 'car', // Different category!
              createdAt: 2000,
            },
          ],
        };

        localStorage.setItem('budget_app_v1', JSON.stringify(v5Data));
        const loaded = loadState();

        // Should NOT be linked because category is different
        const rentDifferentCat = loaded?.transactions.find(tx => tx.id === 'rent-different-cat');
        expect(rentDifferentCat?.sourceTemplateId).toBeUndefined();
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
        expect(loaded?.schemaVersion).toBe(6);

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
        expect(loaded?.schemaVersion).toBe(6);
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
