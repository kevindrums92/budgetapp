import { useState, useMemo } from "react";
import { Wallet, ChevronRight, Calculator, EyeOff, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBudgetStore } from "@/state/budget.store";
import { useCurrency } from "@/features/currency";
import { calculateSafeToSpend } from "../services/safeToSpend.service";
import SafeToSpendBreakdownSheet from "./SafeToSpendBreakdownSheet";

type Props = {
  onDismiss?: () => void;
};

export default function SafeToSpendCard({ onDismiss }: Props) {
  const { t } = useTranslation("forecasting");
  const { formatAmount } = useCurrency();
  const [showBreakdown, setShowBreakdown] = useState(false);

  const transactions = useBudgetStore((s) => s.transactions);
  const budgets = useBudgetStore((s) => s.budgets);
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);

  const data = useMemo(
    () => calculateSafeToSpend(transactions, budgets, selectedMonth),
    [transactions, budgets, selectedMonth]
  );

  const dailyBudgetInfo = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    if (selectedMonth !== currentMonthKey) return null;

    const daysRemaining = daysInMonth - today.getDate();
    if (daysRemaining <= 0) return null;

    const dailyBudget = data.safeToSpend / daysRemaining;
    if (dailyBudget <= 0) return null;

    return { dailyBudget, daysRemaining };
  }, [data.safeToSpend, selectedMonth]);

  const isPositive = data.safeToSpend >= 0;

  return (
    <>
      <div className="mx-auto max-w-xl px-4 mt-4">
        <button
          type="button"
          onClick={() => setShowBreakdown(true)}
          className={`w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${
            isPositive
              ? "bg-white dark:bg-gray-900 shadow-sm"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50"
          }`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            {isPositive ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20">
                <Wallet size={18} className="text-emerald-500" />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 dark:bg-red-500/20">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
            )}
            <p className="flex-1 text-sm font-semibold text-gray-900 dark:text-gray-50">
              {isPositive ? t("safeToSpend.title") : t("safeToSpend.deficit")}
            </p>
            <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
          </div>

          {/* Amount */}
          <p
            className={`text-2xl font-bold tracking-tight ${
              isPositive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {isPositive ? "" : "- "}{formatAmount(Math.abs(data.safeToSpend))}
          </p>

          {/* Footer: daily budget info OR deficit hint + Hide button */}
          <div className={`mt-3 flex items-center pt-3 ${
            isPositive
              ? "border-t border-gray-100 dark:border-gray-800"
              : "border-t border-red-200/50 dark:border-red-800/30"
          }`}>
            {isPositive ? (
              dailyBudgetInfo ? (
                <div className="flex flex-1 items-center gap-2">
                  <Calculator size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("safeToSpend.dailyBudget", { amount: formatAmount(dailyBudgetInfo.dailyBudget) })}
                    {" · "}
                    {t("safeToSpend.daysRemaining", { count: dailyBudgetInfo.daysRemaining })}
                  </p>
                </div>
              ) : (
                <div className="flex-1" />
              )
            ) : (
              <p className="flex-1 text-xs text-red-600/70 dark:text-red-400/70">
                {t("safeToSpend.deficitHint")}
              </p>
            )}

            {onDismiss && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onDismiss();
                  }
                }}
                className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 ml-3 shrink-0"
              >
                <EyeOff size={12} />
                <span>{t("safeToSpend.hide")}</span>
              </span>
            )}
          </div>
        </button>
      </div>

      <SafeToSpendBreakdownSheet
        open={showBreakdown}
        onClose={() => setShowBreakdown(false)}
        data={data}
      />
    </>
  );
}
