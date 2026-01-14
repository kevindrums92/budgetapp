import { create } from "zustand";
import type {
  BudgetState,
  Transaction,
  TransactionType,
  Trip,
  TripExpense,
  TripStatus,
  TripExpenseCategory,
  Category,
  CategoryGroupId,
} from "@/types/budget.types";
import { loadState, saveState } from "@/services/storage.service";
import { currentMonthKey } from "@/services/dates.service";
import { createDefaultCategories } from "@/constants/default-categories";

type CloudStatus = "idle" | "syncing" | "ok" | "offline" | "error";
type CloudMode = "guest" | "cloud";

type AddTxInput = {
  type: TransactionType;
  name: string;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
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
  groupId: CategoryGroupId;
};

type BudgetStore = BudgetState & {
  // UI
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (monthKey: string) => void;

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

  // Landing
  welcomeSeen: boolean;
  setWelcomeSeen: (v: boolean) => void;

  cloudMode: CloudMode;
  cloudStatus: CloudStatus;
  setCloudMode: (m: CloudMode) => void;
  setCloudStatus: (s: CloudStatus) => void;

  // Sync helpers
  getSnapshot: () => BudgetState;
  replaceAllData: (next: BudgetState) => void;
};

const defaultState: BudgetState = {
  schemaVersion: 2,
  transactions: [],
  categories: [],
  categoryDefinitions: createDefaultCategories(),
  trips: [],
  tripExpenses: [],
};

function uniqSorted(arr: string[]) {
  return Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es")
  );
}

export const useBudgetStore = create<BudgetStore>((set, get) => {
  const hydrated = loadState() ?? defaultState;

  return {
    // ---------- STATE ----------
    ...hydrated,

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
    },

    // UI month
    selectedMonth: currentMonthKey(),
    setSelectedMonth: (monthKey) => set({ selectedMonth: monthKey }),

    // ---------- CRUD ----------
    addTransaction: (input) => {
      const name = input.name.trim();
      const categoryRaw = input.category.trim();
      const category = categoryRaw.length ? categoryRaw : "Sin categoría";

      if (!name) return;
      if (!Number.isFinite(input.amount) || input.amount <= 0) return;

      const tx: Transaction = {
        id: crypto.randomUUID(),
        type: input.type,
        name,
        category,
        amount: Math.round(input.amount),
        date: input.date,
        createdAt: Date.now(),
      };

      set((state) => {
        const next: BudgetState = {
          schemaVersion: 2,
          transactions: [tx, ...state.transactions],
          categories: uniqSorted([...state.categories, category]),
          categoryDefinitions: state.categoryDefinitions,
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
          };
        });

        const updatedTx = nextTransactions.find((x) => x.id === id);

        const nextCategories = updatedTx
          ? uniqSorted([...state.categories, updatedTx.category])
          : state.categories;

        const next: BudgetState = {
          schemaVersion: 2,
          transactions: nextTransactions,
          categories: nextCategories,
          categoryDefinitions: state.categoryDefinitions,
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
          schemaVersion: 2,
          transactions: state.transactions.filter((t) => t.id !== id),
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
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
          schemaVersion: 2,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
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
          schemaVersion: 2,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
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
          schemaVersion: 2,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
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
          schemaVersion: 2,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
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
          schemaVersion: 2,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
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
          schemaVersion: 2,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions,
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
          schemaVersion: 2,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: [...state.categoryDefinitions, newCategory],
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
          schemaVersion: 2,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: nextCategoryDefinitions,
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
          schemaVersion: 2,
          transactions: state.transactions,
          categories: state.categories,
          categoryDefinitions: state.categoryDefinitions.filter((c) => c.id !== id),
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

    // ---------- SYNC HELPERS ----------
    getSnapshot: () => {
      const s = get();
      return {
        schemaVersion: 2,
        transactions: s.transactions,
        categories: s.categories,
        categoryDefinitions: s.categoryDefinitions ?? [],
        trips: s.trips ?? [],
        tripExpenses: s.tripExpenses ?? [],
      };
    },

    replaceAllData: (data) => {
      // guarda como cache local (cloud cache)
      saveState(data);

      // set explícito (NO meter funciones del store dentro)
      set({
        schemaVersion: 2,
        transactions: data.transactions,
        categories: data.categories,
        categoryDefinitions: data.categoryDefinitions ?? [],
        trips: data.trips ?? [],
        tripExpenses: data.tripExpenses ?? [],
      });
    },
  };
});
