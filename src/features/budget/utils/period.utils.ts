import type { BudgetPeriod, BudgetPeriodType } from "@/types/budget.types";

/**
 * Obtiene el período de la semana actual (lunes a domingo).
 */
export function getCurrentWeek(): BudgetPeriod {
  const today = new Date();
  const dayOfWeek = today.getDay();

  // Calcular el lunes de esta semana (0=domingo, 1=lunes, ..., 6=sábado)
  const monday = new Date(today);
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Si es domingo, retroceder 6 días
  monday.setDate(today.getDate() + diff);

  // Calcular el domingo de esta semana
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    type: "week",
    startDate: formatDate(monday),
    endDate: formatDate(sunday),
  };
}

/**
 * Obtiene el período del mes actual (día 1 a último día del mes).
 */
export function getCurrentMonth(): BudgetPeriod {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0); // Día 0 del mes siguiente = último día del mes actual

  return {
    type: "month",
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

/**
 * Obtiene el período del trimestre actual (Q1: Ene-Mar, Q2: Abr-Jun, Q3: Jul-Sep, Q4: Oct-Dic).
 */
export function getCurrentQuarter(): BudgetPeriod {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Calcular el trimestre (0-3)
  const quarter = Math.floor(month / 3);
  const startMonth = quarter * 3;
  const endMonth = startMonth + 2;

  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, endMonth + 1, 0); // Último día del tercer mes

  return {
    type: "quarter",
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

/**
 * Obtiene el período del año actual (1 enero a 31 diciembre).
 */
export function getCurrentYear(): BudgetPeriod {
  const today = new Date();
  const year = today.getFullYear();

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  return {
    type: "year",
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

/**
 * Obtiene el siguiente período basado en el tipo de período actual.
 * Para períodos custom, avanza la misma cantidad de días.
 */
export function getNextPeriod(period: BudgetPeriod): BudgetPeriod {
  const start = new Date(period.startDate + "T12:00:00");
  const end = new Date(period.endDate + "T12:00:00");

  switch (period.type) {
    case "week": {
      const newStart = new Date(start);
      newStart.setDate(start.getDate() + 7);
      const newEnd = new Date(end);
      newEnd.setDate(end.getDate() + 7);

      return {
        type: "week",
        startDate: formatDate(newStart),
        endDate: formatDate(newEnd),
      };
    }

    case "month": {
      const newStart = new Date(start);
      newStart.setMonth(start.getMonth() + 1);

      const newEnd = new Date(newStart);
      newEnd.setMonth(newStart.getMonth() + 1);
      newEnd.setDate(0); // Último día del mes

      return {
        type: "month",
        startDate: formatDate(newStart),
        endDate: formatDate(newEnd),
      };
    }

    case "quarter": {
      const newStart = new Date(start);
      newStart.setMonth(start.getMonth() + 3);

      const newEnd = new Date(newStart);
      newEnd.setMonth(newStart.getMonth() + 3);
      newEnd.setDate(0); // Último día del trimestre

      return {
        type: "quarter",
        startDate: formatDate(newStart),
        endDate: formatDate(newEnd),
      };
    }

    case "year": {
      const newStart = new Date(start);
      newStart.setFullYear(start.getFullYear() + 1);

      const newEnd = new Date(end);
      newEnd.setFullYear(end.getFullYear() + 1);

      return {
        type: "year",
        startDate: formatDate(newStart),
        endDate: formatDate(newEnd),
      };
    }

    case "custom": {
      // Para custom, avanzar la misma cantidad de días
      const durationMs = end.getTime() - start.getTime();
      const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24));

      const newStart = new Date(start);
      newStart.setDate(start.getDate() + durationDays + 1); // +1 para empezar el día siguiente

      const newEnd = new Date(newStart);
      newEnd.setDate(newStart.getDate() + durationDays);

      return {
        type: "custom",
        startDate: formatDate(newStart),
        endDate: formatDate(newEnd),
      };
    }
  }
}

/**
 * Verifica si una fecha (YYYY-MM-DD) está dentro de un período.
 */
export function isDateInPeriod(date: string, period: BudgetPeriod): boolean {
  return date >= period.startDate && date <= period.endDate;
}

/**
 * Obtiene el período actual basado en el tipo especificado.
 */
export function getCurrentPeriod(type: BudgetPeriodType): BudgetPeriod {
  switch (type) {
    case "week":
      return getCurrentWeek();
    case "month":
      return getCurrentMonth();
    case "quarter":
      return getCurrentQuarter();
    case "year":
      return getCurrentYear();
    case "custom":
      throw new Error("Cannot get current period for custom type - use specific dates");
  }
}

/**
 * Verifica si un período ya ha terminado (endDate < hoy).
 */
export function isPeriodExpired(period: BudgetPeriod, today: string): boolean {
  return period.endDate < today;
}

/**
 * Verifica si un período está activo (hoy está dentro del período).
 */
export function isPeriodActive(period: BudgetPeriod, today: string): boolean {
  return isDateInPeriod(today, period);
}

/**
 * Verifica si dos períodos se solapan.
 */
export function doPeriodsOverlap(period1: BudgetPeriod, period2: BudgetPeriod): boolean {
  // Períodos se solapan si:
  // - El inicio de period1 está dentro de period2, o
  // - El inicio de period2 está dentro de period1, o
  // - period1 contiene completamente a period2, o
  // - period2 contiene completamente a period1

  const p1Start = period1.startDate;
  const p1End = period1.endDate;
  const p2Start = period2.startDate;
  const p2End = period2.endDate;

  return (
    (p1Start >= p2Start && p1Start <= p2End) || // p1 empieza dentro de p2
    (p2Start >= p1Start && p2Start <= p1End) || // p2 empieza dentro de p1
    (p1Start <= p2Start && p1End >= p2End) ||   // p1 contiene a p2
    (p2Start <= p1Start && p2End >= p1End)      // p2 contiene a p1
  );
}

/**
 * Calcula la duración en días de un período.
 */
export function getPeriodDurationDays(period: BudgetPeriod): number {
  const start = new Date(period.startDate + "T12:00:00");
  const end = new Date(period.endDate + "T12:00:00");

  const durationMs = end.getTime() - start.getTime();
  return Math.round(durationMs / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
}

/**
 * Formatea una fecha a YYYY-MM-DD.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
