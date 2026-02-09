import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useKeyboardDismiss } from "@/hooks/useKeyboardDismiss";
import { useSubscription } from "@/hooks/useSubscription";
import { usePaywallPurchase } from "@/hooks/usePaywallPurchase";
import { MessageSquare, Calendar, Tag, FileText, Repeat, Trash2, CheckCircle, ChevronRight } from "lucide-react";
import { icons } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { todayISO } from "@/services/dates.service";
import { useCurrency } from "@/features/currency";
import DatePicker from "@/shared/components/modals/DatePicker";
import CategoryPickerDrawer from "@/features/categories/components/CategoryPickerDrawer";
import ScheduleConfigDrawer from "@/features/transactions/components/ScheduleConfigDrawer";
import PageHeader from "@/shared/components/layout/PageHeader";
import ConfirmDialog from "@/shared/components/modals/ConfirmDialog";
import PaywallModal from "@/shared/components/modals/PaywallModal";
import type { TransactionType, TransactionStatus, Schedule } from "@/types/budget.types";
import { kebabToPascal } from "@/shared/utils/string.utils";
import { trackAction, maybeShowInterstitial } from "@/services/ads.service";
import SpotlightTour from "@/features/tour/components/SpotlightTour";
import { useSpotlightTour } from "@/features/tour/hooks/useSpotlightTour";
import { addTransactionTour } from "@/features/tour/tours/addTransactionTour";

const FORM_STORAGE_KEY = "transaction_form_draft";

// Helper to get the day before a date string (YYYY-MM-DD)
function getDateBefore(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

export default function AddEditTransactionPage() {
  const { t } = useTranslation("transactions");
  const { getLocale } = useLanguage();
  const { formatAmount, currencyInfo } = useCurrency();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isEdit = Boolean(params.id);

  // Dismiss keyboard on scroll or touch outside
  useKeyboardDismiss();

  const addTransaction = useBudgetStore((s) => s.addTransaction);
  const updateTransaction = useBudgetStore((s) => s.updateTransaction);
  const deleteTransaction = useBudgetStore((s) => s.deleteTransaction);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const transactions = useBudgetStore((s) => s.transactions);

  const { canUseFeature, isPro } = useSubscription();

  const tx = useMemo(() => {
    if (!isEdit || !params.id) return null;
    return transactions.find((t) => t.id === params.id) ?? null;
  }, [isEdit, params.id, transactions]);

  const [type, setType] = useState<TransactionType>("expense");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [status, setStatus] = useState<TransactionStatus>("paid");
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showScheduleDrawer, setShowScheduleDrawer] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showTemplateEditModal, setShowTemplateEditModal] = useState(false);
  const [showNoChangesAlert, setShowNoChangesAlert] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Ref for amount input to autofocus on new transactions
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Spotlight tour (only for new transactions, not edits)
  const { isActive: isTourActive, startTour, completeTour } = useSpotlightTour("addTransaction");

  useEffect(() => {
    if (!isEdit) {
      startTour();
    }
  }, [isEdit, startTour]);

  // Paywall purchase handler
  const { handleSelectPlan } = usePaywallPurchase({
    onSuccess: () => setShowPaywall(false),
  });

  // Check if we're editing a template (scheduled transaction)
  const isTemplate = tx?.schedule?.enabled === true;

  // Check if this was a scheduled transaction that was deactivated
  const wasDeactivated = tx?.schedule !== undefined && tx.schedule.enabled === false;

  // Get virtual date from navigation state (when coming from "Editar y registrar")
  const virtualDate = location.state?.virtualDate as string | undefined;

  // Get selected category object
  const selectedCategory = useMemo(() => {
    if (!categoryId) return null;
    return categoryDefinitions.find((c) => c.id === categoryId) ?? null;
  }, [categoryId, categoryDefinitions]);

  // Save form draft to sessionStorage
  const saveFormDraft = useCallback(() => {
    if (isEdit) return; // Don't save drafts when editing
    const draft = { type, name, categoryId, amount, date, notes, isRecurring, schedule, status };
    sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(draft));
  }, [type, name, categoryId, amount, date, notes, isRecurring, schedule, status, isEdit]);

  // Clear form draft
  const clearFormDraft = useCallback(() => {
    sessionStorage.removeItem(FORM_STORAGE_KEY);
  }, []);

  // Load form data on mount
  useEffect(() => {
    if (initialized) return;

    if (tx) {
      // Editing existing transaction
      setType(tx.type);
      setName(tx.name);
      setCategoryId(tx.category);
      setAmount(String(tx.amount));
      setDate(tx.date);
      setNotes(tx.notes || "");
      setIsRecurring(tx.isRecurring || false);
      setSchedule(tx.schedule || null);
      setStatus(tx.status || "paid");
    } else {
      // New transaction - check URL params
      const typeParam = searchParams.get("type");
      if (typeParam === "income" || typeParam === "expense") {
        setType(typeParam);
      }
    }

    setInitialized(true);

    // Auto-focus amount input for new transactions
    if (!tx) {
      // Small delay to ensure the DOM is ready and keyboard opens
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [initialized, tx, searchParams]);

  // Check for draft/new category when returning from category creation
  useEffect(() => {
    if (isEdit || !initialized) return;

    const newCategoryId = sessionStorage.getItem("newCategoryId");
    const savedDraft = sessionStorage.getItem(FORM_STORAGE_KEY);

    if (newCategoryId) {
      sessionStorage.removeItem("newCategoryId");

      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setType(draft.type || "expense");
          setName(draft.name || "");
          setCategoryId(newCategoryId); // Use new category
          setAmount(draft.amount || "");
          setDate(draft.date || todayISO());
          setNotes(draft.notes || "");
          setIsRecurring(draft.isRecurring || false);
          setSchedule(draft.schedule || null);
          setStatus(draft.status || "paid");
        } catch {
          // Invalid draft, just set new category
          setCategoryId(newCategoryId);
        }
      } else {
        // Only new category, no draft
        setCategoryId(newCategoryId);
      }
    } else if (savedDraft) {
      // No new category but there's a draft (user cancelled category creation)
      try {
        const draft = JSON.parse(savedDraft);
        setType(draft.type || "expense");
        setName(draft.name || "");
        setCategoryId(draft.categoryId || null);
        setAmount(draft.amount || "");
        setDate(draft.date || todayISO());
        setNotes(draft.notes || "");
        setIsRecurring(draft.isRecurring || false);
        setSchedule(draft.schedule || null);
        setStatus(draft.status || "paid");
      } catch {
        // Invalid draft, ignore
      }
    }
  }, [isEdit, initialized, location]); // Re-run when location changes (navigation back)

  // Redirect if editing non-existent transaction
  useEffect(() => {
    if (isEdit && !tx) navigate("/", { replace: true });
  }, [isEdit, tx, navigate]);

  const amountNumber = Number(amount);
  const canSave =
    Number.isFinite(amountNumber) &&
    amountNumber > 0 &&
    categoryId !== null &&
    date.length === 10;

  // Check if user changed values (excluding schedule)
  const hasChangedValues = useMemo(() => {
    if (!tx || !initialized) return false;
    return (
      name.trim() !== tx.name ||
      amountNumber !== tx.amount ||
      categoryId !== tx.category ||
      date !== tx.date ||
      notes.trim() !== (tx.notes || "") ||
      type !== tx.type ||
      status !== (tx.status || "paid")
    );
  }, [tx, initialized, name, amountNumber, categoryId, date, notes, type, status]);

  // Check if schedule was changed
  const hasChangedSchedule = useMemo(() => {
    if (!tx || !initialized) return false;
    const txSchedule = tx.schedule;
    if (!txSchedule && !schedule) return false;
    if (!txSchedule || !schedule) return true;
    return (
      schedule.enabled !== txSchedule.enabled ||
      schedule.frequency !== txSchedule.frequency ||
      schedule.interval !== txSchedule.interval ||
      schedule.dayOfMonth !== txSchedule.dayOfMonth ||
      schedule.dayOfWeek !== txSchedule.dayOfWeek ||
      schedule.startDate !== txSchedule.startDate ||
      schedule.endDate !== txSchedule.endDate
    );
  }, [tx, initialized, schedule]);

  function goBack() {
    clearFormDraft(); // Clear draft when user cancels
    navigate(-1);
  }

  function handleSave() {
    if (!canSave) return;

    // Only show modal when coming from "Editar y registrar" (virtualDate is set)
    // This means user clicked on a virtual transaction and wants to register it with changes
    // If editing a template directly (no virtualDate), just update it normally
    if (virtualDate && isTemplate) {
      // Case 0: User didn't change anything - show alert
      if (!hasChangedSchedule && !hasChangedValues) {
        setShowNoChangesAlert(true);
        return;
      }

      // Case 1: User changed schedule (frequency, interval, etc.) from a virtual
      // This should always create a new template starting from the virtual date
      if (hasChangedSchedule) {
        handleSaveThisAndFuture();
        return;
      }

      // Case 2: User changed values but not schedule
      // Show modal to ask "only this one" vs "this and future"
      if (hasChangedValues) {
        setShowTemplateEditModal(true);
        return;
      }
    }

    // Normal save flow
    performSave();
  }

  // Create just this one transaction from the template
  async function handleSaveOnlyThisOne() {
    if (!canSave || !tx) return;

    const trimmedNotes = notes.trim();

    // Use virtualDate if available, otherwise use form date
    const effectiveDate = virtualDate || date;

    // Create a new individual transaction (not a template) with sourceTemplateId
    addTransaction({
      type,
      name: name.trim(),
      category: categoryId || "",
      amount: amountNumber,
      date: effectiveDate,
      notes: trimmedNotes || undefined,
      isRecurring: false,
      schedule: undefined, // Not a template
      status: status === "paid" ? undefined : status,
      sourceTemplateId: tx.id, // Link to the original template
    });

    setShowTemplateEditModal(false);
    clearFormDraft();

    // Track action and maybe show ad (only for free users)
    if (!isPro) {
      trackAction();
      await maybeShowInterstitial('after_transaction_create');
    }

    goBack();
  }

  // End current template and create a new one with updated values
  async function handleSaveThisAndFuture() {
    if (!canSave || !tx) return;

    const trimmedNotes = notes.trim();

    // Use virtualDate if available (when coming from "Editar y registrar"),
    // otherwise fall back to the form date
    const effectiveDate = virtualDate || date;

    // 1. End the current template by setting endDate to day before the virtual date
    // This ensures the old template doesn't generate the virtual we're replacing
    const endDate = virtualDate
      ? getDateBefore(virtualDate)
      : todayISO();

    updateTransaction(tx.id, {
      schedule: {
        ...tx.schedule!,
        endDate,
      },
    });

    // 2. Create a new template with updated values starting from the effective date
    // Use the NEW schedule values (from form state), not the old template values
    const newSchedule: Schedule = {
      enabled: true,
      frequency: schedule?.frequency || tx.schedule!.frequency,
      interval: schedule?.interval || tx.schedule!.interval,
      startDate: effectiveDate,
      dayOfMonth: schedule?.dayOfMonth ?? tx.schedule!.dayOfMonth,
      dayOfWeek: schedule?.dayOfWeek ?? tx.schedule!.dayOfWeek,
      // No endDate for new template
    };

    addTransaction({
      type,
      name: name.trim(),
      category: categoryId || "",
      amount: amountNumber,
      date: effectiveDate, // Use the effective date as the base date
      notes: trimmedNotes || undefined,
      isRecurring: true,
      schedule: newSchedule,
      status: status === "paid" ? undefined : status,
    });

    setShowTemplateEditModal(false);
    clearFormDraft();

    // Track action and maybe show ad (only for free users)
    if (!isPro) {
      trackAction();
      await maybeShowInterstitial('after_transaction_edit');
    }

    goBack();
  }

  async function performSave() {
    const trimmedNotes = notes.trim();

    // Check scheduled transaction limit for new transactions
    if (!tx && schedule?.enabled) {
      if (!canUseFeature('unlimited_scheduled')) {
        setShowPaywall(true);
        return;
      }
    }

    const isEditing = Boolean(tx);

    if (tx) {
      // If transaction doesn't have sourceTemplateId, try to find a matching template
      // This handles transactions that were created before sourceTemplateId was implemented
      let sourceTemplateId = tx.sourceTemplateId;
      if (!sourceTemplateId && !tx.schedule?.enabled) {
        // Find a template that matches by name + category (original values before edit)
        const matchingTemplate = transactions.find(
          (t) => t.schedule?.enabled && t.name === tx.name && t.category === tx.category
        );
        if (matchingTemplate) {
          sourceTemplateId = matchingTemplate.id;
        }
      }

      updateTransaction(tx.id, {
        type,
        name: name.trim(),
        category: categoryId || "",
        amount: amountNumber,
        date,
        notes: trimmedNotes || undefined,
        isRecurring,
        schedule: schedule || undefined,
        status: status === "paid" ? undefined : status,
        // Preserve or set sourceTemplateId to prevent scheduled transaction duplication
        sourceTemplateId,
      });
    } else {
      addTransaction({
        type,
        name: name.trim(),
        category: categoryId || "",
        amount: amountNumber,
        date,
        notes: trimmedNotes || undefined,
        isRecurring,
        schedule: schedule || undefined,
        status: status === "paid" ? undefined : status,
      });
    }
    clearFormDraft(); // Clear draft when user saves

    // Track action and maybe show ad (only for free users)
    if (!isPro) {
      trackAction();
      const placement = isEditing ? 'after_transaction_edit' : 'after_transaction_create';
      await maybeShowInterstitial(placement);
    }

    goBack();
  }

  function handleAskDelete() {
    setConfirmDelete(true);
  }

  function handleConfirmDelete() {
    if (!tx) return;
    deleteTransaction(tx.id);
    clearFormDraft(); // Clear draft when deleting
    setConfirmDelete(false);
    navigate(-1);
  }

  const title = isEdit
    ? t("form.edit")
    : type === "income"
    ? t("form.newIncome")
    : t("form.newExpense");

  // Format amount with thousands separator for display
  const displayAmount = useMemo(() => {
    if (!amount) return "";
    // Add thousands separator (.) for Colombian locale
    return amount.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }, [amount]);

  // Dynamic font size based on amount length
  const amountFontSize = useMemo(() => {
    const len = displayAmount.length;
    if (len <= 8) return "text-5xl"; // Default: up to 99.999.999
    if (len <= 11) return "text-4xl"; // Medium: up to 99.999.999.999
    return "text-3xl"; // Small: larger numbers
  }, [displayAmount]);

  return (
    <div className="min-h-dvh bg-white dark:bg-gray-950">
      {/* Header */}
      <PageHeader
        title={title}
        onBack={goBack}
        rightActions={
          // Don't show delete button when coming from "Editar y registrar" (virtualDate)
          // because that would delete the template, not the virtual transaction
          isEdit && tx && !virtualDate ? (
            <button
              type="button"
              onClick={handleAskDelete}
              className="rounded-full p-2 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              <Trash2 className="h-5 w-5 text-red-500" />
            </button>
          ) : undefined
        }
      />

      {/* Amount Input */}
      <div data-tour="add-amount-input" className="mx-auto max-w-xl px-4 pt-8 pb-6">
        <div className="text-center">
          <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">{t("form.amount")}</p>
          <div className="flex items-center justify-center px-4">
            <span className={`${amountFontSize} font-semibold tracking-tight ${type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-gray-50"}`}>{currencyInfo.symbol}</span>
            <input
              ref={amountInputRef}
              type="text"
              inputMode="decimal"
              value={displayAmount}
              onChange={(e) => {
                // Remove all separators, keep only digits
                const cleaned = e.target.value.replace(/[^0-9]/g, "");
                setAmount(cleaned);
              }}
              placeholder="0"
              className={`w-auto min-w-[60px] flex-1 border-0 bg-transparent p-0 text-center ${amountFontSize} font-semibold tracking-tight placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-0 ${type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-gray-50"}`}
            />
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="mx-auto max-w-xl px-4 pb-32">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {/* Description */}
          <div className="py-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <MessageSquare className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t("form.description")} <span className="text-gray-400 dark:text-gray-500">(opcional)</span>
                </label>
                <input
                  type="text"
                  data-testid="transaction-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Cena familiar, Pago Netflix..."
                  className="w-full border-0 p-0 bg-transparent text-base text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-0"
                />
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="py-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t("form.date")}
                </label>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  className="w-full text-left text-base text-gray-900 dark:text-gray-50"
                >
                  {new Date(date + "T12:00:00").toLocaleDateString(getLocale(), {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </button>
              </div>
            </div>
          </div>

          {/* Category */}
          <div data-tour="add-category-picker" className="py-4">
            <div className="flex items-start gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: selectedCategory
                    ? selectedCategory.color + "20"
                    : undefined,
                }}
                {...(!selectedCategory && { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800" })}
              >
                {selectedCategory ? (
                  (() => {
                    const IconComponent =
                      icons[kebabToPascal(selectedCategory.icon) as keyof typeof icons];
                    return IconComponent ? (
                      <IconComponent
                        className="h-5 w-5"
                        style={{ color: selectedCategory.color }}
                      />
                    ) : (
                      <Tag className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    );
                  })()
                ) : (
                  <Tag className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t("form.category")}
                </label>
                <button
                  type="button"
                  onClick={() => setShowCategoryDrawer(true)}
                  className="w-full text-left text-base text-gray-900 dark:text-gray-50"
                >
                  {selectedCategory?.name || (
                    <span className="text-gray-400 dark:text-gray-500">{t("form.categoryPlaceholder")}</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="py-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t("form.notes")}
                </label>
                <input
                  type="text"
                  data-testid="transaction-notes-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("form.notesPlaceholder")}
                  className="w-full border-0 p-0 bg-transparent text-base text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-0"
                />
              </div>
            </div>
          </div>

          {/* Status Selector */}
          <div className="py-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <CheckCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t("form.status")}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus("paid")}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                      status === "paid"
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {t("form.statusPaid")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("pending")}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                      status === "pending"
                        ? "bg-amber-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {t("form.statusPending")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("planned")}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                      status === "planned"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {t("form.statusPlanned")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="py-4">
            {wasDeactivated ? (
              /* Deactivated schedule - show disabled state */
              <div className="flex w-full items-center gap-4 rounded-lg -mx-2 px-2 py-1 opacity-50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <Repeat className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t("form.schedule.inactive")}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {t("form.schedule.inactiveMessage")}
                  </p>
                </div>
              </div>
            ) : (
              /* Normal schedule button */
              <button
                type="button"
                data-tour="add-schedule"
                onClick={() => setShowScheduleDrawer(true)}
                className="flex w-full items-center gap-4 active:bg-gray-50 dark:active:bg-gray-800 rounded-lg -mx-2 px-2 py-1"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  schedule?.enabled ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-gray-100 dark:bg-gray-800"
                }`}>
                  <Repeat className={`h-5 w-5 ${schedule?.enabled ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`} />
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${schedule?.enabled ? "text-gray-900 dark:text-gray-50" : "text-gray-700 dark:text-gray-300"}`}>
                    {schedule?.enabled ? t("form.schedule.enabled") : t("form.schedule.title")}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {schedule?.enabled
                      ? `${t("scheduleConfig.interval.label")} ${schedule.interval > 1 ? `${schedule.interval} ` : ""}${
                          schedule.frequency === "daily" ? t(`scheduleConfig.interval.${schedule.interval === 1 ? "day" : "days"}`) :
                          schedule.frequency === "weekly" ? t(`scheduleConfig.interval.${schedule.interval === 1 ? "week" : "weeks"}`) :
                          schedule.frequency === "monthly" ? t(`scheduleConfig.interval.${schedule.interval === 1 ? "month" : "months"}`) :
                          t(`scheduleConfig.interval.${schedule.interval === 1 ? "year" : "years"}`)
                        }`
                      : t("form.schedule.tapToConfig")}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-xl px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="w-full rounded-2xl bg-emerald-500 py-4 text-base font-semibold text-white transition-all hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-40"
          >
            {isEdit ? t("form.saveChanges") : t("form.save")}
          </button>
        </div>
      </div>

      {/* Date Picker Modal */}
      <DatePicker
        open={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={date}
        onChange={setDate}
      />

      {/* Category Picker Drawer */}
      <CategoryPickerDrawer
        open={showCategoryDrawer}
        onClose={() => setShowCategoryDrawer(false)}
        transactionType={type}
        value={categoryId}
        onSelect={(id) => {
          setCategoryId(id);
          setShowCategoryDrawer(false);
        }}
        onNavigateToNewCategory={saveFormDraft}
      />

      {/* Schedule Config Drawer */}
      <ScheduleConfigDrawer
        open={showScheduleDrawer}
        onClose={() => setShowScheduleDrawer(false)}
        schedule={schedule}
        transactionDate={date}
        onSave={(newSchedule) => {
          setSchedule(newSchedule);
          setShowScheduleDrawer(false);
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete}
        title={t("form.delete.title")}
        message={t("form.delete.message", { name: tx?.name || "", amount: tx ? formatAmount(tx.amount) : "" })}
        confirmText={t("form.delete.confirm")}
        cancelText={t("form.delete.cancel")}
        destructive
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDelete(false)}
      />

      {/* Template Edit Choice Modal */}
      {showTemplateEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowTemplateEditModal(false)}
          />

          {/* Modal Card */}
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t("form.saveModal.title")}
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {t("form.saveModal.message")}
            </p>

            {/* Actions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSaveOnlyThisOne}
                className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
              >
                {t("form.saveModal.onlyThis")}
              </button>
              <p className="px-2 text-xs text-gray-500 dark:text-gray-400">
                {t("form.saveModal.onlyThisDesc")}
              </p>

              <button
                type="button"
                onClick={handleSaveThisAndFuture}
                className="w-full rounded-xl bg-gray-900 dark:bg-gray-50 py-3 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
              >
                {t("form.saveModal.thisAndFollowing")}
              </button>
              <p className="px-2 text-xs text-gray-500 dark:text-gray-400">
                {t("form.saveModal.thisAndFollowingDesc")}
              </p>

              <button
                type="button"
                onClick={() => setShowTemplateEditModal(false)}
                className="w-full rounded-xl py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {t("form.saveModal.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Changes Alert Modal */}
      {showNoChangesAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowNoChangesAlert(false)}
          />

          {/* Modal Card */}
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t("form.noChanges.title")}
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {t("form.noChanges.message")}
            </p>

            <button
              type="button"
              onClick={() => setShowNoChangesAlert(false)}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
            >
              {t("form.noChanges.ok")}
            </button>
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger="scheduled_limit"
        onSelectPlan={handleSelectPlan}
      />

      {/* Spotlight Tour */}
      <SpotlightTour
        config={addTransactionTour}
        isActive={isTourActive}
        onComplete={completeTour}
      />
    </div>
  );
}
