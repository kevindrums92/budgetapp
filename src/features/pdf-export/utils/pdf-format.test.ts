import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatAmountPure,
  formatDateRange,
  formatShortDate,
  formatGroupDate,
  formatTimestamp,
  getDayOfWeek,
} from './pdf-format';

describe('pdf-format', () => {
  describe('formatAmountPure', () => {
    it('should format COP amounts with no decimals', () => {
      const result = formatAmountPure(1500000, 'es-CO', 'COP', 0);
      // Should contain the number formatted with locale separators
      expect(result).toContain('1.500.000');
    });

    it('should format USD amounts with 2 decimals', () => {
      const result = formatAmountPure(1234.56, 'en-US', 'USD', 2);
      expect(result).toContain('1,234.56');
    });

    it('should format EUR amounts', () => {
      const result = formatAmountPure(999.99, 'de-DE', 'EUR', 2);
      // Should contain the amount in some format
      expect(result).toContain('999,99');
    });

    it('should handle zero amount', () => {
      const result = formatAmountPure(0, 'es-CO', 'COP', 0);
      expect(result).toContain('0');
    });

    it('should handle large amounts', () => {
      const result = formatAmountPure(99999999, 'es-CO', 'COP', 0);
      expect(result).toContain('99.999.999');
    });

    it('should return fallback for invalid currency code', () => {
      const result = formatAmountPure(100, 'en-US', 'INVALID', 2);
      // Fallback: "INVALID 100"
      expect(result).toContain('INVALID');
      expect(result).toContain('100');
    });

    it('should handle negative amounts', () => {
      const result = formatAmountPure(-5000, 'es-CO', 'COP', 0);
      expect(result).toContain('5.000');
    });
  });

  describe('formatDateRange', () => {
    it('should format a date range within the same month', () => {
      const result = formatDateRange('2026-03-01', '2026-03-31', 'es-CO');
      expect(result).toContain('–');
      expect(result).toContain('2026');
    });

    it('should format a date range across months', () => {
      const result = formatDateRange('2026-01-15', '2026-03-20', 'es-CO');
      expect(result).toContain('–');
      expect(result).toContain('15');
      expect(result).toContain('20');
    });

    it('should work with English locale', () => {
      const result = formatDateRange('2026-03-01', '2026-03-31', 'en-US');
      expect(result).toContain('–');
      expect(result).toContain('2026');
    });

    it('should handle single-day range', () => {
      const result = formatDateRange('2026-03-15', '2026-03-15', 'es-CO');
      expect(result).toContain('15');
    });
  });

  describe('formatShortDate', () => {
    it('should include weekday, day, and month', () => {
      // 2026-03-15 is a Sunday
      const result = formatShortDate('2026-03-15', 'en-US');
      expect(result).toContain('Sun');
      expect(result).toContain('15');
      expect(result).toContain('Mar');
    });

    it('should work with Spanish locale', () => {
      const result = formatShortDate('2026-03-15', 'es-CO');
      expect(result).toContain('15');
    });

    it('should handle different dates', () => {
      const result = formatShortDate('2026-01-01', 'en-US');
      expect(result).toContain('1');
      expect(result).toContain('Jan');
    });
  });

  describe('formatGroupDate', () => {
    it('should include long weekday, day, and long month', () => {
      const result = formatGroupDate('2026-03-15', 'en-US');
      expect(result).toContain('Sunday');
      expect(result).toContain('15');
      expect(result).toContain('March');
    });

    it('should work with Spanish locale', () => {
      const result = formatGroupDate('2026-03-15', 'es-CO');
      expect(result.toLowerCase()).toContain('domingo');
      expect(result).toContain('15');
      expect(result.toLowerCase()).toContain('marzo');
    });
  });

  describe('formatTimestamp', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-15T14:30:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should include date and time components', () => {
      const result = formatTimestamp('en-US');
      expect(result).toContain('15');
      expect(result).toContain('2026');
    });

    it('should work with Spanish locale', () => {
      const result = formatTimestamp('es-CO');
      expect(result).toContain('15');
      expect(result).toContain('2026');
    });

    it('should return a non-empty string', () => {
      const result = formatTimestamp('es-CO');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getDayOfWeek', () => {
    it('should return Sunday for 2026-03-15', () => {
      const result = getDayOfWeek('2026-03-15', 'en-US');
      expect(result).toBe('Sunday');
    });

    it('should return Monday for 2026-03-16', () => {
      const result = getDayOfWeek('2026-03-16', 'en-US');
      expect(result).toBe('Monday');
    });

    it('should return Spanish day name', () => {
      const result = getDayOfWeek('2026-03-15', 'es-CO');
      expect(result.toLowerCase()).toBe('domingo');
    });

    it('should return French day name', () => {
      const result = getDayOfWeek('2026-03-15', 'fr-FR');
      expect(result.toLowerCase()).toBe('dimanche');
    });

    it('should return Portuguese day name', () => {
      const result = getDayOfWeek('2026-03-15', 'pt-BR');
      expect(result.toLowerCase()).toBe('domingo');
    });
  });
});
