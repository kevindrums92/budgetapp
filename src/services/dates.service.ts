export function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function monthKey(dateISO: string): string {
  return dateISO.slice(0, 7); // YYYY-MM
}

export function currentMonthKey(): string {
  return monthKey(todayISO());
}

export function monthLabelES(monthKeyStr: string): string {
  const [yStr, mStr] = monthKeyStr.split("-");
  const y = Number(yStr);
  const m = Number(mStr);

  const date = new Date(y, (m || 1) - 1, 1);
  const label = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(date);

  return label.replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Retorna "Hoy", "Ayer", o formato "Viernes, 12 Abr" según la fecha
 */
export function formatDateGroupHeader(dateISO: string): string {
  const today = todayISO();

  if (dateISO === today) {
    return "Hoy";
  }

  // Calcular ayer
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  if (dateISO === yesterdayISO) {
    return "Ayer";
  }

  // Formato "Viernes, 12 Abr"
  const [year, month, day] = dateISO.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  const weekday = new Intl.DateTimeFormat("es-CO", { weekday: "long" }).format(date);
  const dayNum = day;
  const monthShort = new Intl.DateTimeFormat("es-CO", { month: "short" }).format(date);

  // Capitalizar primera letra del día de la semana
  const weekdayCapitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);

  return `${weekdayCapitalized}, ${dayNum} ${monthShort.charAt(0).toUpperCase() + monthShort.slice(1)}`;
}

/**
 * Formatea hora desde una fecha ISO o timestamp
 */
export function formatTime(dateISO: string): string {
  const date = new Date(dateISO);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}
