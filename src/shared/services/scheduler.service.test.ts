/**
 * Tests for scheduler service
 */

import { describe, it, expect } from "vitest";
import {
  generateScheduledTransactions,
  calculateNextDate,
  calculateNextDates,
  updateLastGenerated,
  convertLegacyRecurringToSchedule,
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

    it("should handle Feb 31 -> Mar 31 when adding month to Jan 31", () => {
      const schedule: Schedule = {
        enabled: true,
        frequency: "monthly",
        interval: 1,
        startDate: "2025-01-31",
        dayOfMonth: 31,
      };

      // When adding 1 month to Jan 31, JavaScript goes to Mar 2/3, then we adjust to day 31
      // This results in Mar 31, which is the expected behavior
      const next = calculateNextDate(schedule, "2025-01-31");
      expect(next).toBe("2025-03-31");
    });

    it("should handle month overflow correctly", () => {
      const schedule: Schedule = {
        enabled: true,
        frequency: "monthly",
        interval: 1,
        startDate: "2024-01-31",
        dayOfMonth: 31,
      };

      // Adding month to Jan 31 should go to Mar 31 (Feb doesn't have 31 days)
      const next = calculateNextDate(schedule, "2024-01-31");
      expect(next).toBe("2024-03-31");
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

  describe("generateScheduledTransactions", () => {
    it("should generate transactions for active schedules", () => {
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

      const generated = generateScheduledTransactions(
        transactions,
        "2025-01-20",
        3
      );

      expect(generated.length).toBe(3);
      expect(generated[0].date).toBe("2025-02-15");
      expect(generated[1].date).toBe("2025-03-15");
      expect(generated[2].date).toBe("2025-04-15");
      expect(generated[0].name).toBe("Rent");
      expect(generated[0].status).toBe("planned");
    });

    it("should skip transactions that already exist", () => {
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

      const generated = generateScheduledTransactions(
        transactions,
        "2025-01-20",
        3
      );

      // Should skip Feb (already exists) and generate Mar, Apr
      expect(generated.length).toBe(2);
      expect(generated[0].date).toBe("2025-03-15");
      expect(generated[1].date).toBe("2025-04-15");
    });

    it("should use lastGenerated if available", () => {
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
            lastGenerated: "2025-02-15",
            dayOfMonth: 15,
          },
          createdAt: Date.now(),
        },
      ];

      const generated = generateScheduledTransactions(
        transactions,
        "2025-02-20",
        3
      );

      // Should start from lastGenerated (Feb 15), so next is Mar 15
      expect(generated.length).toBe(3);
      expect(generated[0].date).toBe("2025-03-15");
      expect(generated[1].date).toBe("2025-04-15");
      expect(generated[2].date).toBe("2025-05-15");
    });

    it("should not generate transactions before today", () => {
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

      const generated = generateScheduledTransactions(
        transactions,
        "2025-03-20",
        3
      );

      // Should skip Jan, Feb, Mar (all before or equal to today)
      expect(generated.length).toBe(3);
      expect(generated[0].date).toBe("2025-04-15");
      expect(generated[1].date).toBe("2025-05-15");
      expect(generated[2].date).toBe("2025-06-15");
    });

    it("should not generate transactions for disabled schedules", () => {
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

      const generated = generateScheduledTransactions(
        transactions,
        "2025-01-20",
        3
      );

      expect(generated.length).toBe(0);
    });

    it("should not generate transactions for ended schedules", () => {
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

      const generated = generateScheduledTransactions(
        transactions,
        "2025-02-01",
        3
      );

      expect(generated.length).toBe(0);
    });
  });

  describe("updateLastGenerated", () => {
    it("should update lastGenerated date", () => {
      const transaction: Transaction = {
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
      };

      const updated = updateLastGenerated(transaction, "2025-02-15");

      expect(updated.schedule?.lastGenerated).toBe("2025-02-15");
      expect(updated.schedule?.startDate).toBe("2025-01-15"); // Should not change
    });

    it("should return unchanged transaction if no schedule", () => {
      const transaction: Transaction = {
        id: "tx-1",
        type: "expense",
        name: "One-time",
        category: "misc",
        amount: 50000,
        date: "2025-01-15",
        createdAt: Date.now(),
      };

      const updated = updateLastGenerated(transaction, "2025-02-15");

      expect(updated).toEqual(transaction);
    });
  });
});
