/**
 * Scheduler service for virtual transaction generation
 * Uses lazy generation - calculates virtual transactions on-the-fly for display
 */

import type { Transaction, Schedule } from "@/types/budget.types";
import { nanoid } from "nanoid";

/**
 * Check if a schedule should be processed
 * Returns false if schedule has ended or is disabled
 */
function shouldProcessSchedule(schedule: Schedule, today: string): boolean {
  if (!schedule.enabled) return false;
  if (schedule.endDate && schedule.endDate < today) return false;
  return true;
}

/**
 * Check if a transaction already exists for a given date
 * Matches by name, category, amount, and date
 */
function transactionExistsForDate(
  transactions: Transaction[],
  template: Transaction,
  date: string
): boolean {
  return transactions.some(
    (tx) =>
      tx.name === template.name &&
      tx.category === template.category &&
      tx.amount === template.amount &&
      tx.date === date
  );
}

/**
 * Calculate next N dates based on schedule rules
 * Returns dates between startFrom and endDate
 *
 * @param schedule - Schedule configuration
 * @param startFrom - Start calculating from this date (YYYY-MM-DD)
 * @param endDate - Stop calculating after this date (YYYY-MM-DD)
 * @returns Array of dates (YYYY-MM-DD)
 */
export function calculateNextDates(
  schedule: Schedule,
  startFrom: string,
  endDate: string
): string[] {
  const dates: string[] = [];
  let current = calculateNextDate(schedule, startFrom);

  while (current && current <= endDate) {
    dates.push(current);
    current = calculateNextDate(schedule, current);
  }

  return dates;
}

/**
 * Calculate the next date based on schedule frequency
 * Returns null if schedule has ended
 *
 * @param schedule - Schedule configuration
 * @param from - Calculate from this date (YYYY-MM-DD)
 * @returns Next date (YYYY-MM-DD) or null
 */
export function calculateNextDate(
  schedule: Schedule,
  from: string
): string | null {
  const fromDate = new Date(from + "T12:00:00");
  let nextDate: Date;

  switch (schedule.frequency) {
    case "daily":
      nextDate = new Date(fromDate);
      nextDate.setDate(nextDate.getDate() + schedule.interval);
      break;

    case "weekly":
      nextDate = new Date(fromDate);
      nextDate.setDate(nextDate.getDate() + (7 * schedule.interval));

      // Adjust to dayOfWeek if specified
      if (schedule.dayOfWeek !== undefined) {
        const currentDayOfWeek = nextDate.getDay();
        const diff = schedule.dayOfWeek - currentDayOfWeek;
        nextDate.setDate(nextDate.getDate() + diff);
      }
      break;

    case "monthly":
      nextDate = new Date(fromDate);
      nextDate.setMonth(nextDate.getMonth() + schedule.interval);

      // Adjust to dayOfMonth if specified
      if (schedule.dayOfMonth !== undefined) {
        // Handle edge case: Feb 31 → Feb 28/29
        const daysInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
        const targetDay = Math.min(schedule.dayOfMonth, daysInMonth);
        nextDate.setDate(targetDay);
      }
      break;

    case "yearly":
      nextDate = new Date(fromDate);
      nextDate.setFullYear(nextDate.getFullYear() + schedule.interval);
      break;

    default:
      console.error(`[Scheduler] Unknown frequency: ${schedule.frequency}`);
      return null;
  }

  const nextDateStr = nextDate.toISOString().slice(0, 10);

  // Check if past endDate
  if (schedule.endDate && nextDateStr > schedule.endDate) {
    return null;
  }

  return nextDateStr;
}

/**
 * Convert legacy isRecurring to Schedule
 * Used for migration v4→v5
 *
 * @param transaction - Transaction with isRecurring=true
 * @returns Schedule configuration
 */
export function convertLegacyRecurringToSchedule(
  transaction: Transaction
): Schedule {
  const txDate = new Date(transaction.date + "T12:00:00");
  const dayOfMonth = txDate.getDate();

  return {
    enabled: true,
    frequency: "monthly",
    interval: 1,
    startDate: transaction.date,
    dayOfMonth,
    // No endDate - runs indefinitely
  };
}

// ============================================================================
// VIRTUAL TRANSACTIONS (Lazy Generation)
// ============================================================================

/**
 * Virtual transaction - exists only for display, not persisted
 * Has a special `isVirtual` flag and `templateId` to link back to the source
 */
export type VirtualTransaction = Transaction & {
  isVirtual: true;
  templateId: string;  // ID of the source transaction with schedule
};

/**
 * Generate virtual transactions for display purposes
 * Only generates the NEXT occurrence for each template (not multiple months ahead)
 * These are NOT saved to the database - they're calculated on-the-fly
 *
 * @param transactions - All real transactions from the store
 * @param today - Current date (YYYY-MM-DD)
 * @returns Array of virtual transactions for display (1 per template max)
 */
export function generateVirtualTransactions(
  transactions: Transaction[],
  today: string
): VirtualTransaction[] {
  const virtualTransactions: VirtualTransaction[] = [];

  // Find all template transactions (those with active schedules)
  const templates = transactions.filter(
    (tx) => tx.schedule?.enabled && shouldProcessSchedule(tx.schedule, today)
  );

  for (const template of templates) {
    if (!template.schedule) continue;

    // Find the NEXT occurrence after today
    const nextDate = findNextOccurrence(template.schedule, today, transactions, template);

    if (!nextDate) continue;

    // Create virtual transaction for the next occurrence only
    const virtualTx: VirtualTransaction = {
      ...template,
      id: `virtual-${template.id}-${nextDate}`,  // Deterministic ID
      date: nextDate,
      status: "planned",
      createdAt: Date.now(),
      isVirtual: true,
      templateId: template.id,
      // Remove schedule from virtual transactions - they don't have their own schedule
      schedule: undefined,
    };

    virtualTransactions.push(virtualTx);
  }

  return virtualTransactions;
}

/**
 * Find the next occurrence date for a schedule
 * Skips dates that already have real transactions
 *
 * @param schedule - Schedule configuration
 * @param today - Current date (YYYY-MM-DD)
 * @param transactions - All transactions to check for existing
 * @param template - Template transaction for matching
 * @returns Next date (YYYY-MM-DD) or null if none found within 1 year
 */
function findNextOccurrence(
  schedule: Schedule,
  today: string,
  transactions: Transaction[],
  template: Transaction
): string | null {
  // Calculate dates up to 1 year ahead to find the next valid one
  const endDate = new Date(today + "T12:00:00");
  endDate.setFullYear(endDate.getFullYear() + 1);
  const endDateStr = endDate.toISOString().slice(0, 10);

  const futureDates = calculateNextDates(schedule, schedule.startDate, endDateStr);

  for (const futureDate of futureDates) {
    // Skip dates in the past or today
    if (futureDate <= today) continue;

    // Skip if a real transaction already exists for this date
    if (transactionExistsForDate(transactions, template, futureDate)) {
      continue;
    }

    // Found the next valid occurrence
    return futureDate;
  }

  return null;
}

/**
 * Materialize a virtual transaction into a real one
 * Called when the user wants to "confirm" a scheduled transaction
 *
 * @param virtualTx - The virtual transaction to materialize
 * @returns A real transaction ready to be saved
 */
export function materializeTransaction(
  virtualTx: VirtualTransaction
): Transaction {
  const { isVirtual, templateId, ...realTx } = virtualTx;

  return {
    ...realTx,
    id: nanoid(),  // Generate a real ID
    status: "pending",  // Mark as pending until user confirms payment
    createdAt: Date.now(),
  };
}

/**
 * Check if a transaction is virtual
 */
export function isVirtualTransaction(tx: Transaction | VirtualTransaction): tx is VirtualTransaction {
  return "isVirtual" in tx && tx.isVirtual === true;
}

// ============================================================================
// AUTO-CONFIRMATION OF PAST DUE TRANSACTIONS
// ============================================================================

/**
 * Find all past-due occurrences that don't have real transactions
 * These are scheduled dates that have already passed without being confirmed
 *
 * @param schedule - Schedule configuration
 * @param today - Current date (YYYY-MM-DD)
 * @param transactions - All transactions to check for existing
 * @param template - Template transaction for matching
 * @returns Array of past-due dates (YYYY-MM-DD)
 */
function findPastDueOccurrences(
  schedule: Schedule,
  today: string,
  transactions: Transaction[],
  template: Transaction
): string[] {
  const pastDueDates: string[] = [];

  // Calculate all dates from startDate up to today
  const allDates = calculateNextDates(schedule, schedule.startDate, today);

  for (const date of allDates) {
    // Skip future dates (should not happen, but safety check)
    if (date > today) continue;

    // Skip if a real transaction already exists for this date
    if (transactionExistsForDate(transactions, template, date)) {
      continue;
    }

    // This date is past-due and has no transaction
    pastDueDates.push(date);
  }

  return pastDueDates;
}

/**
 * Generate real transactions for all past-due scheduled occurrences
 * These transactions are auto-confirmed because their date has already passed
 *
 * @param transactions - All real transactions from the store
 * @param today - Current date (YYYY-MM-DD)
 * @returns Array of real transactions ready to be saved
 */
export function generatePastDueTransactions(
  transactions: Transaction[],
  today: string
): Transaction[] {
  const pastDueTransactions: Transaction[] = [];

  // Find all template transactions (those with enabled schedules)
  // Note: We don't use shouldProcessSchedule here because we want to
  // generate past-due transactions even for schedules that have ended
  // (as long as the past-due dates are within the schedule's valid range)
  const templates = transactions.filter(
    (tx) => tx.schedule?.enabled
  );

  for (const template of templates) {
    if (!template.schedule) continue;

    // Find all past-due occurrences for this template
    const pastDueDates = findPastDueOccurrences(
      template.schedule,
      today,
      transactions,
      template
    );

    // Create real transactions for each past-due date
    for (const date of pastDueDates) {
      const realTx: Transaction = {
        ...template,
        id: nanoid(),
        date,
        status: "pending", // Mark as pending - user can confirm payment later
        createdAt: Date.now(),
        // Remove schedule from auto-generated transactions
        schedule: undefined,
      };

      pastDueTransactions.push(realTx);
    }
  }

  return pastDueTransactions;
}
