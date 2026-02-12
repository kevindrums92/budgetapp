import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, AlertTriangle, Trash2 } from "lucide-react";
import PageHeader from "@/shared/components/layout/PageHeader";
import { useBudgetStore } from "@/state/budget.store";
import { useCurrency } from "@/features/currency";
import { calculateDebtProgress } from "../services/debt.service";
import { projectCompoundPayoff, projectFrenchAmortization, isUnpayable } from "../services/interest.service";
import DebtProgressBar from "../components/DebtProgressBar";
import PaymentHistoryList from "../components/PaymentHistoryList";
import AmortizationTable from "../components/AmortizationTable";
import { estimatePayoffDate } from "../services/debt.service";

export default function DebtDetailPage() {
  const { t } = useTranslation("debts");
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { formatAmount } = useCurrency();

  const debt = useBudgetStore((s) => s.debts.find((d) => d.id === id));
  const deleteDebt = useBudgetStore((s) => s.deleteDebt);
  const deleteDebtPayment = useBudgetStore((s) => s.deleteDebtPayment);
  const debtPayments = useBudgetStore((s) => s.debtPayments);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const payments = useMemo(() => debtPayments.filter((p) => p.debtId === id), [debtPayments, id]);

  const progress = useMemo(() => {
    if (!debt) return null;
    return calculateDebtProgress(debt, payments);
  }, [debt, payments]);

  const amortizationRows = useMemo(() => {
    if (!debt || debt.status === "paid_off") return [];
    if (debt.interestType === "french_amortization" && debt.remainingInstallments) {
      return projectFrenchAmortization(
        debt.currentBalance,
        debt.annualInterestRate,
        debt.remainingInstallments
      );
    }
    return projectCompoundPayoff(
      debt.currentBalance,
      debt.annualInterestRate,
      debt.minimumPayment
    );
  }, [debt]);

  const payoffDate = useMemo(() => {
    if (!debt) return null;
    return estimatePayoffDate(debt);
  }, [debt]);

  const unpayable = useMemo(() => {
    if (!debt || debt.annualInterestRate === 0) return false;
    return isUnpayable(debt.currentBalance, debt.annualInterestRate, debt.minimumPayment);
  }, [debt]);

  if (!debt || !progress) {
    return (
      <div className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950">
        <PageHeader title="" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Deuda no encontrada</p>
        </div>
      </div>
    );
  }

  const isPaidOff = debt.status === "paid_off";

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("es-CO", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950">
      <PageHeader
        title={debt.name}
        rightActions={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Trash2 className="h-5 w-5 text-red-500 dark:text-red-400" />
            </button>
            <button
              type="button"
              onClick={() => navigate(`/debts/${id}/edit`)}
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Pencil className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        }
      />

      <div className="flex-1 px-4 pt-6 pb-8">
        {/* Paid off badge */}
        {isPaidOff && (
          <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 border border-emerald-200 dark:border-emerald-800 text-center">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {t("detail.paidOffBadge")}
            </p>
          </div>
        )}

        {/* Unpayable warning */}
        {unpayable && !isPaidOff && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 p-3 border border-red-200 dark:border-red-800 flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500 dark:text-red-400" />
            <p className="text-xs text-red-700 dark:text-red-400">
              {t("detail.unpayable")}
            </p>
          </div>
        )}

        {/* Balance & progress */}
        <div className="mb-4 rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm">
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("detail.balance")}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              {formatAmount(debt.currentBalance)}
            </p>
          </div>

          <DebtProgressBar percentage={progress.percentagePaid} isPaidOff={isPaidOff} />

          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {t("detail.paid")}
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                {formatAmount(progress.totalPaid)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {t("detail.interestPaid")}
              </p>
              <p className="text-sm font-semibold text-red-500 dark:text-red-400">
                {formatAmount(progress.totalInterestPaid)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {t("detail.paymentsCount")}
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                {progress.paymentsCount}
              </p>
            </div>
            {payoffDate && !isPaidOff && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  {t("detail.estimatedPayoff")}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                  {formatDate(payoffDate)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Register payment button */}
        {!isPaidOff && (
          <button
            type="button"
            onClick={() => navigate(`/debts/${id}/payment`)}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 dark:bg-emerald-500 py-4 text-base font-semibold text-white transition-all active:scale-[0.98]"
          >
            <Plus size={20} />
            {t("detail.registerPayment")}
          </button>
        )}

        {/* Amortization table */}
        {amortizationRows.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t("detail.amortizationTable")}
            </h3>
            <AmortizationTable rows={amortizationRows} />
          </div>
        )}

        {/* Payment history */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t("detail.paymentHistory")}
          </h3>
          <PaymentHistoryList payments={payments} onDelete={deleteDebtPayment} />
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t("form.deleteConfirmTitle")}
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {t("form.deleteConfirmMessage", { name: debt.name })}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {t("form.cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (id) {
                    deleteDebt(id);
                    navigate("/debts", { replace: true });
                  }
                }}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                {t("form.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
