import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { formatCOP } from "@/features/transactions/utils/transactions.utils";

export default function BalanceCard() {
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const transactions = useBudgetStore((s) => s.transactions);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      if (t.date.slice(0, 7) !== selectedMonth) continue;
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }

    return { income, expense, balance: income - expense };
  }, [transactions, selectedMonth]);

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-xl px-4 pt-4">
        {/* Balance Hero */}
        <div className="text-center mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Balance Total
          </p>
          <p className="text-5xl font-bold tracking-tight text-gray-900">
            {formatCOP(totals.balance)}
          </p>
        </div>

        {/* Income / Expense cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Income Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Ingresos</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">
              {formatCOP(totals.income)}
            </p>
          </div>

          {/* Expense Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Gastos</span>
            </div>
            <p className="text-xl font-bold text-red-600">
              {formatCOP(totals.expense)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
