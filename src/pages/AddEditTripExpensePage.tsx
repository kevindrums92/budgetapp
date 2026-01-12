import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBudgetStore } from "@/state/budget.store";
import { todayISO } from "@/services/dates.service";
import type { TripExpenseCategory } from "@/types/budget.types";
import {
  Plane,
  Hotel,
  Utensils,
  Ticket,
  ShoppingBag,
  HelpCircle,
} from "lucide-react";

const CATEGORY_OPTIONS: {
  value: TripExpenseCategory;
  label: string;
  icon: typeof Plane;
}[] = [
  { value: "transport", label: "Transporte", icon: Plane },
  { value: "accommodation", label: "Alojamiento", icon: Hotel },
  { value: "food", label: "Comida", icon: Utensils },
  { value: "activities", label: "Actividades", icon: Ticket },
  { value: "shopping", label: "Compras", icon: ShoppingBag },
  { value: "other", label: "Otros", icon: HelpCircle },
];

export default function AddEditTripExpensePage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string; expenseId?: string }>();
  const tripId = params.id!;
  const isEdit = Boolean(params.expenseId);

  const trips = useBudgetStore((s) => s.trips);
  const tripExpenses = useBudgetStore((s) => s.tripExpenses);
  const addTripExpense = useBudgetStore((s) => s.addTripExpense);
  const updateTripExpense = useBudgetStore((s) => s.updateTripExpense);

  const trip = useMemo(() => {
    return trips.find((t) => t.id === tripId) ?? null;
  }, [tripId, trips]);

  const expense = useMemo(() => {
    if (!isEdit || !params.expenseId) return null;
    return tripExpenses.find((e) => e.id === params.expenseId) ?? null;
  }, [isEdit, params.expenseId, tripExpenses]);

  const [category, setCategory] = useState<TripExpenseCategory>("food");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");

  // Precarga / Reset
  useEffect(() => {
    if (expense) {
      setCategory(expense.category);
      setName(expense.name);
      setAmount(String(expense.amount));
      setDate(expense.date);
      setNotes(expense.notes ?? "");
      return;
    }
    // creando
    setCategory("food");
    setName("");
    setAmount("");
    setDate(todayISO());
    setNotes("");
  }, [expense]);

  // Si el viaje o expense no existe => volvemos
  useEffect(() => {
    if (!trip) {
      navigate("/trips", { replace: true });
      return;
    }
    if (isEdit && !expense) {
      navigate(`/trips/${tripId}`, { replace: true });
    }
  }, [trip, isEdit, expense, tripId, navigate]);

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

    if (expense) {
      updateTripExpense(expense.id, {
        category,
        name: name.trim(),
        amount: amountNumber,
        date,
        notes: notes.trim() || undefined,
      });
      goBack();
      return;
    }

    addTripExpense({
      tripId,
      category,
      name: name.trim(),
      amount: amountNumber,
      date,
      notes: notes.trim() || undefined,
    });

    goBack();
  }

  if (!trip) return null;

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
                {expense ? "Editar gasto" : "Nuevo gasto"}
              </p>
              <p className="text-[11px] text-gray-500 truncate max-w-[200px]">
                {trip.name}
              </p>
            </div>

            <div className="w-[52px]" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-xl px-4 py-4 pb-36">
        <div className="space-y-4">
          {/* Categoría */}
          <div>
            <label className="mb-2 block text-sm font-medium">Categoría</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = category === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategory(opt.value)}
                    className={`flex flex-col items-center gap-1 border px-2 py-3 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-black bg-black text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="mb-1 block text-sm font-medium">Descripción</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Almuerzo en la playa, Taxi al aeropuerto..."
              className="w-full border px-3 py-2 text-sm outline-none focus:border-[#18B7B0]"
            />
          </div>

          {/* Valor + Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Valor</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="numeric"
                placeholder="Ej: 50000"
                className="w-full border px-3 py-2 text-sm outline-none focus:border-[#18B7B0]"
              />
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

          {/* Notas */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Notas <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={2}
              className="w-full resize-none border px-3 py-2 text-sm outline-none focus:border-[#18B7B0]"
            />
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
              {expense ? "Guardar cambios" : "Agregar gasto"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
