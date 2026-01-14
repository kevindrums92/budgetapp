import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, MessageSquare, Calendar, Tag, FileText } from "lucide-react";
import { icons } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { todayISO } from "@/services/dates.service";
import DatePicker from "@/components/DatePicker";
import CategoryPickerDrawer from "@/components/CategoryPickerDrawer";
import type { TransactionType } from "@/types/budget.types";

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
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Get selected category object
  const selectedCategory = useMemo(() => {
    if (!categoryId) return null;
    return categoryDefinitions.find((c) => c.id === categoryId) ?? null;
  }, [categoryId, categoryDefinitions]);

  // Preload from URL param or existing transaction
  useEffect(() => {
    if (tx) {
      setType(tx.type);
      setName(tx.name);
      setCategoryId(tx.category); // Now stores category ID
      setAmount(String(tx.amount));
      setDate(tx.date);
      return;
    }
    // New transaction - check URL param
    const typeParam = searchParams.get("type");
    if (typeParam === "income" || typeParam === "expense") {
      setType(typeParam);
    } else {
      setType("expense");
    }
    setName("");
    setCategoryId(null);
    setAmount("");
    setDate(todayISO());
  }, [tx, searchParams]);

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

    if (tx) {
      updateTransaction(tx.id, {
        type,
        name: name.trim(),
        category: categoryId || "",
        amount: amountNumber,
        date,
      });
    } else {
      addTransaction({
        type,
        name: name.trim(),
        category: categoryId || "",
        amount: amountNumber,
        date,
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
      <div className="sticky top-0 z-20 bg-white">
        <div className="mx-auto max-w-xl px-4">
          <div className="flex h-14 items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 active:scale-95"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
            <h1 className="text-base font-semibold text-gray-900">
              {title}
            </h1>
          </div>
        </div>
      </div>

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
                  placeholder="¿En qué gastaste?"
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
                  placeholder="Agregar notas... (opcional)"
                  className="w-full border-0 p-0 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
              </div>
            </div>
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
      />
    </div>
  );
}
