import { useMemo } from "react";
import { useBudgetStore } from "@/state/budget.store";
import { formatCOP } from "@/features/transactions/transactions.utils";
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

export default function HeaderBalance() {
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const setSelectedMonth = useBudgetStore((s) => s.setSelectedMonth);
  const transactions = useBudgetStore((s) => s.transactions);

  const { y, m } = parseMonthKey(selectedMonth);
  const monthLabel = `${MONTHS[m - 1]} ${y}`;

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      if (t.date.slice(0, 7) !== selectedMonth) continue;
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }

    // Calculate percentage for progress bar
    const total = income + expense;
    const incomePercent = total > 0 ? (income / total) * 100 : 50;

    return { income, expense, balance: income - expense, incomePercent };
  }, [transactions, selectedMonth]);

  const balanceColor = totals.balance >= 0 ? "text-emerald-600" : "text-red-500";

  return (
    <div className="sticky top-[84px] z-10 bg-white border-b border-gray-100">
      <div className="mx-auto max-w-xl px-4 py-4">
        {/* Month selector row */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
            className="p-1 text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={20} strokeWidth={2} />
          </button>

          <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            {monthLabel}
          </span>

          <button
            type="button"
            onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
            className="p-1 text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Balance */}
        <div className="text-center mb-4">
          <p className={`text-3xl font-bold tracking-tight ${balanceColor}`}>
            {formatCOP(totals.balance)}
          </p>
          <p className="text-xs text-gray-400 mt-1">balance</p>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-300"
            style={{ width: `${totals.incomePercent}%` }}
          />
        </div>

        {/* Income / Expense cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Income Card */}
          <div className="bg-emerald-50 rounded-xl px-3 py-2.5 border border-emerald-100">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <ChevronRight size={12} className="text-emerald-600 -rotate-90" />
              </div>
              <span className="text-xs text-emerald-700">Ingresos</span>
            </div>
            <p className="text-base font-bold text-emerald-700">
              {formatCOP(totals.income)}
            </p>
          </div>

          {/* Expense Card */}
          <div className="bg-red-50 rounded-xl px-3 py-2.5 border border-red-100">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                <ChevronRight size={12} className="text-red-600 rotate-90" />
              </div>
              <span className="text-xs text-red-700">Gastos</span>
            </div>
            <p className="text-base font-bold text-red-700">
              {formatCOP(totals.expense)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
