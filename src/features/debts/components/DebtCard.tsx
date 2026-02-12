import { CreditCard, Landmark, ShoppingBag, MoreHorizontal, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/features/currency";
import type { Debt } from "@/types/budget.types";
import DebtProgressBar from "./DebtProgressBar";

const DEBT_ICONS: Record<Debt["type"], React.ElementType> = {
  credit_card: CreditCard,
  personal_loan: Landmark,
  installment: ShoppingBag,
  other: MoreHorizontal,
};

const DEBT_COLORS: Record<Debt["type"], string> = {
  credit_card: "#EF4444",
  personal_loan: "#3B82F6",
  installment: "#F59E0B",
  other: "#6B7280",
};

type Props = {
  debt: Debt;
  onClick: () => void;
};

export default function DebtCard({ debt, onClick }: Props) {
  const { t } = useTranslation("debts");
  const { formatAmount } = useCurrency();
  const Icon = DEBT_ICONS[debt.type];
  const color = DEBT_COLORS[debt.type];
  const isPaidOff = debt.status === "paid_off";
  const percentagePaid = debt.originalBalance > 0
    ? ((debt.originalBalance - debt.currentBalance) / debt.originalBalance) * 100
    : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm transition-colors active:bg-gray-50 dark:active:bg-gray-800"
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: color + "20" }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
              {debt.name}
            </p>
            {isPaidOff && (
              <span className="shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                {t("detail.paidOffBadge")}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t(`types.${debt.type}`)}
          </p>
        </div>

        {/* Amount */}
        <div className="shrink-0 text-right">
          <p className={`text-sm font-semibold ${isPaidOff ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-gray-50"}`}>
            {formatAmount(debt.currentBalance)}
          </p>
          {!isPaidOff && debt.annualInterestRate > 0 && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              {debt.annualInterestRate}% EA
            </p>
          )}
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {Math.round(percentagePaid)}% {t("detail.paid").toLowerCase()}
          </span>
          {debt.minimumPayment > 0 && !isPaidOff && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              Min: {formatAmount(debt.minimumPayment)}
            </span>
          )}
        </div>
        <DebtProgressBar percentage={percentagePaid} isPaidOff={isPaidOff} />
      </div>
    </button>
  );
}
