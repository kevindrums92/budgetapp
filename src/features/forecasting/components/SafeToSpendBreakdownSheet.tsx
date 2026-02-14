import { useState, useEffect } from "react";
import { Minus, Receipt, PiggyBank, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/features/currency";
import type { SafeToSpendBreakdown } from "../types/forecasting.types";

type Props = {
  open: boolean;
  onClose: () => void;
  data: SafeToSpendBreakdown;
};

const SHEET_HEIGHT = 520;

export default function SafeToSpendBreakdownSheet({
  open,
  onClose,
  data,
}: Props) {
  const { t } = useTranslation("forecasting");
  const { formatAmount } = useCurrency();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!isVisible) return null;

  const isPositive = data.safeToSpend >= 0;
  const backdropOpacity = isAnimating ? 0.5 : 0;
  const sheetTranslate = isAnimating ? 0 : SHEET_HEIGHT;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black"
        onClick={onClose}
        style={{ opacity: backdropOpacity, transition: "opacity 300ms" }}
        aria-label="Close"
      />

      {/* Sheet */}
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl"
        style={{
          transform: `translateY(${sheetTranslate}px)`,
          transition: "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 text-center mb-1">
            {t("safeToSpend.breakdown")}
          </h3>
        </div>

        {/* Content */}
        <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          {/* Balance row */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                <Wallet size={18} className="text-blue-500" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("safeToSpend.currentBalance")}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              {formatAmount(data.currentBalance)}
            </span>
          </div>

          {/* Upcoming bills row */}
          <div className="flex items-center justify-between py-3.5 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 dark:bg-orange-500/20">
                <Receipt size={18} className="text-orange-500" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("safeToSpend.upcomingBills")}
              </span>
            </div>
            <span className="text-sm font-semibold text-red-500">
              - {formatAmount(data.upcomingBillsTotal)}
            </span>
          </div>

          {/* Bill items */}
          {data.upcomingBills.length > 0 && (
            <div className="ml-12 space-y-2 pb-2">
              {data.upcomingBills.slice(0, 5).map((bill, idx) => (
                <div
                  key={`${bill.name}-${idx}`}
                  className="flex items-center justify-between"
                >
                  <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[160px]">
                    {bill.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatAmount(bill.amount)}
                  </span>
                </div>
              ))}
              {data.upcomingBills.length > 5 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  +{data.upcomingBills.length - 5} more
                </p>
              )}
            </div>
          )}

          {data.upcomingBills.length === 0 && (
            <div className="ml-12 pb-2">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {t("safeToSpend.noBills")}
              </p>
            </div>
          )}

          {/* Budget reserves row */}
          <div className="flex items-center justify-between py-3.5 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 dark:bg-purple-500/20">
                <PiggyBank size={18} className="text-purple-500" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("safeToSpend.budgetReserves")}
              </span>
            </div>
            <span className="text-sm font-semibold text-red-500">
              - {formatAmount(data.budgetReserves)}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-200 dark:border-gray-700 my-2" />

          {/* Result */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                isPositive
                  ? "bg-emerald-500/10 dark:bg-emerald-500/20"
                  : "bg-red-500/10 dark:bg-red-500/20"
              }`}>
                <Minus size={18} className={isPositive ? "text-emerald-500" : "text-red-500"} />
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                {t("safeToSpend.result")}
              </span>
            </div>
            <span
              className={`text-lg font-bold ${
                isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isPositive ? "" : "- "}{formatAmount(Math.abs(data.safeToSpend))}
            </span>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-4 rounded-2xl bg-emerald-500 dark:bg-emerald-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.98]"
          >
            {t("safeToSpend.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
