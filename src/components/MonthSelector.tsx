import { useBudgetStore } from "@/state/budget.store";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function parseMonthKey(monthKey: string) {
  const [yStr, mStr] = monthKey.split("-");
  return { y: Number(yStr), m: Number(mStr) };
}

function toMonthKey(y: number, m: number) {
  return `${y}-${String(m).padStart(2, "0")}`;
}

function addMonths(monthKey: string, delta: number) {
  const { y, m } = parseMonthKey(monthKey);
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() + delta);
  return toMonthKey(d.getFullYear(), d.getMonth() + 1);
}

export default function MonthSelector() {
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const setSelectedMonth = useBudgetStore((s) => s.setSelectedMonth);

  const { y, m } = parseMonthKey(selectedMonth);
  const monthLabel = `${MONTHS[m - 1]} ${y}`;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
        className="p-1 text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
        aria-label="Mes anterior"
      >
        <ChevronLeft size={18} strokeWidth={2} />
      </button>

      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide min-w-[70px] text-center">
        {monthLabel}
      </span>

      <button
        type="button"
        onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
        className="p-1 text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
        aria-label="Mes siguiente"
      >
        <ChevronRight size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
