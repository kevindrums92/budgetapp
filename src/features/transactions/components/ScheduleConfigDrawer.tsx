/**
 * ScheduleConfigDrawer - Modal para configurar scheduled transactions
 * Permite al usuario configurar frecuencia, intervalo, fecha de inicio/fin
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Calendar } from "lucide-react";
import type { Schedule, ScheduleFrequency } from "@/types/budget.types";
import { todayISO } from "@/services/dates.service";
import DatePicker from "@/shared/components/modals/DatePicker";

type Props = {
  open: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  transactionDate: string;
  onSave: (schedule: Schedule | null) => void;
};

export default function ScheduleConfigDrawer({ open, onClose, schedule, transactionDate, onSave }: Props) {
  const { t } = useTranslation("transactions");
  const [isVisible, setIsVisible] = useState(false);
  const [frequency, setFrequency] = useState<ScheduleFrequency>(schedule?.frequency ?? "monthly");
  const [interval, setInterval] = useState(schedule?.interval ?? 1);
  const [hasEndDate, setHasEndDate] = useState(Boolean(schedule?.endDate));
  const [endDate, setEndDate] = useState(schedule?.endDate ?? "");
  const [dayOfWeek, setDayOfWeek] = useState(schedule?.dayOfWeek ?? new Date(transactionDate + "T12:00:00").getDay());
  const [dayOfMonth, setDayOfMonth] = useState(schedule?.dayOfMonth ?? new Date(transactionDate + "T12:00:00").getDate());

  // Drag-to-close state
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // DatePicker state
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Sync local state when schedule prop changes (e.g., when editing existing transaction)
  useEffect(() => {
    if (schedule) {
      setFrequency(schedule.frequency);
      setInterval(schedule.interval);
      setHasEndDate(Boolean(schedule.endDate));
      setEndDate(schedule.endDate ?? "");
      if (schedule.dayOfWeek !== undefined) {
        setDayOfWeek(schedule.dayOfWeek);
      }
      if (schedule.dayOfMonth !== undefined) {
        setDayOfMonth(schedule.dayOfMonth);
      }
    }
  }, [schedule]);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = "";
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleDragStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
    setDragCurrentY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleDragMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartY;

    // Only allow dragging down
    if (deltaY > 0) {
      setDragCurrentY(currentY);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;

    const deltaY = dragCurrentY - dragStartY;
    const CLOSE_THRESHOLD = 100; // Close if dragged more than 100px down

    if (deltaY > CLOSE_THRESHOLD) {
      onClose();
    }

    // Reset drag state
    setIsDragging(false);
    setDragStartY(0);
    setDragCurrentY(0);
  };

  const dragOffset = isDragging ? Math.max(0, dragCurrentY - dragStartY) : 0;

  // Helper to format date for display
  function formatDate(dateStr: string) {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (!isVisible) return null;

  const WEEKDAY_LABELS = [
    t("scheduleConfig.dayOfWeek.sun"),
    t("scheduleConfig.dayOfWeek.mon"),
    t("scheduleConfig.dayOfWeek.tue"),
    t("scheduleConfig.dayOfWeek.wed"),
    t("scheduleConfig.dayOfWeek.thu"),
    t("scheduleConfig.dayOfWeek.fri"),
    t("scheduleConfig.dayOfWeek.sat"),
  ];

  const handleSave = () => {
    const newSchedule: Schedule = {
      enabled: true,
      frequency,
      interval,
      startDate: transactionDate,
      endDate: hasEndDate ? endDate : undefined,
      dayOfWeek: frequency === "weekly" ? dayOfWeek : undefined,
      dayOfMonth: frequency === "monthly" ? dayOfMonth : undefined,
    };

    onSave(newSchedule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-200"
        style={{ opacity: open ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="absolute inset-x-0 bottom-0 max-h-[85vh] flex flex-col rounded-t-3xl bg-white shadow-2xl"
        style={{
          transform: open ? `translateY(${dragOffset}px)` : "translateY(100%)",
          transition: isDragging ? "none" : "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center py-3"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div
          className="sticky top-0 z-10 bg-white border-b border-gray-200"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div className="flex items-center justify-between px-4 py-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("scheduleConfig.title")}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 hover:bg-gray-100 active:scale-95 transition-all"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+100px)] pt-4">
          {/* Frequency */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t("scheduleConfig.frequency.label")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["daily", "weekly", "monthly", "yearly"] as ScheduleFrequency[]).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setFrequency(freq)}
                      className={`rounded-xl py-3 text-sm font-medium transition-colors ${
                        frequency === freq
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {t(`scheduleConfig.frequency.${freq}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interval */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t("scheduleConfig.interval.label")}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setInterval(Math.max(1, interval - 1))}
                    disabled={interval <= 1}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-semibold text-gray-900">{interval}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      {frequency === "daily" && t(`scheduleConfig.interval.${interval === 1 ? "day" : "days"}`)}
                      {frequency === "weekly" && t(`scheduleConfig.interval.${interval === 1 ? "week" : "weeks"}`)}
                      {frequency === "monthly" && t(`scheduleConfig.interval.${interval === 1 ? "month" : "months"}`)}
                      {frequency === "yearly" && t(`scheduleConfig.interval.${interval === 1 ? "year" : "years"}`)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInterval(interval + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Day of Week (for weekly) */}
              {frequency === "weekly" && (
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t("scheduleConfig.dayOfWeek.label")}
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {WEEKDAY_LABELS.map((label, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setDayOfWeek(index)}
                        className={`aspect-square rounded-xl text-xs font-medium transition-colors ${
                          dayOfWeek === index
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Day of Month (for monthly) */}
              {frequency === "monthly" && (
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t("scheduleConfig.dayOfMonth.label")}
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setDayOfMonth(Math.max(1, dayOfMonth - 1))}
                      disabled={dayOfMonth <= 1}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    >
                      −
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-2xl font-semibold text-gray-900">{dayOfMonth}</span>
                      <span className="ml-2 text-sm text-gray-500">{t("scheduleConfig.dayOfMonth.suffix")}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDayOfMonth(Math.min(31, dayOfMonth + 1))}
                      disabled={dayOfMonth >= 31}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {t("scheduleConfig.dayOfMonth.validation")}
                  </p>
                </div>
              )}

              {/* End Date Toggle */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setHasEndDate(!hasEndDate)}
                  className="flex w-full items-center justify-between rounded-xl bg-gray-50 p-4"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {t("scheduleConfig.endDate.label")}
                  </span>
                  <div
                    className={`relative h-8 w-14 shrink-0 rounded-full transition-all duration-200 ${
                      hasEndDate ? "bg-emerald-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        hasEndDate ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </div>
                </button>

                {hasEndDate && (
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(true)}
                    className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {endDate ? formatDate(endDate) : t("scheduleConfig.endDate.placeholder")}
                      </span>
                    </div>
                  </button>
                )}
              </div>

              {/* Info */}
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  {t("scheduleConfig.info", {
                    interval: interval > 1 ? interval : "",
                    unit: frequency === "daily" ? t(`scheduleConfig.interval.${interval === 1 ? "day" : "days"}`) :
                          frequency === "weekly" ? t(`scheduleConfig.interval.${interval === 1 ? "week" : "weeks"}`) :
                          frequency === "monthly" ? t(`scheduleConfig.interval.${interval === 1 ? "month" : "months"}`) :
                          t(`scheduleConfig.interval.${interval === 1 ? "year" : "years"}`),
                    endDate: hasEndDate ? t("scheduleConfig.infoUntil", {
                      date: new Date(endDate + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
                    }) : ""
                  })}
                </p>
              </div>
        </div>

        {/* Fixed Bottom Buttons */}
        <div className="fixed inset-x-0 bottom-0 z-20 bg-white border-t border-gray-200 px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <div className="flex gap-3">
            {schedule && (
              <button
                type="button"
                onClick={() => {
                  onSave(null);
                  onClose();
                }}
                className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 active:scale-[0.98] transition-all"
              >
                {t("scheduleConfig.delete")}
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              className={`${schedule ? "flex-1" : "w-full"} rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600 active:scale-[0.98] transition-all`}
            >
              {t("scheduleConfig.save")}
            </button>
          </div>
        </div>
      </div>

      {/* DatePicker */}
      <DatePicker
        open={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={endDate || todayISO()}
        onChange={(date: string) => {
          setEndDate(date);
          setShowDatePicker(false);
        }}
      />
    </div>
  );
}
