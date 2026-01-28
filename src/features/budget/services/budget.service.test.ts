import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateBudgetProgress,
  getBudgetsForPeriod,
  shouldRenewBudget,
  renewRecurringBudget,
  validateBudgetOverlap,
  getBudgetsToRenew,
  getActiveBudgetForCategory,
  calculateAllBudgetsProgress,
} from "./budget.service";
import type { Budget, Transaction } from "@/types/budget.types";

describe("budget.service", () => {
  describe("calculateBudgetProgress", () => {
    it("should calculate progress correctly", () => {
      const budget: Budget = {
        id: "budget-1",
        categoryId: "cat-groceries",
        amount: 500000,
        type: "limit",
        period: {
          type: "month",
          startDate: "2026-01-01",
          endDate: "2026-01-31",
        },
        isRecurring: true,
        status: "active",
        createdAt: Date.now(),
      };

      const transactions: Transaction[] = [
        {
          id: "tx-1",
          type: "expense",
          name: "Mercado",
          category: "cat-groceries",
          amount: 150000,
          date: "2026-01-10",
          createdAt: Date.now(),
        },
        {
          id: "tx-2",
          type: "expense",
          name: "Supermercado",
          category: "cat-groceries",
          amount: 200000,
          date: "2026-01-20",
          createdAt: Date.now(),
        },
        // Esta no debería contar (categoría diferente)
        {
          id: "tx-3",
          type: "expense",
          name: "Restaurante",
          category: "cat-restaurant",
          amount: 100000,
          date: "2026-01-15",
          createdAt: Date.now(),
        },
        // Esta no debería contar (fecha fuera del período)
        {
          id: "tx-4",
          type: "expense",
          name: "Mercado febrero",
          category: "cat-groceries",
          amount: 50000,
          date: "2026-02-01",
          createdAt: Date.now(),
        },
        // Esta no debería contar (tipo income)
        {
          id: "tx-5",
          type: "income",
          name: "Salario",
          category: "cat-groceries", // Aunque es raro, no debería contar
          amount: 1000000,
          date: "2026-01-15",
          createdAt: Date.now(),
        },
      ];

      const progress = calculateBudgetProgress(budget, transactions);

      expect(progress.budgetId).toBe("budget-1");
      expect(progress.categoryId).toBe("cat-groceries");
      expect(progress.budgeted).toBe(500000);
      expect(progress.spent).toBe(350000); // Solo tx-1 y tx-2
      expect(progress.remaining).toBe(150000);
      expect(progress.percentage).toBe(70); // 350000 / 500000 * 100
      expect(progress.isOverBudget).toBe(false);
      expect(progress.transactionCount).toBe(2);
    });

    it("should handle over budget scenario", () => {
      const budget: Budget = {
        id: "budget-1",
        categoryId: "cat-groceries",
        amount: 100000,
        type: "limit",
        period: {
          type: "month",
          startDate: "2026-01-01",
          endDate: "2026-01-31",
        },
        isRecurring: false,
        status: "active",
        createdAt: Date.now(),
      };

      const transactions: Transaction[] = [
        {
          id: "tx-1",
          type: "expense",
          name: "Mercado",
          category: "cat-groceries",
          amount: 150000,
          date: "2026-01-10",
          createdAt: Date.now(),
        },
      ];

      const progress = calculateBudgetProgress(budget, transactions);

      expect(progress.spent).toBe(150000);
      expect(progress.remaining).toBe(-50000);
      expect(progress.percentage).toBe(150);
      expect(progress.isOverBudget).toBe(true);
    });

    it("should handle empty transactions", () => {
      const budget: Budget = {
        id: "budget-1",
        categoryId: "cat-groceries",
        amount: 500000,
        type: "limit",
        period: {
          type: "month",
          startDate: "2026-01-01",
          endDate: "2026-01-31",
        },
        isRecurring: true,
        status: "active",
        createdAt: Date.now(),
      };

      const progress = calculateBudgetProgress(budget, []);

      expect(progress.spent).toBe(0);
      expect(progress.remaining).toBe(500000);
      expect(progress.percentage).toBe(0);
      expect(progress.isOverBudget).toBe(false);
      expect(progress.transactionCount).toBe(0);
    });
  });

  describe("getBudgetsForPeriod", () => {
    it("should return budgets that overlap with given period", () => {
      const budgets: Budget[] = [
        {
          id: "budget-1",
          categoryId: "cat-1",
          amount: 100000,
          type: "limit",
          period: {
            type: "month",
            startDate: "2026-01-01",
            endDate: "2026-01-31",
          },
          isRecurring: true,
          status: "active",
          createdAt: Date.now(),
        },
        {
          id: "budget-2",
          categoryId: "cat-2",
          amount: 200000,
          type: "limit",
          period: {
            type: "month",
            startDate: "2026-02-01",
            endDate: "2026-02-28",
          },
          isRecurring: true,
          status: "active",
          createdAt: Date.now(),
        },
        {
          id: "budget-3",
          categoryId: "cat-3",
          amount: 300000,
          type: "limit",
          period: {
            type: "quarter",
            startDate: "2026-01-01",
            endDate: "2026-03-31",
          },
          isRecurring: false,
          status: "active",
          createdAt: Date.now(),
        },
        // Este no debería aparecer (status completed)
        {
          id: "budget-4",
          categoryId: "cat-4",
          amount: 400000,
          type: "limit",
          period: {
            type: "month",
            startDate: "2026-01-01",
            endDate: "2026-01-31",
          },
          isRecurring: false,
          status: "completed",
          createdAt: Date.now(),
        },
      ];

      const result = getBudgetsForPeriod(budgets, "2026-01-15", "2026-01-20");

      // Solo budget-1 y budget-3 se solapan con 2026-01-15 a 2026-01-20
      // budget-2 está en febrero
      // budget-4 está completed
      expect(result).toHaveLength(2);
      expect(result.map((b) => b.id)).toEqual(
        expect.arrayContaining(["budget-1", "budget-3"])
      );
    });
  });

  describe("shouldRenewBudget", () => {
    it("should return true for recurring active budget with expired period", () => {
      const budget: Budget = {
        id: "budget-1",
        categoryId: "cat-1",
        amount: 100000,
        type: "limit",
        period: {
          type: "month",
          startDate: "2025-12-01",
          endDate: "2025-12-31",
        },
        isRecurring: true,
        status: "active",
        createdAt: Date.now(),
      };

      expect(shouldRenewBudget(budget, "2026-01-24")).toBe(true);
    });

    it("should return false for non-recurring budget", () => {
      const budget: Budget = {
        id: "budget-1",
        categoryId: "cat-1",
        amount: 100000,
        type: "limit",
        period: {
          type: "month",
          startDate: "2025-12-01",
          endDate: "2025-12-31",
        },
        isRecurring: false,
        status: "active",
        createdAt: Date.now(),
      };

      expect(shouldRenewBudget(budget, "2026-01-24")).toBe(false);
    });

    it("should return false for completed budget", () => {
      const budget: Budget = {
        id: "budget-1",
        categoryId: "cat-1",
        amount: 100000,
        type: "limit",
        period: {
          type: "month",
          startDate: "2025-12-01",
          endDate: "2025-12-31",
        },
        isRecurring: true,
        status: "completed",
        createdAt: Date.now(),
      };

      expect(shouldRenewBudget(budget, "2026-01-24")).toBe(false);
    });

    it("should return false if period not expired", () => {
      const budget: Budget = {
        id: "budget-1",
        categoryId: "cat-1",
        amount: 100000,
        type: "limit",
        period: {
          type: "month",
          startDate: "2026-01-01",
          endDate: "2026-01-31",
        },
        isRecurring: true,
        status: "active",
        createdAt: Date.now(),
      };

      expect(shouldRenewBudget(budget, "2026-01-24")).toBe(false);
    });
  });

  describe("renewRecurringBudget", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-24T12:00:00"));
    });

    it("should create new budget with next period", () => {
      const originalBudget: Budget = {
        id: "budget-1",
        categoryId: "cat-groceries",
        amount: 500000,
        type: "limit",
        period: {
          type: "month",
          startDate: "2025-12-01",
          endDate: "2025-12-31",
        },
        accountId: "account-1",
        isRecurring: true,
        status: "active",
        createdAt: 1234567890,
      };

      const renewed = renewRecurringBudget(originalBudget);

      expect(renewed.id).not.toBe(originalBudget.id); // Nuevo ID
      expect(renewed.categoryId).toBe("cat-groceries");
      expect(renewed.amount).toBe(500000);
      expect(renewed.period.type).toBe("month");
      expect(renewed.period.startDate).toBe("2026-01-01");
      expect(renewed.period.endDate).toBe("2026-01-31");
      expect(renewed.accountId).toBe("account-1");
      expect(renewed.isRecurring).toBe(true);
      expect(renewed.status).toBe("active");
      expect(renewed.createdAt).toBeGreaterThan(originalBudget.createdAt);
    });
  });

  describe("validateBudgetOverlap", () => {
    it("should return true if there is overlap", () => {
      const existingBudgets: Budget[] = [
        {
          id: "budget-1",
          categoryId: "cat-groceries",
          amount: 500000,
          type: "limit",
          period: {
            type: "month",
            startDate: "2026-01-01",
            endDate: "2026-01-31",
          },
          isRecurring: true,
          status: "active",
          createdAt: Date.now(),
        },
      ];

      const newBudget = {
        categoryId: "cat-groceries",
        amount: 300000,
        type: "limit" as const,
        period: {
          type: "month" as const,
          startDate: "2026-01-15",
          endDate: "2026-02-15",
        },
        isRecurring: false,
        status: "active" as const,
      };

      const hasOverlap = validateBudgetOverlap(newBudget, existingBudgets);

      expect(hasOverlap).toBe(true);
    });

    it("should return false if no overlap", () => {
      const existingBudgets: Budget[] = [
        {
          id: "budget-1",
          categoryId: "cat-groceries",
          amount: 500000,
          type: "limit",
          period: {
            type: "month",
            startDate: "2026-01-01",
            endDate: "2026-01-31",
          },
          isRecurring: true,
          status: "active",
          createdAt: Date.now(),
        },
      ];

      const newBudget = {
        categoryId: "cat-groceries",
        amount: 300000,
        type: "limit" as const,
        period: {
          type: "month" as const,
          startDate: "2026-02-01",
          endDate: "2026-02-28",
        },
        isRecurring: false,
        status: "active" as const,
      };

      const hasOverlap = validateBudgetOverlap(newBudget, existingBudgets);

      expect(hasOverlap).toBe(false);
    });

    it("should return false if different category", () => {
      const existingBudgets: Budget[] = [
        {
          id: "budget-1",
          categoryId: "cat-groceries",
          amount: 500000,
          type: "limit",
          period: {
            type: "month",
            startDate: "2026-01-01",
            endDate: "2026-01-31",
          },
          isRecurring: true,
          status: "active",
          createdAt: Date.now(),
        },
      ];

      const newBudget = {
        categoryId: "cat-restaurant", // Diferente categoría
        amount: 300000,
        type: "limit" as const,
        period: {
          type: "month" as const,
          startDate: "2026-01-15",
          endDate: "2026-02-15",
        },
        isRecurring: false,
        status: "active" as const,
      };

      const hasOverlap = validateBudgetOverlap(newBudget, existingBudgets);

      expect(hasOverlap).toBe(false);
    });

    it("should exclude budget being edited", () => {
      const existingBudgets: Budget[] = [
        {
          id: "budget-1",
          categoryId: "cat-groceries",
          amount: 500000,
          type: "limit",
          period: {
            type: "month",
            startDate: "2026-01-01",
            endDate: "2026-01-31",
          },
          isRecurring: true,
          status: "active",
          createdAt: Date.now(),
        },
      ];

      const newBudget = {
        categoryId: "cat-groceries",
        amount: 600000, // Editando el monto
        type: "limit" as const,
        period: {
          type: "month" as const,
          startDate: "2026-01-01",
          endDate: "2026-01-31",
        },
        isRecurring: true,
        status: "active" as const,
      };

      // Sin excluir: habría overlap consigo mismo
      expect(validateBudgetOverlap(newBudget, existingBudgets)).toBe(true);

      // Excluyendo el budget que se está editando: no hay overlap
      expect(
        validateBudgetOverlap(newBudget, existingBudgets, "budget-1")
      ).toBe(false);
    });

    it("should ignore completed budgets", () => {
      const existingBudgets: Budget[] = [
        {
          id: "budget-1",
          categoryId: "cat-groceries",
          amount: 500000,
          type: "limit",
          period: {
            type: "month",
            startDate: "2026-01-01",
            endDate: "2026-01-31",
          },
          isRecurring: true,
          status: "completed", // Completado
          createdAt: Date.now(),
        },
      ];

      const newBudget = {
        categoryId: "cat-groceries",
        amount: 300000,
        type: "limit" as const,
        period: {
          type: "month" as const,
          startDate: "2026-01-15",
          endDate: "2026-02-15",
        },
        isRecurring: false,
        status: "active" as const,
      };

      const hasOverlap = validateBudgetOverlap(newBudget, existingBudgets);

      expect(hasOverlap).toBe(false);
    });
  });

  describe("getBudgetsToRenew", () => {
    it("should return budgets that need renewal", () => {
      const budgets: Budget[] = [
        {
          id: "budget-1",
          categoryId: "cat-1",
          amount: 100000,
          type: "limit",
          period: {
            type: "month",
            startDate: "2025-12-01",
            endDate: "2025-12-31",
          },
          isRecurring: true,
          status: "active",
          createdAt: Date.now(),
        },
        {
          id: "budget-2",
          categoryId: "cat-2",
          amount: 200000,
          type: "limit",
          period: {
            type: "month",
            startDate: "2026-01-01",
            endDate: "2026-01-31",
          },
          isRecurring: true,
          status: "active",
          createdAt: Date.now(),
        },
        {
          id: "budget-3",
          categoryId: "cat-3",
          amount: 300000,
          type: "limit",
          period: {
            type: "month",
            startDate: "2025-11-01",
            endDate: "2025-11-30",
          },
          isRecurring: false, // No recurrente
          status: "active",
          createdAt: Date.now(),
        },
      ];

      const toRenew = getBudgetsToRenew(budgets, "2026-01-24");

      // Solo budget-1 necesita renovarse
      expect(toRenew).toHaveLength(1);
      expect(toRenew[0].id).toBe("budget-1");
    });
  });

  describe("getActiveBudgetForCategory", () => {
    it("should return active budget for category on given date", () => {
      const budgets: Budget[] = [
        {
          id: "budget-1",
          categoryId: "cat-groceries",
          amount: 500000,
          type: "limit",
          period: {
            type: "month",
            startDate: "2026-01-01",
            endDate: "2026-01-31",
          },
          isRecurring: true,
          status: "active",
          createdAt: Date.now(),
        },
        {
          id: "budget-2",
          categoryId: "cat-restaurant",
          amount: 300000,
          type: "limit",
          period: {
            type: "month",
            startDate: "2026-01-01",
            endDate: "2026-01-31",
          },
          isRecurring: true,
          status: "active",
          createdAt: Date.now(),
        },
      ];

      const budget = getActiveBudgetForCategory(
        budgets,
        "cat-groceries",
        "2026-01-15"
      );

      expect(budget).not.toBeNull();
      expect(budget?.id).toBe("budget-1");
    });

    it("should return null if no active budget", () => {
      const budgets: Budget[] = [
        {
          id: "budget-1",
          categoryId: "cat-groceries",
          amount: 500000,
          type: "limit",
          period: {
            type: "month",
            startDate: "2026-01-01",
            endDate: "2026-01-31",
          },
          isRecurring: true,
          status: "active",
          createdAt: Date.now(),
        },
      ];

      const budget = getActiveBudgetForCategory(
        budgets,
        "cat-groceries",
        "2026-02-15" // Fuera del período
      );

      expect(budget).toBeNull();
    });

    it("should return most recent if multiple budgets (edge case)", () => {
      const budgets: Budget[] = [
        {
          id: "budget-1",
          categoryId: "cat-groceries",
          amount: 500000,
          type: "limit",
          period: {
            type: "month",
            startDate: "2026-01-01",
            endDate: "2026-01-31",
          },
          isRecurring: true,
          status: "active",
          createdAt: 1000,
        },
        {
          id: "budget-2",
          categoryId: "cat-groceries",
          amount: 600000,
          type: "limit",
          period: {
            type: "month",
            startDate: "2026-01-01",
            endDate: "2026-01-31",
          },
          isRecurring: true,
          status: "active",
          createdAt: 2000, // Más reciente
        },
      ];

      const budget = getActiveBudgetForCategory(
        budgets,
        "cat-groceries",
        "2026-01-15"
      );

      expect(budget?.id).toBe("budget-2");
    });
  });

  describe("calculateAllBudgetsProgress", () => {
    it("should calculate progress for all budgets in period", () => {
      const budgets: Budget[] = [
        {
          id: "budget-1",
          categoryId: "cat-groceries",
          amount: 500000,
          type: "limit",
          period: {
            type: "month",
            startDate: "2026-01-01",
            endDate: "2026-01-31",
          },
          isRecurring: true,
          status: "active",
          createdAt: Date.now(),
        },
        {
          id: "budget-2",
          categoryId: "cat-restaurant",
          amount: 300000,
          type: "limit",
          period: {
            type: "month",
            startDate: "2026-01-01",
            endDate: "2026-01-31",
          },
          isRecurring: true,
          status: "active",
          createdAt: Date.now(),
        },
        // Este no debería aparecer (período diferente)
        {
          id: "budget-3",
          categoryId: "cat-transport",
          amount: 200000,
          type: "limit",
          period: {
            type: "month",
            startDate: "2026-02-01",
            endDate: "2026-02-28",
          },
          isRecurring: true,
          status: "active",
          createdAt: Date.now(),
        },
      ];

      const transactions: Transaction[] = [
        {
          id: "tx-1",
          type: "expense",
          name: "Mercado",
          category: "cat-groceries",
          amount: 150000,
          date: "2026-01-10",
          createdAt: Date.now(),
        },
        {
          id: "tx-2",
          type: "expense",
          name: "Restaurante",
          category: "cat-restaurant",
          amount: 100000,
          date: "2026-01-15",
          createdAt: Date.now(),
        },
      ];

      const allProgress = calculateAllBudgetsProgress(
        budgets,
        transactions,
        "2026-01-01",
        "2026-01-31"
      );

      expect(allProgress).toHaveLength(2);
      expect(allProgress.map((p) => p.budgetId)).toEqual(
        expect.arrayContaining(["budget-1", "budget-2"])
      );

      const groceriesProgress = allProgress.find(
        (p) => p.categoryId === "cat-groceries"
      );
      expect(groceriesProgress?.spent).toBe(150000);

      const restaurantProgress = allProgress.find(
        (p) => p.categoryId === "cat-restaurant"
      );
      expect(restaurantProgress?.spent).toBe(100000);
    });
  });
});
