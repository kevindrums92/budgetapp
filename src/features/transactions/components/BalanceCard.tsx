import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown, CircleHelp } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { useCurrency } from "@/features/currency";
import { usePrivacy } from "@/features/privacy";
import BalanceBreakdownSheet from "./BalanceBreakdownSheet";

type FilterType = "all" | "income" | "expense";

type Props = {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
};

function amountSizeClass(text: string): string {
  const length = text.length;
  if (length >= 18) return "text-xs min-[400px]:text-sm";
  if (length >= 14) return "text-sm min-[400px]:text-[0.98rem]";
  return "text-[0.93rem] min-[400px]:text-[1.14rem]";
}

export default function BalanceCard({ activeFilter, onFilterChange }: Props) {
  const { t } = useTranslation('home');
  const { formatAmount, currencyInfo } = useCurrency();
  const { formatWithPrivacy } = usePrivacy();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const transactions = useBudgetStore((s) => s.transactions);
  const carryOverBalances = useBudgetStore((s) => s.carryOverBalances);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      if (t.date.slice(0, 7) !== selectedMonth) continue;
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }

    const carryOver = carryOverBalances?.[selectedMonth]?.amount ?? 0;
    return { income, expense, balance: carryOver + income - expense, carryOver };
  }, [transactions, selectedMonth, carryOverBalances]);

  // Progress for "available balance": remaining balance as a fraction of total positive inflows
  const totalInflows = totals.income + Math.max(0, totals.carryOver);
  const rawAvailableRatio = totalInflows > 0 ? totals.balance / totalInflows : 0;
  const availableRatio = Math.min(Math.max(rawAvailableRatio, 0), 1);
  const availablePercent = availableRatio * 100;
  const roundedAvailablePercent = Math.round(availablePercent);
  const showDivider = availablePercent > 1 && availablePercent < 99;
  const incomeLabel = formatWithPrivacy(`+${formatAmount(totals.income)}`, currencyInfo.symbol);
  const expenseLabel = formatWithPrivacy(`-${formatAmount(totals.expense)}`, currencyInfo.symbol);
  const balanceFormatted = formatWithPrivacy(formatAmount(totals.balance), currencyInfo.symbol);

  return (
    <>
    <div className="bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-xl px-4 pt-4">
        {/* Hero Card with gradient */}
        <section data-tour="home-balance-card" className="relative overflow-hidden bg-gradient-to-br from-[#18B7B0] to-teal-800 rounded-[2rem] p-5 text-white shadow-xl shadow-teal-900/20 ring-1 ring-white/20">
          {/* Decorative blur elements */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-teal-400 opacity-10 rounded-full blur-xl" />

          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-teal-100 text-sm font-medium">{t('balanceCard.title')}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBreakdown(true);
                }}
                className="p-1 -mr-1 rounded-full transition-all active:scale-95"
              >
                <CircleHelp size={16} className="text-white/40" />
              </button>
            </div>

            {/* Balance Amount */}
            <div className={totals.carryOver !== 0 ? "mb-2" : "mb-3.5"}>
              <span className="text-3xl min-[400px]:text-4xl font-bold tracking-tight">{balanceFormatted}</span>
            </div>

            {/* Carry-over line (when present) */}
            {totals.carryOver !== 0 && (
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-100/70">
                  {t('balanceCard.carryOver')}
                </span>
                <span className={`text-xs font-semibold tabular-nums ${
                  totals.carryOver >= 0 ? 'text-emerald-300' : 'text-rose-300'
                }`}>
                  {totals.carryOver >= 0 ? '+' : '-'}{formatWithPrivacy(formatAmount(Math.abs(totals.carryOver)), currencyInfo.symbol)}
                </span>
              </div>
            )}

            {/* Income vs Expense — Ratio Bar */}
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-100/80">
                  {t('balanceCard.available')}
                </span>
                <span className="text-[11px] font-semibold tabular-nums text-teal-100/90">
                  {roundedAvailablePercent}%
                </span>
              </div>
              <div className="relative h-2.5 rounded-full overflow-hidden bg-white/12 ring-1 ring-white/15">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-300/95 via-teal-300/90 to-cyan-300/90 transition-all duration-500"
                  style={{ width: `${availablePercent}%` }}
                />
                <div
                  className="absolute inset-y-0 right-0 bg-slate-100/25 transition-all duration-500"
                  style={{ width: `${100 - availablePercent}%` }}
                />
                {showDivider && (
                  <div
                    aria-hidden
                    className="absolute inset-y-px w-px bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.45)] transition-all duration-500"
                    style={{ left: `calc(${availablePercent}% - 0.5px)` }}
                  />
                )}
              </div>
            </div>

            {/* Income / Expense — Compact split layout */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Income */}
              <button
                type="button"
                onClick={() => onFilterChange(activeFilter === "income" ? "all" : "income")}
                className={`rounded-xl px-3 py-2.5 border transition-all active:scale-[0.98] text-left ${
                  activeFilter === "income"
                    ? "bg-white/20 border-white/35 ring-2 ring-white/35"
                    : "bg-white/10 border-white/10 hover:bg-white/15"
                } backdrop-blur-md`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 shrink-0 rounded-md bg-emerald-400/20 flex items-center justify-center">
                    <TrendingUp size={13} className="text-emerald-300" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-teal-100/85">
                    {t('balanceCard.income')}
                  </span>
                </div>

                <p title={incomeLabel} className={`${amountSizeClass(incomeLabel)} font-bold tabular-nums text-white leading-tight tracking-tight truncate`}>
                  {incomeLabel}
                </p>
              </button>

              {/* Expense */}
              <button
                type="button"
                onClick={() => onFilterChange(activeFilter === "expense" ? "all" : "expense")}
                className={`rounded-xl px-3 py-2.5 border transition-all active:scale-[0.98] text-left ${
                  activeFilter === "expense"
                    ? "bg-white/20 border-white/35 ring-2 ring-white/35"
                    : "bg-white/10 border-white/10 hover:bg-white/15"
                } backdrop-blur-md`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 shrink-0 rounded-md bg-rose-400/20 flex items-center justify-center">
                    <TrendingDown size={13} className="text-rose-300" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-rose-100/85">
                    {t('balanceCard.expenses')}
                  </span>
                </div>

                <p title={expenseLabel} className={`${amountSizeClass(expenseLabel)} font-bold tabular-nums text-white leading-tight tracking-tight truncate`}>
                  {expenseLabel}
                </p>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <BalanceBreakdownSheet
      open={showBreakdown}
      onClose={() => setShowBreakdown(false)}
    />
    </>
  );
}
