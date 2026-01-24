import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getCurrentWeek,
  getCurrentMonth,
  getCurrentQuarter,
  getCurrentYear,
  getNextPeriod,
  isDateInPeriod,
  isPeriodExpired,
  isPeriodActive,
  doPeriodsOverlap,
  getPeriodDurationDays,
  getCurrentPeriod,
} from "./period.utils";
import type { BudgetPeriod } from "@/types/budget.types";

describe("period.utils", () => {
  beforeEach(() => {
    // Mock date to 2026-01-24 (Friday)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-24T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getCurrentWeek", () => {
    it("should return current week (Monday to Sunday)", () => {
      // 2026-01-24 is Friday
      // Week should be Mon 2026-01-19 to Sun 2026-01-25
      const week = getCurrentWeek();

      expect(week.type).toBe("week");
      expect(week.startDate).toBe("2026-01-19"); // Monday
      expect(week.endDate).toBe("2026-01-25"); // Sunday
    });

    it("should handle Sunday correctly", () => {
      vi.setSystemTime(new Date("2026-01-25T12:00:00")); // Sunday

      const week = getCurrentWeek();

      expect(week.startDate).toBe("2026-01-19"); // Monday of that week
      expect(week.endDate).toBe("2026-01-25"); // Same Sunday
    });

    it("should handle Monday correctly", () => {
      vi.setSystemTime(new Date("2026-01-26T12:00:00")); // Monday

      const week = getCurrentWeek();

      expect(week.startDate).toBe("2026-01-26"); // Same Monday
      expect(week.endDate).toBe("2026-02-01"); // Following Sunday
    });
  });

  describe("getCurrentMonth", () => {
    it("should return current month", () => {
      const month = getCurrentMonth();

      expect(month.type).toBe("month");
      expect(month.startDate).toBe("2026-01-01");
      expect(month.endDate).toBe("2026-01-31");
    });

    it("should handle February correctly (non-leap year)", () => {
      vi.setSystemTime(new Date("2027-02-15T12:00:00"));

      const month = getCurrentMonth();

      expect(month.startDate).toBe("2027-02-01");
      expect(month.endDate).toBe("2027-02-28");
    });

    it("should handle February correctly (leap year)", () => {
      vi.setSystemTime(new Date("2028-02-15T12:00:00"));

      const month = getCurrentMonth();

      expect(month.startDate).toBe("2028-02-01");
      expect(month.endDate).toBe("2028-02-29");
    });
  });

  describe("getCurrentQuarter", () => {
    it("should return Q1 for January", () => {
      const quarter = getCurrentQuarter();

      expect(quarter.type).toBe("quarter");
      expect(quarter.startDate).toBe("2026-01-01");
      expect(quarter.endDate).toBe("2026-03-31");
    });

    it("should return Q2 for April", () => {
      vi.setSystemTime(new Date("2026-04-15T12:00:00"));

      const quarter = getCurrentQuarter();

      expect(quarter.startDate).toBe("2026-04-01");
      expect(quarter.endDate).toBe("2026-06-30");
    });

    it("should return Q3 for July", () => {
      vi.setSystemTime(new Date("2026-07-15T12:00:00"));

      const quarter = getCurrentQuarter();

      expect(quarter.startDate).toBe("2026-07-01");
      expect(quarter.endDate).toBe("2026-09-30");
    });

    it("should return Q4 for October", () => {
      vi.setSystemTime(new Date("2026-10-15T12:00:00"));

      const quarter = getCurrentQuarter();

      expect(quarter.startDate).toBe("2026-10-01");
      expect(quarter.endDate).toBe("2026-12-31");
    });
  });

  describe("getCurrentYear", () => {
    it("should return current year", () => {
      const year = getCurrentYear();

      expect(year.type).toBe("year");
      expect(year.startDate).toBe("2026-01-01");
      expect(year.endDate).toBe("2026-12-31");
    });
  });

  describe("getNextPeriod", () => {
    it("should get next week", () => {
      const currentWeek: BudgetPeriod = {
        type: "week",
        startDate: "2026-01-19",
        endDate: "2026-01-25",
      };

      const nextWeek = getNextPeriod(currentWeek);

      expect(nextWeek.type).toBe("week");
      expect(nextWeek.startDate).toBe("2026-01-26");
      expect(nextWeek.endDate).toBe("2026-02-01");
    });

    it("should get next month", () => {
      const currentMonth: BudgetPeriod = {
        type: "month",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      };

      const nextMonth = getNextPeriod(currentMonth);

      expect(nextMonth.type).toBe("month");
      expect(nextMonth.startDate).toBe("2026-02-01");
      expect(nextMonth.endDate).toBe("2026-02-28");
    });

    it("should get next quarter", () => {
      const currentQuarter: BudgetPeriod = {
        type: "quarter",
        startDate: "2026-01-01",
        endDate: "2026-03-31",
      };

      const nextQuarter = getNextPeriod(currentQuarter);

      expect(nextQuarter.type).toBe("quarter");
      expect(nextQuarter.startDate).toBe("2026-04-01");
      expect(nextQuarter.endDate).toBe("2026-06-30");
    });

    it("should get next year", () => {
      const currentYear: BudgetPeriod = {
        type: "year",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      };

      const nextYear = getNextPeriod(currentYear);

      expect(nextYear.type).toBe("year");
      expect(nextYear.startDate).toBe("2027-01-01");
      expect(nextYear.endDate).toBe("2027-12-31");
    });

    it("should get next custom period (same duration)", () => {
      const customPeriod: BudgetPeriod = {
        type: "custom",
        startDate: "2026-01-10",
        endDate: "2026-01-20", // 11 days
      };

      const nextPeriod = getNextPeriod(customPeriod);

      expect(nextPeriod.type).toBe("custom");
      expect(nextPeriod.startDate).toBe("2026-01-21");
      expect(nextPeriod.endDate).toBe("2026-01-31");
    });
  });

  describe("isDateInPeriod", () => {
    it("should return true for date within period", () => {
      const period: BudgetPeriod = {
        type: "month",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      };

      expect(isDateInPeriod("2026-01-15", period)).toBe(true);
      expect(isDateInPeriod("2026-01-01", period)).toBe(true);
      expect(isDateInPeriod("2026-01-31", period)).toBe(true);
    });

    it("should return false for date outside period", () => {
      const period: BudgetPeriod = {
        type: "month",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      };

      expect(isDateInPeriod("2025-12-31", period)).toBe(false);
      expect(isDateInPeriod("2026-02-01", period)).toBe(false);
    });
  });

  describe("isPeriodExpired", () => {
    it("should return true if period has expired", () => {
      const expiredPeriod: BudgetPeriod = {
        type: "month",
        startDate: "2025-12-01",
        endDate: "2025-12-31",
      };

      expect(isPeriodExpired(expiredPeriod, "2026-01-24")).toBe(true);
    });

    it("should return false if period has not expired", () => {
      const activePeriod: BudgetPeriod = {
        type: "month",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      };

      expect(isPeriodExpired(activePeriod, "2026-01-24")).toBe(false);
    });

    it("should return false if today is last day of period", () => {
      const period: BudgetPeriod = {
        type: "month",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      };

      expect(isPeriodExpired(period, "2026-01-31")).toBe(false);
    });
  });

  describe("isPeriodActive", () => {
    it("should return true if today is within period", () => {
      const period: BudgetPeriod = {
        type: "month",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      };

      expect(isPeriodActive(period, "2026-01-24")).toBe(true);
    });

    it("should return false if today is outside period", () => {
      const period: BudgetPeriod = {
        type: "month",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      };

      expect(isPeriodActive(period, "2026-02-01")).toBe(false);
    });
  });

  describe("doPeriodsOverlap", () => {
    it("should return true for overlapping periods", () => {
      const period1: BudgetPeriod = {
        type: "month",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      };

      const period2: BudgetPeriod = {
        type: "month",
        startDate: "2026-01-15",
        endDate: "2026-02-15",
      };

      expect(doPeriodsOverlap(period1, period2)).toBe(true);
      expect(doPeriodsOverlap(period2, period1)).toBe(true);
    });

    it("should return false for non-overlapping periods", () => {
      const period1: BudgetPeriod = {
        type: "month",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      };

      const period2: BudgetPeriod = {
        type: "month",
        startDate: "2026-02-01",
        endDate: "2026-02-28",
      };

      expect(doPeriodsOverlap(period1, period2)).toBe(false);
      expect(doPeriodsOverlap(period2, period1)).toBe(false);
    });

    it("should return true if one period contains the other", () => {
      const bigPeriod: BudgetPeriod = {
        type: "quarter",
        startDate: "2026-01-01",
        endDate: "2026-03-31",
      };

      const smallPeriod: BudgetPeriod = {
        type: "month",
        startDate: "2026-02-01",
        endDate: "2026-02-28",
      };

      expect(doPeriodsOverlap(bigPeriod, smallPeriod)).toBe(true);
      expect(doPeriodsOverlap(smallPeriod, bigPeriod)).toBe(true);
    });

    it("should return true if periods are identical", () => {
      const period1: BudgetPeriod = {
        type: "month",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      };

      const period2: BudgetPeriod = {
        type: "month",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      };

      expect(doPeriodsOverlap(period1, period2)).toBe(true);
    });

    it("should return true if periods touch at boundaries", () => {
      const period1: BudgetPeriod = {
        type: "month",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      };

      const period2: BudgetPeriod = {
        type: "month",
        startDate: "2026-01-31",
        endDate: "2026-02-28",
      };

      expect(doPeriodsOverlap(period1, period2)).toBe(true);
    });
  });

  describe("getPeriodDurationDays", () => {
    it("should calculate duration for week", () => {
      const week: BudgetPeriod = {
        type: "week",
        startDate: "2026-01-19",
        endDate: "2026-01-25",
      };

      expect(getPeriodDurationDays(week)).toBe(7);
    });

    it("should calculate duration for month", () => {
      const month: BudgetPeriod = {
        type: "month",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      };

      expect(getPeriodDurationDays(month)).toBe(31);
    });

    it("should calculate duration for custom period", () => {
      const custom: BudgetPeriod = {
        type: "custom",
        startDate: "2026-01-10",
        endDate: "2026-01-20",
      };

      expect(getPeriodDurationDays(custom)).toBe(11);
    });
  });

  describe("getCurrentPeriod", () => {
    it("should return current week", () => {
      const period = getCurrentPeriod("week");
      expect(period.type).toBe("week");
    });

    it("should return current month", () => {
      const period = getCurrentPeriod("month");
      expect(period.type).toBe("month");
    });

    it("should return current quarter", () => {
      const period = getCurrentPeriod("quarter");
      expect(period.type).toBe("quarter");
    });

    it("should return current year", () => {
      const period = getCurrentPeriod("year");
      expect(period.type).toBe("year");
    });

    it("should throw error for custom type", () => {
      expect(() => getCurrentPeriod("custom")).toThrow();
    });
  });
});
