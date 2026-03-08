import { currentMonthKey } from "@/services/dates.service";
import type { CarryOverEntry } from "@/types/budget.types";

const LAST_REVIEW_KEY = "budget.lastMonthReviewShown";

/**
 * Returns the previous month key (YYYY-MM) given a month key.
 */
export function getPreviousMonth(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 2, 1); // m-1 for 0-based, -1 for previous
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Determines if the Month Review modal should be shown.
 *
 * Conditions:
 * 1. Current month is different from the stored "last shown" month
 * 2. User hasn't already accepted or dismissed for this month
 * 3. The previous month has at least 1 transaction
 * 4. Previous month balance is not exactly 0
 */
export function shouldShowMonthReview(
  monthReviewDismissed: string[],
  carryOverBalances: Record<string, CarryOverEntry>,
  transactions: { date: string; type: string; amount: number }[],
): boolean {
  const currentMonth = currentMonthKey();

  // Already accepted carry-over for this month
  if (carryOverBalances[currentMonth]) return false;

  // Already dismissed for this month
  if (monthReviewDismissed.includes(currentMonth)) return false;

  // Already shown this app session
  try {
    const lastShown = localStorage.getItem(LAST_REVIEW_KEY);
    if (lastShown === currentMonth) return false;
  } catch { /* ignore */ }

  // Check previous month has transactions
  const prevMonth = getPreviousMonth(currentMonth);
  const prevMonthTxs = transactions.filter(tx => tx.date.slice(0, 7) === prevMonth);
  if (prevMonthTxs.length === 0) return false;

  // Check balance is not exactly 0
  const summary = calculatePreviousMonthBalance(transactions, prevMonth, 0);
  if (summary.balance === 0) return false;

  return true;
}

/**
 * Marks the month review as shown for this app session.
 */
export function markMonthReviewShown(): void {
  try {
    localStorage.setItem(LAST_REVIEW_KEY, currentMonthKey());
  } catch { /* ignore */ }
}

/**
 * Calculates income, expense, and balance for a given month.
 * Includes any carry-over the month itself received.
 */
export function calculatePreviousMonthBalance(
  transactions: { date: string; type: string; amount: number }[],
  monthKey: string,
  existingCarryOver: number = 0,
): { income: number; expense: number; balance: number } {
  let income = 0;
  let expense = 0;

  for (const t of transactions) {
    if (t.date.slice(0, 7) !== monthKey) continue;
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  }

  return {
    income,
    expense,
    balance: existingCarryOver + income - expense,
  };
}
