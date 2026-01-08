import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CategoryInput from "@/components/CategoryInput";
import { useBudgetStore } from "@/state/budget.store";
import { todayISO } from "@/services/dates.service";
import type { TransactionType } from "@/types/budget.types";

export default function AddEditTransactionPage() {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
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
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState(todayISO());

  // Precarga / Reset
  useEffect(() => {
    if (tx) {
      setType(tx.type);
      setName(tx.name);
      setCategory(tx.category);
      setAmount(String(tx.amount));
      setDate(tx.date);
      return;
    }
    // creando
    setType("expense");
    setName("");
    setCategory("");
    setAmount("");
    setDate(todayISO());
  }, [tx]);

  // Si intentan entrar a /edit/:id que no existe => volvemos
  useEffect(() => {
    if (isEdit && !tx) navigate("/", { replace: true });
  }, [isEdit, tx, navigate]);

  const amountNumber = Number(amount);
  const canSave =
    name.trim().length > 0 && Number.isFinite(amountNumber) && amountNumber > 0 && date.length === 10;

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
      goBack();
      return;
    }

    addTransaction({
      type,
      name: name.trim(),
      category: category.trim(),
      amount: amountNumber,
      date,
    });

    goBack();
  }

  return (
    <div className="min-h-[100dvh] bg-white">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto max-w-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className="text-sm font-medium text-gray-700"
            >
              Volver
            </button>

            <div className="text-center">
              <p className="text-sm font-semibold">
                {tx ? "Editar movimiento" : "Nuevo movimiento"}
              </p>
              <p className="text-[11px] text-gray-500">
                {tx ? "Actualiza los datos" : "Agrega un ingreso o gasto"}
              </p>
            </div>

            <div className="w-[52px]" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-xl px-4 py-4 pb-36">
        <div className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="mb-1 block text-sm font-medium">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`border px-3 py-2 text-sm font-medium ${
                  type === "expense" ? "bg-black text-white" : "bg-white text-gray-900"
                }`}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`border px-3 py-2 text-sm font-medium ${
                  type === "income" ? "bg-black text-white" : "bg-white text-gray-900"
                }`}
              >
                Ingreso
              </button>
            </div>
          </div>

          {/* Nombre (mismo estilo que CategoryInput) */}
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Almuerzo, Nómina, Netflix..."
              className="w-full border px-3 py-2 text-sm outline-none focus:border-[#18B7B0]"
            />
          </div>

          {/* Categoría */}
          <CategoryInput
            value={category}
            onChange={setCategory}
            suggestions={categories}
            label="Categoría"
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
                className="w-full border px-3 py-2 text-sm outline-none focus:border-[#18B7B0]"
              />
              <p className="mt-1 text-[11px] text-gray-500">Usa solo números (sin puntos ni comas).</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border px-3 py-2 text-sm outline-none focus:border-[#18B7B0]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white">
        <div className="mx-auto max-w-xl px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={goBack}
              className="w-full border px-4 py-2 text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="w-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {tx ? "Guardar cambios" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
