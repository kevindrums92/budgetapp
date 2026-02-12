import { useTranslation } from "react-i18next";
import { useCurrency } from "@/features/currency";
import type { DebtSummary } from "../services/debt.service";

type Props = {
  summary: DebtSummary;
};

export default function DebtSummaryHeader({ summary }: Props) {
  const { t } = useTranslation("debts");
  const { formatAmount } = useCurrency();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("es-CO", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="mb-4 rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm">
      {/* Total debt */}
      <div className="mb-3">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {t("page.totalDebt")}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          {formatAmount(summary.totalDebt)}
        </p>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {t("page.activeDebts")}
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            {summary.activeDebts}
          </p>
        </div>

        {summary.paidOffDebts > 0 && (
          <div className="flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {t("page.paidOff")}
            </p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {summary.paidOffDebts}
            </p>
          </div>
        )}

        {summary.totalInterestPaid > 0 && (
          <div className="flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {t("page.interestPaid")}
            </p>
            <p className="text-sm font-semibold text-red-500 dark:text-red-400">
              {formatAmount(summary.totalInterestPaid)}
            </p>
          </div>
        )}

        {summary.estimatedDebtFreeDate && (
          <div className="flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {t("page.estimatedFreeDate")}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              {formatDate(summary.estimatedDebtFreeDate)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
