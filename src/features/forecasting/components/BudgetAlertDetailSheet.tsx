import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Wallet,
  Target,
  TrendingDown,
  CalendarClock,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { icons } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/features/currency";
import { useBudgetStore } from "@/state/budget.store";
import { kebabToPascal } from "@/shared/utils/string.utils";
import { todayISO } from "@/services/dates.service";
import type { BudgetPrediction } from "../types/forecasting.types";

type Props = {
  open: boolean;
  onClose: () => void;
  prediction: BudgetPrediction | null;
};

const SHEET_HEIGHT = 560;

export default function BudgetAlertDetailSheet({
  open,
  onClose,
  prediction,
}: Props) {
  const { t } = useTranslation("forecasting");
  const { formatAmount } = useCurrency();
  const categoriesFromStore = useBudgetStore((s) => s.categoryDefinitions);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);

  const categoryDefinitions = useMemo(
    () => categoriesFromStore ?? [],
    [categoriesFromStore]
  );

  const category = useMemo(
    () =>
      prediction
        ? categoryDefinitions.find((c) => c.id === prediction.categoryId)
        : null,
    [categoryDefinitions, prediction]
  );

  const IconComponent = category
    ? (icons[
        kebabToPascal(category.icon) as keyof typeof icons
      ] as React.ComponentType<{
        className?: string;
        style?: React.CSSProperties;
      }>)
    : null;

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

  // Calculate estimated exceed date (must be before early return to maintain hook order)
  const exceedDate = useMemo(() => {
    if (!prediction || prediction.daysUntilExceeded <= 0) return null;
    const today = new Date(todayISO() + "T12:00:00");
    today.setDate(today.getDate() + prediction.daysUntilExceeded);
    return today.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [prediction]);

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

  // Drag-to-close handlers
  const DRAG_THRESHOLD = 0.3;

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

  if (!isVisible || !prediction) return null;

  const remaining = prediction.budgetLimit - prediction.currentSpent;
  const isExceeded = prediction.daysUntilExceeded === 0;
  const isSafe = prediction.urgency === "safe";
  const percentage = Math.round(
    (prediction.currentSpent / prediction.budgetLimit) * 100
  );

  const urgencyColors = {
    high: {
      bg: "bg-red-50 dark:bg-red-900/20",
      badge: "bg-red-500",
      text: "text-red-600 dark:text-red-400",
      icon: "text-red-500",
    },
    medium: {
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      badge: "bg-yellow-500",
      text: "text-yellow-600 dark:text-yellow-400",
      icon: "text-yellow-500",
    },
    low: {
      bg: "bg-orange-50 dark:bg-orange-900/20",
      badge: "bg-orange-500",
      text: "text-orange-600 dark:text-orange-400",
      icon: "text-orange-500",
    },
    safe: {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      badge: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      icon: "text-emerald-500",
    },
  };

  const colors = urgencyColors[prediction.urgency];
  const backdropOpacity = isAnimating
    ? isDragging
      ? Math.max(0, 1 - dragOffset / SHEET_HEIGHT) * 0.5
      : 0.5
    : 0;
  const sheetTranslate = isAnimating ? dragOffset : SHEET_HEIGHT;

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
      >
        {/* Drag handle */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            {/* Category icon */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: category
                  ? category.color + "20"
                  : "#9CA3AF20",
              }}
            >
              {IconComponent ? (
                <IconComponent
                  className="h-5 w-5"
                  style={{ color: category?.color }}
                />
              ) : (
                <AlertTriangle className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                {category?.name || "—"}
              </h3>
              <span
                className={`inline-block rounded-full ${colors.badge} px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide`}
              >
                {t(`budgetAlerts.urgency.${prediction.urgency}`)}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className={`text-sm text-center ${colors.text} font-medium`}>
            {isExceeded
              ? t("budgetAlerts.detail.alreadyExceededDesc")
              : isSafe
                ? t("budgetAlerts.detail.safeDesc")
                : t("budgetAlerts.detail.exceedingInDesc", {
                    days: prediction.daysUntilExceeded,
                    count: prediction.daysUntilExceeded,
                  })}
          </p>
        </div>

        {/* Progress bar */}
        <div className="px-6 mb-4">
          <div className="h-3 rounded-full bg-gray-200/50 dark:bg-gray-700/50 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor:
                  prediction.urgency === "high"
                    ? "#EF4444"
                    : prediction.urgency === "medium"
                      ? "#EAB308"
                      : prediction.urgency === "safe"
                        ? "#10B981"
                        : "#F97316",
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {percentage}%
            </span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {formatAmount(prediction.budgetLimit)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          {/* Spent row */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 dark:bg-red-500/20">
                <Wallet size={18} className="text-red-500" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("budgetAlerts.detail.spent")}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              {formatAmount(prediction.currentSpent)}
            </span>
          </div>

          {/* Limit row */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                <Target size={18} className="text-blue-500" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("budgetAlerts.detail.limit")}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              {formatAmount(prediction.budgetLimit)}
            </span>
          </div>

          {/* Remaining row */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  remaining >= 0
                    ? "bg-emerald-500/10 dark:bg-emerald-500/20"
                    : "bg-red-500/10 dark:bg-red-500/20"
                }`}
              >
                <BarChart3
                  size={18}
                  className={
                    remaining >= 0 ? "text-emerald-500" : "text-red-500"
                  }
                />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("budgetAlerts.detail.remaining")}
              </span>
            </div>
            <span
              className={`text-sm font-semibold ${
                remaining >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {remaining < 0 ? "- " : ""}
              {formatAmount(Math.abs(remaining))}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-200 dark:border-gray-700 my-1" />

          {/* Daily burn rate row */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors.bg}`}>
                <TrendingDown size={18} className={colors.icon} />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("budgetAlerts.detail.dailyRate")}
              </span>
            </div>
            <span className={`text-sm font-semibold ${colors.text}`}>
              {formatAmount(prediction.dailyBurnRate)}
            </span>
          </div>

          {/* Projected total row */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 dark:bg-purple-500/20">
                <BarChart3 size={18} className="text-purple-500" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("budgetAlerts.detail.projectedTotal")}
              </span>
            </div>
            <span className={`text-sm font-semibold ${
              isSafe
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}>
              {formatAmount(prediction.projectedTotal)}
            </span>
          </div>

          {/* Exceed date row (only if not already exceeded) */}
          {!isExceeded && exceedDate && (
            <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors.bg}`}>
                  <CalendarClock size={18} className={colors.icon} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("budgetAlerts.detail.exceedDate")}
                </span>
              </div>
              <span className={`text-sm font-semibold ${colors.text}`}>
                {exceedDate}
              </span>
            </div>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-4 rounded-2xl bg-gray-900 dark:bg-gray-100 py-3.5 text-sm font-semibold text-white dark:text-gray-900 transition-colors hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-[0.98]"
          >
            {t("budgetAlerts.detail.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
