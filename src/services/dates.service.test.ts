import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  todayISO,
  monthKey,
  currentMonthKey,
  monthLabelES,
  formatDateGroupHeader,
  formatTime,
} from './dates.service';

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

    it('should format all 12 months correctly in Spanish', () => {
      expect(monthLabelES('2026-01')).toBe('Enero de 2026');
      expect(monthLabelES('2026-02')).toBe('Febrero de 2026');
      expect(monthLabelES('2026-03')).toBe('Marzo de 2026');
      expect(monthLabelES('2026-04')).toBe('Abril de 2026');
      expect(monthLabelES('2026-05')).toBe('Mayo de 2026');
      expect(monthLabelES('2026-06')).toBe('Junio de 2026');
      expect(monthLabelES('2026-07')).toBe('Julio de 2026');
      expect(monthLabelES('2026-08')).toBe('Agosto de 2026');
      expect(monthLabelES('2026-09')).toBe('Septiembre de 2026');
      expect(monthLabelES('2026-10')).toBe('Octubre de 2026');
      expect(monthLabelES('2026-11')).toBe('Noviembre de 2026');
      expect(monthLabelES('2026-12')).toBe('Diciembre de 2026');
    });
  });

  describe('formatDateGroupHeader', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-20T15:30:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "Hoy" for today\'s date', () => {
      const today = todayISO();
      const result = formatDateGroupHeader(today);
      expect(result).toBe('Hoy');
    });

    it('should return "Ayer" for yesterday\'s date', () => {
      const result = formatDateGroupHeader('2026-01-19');
      expect(result).toBe('Ayer');
    });

    it('should format dates older than yesterday with weekday and date', () => {
      const result = formatDateGroupHeader('2026-01-15');
      // Format: "Jueves, 15 Ene." (es-CO locale)
      expect(result).toMatch(/^\w+, \d{1,2} \w{3}\.$/);
      expect(result).toContain('15');
      expect(result).toContain('Ene');
    });

    it('should handle year boundary correctly', () => {
      vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));

      const today = formatDateGroupHeader('2026-01-01');
      expect(today).toBe('Hoy');

      const yesterday = formatDateGroupHeader('2025-12-31');
      expect(yesterday).toBe('Ayer');
    });

    it('should format dates from different months', () => {
      const result = formatDateGroupHeader('2025-12-25');
      expect(result).toMatch(/^\w+, \d{1,2} \w{3}\.$/);
      expect(result).toContain('25');
      expect(result).toContain('Dic');
    });

    it('should handle dates far in the past', () => {
      const result = formatDateGroupHeader('2025-06-15');
      expect(result).toMatch(/^\w+, \d{1,2} \w{3}\.$/);
      expect(result).toContain('15');
      expect(result).toContain('Jun');
    });
  });

  describe('formatTime', () => {
    it('should format time in HH:MM format', () => {
      const result = formatTime('2026-01-20T15:30:00');
      expect(result).toMatch(/^\d{2}:\d{2}$/);
      expect(result).toBe('15:30');
    });

    it('should handle morning hours', () => {
      const result = formatTime('2026-01-20T09:15:00');
      expect(result).toBe('09:15');
    });

    it('should handle afternoon hours', () => {
      const result = formatTime('2026-01-20T15:30:00');
      expect(result).toBe('15:30');
    });

    it('should handle midnight', () => {
      const result = formatTime('2026-01-20T00:00:00');
      expect(result).toBe('00:00');
    });

    it('should handle end of day', () => {
      const result = formatTime('2026-01-20T23:59:00');
      expect(result).toBe('23:59');
    });

    it('should pad single-digit hours with zero', () => {
      const result = formatTime('2026-01-20T05:30:00');
      expect(result).toBe('05:30');
    });

    it('should pad single-digit minutes with zero', () => {
      const result = formatTime('2026-01-20T15:05:00');
      expect(result).toBe('15:05');
    });

    it('should handle ISO 8601 format with timezone', () => {
      const result = formatTime('2026-01-20T15:30:00Z');
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should handle date-only strings', () => {
      const result = formatTime('2026-01-20');
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });
  });
});
