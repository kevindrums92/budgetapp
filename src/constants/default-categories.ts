import type { Category, TransactionType } from "@/types/budget.types";

type DefaultCategoryDef = Omit<Category, "id" | "createdAt">;

const DEFAULT_EXPENSE_CATEGORIES: DefaultCategoryDef[] = [
  // Food & Drink
  { name: "Mercado", icon: "shopping-basket", color: "#10B981", type: "expense", groupId: "food_drink", isDefault: true },
  { name: "Restaurantes", icon: "utensils-crossed", color: "#F59E0B", type: "expense", groupId: "food_drink", isDefault: true },

  // Home & Utilities
  { name: "Servicios", icon: "lightbulb", color: "#6366F1", type: "expense", groupId: "home_utilities", isDefault: true },
  { name: "Arriendo", icon: "home", color: "#8B5CF6", type: "expense", groupId: "home_utilities", isDefault: true },
  { name: "Suscripciones", icon: "tv", color: "#EC4899", type: "expense", groupId: "home_utilities", isDefault: true },

  // Lifestyle
  { name: "Ropa", icon: "shirt", color: "#F43F5E", type: "expense", groupId: "lifestyle", isDefault: true },
  { name: "Educación", icon: "graduation-cap", color: "#3B82F6", type: "expense", groupId: "lifestyle", isDefault: true },
  { name: "Entretenimiento", icon: "gamepad-2", color: "#A855F7", type: "expense", groupId: "lifestyle", isDefault: true },
  { name: "Hijos", icon: "baby", color: "#F472B6", type: "expense", groupId: "lifestyle", isDefault: true },
  { name: "Salud", icon: "stethoscope", color: "#EF4444", type: "expense", groupId: "lifestyle", isDefault: true },

  // Transport
  { name: "Transporte", icon: "car", color: "#0EA5E9", type: "expense", groupId: "transport", isDefault: true },
  { name: "Gasolina", icon: "fuel", color: "#EA580C", type: "expense", groupId: "transport", isDefault: true },

  // Miscellaneous
  { name: "Otros Gastos", icon: "help-circle", color: "#6B7280", type: "expense", groupId: "miscellaneous", isDefault: true },
];

const DEFAULT_INCOME_CATEGORIES: DefaultCategoryDef[] = [
  // Primary Income
  { name: "Salario", icon: "briefcase", color: "#10B981", type: "income", groupId: "primary_income", isDefault: true },
  { name: "Bonos", icon: "trending-up", color: "#22C55E", type: "income", groupId: "primary_income", isDefault: true },
  { name: "Freelance", icon: "laptop", color: "#14B8A6", type: "income", groupId: "primary_income", isDefault: true },

  // Other Income
  { name: "Beneficios", icon: "building-2", color: "#3B82F6", type: "income", groupId: "other_income", isDefault: true },
  { name: "Inversiones", icon: "piggy-bank", color: "#8B5CF6", type: "income", groupId: "other_income", isDefault: true },
  { name: "Arriendo Recibido", icon: "key", color: "#F59E0B", type: "income", groupId: "other_income", isDefault: true },
  { name: "Propinas", icon: "banknote", color: "#22D3EE", type: "income", groupId: "other_income", isDefault: true },
  { name: "Otros Ingresos", icon: "more-horizontal", color: "#6B7280", type: "income", groupId: "other_income", isDefault: true },
];

export const DEFAULT_CATEGORIES: DefaultCategoryDef[] = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];

// Initialize default categories with IDs
export function createDefaultCategories(): Category[] {
  return DEFAULT_CATEGORIES.map((cat) => ({
    ...cat,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  }));
}

// Get default categories filtered by type
export function getDefaultCategoriesByType(type: TransactionType): DefaultCategoryDef[] {
  return DEFAULT_CATEGORIES.filter((c) => c.type === type);
}
