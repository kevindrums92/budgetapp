import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useBudgetStore } from "@/state/budget.store";
import { formatCOP } from "@/shared/utils/currency.utils";
import { Plus, MapPin, Calendar, Plane, Download } from "lucide-react";
import type { Trip } from "@/types/budget.types";
import ConfirmDialog from "@/shared/components/modals/ConfirmDialog";
import RowMenu from "@/shared/components/ui/RowMenu";
import { exportTripsToCSV } from "@/shared/services/export.service";

const STATUS_COLORS: Record<Trip["status"], string> = {
  planning: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-gray-100 text-gray-600",
};

export default function TripsPage() {
  const { t } = useTranslation('trips');
  const navigate = useNavigate();
  const trips = useBudgetStore((s) => s.trips);
  const tripExpenses = useBudgetStore((s) => s.tripExpenses);
  const deleteTrip = useBudgetStore((s) => s.deleteTrip);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);

  const STATUS_LABELS: Record<Trip["status"], string> = {
    planning: t('labels.planning'),
    active: t('labels.inProgress'),
    completed: t('labels.completed'),
  };

  const { activeTrip, otherTrips } = useMemo(() => {
    const active = trips.find((t) => t.status === "active") ?? null;
    const others = trips
      .filter((t) => t.id !== active?.id)
      .sort((a, b) => b.createdAt - a.createdAt);
    return { activeTrip: active, otherTrips: others };
  }, [trips]);

  function getTripSpent(tripId: string) {
    return tripExpenses
      .filter((e) => e.tripId === tripId)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  function onAskDelete(trip: Trip) {
    setTripToDelete(trip);
    setConfirmOpen(true);
  }

  function onConfirmDelete() {
    if (!tripToDelete) return;
    deleteTrip(tripToDelete.id);
    setConfirmOpen(false);
    setTripToDelete(null);
  }

  function handleExportTrips() {
    if (trips.length === 0) return;

    // Add spent amount to each trip
    const tripsWithSpent = trips.map((trip) => ({
      ...trip,
      spent: getTripSpent(trip.id),
    }));

    exportTripsToCSV(tripsWithSpent, "viajes");
  }

  function formatDateRange(start: string, end: string | null) {
    const startDate = new Date(start + "T12:00:00");
    const startStr = startDate.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
    });

    if (!end) return t('labels.from', { date: startStr });

    const endDate = new Date(end + "T12:00:00");
    const endStr = endDate.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
    });

    return `${startStr} - ${endStr}`;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="pb-28">
        <div className="mx-auto max-w-xl px-4">
          {/* Header con título (siempre visible cuando hay viajes) */}
          {trips.length > 0 && (
            <div className="pt-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('title')}</h2>
              <p className="text-xs text-gray-500">{t('subtitle')}</p>
            </div>
          )}

          {/* Viaje activo destacado */}
          {activeTrip && (
            <div className="mb-6">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                {t('sections.current')}
              </p>
              <ActiveTripCard
                trip={activeTrip}
                spent={getTripSpent(activeTrip.id)}
                formatDateRange={formatDateRange}
                onView={() => navigate(`/trips/${activeTrip.id}`)}
                onEdit={() => navigate(`/trips/${activeTrip.id}/edit`)}
                onDelete={() => onAskDelete(activeTrip)}
                t={t}
              />
            </div>
          )}

          {/* Lista de otros viajes */}
          {otherTrips.length > 0 && (
            <div className={activeTrip ? "" : "mt-0"}>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                {activeTrip ? t('sections.other') : t('sections.upcoming')}
              </p>
              <div className="space-y-2">
                {otherTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    spent={getTripSpent(trip.id)}
                    formatDateRange={formatDateRange}
                    statusLabel={STATUS_LABELS[trip.status]}
                    onView={() => navigate(`/trips/${trip.id}`)}
                    onEdit={() => navigate(`/trips/${trip.id}/edit`)}
                    onDelete={() => onAskDelete(trip)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Export Button - Mostrar solo cuando hay viajes */}
          {trips.length > 0 && (
            <button
              type="button"
              onClick={handleExportTrips}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors mt-6"
            >
              <Download className="h-5 w-5" />
              {t('export')}
            </button>
          )}

          {/* Empty state */}
          {trips.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm mt-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Plane size={24} className="text-gray-400" />
              </div>
              <p className="font-medium text-gray-700">{t('emptyState.title')}</p>
              <p className="mt-1 text-sm text-gray-500">
                {t('emptyState.message')}
              </p>
              <button
                type="button"
                onClick={() => navigate("/trips/new")}
                className="mt-4 rounded-full bg-black px-6 py-2 text-sm font-medium text-white active:scale-[0.98] transition-transform"
              >
                {t('emptyState.button')}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* FAB para agregar viajes (solo cuando ya existen viajes) */}
      {trips.length > 0 && (
        <button
          type="button"
          onClick={() => navigate("/trips/new")}
          className="fixed right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] active:scale-95 transition-transform"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 96px)" }}
          aria-label="Nuevo viaje"
        >
          <Plus size={26} strokeWidth={2.2} />
        </button>
      )}

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title={t('delete.title')}
        message={t('delete.message')}
        confirmText={t('delete.confirm')}
        cancelText={t('delete.cancel')}
        destructive
        onConfirm={onConfirmDelete}
        onClose={() => {
          setConfirmOpen(false);
          setTripToDelete(null);
        }}
      />
    </div>
  );
}

function ActiveTripCard({
  trip,
  spent,
  formatDateRange,
  onView,
  onEdit,
  onDelete,
  t,
}: {
  trip: Trip;
  spent: number;
  formatDateRange: (start: string, end: string | null) => string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  t: (key: string) => string;
}) {
  const remaining = trip.budget - spent;
  const progress = trip.budget > 0 ? Math.min((spent / trip.budget) * 100, 100) : 0;
  const isOverBudget = spent > trip.budget;

  return (
    <div
      className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 cursor-pointer active:scale-[0.99] transition-transform shadow-sm"
      onClick={onView}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{trip.name}</h3>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <MapPin size={12} />
            <span>{trip.destination}</span>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <RowMenu onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">{t('labels.spent')}</span>
          <span className={isOverBudget ? "text-red-600 font-medium" : "text-gray-600"}>
            {formatCOP(spent)} / {formatCOP(trip.budget)}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isOverBudget ? "bg-red-500" : "bg-emerald-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar size={12} />
          <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
        </div>
        <div
          className={`text-xs font-medium ${
            isOverBudget ? "text-red-600" : "text-emerald-600"
          }`}
        >
          {isOverBudget
            ? `${t('labels.exceeded')} ${formatCOP(Math.abs(remaining))}`
            : `${t('labels.available')} ${formatCOP(remaining)}`}
        </div>
      </div>
    </div>
  );
}

function TripCard({
  trip,
  spent,
  formatDateRange,
  statusLabel,
  onView,
  onEdit,
  onDelete,
}: {
  trip: Trip;
  spent: number;
  formatDateRange: (start: string, end: string | null) => string;
  statusLabel: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const progress = trip.budget > 0 ? Math.min((spent / trip.budget) * 100, 100) : 0;

  return (
    <div
      className="rounded-xl bg-white p-3 cursor-pointer active:scale-[0.99] transition-transform shadow-sm"
      onClick={onView}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 truncate">{trip.name}</h3>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                STATUS_COLORS[trip.status]
              }`}
            >
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {trip.destination}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatDateRange(trip.startDate, trip.endDate)}
            </span>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <RowMenu onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>

      {/* Mini progress */}
      <div className="mt-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">{formatCOP(spent)}</span>
          <span className="text-gray-400">{formatCOP(trip.budget)}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
