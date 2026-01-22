import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBudgetStore } from "@/state/budget.store";
import { formatCOP } from "@/shared/utils/currency.utils";
import {
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
import type { TripExpenseCategory } from "@/types/budget.types";
import PageHeader from "@/shared/components/layout/PageHeader";

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

  useEffect(() => {
    if (!trip && params.id) navigate("/trips", { replace: true });
  }, [trip, params.id, navigate]);

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
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PageHeader
        title={
          <div className="flex flex-col -mt-1">
            <span className="font-semibold text-gray-900">{trip.name}</span>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={11} />
              <span>{trip.destination}</span>
            </div>
          </div>
        }
        onBack={() => navigate("/trips")}
      />

      <div className="flex-1 px-4 pt-6 pb-8">
        {/* Budget summary */}
        <div className="rounded-xl bg-white p-4 shadow-sm mb-6">
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

        {/* Category breakdown */}
        {Object.keys(spentByCategory).length > 0 && (
          <div className="mb-6">
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
                      className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 shadow-sm"
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
        )}

        {/* Expenses list */}
        <div>
          {expenses.length > 0 && (
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Gastos ({expenses.length})
            </p>
          )}

          {expenses.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center shadow-sm">
              <p className="text-sm text-gray-500">
                Aún no hay gastos registrados en este viaje.
              </p>
              <button
                type="button"
                onClick={() => navigate(`/trips/${trip.id}/expense/new`)}
                className="mt-3 rounded-full bg-black px-4 py-2 text-sm font-medium text-white active:scale-[0.98] transition-transform"
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
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => navigate(`/trips/${trip.id}/expense/${e.id}/edit`)}
                    className="w-full flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`shrink-0 rounded-full p-2 ${config.color}`}>
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{e.name}</p>
                        <p className="text-xs text-gray-500">
                          {config.label} • {formatDate(e.date)}
                        </p>
                      </div>
                    </div>

                    <span className="whitespace-nowrap font-semibold text-gray-900">
                      {formatCOP(e.amount)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FAB para agregar (solo cuando ya hay gastos) */}
      {expenses.length > 0 && (
        <button
          type="button"
          onClick={() => navigate(`/trips/${trip.id}/expense/new`)}
          className="fixed right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] active:scale-95 transition-transform"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 96px)" }}
          aria-label="Agregar gasto"
        >
          <Plus size={26} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}
