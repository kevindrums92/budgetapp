import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { useCurrency } from "@/features/currency";
import type { DebtPayment } from "@/types/budget.types";

type Props = {
  payments: DebtPayment[];
  onDelete?: (id: string) => void;
};

export default function PaymentHistoryList({ payments, onDelete }: Props) {
  const { t } = useTranslation("debts");
  const { formatAmount } = useCurrency();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sorted = [...payments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const paymentToDelete = confirmDeleteId
    ? sorted.find((p) => p.id === confirmDeleteId)
    : null;

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("detail.noPayments")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {sorted.map((payment) => (
          <div
            key={payment.id}
            className="rounded-xl bg-white dark:bg-gray-900 p-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                  {formatAmount(payment.amount)}
                  {payment.extraStrategy && (
                    <span className="ml-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      {payment.extraStrategy === "reduce_term"
                        ? t("payment.reduceTerm")
                        : t("payment.reduceInstallment")}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(payment.date)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    {t("payment.principal")}: {formatAmount(payment.principalPortion)}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    {t("payment.interest")}: {formatAmount(payment.interestPortion)}
                  </p>
                </div>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(payment.id)}
                    className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Trash2 size={14} className="text-gray-400 dark:text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation modal */}
      {confirmDeleteId && paymentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmDeleteId(null)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t("payment.deleteConfirmTitle")}
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {t("payment.deleteConfirmMessage", { amount: formatAmount(paymentToDelete.amount) })}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {t("payment.cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete?.(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                {t("payment.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
