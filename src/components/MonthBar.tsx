import { useBudgetStore } from "@/state/budget.store";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
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

function ChevronLeft() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export default function MonthBar() {
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const setSelectedMonth = useBudgetStore((s) => s.setSelectedMonth);

  const { y, m } = parseMonthKey(selectedMonth);
  const label = `${MONTHS[m - 1]} ${y}`;

  return (
    <div className="w-full bg-[#18B7B0] text-white">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Prev */}
          <button
            type="button"
            onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15 active:bg-white/20"
            aria-label="Mes anterior"
          >
            <ChevronLeft />
          </button>

          {/* Label */}
          <p className="text-sm font-semibold uppercase tracking-widest">
            {label}
          </p>

          {/* Next */}
          <button
            type="button"
            onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15 active:bg-white/20"
            aria-label="Mes siguiente"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}
