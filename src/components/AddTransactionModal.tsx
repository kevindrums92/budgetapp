import { useEffect, useMemo, useState } from "react";
import CategoryInput from "@/components/CategoryInput";
import { useBudgetStore } from "@/state/budget.store";
import { todayISO } from "@/services/dates.service";
import type { Transaction } from "@/types/budget.types";

type Props = {
  open: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
};

export default function AddTransactionModal({ open, onClose, transactionToEdit = null }: Props) {
  const addTransaction = useBudgetStore((s) => s.addTransaction);
  const updateTransaction = useBudgetStore((s) => s.updateTransaction);
  const categories = useBudgetStore((s) => s.categories);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.localeCompare(b, "es"));
  }, [categories]);

  const [type, setType] = useState<"income" | "expense">("expense");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState(todayISO());

  // Reset / precargar cuando abra
  useEffect(() => {
    if (!open) return;

    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setName(transactionToEdit.name);
      setCategory(transactionToEdit.category);
      setAmount(String(transactionToEdit.amount));
      setDate(transactionToEdit.date);
      return;
    }

    setType("expense");
    setName("");
    setCategory("");
    setAmount("");
    setDate(todayISO());
  }, [open, transactionToEdit]);

  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const amountNumber = Number(amount);
  const canSave =
    name.trim().length > 0 && Number.isFinite(amountNumber) && amountNumber > 0 && date.length === 10;

  function handleSave() {
    if (!canSave) return;

    if (transactionToEdit) {
      updateTransaction(transactionToEdit.id, {
        type,
        name: name.trim(),
        category: category.trim(),
        amount: amountNumber,
        date,
      });
      onClose();
      return;
    }

    addTransaction({
      type,
      name: name.trim(),
      category: category.trim(),
      amount: amountNumber,
      date,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-30">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Cerrar"
      />

      {/* Panel: bottom sheet en mobile / modal en desktop */}
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-xl md:inset-0 md:flex md:items-center md:justify-center md:p-6">
        <div className="w-full rounded-t-3xl bg-white p-4 shadow-2xl md:max-w-xl md:rounded-3xl md:p-6">
          {/* “Handle” visual en mobile */}
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-300 md:hidden" />

          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {transactionToEdit ? "Editar movimiento" : "Nuevo movimiento"}
              </h2>
              <p className="text-sm text-gray-600">
                {transactionToEdit ? "Actualiza los datos del movimiento" : "Agrega un ingreso o gasto"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Cerrar
            </button>
          </div>

          {/* Form */}
          <div className="mt-4 space-y-4">
            {/* Tipo */}
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${type === "expense" ? "bg-black text-white" : "bg-white"
                    }`}
                >
                  Gasto
                </button>
                <button
                  type="button"
                  onClick={() => setType("income")}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${type === "income" ? "bg-black text-white" : "bg-white"
                    }`}
                >
                  Ingreso
                </button>
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="mb-1 block text-sm font-medium">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Almuerzo, Nómina, Netflix..."
                className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            {/* Categoría */}
            <CategoryInput
              value={category}
              onChange={setCategory}
              suggestions={categories}
            />

            {/* Valor + Fecha */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Valor</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="numeric"
                  placeholder="Ej: 25000"
                  className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
                />
                <p className="mt-1 text-xs text-gray-500">Usa solo números (sin puntos ni comas).</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border px-4 py-2 font-medium"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="w-full rounded-xl bg-black px-4 py-2 font-medium text-white disabled:opacity-40"
              >
                {transactionToEdit ? "Guardar cambios" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
