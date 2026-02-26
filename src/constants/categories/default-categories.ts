import type { Category, TransactionType } from "@/types/budget.types";
import { generateUUID } from "@/shared/utils/uuid";

type DefaultCategoryDef = Omit<Category, "id" | "createdAt">;

const DEFAULT_EXPENSE_CATEGORIES: DefaultCategoryDef[] = [
  // Food & Drink
  { name: "Mercado", icon: "shopping-basket", color: "#10B981", type: "expense", groupId: "food_drink", isDefault: true },

  // Home & Utilities
  { name: "Arriendo", icon: "house", color: "#8B5CF6", type: "expense", groupId: "home_utilities", isDefault: true },

  // Lifestyle
  { name: "Ropa", icon: "shirt", color: "#F43F5E", type: "expense", groupId: "lifestyle", isDefault: true },
  { name: "Entretenimiento", icon: "gamepad-2", color: "#A855F7", type: "expense", groupId: "lifestyle", isDefault: true },
  { name: "Salud", icon: "stethoscope", color: "#EF4444", type: "expense", groupId: "lifestyle", isDefault: true },

  // Transport
  { name: "Transporte", icon: "car", color: "#0EA5E9", type: "expense", groupId: "transport", isDefault: true },

  // Miscellaneous
  { name: "Otros Gastos", icon: "package", color: "#6B7280", type: "expense", groupId: "miscellaneous", isDefault: true },
];

const DEFAULT_INCOME_CATEGORIES: DefaultCategoryDef[] = [
  // Primary Income
  { name: "Salario", icon: "briefcase", color: "#10B981", type: "income", groupId: "primary_income", isDefault: true },

  // Other Income
  { name: "Otros Ingresos", icon: "coins", color: "#6B7280", type: "income", groupId: "other_income", isDefault: true },
];

export const DEFAULT_CATEGORIES: DefaultCategoryDef[] = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];

// Initialize default categories with IDs
export function createDefaultCategories(): Category[] {
  return DEFAULT_CATEGORIES.map((cat) => ({
    ...cat,
    id: generateUUID(),
    createdAt: Date.now(),
  }));
}

// Get default categories filtered by type
export function getDefaultCategoriesByType(type: TransactionType): DefaultCategoryDef[] {
  return DEFAULT_CATEGORIES.filter((c) => c.type === type);
}
