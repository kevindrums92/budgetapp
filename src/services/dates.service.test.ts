import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { todayISO, monthKey, currentMonthKey, monthLabelES } from './dates.service';

describe('dates.service', () => {
  describe('todayISO', () => {
    beforeEach(() => {
      // Mock date to be consistent
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return today date in YYYY-MM-DD format', () => {
      const result = todayISO();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return correct date for mocked date', () => {
      const result = todayISO();
      expect(result).toBe('2026-01-15');
    });

    it('should pad single digit months and days with zeros', () => {
      vi.setSystemTime(new Date('2026-03-05T12:00:00Z'));
      const result = todayISO();
      expect(result).toBe('2026-03-05');
    });
  });

  describe('monthKey', () => {
    it('should extract YYYY-MM from ISO date string', () => {
      expect(monthKey('2026-01-15')).toBe('2026-01');
      expect(monthKey('2025-12-31')).toBe('2025-12');
      expect(monthKey('2024-03-01')).toBe('2024-03');
    });

    it('should work with any valid ISO date string', () => {
      expect(monthKey('2026-06-23')).toBe('2026-06');
    });
  });

  describe('currentMonthKey', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return current month in YYYY-MM format', () => {
      const result = currentMonthKey();
      expect(result).toBe('2026-01');
    });

    it('should update when system date changes', () => {
      expect(currentMonthKey()).toBe('2026-01');

      vi.setSystemTime(new Date('2026-07-20T12:00:00Z'));
      expect(currentMonthKey()).toBe('2026-07');
    });
  });

  describe('monthLabelES', () => {
    it('should format month key as Spanish month label', () => {
      expect(monthLabelES('2026-01')).toBe('Enero de 2026');
      expect(monthLabelES('2026-12')).toBe('Diciembre de 2026');
    });

    it('should capitalize first letter', () => {
      const result = monthLabelES('2026-06');
      expect(result[0]).toBe(result[0].toUpperCase());
      expect(result).toBe('Junio de 2026');
    });

    it('should handle different months correctly', () => {
      expect(monthLabelES('2025-03')).toBe('Marzo de 2025');
      expect(monthLabelES('2024-08')).toBe('Agosto de 2024');
    });
  });
});
