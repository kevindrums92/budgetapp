import { create } from "zustand";
import type { BudgetState, Transaction, TransactionType } from "@/types/budget.types";
import { loadState, saveState } from "@/services/storage.service";
import { currentMonthKey } from "@/services/dates.service";

type AddTxInput = {
  type: TransactionType;
  name: string;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
};

type BudgetStore = BudgetState & {
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (monthKey: string) => void;

  addTransaction: (input: AddTxInput) => void;

  updateTransaction: (
    id: string,
    patch: Partial<Omit<Transaction, "id" | "createdAt">>
  ) => void;

  deleteTransaction: (id: string) => void;
};

const defaultState: BudgetState = {
  schemaVersion: 1,
  transactions: [],
  categories: [],
};

function uniqSorted(arr: string[]) {
  return Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es")
  );
}

export const useBudgetStore = create<BudgetStore>((set) => {
  const hydrated = loadState() ?? defaultState;

  return {
    ...hydrated,

    selectedMonth: currentMonthKey(),
    setSelectedMonth: (monthKey) => set({ selectedMonth: monthKey }),

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
        amount: Math.round(input.amount), // si quieres decimales, quita el round
        date: input.date,
        createdAt: Date.now(),
      };

      set((state) => {
        const next: BudgetState = {
          schemaVersion: 1,
          transactions: [tx, ...state.transactions],
          categories: uniqSorted([...state.categories, category]),
        };
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
          schemaVersion: 1,
          transactions: nextTransactions,
          categories: nextCategories,
        };

        saveState(next);
        return next;
      });
    },

    deleteTransaction: (id) => {
      set((state) => {
        const next: BudgetState = {
          schemaVersion: 1,
          transactions: state.transactions.filter((t) => t.id !== id),
          categories: state.categories, // opcional: limpiar huérfanas luego
        };
        saveState(next);
        return next;
      });
    },
  };
});
