import type { Schedule } from "@/types/budget.types";
import { todayISO } from "@/services/dates.service";
import type { TFunction } from "i18next";

/**
 * Formats a schedule frequency using translations
 * Examples:
 * - "Diario" | "Cada 2 días" | "Daily" | "Every 2 days"
 * - "Semanal los viernes" | "Cada 2 semanas los lunes" | "Weekly on Fridays" | "Every 2 weeks on Mondays"
 * - "Mensual el día 15" | "Cada 3 meses el día 1" | "Monthly on day 15" | "Every 3 months on day 1"
 * - "Anual" | "Cada 2 años" | "Yearly" | "Every 2 years"
 */
export function formatScheduleFrequency(schedule: Schedule, t: TFunction): string {
  const { frequency, interval, dayOfWeek, dayOfMonth } = schedule;

  const daysOfWeekKeys = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;

  switch (frequency) {
    case "daily":
      if (interval === 1) return t("frequency.daily");
      return t("frequency.dailyInterval", { count: interval });

    case "weekly": {
      const dayKey = dayOfWeek !== undefined ? daysOfWeekKeys[dayOfWeek] : null;
      const dayName = dayKey ? t(`daysOfWeek.${dayKey}`) : "";

      if (interval === 1) {
        return dayName ? t("frequency.weeklyOn", { day: dayName }) : t("frequency.weekly");
      }
      return dayName
        ? t("frequency.weeklyIntervalOn", { count: interval, day: dayName })
        : t("frequency.weeklyInterval", { count: interval });
    }

    case "monthly": {
      const day = dayOfMonth ?? 1;
      if (interval === 1) {
        return t("frequency.monthly", { day });
      }
      return t("frequency.monthlyInterval", { count: interval, day });
    }

    case "yearly":
      if (interval === 1) return t("frequency.yearly");
      return t("frequency.yearlyInterval", { count: interval });

    default:
      return t("frequency.scheduled");
  }
}

/**
 * Formats a date string for display using translations and locale
 * Returns: "15 Feb 2025" or "Hoy"/"Today" or "Mañana"/"Tomorrow"
 */
export function formatNextDate(dateStr: string, t: TFunction, locale: string): string {
  const today = todayISO();

  if (dateStr === today) {
    return t("dateFormat.today");
  }

  // Check if tomorrow
  const tomorrow = new Date(today + "T12:00:00");
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  if (dateStr === tomorrowStr) {
    return t("dateFormat.tomorrow");
  }

  // Format as "15 Feb 2025" using the user's locale
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
