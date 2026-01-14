import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, MessageSquare, Calendar, Tag, FileText } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { todayISO } from "@/services/dates.service";
import DatePicker from "@/components/DatePicker";
import type { TransactionType } from "@/types/budget.types";

export default function AddEditTransactionPage() {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(params.id);

  const addTransaction = useBudgetStore((s) => s.addTransaction);
  const updateTransaction = useBudgetStore((s) => s.updateTransaction);
  const categories = useBudgetStore((s) => s.categories);
  const transactions = useBudgetStore((s) => s.transactions);

  const tx = useMemo(() => {
    if (!isEdit || !params.id) return null;
    return transactions.find((t) => t.id === params.id) ?? null;
  }, [isEdit, params.id, transactions]);

  const [type, setType] = useState<TransactionType>("expense");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Preload from URL param or existing transaction
  useEffect(() => {
    if (tx) {
      setType(tx.type);
      setName(tx.name);
      setCategory(tx.category);
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
    setCategory("");
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
        category: category.trim(),
        amount: amountNumber,
        date,
      });
    } else {
      addTransaction({
        type,
        name: name.trim(),
        category: category.trim(),
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <Tag className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Categoría
                </label>
                <button
                  type="button"
                  onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                  className="w-full text-left text-base text-gray-900"
                >
                  {category || (
                    <span className="text-gray-400">Seleccionar categoría</span>
                  )}
                </button>
                {showCategoryPicker && categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {categories.slice(0, 10).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategory(cat);
                          setShowCategoryPicker(false);
                        }}
                        className={`rounded-full px-3 py-1.5 text-sm transition-all ${
                          category === cat
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
                {showCategoryPicker && (
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="O escribe una nueva..."
                    className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                  />
                )}
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
    </div>
  );
}
