import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "@/shared/components/layout/PageHeader";
import DatePicker from "@/shared/components/modals/DatePicker";
import { useBudgetStore } from "@/state/budget.store";
import { useCurrency } from "@/features/currency";
import { todayISO } from "@/services/dates.service";
import { useKeyboardDismiss } from "@/hooks/useKeyboardDismiss";
import { splitPayment } from "../services/debt.service";
import { formatNumberWithThousands, parseFormattedNumber } from "@/shared/utils/number.utils";
import { Calendar } from "lucide-react";

type ExtraStrategy = "reduce_term" | "reduce_installment";

export default function AddDebtPaymentPage() {
  const { t } = useTranslation("debts");
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { formatAmount, currencyInfo } = useCurrency();

  useKeyboardDismiss();

  const getDebtById = useBudgetStore((s) => s.getDebtById);
  const addDebtPayment = useBudgetStore((s) => s.addDebtPayment);

  const debt = id ? getDebtById(id) : undefined;

  const [amount, setAmount] = useState(debt ? formatNumberWithThousands(debt.minimumPayment) : "");
  const [date, setDate] = useState(todayISO());
  const [extraStrategy, setExtraStrategy] = useState<ExtraStrategy>("reduce_term");
  const [notes, setNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const amountNum = parseFormattedNumber(amount);

  // Dynamic font size based on amount length (same as AddEditTransactionPage)
  const amountFontSize = useMemo(() => {
    const len = amount.length;
    if (len <= 8) return "text-5xl";
    if (len <= 11) return "text-4xl";
    return "text-3xl";
  }, [amount]);

  const breakdown = useMemo(() => {
    if (!debt || !amount || amountNum <= 0) return null;
    return splitPayment(debt, amountNum);
  }, [debt, amount, amountNum]);

  if (!debt) {
    return (
      <div className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950">
        <PageHeader title={t("payment.title")} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Deuda no encontrada</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("es-CO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const canSave = amountNum > 0;
  const isFrench = debt.interestType === "french_amortization";
  const isAboveMinimum = amountNum > debt.minimumPayment;
  const showStrategySelector = isFrench && isAboveMinimum;

  const handleSave = () => {
    if (!canSave || !id) return;

    addDebtPayment({
      debtId: id,
      amount: amountNum,
      date,
      extraStrategy: showStrategySelector ? extraStrategy : undefined,
      notes: notes.trim() || undefined,
    });

    navigate(-1);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950">
      <PageHeader
        title={
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{t("payment.title")}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{debt.name}</p>
          </div>
        }
      />

      <div className="flex-1 px-4 pt-6 pb-32">
        {/* Amount */}
        <div className="mb-6 text-center">
          <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("payment.amount")}
          </p>
          <div className="flex items-center justify-center px-4">
            <span className={`${amountFontSize} font-semibold tracking-tight text-gray-900 dark:text-gray-50`}>
              {currencyInfo.symbol}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                setAmount(raw ? formatNumberWithThousands(Number(raw)) : "");
              }}
              placeholder="0"
              className={`w-auto min-w-[60px] flex-1 border-0 bg-transparent p-0 text-center ${amountFontSize} font-semibold tracking-tight placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-0 text-gray-900 dark:text-gray-50`}
            />
          </div>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            {t("detail.balance")}: {formatAmount(debt.currentBalance)}
          </p>
        </div>

        {/* Payment breakdown */}
        {breakdown && amountNum > 0 && (
          <div className="mb-4 rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t("payment.breakdown")}
            </p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t("payment.principal")}</span>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {formatAmount(breakdown.principal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t("payment.interest")}</span>
              <span className="text-sm font-semibold text-red-500 dark:text-red-400">
                {formatAmount(breakdown.interest)}
              </span>
            </div>
          </div>
        )}

        {/* Date */}
        <button
          type="button"
          onClick={() => setShowDatePicker(true)}
          className="mb-4 w-full rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm text-left"
        >
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("payment.date")}
          </label>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400 dark:text-gray-500" />
            <span className="text-base text-gray-900 dark:text-gray-50">
              {formatDate(date)}
            </span>
          </div>
        </button>

        {/* Extra payment strategy (french amortization only, above minimum) */}
        {showStrategySelector && (
          <div className="mb-4 rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("payment.extraStrategy")}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setExtraStrategy("reduce_term")}
                className={`flex-1 rounded-xl py-2.5 text-center transition-all ${
                  extraStrategy === "reduce_term"
                    ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                <p className="text-sm font-medium">{t("payment.reduceTerm")}</p>
                <p className={`text-[10px] mt-0.5 ${
                  extraStrategy === "reduce_term"
                    ? "text-gray-300 dark:text-gray-600"
                    : "text-gray-400 dark:text-gray-500"
                }`}>
                  {t("payment.reduceTermDesc")}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setExtraStrategy("reduce_installment")}
                className={`flex-1 rounded-xl py-2.5 text-center transition-all ${
                  extraStrategy === "reduce_installment"
                    ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                <p className="text-sm font-medium">{t("payment.reduceInstallment")}</p>
                <p className={`text-[10px] mt-0.5 ${
                  extraStrategy === "reduce_installment"
                    ? "text-gray-300 dark:text-gray-600"
                    : "text-gray-400 dark:text-gray-500"
                }`}>
                  {t("payment.reduceInstallmentDesc")}
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mb-4 rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("payment.notes")}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("payment.notesPlaceholder")}
            rows={2}
            className="w-full resize-none text-base text-gray-900 dark:text-gray-50 bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* Fixed save button */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-white dark:bg-gray-900 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="mx-auto max-w-xl px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="w-full rounded-2xl bg-gray-900 dark:bg-emerald-500 py-4 text-base font-semibold text-white transition-all active:scale-[0.98] disabled:bg-gray-300 dark:disabled:bg-gray-700"
          >
            {t("payment.save")}
          </button>
        </div>
      </div>

      <DatePicker
        open={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={date}
        onChange={setDate}
      />
    </div>
  );
}
