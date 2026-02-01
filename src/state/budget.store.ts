import { create } from "zustand";
import type {
  BudgetState,
  Transaction,
  TransactionType,
  TransactionStatus,
  Schedule,
  Trip,
  TripExpense,
  TripStatus,
  TripExpenseCategory,
  Category,
  CategoryGroup,
  Budget,
  BudgetPeriod,
  BudgetStatus,
  BudgetType,
  BudgetProgress,
  SecuritySettings,
  SubscriptionState,
} from "@/types/budget.types";
import { TRIAL_PERIOD_DAYS } from "@/constants/pricing";
import { loadState, saveState } from "@/services/storage.service";
import { currentMonthKey, todayISO } from "@/services/dates.service";
import { createDefaultCategoryGroups, MISCELLANEOUS_GROUP_ID, OTHER_INCOME_GROUP_ID } from "@/constants/category-groups/default-category-groups";
import { getBudgetsToRenew, renewRecurringBudget, validateBudgetOverlap } from "@/features/budget/services/budget.service";
import { migrateBudgets } from "@/services/migration.service";

type CloudStatus = "idle" | "syncing" | "ok" | "offline" | "error";
type CloudMode = "guest" | "cloud";

type AddTxInput = {
  type: TransactionType;
  name: string;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  isRecurring?: boolean;
  schedule?: Schedule;
  status?: TransactionStatus;
  sourceTemplateId?: string; // Links to the template that generated this transaction
};

type AddTripInput = {
  name: string;
  destination: string;
  budget: number;
  startDate: string;
  endDate: string | null;
  status: TripStatus;
};

type AddTripExpenseInput = {
  tripId: string;
  category: TripExpenseCategory;
  name: string;
  amount: number;
  date: string;
  notes?: string;
};

type AddCategoryInput = {
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  groupId: string;
};

type AddCategoryGroupInput = {
  name: string;
  type: TransactionType;
  color: string;
};

type CreateBudgetInput = {
  categoryId: string;
  amount: number;
  type: BudgetType;
  period: BudgetPeriod;
  accountId?: string;
  isRecurring: boolean;
};

type BudgetStore = BudgetState & {
  // UI
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (monthKey: string) => void;

  // Auth state (single source of truth)
  user: {
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
  };
  setUser: (user: BudgetStore['user']) => void;

  // CRUD Transactions
  addTransaction: (input: AddTxInput) => void;
  updateTransaction: (
    id: string,
    patch: Partial<Omit<Transaction, "id" | "createdAt">>
  ) => void;
  deleteTransaction: (id: string) => void;

  // CRUD Trips
  addTrip: (input: AddTripInput) => void;
  updateTrip: (id: string, patch: Partial<Omit<Trip, "id" | "createdAt">>) => void;
  deleteTrip: (id: string) => void;

  // CRUD Trip Expenses
  addTripExpense: (input: AddTripExpenseInput) => void;
  updateTripExpense: (
    id: string,
    patch: Partial<Omit<TripExpense, "id" | "tripId" | "createdAt">>
  ) => void;
  deleteTripExpense: (id: string) => void;

  // CRUD Categories
  addCategory: (input: AddCategoryInput) => string; // Returns new category ID
  updateCategory: (
    id: string,
    patch: Partial<Omit<Category, "id" | "createdAt" | "isDefault">>
  ) => void;
  deleteCategory: (id: string) => void;
  getCategoryById: (id: string) => Category | undefined;

  // CRUD Category Groups
  addCategoryGroup: (input: AddCategoryGroupInput) => string; // Returns new group ID
  updateCategoryGroup: (
    id: string,
    patch: Partial<Omit<CategoryGroup, "id" | "createdAt" | "isDefault">>
  ) => void;
  deleteCategoryGroup: (id: string) => void;
  getCategoryGroupById: (id: string) => CategoryGroup | undefined;

  // CRUD Budgets
  createBudget: (input: CreateBudgetInput) => string | null; // Returns new budget ID or null if overlap
  updateBudget: (
    id: string,
    patch: Partial<Omit<Budget, "id" | "createdAt">>
  ) => void;
  deleteBudget: (id: string) => void;
  archiveBudget: (id: string) => void;
  getBudgetById: (id: string) => Budget | undefined;
  renewExpiredBudgets: () => void;

  // Budget Progress & Health Check
  getBudgetProgress: (budgetId: string) => BudgetProgress | null;
  getBudgetHealthCheck: () => {
    exceededLimits: number;
    totalLimits: number;
    goalPercentage: number;
    totalGoals: number;
  };

  // Landing
  welcomeSeen: boolean;
  setWelcomeSeen: (v: boolean) => void;
  budgetOnboardingSeen: boolean;
  setBudgetOnboardingSeen: (v: boolean) => void;
  savingsGoalOnboardingSeen: boolean;
  setSavingsGoalOnboardingSeen: (v: boolean) => void;

  cloudMode: CloudMode;
  cloudStatus: CloudStatus;
  setCloudMode: (m: CloudMode) => void;
  setCloudStatus: (s: CloudStatus) => void;

  // Scheduler
  setLastSchedulerRun: (date: string) => void;
  setCloudSyncReady: () => void;

  // Stats preferences
  excludedFromStats: string[];
  toggleCategoryFromStats: (categoryId: string) => void;

  // Security
  toggleBiometricAuth: () => void;
  updateLastAuthTimestamp: () => void;
  getBiometricSettings: () => SecuritySettings;

  // Subscription (in-memory only, NOT part of BudgetState persistence)
  subscription: SubscriptionState | null;
  setSubscription: (sub: SubscriptionState | null) => void;
  startTrial: () => void;
  clearSubscription: () => void;
  syncWithRevenueCat: () => Promise<void>;

  // Sync helpers
  getSnapshot: () => BudgetState;
  replaceAllData: (next: BudgetState) => void;
};

const defaultState: BudgetState = {
  schemaVersion: 8,
  transactions: [],
  categories: [],
  categoryDefinitions: [], // Las categorías se crean durante el onboarding
  categoryGroups: createDefaultCategoryGroups(), // Los grupos sí se crean por defecto
  budgets: [],
  trips: [],
  tripExpenses: [],
  security: { biometricEnabled: false },
};

function uniqSorted(arr: string[]) {
  return Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es")
  );
}

export const useBudgetStore = create<BudgetStore>((set, get) => {
  const hydrated = loadState() ?? defaultState;

  // Migrate budgets if necessary
  const migratedBudgets = migrateBudgets(hydrated.budgets ?? []);

  return {
    // ---------- STATE ----------
    ...hydrated,
    budgets: migratedBudgets,
    subscription: null, // In-memory only, loaded by RevenueCatProvider via subscription.service.ts

    cloudMode: "guest",
    cloudStatus: "idle",
    setCloudMode: (m) => set({ cloudMode: m }),
    setCloudStatus: (s) => set({ cloudStatus: s }),

    // Landing flag (se guarda en localStorage aparte o dentro del mismo state, como lo tengas)
    welcomeSeen: (() => {
      try { return localStorage.getItem("budget.welcomeSeen.v1") === "1"; }
      catch { return false; }
    })(),
    setWelcomeSeen: (v) => {
      try {
        if (v) localStorage.setItem("budget.welcomeSeen.v1", "1");
        else localStorage.removeItem("budget.welcomeSeen.v1");
      } catch { }
      set({ welcomeSeen: v });
      saveState(get());
    },

    budgetOnboardingSeen: (() => {
      try { return localStorage.getItem("budget.budgetOnboardingSeen.v1") === "1"; }
      catch { return false; }
    })(),
    setBudgetOnboardingSeen: (v) => {
      try {
        if (v) localStorage.setItem("budget.budgetOnboardingSeen.v1", "1");
        else localStorage.removeItem("budget.budgetOnboardingSeen.v1");
      } catch { }
      set({ budgetOnboardingSeen: v });
      saveState(get());
    },

    savingsGoalOnboardingSeen: (() => {
      try { return localStorage.getItem("budget.savingsGoalOnboardingSeen.v1") === "1"; }
      catch { return false; }
    })(),
    setSavingsGoalOnboardingSeen: (v) => {
      try {
        if (v) localStorage.setItem("budget.savingsGoalOnboardingSeen.v1", "1");
        else localStorage.removeItem("budget.savingsGoalOnboardingSeen.v1");
      } catch { }
      set({ savingsGoalOnboardingSeen: v });
      saveState(get());
    },

    // UI month
    selectedMonth: currentMonthKey(),
    setSelectedMonth: (monthKey) => set({ selectedMonth: monthKey }),

    // Auth state
    user: {
      email: null,
      name: null,
      avatarUrl: null,
    },
    setUser: (user) => set({ user }),

    // ---------- CRUD ----------
    addTransaction: (input) => {
      const nameInput = input.name.trim();
      const categoryRaw = input.category.trim();
      const category = categoryRaw.length ? categoryRaw : "Sin categoría";

      if (!Number.isFinite(input.amount) || input.amount <= 0) return;

      // If name is empty, use category name as fallback
      let name = nameInput;
      if (!name) {
        // Find category definition to get translated name
        const categoryDef = get().categoryDefinitions.find(c => c.id === category);
        name = categoryDef?.name || category;
      }

      const tx: Transaction = {
        id: crypto.randomUUID(),
        type: input.type,
        name,
        category,
        amount: Math.round(input.amount),
        date: input.date,
        notes: input.notes,
        isRecurring: input.isRecurring,
        schedule: input.schedule,
        status: input.status,
        sourceTemplateId: input.sourceTemplateId,
        createdAt: Date.now(),
      };

      set((state) => {
        const next: BudgetState = {
          schemaVersion: 8,
          transactions: [tx, ...state.transactions],
          categories: uniqSorted([...state.categories, category]),
          categoryDefinitions: state.categoryDefinitions,
          categoryGroups: state.categoryGroups,
          budgets: state.budgets,
          trips: state.trips,
          tripExpenses: state.tripExpenses,
        };

        // cache local (guest o cloud cache)
        saveState(next);
        return next;
      });
    },

    updateTransaction: (id, patch) => {
      set((state) => {
        const nextTransactions = state.transactions.map((t) => {
          if (t.id !== id) return t;

          const merged = { ...t, ...patch };

          const name = (merged.name ?? "").trim();
          const categoryRaw = (merged.category ?? "").trim();
          const category = categoryRaw.length ? categoryRaw : "Sin categoría";

          const amountNum = Number(merged.amount);
          const amount = Number.isFinite(amountNum) ? Math.round(amountNum) : t.amount;

          const date = (merged.date ?? t.date) as string;
          const type = (merged.type ?? t.type) as TransactionType;

          return {
            ...t,
            ...merged,
            name,
            category,
            amount,
            date,
            type,
            // Preserve sourceTemplateId for scheduled transaction deduplication
            sourceTemplateId: merged.sourceTemplateId ?? t.sourceTemplateId,
          };
        });

        const updatedTx = nextTransactions.find((x) => x.id === id);

        const nextCategories = updatedTx
          ? uniqSorted([...state.categories, updatedTx.category])
          : state.categories;

        const next: BudgetState = {
          schemaVersion: 8,
          transactions: nextTransactions,
          categories: nextCategories,
          categoryDefinitions: state.categoryDefinitions,
          categoryGroups: state.categoryGroups,
          budgets: state.budgets,
          trips: state.trips,
          tripExpenses: state.tripExpenses,
        };

        saveState(next);
        return next;
      });
    },

    deleteTransaction: (id) => {
      set((state) => {
        const next: BudgetState = {
          schemaVersion: 8,
          transactions: state.transactions.filter((t) => t.id !== id),
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
          categoryGroups: state.categoryGroups,
          budgets: state.budgets,
          trips: state.trips,
          tripExpenses: state.tripExpenses,
        };

        saveState(next);
        return next;
      });
    },

    // ---------- CRUD TRIPS ----------
    addTrip: (input) => {
      const name = input.name.trim();
      const destination = input.destination.trim();

      if (!name) return;
      if (!Number.isFinite(input.budget) || input.budget < 0) return;

      const trip: Trip = {
        id: crypto.randomUUID(),
        name,
        destination,
        budget: Math.round(input.budget),
        startDate: input.startDate,
        endDate: input.endDate,
        status: input.status,
        createdAt: Date.now(),
      };

      set((state) => {
        const next: BudgetState = {
          schemaVersion: 8,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
          categoryGroups: state.categoryGroups,
          budgets: state.budgets,
          trips: [trip, ...state.trips],
          tripExpenses: state.tripExpenses,
        };

        saveState(next);
        return next;
      });
    },

    updateTrip: (id, patch) => {
      set((state) => {
        const nextTrips = state.trips.map((t) => {
          if (t.id !== id) return t;
          return { ...t, ...patch };
        });

        const next: BudgetState = {
          schemaVersion: 8,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
          categoryGroups: state.categoryGroups,
          budgets: state.budgets,
          trips: nextTrips,
          tripExpenses: state.tripExpenses,
        };

        saveState(next);
        return next;
      });
    },

    deleteTrip: (id) => {
      set((state) => {
        const next: BudgetState = {
          schemaVersion: 8,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
          categoryGroups: state.categoryGroups,
          budgets: state.budgets,
          trips: state.trips.filter((t) => t.id !== id),
          // También eliminar los gastos asociados al viaje
          tripExpenses: state.tripExpenses.filter((e) => e.tripId !== id),
        };

        saveState(next);
        return next;
      });
    },

    // ---------- CRUD TRIP EXPENSES ----------
    addTripExpense: (input) => {
      const name = input.name.trim();

      if (!name) return;
      if (!Number.isFinite(input.amount) || input.amount <= 0) return;

      const expense: TripExpense = {
        id: crypto.randomUUID(),
        tripId: input.tripId,
        category: input.category,
        name,
        amount: Math.round(input.amount),
        date: input.date,
        notes: input.notes?.trim() || undefined,
        createdAt: Date.now(),
      };

      set((state) => {
        const next: BudgetState = {
          schemaVersion: 8,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
          categoryGroups: state.categoryGroups,
          budgets: state.budgets,
          trips: state.trips,
          tripExpenses: [expense, ...state.tripExpenses],
        };

        saveState(next);
        return next;
      });
    },

    updateTripExpense: (id, patch) => {
      set((state) => {
        const nextExpenses = state.tripExpenses.map((e) => {
          if (e.id !== id) return e;
          return { ...e, ...patch };
        });

        const next: BudgetState = {
          schemaVersion: 8,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
          categoryGroups: state.categoryGroups,
          budgets: state.budgets,
          trips: state.trips,
          tripExpenses: nextExpenses,
        };

        saveState(next);
        return next;
      });
    },

    deleteTripExpense: (id) => {
      set((state) => {
        const next: BudgetState = {
          schemaVersion: 8,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
          categoryGroups: state.categoryGroups,
          budgets: state.budgets,
          trips: state.trips,
          tripExpenses: state.tripExpenses.filter((e) => e.id !== id),
        };

        saveState(next);
        return next;
      });
    },

    // ---------- CRUD CATEGORIES ----------
    addCategory: (input) => {
      const name = input.name.trim();
      if (!name) return "";

      const newCategory: Category = {
        id: crypto.randomUUID(),
        name,
        icon: input.icon,
        color: input.color,
        type: input.type,
        groupId: input.groupId,
        isDefault: false,
        createdAt: Date.now(),
      };

      set((state) => {
        const next: BudgetState = {
          schemaVersion: 8,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: [...state.categoryDefinitions, newCategory],
          categoryGroups: state.categoryGroups,
          budgets: state.budgets,
          trips: state.trips,
          tripExpenses: state.tripExpenses,
        };

        saveState(next);
        return next;
      });

      return newCategory.id;
    },

    updateCategory: (id, patch) => {
      set((state) => {
        const nextCategoryDefinitions = state.categoryDefinitions.map((c) => {
          if (c.id !== id) return c;
          return { ...c, ...patch };
        });

        const next: BudgetState = {
          schemaVersion: 8,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: nextCategoryDefinitions,
          categoryGroups: state.categoryGroups,
          budgets: state.budgets,
          trips: state.trips,
          tripExpenses: state.tripExpenses,
        };

        saveState(next);
        return next;
      });
    },

    deleteCategory: (id) => {
      set((state) => {
        const next: BudgetState = {
          schemaVersion: 8,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions.filter((c) => c.id !== id),
          categoryGroups: state.categoryGroups,
          budgets: state.budgets,
          trips: state.trips,
          tripExpenses: state.tripExpenses,
        };

        saveState(next);
        return next;
      });
    },

    getCategoryById: (id) => {
      return get().categoryDefinitions.find((c) => c.id === id);
    },

    // ---------- CRUD CATEGORY GROUPS ----------
    addCategoryGroup: (input) => {
      const name = input.name.trim();
      if (!name) return "";

      const newGroup: CategoryGroup = {
        id: crypto.randomUUID(),
        name,
        type: input.type,
        color: input.color,
        isDefault: false,
        createdAt: Date.now(),
      };

      set((state) => {
        const next: BudgetState = {
          schemaVersion: 8,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
          categoryGroups: [...state.categoryGroups, newGroup],
          budgets: state.budgets,
          trips: state.trips,
          tripExpenses: state.tripExpenses,
        };

        saveState(next);
        return next;
      });

      return newGroup.id;
    },

    updateCategoryGroup: (id, patch) => {
      set((state) => {
        const nextCategoryGroups = state.categoryGroups.map((g) => {
          if (g.id !== id) return g;
          return { ...g, ...patch };
        });

        const next: BudgetState = {
          schemaVersion: 8,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
          categoryGroups: nextCategoryGroups,
          budgets: state.budgets,
          trips: state.trips,
          tripExpenses: state.tripExpenses,
        };

        saveState(next);
        return next;
      });
    },

    deleteCategoryGroup: (id) => {
      set((state) => {
        // Find which fallback group to use based on the group being deleted
        const groupToDelete = state.categoryGroups.find((g) => g.id === id);
        const fallbackGroupId = groupToDelete?.type === "income"
          ? OTHER_INCOME_GROUP_ID
          : MISCELLANEOUS_GROUP_ID;

        // Reassign categories from deleted group to fallback group
        const nextCategoryDefinitions = state.categoryDefinitions.map((c) => {
          if (c.groupId === id) {
            return { ...c, groupId: fallbackGroupId };
          }
          return c;
        });

        const next: BudgetState = {
          schemaVersion: 8,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: nextCategoryDefinitions,
          categoryGroups: state.categoryGroups.filter((g) => g.id !== id),
          budgets: state.budgets,
          trips: state.trips,
          tripExpenses: state.tripExpenses,
        };

        saveState(next);
        return next;
      });
    },

    getCategoryGroupById: (id) => {
      return get().categoryGroups.find((g) => g.id === id);
    },

    // ---------- CRUD BUDGETS ----------
    createBudget: (input) => {
      // Validate amount
      if (!Number.isFinite(input.amount) || input.amount <= 0) return null;

      const state = get();

      // Check for overlaps
      const hasOverlap = validateBudgetOverlap(
        {
          categoryId: input.categoryId,
          amount: Math.round(input.amount),
          type: input.type,
          period: input.period,
          accountId: input.accountId,
          isRecurring: input.isRecurring,
          status: "active",
        },
        state.budgets
      );

      if (hasOverlap) {
        console.warn("[Budget Store] Cannot create budget: overlaps with existing budget");
        return null;
      }

      const newBudget: Budget = {
        id: crypto.randomUUID(),
        categoryId: input.categoryId,
        amount: Math.round(input.amount),
        type: input.type,
        period: input.period,
        accountId: input.accountId,
        isRecurring: input.isRecurring,
        status: "active",
        createdAt: Date.now(),
      };

      set((state) => {
        const next: BudgetState = {
          schemaVersion: 8,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
          categoryGroups: state.categoryGroups,
          budgets: [...state.budgets, newBudget],
          trips: state.trips,
          tripExpenses: state.tripExpenses,
          welcomeSeen: state.welcomeSeen,
          budgetOnboardingSeen: state.budgetOnboardingSeen,
          lastSchedulerRun: state.lastSchedulerRun,
        };

        saveState(next);
        return next;
      });

      return newBudget.id;
    },

    updateBudget: (id, patch) => {
      set((state) => {
        const budgetToUpdate = state.budgets.find((b) => b.id === id);
        if (!budgetToUpdate) return state;

        // If updating period or categoryId, validate overlaps
        if (patch.period || patch.categoryId) {
          const updatedBudget = { ...budgetToUpdate, ...patch };
          const hasOverlap = validateBudgetOverlap(
            {
              categoryId: updatedBudget.categoryId,
              amount: updatedBudget.amount,
              type: updatedBudget.type,
              period: updatedBudget.period,
              accountId: updatedBudget.accountId,
              isRecurring: updatedBudget.isRecurring,
              status: updatedBudget.status,
            },
            state.budgets,
            id // Exclude current budget from overlap check
          );

          if (hasOverlap) {
            console.warn("[Budget Store] Cannot update budget: would overlap with existing budget");
            return state;
          }
        }

        const nextBudgets = state.budgets.map((b) => {
          if (b.id !== id) return b;
          return { ...b, ...patch };
        });

        const next: BudgetState = {
          schemaVersion: 8,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
          categoryGroups: state.categoryGroups,
          budgets: nextBudgets,
          trips: state.trips,
          tripExpenses: state.tripExpenses,
          welcomeSeen: state.welcomeSeen,
          budgetOnboardingSeen: state.budgetOnboardingSeen,
          lastSchedulerRun: state.lastSchedulerRun,
        };

        saveState(next);
        return next;
      });
    },

    deleteBudget: (id) => {
      set((state) => {
        const next: BudgetState = {
          schemaVersion: 8,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
          categoryGroups: state.categoryGroups,
          budgets: state.budgets.filter((b) => b.id !== id),
          trips: state.trips,
          tripExpenses: state.tripExpenses,
        };

        saveState(next);
        return next;
      });
    },

    archiveBudget: (id) => {
      set((state) => {
        const nextBudgets = state.budgets.map((b) => {
          if (b.id !== id) return b;
          return { ...b, status: "archived" as BudgetStatus };
        });

        const next: BudgetState = {
          schemaVersion: 8,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
          categoryGroups: state.categoryGroups,
          budgets: nextBudgets,
          trips: state.trips,
          tripExpenses: state.tripExpenses,
          welcomeSeen: state.welcomeSeen,
          budgetOnboardingSeen: state.budgetOnboardingSeen,
          lastSchedulerRun: state.lastSchedulerRun,
        };

        saveState(next);
        return next;
      });
    },

    getBudgetById: (id) => {
      return get().budgets.find((b) => b.id === id);
    },

    renewExpiredBudgets: () => {
      const state = get();
      const today = todayISO();

      const budgetsToRenew = getBudgetsToRenew(state.budgets, today);

      if (budgetsToRenew.length === 0) return;

      console.log(`[Budget Store] Renewing ${budgetsToRenew.length} expired budgets`);

      set((state) => {
        let nextBudgets = [...state.budgets];

        budgetsToRenew.forEach((oldBudget) => {
          // Mark old budget as completed
          nextBudgets = nextBudgets.map((b) => {
            if (b.id === oldBudget.id) {
              return { ...b, status: "completed" as BudgetStatus };
            }
            return b;
          });

          // Create new budget for next period
          const newBudget = renewRecurringBudget(oldBudget);
          nextBudgets.push(newBudget);
        });

        const next: BudgetState = {
          schemaVersion: 8,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
          categoryGroups: state.categoryGroups,
          budgets: nextBudgets,
          trips: state.trips,
          tripExpenses: state.tripExpenses,
          welcomeSeen: state.welcomeSeen,
          budgetOnboardingSeen: state.budgetOnboardingSeen,
          lastSchedulerRun: state.lastSchedulerRun,
        };

        saveState(next);
        return next;
      });
    },

    // ---------- BUDGET PROGRESS & HEALTH CHECK ----------
    getBudgetProgress: (budgetId) => {
      const state = get();
      const budget = state.budgets.find((b) => b.id === budgetId);
      if (!budget) return null;

      const category = state.categoryDefinitions.find((c) => c.id === budget.categoryId);
      if (!category) return null;

      // Filter transactions for this category within budget period
      const transactions = state.transactions.filter((t) => {
        if (t.category !== budget.categoryId) return false;

        const txDate = new Date(t.date);
        const periodStart = new Date(budget.period.startDate);
        const periodEnd = new Date(budget.period.endDate);

        return txDate >= periodStart && txDate <= periodEnd && t.type === "expense";
      });

      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

      if (budget.type === "limit") {
        // Logic for spending limits
        const percentage = budget.amount > 0 ? (totalAmount / budget.amount) * 100 : 0;
        const remaining = budget.amount - totalAmount;

        return {
          budget,
          category,
          spent: totalAmount,
          saved: 0,
          percentage,
          remaining,
          isExceeded: totalAmount > budget.amount,
          isCompleted: false,
        };
      } else {
        // Logic for savings goals
        const percentage = budget.amount > 0 ? (totalAmount / budget.amount) * 100 : 0;
        const remaining = Math.max(budget.amount - totalAmount, 0);

        return {
          budget,
          category,
          spent: 0,
          saved: totalAmount,
          percentage,
          remaining,
          isExceeded: false,
          isCompleted: totalAmount >= budget.amount,
        };
      }
    },

    getBudgetHealthCheck: () => {
      const state = get();
      const activeBudgets = state.budgets.filter((b) => b.status === "active");

      const allProgress = activeBudgets
        .map((b) => get().getBudgetProgress(b.id))
        .filter((p): p is BudgetProgress => p !== null);

      const limits = allProgress.filter((p) => p.budget.type === "limit");
      const goals = allProgress.filter((p) => p.budget.type === "goal");

      const exceededLimits = limits.filter((p) => p.isExceeded).length;

      // Weighted average of completed goals
      const goalTotalAmount = goals.reduce((sum, g) => sum + g.budget.amount, 0);
      const goalSavedAmount = goals.reduce((sum, g) => sum + g.saved, 0);
      const goalPercentage = goalTotalAmount > 0 ? Math.round((goalSavedAmount / goalTotalAmount) * 100) : 0;

      return {
        exceededLimits,
        totalLimits: limits.length,
        goalPercentage,
        totalGoals: goals.length,
      };
    },

    // ---------- SYNC HELPERS ----------
    getSnapshot: () => {
      const s = get();
      return {
        schemaVersion: 8,
        transactions: s.transactions,
        categories: s.categories,
        categoryDefinitions: s.categoryDefinitions ?? [],
        categoryGroups: s.categoryGroups ?? [],
        budgets: s.budgets ?? [],
        trips: s.trips ?? [],
        tripExpenses: s.tripExpenses ?? [],
        welcomeSeen: s.welcomeSeen,
        budgetOnboardingSeen: s.budgetOnboardingSeen,
        savingsGoalOnboardingSeen: s.savingsGoalOnboardingSeen,
        lastSchedulerRun: s.lastSchedulerRun,
        excludedFromStats: s.excludedFromStats,
        security: s.security,
        // NOTE: subscription is NOT included in snapshot (managed by RevenueCat + Supabase)
      };
    },

    // ===== SCHEDULER =====
    setLastSchedulerRun: (date) => {
      set({ lastSchedulerRun: date });
      saveState(get());
    },

    setCloudSyncReady: () => {
      set({ cloudSyncReady: true });
      // No need to saveState - this is a runtime flag only
    },

    // Stats preferences
    excludedFromStats: hydrated.excludedFromStats ?? [],
    toggleCategoryFromStats: (categoryId) => {
      set((state) => {
        const current = state.excludedFromStats ?? [];
        const isExcluded = current.includes(categoryId);
        const next: BudgetState = {
          schemaVersion: 8,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
          categoryGroups: state.categoryGroups,
          budgets: state.budgets,
          trips: state.trips,
          tripExpenses: state.tripExpenses,
          welcomeSeen: state.welcomeSeen,
          budgetOnboardingSeen: state.budgetOnboardingSeen,
          lastSchedulerRun: state.lastSchedulerRun,
          cloudSyncReady: state.cloudSyncReady,
          excludedFromStats: isExcluded
            ? current.filter((id) => id !== categoryId)
            : [...current, categoryId],
          security: state.security,
        };
        saveState(next);
        return next;
      });
    },

    // Security
    toggleBiometricAuth: () => {
      set((state) => {
        const next: BudgetState = {
          ...state,
          schemaVersion: 8,
          security: {
            biometricEnabled: !(state.security?.biometricEnabled ?? false),
            lastAuthTimestamp: state.security?.lastAuthTimestamp,
          },
        };
        saveState(next);
        return next;
      });
    },

    updateLastAuthTimestamp: () => {
      set((state) => {
        const next: BudgetState = {
          ...state,
          schemaVersion: 8,
          security: {
            biometricEnabled: state.security?.biometricEnabled ?? false,
            lastAuthTimestamp: Date.now(),
          },
        };
        saveState(next);
        return next;
      });
    },

    getBiometricSettings: () => {
      const state = get();
      return state.security ?? { biometricEnabled: false };
    },

    replaceAllData: (data) => {
      // Migrate budgets from cloud data
      const migratedBudgets = migrateBudgets(data.budgets ?? []);

      // guarda como cache local (cloud cache) - subscription is NOT included (managed separately)
      const normalizedData = { ...data, schemaVersion: 8 as const, budgets: migratedBudgets };
      saveState(normalizedData);

      // Sync onboarding flags to localStorage
      if (data.welcomeSeen !== undefined) {
        try {
          if (data.welcomeSeen) localStorage.setItem("budget.welcomeSeen.v1", "1");
          else localStorage.removeItem("budget.welcomeSeen.v1");
        } catch { }
      }
      if (data.budgetOnboardingSeen !== undefined) {
        try {
          if (data.budgetOnboardingSeen) localStorage.setItem("budget.budgetOnboardingSeen.v1", "1");
          else localStorage.removeItem("budget.budgetOnboardingSeen.v1");
        } catch { }
      }
      if (data.savingsGoalOnboardingSeen !== undefined) {
        try {
          if (data.savingsGoalOnboardingSeen) localStorage.setItem("budget.savingsGoalOnboardingSeen.v1", "1");
          else localStorage.removeItem("budget.savingsGoalOnboardingSeen.v1");
        } catch { }
      }

      // set explícito (NO meter funciones del store dentro)
      set({
        schemaVersion: 8,
        transactions: data.transactions,
        categories: data.categories,
        categoryDefinitions: data.categoryDefinitions ?? [],
        categoryGroups: data.categoryGroups ?? [],
        budgets: migratedBudgets,
        trips: data.trips ?? [],
        tripExpenses: data.tripExpenses ?? [],
        welcomeSeen: data.welcomeSeen ?? false,
        budgetOnboardingSeen: data.budgetOnboardingSeen ?? false,
        savingsGoalOnboardingSeen: data.savingsGoalOnboardingSeen ?? false,
        lastSchedulerRun: data.lastSchedulerRun,
        excludedFromStats: data.excludedFromStats ?? [],
        security: data.security ?? { biometricEnabled: false },
        // NOTE: subscription is NOT set here (managed by RevenueCat + subscription.service.ts)
      });
    },

    // ===== SUBSCRIPTION =====
    setSubscription: (sub) => {
      console.log('[Store] setSubscription called (in-memory only):', sub);
      // NOTE: subscription is in-memory only, NOT persisted to localStorage/cloud
      // It's managed by RevenueCat SDK + subscription.service.ts fallback strategy
      set({ subscription: sub });
    },

    startTrial: () => {
      const now = new Date();
      const trialEnd = new Date(now.getTime() + TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000);

      const sub: SubscriptionState = {
        status: 'trialing',
        type: 'trial',
        trialEndsAt: trialEnd.toISOString(),
        expiresAt: trialEnd.toISOString(),
        lastChecked: now.toISOString(),
      };

      get().setSubscription(sub);
    },

    clearSubscription: () => {
      get().setSubscription(null);
    },

    syncWithRevenueCat: async () => {
      try {
        const {
          getCustomerInfo,
          hasProEntitlement,
          isInTrialPeriod,
          getTrialEndDate,
          getSubscriptionType,
        } = await import('@/services/revenuecat.service');

        const customerInfo = await getCustomerInfo();
        const isPro = hasProEntitlement(customerInfo);

        if (!isPro) {
          // User has no active subscription
          get().setSubscription(null);
          return;
        }

        // User has active Pro subscription
        const isTrialing = isInTrialPeriod(customerInfo);
        const trialEndDate = getTrialEndDate(customerInfo);
        const subType = getSubscriptionType(customerInfo);

        const sub: SubscriptionState = {
          status: isTrialing ? 'trialing' : 'active',
          type: subType,
          trialEndsAt: trialEndDate?.toISOString() ?? null,
          expiresAt: customerInfo.latestExpirationDate,
          lastChecked: new Date().toISOString(),
        };

        get().setSubscription(sub);
      } catch (error) {
        console.error('[Store] Failed to sync with RevenueCat:', error);
      }
    },
  };
});
