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
  Calendar,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import DatePicker from "@/components/DatePicker";
import ConfirmDialog from "@/components/ConfirmDialog";

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
  const deleteTripExpense = useBudgetStore((s) => s.deleteTripExpense);

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

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (expense) {
      setCategory(expense.category);
      setName(expense.name);
      setAmount(String(expense.amount));
      setDate(expense.date);
      setNotes(expense.notes ?? "");
      return;
    }
    setCategory("food");
    setName("");
    setAmount("");
    setDate(todayISO());
    setNotes("");
  }, [expense]);

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

  function handleAskDelete() {
    setConfirmDelete(true);
  }

  function handleConfirmDelete() {
    if (!expense) return;
    deleteTripExpense(expense.id);
    setConfirmDelete(false);
    navigate(`/trips/${tripId}`, { replace: true });
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("es-CO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (!trip) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PageHeader
        title={
          <div className="flex flex-col -mt-1">
            <span className="font-semibold text-gray-900">
              {expense ? "Editar gasto" : "Nuevo gasto"}
            </span>
            <span className="text-[11px] text-gray-500 truncate max-w-[200px]">
              {trip.name}
            </span>
          </div>
        }
        onBack={goBack}
        rightActions={
          isEdit && expense ? (
            <button
              type="button"
              onClick={handleAskDelete}
              className="rounded-full p-2 hover:bg-red-50"
            >
              <Trash2 className="h-5 w-5 text-red-500" />
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 px-4 pt-6 pb-8">
        <div className="space-y-4">
          {/* Categoría */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-500">
              Categoría
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = category === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategory(opt.value)}
                    className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-700 shadow-sm hover:bg-gray-50"
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
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Descripción
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Almuerzo en la playa, Taxi al aeropuerto..."
              className="w-full text-base text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>

          {/* Valor + Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Valor
              </label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="numeric"
                placeholder="Ej: 50000"
                className="w-full text-base text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className="rounded-2xl bg-white p-4 shadow-sm text-left"
            >
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Fecha
              </label>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-400" />
                <span className="text-base text-gray-900">
                  {formatDate(date)}
                </span>
              </div>
            </button>
          </div>

          {/* Notas */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Notas <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={2}
              className="w-full resize-none text-base text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="mx-auto max-w-xl px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="w-full rounded-2xl bg-emerald-500 py-4 text-base font-semibold text-white transition-colors hover:bg-emerald-600 disabled:bg-gray-300"
          >
            {expense ? "Guardar cambios" : "Agregar gasto"}
          </button>
        </div>
      </div>

      {/* Date picker */}
      <DatePicker
        open={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={date}
        onChange={setDate}
      />

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar gasto"
        message={
          expense
            ? `¿Seguro que deseas eliminar "${expense.name}"?`
            : "¿Seguro que deseas eliminar este gasto?"
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        destructive
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
