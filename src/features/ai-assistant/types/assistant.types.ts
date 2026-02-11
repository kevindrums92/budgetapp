export type MessageRole = "user" | "assistant";

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isError?: boolean;
};

// Compact transaction for the AI snapshot
export type TransactionCompact = {
  date: string;
  name: string;
  category: string; // resolved category name
  amount: number;
  type: "income" | "expense";
};

export type CategoryCompact = {
  name: string;
  type: "income" | "expense";
  group: string;
};

export type BudgetSnapshot = {
  categoryName: string;
  type: "limit" | "goal";
  amount: number;
  spent: number;
  saved: number;
  percentage: number;
  remaining: number;
  isExceeded: boolean;
  isCompleted: boolean;
  status: "active" | "completed" | "archived";
  isRecurring: boolean;
  period: {
    type: "week" | "month" | "quarter" | "year" | "custom";
    startDate: string;
    endDate: string;
  };
};

export type TripSnapshot = {
  name: string;
  destination: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string | null;
  status: string;
  expenses: {
    name: string;
    amount: number;
    category: string;
    date: string;
  }[];
};

export type MonthSummary = {
  key: string;
  income: number;
  expenses: number;
  balance: number;
  transactionCount: number;
};

export type FinancialSnapshot = {
  transactions: TransactionCompact[];
  categories: CategoryCompact[];
  budgets: BudgetSnapshot[];
  trips: TripSnapshot[];
  summary: {
    totalTransactions: number;
    totalIncome: number;
    totalExpenses: number;
    firstTransactionDate: string | null;
    lastTransactionDate: string | null;
    monthlyBreakdown: MonthSummary[];
  };
  budgetHealthCheck: {
    exceededLimits: number;
    totalLimits: number;
    goalPercentage: number;
    totalGoals: number;
  };
  currency: string;
  locale: string;
};

export type AssistantRequest = {
  question: string;
  snapshot: FinancialSnapshot;
  conversationHistory?: { role: MessageRole; content: string }[];
  locale: string;
};

export type AssistantResponse = {
  success: boolean;
  answer?: string;
  error?: string;
  message?: string;
  resetAt?: number;
  plan?: string;
};
