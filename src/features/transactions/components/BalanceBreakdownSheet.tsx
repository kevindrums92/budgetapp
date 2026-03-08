import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { TrendingUp, TrendingDown, ArrowDownLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBudgetStore } from "@/state/budget.store";
import { useCurrency } from "@/features/currency";
import { usePrivacy } from "@/features/privacy";
import {
  getPreviousMonth,
  calculatePreviousMonthBalance,
} from "@/features/monthReview/services/monthReview.service";

type Props = {
  open: boolean;
  onClose: () => void;
};

const SHEET_HEIGHT = 480;
const DRAG_THRESHOLD = 0.3;

export default function BalanceBreakdownSheet({ open, onClose }: Props) {
  const { t } = useTranslation("home");
  const { formatAmount, currencyInfo } = useCurrency();
  const { formatWithFullPrivacy } = usePrivacy();
  const fmtFull = (v: number) =>
    formatWithFullPrivacy(formatAmount(v), currencyInfo.symbol);

  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const transactions = useBudgetStore((s) => s.transactions);
  const carryOverBalances = useBudgetStore((s) => s.carryOverBalances);
  const setCarryOverBalance = useBudgetStore((s) => s.setCarryOverBalance);
  const removeCarryOverBalance = useBudgetStore((s) => s.removeCarryOverBalance);
  const dismissMonthReview = useBudgetStore((s) => s.dismissMonthReview);
  const undismissMonthReview = useBudgetStore((s) => s.undismissMonthReview);

  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);

  // Compute balance breakdown
  const breakdown = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const tx of transactions) {
      if (tx.date.slice(0, 7) !== selectedMonth) continue;
      if (tx.type === "income") income += tx.amount;
      else expense += tx.amount;
    }

    const carryOver = carryOverBalances?.[selectedMonth]?.amount ?? 0;
    const balance = carryOver + income - expense;

    return { income, expense, carryOver, balance };
  }, [transactions, selectedMonth, carryOverBalances]);

  // Calculate what carry-over WOULD be if toggled on
  const previousMonthBalance = useMemo(() => {
    const prevMonth = getPreviousMonth(selectedMonth);
    const prevCarryOver = carryOverBalances?.[prevMonth]?.amount ?? 0;
    const summary = calculatePreviousMonthBalance(
      transactions,
      prevMonth,
      prevCarryOver
    );
    return { amount: summary.balance, fromMonth: prevMonth };
  }, [transactions, selectedMonth, carryOverBalances]);

  const hasCarryOver = breakdown.carryOver !== 0;
  const hasPreviousData = previousMonthBalance.amount !== 0;

  const handleToggleCarryOver = () => {
    if (hasCarryOver) {
      // Turn OFF: remove carry-over and dismiss
      removeCarryOverBalance(selectedMonth);
      dismissMonthReview(selectedMonth);
    } else {
      // Turn ON: set carry-over from previous month
      setCarryOverBalance(selectedMonth, {
        amount: previousMonthBalance.amount,
        fromMonth: previousMonthBalance.fromMonth,
        acceptedAt: Date.now(),
      });
      undismissMonthReview(selectedMonth);
    }
  };

  // Animation
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

  // Body scroll lock
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

  // Drag handlers
  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    startYRef.current = clientY;
  }, []);

  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!isDragging) return;
      const diff = clientY - startYRef.current;
      if (diff > 0) {
        setDragOffset(Math.min(diff, SHEET_HEIGHT));
      } else {
        setDragOffset(0);
      }
    },
    [isDragging]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > SHEET_HEIGHT * DRAG_THRESHOLD) {
      onClose();
    }
    setDragOffset(0);
  }, [isDragging, dragOffset, onClose]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => handleDragStart(e.touches[0].clientY),
    [handleDragStart]
  );
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => handleDragMove(e.touches[0].clientY),
    [handleDragMove]
  );
  const handleTouchEnd = useCallback(() => handleDragEnd(), [handleDragEnd]);
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => handleDragStart(e.clientY),
    [handleDragStart]
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const onUp = () => handleDragEnd();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  if (!isVisible) return null;

  const backdropOpacity = isAnimating ? 0.5 : 0;
  const sheetTranslate = isAnimating ? dragOffset : SHEET_HEIGHT;
  const isPositive = breakdown.balance >= 0;

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
        ref={sheetRef}
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl"
        style={{
          transform: `translateY(${sheetTranslate}px)`,
          transition: isDragging
            ? "none"
            : "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 text-center mb-1">
            {t("balanceCard.breakdown")}
          </h3>
        </div>

        {/* Content */}
        <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          {/* Income row */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20">
                <TrendingUp size={18} className="text-emerald-500" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("balanceCard.income")}
              </span>
            </div>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              + {fmtFull(breakdown.income)}
            </span>
          </div>

          {/* Expense row */}
          <div className="flex items-center justify-between py-3.5 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 dark:bg-rose-500/20">
                <TrendingDown size={18} className="text-rose-500" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("balanceCard.expenses")}
              </span>
            </div>
            <span className="text-sm font-semibold text-red-500">
              - {fmtFull(breakdown.expense)}
            </span>
          </div>

          {/* Carry-over row with toggle */}
          {hasPreviousData && (
            <div className="flex items-center justify-between py-3.5 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                  <ArrowDownLeft size={18} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                    {t("balanceCard.carryOver")}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {t("balanceCard.carryOverToggle")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-3">
                {hasCarryOver && (
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      breakdown.carryOver >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-500"
                    }`}
                  >
                    {breakdown.carryOver >= 0 ? "+" : "-"}{" "}
                    {fmtFull(Math.abs(breakdown.carryOver))}
                  </span>
                )}

                {/* Toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleCarryOver();
                  }}
                  className={`relative h-8 w-14 shrink-0 rounded-full transition-all duration-200 ${
                    hasCarryOver ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                      hasCarryOver ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t-2 border-gray-200 dark:border-gray-700 my-2" />

          {/* Result */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  isPositive
                    ? "bg-emerald-500/10 dark:bg-emerald-500/20"
                    : "bg-red-500/10 dark:bg-red-500/20"
                }`}
              >
                <span
                  className={`text-lg font-bold ${
                    isPositive ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  =
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                {t("balanceCard.result")}
              </span>
            </div>
            <span
              className={`text-lg font-bold ${
                isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isPositive ? "" : "- "}
              {fmtFull(Math.abs(breakdown.balance))}
            </span>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-4 rounded-2xl bg-gray-900 dark:bg-gray-700 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:hover:bg-gray-600 active:scale-[0.98]"
          >
            {t("balanceCard.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
