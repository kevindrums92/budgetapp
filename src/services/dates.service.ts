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
