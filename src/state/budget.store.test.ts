import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBudgetStore } from './budget.store';
import type { BudgetState } from '@/types/budget.types';
import * as storageService from '@/services/storage.service';

// Mock storage service
vi.mock('@/services/storage.service', () => ({
  loadState: vi.fn(() => null),
  saveState: vi.fn(),
  clearState: vi.fn(),
}));

// Mock dates service
vi.mock('@/services/dates.service', () => ({
  currentMonthKey: vi.fn(() => '2026-01'),
}));

// Mock default categories and groups
vi.mock('@/constants/categories/default-categories', () => ({
  createDefaultCategories: vi.fn(() => [
    {
      id: 'cat-food',
      name: 'Alimentación',
      icon: 'utensils',
      color: '#10B981',
      type: 'expense',
      groupId: 'essential',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'cat-transport',
      name: 'Transporte',
      icon: 'car',
      color: '#3B82F6',
      type: 'expense',
      groupId: 'essential',
      isDefault: true,
      createdAt: Date.now(),
    },
  ]),
}));

vi.mock('@/constants/category-groups/default-category-groups', () => ({
  createDefaultCategoryGroups: vi.fn(() => [
    {
      id: 'essential',
      name: 'Esenciales',
      type: 'expense',
      color: '#EF4444',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'miscellaneous',
      name: 'Otros',
      type: 'expense',
      color: '#6B7280',
      isDefault: true,
      createdAt: Date.now(),
    },
  ]),
  MISCELLANEOUS_GROUP_ID: 'miscellaneous',
  OTHER_INCOME_GROUP_ID: 'other-income',
}));

describe('budget.store', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Reset store to initial state
    const store = useBudgetStore.getState();
    store.replaceAllData({
      schemaVersion: 4,
      transactions: [],
      categories: [],
      categoryDefinitions: [],
      categoryGroups: [],
      trips: [],
      tripExpenses: [],
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  // ==================== TRANSACTION CRUD ====================
  describe('Transaction CRUD', () => {
    describe('addTransaction', () => {
      it('should add a valid transaction', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: 'Almuerzo',
          category: 'Alimentación',
          amount: 25000,
          date: '2026-01-15',
          notes: 'Con amigos',
        });

        const transactions = useBudgetStore.getState().transactions;
        expect(transactions).toHaveLength(1);
        expect(transactions[0]).toMatchObject({
          type: 'expense',
          name: 'Almuerzo',
          category: 'Alimentación',
          amount: 25000,
          date: '2026-01-15',
          notes: 'Con amigos',
        });
        expect(transactions[0].id).toBeDefined();
        expect(transactions[0].createdAt).toBeDefined();
      });

      it('should trim name and category', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: '  Almuerzo  ',
          category: '  Alimentación  ',
          amount: 25000,
          date: '2026-01-15',
        });

        const transactions = useBudgetStore.getState().transactions;
        expect(transactions[0].name).toBe('Almuerzo');
        expect(transactions[0].category).toBe('Alimentación');
      });

      it('should default to "Sin categoría" if category is empty', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: 'Compra',
          category: '   ',
          amount: 10000,
          date: '2026-01-15',
        });

        const transactions = useBudgetStore.getState().transactions;
        expect(transactions[0].category).toBe('Sin categoría');
      });

      it('should round amount to nearest integer', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: 'Test',
          category: 'Test',
          amount: 25000.75,
          date: '2026-01-15',
        });

        const transactions = useBudgetStore.getState().transactions;
        expect(transactions[0].amount).toBe(25001);
      });

      it('should not add transaction with empty name', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: '   ',
          category: 'Test',
          amount: 25000,
          date: '2026-01-15',
        });

        const transactions = useBudgetStore.getState().transactions;
        expect(transactions).toHaveLength(0);
      });

      it('should not add transaction with invalid amount', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: 'Test',
          category: 'Test',
          amount: 0,
          date: '2026-01-15',
        });

        expect(useBudgetStore.getState().transactions).toHaveLength(0);

        store.addTransaction({
          type: 'expense',
          name: 'Test',
          category: 'Test',
          amount: -100,
          date: '2026-01-15',
        });

        expect(useBudgetStore.getState().transactions).toHaveLength(0);
      });

      it('should add category to categories list', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: 'Test',
          category: 'Nueva Categoría',
          amount: 25000,
          date: '2026-01-15',
        });

        const categories = useBudgetStore.getState().categories;
        expect(categories).toContain('Nueva Categoría');
      });

      it('should call saveState', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: 'Test',
          category: 'Test',
          amount: 25000,
          date: '2026-01-15',
        });

        expect(storageService.saveState).toHaveBeenCalled();
      });

      it('should support isRecurring flag', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: 'Netflix',
          category: 'Entretenimiento',
          amount: 15000,
          date: '2026-01-15',
          isRecurring: true,
        });

        const transactions = useBudgetStore.getState().transactions;
        expect(transactions[0].isRecurring).toBe(true);
      });

      it('should support status field', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: 'Pago pendiente',
          category: 'Test',
          amount: 50000,
          date: '2026-01-15',
          status: 'pending',
        });

        const transactions = useBudgetStore.getState().transactions;
        expect(transactions[0].status).toBe('pending');
      });
    });

    describe('updateTransaction', () => {
      it('should update transaction fields', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: 'Original',
          category: 'Cat1',
          amount: 100,
          date: '2026-01-15',
        });

        const txId = useBudgetStore.getState().transactions[0].id;

        store.updateTransaction(txId, {
          name: 'Updated',
          amount: 200,
        });

        const updated = useBudgetStore.getState().transactions[0];
        expect(updated.name).toBe('Updated');
        expect(updated.amount).toBe(200);
        expect(updated.category).toBe('Cat1'); // unchanged
      });

      it('should trim updated name and category', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: 'Original',
          category: 'Cat1',
          amount: 100,
          date: '2026-01-15',
        });

        const txId = useBudgetStore.getState().transactions[0].id;

        store.updateTransaction(txId, {
          name: '  Updated  ',
          category: '  NewCat  ',
        });

        const updated = useBudgetStore.getState().transactions[0];
        expect(updated.name).toBe('Updated');
        expect(updated.category).toBe('NewCat');
      });

      it('should round updated amount', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: 'Test',
          category: 'Test',
          amount: 100,
          date: '2026-01-15',
        });

        const txId = useBudgetStore.getState().transactions[0].id;

        store.updateTransaction(txId, {
          amount: 250.75,
        });

        const updated = useBudgetStore.getState().transactions[0];
        expect(updated.amount).toBe(251);
      });

      it('should update categories list if category changed', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: 'Test',
          category: 'Cat1',
          amount: 100,
          date: '2026-01-15',
        });

        const txId = useBudgetStore.getState().transactions[0].id;

        store.updateTransaction(txId, {
          category: 'NewCategory',
        });

        const categories = useBudgetStore.getState().categories;
        expect(categories).toContain('NewCategory');
      });

      it('should not update non-existent transaction', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: 'Test',
          category: 'Test',
          amount: 100,
          date: '2026-01-15',
        });

        const originalTx = useBudgetStore.getState().transactions[0];

        store.updateTransaction('non-existent-id', {
          name: 'Should not update',
        });

        const stillSame = useBudgetStore.getState().transactions[0];
        expect(stillSame).toEqual(originalTx);
      });

      it('should call saveState', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: 'Test',
          category: 'Test',
          amount: 100,
          date: '2026-01-15',
        });

        vi.clearAllMocks();

        const txId = useBudgetStore.getState().transactions[0].id;
        store.updateTransaction(txId, { amount: 200 });

        expect(storageService.saveState).toHaveBeenCalled();
      });
    });

    describe('deleteTransaction', () => {
      it('should delete transaction by id', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: 'Test1',
          category: 'Test',
          amount: 100,
          date: '2026-01-15',
        });

        store.addTransaction({
          type: 'expense',
          name: 'Test2',
          category: 'Test',
          amount: 200,
          date: '2026-01-15',
        });

        expect(useBudgetStore.getState().transactions).toHaveLength(2);

        const idToDelete = useBudgetStore.getState().transactions[0].id;
        store.deleteTransaction(idToDelete);

        const remaining = useBudgetStore.getState().transactions;
        expect(remaining).toHaveLength(1);
        expect(remaining[0].name).toBe('Test1');
      });

      it('should handle deleting non-existent transaction', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: 'Test',
          category: 'Test',
          amount: 100,
          date: '2026-01-15',
        });

        store.deleteTransaction('non-existent-id');

        expect(useBudgetStore.getState().transactions).toHaveLength(1);
      });

      it('should call saveState', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: 'Test',
          category: 'Test',
          amount: 100,
          date: '2026-01-15',
        });

        vi.clearAllMocks();

        const txId = useBudgetStore.getState().transactions[0].id;
        store.deleteTransaction(txId);

        expect(storageService.saveState).toHaveBeenCalled();
      });
    });
  });

  // ==================== CATEGORY CRUD ====================
  describe('Category CRUD', () => {
    describe('addCategory', () => {
      it('should add a valid category', () => {
        const store = useBudgetStore.getState();

        const categoryId = store.addCategory({
          name: 'Nueva Categoría',
          icon: 'home',
          color: '#FF5733',
          type: 'expense',
          groupId: 'miscellaneous',
        });

        expect(categoryId).toBeDefined();
        expect(categoryId).not.toBe('');

        const categories = useBudgetStore.getState().categoryDefinitions;
        const added = categories.find(c => c.id === categoryId);

        expect(added).toBeDefined();
        expect(added?.name).toBe('Nueva Categoría');
        expect(added?.icon).toBe('home');
        expect(added?.color).toBe('#FF5733');
        expect(added?.type).toBe('expense');
        expect(added?.groupId).toBe('miscellaneous');
        expect(added?.isDefault).toBe(false);
      });

      it('should trim category name', () => {
        const store = useBudgetStore.getState();

        const categoryId = store.addCategory({
          name: '  Espacios  ',
          icon: 'home',
          color: '#FF5733',
          type: 'expense',
          groupId: 'miscellaneous',
        });

        const categories = useBudgetStore.getState().categoryDefinitions;
        const added = categories.find(c => c.id === categoryId);

        expect(added?.name).toBe('Espacios');
      });

      it('should not add category with empty name', () => {
        const store = useBudgetStore.getState();

        const categoryId = store.addCategory({
          name: '   ',
          icon: 'home',
          color: '#FF5733',
          type: 'expense',
          groupId: 'miscellaneous',
        });

        expect(categoryId).toBe('');
        expect(useBudgetStore.getState().categoryDefinitions).toHaveLength(0);
      });

      it('should call saveState', () => {
        const store = useBudgetStore.getState();

        store.addCategory({
          name: 'Test',
          icon: 'home',
          color: '#FF5733',
          type: 'expense',
          groupId: 'miscellaneous',
        });

        expect(storageService.saveState).toHaveBeenCalled();
      });
    });

    describe('updateCategory', () => {
      it('should update category fields', () => {
        const store = useBudgetStore.getState();

        const categoryId = store.addCategory({
          name: 'Original',
          icon: 'home',
          color: '#FF5733',
          type: 'expense',
          groupId: 'miscellaneous',
        });

        store.updateCategory(categoryId, {
          name: 'Updated',
          color: '#00FF00',
        });

        const categories = useBudgetStore.getState().categoryDefinitions;
        const updated = categories.find(c => c.id === categoryId);

        expect(updated?.name).toBe('Updated');
        expect(updated?.color).toBe('#00FF00');
        expect(updated?.icon).toBe('home'); // unchanged
      });

      it('should not update non-existent category', () => {
        const store = useBudgetStore.getState();

        const categoryId = store.addCategory({
          name: 'Test',
          icon: 'home',
          color: '#FF5733',
          type: 'expense',
          groupId: 'miscellaneous',
        });

        const original = useBudgetStore.getState().categoryDefinitions.find(c => c.id === categoryId);

        store.updateCategory('non-existent-id', { name: 'Should not update' });

        const stillSame = useBudgetStore.getState().categoryDefinitions.find(c => c.id === categoryId);
        expect(stillSame).toEqual(original);
      });

      it('should call saveState', () => {
        const store = useBudgetStore.getState();

        const categoryId = store.addCategory({
          name: 'Test',
          icon: 'home',
          color: '#FF5733',
          type: 'expense',
          groupId: 'miscellaneous',
        });

        vi.clearAllMocks();

        store.updateCategory(categoryId, { name: 'Updated' });

        expect(storageService.saveState).toHaveBeenCalled();
      });
    });

    describe('deleteCategory', () => {
      it('should delete category by id', () => {
        const store = useBudgetStore.getState();

        const categoryId = store.addCategory({
          name: 'To Delete',
          icon: 'home',
          color: '#FF5733',
          type: 'expense',
          groupId: 'miscellaneous',
        });

        expect(useBudgetStore.getState().categoryDefinitions).toHaveLength(1);

        store.deleteCategory(categoryId);

        expect(useBudgetStore.getState().categoryDefinitions).toHaveLength(0);
      });

      it('should call saveState', () => {
        const store = useBudgetStore.getState();

        const categoryId = store.addCategory({
          name: 'Test',
          icon: 'home',
          color: '#FF5733',
          type: 'expense',
          groupId: 'miscellaneous',
        });

        vi.clearAllMocks();

        store.deleteCategory(categoryId);

        expect(storageService.saveState).toHaveBeenCalled();
      });
    });

    describe('getCategoryById', () => {
      it('should return category if exists', () => {
        const store = useBudgetStore.getState();

        const categoryId = store.addCategory({
          name: 'Test',
          icon: 'home',
          color: '#FF5733',
          type: 'expense',
          groupId: 'miscellaneous',
        });

        const category = store.getCategoryById(categoryId);

        expect(category).toBeDefined();
        expect(category?.name).toBe('Test');
      });

      it('should return undefined if not exists', () => {
        const store = useBudgetStore.getState();

        const category = store.getCategoryById('non-existent-id');

        expect(category).toBeUndefined();
      });
    });

    describe('setCategoryLimit', () => {
      it('should set monthly limit', () => {
        const store = useBudgetStore.getState();

        const categoryId = store.addCategory({
          name: 'Test',
          icon: 'home',
          color: '#FF5733',
          type: 'expense',
          groupId: 'miscellaneous',
        });

        store.setCategoryLimit(categoryId, 500000);

        const category = store.getCategoryById(categoryId);
        expect(category?.monthlyLimit).toBe(500000);
      });

      it('should remove limit when set to null', () => {
        const store = useBudgetStore.getState();

        const categoryId = store.addCategory({
          name: 'Test',
          icon: 'home',
          color: '#FF5733',
          type: 'expense',
          groupId: 'miscellaneous',
        });

        store.setCategoryLimit(categoryId, 500000);
        expect(store.getCategoryById(categoryId)?.monthlyLimit).toBe(500000);

        store.setCategoryLimit(categoryId, null);
        expect(store.getCategoryById(categoryId)?.monthlyLimit).toBeUndefined();
      });

      it('should call saveState', () => {
        const store = useBudgetStore.getState();

        const categoryId = store.addCategory({
          name: 'Test',
          icon: 'home',
          color: '#FF5733',
          type: 'expense',
          groupId: 'miscellaneous',
        });

        vi.clearAllMocks();

        store.setCategoryLimit(categoryId, 500000);

        expect(storageService.saveState).toHaveBeenCalled();
      });
    });
  });

  // ==================== CATEGORY GROUPS CRUD ====================
  describe('Category Groups CRUD', () => {
    describe('addCategoryGroup', () => {
      it('should add a valid category group', () => {
        const store = useBudgetStore.getState();

        const groupId = store.addCategoryGroup({
          name: 'Nuevo Grupo',
          type: 'expense',
          color: '#FF5733',
        });

        expect(groupId).toBeDefined();
        expect(groupId).not.toBe('');

        const groups = useBudgetStore.getState().categoryGroups;
        const added = groups.find(g => g.id === groupId);

        expect(added).toBeDefined();
        expect(added?.name).toBe('Nuevo Grupo');
        expect(added?.type).toBe('expense');
        expect(added?.color).toBe('#FF5733');
        expect(added?.isDefault).toBe(false);
      });

      it('should trim group name', () => {
        const store = useBudgetStore.getState();

        const groupId = store.addCategoryGroup({
          name: '  Espacios  ',
          type: 'expense',
          color: '#FF5733',
        });

        const groups = useBudgetStore.getState().categoryGroups;
        const added = groups.find(g => g.id === groupId);

        expect(added?.name).toBe('Espacios');
      });

      it('should not add group with empty name', () => {
        const store = useBudgetStore.getState();

        const groupId = store.addCategoryGroup({
          name: '   ',
          type: 'expense',
          color: '#FF5733',
        });

        expect(groupId).toBe('');
        expect(useBudgetStore.getState().categoryGroups).toHaveLength(0);
      });

      it('should call saveState', () => {
        const store = useBudgetStore.getState();

        store.addCategoryGroup({
          name: 'Test',
          type: 'expense',
          color: '#FF5733',
        });

        expect(storageService.saveState).toHaveBeenCalled();
      });
    });

    describe('updateCategoryGroup', () => {
      it('should update group fields', () => {
        const store = useBudgetStore.getState();

        const groupId = store.addCategoryGroup({
          name: 'Original',
          type: 'expense',
          color: '#FF5733',
        });

        store.updateCategoryGroup(groupId, {
          name: 'Updated',
          color: '#00FF00',
        });

        const groups = useBudgetStore.getState().categoryGroups;
        const updated = groups.find(g => g.id === groupId);

        expect(updated?.name).toBe('Updated');
        expect(updated?.color).toBe('#00FF00');
      });

      it('should call saveState', () => {
        const store = useBudgetStore.getState();

        const groupId = store.addCategoryGroup({
          name: 'Test',
          type: 'expense',
          color: '#FF5733',
        });

        vi.clearAllMocks();

        store.updateCategoryGroup(groupId, { name: 'Updated' });

        expect(storageService.saveState).toHaveBeenCalled();
      });
    });

    describe('deleteCategoryGroup', () => {
      it('should delete group by id', () => {
        const store = useBudgetStore.getState();

        const groupId = store.addCategoryGroup({
          name: 'To Delete',
          type: 'expense',
          color: '#FF5733',
        });

        expect(useBudgetStore.getState().categoryGroups).toHaveLength(1);

        store.deleteCategoryGroup(groupId);

        expect(useBudgetStore.getState().categoryGroups).toHaveLength(0);
      });

      it('should reassign categories to fallback group when group is deleted', () => {
        const store = useBudgetStore.getState();

        // Add a custom group
        const groupId = store.addCategoryGroup({
          name: 'Custom Group',
          type: 'expense',
          color: '#FF5733',
        });

        // Add a category to the custom group
        const categoryId = store.addCategory({
          name: 'Test Category',
          icon: 'home',
          color: '#FF5733',
          type: 'expense',
          groupId: groupId,
        });

        // Delete the group
        store.deleteCategoryGroup(groupId);

        // Category should be reassigned to miscellaneous group
        const category = store.getCategoryById(categoryId);
        expect(category?.groupId).toBe('miscellaneous');
      });

      it('should call saveState', () => {
        const store = useBudgetStore.getState();

        const groupId = store.addCategoryGroup({
          name: 'Test',
          type: 'expense',
          color: '#FF5733',
        });

        vi.clearAllMocks();

        store.deleteCategoryGroup(groupId);

        expect(storageService.saveState).toHaveBeenCalled();
      });
    });

    describe('getCategoryGroupById', () => {
      it('should return group if exists', () => {
        const store = useBudgetStore.getState();

        const groupId = store.addCategoryGroup({
          name: 'Test',
          type: 'expense',
          color: '#FF5733',
        });

        const group = store.getCategoryGroupById(groupId);

        expect(group).toBeDefined();
        expect(group?.name).toBe('Test');
      });

      it('should return undefined if not exists', () => {
        const store = useBudgetStore.getState();

        const group = store.getCategoryGroupById('non-existent-id');

        expect(group).toBeUndefined();
      });
    });
  });

  // ==================== TRIP CRUD ====================
  describe('Trip CRUD', () => {
    describe('addTrip', () => {
      it('should add a valid trip', () => {
        const store = useBudgetStore.getState();

        store.addTrip({
          name: 'Cartagena 2026',
          destination: 'Cartagena, Colombia',
          budget: 2000000,
          startDate: '2026-02-01',
          endDate: '2026-02-07',
          status: 'planning',
        });

        const trips = useBudgetStore.getState().trips;
        expect(trips).toHaveLength(1);
        expect(trips[0]).toMatchObject({
          name: 'Cartagena 2026',
          destination: 'Cartagena, Colombia',
          budget: 2000000,
          startDate: '2026-02-01',
          endDate: '2026-02-07',
          status: 'planning',
        });
        expect(trips[0].id).toBeDefined();
        expect(trips[0].createdAt).toBeDefined();
      });

      it('should trim name and destination', () => {
        const store = useBudgetStore.getState();

        store.addTrip({
          name: '  Viaje  ',
          destination: '  Destino  ',
          budget: 1000000,
          startDate: '2026-02-01',
          endDate: null,
          status: 'planning',
        });

        const trips = useBudgetStore.getState().trips;
        expect(trips[0].name).toBe('Viaje');
        expect(trips[0].destination).toBe('Destino');
      });

      it('should not add trip with empty name', () => {
        const store = useBudgetStore.getState();

        store.addTrip({
          name: '   ',
          destination: 'Somewhere',
          budget: 1000000,
          startDate: '2026-02-01',
          endDate: null,
          status: 'planning',
        });

        expect(useBudgetStore.getState().trips).toHaveLength(0);
      });

      it('should not add trip with invalid budget', () => {
        const store = useBudgetStore.getState();

        store.addTrip({
          name: 'Test',
          destination: 'Somewhere',
          budget: -1000,
          startDate: '2026-02-01',
          endDate: null,
          status: 'planning',
        });

        expect(useBudgetStore.getState().trips).toHaveLength(0);
      });

      it('should round budget to nearest integer', () => {
        const store = useBudgetStore.getState();

        store.addTrip({
          name: 'Test',
          destination: 'Somewhere',
          budget: 1500000.75,
          startDate: '2026-02-01',
          endDate: null,
          status: 'planning',
        });

        const trips = useBudgetStore.getState().trips;
        expect(trips[0].budget).toBe(1500001);
      });

      it('should call saveState', () => {
        const store = useBudgetStore.getState();

        store.addTrip({
          name: 'Test',
          destination: 'Somewhere',
          budget: 1000000,
          startDate: '2026-02-01',
          endDate: null,
          status: 'planning',
        });

        expect(storageService.saveState).toHaveBeenCalled();
      });
    });

    describe('updateTrip', () => {
      it('should update trip fields', () => {
        const store = useBudgetStore.getState();

        store.addTrip({
          name: 'Original',
          destination: 'Original Dest',
          budget: 1000000,
          startDate: '2026-02-01',
          endDate: null,
          status: 'planning',
        });

        const tripId = useBudgetStore.getState().trips[0].id;

        store.updateTrip(tripId, {
          name: 'Updated',
          budget: 2000000,
          status: 'active',
        });

        const updated = useBudgetStore.getState().trips[0];
        expect(updated.name).toBe('Updated');
        expect(updated.budget).toBe(2000000);
        expect(updated.status).toBe('active');
        expect(updated.destination).toBe('Original Dest'); // unchanged
      });

      it('should not update non-existent trip', () => {
        const store = useBudgetStore.getState();

        store.addTrip({
          name: 'Test',
          destination: 'Dest',
          budget: 1000000,
          startDate: '2026-02-01',
          endDate: null,
          status: 'planning',
        });

        const original = useBudgetStore.getState().trips[0];

        store.updateTrip('non-existent-id', { name: 'Should not update' });

        const stillSame = useBudgetStore.getState().trips[0];
        expect(stillSame).toEqual(original);
      });

      it('should call saveState', () => {
        const store = useBudgetStore.getState();

        store.addTrip({
          name: 'Test',
          destination: 'Dest',
          budget: 1000000,
          startDate: '2026-02-01',
          endDate: null,
          status: 'planning',
        });

        vi.clearAllMocks();

        const tripId = useBudgetStore.getState().trips[0].id;
        store.updateTrip(tripId, { budget: 2000000 });

        expect(storageService.saveState).toHaveBeenCalled();
      });
    });

    describe('deleteTrip', () => {
      it('should delete trip by id', () => {
        const store = useBudgetStore.getState();

        store.addTrip({
          name: 'Trip 1',
          destination: 'Dest 1',
          budget: 1000000,
          startDate: '2026-02-01',
          endDate: null,
          status: 'planning',
        });

        store.addTrip({
          name: 'Trip 2',
          destination: 'Dest 2',
          budget: 2000000,
          startDate: '2026-03-01',
          endDate: null,
          status: 'planning',
        });

        expect(useBudgetStore.getState().trips).toHaveLength(2);

        const idToDelete = useBudgetStore.getState().trips[0].id;
        store.deleteTrip(idToDelete);

        const remaining = useBudgetStore.getState().trips;
        expect(remaining).toHaveLength(1);
        expect(remaining[0].name).toBe('Trip 1');
      });

      it('should delete associated trip expenses when deleting trip', () => {
        const store = useBudgetStore.getState();

        store.addTrip({
          name: 'Test Trip',
          destination: 'Dest',
          budget: 1000000,
          startDate: '2026-02-01',
          endDate: null,
          status: 'planning',
        });

        const tripId = useBudgetStore.getState().trips[0].id;

        store.addTripExpense({
          tripId,
          category: 'food',
          name: 'Breakfast',
          amount: 50000,
          date: '2026-02-01',
        });

        store.addTripExpense({
          tripId,
          category: 'transport',
          name: 'Taxi',
          amount: 30000,
          date: '2026-02-01',
        });

        expect(useBudgetStore.getState().tripExpenses).toHaveLength(2);

        store.deleteTrip(tripId);

        expect(useBudgetStore.getState().trips).toHaveLength(0);
        expect(useBudgetStore.getState().tripExpenses).toHaveLength(0);
      });

      it('should call saveState', () => {
        const store = useBudgetStore.getState();

        store.addTrip({
          name: 'Test',
          destination: 'Dest',
          budget: 1000000,
          startDate: '2026-02-01',
          endDate: null,
          status: 'planning',
        });

        vi.clearAllMocks();

        const tripId = useBudgetStore.getState().trips[0].id;
        store.deleteTrip(tripId);

        expect(storageService.saveState).toHaveBeenCalled();
      });
    });
  });

  // ==================== TRIP EXPENSES CRUD ====================
  describe('Trip Expenses CRUD', () => {
    let tripId: string;

    beforeEach(() => {
      const store = useBudgetStore.getState();
      store.addTrip({
        name: 'Test Trip',
        destination: 'Destination',
        budget: 1000000,
        startDate: '2026-02-01',
        endDate: null,
        status: 'planning',
      });
      tripId = useBudgetStore.getState().trips[0].id;
    });

    describe('addTripExpense', () => {
      it('should add a valid trip expense', () => {
        const store = useBudgetStore.getState();

        store.addTripExpense({
          tripId,
          category: 'food',
          name: 'Almuerzo',
          amount: 50000,
          date: '2026-02-01',
          notes: 'En el centro',
        });

        const expenses = useBudgetStore.getState().tripExpenses;
        expect(expenses).toHaveLength(1);
        expect(expenses[0]).toMatchObject({
          tripId,
          category: 'food',
          name: 'Almuerzo',
          amount: 50000,
          date: '2026-02-01',
          notes: 'En el centro',
        });
        expect(expenses[0].id).toBeDefined();
        expect(expenses[0].createdAt).toBeDefined();
      });

      it('should trim name and notes', () => {
        const store = useBudgetStore.getState();

        store.addTripExpense({
          tripId,
          category: 'food',
          name: '  Almuerzo  ',
          amount: 50000,
          date: '2026-02-01',
          notes: '  Notas  ',
        });

        const expenses = useBudgetStore.getState().tripExpenses;
        expect(expenses[0].name).toBe('Almuerzo');
        expect(expenses[0].notes).toBe('Notas');
      });

      it('should not add expense with empty name', () => {
        const store = useBudgetStore.getState();

        store.addTripExpense({
          tripId,
          category: 'food',
          name: '   ',
          amount: 50000,
          date: '2026-02-01',
        });

        expect(useBudgetStore.getState().tripExpenses).toHaveLength(0);
      });

      it('should not add expense with invalid amount', () => {
        const store = useBudgetStore.getState();

        store.addTripExpense({
          tripId,
          category: 'food',
          name: 'Test',
          amount: 0,
          date: '2026-02-01',
        });

        expect(useBudgetStore.getState().tripExpenses).toHaveLength(0);

        store.addTripExpense({
          tripId,
          category: 'food',
          name: 'Test',
          amount: -100,
          date: '2026-02-01',
        });

        expect(useBudgetStore.getState().tripExpenses).toHaveLength(0);
      });

      it('should round amount to nearest integer', () => {
        const store = useBudgetStore.getState();

        store.addTripExpense({
          tripId,
          category: 'food',
          name: 'Test',
          amount: 50000.75,
          date: '2026-02-01',
        });

        const expenses = useBudgetStore.getState().tripExpenses;
        expect(expenses[0].amount).toBe(50001);
      });

      it('should call saveState', () => {
        const store = useBudgetStore.getState();

        store.addTripExpense({
          tripId,
          category: 'food',
          name: 'Test',
          amount: 50000,
          date: '2026-02-01',
        });

        expect(storageService.saveState).toHaveBeenCalled();
      });
    });

    describe('updateTripExpense', () => {
      it('should update expense fields', () => {
        const store = useBudgetStore.getState();

        store.addTripExpense({
          tripId,
          category: 'food',
          name: 'Original',
          amount: 50000,
          date: '2026-02-01',
        });

        const expenseId = useBudgetStore.getState().tripExpenses[0].id;

        store.updateTripExpense(expenseId, {
          name: 'Updated',
          amount: 75000,
        });

        const updated = useBudgetStore.getState().tripExpenses[0];
        expect(updated.name).toBe('Updated');
        expect(updated.amount).toBe(75000);
        expect(updated.category).toBe('food'); // unchanged
      });

      it('should not update non-existent expense', () => {
        const store = useBudgetStore.getState();

        store.addTripExpense({
          tripId,
          category: 'food',
          name: 'Test',
          amount: 50000,
          date: '2026-02-01',
        });

        const original = useBudgetStore.getState().tripExpenses[0];

        store.updateTripExpense('non-existent-id', { name: 'Should not update' });

        const stillSame = useBudgetStore.getState().tripExpenses[0];
        expect(stillSame).toEqual(original);
      });

      it('should call saveState', () => {
        const store = useBudgetStore.getState();

        store.addTripExpense({
          tripId,
          category: 'food',
          name: 'Test',
          amount: 50000,
          date: '2026-02-01',
        });

        vi.clearAllMocks();

        const expenseId = useBudgetStore.getState().tripExpenses[0].id;
        store.updateTripExpense(expenseId, { amount: 75000 });

        expect(storageService.saveState).toHaveBeenCalled();
      });
    });

    describe('deleteTripExpense', () => {
      it('should delete expense by id', () => {
        const store = useBudgetStore.getState();

        store.addTripExpense({
          tripId,
          category: 'food',
          name: 'Expense 1',
          amount: 50000,
          date: '2026-02-01',
        });

        store.addTripExpense({
          tripId,
          category: 'transport',
          name: 'Expense 2',
          amount: 30000,
          date: '2026-02-01',
        });

        expect(useBudgetStore.getState().tripExpenses).toHaveLength(2);

        const idToDelete = useBudgetStore.getState().tripExpenses[0].id;
        store.deleteTripExpense(idToDelete);

        const remaining = useBudgetStore.getState().tripExpenses;
        expect(remaining).toHaveLength(1);
        expect(remaining[0].name).toBe('Expense 1');
      });

      it('should call saveState', () => {
        const store = useBudgetStore.getState();

        store.addTripExpense({
          tripId,
          category: 'food',
          name: 'Test',
          amount: 50000,
          date: '2026-02-01',
        });

        vi.clearAllMocks();

        const expenseId = useBudgetStore.getState().tripExpenses[0].id;
        store.deleteTripExpense(expenseId);

        expect(storageService.saveState).toHaveBeenCalled();
      });
    });
  });

  // ==================== SYNC HELPERS ====================
  describe('Sync helpers', () => {
    describe('getSnapshot', () => {
      it('should return current state snapshot', () => {
        const store = useBudgetStore.getState();

        store.addTransaction({
          type: 'expense',
          name: 'Test',
          category: 'Test',
          amount: 100,
          date: '2026-01-15',
        });

        const snapshot = store.getSnapshot();

        expect(snapshot.schemaVersion).toBe(6);
        expect(snapshot.transactions).toHaveLength(1);
        expect(snapshot.transactions[0].name).toBe('Test');
        expect(snapshot.categories).toBeDefined();
        expect(snapshot.categoryDefinitions).toBeDefined();
        expect(snapshot.categoryGroups).toBeDefined();
        expect(snapshot.trips).toBeDefined();
        expect(snapshot.tripExpenses).toBeDefined();
      });

      it('should not include UI state in snapshot', () => {
        const store = useBudgetStore.getState();
        const snapshot = store.getSnapshot() as any;

        expect(snapshot.selectedMonth).toBeUndefined();
        expect(snapshot.user).toBeUndefined();
        expect(snapshot.cloudMode).toBeUndefined();
        expect(snapshot.cloudStatus).toBeUndefined();
      });
    });

    describe('replaceAllData', () => {
      it('should replace all data', () => {
        const store = useBudgetStore.getState();

        // Add initial data
        store.addTransaction({
          type: 'expense',
          name: 'Original',
          category: 'Test',
          amount: 100,
          date: '2026-01-15',
        });

        expect(useBudgetStore.getState().transactions).toHaveLength(1);

        // Replace with new data
        const newData: BudgetState = {
          schemaVersion: 4,
          transactions: [
            {
              id: 'new-1',
              type: 'income',
              name: 'New Transaction',
              category: 'Salary',
              amount: 1000,
              date: '2026-01-20',
              createdAt: Date.now(),
            },
          ],
          categories: ['Salary'],
          categoryDefinitions: [],
          categoryGroups: [],
          trips: [],
          tripExpenses: [],
        };

        store.replaceAllData(newData);

        const state = useBudgetStore.getState();
        expect(state.transactions).toHaveLength(1);
        expect(state.transactions[0].name).toBe('New Transaction');
        expect(state.transactions[0].type).toBe('income');
      });

      it('should call saveState', () => {
        const store = useBudgetStore.getState();

        const newData: BudgetState = {
          schemaVersion: 4,
          transactions: [],
          categories: [],
          categoryDefinitions: [],
          categoryGroups: [],
          trips: [],
          tripExpenses: [],
        };

        store.replaceAllData(newData);

        expect(storageService.saveState).toHaveBeenCalledWith(newData);
      });
    });
  });

  // ==================== UI STATE ====================
  describe('UI state', () => {
    describe('selectedMonth', () => {
      it('should set selected month', () => {
        const store = useBudgetStore.getState();

        store.setSelectedMonth('2026-02');

        expect(useBudgetStore.getState().selectedMonth).toBe('2026-02');
      });
    });

    describe('cloudMode and cloudStatus', () => {
      it('should set cloud mode', () => {
        const store = useBudgetStore.getState();

        expect(useBudgetStore.getState().cloudMode).toBe('guest');

        store.setCloudMode('cloud');

        expect(useBudgetStore.getState().cloudMode).toBe('cloud');
      });

      it('should set cloud status', () => {
        const store = useBudgetStore.getState();

        expect(useBudgetStore.getState().cloudStatus).toBe('idle');

        store.setCloudStatus('syncing');
        expect(useBudgetStore.getState().cloudStatus).toBe('syncing');

        store.setCloudStatus('ok');
        expect(useBudgetStore.getState().cloudStatus).toBe('ok');

        store.setCloudStatus('error');
        expect(useBudgetStore.getState().cloudStatus).toBe('error');
      });
    });

    describe('user', () => {
      it('should set user data', () => {
        const store = useBudgetStore.getState();

        expect(useBudgetStore.getState().user.email).toBeNull();

        store.setUser({
          email: 'test@example.com',
          name: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
        });

        const user = useBudgetStore.getState().user;
        expect(user.email).toBe('test@example.com');
        expect(user.name).toBe('Test User');
        expect(user.avatarUrl).toBe('https://example.com/avatar.jpg');
      });
    });

    describe('welcomeSeen and budgetOnboardingSeen', () => {
      it('should set welcomeSeen flag', () => {
        const store = useBudgetStore.getState();

        store.setWelcomeSeen(true);
        expect(useBudgetStore.getState().welcomeSeen).toBe(true);

        store.setWelcomeSeen(false);
        expect(useBudgetStore.getState().welcomeSeen).toBe(false);
      });

      it('should persist welcomeSeen to localStorage', () => {
        const store = useBudgetStore.getState();

        store.setWelcomeSeen(true);
        expect(localStorage.getItem('budget.welcomeSeen.v1')).toBe('1');

        store.setWelcomeSeen(false);
        expect(localStorage.getItem('budget.welcomeSeen.v1')).toBeNull();
      });

      it('should set budgetOnboardingSeen flag', () => {
        const store = useBudgetStore.getState();

        store.setBudgetOnboardingSeen(true);
        expect(useBudgetStore.getState().budgetOnboardingSeen).toBe(true);

        store.setBudgetOnboardingSeen(false);
        expect(useBudgetStore.getState().budgetOnboardingSeen).toBe(false);
      });

      it('should persist budgetOnboardingSeen to localStorage', () => {
        const store = useBudgetStore.getState();

        store.setBudgetOnboardingSeen(true);
        expect(localStorage.getItem('budget.budgetOnboardingSeen.v1')).toBe('1');

        store.setBudgetOnboardingSeen(false);
        expect(localStorage.getItem('budget.budgetOnboardingSeen.v1')).toBeNull();
      });
    });
  });
});
