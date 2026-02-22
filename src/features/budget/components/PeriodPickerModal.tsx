import { useEffect, useState, useCallback, useRef } from "react";
import type { BudgetPeriod, BudgetPeriodType } from "@/types/budget.types";
import { getCurrentWeek, getCurrentMonth, getCurrentQuarter, getCurrentYear } from "../utils/period.utils";
import DatePicker from "@/shared/components/modals/DatePicker";
import { todayISO } from "@/services/dates.service";
import { useTranslation } from "react-i18next";

type PeriodPickerModalProps = {
  open: boolean;
  onClose: () => void;
  value: BudgetPeriod | null;
  onChange: (period: BudgetPeriod) => void;
};

const DRAG_THRESHOLD = 0.3;

export default function PeriodPickerModal({
  open,
  onClose,
  value,
  onChange,
}: PeriodPickerModalProps) {
  const { t, i18n } = useTranslation("budget");

  const PERIOD_TYPES: { value: BudgetPeriodType; label: string }[] = [
    { value: "week", label: t("periodPicker.week") },
    { value: "month", label: t("periodPicker.month") },
    { value: "quarter", label: t("periodPicker.quarter") },
    { value: "year", label: t("periodPicker.year") },
    { value: "custom", label: t("periodPicker.custom") },
  ];

  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);

  const [selectedType, setSelectedType] = useState<BudgetPeriodType>(
    value?.type || "month"
  );
  const [customStartDate, setCustomStartDate] = useState(
    value?.type === "custom" ? value.startDate : todayISO()
  );
  const [customEndDate, setCustomEndDate] = useState(
    value?.type === "custom" ? value.endDate : todayISO()
  );
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Dynamic sheet height based on whether custom dates are shown
  const SHEET_HEIGHT = selectedType === "custom" ? 520 : 340;

  // Handle open/close animation
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

  // Lock body scroll
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

  // Re-lock body scroll when DatePickers close
  useEffect(() => {
    if (open && !showStartDatePicker && !showEndDatePicker) {
      const timer = setTimeout(() => {
        document.body.style.overflow = "hidden";
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, showStartDatePicker, showEndDatePicker]);

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
    [isDragging, SHEET_HEIGHT]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > SHEET_HEIGHT * DRAG_THRESHOLD) {
      onClose();
    }
    setDragOffset(0);
  }, [isDragging, dragOffset, onClose, SHEET_HEIGHT]);

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

  // Mouse events for desktop
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

  const handleTypeChange = (type: BudgetPeriodType) => {
    setSelectedType(type);
  };

  const handleConfirm = () => {
    let period: BudgetPeriod;

    switch (selectedType) {
      case "week":
        period = getCurrentWeek();
        break;
      case "month":
        period = getCurrentMonth();
        break;
      case "quarter":
        period = getCurrentQuarter();
        break;
      case "year":
        period = getCurrentYear();
        break;
      case "custom":
        if (customStartDate > customEndDate) {
          return;
        }
        period = {
          type: "custom",
          startDate: customStartDate,
          endDate: customEndDate,
        };
        break;
    }

    onChange(period);
    onClose();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T12:00:00");
    const locale = i18n.language === 'es' ? 'es-CO' : i18n.language === 'en' ? 'en-US' : i18n.language === 'pt' ? 'pt-BR' : i18n.language === 'fr' ? 'fr-FR' : 'es-CO';
    return date.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getPeriodPreview = () => {
    switch (selectedType) {
      case "week": {
        const week = getCurrentWeek();
        return `${formatDate(week.startDate)} – ${formatDate(week.endDate)}`;
      }
      case "month": {
        const month = getCurrentMonth();
        return `${formatDate(month.startDate)} – ${formatDate(month.endDate)}`;
      }
      case "quarter": {
        const quarter = getCurrentQuarter();
        return `${formatDate(quarter.startDate)} – ${formatDate(quarter.endDate)}`;
      }
      case "year": {
        const year = getCurrentYear();
        return `${formatDate(year.startDate)} – ${formatDate(year.endDate)}`;
      }
      case "custom":
        return `${formatDate(customStartDate)} – ${formatDate(customEndDate)}`;
    }
  };

  const sheetTranslate = isAnimating ? dragOffset : SHEET_HEIGHT;
  const backdropOpacity = isAnimating
    ? Math.max(0, 1 - dragOffset / SHEET_HEIGHT) * 0.4
    : 0;

  return (
    <>
      <div className="fixed inset-0 z-[70]">
        {/* Backdrop */}
        <button
          type="button"
          className="absolute inset-0 bg-black"
          onClick={onClose}
          aria-label="Close"
          style={{
            opacity: backdropOpacity,
            transition: isDragging ? "none" : "opacity 300ms ease-out",
          }}
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
          {/* Drag handle */}
          <div
            className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>

          {/* Content */}
          <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            {/* Title */}
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t("periodPicker.title")}
            </h3>

            {/* Period Type Pills */}
            <div className="mb-4 flex flex-wrap gap-2">
              {PERIOD_TYPES.map((periodType) => (
                <button
                  key={periodType.value}
                  type="button"
                  onClick={() => handleTypeChange(periodType.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedType === periodType.value
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-700"
                  }`}
                >
                  {periodType.label}
                </button>
              ))}
            </div>

            {/* Custom Date Inputs */}
            {selectedType === "custom" && (
              <div className="mb-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowStartDatePicker(true)}
                  className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-left transition-colors active:bg-gray-100 dark:active:bg-gray-700"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                    {t("periodPicker.startDate")}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    {formatDate(customStartDate)}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEndDatePicker(true)}
                  className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-left transition-colors active:bg-gray-100 dark:active:bg-gray-700"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                    {t("periodPicker.endDate")}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    {formatDate(customEndDate)}
                  </p>
                </button>
              </div>
            )}

            {/* Period Preview */}
            <div className="mb-5 rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                {t("periodPicker.selectedPeriod")}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                {getPeriodPreview()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
              >
                {t("modal.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white active:bg-emerald-600 transition-colors"
              >
                {t("periodPicker.select")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DatePicker modals - Rendered outside sheet z-context */}
      {showStartDatePicker && (
        <DatePicker
          open={showStartDatePicker}
          onClose={() => setShowStartDatePicker(false)}
          value={customStartDate}
          onChange={(date) => {
            setCustomStartDate(date);
            setShowStartDatePicker(false);
          }}
        />
      )}
      {showEndDatePicker && (
        <DatePicker
          open={showEndDatePicker}
          onClose={() => setShowEndDatePicker(false)}
          value={customEndDate}
          onChange={(date) => {
            setCustomEndDate(date);
            setShowEndDatePicker(false);
          }}
        />
      )}
    </>
  );
}
