import type { Schedule } from "@/types/budget.types";
import { todayISO } from "@/services/dates.service";

const DAYS_OF_WEEK_ES = [
  "domingos",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábados",
];

/**
 * Formats a schedule frequency in Spanish
 * Examples:
 * - "Diario" | "Cada 2 días"
 * - "Semanal los viernes" | "Cada 2 semanas los lunes"
 * - "Mensual el día 15" | "Cada 3 meses el día 1"
 * - "Anual" | "Cada 2 años"
 */
export function formatScheduleFrequency(schedule: Schedule): string {
  const { frequency, interval, dayOfWeek, dayOfMonth } = schedule;

  switch (frequency) {
    case "daily":
      if (interval === 1) return "Diario";
      return `Cada ${interval} días`;

    case "weekly": {
      const dayName = dayOfWeek !== undefined ? DAYS_OF_WEEK_ES[dayOfWeek] : "";
      if (interval === 1) {
        return dayName ? `Semanal los ${dayName}` : "Semanal";
      }
      return dayName
        ? `Cada ${interval} semanas los ${dayName}`
        : `Cada ${interval} semanas`;
    }

    case "monthly": {
      const day = dayOfMonth ?? 1;
      if (interval === 1) {
        return `Mensual el día ${day}`;
      }
      return `Cada ${interval} meses el día ${day}`;
    }

    case "yearly":
      if (interval === 1) return "Anual";
      return `Cada ${interval} años`;

    default:
      return "Programada";
  }
}

/**
 * Formats a date string for display
 * Returns: "15 Feb 2025" or "Hoy" or "Mañana"
 */
export function formatNextDate(dateStr: string): string {
  const today = todayISO();

  if (dateStr === today) {
    return "Hoy";
  }

  // Check if tomorrow
  const tomorrow = new Date(today + "T12:00:00");
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  if (dateStr === tomorrowStr) {
    return "Mañana";
  }

  // Format as "15 Feb 2025"
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

