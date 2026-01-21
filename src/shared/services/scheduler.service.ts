/**
 * Scheduler service for generating scheduled transactions
 * Handles automatic creation of recurring transactions based on schedules
 */

import type { Transaction, Schedule } from "@/types/budget.types";
import { logger } from "@/shared/utils/logger";
import { nanoid } from "nanoid";

/**
 * Generate scheduled transactions for the next N months
 * Creates transactions that don't exist yet based on schedule rules
 *
 * @param transactions - All existing transactions
 * @param today - Current date (YYYY-MM-DD)
 * @param monthsAhead - How many months to generate (default: 3)
 * @returns Array of new transactions to add
 */
export function generateScheduledTransactions(
  transactions: Transaction[],
  today: string,
  monthsAhead: number = 3
): Transaction[] {
  const todayDate = new Date(today + "T12:00:00");
  const endDate = new Date(todayDate);
  endDate.setMonth(endDate.getMonth() + monthsAhead);

  const newTransactions: Transaction[] = [];

  logger.debug(
    "Scheduler",
    `Total transactions: ${transactions.length}`,
    `Transactions with schedule field: ${transactions.filter(tx => tx.schedule).length}`,
    `Transactions with enabled schedule: ${transactions.filter(tx => tx.schedule?.enabled).length}`
  );

  // Find all transactions with active schedules
  const scheduledTransactions = transactions.filter(
    (tx) => tx.schedule?.enabled && shouldProcessSchedule(tx.schedule, today)
  );

  logger.debug(
    "Scheduler",
    `Found ${scheduledTransactions.length} active scheduled transactions`,
    scheduledTransactions.map(tx => ({ name: tx.name, schedule: tx.schedule }))
  );

  for (const tx of scheduledTransactions) {
    if (!tx.schedule) continue;

    // Calculate next dates from lastGenerated or startDate
    const startFrom = tx.schedule.lastGenerated || tx.schedule.startDate;
    const nextDates = calculateNextDates(tx.schedule, startFrom, endDate.toISOString().slice(0, 10));

    for (const nextDate of nextDates) {
      // Skip if already exists
      if (transactionExistsForDate(transactions, tx, nextDate)) {
        logger.debug("Scheduler", `Transaction "${tx.name}" already exists for ${nextDate}`);
        continue;
      }

      // Skip if before today
      if (nextDate < today) {
        continue;
      }

      // Create new transaction
      const newTx: Transaction = {
        ...tx,
        id: nanoid(),
        date: nextDate,
        status: "planned",
        createdAt: Date.now(),
      };

      newTransactions.push(newTx);
      logger.info("Scheduler", `Generated scheduled transaction "${newTx.name}" for ${nextDate}`);
    }
  }

  logger.info("Scheduler", `Generated ${newTransactions.length} new scheduled transactions`);
  return newTransactions;
}

/**
 * Update lastGenerated date for scheduled transactions
 * Call this after adding generated transactions to the store
 *
 * @param transaction - Transaction with schedule to update
 * @param lastDate - Last generated date (YYYY-MM-DD)
 * @returns Updated transaction
 */
export function updateLastGenerated(
  transaction: Transaction,
  lastDate: string
): Transaction {
  if (!transaction.schedule) return transaction;

  return {
    ...transaction,
    schedule: {
      ...transaction.schedule,
      lastGenerated: lastDate,
    },
  };
}

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
      logger.error("Scheduler", `Unknown frequency: ${schedule.frequency}`);
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
