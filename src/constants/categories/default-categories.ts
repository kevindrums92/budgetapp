import type { Category, TransactionType } from "@/types/budget.types";
import { generateUUID } from "@/shared/utils/uuid";

type DefaultCategoryDef = Omit<Category, "id" | "createdAt">;

const DEFAULT_EXPENSE_CATEGORIES: DefaultCategoryDef[] = [
  // Food & Drink
  { name: "Mercado", icon: "shopping-basket", color: "#10B981", type: "expense", groupId: "food_drink", isDefault: true },
  { name: "Restaurantes", icon: "utensils", color: "#D97706", type: "expense", groupId: "food_drink", isDefault: true },

  // Home & Utilities
  { name: "Arriendo", icon: "house", color: "#8B5CF6", type: "expense", groupId: "home_utilities", isDefault: true },
  { name: "Servicios", icon: "zap", color: "#3B82F6", type: "expense", groupId: "home_utilities", isDefault: true },
  { name: "Suscripciones", icon: "repeat", color: "#6366F1", type: "expense", groupId: "home_utilities", isDefault: true },

  // Lifestyle
  { name: "Ropa", icon: "shirt", color: "#F43F5E", type: "expense", groupId: "lifestyle", isDefault: true },
  { name: "Entretenimiento", icon: "gamepad-2", color: "#A855F7", type: "expense", groupId: "lifestyle", isDefault: true },
  { name: "Salud", icon: "stethoscope", color: "#EF4444", type: "expense", groupId: "lifestyle", isDefault: true },
  { name: "Educación", icon: "graduation-cap", color: "#2563EB", type: "expense", groupId: "lifestyle", isDefault: true },
  { name: "Cuidado Personal", icon: "sparkles", color: "#EC4899", type: "expense", groupId: "lifestyle", isDefault: true },

  // Transport
  { name: "Transporte", icon: "car", color: "#0EA5E9", type: "expense", groupId: "transport", isDefault: true },
  { name: "Gasolina", icon: "fuel", color: "#F97316", type: "expense", groupId: "transport", isDefault: true },

  // Family
  { name: "Hijos", icon: "baby", color: "#F59E0B", type: "expense", groupId: "family", isDefault: true },
  { name: "Mascotas", icon: "paw-print", color: "#A3734C", type: "expense", groupId: "family", isDefault: true },
  { name: "Regalos", icon: "gift", color: "#E11D48", type: "expense", groupId: "family", isDefault: true },

  // Miscellaneous
  { name: "Otros Gastos", icon: "package", color: "#6B7280", type: "expense", groupId: "miscellaneous", isDefault: true },
];

const DEFAULT_INCOME_CATEGORIES: DefaultCategoryDef[] = [
  // Primary Income
  { name: "Salario", icon: "briefcase", color: "#10B981", type: "income", groupId: "primary_income", isDefault: true },
  { name: "Freelance", icon: "laptop", color: "#0EA5E9", type: "income", groupId: "primary_income", isDefault: true },
  { name: "Bonos", icon: "trophy", color: "#F59E0B", type: "income", groupId: "primary_income", isDefault: true },

  // Other Income
  { name: "Inversiones", icon: "trending-up", color: "#8B5CF6", type: "income", groupId: "other_income", isDefault: true },
  { name: "Arriendo Recibido", icon: "building", color: "#3B82F6", type: "income", groupId: "other_income", isDefault: true },
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
