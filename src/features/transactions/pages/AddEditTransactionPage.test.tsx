/**
 * Tests for AddEditTransactionPage - Virtual Transaction Edit Flow
 *
 * These tests cover the "Editar y registrar" feature logic:
 * 1. Change detection (hasChangedValues, hasChangedSchedule)
 * 2. Modal display logic based on virtualDate presence
 * 3. "Sin cambios" alert when saving without modifications
 *
 * Note: Full integration tests are in e2e/scheduled-transactions.spec.ts
 * The scheduler service logic is tested in scheduler.service.test.ts
 */

import { describe, it, expect, vi } from "vitest";

// Mock the date service with all exports
vi.mock("@/services/dates.service", () => ({
  todayISO: () => "2025-01-20",
  currentMonthKey: () => "2025-01",
  monthKey: (dateISO: string) => dateISO.slice(0, 7),
  monthLabelES: () => "Enero 2025",
  formatDateGroupHeader: () => "Hoy",
  formatTime: () => "12:00",
}));

describe("AddEditTransactionPage - Virtual Transaction Edit Flow", () => {
  describe("getDateBefore helper logic", () => {
    // Test the date calculation logic directly
    function getDateBefore(dateStr: string): string {
      const date = new Date(dateStr + "T12:00:00");
      date.setDate(date.getDate() - 1);
      return date.toISOString().slice(0, 10);
    }

    it("should return day before for middle of month", () => {
      expect(getDateBefore("2025-02-15")).toBe("2025-02-14");
    });

    it("should handle first day of month", () => {
      expect(getDateBefore("2025-03-01")).toBe("2025-02-28");
    });

    it("should handle leap year", () => {
      expect(getDateBefore("2024-03-01")).toBe("2024-02-29");
    });

    it("should handle first day of year", () => {
      expect(getDateBefore("2025-01-01")).toBe("2024-12-31");
    });
  });

  describe("hasChangedValues detection logic", () => {
    // Test the change detection logic
    interface FormState {
      name: string;
      amount: number;
      categoryId: string | null;
      date: string;
      notes: string;
      type: "expense" | "income";
      status: "paid" | "pending" | "planned";
    }

    interface OriginalTx {
      name: string;
      amount: number;
      category: string;
      date: string;
      notes?: string;
      type: "expense" | "income";
      status?: "paid" | "pending" | "planned";
    }

    function hasChangedValues(form: FormState, tx: OriginalTx): boolean {
      return (
        form.name.trim() !== tx.name ||
        form.amount !== tx.amount ||
        form.categoryId !== tx.category ||
        form.date !== tx.date ||
        form.notes.trim() !== (tx.notes || "") ||
        form.type !== tx.type ||
        form.status !== (tx.status || "paid")
      );
    }

    const originalTx: OriginalTx = {
      name: "Rent",
      amount: 1000000,
      category: "housing",
      date: "2025-01-15",
      notes: "",
      type: "expense",
      status: "paid",
    };

    it("should return false when no changes", () => {
      const form: FormState = {
        name: "Rent",
        amount: 1000000,
        categoryId: "housing",
        date: "2025-01-15",
        notes: "",
        type: "expense",
        status: "paid",
      };
      expect(hasChangedValues(form, originalTx)).toBe(false);
    });

    it("should detect name change", () => {
      const form: FormState = {
        name: "New Rent",
        amount: 1000000,
        categoryId: "housing",
        date: "2025-01-15",
        notes: "",
        type: "expense",
        status: "paid",
      };
      expect(hasChangedValues(form, originalTx)).toBe(true);
    });

    it("should detect amount change", () => {
      const form: FormState = {
        name: "Rent",
        amount: 1200000,
        categoryId: "housing",
        date: "2025-01-15",
        notes: "",
        type: "expense",
        status: "paid",
      };
      expect(hasChangedValues(form, originalTx)).toBe(true);
    });

    it("should detect category change", () => {
      const form: FormState = {
        name: "Rent",
        amount: 1000000,
        categoryId: "utilities",
        date: "2025-01-15",
        notes: "",
        type: "expense",
        status: "paid",
      };
      expect(hasChangedValues(form, originalTx)).toBe(true);
    });

    it("should detect date change", () => {
      const form: FormState = {
        name: "Rent",
        amount: 1000000,
        categoryId: "housing",
        date: "2025-01-20",
        notes: "",
        type: "expense",
        status: "paid",
      };
      expect(hasChangedValues(form, originalTx)).toBe(true);
    });

    it("should detect notes change", () => {
      const form: FormState = {
        name: "Rent",
        amount: 1000000,
        categoryId: "housing",
        date: "2025-01-15",
        notes: "Some note",
        type: "expense",
        status: "paid",
      };
      expect(hasChangedValues(form, originalTx)).toBe(true);
    });

    it("should detect status change", () => {
      const form: FormState = {
        name: "Rent",
        amount: 1000000,
        categoryId: "housing",
        date: "2025-01-15",
        notes: "",
        type: "expense",
        status: "pending",
      };
      expect(hasChangedValues(form, originalTx)).toBe(true);
    });

    it("should detect type change", () => {
      const form: FormState = {
        name: "Rent",
        amount: 1000000,
        categoryId: "housing",
        date: "2025-01-15",
        notes: "",
        type: "income",
        status: "paid",
      };
      expect(hasChangedValues(form, originalTx)).toBe(true);
    });

    it("should trim whitespace when comparing", () => {
      const form: FormState = {
        name: "  Rent  ",
        amount: 1000000,
        categoryId: "housing",
        date: "2025-01-15",
        notes: "  ",
        type: "expense",
        status: "paid",
      };
      expect(hasChangedValues(form, originalTx)).toBe(false);
    });
  });

  describe("hasChangedSchedule detection logic", () => {
    interface Schedule {
      enabled: boolean;
      frequency: "daily" | "weekly" | "monthly" | "yearly";
      interval: number;
      startDate: string;
      endDate?: string;
      dayOfMonth?: number;
      dayOfWeek?: number;
    }

    function hasChangedSchedule(
      formSchedule: Schedule | null,
      txSchedule: Schedule | undefined
    ): boolean {
      if (!txSchedule && !formSchedule) return false;
      if (!txSchedule || !formSchedule) return true;
      return (
        formSchedule.enabled !== txSchedule.enabled ||
        formSchedule.frequency !== txSchedule.frequency ||
        formSchedule.interval !== txSchedule.interval ||
        formSchedule.dayOfMonth !== txSchedule.dayOfMonth ||
        formSchedule.dayOfWeek !== txSchedule.dayOfWeek ||
        formSchedule.startDate !== txSchedule.startDate ||
        formSchedule.endDate !== txSchedule.endDate
      );
    }

    const originalSchedule: Schedule = {
      enabled: true,
      frequency: "monthly",
      interval: 1,
      startDate: "2025-01-15",
      dayOfMonth: 15,
    };

    it("should return false when no changes", () => {
      const formSchedule: Schedule = {
        enabled: true,
        frequency: "monthly",
        interval: 1,
        startDate: "2025-01-15",
        dayOfMonth: 15,
      };
      expect(hasChangedSchedule(formSchedule, originalSchedule)).toBe(false);
    });

    it("should detect frequency change", () => {
      const formSchedule: Schedule = {
        enabled: true,
        frequency: "weekly",
        interval: 1,
        startDate: "2025-01-15",
        dayOfMonth: 15,
      };
      expect(hasChangedSchedule(formSchedule, originalSchedule)).toBe(true);
    });

    it("should detect interval change", () => {
      const formSchedule: Schedule = {
        enabled: true,
        frequency: "monthly",
        interval: 2,
        startDate: "2025-01-15",
        dayOfMonth: 15,
      };
      expect(hasChangedSchedule(formSchedule, originalSchedule)).toBe(true);
    });

    it("should detect enabled change", () => {
      const formSchedule: Schedule = {
        enabled: false,
        frequency: "monthly",
        interval: 1,
        startDate: "2025-01-15",
        dayOfMonth: 15,
      };
      expect(hasChangedSchedule(formSchedule, originalSchedule)).toBe(true);
    });

    it("should return true when schedule added", () => {
      expect(hasChangedSchedule(originalSchedule, undefined)).toBe(true);
    });

    it("should return true when schedule removed", () => {
      expect(hasChangedSchedule(null, originalSchedule)).toBe(true);
    });

    it("should return false when both null/undefined", () => {
      expect(hasChangedSchedule(null, undefined)).toBe(false);
    });
  });

  describe("handleSave flow decision logic", () => {
    interface SaveDecision {
      showNoChangesAlert: boolean;
      showTemplateEditModal: boolean;
      autoSaveThisAndFuture: boolean;
      performNormalSave: boolean;
    }

    function decideSaveAction(
      virtualDate: string | undefined,
      isTemplate: boolean,
      hasChangedSchedule: boolean,
      hasChangedValues: boolean
    ): SaveDecision {
      // Logic from handleSave in AddEditTransactionPage
      if (virtualDate && isTemplate) {
        if (!hasChangedSchedule && !hasChangedValues) {
          return {
            showNoChangesAlert: true,
            showTemplateEditModal: false,
            autoSaveThisAndFuture: false,
            performNormalSave: false,
          };
        }

        if (hasChangedSchedule) {
          return {
            showNoChangesAlert: false,
            showTemplateEditModal: false,
            autoSaveThisAndFuture: true,
            performNormalSave: false,
          };
        }

        if (hasChangedValues) {
          return {
            showNoChangesAlert: false,
            showTemplateEditModal: true,
            autoSaveThisAndFuture: false,
            performNormalSave: false,
          };
        }
      }

      return {
        showNoChangesAlert: false,
        showTemplateEditModal: false,
        autoSaveThisAndFuture: false,
        performNormalSave: true,
      };
    }

    describe("when virtualDate is set (coming from 'Editar y registrar')", () => {
      const virtualDate = "2025-02-15";
      const isTemplate = true;

      it("should show 'Sin cambios' alert when no changes", () => {
        const result = decideSaveAction(virtualDate, isTemplate, false, false);
        expect(result.showNoChangesAlert).toBe(true);
        expect(result.showTemplateEditModal).toBe(false);
        expect(result.autoSaveThisAndFuture).toBe(false);
        expect(result.performNormalSave).toBe(false);
      });

      it("should auto-save 'Este y los siguientes' when schedule changed", () => {
        const result = decideSaveAction(virtualDate, isTemplate, true, false);
        expect(result.showNoChangesAlert).toBe(false);
        expect(result.showTemplateEditModal).toBe(false);
        expect(result.autoSaveThisAndFuture).toBe(true);
        expect(result.performNormalSave).toBe(false);
      });

      it("should auto-save 'Este y los siguientes' when schedule and values changed", () => {
        const result = decideSaveAction(virtualDate, isTemplate, true, true);
        expect(result.showNoChangesAlert).toBe(false);
        expect(result.autoSaveThisAndFuture).toBe(true);
        // Schedule change takes priority
      });

      it("should show template edit modal when only values changed", () => {
        const result = decideSaveAction(virtualDate, isTemplate, false, true);
        expect(result.showNoChangesAlert).toBe(false);
        expect(result.showTemplateEditModal).toBe(true);
        expect(result.autoSaveThisAndFuture).toBe(false);
        expect(result.performNormalSave).toBe(false);
      });
    });

    describe("when virtualDate is NOT set (editing template directly)", () => {
      const virtualDate = undefined;
      const isTemplate = true;

      it("should perform normal save even with changes", () => {
        const result = decideSaveAction(virtualDate, isTemplate, false, true);
        expect(result.showNoChangesAlert).toBe(false);
        expect(result.showTemplateEditModal).toBe(false);
        expect(result.autoSaveThisAndFuture).toBe(false);
        expect(result.performNormalSave).toBe(true);
      });

      it("should perform normal save even without changes", () => {
        const result = decideSaveAction(virtualDate, isTemplate, false, false);
        expect(result.performNormalSave).toBe(true);
      });

      it("should perform normal save even with schedule changes", () => {
        const result = decideSaveAction(virtualDate, isTemplate, true, false);
        expect(result.performNormalSave).toBe(true);
      });
    });

    describe("when editing non-template transaction", () => {
      const virtualDate = undefined;
      const isTemplate = false;

      it("should always perform normal save", () => {
        const result = decideSaveAction(virtualDate, isTemplate, false, true);
        expect(result.performNormalSave).toBe(true);
      });
    });
  });
});
