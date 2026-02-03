/**
 * ComparisonSheet
 * Bottom sheet showing month-over-month comparison
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle, icons } from "lucide-react";
import { monthLabel } from "@/services/dates.service";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrency } from "@/features/currency";

type Props = {
  open: boolean;
  onClose: () => void;
  isCurrentMonth: boolean;
  comparisonDay: number;
  prevMonth: string;
  prevMonthExpenses: number;
  currentMonthExpensesFiltered: number;
  selectedMonth: string;
  monthDiff: number;
  monthDiffPercent: number;
  excludedCategoriesCount: number;
};

const SHEET_HEIGHT = 500;
const DRAG_THRESHOLD = 0.3;

export default function ComparisonSheet({
  open,
  onClose,
  isCurrentMonth,
  comparisonDay,
  prevMonth,
  prevMonthExpenses,
  currentMonthExpensesFiltered,
  selectedMonth,
  monthDiff,
  monthDiffPercent,
  excludedCategoriesCount,
}: Props) {
  const { t } = useTranslation("stats");
  const { getLocale } = useLanguage();
  const { formatAmount } = useCurrency();

  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startYRef = useRef(0);

  // Show/hide animation
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setDragOffset(0);
      }, 300);
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

  // Touch events
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => handleDragStart(e.touches[0].clientY),
    [handleDragStart]
  );
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => handleDragMove(e.touches[0].clientY),
    [handleDragMove]
  );
  const handleTouchEnd = useCallback(() => handleDragEnd(), [handleDragEnd]);

  // Mouse events for handle
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => handleDragStart(e.clientY),
    [handleDragStart]
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const handleMouseUp = () => handleDragEnd();
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  if (!isVisible) return null;

  const sheetTranslate = isAnimating ? dragOffset : SHEET_HEIGHT;
  const backdropOpacity = isAnimating
    ? Math.max(0, 1 - dragOffset / SHEET_HEIGHT) * 0.5
    : 0;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black"
        onClick={onClose}
        style={{
          opacity: backdropOpacity,
          transition: isDragging ? "none" : "opacity 300ms ease-out",
        }}
        aria-label="Close"
      />

      {/* Sheet */}
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl"
        style={{
          transform: `translateY(${sheetTranslate}px)`,
          transition: isDragging
            ? "none"
            : "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Header - drag enabled only here */}
        <div
          className="flex-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag handle */}
          <div
            className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>

          {/* Header */}
          <div className="px-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {t("comparisonModal.title")}
          </h3>

          {/* Info Banner */}
          <div className="mt-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              {isCurrentMonth
                ? t("comparisonModal.infoBannerCurrent", { days: comparisonDay })
                : t("comparisonModal.infoBannerComplete")}
            </p>
          </div>

          {/* Categories excluded note */}
          {excludedCategoriesCount > 0 && (
            <div className="mt-3 rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
              <p className="text-xs text-gray-700 dark:text-gray-300">
                {t("dailyAverageBreakdownModal.categoriesExcluded", { count: excludedCategoriesCount })}
              </p>
            </div>
          )}
        </div>
        </div>

        {/* Content */}
        <div className="px-6 space-y-3">
          {/* Previous Month */}
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {monthLabel(prevMonth, getLocale())}
              {isCurrentMonth && ` ${t("comparisonModal.dayRange", { day: comparisonDay })}`}
            </p>
            <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-50">
              {formatAmount(prevMonthExpenses)}
            </p>
          </div>

          {/* Current Month */}
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {monthLabel(selectedMonth, getLocale())}
              {isCurrentMonth && ` ${t("comparisonModal.dayRange", { day: comparisonDay })}`}
            </p>
            <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-50">
              {formatAmount(currentMonthExpensesFiltered)}
            </p>
          </div>

          {/* Explanation */}
          <div className="flex items-start gap-2 rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
            {monthDiff > 0 ? (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500 dark:text-red-400 mt-0.5" />
            ) : monthDiff < 0 ? (
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500 dark:text-emerald-400 mt-0.5" />
            ) : (
              <icons.Minus className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500 mt-0.5" />
            )}
            <div>
              <p
                className={`text-sm font-medium mb-1 ${
                  monthDiff > 0
                    ? "text-red-600 dark:text-red-400"
                    : monthDiff < 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {monthDiff > 0 ? "+" : ""}
                {monthDiffPercent.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {monthDiff > 0
                  ? t("comparisonModal.spentMore", { percent: Math.abs(monthDiffPercent).toFixed(0) })
                  : monthDiff < 0
                  ? t("comparisonModal.spentLess", { percent: Math.abs(monthDiffPercent).toFixed(0) })
                  : t("comparisonModal.spentSame")}
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div
          className="px-6 pt-4 pb-6 bg-white dark:bg-gray-900"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-emerald-500 py-4 text-base font-semibold text-white transition-all active:scale-[0.98] hover:bg-emerald-600"
          >
            {t("comparisonModal.understood")}
          </button>
        </div>
      </div>
    </div>
  );
}
