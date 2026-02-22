import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Calendar, Repeat, ChevronRight, ShieldAlert, Target, Trash2, icons } from "lucide-react";
import type { BudgetPeriod, BudgetType } from "@/types/budget.types";
import { useBudgetStore } from "@/state/budget.store";
import { useKeyboardDismiss } from "@/hooks/useKeyboardDismiss";
import { useCurrency } from "@/features/currency";
import PeriodPickerModal from "./PeriodPickerModal";
import CategoryPickerDrawer from "@/features/categories/components/CategoryPickerDrawer";
import PageHeader from "@/shared/components/layout/PageHeader";
import { getCurrentMonth } from "../utils/period.utils";
import { formatNumberWithThousands, parseFormattedNumber } from "@/shared/utils/number.utils";
import { kebabToPascal } from "@/shared/utils/string.utils";
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
  const savingsGoalOnboardingSeen = store.savingsGoalOnboardingSeen;
  const setSavingsGoalOnboardingSeen = store.setSavingsGoalOnboardingSeen;
  // Dismiss keyboard on scroll or touch outside
  useKeyboardDismiss();
  const { currencyInfo } = useCurrency();
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [step, setStep] = useState(0); // 0 = type selector, 1 = form, 2 = goal onboarding
  const [budgetType, setBudgetType] = useState<BudgetType>("limit");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<BudgetPeriod>(getCurrentMonth());
  const [isRecurring, setIsRecurring] = useState(false);

  // UI state
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Bottom sheet state (for step 0 type selector)
  const SELECTOR_SHEET_HEIGHT = 260;
  const SHEET_DRAG_THRESHOLD = 0.3;
  const [sheetAnimating, setSheetAnimating] = useState(false);
  const [sheetDragOffset, setSheetDragOffset] = useState(0);
  const [sheetDragging, setSheetDragging] = useState(false);
  const sheetStartYRef = useRef(0);

  // Sheet drag handlers
  const handleSheetDragStart = useCallback((clientY: number) => {
    setSheetDragging(true);
    sheetStartYRef.current = clientY;
  }, []);

  const handleSheetDragMove = useCallback(
    (clientY: number) => {
      if (!sheetDragging) return;
      const diff = clientY - sheetStartYRef.current;
      if (diff > 0) {
        setSheetDragOffset(Math.min(diff, SELECTOR_SHEET_HEIGHT));
      } else {
        setSheetDragOffset(0);
      }
    },
    [sheetDragging]
  );

  const handleSheetDragEnd = useCallback(() => {
    if (!sheetDragging) return;
    setSheetDragging(false);
    if (sheetDragOffset > SELECTOR_SHEET_HEIGHT * SHEET_DRAG_THRESHOLD) {
      onClose();
    }
    setSheetDragOffset(0);
  }, [sheetDragging, sheetDragOffset, onClose]);

  const handleSheetTouchStart = useCallback(
    (e: React.TouchEvent) => handleSheetDragStart(e.touches[0].clientY),
    [handleSheetDragStart]
  );
  const handleSheetTouchMove = useCallback(
    (e: React.TouchEvent) => handleSheetDragMove(e.touches[0].clientY),
    [handleSheetDragMove]
  );
  const handleSheetTouchEnd = useCallback(() => handleSheetDragEnd(), [handleSheetDragEnd]);

  const handleSheetMouseDown = useCallback(
    (e: React.MouseEvent) => handleSheetDragStart(e.clientY),
    [handleSheetDragStart]
  );

  useEffect(() => {
    if (!sheetDragging) return;
    const handleMouseMove = (e: MouseEvent) => handleSheetDragMove(e.clientY);
    const handleMouseUp = () => handleSheetDragEnd();
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [sheetDragging, handleSheetDragMove, handleSheetDragEnd]);

  // Sheet animation effect
  useEffect(() => {
    if (open && step === 0) {
      const timer = setTimeout(() => setSheetAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setSheetAnimating(false);
      setSheetDragOffset(0);
    }
  }, [open, step]);

  // Load budget data when opening in edit mode
  useEffect(() => {
    if (open && existingBudget) {
      setStep(1); // Skip type selector in edit mode
      setBudgetType(existingBudget.type);
      setCategoryId(existingBudget.categoryId);
      setAmount(formatNumberWithThousands(existingBudget.amount));
      setPeriod(existingBudget.period);
      setIsRecurring(existingBudget.isRecurring);
      setErrorMessage(null);
    } else if (open && !existingBudget) {
      // Check if returning from creating a category
      const newCategoryId = sessionStorage.getItem("newCategoryId");
      if (newCategoryId) {
        // Coming back from creating a category - go to form with category preselected
        // Check if we were creating a goal (stored in sessionStorage)
        const wasCreatingGoal = sessionStorage.getItem("creatingGoalCategory") === "true";
        setStep(1);
        setBudgetType(wasCreatingGoal ? "goal" : "limit");
        setCategoryId(newCategoryId);
        setAmount("");
        setPeriod(getCurrentMonth());
        setIsRecurring(false);
        setErrorMessage(null);
        sessionStorage.removeItem("newCategoryId");
        sessionStorage.removeItem("creatingGoalCategory");
      } else {
        // Normal new budget flow - start with type selector
        setStep(0);
        setBudgetType("limit");
        setCategoryId("");
        setAmount("");
        setPeriod(getCurrentMonth());
        setIsRecurring(false);
        setErrorMessage(null);
      }
    }
  }, [open, budgetId, existingBudget]);

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

  // Format amount with thousands separator for display (must be before early return)
  const displayAmount = useMemo(() => {
    if (!amount) return "";
    const raw = parseFormattedNumber(amount).toString();
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }, [amount]);

  // Dynamic font size based on amount length
  const amountFontSize = useMemo(() => {
    const len = displayAmount.length;
    if (len <= 8) return "text-[56px]";
    if (len <= 11) return "text-[44px]";
    return "text-[36px]";
  }, [displayAmount]);

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

  const handleSelectType = (type: BudgetType) => {
    setBudgetType(type);
    // Show onboarding for goals if first time
    if (type === "goal" && !savingsGoalOnboardingSeen) {
      setStep(2); // Go to goal onboarding
    } else {
      setStep(1); // Go to form
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
        type: budgetType,
        period,
        isRecurring,
      });
      onClose();
    } else {
      // Create new budget
      const budgetId = store.createBudget({
        categoryId,
        amount: budgetAmount,
        type: budgetType,
        period,
        isRecurring,
      });

      if (!budgetId) {
        setErrorMessage(t("modal.errorDuplicate"));
        return;
      }

      onClose();
    }
  };

  const handleDelete = () => {
    if (!existingBudget) return;
    store.deleteBudget(existingBudget.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleBack = () => {
    onClose();
  };

  // Step 2: Savings Goal Onboarding (Full Screen)
  if (step === 2) {
    return (
      <div className="fixed inset-0 z-[85] bg-gray-50 dark:bg-gray-950 overflow-y-auto">
        {/* Scrollable Content */}
        <div
          className="px-6 pb-44"
          style={{
            paddingTop: 'max(env(safe-area-inset-top), 24px)',
          }}
        >
          {/* Title */}
          <div className="mb-8 mt-6">
            <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
              {t("goalOnboarding.title")}
            </h1>
          </div>

          {/* Hero Icon */}
          <div className="mb-8 flex justify-center">
            <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-teal-100 dark:bg-teal-900/30">
              <Target size={64} className="text-teal-600 dark:text-teal-400" strokeWidth={2} />
            </div>
          </div>

          {/* Explanation */}
          <div className="mb-6">
            <h4 className="mb-3 text-xl font-bold text-gray-900 dark:text-gray-50">
              {t("goalOnboarding.howItWorksTitle")}
            </h4>
            <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
              {t("goalOnboarding.howItWorksDescription")}
            </p>
          </div>

          {/* Example */}
          <div className="mb-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 p-5 border border-teal-200 dark:border-teal-800">
            <p className="text-sm font-bold text-teal-700 dark:text-teal-400 mb-3">
              {t("goalOnboarding.exampleTitle")}
            </p>
            <p className="text-sm text-teal-700 dark:text-teal-400 leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
              {t("goalOnboarding.exampleText")}
            </p>
          </div>

          {/* Suggestion */}
          <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 p-5 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-3">
              {t("goalOnboarding.recommendationTitle")}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
              {t("goalOnboarding.recommendationText")}
            </p>
          </div>
        </div>

        {/* CTA Buttons - Fixed Bottom */}
        <div
          className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-gray-50 via-gray-50 dark:from-gray-950 dark:via-gray-950 to-transparent px-6 pt-8 space-y-3"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setSavingsGoalOnboardingSeen(true);

              // Create a default savings category automatically
              const newCategoryId = store.addCategory({
                name: t("goalOnboarding.defaultCategoryName"),
                icon: "piggy-bank",
                color: "#14B8A6", // teal-500
                type: "expense",
                groupId: "lifestyle" // Estilo de Vida group
              });

              // Set the category and go to form
              if (newCategoryId) {
                setCategoryId(newCategoryId);
                setStep(1);
              }
            }}
            className="w-full rounded-2xl bg-teal-500 py-4 text-base font-bold text-white transition-all active:scale-[0.98]"
          >
            {t("goalOnboarding.createCategory")}
          </button>
          <button
            type="button"
            onClick={() => {
              setSavingsGoalOnboardingSeen(true);
              setStep(1); // Continue to form
            }}
            className="w-full rounded-2xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 py-4 text-base font-bold text-gray-700 dark:text-gray-300 transition-all active:scale-[0.98]"
          >
            {t("goalOnboarding.continueWithoutCategory")}
          </button>
        </div>
      </div>
    );
  }

  // Step 0: Type Selector (iOS-style bottom sheet)
  if (step === 0) {
    const sheetTranslate = sheetAnimating ? sheetDragOffset : SELECTOR_SHEET_HEIGHT;
    const backdropOpacity = sheetAnimating
      ? Math.max(0, 1 - sheetDragOffset / SELECTOR_SHEET_HEIGHT) * 0.4
      : 0;

    return (
      <div className="fixed inset-0 z-[70]">
        {/* Backdrop */}
        <button
          type="button"
          className="absolute inset-0 bg-black"
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            opacity: backdropOpacity,
            transition: sheetDragging ? "none" : "opacity 300ms ease-out",
          }}
        />

        {/* Sheet */}
        <div
          className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl"
          style={{
            transform: `translateY(${sheetTranslate}px)`,
            transition: sheetDragging
              ? "none"
              : "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          {/* Drag handle */}
          <div
            className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
            onMouseDown={handleSheetMouseDown}
          >
            <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>

          {/* Content */}
          <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            {/* Title */}
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t("typeSelector.title")}
            </h3>

            {/* Grouped card - iOS style */}
            <div className="overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-800">
              {/* Option 1: Control Spending */}
              <button
                type="button"
                onClick={() => handleSelectType("limit")}
                className="flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors active:bg-gray-100 dark:active:bg-gray-700"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-50">
                    {t("typeSelector.controlSpending")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("typeSelector.controlSpendingDescription")}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
              </button>

              {/* Divider */}
              <div className="ml-[60px] border-t border-gray-200 dark:border-gray-700" />

              {/* Option 2: Save for Goal */}
              <button
                type="button"
                onClick={() => handleSelectType("goal")}
                className="flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors active:bg-gray-100 dark:active:bg-gray-700"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30">
                  <Target className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-50">
                    {t("typeSelector.saveForGoal")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("typeSelector.saveForGoalDescription")}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Full-Screen Form
  const formTitle = isEdit
    ? t("modal.titleEdit")
    : budgetType === "limit"
    ? t("types.newLimit")
    : t("types.newGoal");

  return (
    <>
      <div className="fixed inset-0 z-[85] flex flex-col bg-white dark:bg-gray-950">
        {/* Header */}
        <PageHeader
          title={formTitle}
          onBack={handleBack}
          rightActions={
            isEdit ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-full p-2 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                <Trash2 className="h-5 w-5 text-red-500" />
              </button>
            ) : undefined
          }
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-40">
          {/* Hero Amount Section */}
          <div className="mx-auto max-w-xl px-4 pt-8 pb-6">
            <div className="text-center">
              <p className={`mb-2 text-sm font-medium ${
                budgetType === "limit"
                  ? "text-gray-500 dark:text-gray-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}>
                {budgetType === "limit" ? t("modal.limitMaxAmount") : t("modal.goalTargetAmount")}
              </p>
              <div className="flex items-center justify-center px-4">
                <span className={`${amountFontSize} font-semibold tracking-tight ${
                  budgetType === "limit"
                    ? "text-gray-900 dark:text-gray-50"
                    : "text-teal-600 dark:text-teal-400"
                }`}>
                  {currencyInfo.symbol}
                </span>
                <input
                  ref={amountInputRef}
                  type="text"
                  inputMode="numeric"
                  value={displayAmount}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, "");
                    if (cleaned) {
                      setAmount(formatNumberWithThousands(cleaned));
                    } else {
                      setAmount("");
                    }
                  }}
                  placeholder="0"
                  className={`w-auto min-w-[60px] flex-1 border-0 bg-transparent p-0 text-center ${amountFontSize} font-semibold tracking-tight placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-0 ${
                    budgetType === "limit"
                      ? "text-gray-900 dark:text-gray-50"
                      : "text-teal-600 dark:text-teal-400"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Settings - iOS Grouped List */}
          <div className="mx-auto max-w-xl px-4">
            <div className="overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-900">
              {/* Category */}
              <button
                type="button"
                onClick={() => setShowCategoryPicker(true)}
                className="flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors active:bg-gray-100 dark:active:bg-gray-800"
              >
                {selectedCategory ? (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: selectedCategory.color + "20" }}
                  >
                    {(() => {
                      const IconComponent = icons[kebabToPascal(selectedCategory.icon) as keyof typeof icons];
                      return IconComponent ? (
                        <IconComponent className="h-5 w-5" style={{ color: selectedCategory.color }} />
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    budgetType === "limit"
                      ? "bg-red-100 dark:bg-red-900/30"
                      : "bg-teal-100 dark:bg-teal-900/30"
                  }`}>
                    {budgetType === "limit" ? (
                      <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
                    ) : (
                      <Target className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("modal.category")}
                  </p>
                  <p className="text-[15px] font-medium text-gray-900 dark:text-gray-50">
                    {selectedCategory?.name || t("modal.selectCategory")}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
              </button>

              {/* Divider */}
              <div className="ml-[60px] border-t border-gray-200 dark:border-gray-800" />

              {/* Period */}
              <button
                type="button"
                onClick={() => setShowPeriodPicker(true)}
                className="flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors active:bg-gray-100 dark:active:bg-gray-800"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("modal.period")}
                  </p>
                  <p className="text-[15px] font-medium text-gray-900 dark:text-gray-50">
                    {getPeriodLabel()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(period.startDate)} - {formatDate(period.endDate)}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
              </button>

              {/* Divider */}
              <div className="ml-[60px] border-t border-gray-200 dark:border-gray-800" />

              {/* Recurring */}
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className="flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors active:bg-gray-100 dark:active:bg-gray-800"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Repeat className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-gray-900 dark:text-gray-50">
                    {t("modal.recurring")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("modal.recurringDescription")}
                  </p>
                </div>
                <div
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-200 ${
                    isRecurring ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                      isRecurring ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/30 p-4 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-400">
                  {errorMessage}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div
          className="shrink-0 bg-white dark:bg-gray-950 px-4"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
        >
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={`w-full rounded-2xl py-4 text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 ${
              budgetType === "limit"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-teal-500 hover:bg-teal-600"
            }`}
          >
            {t("modal.save")}
          </button>
        </div>

        {/* Category Picker Drawer */}
        <CategoryPickerDrawer
          open={showCategoryPicker}
          onClose={() => setShowCategoryPicker(false)}
          value={categoryId}
          onSelect={(id) => {
            setCategoryId(id);
            setShowCategoryPicker(false);
          }}
          transactionType="expense"
          onNavigateToNewCategory={() => {
            // Modal will stay in memory and reopen when returning
            setShowCategoryPicker(false);
          }}
        />

        {/* Period Picker Modal */}
        <PeriodPickerModal
          open={showPeriodPicker}
          onClose={() => setShowPeriodPicker(false)}
          value={period}
          onChange={(newPeriod) => {
            setPeriod(newPeriod);
            setShowPeriodPicker(false);
          }}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
                {t("modal.deleteConfirmTitle")}
              </h3>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {t("modal.deleteConfirmMessage")}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  {t("modal.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-medium text-white hover:bg-red-600"
                >
                  {t("modal.delete")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
