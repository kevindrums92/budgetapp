import { useState, useEffect } from "react";
import { X, CalendarDays, TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import FullscreenLayout from "@/shared/components/layout/FullscreenLayout";
import { useCurrency } from "@/features/currency";
import { monthLabel } from "@/services/dates.service";
import { useBudgetStore } from "@/state/budget.store";
import { markMonthReviewShown } from "@/features/monthReview/services/monthReview.service";

type MonthReviewModalProps = {
  open: boolean;
  onClose: () => void;
  previousMonth: string; // YYYY-MM
  currentMonth: string;  // YYYY-MM
  summary: {
    income: number;
    expense: number;
    balance: number;
  };
};

export default function MonthReviewModal({
  open,
  onClose,
  previousMonth,
  currentMonth,
  summary,
}: MonthReviewModalProps) {
  const { t } = useTranslation("monthReview");
  const { i18n } = useTranslation();
  const { formatAmount } = useCurrency();
  const setCarryOverBalance = useBudgetStore((s) => s.setCarryOverBalance);
  const dismissMonthReview = useBudgetStore((s) => s.dismissMonthReview);

  const [isVisible, setIsVisible] = useState(false);

  const locale = i18n.language === "en" ? "en-US" : i18n.language === "pt" ? "pt-BR" : i18n.language === "fr" ? "fr-FR" : "es-CO";
  const currentMonthLabel = monthLabel(currentMonth, locale);
  const previousMonthLabel = monthLabel(previousMonth, locale);

  const isNegative = summary.balance < 0;
  const balanceFormatted = formatAmount(Math.abs(summary.balance));

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  function handleAccept() {
    setCarryOverBalance(currentMonth, {
      amount: summary.balance,
      fromMonth: previousMonth,
      acceptedAt: Date.now(),
    });
    markMonthReviewShown();
    onClose();
  }

  function handleDecline() {
    dismissMonthReview(currentMonth);
    markMonthReviewShown();
    onClose();
  }

  return (
    <div
      className={`fixed inset-0 z-[85] transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <FullscreenLayout
        headerRight={
          <button
            type="button"
            onClick={handleDecline}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 active:bg-gray-100 dark:active:bg-gray-800"
            aria-label="Close"
          >
            <X size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
        }
        ctaButton={
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleAccept}
              className="w-full rounded-2xl bg-gray-900 dark:bg-emerald-500 py-4 text-base font-bold text-white transition-all active:scale-[0.98]"
            >
              {isNegative
                ? t("actions.acceptNegative")
                : t("actions.acceptPositive", { amount: balanceFormatted })}
            </button>
            <button
              type="button"
              onClick={handleDecline}
              className="w-full rounded-2xl bg-gray-100 dark:bg-gray-800 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-all active:scale-[0.98]"
            >
              {t("actions.decline")}
            </button>
          </div>
        }
      >
        {/* Hero Icon */}
        <div className="mb-6 flex justify-center pt-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#18B7B0]/10">
            <CalendarDays size={40} className="text-[#18B7B0]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-2 text-center text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
          {t("title", { month: currentMonthLabel })}
        </h1>
        <p className="mb-8 text-center text-base leading-relaxed text-gray-500 dark:text-gray-400">
          {t("subtitle", { previousMonth: previousMonthLabel })}
        </p>

        {/* Summary Card */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
          {/* Income row */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                <TrendingUp size={18} className="text-emerald-500" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("summary.income")}
              </span>
            </div>
            <span className="text-sm font-bold tabular-nums text-emerald-600">
              +{formatAmount(summary.income)}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Expense row */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10">
                <TrendingDown size={18} className="text-rose-500" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("summary.expense")}
              </span>
            </div>
            <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">
              -{formatAmount(summary.expense)}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Balance row */}
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              {t("summary.balance")}
            </span>
            <span
              className={`text-lg font-bold tabular-nums ${
                isNegative
                  ? "text-red-500"
                  : "text-emerald-600"
              }`}
            >
              {isNegative ? "-" : "+"}{balanceFormatted}
            </span>
          </div>
        </div>

        {/* Question */}
        <p className="mt-8 text-center text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {isNegative
            ? t("question.negative", { amount: balanceFormatted, month: currentMonthLabel })
            : t("question.positive", { month: currentMonthLabel })}
        </p>
      </FullscreenLayout>
    </div>
  );
}
