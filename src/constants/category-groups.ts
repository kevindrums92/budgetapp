import type { CategoryGroup } from "@/types/budget.types";

export const CATEGORY_GROUPS: CategoryGroup[] = [
  // Expense groups
  { id: "food_drink", name: "Comida y Bebida", type: "expense" },
  { id: "home_utilities", name: "Hogar y Servicios", type: "expense" },
  { id: "lifestyle", name: "Estilo de Vida", type: "expense" },
  { id: "transport", name: "Transporte", type: "expense" },
  { id: "miscellaneous", name: "Otros", type: "expense" },
  // Income groups
  { id: "primary_income", name: "Ingresos Principales", type: "income" },
  { id: "other_income", name: "Otros Ingresos", type: "income" },
];

export function getGroupName(groupId: string): string {
  return CATEGORY_GROUPS.find((g) => g.id === groupId)?.name ?? groupId;
}

export function getGroupsByType(type: "income" | "expense"): CategoryGroup[] {
  return CATEGORY_GROUPS.filter((g) => g.type === type);
}
