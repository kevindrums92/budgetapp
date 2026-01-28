/**
 * DailyAverageBreakdownSheet
 * Bottom sheet showing daily average calculation breakdown
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/features/currency";

type Props = {
  open: boolean;
  onClose: () => void;
  totalForAverage: number;
  currentDay: number;
  isCurrentMonth: boolean;
  dailyAverage: number;
  daysInMonth: number;
  excludedCategoriesCount: number;
};

const SHEET_HEIGHT = 600;
const DRAG_THRESHOLD = 0.3;

export default function DailyAverageBreakdownSheet({
  open,
  onClose,
  totalForAverage,
  currentDay,
  isCurrentMonth,
  dailyAverage,
  daysInMonth,
  excludedCategoriesCount,
}: Props) {
  const { t } = useTranslation("stats");
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
        className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl"
        style={{
          maxHeight: `${SHEET_HEIGHT}px`,
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
              {t("dailyAverageBreakdownModal.title")}
            </h3>

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

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 space-y-4 min-h-0">
          {/* How it's calculated */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-2">
              {t("dailyAverageBreakdownModal.howCalculated")}
            </p>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              {t("dailyAverageBreakdownModal.formula")}
            </p>
          </div>

          {/* Calculation breakdown */}
          <div className="space-y-3">
            {/* Total Spent */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t("dailyAverageBreakdownModal.totalSpent")}
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                {formatAmount(totalForAverage)}
              </span>
            </div>

            {/* Days in Month / Days Elapsed */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isCurrentMonth
                  ? t("dailyAverageBreakdownModal.daysElapsed")
                  : t("dailyAverageBreakdownModal.daysInMonth")}
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                {currentDay}
              </span>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Daily Average */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                {t("dailyAverageBreakdownModal.average")}
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatAmount(dailyAverage)}
              </span>
            </div>
          </div>

          {/* Projection */}
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-4">
            <p className="text-xs font-medium text-emerald-900 dark:text-emerald-300 mb-1">
              {t("dailyAverageBreakdownModal.projection")}
            </p>
            <p className="text-xs text-emerald-800 dark:text-emerald-400 mb-2">
              {t("dailyAverageBreakdownModal.projectionText")}
            </p>
            <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
              {formatAmount(dailyAverage * daysInMonth)}{" "}
              <span className="text-sm font-normal">{t("dailyAverageBreakdownModal.thisMonth")}</span>
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div
          className="px-6 pt-4 bg-white dark:bg-gray-900"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-emerald-500 py-4 text-base font-semibold text-white transition-all active:scale-[0.98] hover:bg-emerald-600"
          >
            {t("dailyAverageBreakdownModal.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
