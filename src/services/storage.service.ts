import type { BudgetState, Category } from "@/types/budget.types";
import { createDefaultCategories } from "@/constants/categories/default-categories";
import { createDefaultCategoryGroups } from "@/constants/category-groups/default-category-groups";
import { DEFAULT_CATEGORY_ICON } from "@/constants/categories/category-icons";
import { DEFAULT_CATEGORY_COLOR } from "@/constants/categories/category-colors";
import { convertLegacyRecurringToSchedule } from "@/shared/services/scheduler.service";

const STORAGE_KEY = "budget_app_v1";

// Migrate string categories to Category objects
function migrateCategoriesToDefinitions(oldCategories: string[]): Category[] {
  const defaults = createDefaultCategories();
  const defaultNamesLower = new Set(defaults.map((c) => c.name.toLowerCase()));

  // Create Category objects for custom categories that don't match defaults
  const customCategories: Category[] = oldCategories
    .filter((name) => name.trim() && !defaultNamesLower.has(name.toLowerCase()))
    .map((name) => ({
      id: crypto.randomUUID(),
      name: name.trim(),
      icon: DEFAULT_CATEGORY_ICON,
      color: DEFAULT_CATEGORY_COLOR,
      type: "expense" as const, // Assume expense (most common)
      groupId: "miscellaneous",
      isDefault: false,
      createdAt: Date.now(),
    }));

  return [...defaults, ...customCategories];
}

// Update transaction category strings to category IDs
function migrateTransactionCategories(
  transactions: BudgetState["transactions"],
  categoryDefinitions: Category[]
): BudgetState["transactions"] {
  return transactions.map((tx) => {
    // Find matching category by name (case-insensitive)
    const matchingCategory = categoryDefinitions.find(
      (c) => c.name.toLowerCase() === tx.category.toLowerCase()
    );

    if (matchingCategory) {
      return { ...tx, category: matchingCategory.id };
    }

    // If no match found, keep original
    return tx;
  });
}

export function loadState(): BudgetState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Validación mínima
    if (!Array.isArray(parsed.transactions)) return null;

    let needsSave = false;

    // Handle legacy v1 or missing schema version
    if (parsed.schemaVersion === 1 || !parsed.schemaVersion) {
      // Ensure categories array exists for migration
      if (!Array.isArray(parsed.categories)) {
        parsed.categories = [];
      }

      // Migrate to v2
      parsed.categoryDefinitions = migrateCategoriesToDefinitions(parsed.categories);
      parsed.transactions = migrateTransactionCategories(parsed.transactions, parsed.categoryDefinitions);
      parsed.schemaVersion = 2;
      needsSave = true;
    }

    // Migrate v2 to v3: Add categoryGroups
    if (parsed.schemaVersion === 2) {
      parsed.categoryGroups = createDefaultCategoryGroups();
      parsed.schemaVersion = 3;
      needsSave = true;
    }

    // Migrate v3 to v4: Add isRecurring field to transactions
    if (parsed.schemaVersion === 3) {
      parsed.transactions = parsed.transactions.map((tx: any) => ({
        ...tx,
        isRecurring: tx.isRecurring ?? false,
      }));
      parsed.schemaVersion = 4;
      needsSave = true;
    }

    // Migrate v4 to v5: Convert isRecurring to schedule
    if (parsed.schemaVersion === 4) {
      parsed.transactions = parsed.transactions.map((tx: any) => {
        // If has isRecurring=true, convert to schedule
        if (tx.isRecurring) {
          return {
            ...tx,
            schedule: convertLegacyRecurringToSchedule(tx),
            // Keep isRecurring for backward compat but it's deprecated
          };
        }
        return tx;
      });
      parsed.schemaVersion = 5;
      needsSave = true;
    }

    // Migrate v5 to v6: Deduplicate schedule templates
    // The v4→v5 migration created a schedule for EVERY isRecurring transaction,
    // but we only need ONE template per unique (name, category, amount) combination.
    // Keep only the most recent template for each combination.
    if (parsed.schemaVersion === 5) {
      const templatesMap = new Map<string, any>();
      const nonTemplates: any[] = [];

      for (const tx of parsed.transactions) {
        if (tx.schedule?.enabled) {
          // Create a unique key for this template
          const key = `${tx.name}|${tx.category}|${tx.amount}`;
          const existing = templatesMap.get(key);

          // Keep the most recent one (by date, then by createdAt)
          if (!existing || tx.date > existing.date ||
              (tx.date === existing.date && tx.createdAt > existing.createdAt)) {
            // If there was an existing one, convert it to non-template
            if (existing) {
              nonTemplates.push({ ...existing, schedule: undefined });
            }
            templatesMap.set(key, tx);
          } else {
            // This one is older, convert to non-template
            nonTemplates.push({ ...tx, schedule: undefined });
          }
        } else {
          nonTemplates.push(tx);
        }
      }

      // Combine: templates + non-templates
      parsed.transactions = [...templatesMap.values(), ...nonTemplates];
      parsed.schemaVersion = 6;
      needsSave = true;
      console.log(`[Storage] Migrated v5→v6: Deduplicated to ${templatesMap.size} schedule templates`);
    }

    // Ensure all arrays exist
    if (!Array.isArray(parsed.categories)) parsed.categories = [];
    if (!Array.isArray(parsed.trips)) parsed.trips = [];
    if (!Array.isArray(parsed.tripExpenses)) parsed.tripExpenses = [];

    // Ensure categoryGroups exists (for any edge cases)
    if (!Array.isArray(parsed.categoryGroups) || parsed.categoryGroups.length === 0) {
      parsed.categoryGroups = createDefaultCategoryGroups();
      needsSave = true;
    }

    // Ensure categoryDefinitions has default categories
    if (!Array.isArray(parsed.categoryDefinitions) || parsed.categoryDefinitions.length === 0) {
      // No categories at all - create defaults plus any custom from old categories array
      const defaults = createDefaultCategories();
      const defaultNamesLower = new Set(defaults.map((c) => c.name.toLowerCase()));

      // Convert any old string categories to Category objects
      const customFromOld: Category[] = (parsed.categories || [])
        .filter((name: string) => name.trim() && !defaultNamesLower.has(name.toLowerCase()))
        .map((name: string) => ({
          id: crypto.randomUUID(),
          name: name.trim(),
          icon: DEFAULT_CATEGORY_ICON,
          color: DEFAULT_CATEGORY_COLOR,
          type: "expense" as const,
          groupId: "miscellaneous",
          isDefault: false,
          createdAt: Date.now(),
        }));

      parsed.categoryDefinitions = [...defaults, ...customFromOld];
      needsSave = true;
    }

    const result = parsed as BudgetState;

    // Persist the migration/fix to localStorage
    if (needsSave) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      } catch {}
    }

    return result;
  } catch {
    return null;
  }
}

export function saveState(state: BudgetState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // opcional: manejar quota exceeded con UI luego
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
