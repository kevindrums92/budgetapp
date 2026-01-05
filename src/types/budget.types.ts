export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TransactionType;
  name: string;
  category: string;
  amount: number;    // siempre positivo
  date: string;      // YYYY-MM-DD
  createdAt: number; // epoch ms
};

export type BudgetState = {
  schemaVersion: 1;
  transactions: Transaction[];
  categories: string[];
};
