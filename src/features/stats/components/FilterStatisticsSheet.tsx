/**
 * FilterStatisticsSheet
 * Bottom sheet for selecting which categories to include/exclude from statistics
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { icons } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { useCurrency } from "@/features/currency";
import { kebabToPascal } from "@/shared/utils/string.utils";
import type { Category } from "@/types/budget.types";

type Props = {
  open: boolean;
  onClose: () => void;
  categoriesWithExpenses: (Category & { total: number })[];
};

const SHEET_HEIGHT = 600;
const DRAG_THRESHOLD = 0.3;

export default function FilterStatisticsSheet({
  open,
  onClose,
  categoriesWithExpenses,
}: Props) {
  const { t } = useTranslation("stats");
  const { formatAmount } = useCurrency();
  const excludedFromStats = useBudgetStore((s) => s.excludedFromStats);
  const toggleCategoryFromStats = useBudgetStore((s) => s.toggleCategoryFromStats);

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
              {t("dailyAverageModal.title")}
            </h3>

            {/* Info Banner */}
            <div className="mt-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                {t("dailyAverageModal.infoBanner")}
              </p>
            </div>
          </div>
        </div>

        {/* Categories List - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 space-y-2 min-h-0">
          {categoriesWithExpenses.map((category) => {
            const isIncluded = !(excludedFromStats ?? []).includes(category.id);
            const IconComponent = icons[kebabToPascal(category.icon) as keyof typeof icons];

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategoryFromStats(category.id)}
                className="w-full flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-800 p-3 active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
              >
                {/* Checkbox */}
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    isIncluded
                      ? "bg-emerald-500 border-emerald-500"
                      : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {isIncluded && (
                    <icons.Check className="h-3 w-3 text-white" strokeWidth={3} />
                  )}
                </div>

                {/* Category Icon */}
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: category.color + "20" }}
                >
                  {IconComponent && (
                    <IconComponent
                      className="h-4 w-4"
                      style={{ color: category.color }}
                    />
                  )}
                </div>

                {/* Category Name & Total */}
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    {category.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatAmount(category.total)}
                  </p>
                </div>
              </button>
            );
          })}
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
            {t("dailyAverageModal.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
