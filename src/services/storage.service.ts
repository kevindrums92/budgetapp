import type { BudgetState, Category } from "@/types/budget.types";
import { createDefaultCategories } from "@/constants/default-categories";
import { DEFAULT_CATEGORY_ICON } from "@/constants/category-icons";
import { DEFAULT_CATEGORY_COLOR } from "@/constants/category-colors";

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
      groupId: "miscellaneous" as const,
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

    // If no match found, create a new category for this transaction
    // This shouldn't happen often since migrateCategoriesToDefinitions handles custom categories
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
    }

    // Ensure all arrays exist
    if (!Array.isArray(parsed.categories)) parsed.categories = [];
    if (!Array.isArray(parsed.categoryDefinitions)) {
      parsed.categoryDefinitions = createDefaultCategories();
    }
    if (!Array.isArray(parsed.trips)) parsed.trips = [];
    if (!Array.isArray(parsed.tripExpenses)) parsed.tripExpenses = [];

    return parsed as BudgetState;
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

