/**
 * PDF Format Utilities
 * Pure functions for formatting amounts and dates in PDF documents.
 * Cannot use React hooks — @react-pdf documents render outside the DOM.
 */

/**
 * Format a number as currency (mirrors CurrencyProvider.formatAmount)
 */
export function formatAmountPure(
  value: number,
  locale: string,
  code: string,
  decimals: number,
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(value);
  } catch {
    return `${code} ${value.toLocaleString()}`;
  }
}

/**
 * Format a date range as "1 Mar – 31 Mar 2026"
 */
export function formatDateRange(
  startDate: string,
  endDate: string,
  locale: string,
): string {
  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');

  const startStr = start.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });
  const endStr = end.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `${startStr} – ${endStr}`;
}

/**
 * Format a single date as "Lun, 4 Mar 2026"
 */
export function formatShortDate(
  dateStr: string,
  locale: string,
): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Format a date for grouping headers: "Viernes, 4 de Marzo"
 */
export function formatGroupDate(
  dateStr: string,
  locale: string,
): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Format a date as generation timestamp: "4 mar. 2026, 14:30"
 */
export function formatTimestamp(locale: string): string {
  return new Date().toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get the day of week name from a date string
 */
export function getDayOfWeek(dateStr: string, locale: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString(locale, { weekday: 'long' });
}
