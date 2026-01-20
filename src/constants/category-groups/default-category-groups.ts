import type { CategoryGroup, TransactionType } from "@/types/budget.types";

// Default group colors
const GROUP_COLORS = {
  food_drink: "#D97706",      // Amber
  home_utilities: "#3B82F6",  // Blue
  lifestyle: "#EC4899",       // Pink
  transport: "#0EA5E9",       // Sky
  miscellaneous: "#6B7280",   // Gray
  primary_income: "#10B981",  // Emerald
  other_income: "#8B5CF6",    // Violet
};

type DefaultGroupDef = {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
};

const DEFAULT_GROUP_DEFS: DefaultGroupDef[] = [
  // Expense groups
  { id: "food_drink", name: "Comida y Bebida", type: "expense", color: GROUP_COLORS.food_drink },
  { id: "home_utilities", name: "Hogar y Servicios", type: "expense", color: GROUP_COLORS.home_utilities },
  { id: "lifestyle", name: "Estilo de Vida", type: "expense", color: GROUP_COLORS.lifestyle },
  { id: "transport", name: "Transporte", type: "expense", color: GROUP_COLORS.transport },
  { id: "miscellaneous", name: "Otros", type: "expense", color: GROUP_COLORS.miscellaneous },
  // Income groups
  { id: "primary_income", name: "Ingresos Principales", type: "income", color: GROUP_COLORS.primary_income },
  { id: "other_income", name: "Otros Ingresos", type: "income", color: GROUP_COLORS.other_income },
];

/**
 * Creates default category groups with timestamps.
 * Used for new users and migration from schema v2 to v3.
 */
export function createDefaultCategoryGroups(): CategoryGroup[] {
  const now = Date.now();
  return DEFAULT_GROUP_DEFS.map((def) => ({
    id: def.id,
    name: def.name,
    type: def.type,
    color: def.color,
    isDefault: true,
    createdAt: now,
  }));
}

/**
 * ID of the "miscellaneous" group for expense categories.
 * Used when deleting a group to reassign orphaned categories.
 */
export const MISCELLANEOUS_GROUP_ID = "miscellaneous";

/**
 * ID of the "other_income" group for income categories.
 * Used when deleting a group to reassign orphaned categories.
 */
export const OTHER_INCOME_GROUP_ID = "other_income";
