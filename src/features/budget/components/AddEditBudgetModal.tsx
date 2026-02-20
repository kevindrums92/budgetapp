import { useEffect, useState } from "react";
import { X, DollarSign, Calendar, Repeat, ChevronRight, ShieldAlert, Target, icons } from "lucide-react";
import type { BudgetPeriod, BudgetType } from "@/types/budget.types";
import { useBudgetStore } from "@/state/budget.store";
import { useKeyboardDismiss } from "@/hooks/useKeyboardDismiss";
import PeriodPickerModal from "./PeriodPickerModal";
import CategoryPickerDrawer from "@/features/categories/components/CategoryPickerDrawer";
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

  // Form state
  const [step, setStep] = useState(0); // 0 = type selector, 1 = form, 2 = goal onboarding
  const [budgetType, setBudgetType] = useState<BudgetType>("limit");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<BudgetPeriod>(getCurrentMonth());
  const [isRecurring, setIsRecurring] = useState(false);

  // UI state
  const [isVisible, setIsVisible] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
    if (step === 1 && !isEdit) {
      setStep(0);
    } else {
      onClose();
    }
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

  // Step 0: Type Selector
  if (step === 0) {
    return (
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
              {t("typeSelector.title")}
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
          <div className="px-6 py-8">
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-2 text-center">
              {t("typeSelector.question")}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
              {t("typeSelector.subtitle")}
            </p>

            <div className="space-y-3">
              {/* Opción: Límite de Gasto */}
              <button
                type="button"
                onClick={() => handleSelectType("limit")}
                className="w-full rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border-2 border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all active:scale-[0.98] text-left"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                    <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">
                      {t("typeSelector.controlSpending")}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("typeSelector.controlSpendingDescription")}
                    </p>
                  </div>

                  {/* Chevron */}
                  <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0" />
                </div>
              </button>

              {/* Opción: Meta de Ahorro */}
              <button
                type="button"
                onClick={() => handleSelectType("goal")}
                className="w-full rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border-2 border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/20 transition-all active:scale-[0.98] text-left"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/30">
                    <Target className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">
                      {t("typeSelector.saveForGoal")}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("typeSelector.saveForGoalDescription")}
                    </p>
                  </div>

                  {/* Chevron */}
                  <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Form
  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      >
        <div
          className={`relative mx-4 w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl transform transition-all duration-200 overflow-hidden ${
            isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
            <div className="flex items-center gap-3">
              {!isEdit && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronRight size={20} className="text-gray-500 dark:text-gray-400 rotate-180" />
                </button>
              )}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                {isEdit ? t("modal.titleEdit") : budgetType === "limit" ? t("types.newLimit") : t("types.newGoal")}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="max-h-[70vh] overflow-y-auto px-6 py-6 space-y-4">
            {/* Type Badge (only show in edit mode or after selection) */}
            {budgetType && (
              <div className="flex items-center gap-2 pb-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  budgetType === "limit"
                    ? "bg-red-100 dark:bg-red-900/30"
                    : "bg-teal-100 dark:bg-teal-900/30"
                }`}>
                  {budgetType === "limit" ? (
                    <>
                      <ShieldAlert size={14} className="text-red-600 dark:text-red-400" />
                      <span className="text-xs font-medium text-red-700 dark:text-red-400">
                        {t("types.limit")}
                      </span>
                    </>
                  ) : (
                    <>
                      <Target size={14} className="text-teal-600 dark:text-teal-400" />
                      <span className="text-xs font-medium text-teal-700 dark:text-teal-400">
                        {t("types.goal")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
                {t("modal.category")}
              </label>
              <button
                type="button"
                onClick={() => setShowCategoryPicker(true)}
                className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
              >
                {selectedCategory ? (
                  <>
                    {/* Category Icon */}
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
                    {/* Category Name */}
                    <span className="flex-1 font-medium text-gray-900 dark:text-gray-50">
                      {selectedCategory.name}
                    </span>
                    <ChevronRight size={20} className="text-gray-400 dark:text-gray-500 shrink-0" />
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-gray-400 dark:text-gray-500">
                      {t("modal.selectCategory")}
                    </span>
                    <ChevronRight size={20} className="text-gray-400 dark:text-gray-500 shrink-0" />
                  </>
                )}
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
                {budgetType === "limit" ? "Límite máximo" : "Meta a alcanzar"}
              </label>
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  budgetType === "limit"
                    ? "bg-red-100 dark:bg-red-900/30"
                    : "bg-teal-100 dark:bg-teal-900/30"
                }`}>
                  <DollarSign className={`h-5 w-5 ${
                    budgetType === "limit"
                      ? "text-red-600 dark:text-red-400"
                      : "text-teal-600 dark:text-teal-400"
                  }`} />
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
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                      {getPeriodLabel()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(period.startDate)} - {formatDate(period.endDate)}
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 dark:text-gray-500 shrink-0" />
                </div>
              </button>
            </div>

            {/* Recurring */}
            <div>
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <Repeat className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
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
                </div>
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/30 p-4 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-400">
                  {errorMessage}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 space-y-3">
            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors ${
                budgetType === "limit"
                  ? "bg-red-500 hover:bg-red-600 disabled:bg-gray-300"
                  : "bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300"
              } dark:disabled:bg-gray-700`}
            >
              {t("modal.save")}
            </button>

            {/* Delete Button (only in edit mode) */}
            {isEdit && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                {t("modal.delete")}
              </button>
            )}
          </div>
        </div>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
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

    </>
  );
}
