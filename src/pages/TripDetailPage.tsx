import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBudgetStore } from "@/state/budget.store";
import { formatCOP } from "@/features/transactions/transactions.utils";
import {
  ChevronLeft,
  Plus,
  MapPin,
  Calendar,
  Plane,
  Utensils,
  Hotel,
  ShoppingBag,
  Ticket,
  HelpCircle,
} from "lucide-react";
import type { TripExpense, TripExpenseCategory } from "@/types/budget.types";
import ConfirmDialog from "@/components/ConfirmDialog";
import RowMenu from "@/components/RowMenu";

const CATEGORY_CONFIG: Record<
  TripExpenseCategory,
  { label: string; icon: typeof Plane; color: string }
> = {
  transport: { label: "Transporte", icon: Plane, color: "bg-blue-100 text-blue-600" },
  accommodation: { label: "Alojamiento", icon: Hotel, color: "bg-purple-100 text-purple-600" },
  food: { label: "Comida", icon: Utensils, color: "bg-orange-100 text-orange-600" },
  activities: { label: "Actividades", icon: Ticket, color: "bg-pink-100 text-pink-600" },
  shopping: { label: "Compras", icon: ShoppingBag, color: "bg-emerald-100 text-emerald-600" },
  other: { label: "Otros", icon: HelpCircle, color: "bg-gray-100 text-gray-600" },
};

export default function TripDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();

  const trips = useBudgetStore((s) => s.trips);
  const tripExpenses = useBudgetStore((s) => s.tripExpenses);
  const deleteTripExpense = useBudgetStore((s) => s.deleteTripExpense);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<TripExpense | null>(null);

  const trip = useMemo(() => {
    if (!params.id) return null;
    return trips.find((t) => t.id === params.id) ?? null;
  }, [params.id, trips]);

  const expenses = useMemo(() => {
    if (!trip) return [];
    return tripExpenses
      .filter((e) => e.tripId === trip.id)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return b.createdAt - a.createdAt;
      });
  }, [trip, tripExpenses]);

  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const spentByCategory = useMemo(() => {
    const map: Partial<Record<TripExpenseCategory, number>> = {};
    for (const e of expenses) {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    }
    return map;
  }, [expenses]);

  // Si el viaje no existe => volvemos
  useEffect(() => {
    if (!trip && params.id) navigate("/trips", { replace: true });
  }, [trip, params.id, navigate]);

  function onAskDelete(expense: TripExpense) {
    setExpenseToDelete(expense);
    setConfirmOpen(true);
  }

  function onConfirmDelete() {
    if (!expenseToDelete) return;
    deleteTripExpense(expenseToDelete.id);
    setConfirmOpen(false);
    setExpenseToDelete(null);
  }

  if (!trip) return null;

  const remaining = trip.budget - totalSpent;
  const progress = trip.budget > 0 ? Math.min((totalSpent / trip.budget) * 100, 100) : 0;
  const isOverBudget = totalSpent > trip.budget;

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("es-CO", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  return (
    <div className="min-h-[100dvh] bg-white">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto max-w-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/trips")}
              className="p-1 text-gray-600"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-semibold">{trip.name}</h1>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={11} />
                <span>{trip.destination}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget summary */}
      <div className="border-b bg-gray-50">
        <div className="mx-auto max-w-xl px-4 py-4">
          {/* Progress */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Gastado</span>
              <span className={isOverBudget ? "text-red-600 font-medium" : "text-gray-900"}>
                {formatCOP(totalSpent)} / {formatCOP(trip.budget)}
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isOverBudget ? "bg-red-500" : "bg-emerald-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Remaining */}
          <div className="text-center">
            <p
              className={`text-2xl font-bold ${
                isOverBudget ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {isOverBudget ? "-" : ""}{formatCOP(Math.abs(remaining))}
            </p>
            <p className="text-xs text-gray-500">
              {isOverBudget ? "excedido" : "disponible"}
            </p>
          </div>

          {/* Dates */}
          <div className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-500">
            <Calendar size={12} />
            <span>
              {formatDate(trip.startDate)}
              {trip.endDate ? ` - ${formatDate(trip.endDate)}` : " (en curso)"}
            </span>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      {Object.keys(spentByCategory).length > 0 && (
        <div className="border-b">
          <div className="mx-auto max-w-xl px-4 py-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              Por categoría
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(spentByCategory) as [TripExpenseCategory, number][]).map(
                ([cat, amount]) => {
                  const config = CATEGORY_CONFIG[cat];
                  const Icon = config.icon;
                  return (
                    <div
                      key={cat}
                      className="flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1"
                    >
                      <div className={`rounded-full p-1 ${config.color}`}>
                        <Icon size={10} />
                      </div>
                      <span className="text-xs text-gray-700">{formatCOP(amount)}</span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expenses list */}
      <div className="mx-auto max-w-xl px-4 py-4 pb-28">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Gastos ({expenses.length})
          </p>
          <button
            type="button"
            onClick={() => navigate(`/trips/${trip.id}/expense/new`)}
            className="flex items-center gap-1 text-xs font-medium text-[#18B7B0]"
          >
            <Plus size={14} />
            Agregar
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="border bg-white p-6 text-center">
            <p className="text-sm text-gray-500">
              Aún no hay gastos registrados en este viaje.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/trips/${trip.id}/expense/new`)}
              className="mt-3 rounded-full bg-black px-4 py-2 text-sm font-medium text-white active:scale-[0.98]"
            >
              Agregar gasto
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((e) => {
              const config = CATEGORY_CONFIG[e.category];
              const Icon = config.icon;
              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 border bg-white p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`shrink-0 rounded-full p-2 ${config.color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{e.name}</p>
                      <p className="text-xs text-gray-500">
                        {config.label} • {formatDate(e.date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap font-semibold text-gray-900">
                      {formatCOP(e.amount)}
                    </span>
                    <RowMenu
                      onEdit={() => navigate(`/trips/${trip.id}/expense/${e.id}/edit`)}
                      onDelete={() => onAskDelete(e)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB para agregar */}
      <button
        type="button"
        onClick={() => navigate(`/trips/${trip.id}/expense/new`)}
        className="fixed bottom-24 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-black text-white shadow-lg active:scale-[0.98]"
        aria-label="Agregar gasto"
      >
        <Plus size={24} />
      </button>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar gasto"
        message={
          expenseToDelete
            ? `¿Seguro que deseas eliminar "${expenseToDelete.name}" por ${formatCOP(expenseToDelete.amount)}?`
            : "¿Seguro que deseas eliminar este gasto?"
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        destructive
        onConfirm={onConfirmDelete}
        onClose={() => {
          setConfirmOpen(false);
          setExpenseToDelete(null);
        }}
      />
    </div>
  );
}
