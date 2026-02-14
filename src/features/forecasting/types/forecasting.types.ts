export type BalanceProjection = {
  date: string; // YYYY-MM-DD
  balance: number; // Projected balance
  dayOffset: number; // Days from today (0, 30, 60, 90)
};

export type UpcomingBill = {
  name: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string; // Category ID
};

export type SafeToSpendBreakdown = {
  safeToSpend: number;
  currentBalance: number;
  upcomingBills: UpcomingBill[];
  upcomingBillsTotal: number;
  budgetReserves: number;
};

export type BudgetPrediction = {
  budgetId: string;
  categoryId: string;
  daysUntilExceeded: number; // 0 = exceeded, -1 = won't exceed, >0 = days until exceeded
  dailyBurnRate: number;
  projectedTotal: number;
  budgetLimit: number;
  currentSpent: number;
  urgency: "high" | "medium" | "low" | "safe";
};
