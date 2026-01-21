/**
 * SchedulerJob - Background job that generates scheduled transactions
 * Runs once when app loads and checks if scheduled transactions need to be generated
 */

import { useEffect, useRef } from "react";
import { useBudgetStore } from "@/state/budget.store";
import { generateScheduledTransactions, updateLastGenerated } from "@/shared/services/scheduler.service";
import { logger } from "@/shared/utils/logger";

/**
 * Get today's date in YYYY-MM-DD format
 */
function todayISO(): string {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

export default function SchedulerJob() {
  const hasRun = useRef(false);

  const transactions = useBudgetStore((state) => state.transactions);
  const lastSchedulerRun = useBudgetStore((state) => state.lastSchedulerRun);
  const addTransaction = useBudgetStore((state) => state.addTransaction);
  const updateTransaction = useBudgetStore((state) => state.updateTransaction);
  const setLastSchedulerRun = useBudgetStore((state) => state.setLastSchedulerRun);

  useEffect(() => {
    // Only run once per app session
    if (hasRun.current) return;

    // Wait for transactions to load (CloudSync might still be loading)
    if (transactions.length === 0) {
      logger.debug("SchedulerJob", "Waiting for transactions to load...");
      return;
    }

    const today = todayISO();

    // Skip if already ran today
    if (lastSchedulerRun === today) {
      logger.info("SchedulerJob", `Scheduler already ran today (${today}), skipping`);
      hasRun.current = true;
      return;
    }

    logger.info("SchedulerJob", `Running scheduler for ${today}...`);

    try {
      // Generate scheduled transactions for next 3 months
      const newTransactions = generateScheduledTransactions(transactions, today, 3);

      if (newTransactions.length > 0) {
        logger.info("SchedulerJob", `Generated ${newTransactions.length} scheduled transactions`);

        // Add all new transactions to store
        newTransactions.forEach((tx) => {
          addTransaction(tx);
        });

        // Update lastGenerated for all scheduled template transactions
        const scheduledTemplates = transactions.filter(
          (tx) => tx.schedule?.enabled && !newTransactions.some((newTx) => newTx.id === tx.id)
        );

        scheduledTemplates.forEach((template) => {
          if (!template.schedule) return;

          // Find the latest generated date for this template
          const generatedDates = newTransactions
            .filter(
              (tx) =>
                tx.name === template.name &&
                tx.category === template.category &&
                tx.amount === template.amount
            )
            .map((tx) => tx.date)
            .sort()
            .reverse();

          if (generatedDates.length > 0) {
            const latestDate = generatedDates[0];
            const updated = updateLastGenerated(template, latestDate);
            updateTransaction(template.id, { schedule: updated.schedule });
            logger.debug("SchedulerJob", `Updated lastGenerated for "${template.name}" to ${latestDate}`);
          }
        });

        logger.info("SchedulerJob", "Scheduler job completed successfully");
      } else {
        logger.info("SchedulerJob", "No scheduled transactions to generate");
      }

      // Mark scheduler as run for today
      setLastSchedulerRun(today);
      hasRun.current = true;
    } catch (error) {
      logger.error("SchedulerJob", "Scheduler job failed:", error);
      hasRun.current = true;
    }
  }, [transactions, lastSchedulerRun, addTransaction, updateTransaction, setLastSchedulerRun]);

  // This is a background job, no UI
  return null;
}
