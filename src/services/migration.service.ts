import type { Budget, BudgetType } from "@/types/budget.types";

/**
 * Migration service for budget data
 * Ensures backward compatibility when adding new fields to Budget type
 */

/**
 * Migrates budgets to V2 schema (adds type field)
 * All existing budgets are marked as 'limit' (previous behavior)
 *
 * @param budgets - Array of budgets (may or may not have 'type' field)
 * @returns Array of budgets with 'type' field
 */
export function migrateBudgetsToV2(budgets: any[]): Budget[] {
  return budgets.map((budget) => {
    // If budget already has type, return as-is
    if (budget.type) return budget as Budget;

    // Otherwise, mark as 'limit' (default behavior before this feature)
    return {
      ...budget,
      type: "limit" as BudgetType,
    } as Budget;
  });
}

/**
 * Main migration function
 * Runs all migrations in sequence
 *
 * @param budgets - Raw budgets array from storage
 * @returns Migrated budgets array
 */
export function migrateBudgets(budgets: any[]): Budget[] {
  if (!Array.isArray(budgets)) return [];

  // Run migrations in order
  let migrated = budgets;

  // V2: Add type field
  migrated = migrateBudgetsToV2(migrated);

  return migrated;
}
