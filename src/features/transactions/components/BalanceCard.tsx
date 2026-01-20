import { useMemo } from "react";
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

  const balanceColor = totals.balance >= 0 ? "text-emerald-600" : "text-red-500";

  return (
    <div className="sticky top-[83.7px] z-10 bg-white border-b border-gray-100">
      <div className="mx-auto max-w-xl px-4 py-4">
        {/* Balance */}
        <div className="text-center mb-4">
          <p className={`text-3xl font-bold tracking-tight ${balanceColor}`}>
            {formatCOP(totals.balance)}
          </p>
          <p className="text-xs text-gray-400 mt-1">balance</p>
        </div>

        {/* Income / Expense cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Income Card */}
          <div className="bg-emerald-50 rounded-xl px-3 py-2.5 border border-emerald-100">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs text-emerald-700">Ingresos</span>
            </div>
            <p className="text-base font-bold text-emerald-700">
              {formatCOP(totals.income)}
            </p>
          </div>

          {/* Expense Card */}
          <div className="bg-red-50 rounded-xl px-3 py-2.5 border border-red-100">
            <div className="flex items-center gap-1.5 mb-0.5">
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
