/**
 * Shared mock data for Storybook stories.
 */
import type {
  Transaction,
  Category,
  CategoryGroup,
  Budget,
  BudgetProgress,
} from "@/types/budget.types";

// ── Category Groups ──────────────────────────────────────────────

export const mockCategoryGroups: CategoryGroup[] = [
  {
    id: "grp-essential",
    name: "Esenciales",
    type: "expense",
    color: "#6366F1",
    isDefault: true,
    createdAt: Date.now(),
  },
  {
    id: "grp-lifestyle",
    name: "Estilo de vida",
    type: "expense",
    color: "#F59E0B",
    isDefault: true,
    createdAt: Date.now(),
  },
  {
    id: "grp-income",
    name: "Ingresos",
    type: "income",
    color: "#10B981",
    isDefault: true,
    createdAt: Date.now(),
  },
];

// ── Categories ───────────────────────────────────────────────────

export const mockCategories: Category[] = [
  {
    id: "cat-food",
    name: "Alimentación",
    icon: "utensils",
    color: "#F59E0B",
    type: "expense",
    groupId: "grp-essential",
    isDefault: true,
    createdAt: Date.now(),
  },
  {
    id: "cat-transport",
    name: "Transporte",
    icon: "car",
    color: "#3B82F6",
    type: "expense",
    groupId: "grp-essential",
    isDefault: true,
    createdAt: Date.now(),
  },
  {
    id: "cat-entertainment",
    name: "Entretenimiento",
    icon: "gamepad-2",
    color: "#8B5CF6",
    type: "expense",
    groupId: "grp-lifestyle",
    isDefault: true,
    createdAt: Date.now(),
  },
  {
    id: "cat-health",
    name: "Salud",
    icon: "heart-pulse",
    color: "#EF4444",
    type: "expense",
    groupId: "grp-essential",
    isDefault: true,
    createdAt: Date.now(),
  },
  {
    id: "cat-salary",
    name: "Salario",
    icon: "banknote",
    color: "#10B981",
    type: "income",
    groupId: "grp-income",
    isDefault: true,
    createdAt: Date.now(),
  },
  {
    id: "cat-freelance",
    name: "Freelance",
    icon: "laptop",
    color: "#06B6D4",
    type: "income",
    groupId: "grp-income",
    isDefault: true,
    createdAt: Date.now(),
  },
];

// ── Transactions ─────────────────────────────────────────────────

export const mockTransactions: Transaction[] = [
  {
    id: "tx-1",
    type: "expense",
    name: "Almuerzo en restaurante",
    category: "cat-food",
    amount: 35000,
    date: "2026-02-10",
    status: "paid",
    createdAt: Date.now(),
  },
  {
    id: "tx-2",
    type: "expense",
    name: "Taxi al trabajo",
    category: "cat-transport",
    amount: 12000,
    date: "2026-02-10",
    status: "paid",
    createdAt: Date.now() - 3600000,
  },
  {
    id: "tx-3",
    type: "income",
    name: "Salario febrero",
    category: "cat-salary",
    amount: 4500000,
    date: "2026-02-01",
    status: "paid",
    createdAt: Date.now() - 86400000,
  },
  {
    id: "tx-4",
    type: "expense",
    name: "Cita ortopedia",
    category: "cat-health",
    amount: 110000,
    date: "2026-02-09",
    status: "pending",
    createdAt: Date.now() - 86400000,
  },
  {
    id: "tx-5",
    type: "expense",
    name: "Netflix mensual",
    category: "cat-entertainment",
    amount: 33900,
    date: "2026-02-05",
    status: "paid",
    schedule: {
      enabled: true,
      frequency: "monthly",
      interval: 1,
      startDate: "2025-01-05",
      dayOfMonth: 5,
    },
    createdAt: Date.now() - 432000000,
  },
];

// ── Budgets ──────────────────────────────────────────────────────

const mockBudgetLimit: Budget = {
  id: "budget-food",
  categoryId: "cat-food",
  amount: 500000,
  type: "limit",
  period: {
    type: "month",
    startDate: "2026-02-01",
    endDate: "2026-02-28",
  },
  isRecurring: true,
  status: "active",
  createdAt: Date.now(),
};

const mockBudgetGoal: Budget = {
  id: "budget-savings",
  categoryId: "cat-salary",
  amount: 1000000,
  type: "goal",
  period: {
    type: "month",
    startDate: "2026-02-01",
    endDate: "2026-02-28",
  },
  isRecurring: false,
  status: "active",
  createdAt: Date.now(),
};

// ── Budget Progress ──────────────────────────────────────────────

export const mockBudgetProgressUnderLimit: BudgetProgress = {
  budget: mockBudgetLimit,
  category: mockCategories[0], // Alimentación
  spent: 280000,
  saved: 0,
  percentage: 56,
  remaining: 220000,
  isExceeded: false,
  isCompleted: false,
};

export const mockBudgetProgressExceeded: BudgetProgress = {
  budget: mockBudgetLimit,
  category: mockCategories[0], // Alimentación
  spent: 620000,
  saved: 0,
  percentage: 124,
  remaining: -120000,
  isExceeded: true,
  isCompleted: false,
};

export const mockBudgetProgressGoal: BudgetProgress = {
  budget: mockBudgetGoal,
  category: mockCategories[4], // Salario
  spent: 0,
  saved: 650000,
  percentage: 65,
  remaining: 350000,
  isExceeded: false,
  isCompleted: false,
};

export const mockBudgetProgressGoalAchieved: BudgetProgress = {
  budget: mockBudgetGoal,
  category: mockCategories[4], // Salario
  spent: 0,
  saved: 1200000,
  percentage: 120,
  remaining: 0,
  isExceeded: false,
  isCompleted: true,
};

// ── Helpers ──────────────────────────────────────────────────────

export function getCategoryById(id: string): Category | undefined {
  return mockCategories.find((c) => c.id === id);
}
