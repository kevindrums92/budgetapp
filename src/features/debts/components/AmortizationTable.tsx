import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/features/currency";
import type { AmortizationRow } from "@/types/budget.types";

type Props = {
  rows: AmortizationRow[];
  maxVisibleRows?: number;
};

export default function AmortizationTable({ rows, maxVisibleRows = 6 }: Props) {
  const { t } = useTranslation("debts");
  const { formatAmount } = useCurrency();
  const [expanded, setExpanded] = useState(false);

  if (rows.length === 0) return null;

  const visibleRows = expanded ? rows : rows.slice(0, maxVisibleRows);
  const hasMore = rows.length > maxVisibleRows;

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">
              {t("detail.month")}
            </th>
            <th className="px-3 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400">
              {t("detail.paymentCol")}
            </th>
            <th className="px-3 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400">
              {t("detail.principalCol")}
            </th>
            <th className="px-3 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400">
              {t("detail.interestCol")}
            </th>
            <th className="px-3 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400">
              {t("detail.balanceCol")}
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr
              key={row.month}
              className="border-b border-gray-50 dark:border-gray-800/50 last:border-0"
            >
              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.month}</td>
              <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-50 font-medium">
                {formatAmount(row.payment)}
              </td>
              <td className="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400">
                {formatAmount(row.principal)}
              </td>
              <td className="px-3 py-2 text-right text-red-500 dark:text-red-400">
                {formatAmount(row.interest)}
              </td>
              <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                {formatAmount(row.balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-center gap-1 border-t border-gray-100 dark:border-gray-800 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors active:bg-gray-50 dark:active:bg-gray-800"
        >
          {expanded ? (
            <>
              <ChevronUp size={14} />
              Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              Ver {rows.length - maxVisibleRows} meses más
            </>
          )}
        </button>
      )}
    </div>
  );
}
