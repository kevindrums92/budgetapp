import { useEffect, useState } from "react";
import { X, DollarSign, Calendar, Repeat, ChevronRight } from "lucide-react";
import type { BudgetPeriod } from "@/types/budget.types";
import { useBudgetStore } from "@/state/budget.store";
import PeriodPickerModal from "./PeriodPickerModal";
import CategoryPickerDrawer from "@/features/categories/components/CategoryPickerDrawer";
import { getCurrentMonth } from "../utils/period.utils";
import { formatNumberWithThousands, parseFormattedNumber } from "@/shared/utils/number.utils";
import { useTranslation } from "react-i18next";

type AddEditBudgetModalProps = {
  open: boolean;
  onClose: () => void;
  budgetId?: string; // If provided, edit mode
};

export default function AddEditBudgetModal({
  open,
  onClose,
  budgetId,
}: AddEditBudgetModalProps) {
  const { t, i18n } = useTranslation("budget");
  const store = useBudgetStore();
  const existingBudget = budgetId ? store.getBudgetById(budgetId) : null;
  const isEdit = !!existingBudget;

  // Form state
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<BudgetPeriod>(getCurrentMonth());
  const [isRecurring, setIsRecurring] = useState(false);

  // UI state
  const [isVisible, setIsVisible] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load budget data when opening in edit mode
  useEffect(() => {
    if (open && existingBudget) {
      setCategoryId(existingBudget.categoryId);
      setAmount(formatNumberWithThousands(existingBudget.amount));
      setPeriod(existingBudget.period);
      setIsRecurring(existingBudget.isRecurring);
      setErrorMessage(null);
    } else if (open && !existingBudget) {
      // Reset to defaults for new budget
      setCategoryId("");
      setAmount("");
      setPeriod(getCurrentMonth());
      setIsRecurring(false);
      setErrorMessage(null);
    }
  }, [open, budgetId, existingBudget]);

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

  const selectedCategory = store.categoryDefinitions.find((c) => c.id === categoryId);

  const canSave =
    categoryId &&
    amount &&
    parseFormattedNumber(amount) > 0 &&
    period.startDate &&
    period.endDate;

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

  const getPeriodLabel = () => {
    switch (period.type) {
      case "week":
        return t("periodPicker.week");
      case "month":
        return t("periodPicker.month");
      case "quarter":
        return t("periodPicker.quarter");
      case "year":
        return t("periodPicker.year");
      case "custom":
        return t("periodPicker.custom");
    }
  };

  const handleSave = () => {
    if (!canSave) return;

    const budgetAmount = parseFormattedNumber(amount);

    if (isEdit && existingBudget) {
      // Update existing budget
      store.updateBudget(existingBudget.id, {
        categoryId,
        amount: budgetAmount,
        period,
        isRecurring,
      });
      onClose();
    } else {
      // Create new budget
      const budgetId = store.createBudget({
        categoryId,
        amount: budgetAmount,
        period,
        isRecurring,
      });

      if (!budgetId) {
        setErrorMessage(
          t("modal.errorDuplicate", { defaultValue: "Ya existe un presupuesto activo para esta categoría en el período seleccionado." })
        );
        return;
      }

      onClose();
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      >
        <div
          className={`relative mx-4 w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl transform transition-all duration-200 ${
            isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {isEdit ? t("modal.titleEdit") : t("modal.titleNew")}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-4">
            {/* Category */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
                {t("modal.category")}
              </label>
              <button
                type="button"
                onClick={() => setShowCategoryPicker(true)}
                className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
              >
                {selectedCategory ? (
                  <span className="font-medium text-gray-900 dark:text-gray-50">
                    {selectedCategory.name}
                  </span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">
                    {t("modal.selectCategory")}
                  </span>
                )}
                <ChevronRight size={20} className="text-gray-400 dark:text-gray-500 shrink-0" />
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
                {t("modal.amount")}
              </label>
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, "");
                    if (cleaned) {
                      setAmount(formatNumberWithThousands(cleaned));
                    } else {
                      setAmount("");
                    }
                  }}
                  placeholder="0"
                  className="flex-1 border-0 bg-transparent p-0 text-base font-medium text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {/* Period */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
                {t("modal.period")}
              </label>
              <button
                type="button"
                onClick={() => setShowPeriodPicker(true)}
                className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{getPeriodLabel()}</p>
                    <p className="font-medium text-gray-900 dark:text-gray-50">
                      {formatDate(period.startDate)} -{" "}
                      {formatDate(period.endDate)}
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 dark:text-gray-500 shrink-0" />
                </div>
              </button>
            </div>

            {/* Recurring Toggle */}
            <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Repeat className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    {t("modal.recurring")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("modal.recurringDescription")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={`relative h-8 w-14 shrink-0 rounded-full transition-all duration-200 ${
                  isRecurring ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    isRecurring ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-gray-200 dark:border-gray-800 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {t("modal.cancel")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("modal.save")}
            </button>
          </div>
        </div>
      </div>

      {/* Category Picker */}
      <CategoryPickerDrawer
        open={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        transactionType="expense"
        value={categoryId}
        onSelect={(id: string) => {
          setCategoryId(id);
          setShowCategoryPicker(false);
        }}
      />

      {/* Period Picker */}
      <PeriodPickerModal
        open={showPeriodPicker}
        onClose={() => setShowPeriodPicker(false)}
        value={period}
        onChange={(newPeriod) => {
          setPeriod(newPeriod);
          setShowPeriodPicker(false);
        }}
      />
    </>
  );
}
