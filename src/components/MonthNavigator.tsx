import { useBudgetStore } from "@/state/budget.store";
import { monthLabelES } from "@/services/dates.service";

function parseMonthKey(monthKey: string) {
  const [yStr, mStr] = monthKey.split("-");
  return { y: Number(yStr), m: Number(mStr) }; // m 1..12
}

function toMonthKey(y: number, m: number) {
  const mm = String(m).padStart(2, "0");
  return `${y}-${mm}`;
}

function addMonths(monthKey: string, delta: number) {
  const { y, m } = parseMonthKey(monthKey);
  const date = new Date(y, m - 1, 1);
  date.setMonth(date.getMonth() + delta);
  return toMonthKey(date.getFullYear(), date.getMonth() + 1);
}

export default function MonthNavigator() {
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const setSelectedMonth = useBudgetStore((s) => s.setSelectedMonth);

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const isCurrent = selectedMonth === currentMonth;

  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
          className="rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
          aria-label="Mes anterior"
          title="Mes anterior"
        >
          ◀
        </button>

        <button
          type="button"
          onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
          className="rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
          aria-label="Mes siguiente"
          title="Mes siguiente"
        >
          ▶
        </button>

        <button
          type="button"
          onClick={() => setSelectedMonth(currentMonth)}
          disabled={isCurrent}
          className="rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
          aria-label="Ir al mes actual"
          title="Ir al mes actual"
        >
          Hoy
        </button>
      </div>

      <div className="text-right">
        <p className="text-xs text-gray-600">Mes</p>
        <p className="text-sm font-semibold">{monthLabelES(selectedMonth)}</p>
      </div>
    </div>
  );
}
