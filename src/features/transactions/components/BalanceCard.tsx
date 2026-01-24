import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { formatCOP } from "@/shared/utils/currency.utils";

export default function BalanceCard() {
  const { t } = useTranslation('home');
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
    <div className="bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-xl px-4 pt-4">
        {/* Hero Card with gradient */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#18B7B0] to-teal-800 rounded-[2rem] p-6 text-white shadow-xl shadow-teal-900/20 ring-1 ring-white/20">
          {/* Decorative blur elements */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-teal-400 opacity-10 rounded-full blur-xl" />

          {/* Content */}
          <div className="relative z-10">
            {/* Header: Label + Month Tag */}
            <div className="flex justify-between items-start mb-1">
              <span className="block text-teal-100 text-sm font-medium">{t('balanceCard.title')}</span>
            </div>

            {/* Balance Amount */}
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold tracking-tight">{formatCOP(totals.balance)}</span>
            </div>

            {/* Income / Expense Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Income Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center gap-3 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-teal-400/20 flex items-center justify-center text-teal-200">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-teal-200 uppercase tracking-wider font-semibold opacity-80">
                    {t('balanceCard.income')}
                  </p>
                  <p className="text-sm font-bold text-white">+{formatCOP(totals.income)}</p>
                </div>
              </div>

              {/* Expense Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center gap-3 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-rose-400/20 flex items-center justify-center text-rose-200">
                  <TrendingDown size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-rose-200 uppercase tracking-wider font-semibold opacity-80">
                    {t('balanceCard.expenses')}
                  </p>
                  <p className="text-sm font-bold text-white">-{formatCOP(totals.expense)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
