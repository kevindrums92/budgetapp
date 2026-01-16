import type { CategoryGroup, TransactionType } from "@/types/budget.types";
import { createDefaultCategoryGroups } from "./default-category-groups";

// Legacy export for backward compatibility during migration
// Components should prefer reading from store.categoryGroups
export const CATEGORY_GROUPS: CategoryGroup[] = createDefaultCategoryGroups();

export function getGroupName(groupId: string, groups?: CategoryGroup[]): string {
  const searchGroups = groups ?? CATEGORY_GROUPS;
  return searchGroups.find((g) => g.id === groupId)?.name ?? groupId;
}

export function getGroupsByType(type: TransactionType, groups?: CategoryGroup[]): CategoryGroup[] {
  const searchGroups = groups ?? CATEGORY_GROUPS;
  return searchGroups.filter((g) => g.type === type);
}
