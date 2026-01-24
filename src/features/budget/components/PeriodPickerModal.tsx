import { useEffect, useState } from "react";
import { X } from "lucide-react";
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

export default function PeriodPickerModal({
  open,
  onClose,
  value,
  onChange,
}: PeriodPickerModalProps) {
  const { t } = useTranslation("budget");

  const PERIOD_TYPES: { value: BudgetPeriodType; label: string }[] = [
    { value: "week", label: t("periodPicker.week") },
    { value: "month", label: t("periodPicker.month") },
    { value: "quarter", label: t("periodPicker.quarter") },
    { value: "year", label: t("periodPicker.year") },
    { value: "custom", label: t("periodPicker.custom") },
  ];
  const [isVisible, setIsVisible] = useState(false);
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

  // Animation entrance
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
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

  if (!open) return null;

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
        // Validate custom dates
        if (customStartDate > customEndDate) {
          alert("La fecha de inicio no puede ser posterior a la fecha de fin");
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
    return date.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getPeriodPreview = () => {
    switch (selectedType) {
      case "week": {
        const week = getCurrentWeek();
        return `${formatDate(week.startDate)} - ${formatDate(week.endDate)}`;
      }
      case "month": {
        const month = getCurrentMonth();
        return `${formatDate(month.startDate)} - ${formatDate(month.endDate)}`;
      }
      case "quarter": {
        const quarter = getCurrentQuarter();
        return `${formatDate(quarter.startDate)} - ${formatDate(quarter.endDate)}`;
      }
      case "year": {
        const year = getCurrentYear();
        return `${formatDate(year.startDate)} - ${formatDate(year.endDate)}`;
      }
      case "custom":
        return `${formatDate(customStartDate)} - ${formatDate(customEndDate)}`;
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`relative mx-4 w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl transform transition-all duration-200 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {t("periodPicker.title")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Period Type Grid */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {PERIOD_TYPES.map((periodType) => (
            <button
              key={periodType.value}
              type="button"
              onClick={() => handleTypeChange(periodType.value)}
              className={`rounded-xl py-3 text-sm font-medium transition-colors ${
                selectedType === periodType.value
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {periodType.label}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs (only show if custom type selected) */}
        {selectedType === "custom" && (
          <div className="mb-4 space-y-3">
            {/* Start Date */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                {t("periodPicker.startDate")}
              </label>
              <button
                type="button"
                onClick={() => setShowStartDatePicker(true)}
                className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-left text-sm text-gray-900 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {formatDate(customStartDate)}
              </button>
            </div>

            {/* End Date */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                {t("periodPicker.endDate")}
              </label>
              <button
                type="button"
                onClick={() => setShowEndDatePicker(true)}
                className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-left text-sm text-gray-900 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {formatDate(customEndDate)}
              </button>
            </div>
          </div>
        )}

        {/* Period Preview */}
        <div className="mb-6 rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
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
            className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {t("modal.cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
          >
            {t("periodPicker.select")}
          </button>
        </div>
      </div>

      {/* DatePicker modals */}
      <DatePicker
        open={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        value={customStartDate}
        onChange={setCustomStartDate}
      />
      <DatePicker
        open={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        value={customEndDate}
        onChange={setCustomEndDate}
      />
    </div>
  );
}
