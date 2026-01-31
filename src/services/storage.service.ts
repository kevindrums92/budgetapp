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
    if (!raw) {
      // Check if onboarding was completed (e.g., in e2e tests)
      // If so, initialize with default categories
      const onboardingCompleted = localStorage.getItem('budget.onboarding.completed.v2') === 'true';
      if (onboardingCompleted) {
        const initialState: BudgetState = {
          schemaVersion: 8,
          transactions: [],
          categories: [],
          categoryDefinitions: createDefaultCategories(),
          categoryGroups: createDefaultCategoryGroups(),
          budgets: [],
          trips: [],
          tripExpenses: [],
        };
        saveState(initialState);
        return initialState;
      }
      return null;
    }

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

    // Migrate v4 to v5: Full scheduled transactions support
    // - Convert isRecurring to schedule
    // - Deduplicate templates (keep only one per name+category+amount)
    // - Add sourceTemplateId to link generated transactions to their template
    if (parsed.schemaVersion === 4) {
      // Step 1: Convert isRecurring to schedule
      parsed.transactions = parsed.transactions.map((tx: any) => {
        if (tx.isRecurring) {
          return {
            ...tx,
            schedule: convertLegacyRecurringToSchedule(tx),
          };
        }
        return tx;
      });

      // Step 2: Deduplicate schedule templates
      // Keep only the most recent template for each (name, category, amount) combination
      const templatesMap = new Map<string, any>();
      const nonTemplates: any[] = [];

      for (const tx of parsed.transactions) {
        if (tx.schedule?.enabled) {
          const key = `${tx.name}|${tx.category}|${tx.amount}`;
          const existing = templatesMap.get(key);

          if (!existing || tx.date > existing.date ||
              (tx.date === existing.date && tx.createdAt > existing.createdAt)) {
            if (existing) {
              nonTemplates.push({ ...existing, schedule: undefined });
            }
            templatesMap.set(key, tx);
          } else {
            nonTemplates.push({ ...tx, schedule: undefined });
          }
        } else {
          nonTemplates.push(tx);
        }
      }

      // Step 3: Add sourceTemplateId to link transactions to their templates
      // This allows users to edit amount/name without causing duplicates
      const finalTransactions: any[] = [...templatesMap.values()];

      for (const tx of nonTemplates) {
        if (tx.sourceTemplateId) {
          finalTransactions.push(tx);
          continue;
        }

        // Try to find a matching template by name + category
        const key = `${tx.name}|${tx.category}`;
        let matchedTemplate: any = null;

        for (const template of templatesMap.values()) {
          const templateKey = `${template.name}|${template.category}`;
          if (templateKey === key) {
            matchedTemplate = template;
            break;
          }
        }

        if (matchedTemplate) {
          finalTransactions.push({ ...tx, sourceTemplateId: matchedTemplate.id });
        } else {
          finalTransactions.push(tx);
        }
      }

      parsed.transactions = finalTransactions;
      parsed.schemaVersion = 5;
      needsSave = true;
      console.log(`[Storage] Migrated v4→v5: ${templatesMap.size} schedule templates, linked transactions to their source`);
    }

    // Migrate v5 to v6: Add budgets array and remove monthlyLimit from categories
    if (parsed.schemaVersion === 5) {
      // Add budgets array (empty initially - nadie usa la feature)
      parsed.budgets = [];

      // Remove monthlyLimit from all categories
      if (Array.isArray(parsed.categoryDefinitions)) {
        parsed.categoryDefinitions = parsed.categoryDefinitions.map((cat: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { monthlyLimit, ...rest } = cat;
          return rest;
        });
      }

      parsed.schemaVersion = 6;
      needsSave = true;
      console.log('[Storage] Migrated v5→v6: Added budgets array, removed monthlyLimit from categories');
    }

    // Migrate v6 to v7: Add security settings
    if (parsed.schemaVersion === 6) {
      parsed.security = {
        biometricEnabled: false,
        lastAuthTimestamp: undefined,
      };
      parsed.schemaVersion = 7;
      needsSave = true;
      console.log('[Storage] Migrated v6→v7: Added security settings for biometric authentication');
    }

    // Migrate v7 to v8: Subscription moved out of BudgetState (managed by RevenueCat + Supabase)
    if (parsed.schemaVersion === 7) {
      delete parsed.subscription; // Clean up legacy field
      parsed.schemaVersion = 8;
      needsSave = true;
      console.log('[Storage] Migrated v7→v8: Removed subscription from state (now in separate table)');
    }

    // Always repair: Ensure all transactions have sourceTemplateId if they match a template
    // This fixes transactions that were confirmed before sourceTemplateId was added
    if (parsed.schemaVersion >= 5) {
      const templates = parsed.transactions.filter((tx: any) => tx.schedule?.enabled);

      if (templates.length > 0) {
        let repairCount = 0;

        parsed.transactions = parsed.transactions.map((tx: any) => {
          // Skip templates themselves and transactions that already have sourceTemplateId
          if (tx.schedule?.enabled || tx.sourceTemplateId) {
            return tx;
          }

          // Try to find a matching template by name + category
          const matchedTemplate = templates.find((template: any) =>
            template.name === tx.name && template.category === tx.category
          );

          if (matchedTemplate) {
            repairCount++;
            console.log(`[Storage] Repairing sourceTemplateId for "${tx.name}" (${tx.id}) -> template ${matchedTemplate.id}`);
            return { ...tx, sourceTemplateId: matchedTemplate.id };
          }

          return tx;
        });

        if (repairCount > 0) {
          needsSave = true;
          console.log(`[Storage] Repaired ${repairCount} transactions with missing sourceTemplateId`);
        }
      }
    }

    // Ensure all arrays exist
    if (!Array.isArray(parsed.categories)) parsed.categories = [];
    if (!Array.isArray(parsed.budgets)) parsed.budgets = [];
    if (!Array.isArray(parsed.trips)) parsed.trips = [];
    if (!Array.isArray(parsed.tripExpenses)) parsed.tripExpenses = [];

    // Ensure categoryGroups exists (for any edge cases)
    if (!Array.isArray(parsed.categoryGroups) || parsed.categoryGroups.length === 0) {
      parsed.categoryGroups = createDefaultCategoryGroups();
      needsSave = true;
    }

    // Migrate old string categories to categoryDefinitions (only for legacy users)
    if (!Array.isArray(parsed.categoryDefinitions) || parsed.categoryDefinitions.length === 0) {
      // Check if there are old string categories to migrate
      const hasLegacyCategories = Array.isArray(parsed.categories) && parsed.categories.length > 0;

      // Check if onboarding was completed (includes e2e test scenarios)
      const onboardingCompleted = typeof window !== 'undefined' &&
        localStorage.getItem('budget.onboarding.completed.v2') === 'true';

      if (hasLegacyCategories || onboardingCompleted) {
        // Legacy user OR completed onboarding - inject defaults
        const defaults = createDefaultCategories();

        if (hasLegacyCategories) {
          // Also migrate custom categories from old format
          const defaultNamesLower = new Set(defaults.map((c) => c.name.toLowerCase()));
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
        } else {
          // Just inject defaults (e2e tests or edge cases)
          parsed.categoryDefinitions = defaults;
        }

        needsSave = true;
      } else {
        // New user still in onboarding - categories will be created during onboarding
        parsed.categoryDefinitions = [];
      }
    }

    const result = parsed as BudgetState;

    console.log('[Storage] loadState returning:', {
      schemaVersion: result.schemaVersion,
    });

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
