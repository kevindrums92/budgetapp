import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MessageSquare, Calendar, Tag, FileText, Repeat } from "lucide-react";
import { icons } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { todayISO } from "@/services/dates.service";
import DatePicker from "@/components/DatePicker";
import CategoryPickerDrawer from "@/components/CategoryPickerDrawer";
import PageHeader from "@/components/PageHeader";
import type { TransactionType } from "@/types/budget.types";

const FORM_STORAGE_KEY = "transaction_form_draft";

// Convert kebab-case to PascalCase for lucide-react icons
function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export default function AddEditTransactionPage() {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(params.id);

  const addTransaction = useBudgetStore((s) => s.addTransaction);
  const updateTransaction = useBudgetStore((s) => s.updateTransaction);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const transactions = useBudgetStore((s) => s.transactions);

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
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Get selected category object
  const selectedCategory = useMemo(() => {
    if (!categoryId) return null;
    return categoryDefinitions.find((c) => c.id === categoryId) ?? null;
  }, [categoryId, categoryDefinitions]);

  // Save form draft to sessionStorage
  const saveFormDraft = useCallback(() => {
    if (isEdit) return; // Don't save drafts when editing
    const draft = { type, name, categoryId, amount, date, notes, isRecurring };
    sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(draft));
  }, [type, name, categoryId, amount, date, notes, isRecurring, isEdit]);

  // Clear form draft
  const clearFormDraft = useCallback(() => {
    sessionStorage.removeItem(FORM_STORAGE_KEY);
  }, []);

  // Preload from URL param, existing transaction, or saved draft
  useEffect(() => {
    if (initialized) return;

    if (tx) {
      setType(tx.type);
      setName(tx.name);
      setCategoryId(tx.category);
      setAmount(String(tx.amount));
      setDate(tx.date);
      setNotes(tx.notes || "");
      setIsRecurring(tx.isRecurring || false);
      setInitialized(true);
      return;
    }

    // Check if returning from category creation with a new category
    const newCategoryId = searchParams.get("newCategoryId");

    // Check for saved draft first (for when returning from category creation)
    const savedDraft = sessionStorage.getItem(FORM_STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setType(draft.type || "expense");
        setName(draft.name || "");
        // Use new category if provided, otherwise use draft's category
        setCategoryId(newCategoryId || draft.categoryId);
        setAmount(draft.amount || "");
        setDate(draft.date || todayISO());
        setNotes(draft.notes || "");
        setIsRecurring(draft.isRecurring || false);
        clearFormDraft();
        setInitialized(true);
        return;
      } catch {
        // Invalid draft, continue with normal initialization
      }
    }

    // New transaction - check URL params
    const typeParam = searchParams.get("type");
    if (typeParam === "income" || typeParam === "expense") {
      setType(typeParam);
    } else {
      setType("expense");
    }
    setName("");
    // If we have a new category but no draft, still select it
    setCategoryId(newCategoryId);
    setAmount("");
    setDate(todayISO());
    setInitialized(true);
  }, [tx, searchParams, initialized, clearFormDraft]);

  // Redirect if editing non-existent transaction
  useEffect(() => {
    if (isEdit && !tx) navigate("/", { replace: true });
  }, [isEdit, tx, navigate]);

  const amountNumber = Number(amount);
  const canSave =
    name.trim().length > 0 &&
    Number.isFinite(amountNumber) &&
    amountNumber > 0 &&
    date.length === 10;

  function goBack() {
    navigate(-1);
  }

  function handleSave() {
    if (!canSave) return;

    const trimmedNotes = notes.trim();

    if (tx) {
      updateTransaction(tx.id, {
        type,
        name: name.trim(),
        category: categoryId || "",
        amount: amountNumber,
        date,
        notes: trimmedNotes || undefined,
        isRecurring,
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
      });
    }
    goBack();
  }

  const title = isEdit
    ? "Editar"
    : type === "income"
    ? "Nuevo Ingreso"
    : "Nuevo Gasto";

  const accentColor = type === "income" ? "text-emerald-600" : "text-gray-900";

  return (
    <div className="min-h-dvh bg-white">
      {/* Header */}
      <PageHeader title={title} onBack={goBack} />

      {/* Amount Input */}
      <div className="mx-auto max-w-xl px-4 pt-8 pb-6">
        <div className="text-center">
          <p className="mb-2 text-sm font-medium text-gray-500">Monto</p>
          <div className="flex items-center justify-center">
            <span className={`text-5xl font-semibold tracking-tight ${accentColor}`}>$</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              className={`w-auto min-w-[60px] max-w-[200px] border-0 bg-transparent p-0 text-center text-5xl font-semibold tracking-tight placeholder:text-gray-300 focus:outline-none focus:ring-0 ${accentColor}`}
              style={{ width: `${Math.max(60, (amount.length || 1) * 32)}px` }}
            />
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="mx-auto max-w-xl px-4">
        <div className="divide-y divide-gray-100">
          {/* Description */}
          <div className="py-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <MessageSquare className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Descripción
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={type === "income" ? "¿De dónde proviene?" : "¿En qué gastaste?"}
                  className="w-full border-0 p-0 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="py-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <Calendar className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Fecha
                </label>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  className="w-full text-left text-base text-gray-900"
                >
                  {new Date(date + "T12:00:00").toLocaleDateString("es-CO", {
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
          <div className="py-4">
            <div className="flex items-start gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: selectedCategory
                    ? selectedCategory.color + "20"
                    : "#f3f4f6",
                }}
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
                      <Tag className="h-5 w-5 text-gray-500" />
                    );
                  })()
                ) : (
                  <Tag className="h-5 w-5 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Categoría
                </label>
                <button
                  type="button"
                  onClick={() => setShowCategoryDrawer(true)}
                  className="w-full text-left text-base text-gray-900"
                >
                  {selectedCategory?.name || (
                    <span className="text-gray-400">Seleccionar categoría</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="py-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <FileText className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Notas
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agregar notas... (opcional)"
                  className="w-full border-0 p-0 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
              </div>
            </div>
          </div>

          {/* Recurring Toggle */}
          <div className="py-4">
            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className="flex w-full items-center gap-4 active:bg-gray-50 rounded-lg -mx-2 px-2 py-1"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <Repeat className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1 text-left">
                <p
                  className={`text-sm font-medium transition-colors ${
                    isRecurring ? "text-gray-900" : "text-gray-700"
                  }`}
                >
                  Gasto recurrente mensual
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Se te recordará replicarlo cada mes
                </p>
              </div>
              <div
                className={`relative h-8 w-14 shrink-0 rounded-full transition-all duration-200 ${
                  isRecurring ? "bg-emerald-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    isRecurring ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-white">
        <div className="mx-auto max-w-xl px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={`w-full rounded-2xl py-4 text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 ${
              type === "income"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-gray-900 hover:bg-gray-800"
            }`}
          >
            {isEdit ? "Guardar cambios" : "Guardar"}
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
    </div>
  );
}
