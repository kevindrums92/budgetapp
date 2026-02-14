import type { Transaction, Budget } from "@/types/budget.types";
import type {
  SafeToSpendBreakdown,
  UpcomingBill,
} from "../types/forecasting.types";
import { todayISO } from "@/services/dates.service";
import { generateVirtualTransactions } from "@/shared/services/scheduler.service";
import { calculateBudgetProgress } from "@/features/budget/services/budget.service";
import { isPeriodActive } from "@/features/budget/utils/period.utils";

/**
 * Calculate "Safe to Spend" amount (PocketGuard-style).
 *
 * Formula:
 *   Safe to Spend = Current Balance - Upcoming Bills - Budget Reserves
 *
 * Where:
 *   - Current Balance = income - expenses (selected month)
 *   - Upcoming Bills = scheduled expense transactions until end of month
 *   - Budget Reserves = sum of remaining amounts in active budgets
 */
export function calculateSafeToSpend(
  transactions: Transaction[],
  budgets: Budget[],
  selectedMonth: string
): SafeToSpendBreakdown {
  const today = todayISO();
  const currentMonthKey = today.slice(0, 7);
  const isCurrentMonth = selectedMonth === currentMonthKey;

  // 1. Current balance for selected month
  const monthTxs = transactions.filter(
    (tx) => tx.date.slice(0, 7) === selectedMonth
  );
  const income = monthTxs
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expense = monthTxs
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const currentBalance = income - expense;

  // Upcoming bills and budget reserves only apply to the current month.
  // For past/future months, safeToSpend = currentBalance.
  let upcomingBills: UpcomingBill[] = [];
  let upcomingBillsTotal = 0;
  let budgetReserves = 0;

  if (isCurrentMonth) {
    // 2. Calculate upcoming bills (scheduled expenses until end of month)
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const lastDay = new Date(year, month, 0).getDate();
    const endOfMonth = `${selectedMonth}-${String(lastDay).padStart(2, "0")}`;

    const virtualTxs = generateVirtualTransactions(transactions, today);
    upcomingBills = virtualTxs
      .filter(
        (vt) =>
          vt.date > today && vt.date <= endOfMonth && vt.type === "expense"
      )
      .map((vt) => ({
        name: vt.name,
        amount: vt.amount,
        date: vt.date,
        category: vt.category,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    upcomingBillsTotal = upcomingBills.reduce(
      (sum, bill) => sum + bill.amount,
      0
    );

    // 3. Budget reserves (remaining in active limit budgets for current period)
    const activeBudgets = budgets.filter(
      (b) => b.status === "active" && b.type === "limit" && isPeriodActive(b.period, today)
    );

    for (const budget of activeBudgets) {
      const progress = calculateBudgetProgress(budget, transactions);
      const remaining = Math.max(0, progress.remaining);
      budgetReserves += remaining;
    }
  }

  // Safe to Spend = Balance - Bills - Reserves
  const safeToSpend = currentBalance - upcomingBillsTotal - budgetReserves;

  return {
    safeToSpend: Math.round(safeToSpend),
    currentBalance: Math.round(currentBalance),
    upcomingBills,
    upcomingBillsTotal: Math.round(upcomingBillsTotal),
    budgetReserves: Math.round(budgetReserves),
  };
}
