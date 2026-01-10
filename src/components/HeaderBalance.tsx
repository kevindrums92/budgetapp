import { useMemo } from "react";
import { useBudgetStore } from "@/state/budget.store";
import { formatCOP } from "@/features/transactions/transactions.utils";
import MonthBar from "@/components/MonthBar";

export default function HeaderBalance() {
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

  const balanceClass =
    totals.balance > 0 ? "text-green-600" : totals.balance < 0 ? "text-red-600" : "text-gray-900";

  return (
    <header className="sticky top-[83px] z-10 bg-white">
      {/* Top header */}
      <div className="mx-auto max-w-xl px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold">Presupuesto</h1>

          <div className="text-right leading-tight">
            <p className="text-[11px] text-gray-600">Balance</p>
            <p className={`text-lg font-bold ${balanceClass}`}>
              {formatCOP(totals.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Month selector */}
      <MonthBar />

      {/* Summary section */}
      <div className="bg-gray-50">
        <div className="mx-auto max-w-xl px-4 py-3">
          <div className="bg-white">
            <div className="grid grid-cols-2">
              {/* Ingresos */}
              <div className="flex gap-3 p-3">
                {/* Indicador */}
                <div className="w-1 bg-green-500" />

                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-600">
                    Ingresos
                  </p>
                  <p className="mt-1 text-base font-semibold">
                    {formatCOP(totals.income)}
                  </p>
                </div>
              </div>

              {/* Gastos */}
              <div className="flex gap-3 p-3">
                {/* Indicador */}
                <div className="w-1 bg-red-500" />

                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-600">
                    Gastos
                  </p>
                  <p className="mt-1 text-base font-semibold">
                    {formatCOP(totals.expense)}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
