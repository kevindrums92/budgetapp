/**
 * Tests for scheduler service
 */

import { describe, it, expect } from "vitest";
import {
  calculateNextDate,
  calculateNextDates,
  convertLegacyRecurringToSchedule,
  generateVirtualTransactions,
  generatePastDueTransactions,
  materializeTransaction,
  isVirtualTransaction,
} from "./scheduler.service";
import type { Transaction, Schedule } from "@/types/budget.types";

describe("scheduler.service", () => {
  describe("convertLegacyRecurringToSchedule", () => {
    it("should convert legacy isRecurring transaction to monthly schedule", () => {
      const transaction: Transaction = {
        id: "rec-1",
        type: "expense",
        name: "Rent",
        category: "housing",
        amount: 100000,
        date: "2025-01-15",
        isRecurring: true,
        createdAt: Date.now(),
      };

      const schedule = convertLegacyRecurringToSchedule(transaction);

      expect(schedule).toEqual({
        enabled: true,
        frequency: "monthly",
        interval: 1,
        startDate: "2025-01-15",
        dayOfMonth: 15,
      });
    });

    it("should preserve dayOfMonth from original transaction date", () => {
      const transaction: Transaction = {
        id: "rec-1",
        type: "income",
        name: "Salary",
        category: "salary",
        amount: 500000,
        date: "2025-02-03",
        isRecurring: true,
        createdAt: Date.now(),
      };

      const schedule = convertLegacyRecurringToSchedule(transaction);

      expect(schedule.dayOfMonth).toBe(3);
      expect(schedule.startDate).toBe("2025-02-03");
    });

    it("should handle end-of-month dates", () => {
      const transaction: Transaction = {
        id: "rec-1",
        type: "expense",
        name: "Monthly bill",
        category: "bills",
        amount: 50000,
        date: "2025-01-31",
        isRecurring: true,
        createdAt: Date.now(),
      };

      const schedule = convertLegacyRecurringToSchedule(transaction);

      expect(schedule.dayOfMonth).toBe(31);
    });
  });

  describe("calculateNextDate", () => {
    it("should calculate next daily date", () => {
      const schedule: Schedule = {
        enabled: true,
        frequency: "daily",
        interval: 1,
        startDate: "2025-01-15",
      };

      const next = calculateNextDate(schedule, "2025-01-15");
      expect(next).toBe("2025-01-16");
    });

    it("should calculate next weekly date", () => {
      const schedule: Schedule = {
        enabled: true,
        frequency: "weekly",
        interval: 1,
        startDate: "2025-01-15",
      };

      const next = calculateNextDate(schedule, "2025-01-15");
      expect(next).toBe("2025-01-22");
    });

    it("should calculate next monthly date", () => {
      const schedule: Schedule = {
        enabled: true,
        frequency: "monthly",
        interval: 1,
        startDate: "2025-01-15",
        dayOfMonth: 15,
      };

      const next = calculateNextDate(schedule, "2025-01-15");
      expect(next).toBe("2025-02-15");
    });

    it("should calculate next yearly date", () => {
      const schedule: Schedule = {
        enabled: true,
        frequency: "yearly",
        interval: 1,
        startDate: "2025-01-15",
      };

      const next = calculateNextDate(schedule, "2025-01-15");
      expect(next).toBe("2026-01-15");
    });

    it("should handle Jan 31 -> Feb 28/29 (last day of shorter month)", () => {
      const schedule: Schedule = {
        enabled: true,
        frequency: "monthly",
        interval: 1,
        startDate: "2025-01-31",
        dayOfMonth: 31,
      };

      // When day doesn't exist in target month, use last day of that month
      // Jan 31 + 1 month = Feb 28 (2025 is not a leap year)
      const next = calculateNextDate(schedule, "2025-01-31");
      expect(next).toBe("2025-02-28");
    });

    it("should handle Jan 31 -> Feb 29 in leap year", () => {
      const schedule: Schedule = {
        enabled: true,
        frequency: "monthly",
        interval: 1,
        startDate: "2024-01-31",
        dayOfMonth: 31,
      };

      // 2024 is a leap year, so Feb has 29 days
      const next = calculateNextDate(schedule, "2024-01-31");
      expect(next).toBe("2024-02-29");
    });

    it("should handle Feb 28 -> Mar 31 correctly", () => {
      const schedule: Schedule = {
        enabled: true,
        frequency: "monthly",
        interval: 1,
        startDate: "2025-02-28",
        dayOfMonth: 31,
      };

      // Feb 28 + 1 month with dayOfMonth=31 should give Mar 31
      const next = calculateNextDate(schedule, "2025-02-28");
      expect(next).toBe("2025-03-31");
    });

    it("should continue correctly after Feb to Mar", () => {
      const schedule: Schedule = {
        enabled: true,
        frequency: "monthly",
        interval: 1,
        startDate: "2024-01-31",
        dayOfMonth: 31,
      };

      // Jan 31 -> Feb 29 (leap year)
      const feb = calculateNextDate(schedule, "2024-01-31");
      expect(feb).toBe("2024-02-29");

      // Feb 29 -> Mar 31
      const mar = calculateNextDate(schedule, feb!);
      expect(mar).toBe("2024-03-31");
    });

    it("should handle shorter months correctly when dayOfMonth fits", () => {
      const schedule: Schedule = {
        enabled: true,
        frequency: "monthly",
        interval: 1,
        startDate: "2025-01-28",
        dayOfMonth: 28,
      };

      // Feb has 28 days in 2025, so this should work fine
      const next = calculateNextDate(schedule, "2025-01-28");
      expect(next).toBe("2025-02-28");
    });

    it("should respect endDate", () => {
      const schedule: Schedule = {
        enabled: true,
        frequency: "monthly",
        interval: 1,
        startDate: "2025-01-15",
        endDate: "2025-02-15",
        dayOfMonth: 15,
      };

      const next1 = calculateNextDate(schedule, "2025-01-15");
      expect(next1).toBe("2025-02-15");

      const next2 = calculateNextDate(schedule, "2025-02-15");
      expect(next2).toBeNull(); // Past endDate
    });

    it("should handle biweekly schedule", () => {
      const schedule: Schedule = {
        enabled: true,
        frequency: "weekly",
        interval: 2,
        startDate: "2025-01-15",
      };

      const next = calculateNextDate(schedule, "2025-01-15");
      expect(next).toBe("2025-01-29");
    });

    it("should handle quarterly schedule (every 3 months)", () => {
      const schedule: Schedule = {
        enabled: true,
        frequency: "monthly",
        interval: 3,
        startDate: "2025-01-15",
        dayOfMonth: 15,
      };

      const next = calculateNextDate(schedule, "2025-01-15");
      expect(next).toBe("2025-04-15");
    });
  });

  describe("calculateNextDates", () => {
    it("should generate multiple dates until endDate", () => {
      const schedule: Schedule = {
        enabled: true,
        frequency: "monthly",
        interval: 1,
        startDate: "2025-01-15",
        dayOfMonth: 15,
      };

      const dates = calculateNextDates(schedule, "2025-01-15", "2025-04-30");
      expect(dates).toEqual([
        "2025-02-15",
        "2025-03-15",
        "2025-04-15",
      ]);
    });

    it("should generate weekly dates", () => {
      const schedule: Schedule = {
        enabled: true,
        frequency: "weekly",
        interval: 1,
        startDate: "2025-01-15",
      };

      const dates = calculateNextDates(schedule, "2025-01-15", "2025-02-15");
      expect(dates).toEqual([
        "2025-01-22",
        "2025-01-29",
        "2025-02-05",
        "2025-02-12",
      ]);
    });

    it("should stop at schedule endDate", () => {
      const schedule: Schedule = {
        enabled: true,
        frequency: "monthly",
        interval: 1,
        startDate: "2025-01-15",
        endDate: "2025-03-15",
        dayOfMonth: 15,
      };

      const dates = calculateNextDates(schedule, "2025-01-15", "2025-12-31");
      expect(dates).toEqual([
        "2025-02-15",
        "2025-03-15",
      ]);
    });

    it("should return empty array if already past endDate", () => {
      const schedule: Schedule = {
        enabled: true,
        frequency: "monthly",
        interval: 1,
        startDate: "2025-01-15",
        endDate: "2025-02-15",
        dayOfMonth: 15,
      };

      const dates = calculateNextDates(schedule, "2025-03-01", "2025-12-31");
      expect(dates).toEqual([]);
    });
  });

  describe("generateVirtualTransactions", () => {
    it("should generate virtual transactions for active schedules", () => {
      const transactions: Transaction[] = [
        {
          id: "template-1",
          type: "expense",
          name: "Rent",
          category: "housing",
          amount: 100000,
          date: "2025-01-15",
          schedule: {
            enabled: true,
            frequency: "monthly",
            interval: 1,
            startDate: "2025-01-15",
            dayOfMonth: 15,
          },
          createdAt: Date.now(),
        },
      ];

      const virtuals = generateVirtualTransactions(transactions, "2025-01-20");

      expect(virtuals.length).toBe(1);
      expect(virtuals[0].date).toBe("2025-02-15");
      expect(virtuals[0].name).toBe("Rent");
      expect(virtuals[0].status).toBe("planned");
      expect(virtuals[0].isVirtual).toBe(true);
      expect(virtuals[0].templateId).toBe("template-1");
    });

    it("should skip dates that already have real transactions", () => {
      const transactions: Transaction[] = [
        {
          id: "template-1",
          type: "expense",
          name: "Rent",
          category: "housing",
          amount: 100000,
          date: "2025-01-15",
          schedule: {
            enabled: true,
            frequency: "monthly",
            interval: 1,
            startDate: "2025-01-15",
            dayOfMonth: 15,
          },
          createdAt: Date.now(),
        },
        {
          id: "existing-1",
          type: "expense",
          name: "Rent",
          category: "housing",
          amount: 100000,
          date: "2025-02-15",
          createdAt: Date.now(),
        },
      ];

      const virtuals = generateVirtualTransactions(transactions, "2025-01-20");

      // Should skip Feb (already exists) and show Mar
      expect(virtuals.length).toBe(1);
      expect(virtuals[0].date).toBe("2025-03-15");
    });

    it("should not generate for disabled schedules", () => {
      const transactions: Transaction[] = [
        {
          id: "template-1",
          type: "expense",
          name: "Rent",
          category: "housing",
          amount: 100000,
          date: "2025-01-15",
          schedule: {
            enabled: false,
            frequency: "monthly",
            interval: 1,
            startDate: "2025-01-15",
            dayOfMonth: 15,
          },
          createdAt: Date.now(),
        },
      ];

      const virtuals = generateVirtualTransactions(transactions, "2025-01-20");

      expect(virtuals.length).toBe(0);
    });

    it("should not generate for ended schedules", () => {
      const transactions: Transaction[] = [
        {
          id: "template-1",
          type: "expense",
          name: "Rent",
          category: "housing",
          amount: 100000,
          date: "2025-01-15",
          schedule: {
            enabled: true,
            frequency: "monthly",
            interval: 1,
            startDate: "2025-01-15",
            endDate: "2025-01-31",
            dayOfMonth: 15,
          },
          createdAt: Date.now(),
        },
      ];

      const virtuals = generateVirtualTransactions(transactions, "2025-02-01");

      expect(virtuals.length).toBe(0);
    });

    it("should generate only the next occurrence (not multiple)", () => {
      const transactions: Transaction[] = [
        {
          id: "template-1",
          type: "expense",
          name: "Rent",
          category: "housing",
          amount: 100000,
          date: "2025-01-15",
          schedule: {
            enabled: true,
            frequency: "monthly",
            interval: 1,
            startDate: "2025-01-15",
            dayOfMonth: 15,
          },
          createdAt: Date.now(),
        },
      ];

      const virtuals = generateVirtualTransactions(transactions, "2025-01-20");

      // Should only generate 1 virtual (the next occurrence)
      expect(virtuals.length).toBe(1);
      expect(virtuals[0].date).toBe("2025-02-15");
    });
  });

  describe("materializeTransaction", () => {
    it("should convert virtual to real transaction", () => {
      const virtual = {
        id: "virtual-template-1-2025-02-15",
        type: "expense" as const,
        name: "Rent",
        category: "housing",
        amount: 100000,
        date: "2025-02-15",
        status: "planned" as const,
        createdAt: Date.now(),
        isVirtual: true as const,
        templateId: "template-1",
      };

      const real = materializeTransaction(virtual);

      // Should not have virtual properties
      expect("isVirtual" in real).toBe(false);
      expect("templateId" in real).toBe(false);
      expect(real.status).toBe("pending");
      expect(real.name).toBe("Rent");
      expect(real.amount).toBe(100000);
      expect(real.date).toBe("2025-02-15");
      // ID should be a new nanoid, not the virtual ID
      expect(real.id).not.toBe(virtual.id);
      expect(real.id).not.toContain("virtual");
      // Should have sourceTemplateId linking back to the template
      expect(real.sourceTemplateId).toBe("template-1");
    });
  });

  describe("isVirtualTransaction", () => {
    it("should return true for virtual transactions", () => {
      const virtual = {
        id: "virtual-1",
        type: "expense" as const,
        name: "Test",
        category: "misc",
        amount: 1000,
        date: "2025-01-15",
        createdAt: Date.now(),
        isVirtual: true as const,
        templateId: "template-1",
      };

      expect(isVirtualTransaction(virtual)).toBe(true);
    });

    it("should return false for real transactions", () => {
      const real: Transaction = {
        id: "tx-1",
        type: "expense",
        name: "Test",
        category: "misc",
        amount: 1000,
        date: "2025-01-15",
        createdAt: Date.now(),
      };

      expect(isVirtualTransaction(real)).toBe(false);
    });

    it("should return false for transactions with isVirtual=false", () => {
      const tx = {
        id: "tx-1",
        type: "expense" as const,
        name: "Test",
        category: "misc",
        amount: 1000,
        date: "2025-01-15",
        createdAt: Date.now(),
        isVirtual: false,
      };

      expect(isVirtualTransaction(tx as Transaction)).toBe(false);
    });
  });

  // ==========================================================================
  // INTEGRATION TESTS: Full scheduled transaction flow
  // ==========================================================================
  describe("Integration: Scheduled Transaction Flow", () => {
    /**
     * Test the full lifecycle of a scheduled transaction:
     * 1. Create a template transaction with schedule
     * 2. Generate virtual transaction for next occurrence
     * 3. Materialize the virtual (simulating user confirmation)
     * 4. Verify next virtual is generated for the following occurrence
     * 5. Repeat for multiple iterations
     */
    it("should correctly iterate through monthly scheduled transactions", () => {
      // Start with a template transaction created on Jan 15
      const template: Transaction = {
        id: "template-rent",
        type: "expense",
        name: "Rent",
        category: "housing",
        amount: 1000000,
        date: "2025-01-15",
        schedule: {
          enabled: true,
          frequency: "monthly",
          interval: 1,
          startDate: "2025-01-15",
          dayOfMonth: 15,
        },
        createdAt: Date.now(),
      };

      const transactions: Transaction[] = [template];
      const today = "2025-01-20"; // After the first occurrence

      // ITERATION 1: Generate first virtual (should be Feb 15)
      let virtuals = generateVirtualTransactions(transactions, today);
      expect(virtuals.length).toBe(1);
      expect(virtuals[0].date).toBe("2025-02-15");
      expect(virtuals[0].name).toBe("Rent");
      expect(virtuals[0].isVirtual).toBe(true);
      expect(virtuals[0].templateId).toBe("template-rent");

      // User confirms the Feb 15 transaction
      const realFeb = materializeTransaction(virtuals[0]);
      expect(realFeb.date).toBe("2025-02-15");
      expect(realFeb.status).toBe("pending");
      expect("isVirtual" in realFeb).toBe(false);
      transactions.push(realFeb);

      // ITERATION 2: Generate next virtual (should be Mar 15, Feb already exists)
      virtuals = generateVirtualTransactions(transactions, today);
      expect(virtuals.length).toBe(1);
      expect(virtuals[0].date).toBe("2025-03-15");

      // User confirms the Mar 15 transaction
      const realMar = materializeTransaction(virtuals[0]);
      transactions.push(realMar);

      // ITERATION 3: Generate next virtual (should be Apr 15)
      virtuals = generateVirtualTransactions(transactions, today);
      expect(virtuals.length).toBe(1);
      expect(virtuals[0].date).toBe("2025-04-15");

      // Verify we now have 4 transactions: 1 template + 3 real (Jan, Feb, Mar... wait, Jan is the template)
      // Actually: 1 template (Jan 15) + 2 materialized (Feb 15, Mar 15) = 3 total
      expect(transactions.length).toBe(3);
    });

    it("should correctly iterate through weekly scheduled transactions", () => {
      const template: Transaction = {
        id: "template-gym",
        type: "expense",
        name: "Gym",
        category: "fitness",
        amount: 50000,
        date: "2025-01-06", // Monday
        schedule: {
          enabled: true,
          frequency: "weekly",
          interval: 1,
          startDate: "2025-01-06",
        },
        createdAt: Date.now(),
      };

      const transactions: Transaction[] = [template];
      const today = "2025-01-07"; // Tuesday after first gym day

      // ITERATION 1: Should get Jan 13 (next Monday)
      let virtuals = generateVirtualTransactions(transactions, today);
      expect(virtuals.length).toBe(1);
      expect(virtuals[0].date).toBe("2025-01-13");

      // Confirm it
      transactions.push(materializeTransaction(virtuals[0]));

      // ITERATION 2: Should get Jan 20
      virtuals = generateVirtualTransactions(transactions, today);
      expect(virtuals.length).toBe(1);
      expect(virtuals[0].date).toBe("2025-01-20");

      // Confirm it
      transactions.push(materializeTransaction(virtuals[0]));

      // ITERATION 3: Should get Jan 27
      virtuals = generateVirtualTransactions(transactions, today);
      expect(virtuals.length).toBe(1);
      expect(virtuals[0].date).toBe("2025-01-27");
    });

    it("should handle multiple templates generating virtuals simultaneously", () => {
      const templates: Transaction[] = [
        {
          id: "template-rent",
          type: "expense",
          name: "Rent",
          category: "housing",
          amount: 1000000,
          date: "2025-01-15",
          schedule: {
            enabled: true,
            frequency: "monthly",
            interval: 1,
            startDate: "2025-01-15",
            dayOfMonth: 15,
          },
          createdAt: Date.now(),
        },
        {
          id: "template-netflix",
          type: "expense",
          name: "Netflix",
          category: "subscriptions",
          amount: 60000,
          date: "2025-01-17",
          schedule: {
            enabled: true,
            frequency: "monthly",
            interval: 1,
            startDate: "2025-01-17",
            dayOfMonth: 17,
          },
          createdAt: Date.now(),
        },
        {
          id: "template-salary",
          type: "income",
          name: "Salary",
          category: "income",
          amount: 12000000,
          date: "2025-01-01",
          schedule: {
            enabled: true,
            frequency: "monthly",
            interval: 1,
            startDate: "2025-01-01",
            dayOfMonth: 1,
          },
          createdAt: Date.now(),
        },
      ];

      const transactions = [...templates];
      const today = "2025-01-20";

      // Should generate 3 virtuals: Feb 1, Feb 15, Feb 17
      let virtuals = generateVirtualTransactions(transactions, today);
      expect(virtuals.length).toBe(3);

      const dates = virtuals.map(v => v.date).sort();
      expect(dates).toEqual(["2025-02-01", "2025-02-15", "2025-02-17"]);

      // Confirm all 3
      virtuals.forEach(v => {
        transactions.push(materializeTransaction(v));
      });

      // Next iteration: should generate Mar 1, Mar 15, Mar 17
      virtuals = generateVirtualTransactions(transactions, today);
      expect(virtuals.length).toBe(3);

      const nextDates = virtuals.map(v => v.date).sort();
      expect(nextDates).toEqual(["2025-03-01", "2025-03-15", "2025-03-17"]);
    });

    it("should stop generating virtuals when schedule ends", () => {
      const template: Transaction = {
        id: "template-promo",
        type: "expense",
        name: "Promo Subscription",
        category: "subscriptions",
        amount: 10000,
        date: "2025-01-15",
        schedule: {
          enabled: true,
          frequency: "monthly",
          interval: 1,
          startDate: "2025-01-15",
          endDate: "2025-03-15", // Only valid for Feb and Mar
          dayOfMonth: 15,
        },
        createdAt: Date.now(),
      };

      const transactions: Transaction[] = [template];
      const today = "2025-01-20";

      // ITERATION 1: Feb 15 (within range)
      let virtuals = generateVirtualTransactions(transactions, today);
      expect(virtuals.length).toBe(1);
      expect(virtuals[0].date).toBe("2025-02-15");
      transactions.push(materializeTransaction(virtuals[0]));

      // ITERATION 2: Mar 15 (last valid date)
      virtuals = generateVirtualTransactions(transactions, today);
      expect(virtuals.length).toBe(1);
      expect(virtuals[0].date).toBe("2025-03-15");
      transactions.push(materializeTransaction(virtuals[0]));

      // ITERATION 3: No more virtuals (schedule ended)
      virtuals = generateVirtualTransactions(transactions, today);
      expect(virtuals.length).toBe(0);
    });

    it("should handle disabling a schedule mid-flow", () => {
      const template: Transaction = {
        id: "template-gym",
        type: "expense",
        name: "Gym",
        category: "fitness",
        amount: 110000,
        date: "2025-01-05",
        schedule: {
          enabled: true,
          frequency: "monthly",
          interval: 1,
          startDate: "2025-01-05",
          dayOfMonth: 5,
        },
        createdAt: Date.now(),
      };

      const transactions: Transaction[] = [template];
      const today = "2025-01-10";

      // Should generate Feb 5
      let virtuals = generateVirtualTransactions(transactions, today);
      expect(virtuals.length).toBe(1);
      expect(virtuals[0].date).toBe("2025-02-05");

      // User disables the schedule (cancels gym membership)
      transactions[0] = {
        ...transactions[0],
        schedule: { ...transactions[0].schedule!, enabled: false },
      };

      // No more virtuals should be generated
      virtuals = generateVirtualTransactions(transactions, today);
      expect(virtuals.length).toBe(0);
    });

    it("should filter virtuals by month correctly for display", () => {
      const template: Transaction = {
        id: "template-rent",
        type: "expense",
        name: "Rent",
        category: "housing",
        amount: 1000000,
        date: "2025-01-15",
        schedule: {
          enabled: true,
          frequency: "monthly",
          interval: 1,
          startDate: "2025-01-15",
          dayOfMonth: 15,
        },
        createdAt: Date.now(),
      };

      const transactions: Transaction[] = [template];
      const today = "2025-01-20";

      // Generate all virtuals
      const allVirtuals = generateVirtualTransactions(transactions, today);
      expect(allVirtuals.length).toBe(1);
      expect(allVirtuals[0].date).toBe("2025-02-15");

      // Filter for January (should be empty - the virtual is in Feb)
      const janVirtuals = allVirtuals.filter(v => v.date.slice(0, 7) === "2025-01");
      expect(janVirtuals.length).toBe(0);

      // Filter for February (should have 1)
      const febVirtuals = allVirtuals.filter(v => v.date.slice(0, 7) === "2025-02");
      expect(febVirtuals.length).toBe(1);

      // Filter for March (should be empty - we only generate 1 virtual at a time)
      const marVirtuals = allVirtuals.filter(v => v.date.slice(0, 7) === "2025-03");
      expect(marVirtuals.length).toBe(0);
    });
  });

  // ==========================================================================
  // AUTO-CONFIRMATION OF PAST DUE TRANSACTIONS
  // ==========================================================================
  describe("generatePastDueTransactions", () => {
    it("should generate real transactions for past-due dates", () => {
      const template: Transaction = {
        id: "template-rent",
        type: "expense",
        name: "Rent",
        category: "housing",
        amount: 1000000,
        date: "2025-01-15",
        schedule: {
          enabled: true,
          frequency: "monthly",
          interval: 1,
          startDate: "2025-01-15",
          dayOfMonth: 15,
        },
        createdAt: Date.now(),
      };

      const transactions: Transaction[] = [template];
      // Today is March 20, so Feb 15 and Mar 15 are past-due
      const today = "2025-03-20";

      const pastDue = generatePastDueTransactions(transactions, today);

      expect(pastDue.length).toBe(2);
      // Should have Feb 15 and Mar 15
      const dates = pastDue.map(tx => tx.date).sort();
      expect(dates).toEqual(["2025-02-15", "2025-03-15"]);

      // All should be real transactions (not virtual)
      pastDue.forEach(tx => {
        expect("isVirtual" in tx).toBe(false);
        expect(tx.status).toBe("pending");
        expect(tx.name).toBe("Rent");
        expect(tx.amount).toBe(1000000);
        // Should have unique IDs
        expect(tx.id).not.toContain("virtual");
        expect(tx.id).not.toBe(template.id);
        // Should have sourceTemplateId linking back to template
        expect(tx.sourceTemplateId).toBe(template.id);
      });
    });

    it("should not generate for dates that already have real transactions", () => {
      const template: Transaction = {
        id: "template-rent",
        type: "expense",
        name: "Rent",
        category: "housing",
        amount: 1000000,
        date: "2025-01-15",
        schedule: {
          enabled: true,
          frequency: "monthly",
          interval: 1,
          startDate: "2025-01-15",
          dayOfMonth: 15,
        },
        createdAt: Date.now(),
      };

      // Feb 15 already has a real transaction
      const existingFeb: Transaction = {
        id: "existing-feb",
        type: "expense",
        name: "Rent",
        category: "housing",
        amount: 1000000,
        date: "2025-02-15",
        createdAt: Date.now(),
      };

      const transactions: Transaction[] = [template, existingFeb];
      const today = "2025-03-20";

      const pastDue = generatePastDueTransactions(transactions, today);

      // Should only generate Mar 15 (Feb already exists)
      expect(pastDue.length).toBe(1);
      expect(pastDue[0].date).toBe("2025-03-15");
    });

    it("should not generate for disabled schedules", () => {
      const template: Transaction = {
        id: "template-rent",
        type: "expense",
        name: "Rent",
        category: "housing",
        amount: 1000000,
        date: "2025-01-15",
        schedule: {
          enabled: false,
          frequency: "monthly",
          interval: 1,
          startDate: "2025-01-15",
          dayOfMonth: 15,
        },
        createdAt: Date.now(),
      };

      const transactions: Transaction[] = [template];
      const today = "2025-03-20";

      const pastDue = generatePastDueTransactions(transactions, today);

      expect(pastDue.length).toBe(0);
    });

    it("should not generate for schedules that have ended", () => {
      const template: Transaction = {
        id: "template-rent",
        type: "expense",
        name: "Rent",
        category: "housing",
        amount: 1000000,
        date: "2025-01-15",
        schedule: {
          enabled: true,
          frequency: "monthly",
          interval: 1,
          startDate: "2025-01-15",
          endDate: "2025-01-31", // Ended in January
          dayOfMonth: 15,
        },
        createdAt: Date.now(),
      };

      const transactions: Transaction[] = [template];
      const today = "2025-03-20";

      const pastDue = generatePastDueTransactions(transactions, today);

      expect(pastDue.length).toBe(0);
    });

    it("should handle multiple templates with past-due dates", () => {
      const templates: Transaction[] = [
        {
          id: "template-rent",
          type: "expense",
          name: "Rent",
          category: "housing",
          amount: 1000000,
          date: "2025-01-15",
          schedule: {
            enabled: true,
            frequency: "monthly",
            interval: 1,
            startDate: "2025-01-15",
            dayOfMonth: 15,
          },
          createdAt: Date.now(),
        },
        {
          id: "template-netflix",
          type: "expense",
          name: "Netflix",
          category: "subscriptions",
          amount: 60000,
          date: "2025-01-17",
          schedule: {
            enabled: true,
            frequency: "monthly",
            interval: 1,
            startDate: "2025-01-17",
            dayOfMonth: 17,
          },
          createdAt: Date.now(),
        },
      ];

      const transactions = [...templates];
      // Today is March 20, so Feb and Mar are past-due for both templates
      const today = "2025-03-20";

      const pastDue = generatePastDueTransactions(transactions, today);

      // 2 templates × 2 months (Feb, Mar) = 4 transactions
      expect(pastDue.length).toBe(4);

      const dates = pastDue.map(tx => tx.date).sort();
      expect(dates).toEqual([
        "2025-02-15",
        "2025-02-17",
        "2025-03-15",
        "2025-03-17",
      ]);
    });

    it("should not generate for future dates", () => {
      const template: Transaction = {
        id: "template-rent",
        type: "expense",
        name: "Rent",
        category: "housing",
        amount: 1000000,
        date: "2025-01-15",
        schedule: {
          enabled: true,
          frequency: "monthly",
          interval: 1,
          startDate: "2025-01-15",
          dayOfMonth: 15,
        },
        createdAt: Date.now(),
      };

      const transactions: Transaction[] = [template];
      // Today is Jan 20, so only Jan 15 has passed (but it's the template)
      // Feb 15 is in the future
      const today = "2025-01-20";

      const pastDue = generatePastDueTransactions(transactions, today);

      // No past-due transactions (Jan 15 is the template, Feb 15 is future)
      expect(pastDue.length).toBe(0);
    });

    it("should handle weekly schedules with multiple past-due occurrences", () => {
      const template: Transaction = {
        id: "template-gym",
        type: "expense",
        name: "Gym",
        category: "fitness",
        amount: 50000,
        date: "2025-01-06", // Monday
        schedule: {
          enabled: true,
          frequency: "weekly",
          interval: 1,
          startDate: "2025-01-06",
        },
        createdAt: Date.now(),
      };

      const transactions: Transaction[] = [template];
      // Today is Jan 30, so Jan 13, Jan 20, Jan 27 are past-due
      const today = "2025-01-30";

      const pastDue = generatePastDueTransactions(transactions, today);

      expect(pastDue.length).toBe(3);
      const dates = pastDue.map(tx => tx.date).sort();
      expect(dates).toEqual([
        "2025-01-13",
        "2025-01-20",
        "2025-01-27",
      ]);
    });

    it("should respect endDate when generating past-due transactions", () => {
      const template: Transaction = {
        id: "template-promo",
        type: "expense",
        name: "Promo",
        category: "subscriptions",
        amount: 10000,
        date: "2025-01-15",
        schedule: {
          enabled: true,
          frequency: "monthly",
          interval: 1,
          startDate: "2025-01-15",
          endDate: "2025-02-28", // Only valid through Feb
          dayOfMonth: 15,
        },
        createdAt: Date.now(),
      };

      const transactions: Transaction[] = [template];
      // Today is April, but schedule ended in Feb
      const today = "2025-04-20";

      const pastDue = generatePastDueTransactions(transactions, today);

      // Only Feb 15 should be generated (Mar is after endDate)
      expect(pastDue.length).toBe(1);
      expect(pastDue[0].date).toBe("2025-02-15");
    });

    it("should not duplicate when user edits the amount of an auto-generated transaction", () => {
      const template: Transaction = {
        id: "template-rent",
        type: "expense",
        name: "Rent",
        category: "housing",
        amount: 1000000,
        date: "2025-01-15",
        schedule: {
          enabled: true,
          frequency: "monthly",
          interval: 1,
          startDate: "2025-01-15",
          dayOfMonth: 15,
        },
        createdAt: Date.now(),
      };

      // User edited the Feb transaction (changed amount from 1000000 to 1050000)
      // This should still be recognized as the Feb 15 occurrence via sourceTemplateId
      const editedFeb: Transaction = {
        id: "existing-feb",
        type: "expense",
        name: "Rent",
        category: "housing",
        amount: 1050000, // User edited the amount!
        date: "2025-02-15",
        sourceTemplateId: "template-rent", // Links back to template
        createdAt: Date.now(),
      };

      const transactions: Transaction[] = [template, editedFeb];
      const today = "2025-03-20";

      const pastDue = generatePastDueTransactions(transactions, today);

      // Should only generate Mar 15 (Feb exists via sourceTemplateId match)
      expect(pastDue.length).toBe(1);
      expect(pastDue[0].date).toBe("2025-03-15");
    });

    it("should not duplicate when user edits the name of an auto-generated transaction", () => {
      const template: Transaction = {
        id: "template-gym",
        type: "expense",
        name: "Gym Membership",
        category: "fitness",
        amount: 50000,
        date: "2025-01-10",
        schedule: {
          enabled: true,
          frequency: "monthly",
          interval: 1,
          startDate: "2025-01-10",
          dayOfMonth: 10,
        },
        createdAt: Date.now(),
      };

      // User edited the Feb transaction (changed name)
      const editedFeb: Transaction = {
        id: "existing-feb",
        type: "expense",
        name: "Gym - February special", // User edited the name!
        category: "fitness",
        amount: 50000,
        date: "2025-02-10",
        sourceTemplateId: "template-gym", // Links back to template
        createdAt: Date.now(),
      };

      const transactions: Transaction[] = [template, editedFeb];
      const today = "2025-03-15";

      const pastDue = generatePastDueTransactions(transactions, today);

      // Should only generate Mar 10 (Feb exists via sourceTemplateId match)
      expect(pastDue.length).toBe(1);
      expect(pastDue[0].date).toBe("2025-03-10");
    });

    it("should not duplicate when user edits the date of an auto-generated monthly transaction", () => {
      const template: Transaction = {
        id: "template-disney",
        type: "expense",
        name: "Disney plus",
        category: "subscriptions",
        amount: 50000,
        date: "2025-01-05",
        schedule: {
          enabled: true,
          frequency: "monthly",
          interval: 1,
          startDate: "2025-01-05",
          dayOfMonth: 5,
        },
        createdAt: Date.now(),
      };

      // User edited the auto-generated Feb 5 transaction to Feb 10
      const editedFeb: Transaction = {
        id: "existing-feb",
        type: "expense",
        name: "Disney plus",
        category: "subscriptions",
        amount: 50000,
        date: "2025-02-10", // User changed from Feb 5 → Feb 10
        sourceTemplateId: "template-disney",
        createdAt: Date.now(),
      };

      const transactions: Transaction[] = [template, editedFeb];
      const today = "2025-02-15";

      const pastDue = generatePastDueTransactions(transactions, today);

      // Should NOT generate another for Feb 5 — the edited Feb 10 tx covers Feb
      expect(pastDue.length).toBe(0);
    });

    it("should still generate next month after user edits date within same month", () => {
      const template: Transaction = {
        id: "template-disney",
        type: "expense",
        name: "Disney plus",
        category: "subscriptions",
        amount: 50000,
        date: "2025-01-05",
        schedule: {
          enabled: true,
          frequency: "monthly",
          interval: 1,
          startDate: "2025-01-05",
          dayOfMonth: 5,
        },
        createdAt: Date.now(),
      };

      // User edited Feb 5 → Feb 10
      const editedFeb: Transaction = {
        id: "existing-feb",
        type: "expense",
        name: "Disney plus",
        category: "subscriptions",
        amount: 50000,
        date: "2025-02-10",
        sourceTemplateId: "template-disney",
        createdAt: Date.now(),
      };

      const transactions: Transaction[] = [template, editedFeb];
      const today = "2025-03-10";

      const pastDue = generatePastDueTransactions(transactions, today);

      // Should generate Mar 5 (Feb is covered by edited tx, Mar is not)
      expect(pastDue.length).toBe(1);
      expect(pastDue[0].date).toBe("2025-03-05");
    });

    it("should not duplicate when user edits the date of an auto-generated yearly transaction", () => {
      const template: Transaction = {
        id: "template-apple-dev",
        type: "expense",
        name: "Apple Developer",
        category: "tech",
        amount: 360000,
        date: "2025-01-25",
        schedule: {
          enabled: true,
          frequency: "yearly",
          interval: 1,
          startDate: "2025-01-25",
        },
        createdAt: Date.now(),
      };

      // User edited the 2026 occurrence from Jan 25 to Feb 2
      const editedYearly: Transaction = {
        id: "existing-2026",
        type: "expense",
        name: "Apple Developer",
        category: "tech",
        amount: 360000,
        date: "2026-02-02", // User changed from Jan 25 → Feb 2
        sourceTemplateId: "template-apple-dev",
        createdAt: Date.now(),
      };

      const transactions: Transaction[] = [template, editedYearly];
      const today = "2026-03-01";

      const pastDue = generatePastDueTransactions(transactions, today);

      // Should NOT generate another for Jan 25 2026 — the edited tx covers 2026
      expect(pastDue.length).toBe(0);
    });
  });
});
