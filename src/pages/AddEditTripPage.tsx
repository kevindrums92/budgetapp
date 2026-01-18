import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBudgetStore } from "@/state/budget.store";
import { todayISO } from "@/services/dates.service";
import type { TripStatus } from "@/types/budget.types";
import PageHeader from "@/components/PageHeader";
import DatePicker from "@/components/DatePicker";
import { Calendar } from "lucide-react";

const STATUS_OPTIONS: { value: TripStatus; label: string }[] = [
  { value: "planning", label: "Planificando" },
  { value: "active", label: "En curso" },
  { value: "completed", label: "Completado" },
];

export default function AddEditTripPage() {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const isEdit = Boolean(params.id);

  const addTrip = useBudgetStore((s) => s.addTrip);
  const updateTrip = useBudgetStore((s) => s.updateTrip);
  const trips = useBudgetStore((s) => s.trips);

  const trip = useMemo(() => {
    if (!isEdit || !params.id) return null;
    return trips.find((t) => t.id === params.id) ?? null;
  }, [isEdit, params.id, trips]);

  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState<string>("");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState<string>("");
  const [status, setStatus] = useState<TripStatus>("active");

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    if (trip) {
      setName(trip.name);
      setDestination(trip.destination);
      setBudget(String(trip.budget));
      setStartDate(trip.startDate);
      setEndDate(trip.endDate ?? "");
      setStatus(trip.status);
      return;
    }
    setName("");
    setDestination("");
    setBudget("");
    setStartDate(todayISO());
    setEndDate("");
    setStatus("active");
  }, [trip]);

  useEffect(() => {
    if (isEdit && !trip) navigate("/trips", { replace: true });
  }, [isEdit, trip, navigate]);

  const budgetNumber = Number(budget);
  const canSave =
    name.trim().length > 0 &&
    destination.trim().length > 0 &&
    Number.isFinite(budgetNumber) &&
    budgetNumber >= 0 &&
    startDate.length === 10;

  function goBack() {
    navigate(-1);
  }

  function handleSave() {
    if (!canSave) return;

    if (trip) {
      updateTrip(trip.id, {
        name: name.trim(),
        destination: destination.trim(),
        budget: budgetNumber,
        startDate,
        endDate: endDate || null,
        status,
      });
      goBack();
      return;
    }

    addTrip({
      name: name.trim(),
      destination: destination.trim(),
      budget: budgetNumber,
      startDate,
      endDate: endDate || null,
      status,
    });

    navigate("/trips", { replace: true });
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

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PageHeader
        title={trip ? "Editar viaje" : "Nuevo viaje"}
        onBack={goBack}
      />

      <div className="flex-1 px-4 pt-6 pb-8">
        <div className="space-y-4">
          {/* Nombre */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Nombre del viaje
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: San Andrés 2026, Europa Verano..."
              className="w-full text-base text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>

          {/* Destino */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Destino
            </label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Ej: San Andrés, Colombia"
              className="w-full text-base text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>

          {/* Presupuesto */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Presupuesto
            </label>
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              inputMode="numeric"
              placeholder="Ej: 2000000"
              className="w-full text-base text-gray-900 outline-none placeholder:text-gray-400"
            />
            <p className="mt-1 text-xs text-gray-400">
              Cuánto planeas gastar en total (sin puntos ni comas).
            </p>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setShowStartDatePicker(true)}
              className="rounded-2xl bg-white p-4 shadow-sm text-left"
            >
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Fecha inicio
              </label>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-400" />
                <span className="text-base text-gray-900">
                  {formatDate(startDate)}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowEndDatePicker(true)}
              className="rounded-2xl bg-white p-4 shadow-sm text-left"
            >
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Fecha fin
              </label>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-400" />
                <span className={`text-base ${endDate ? "text-gray-900" : "text-gray-400"}`}>
                  {endDate ? formatDate(endDate) : "Opcional"}
                </span>
              </div>
            </button>
          </div>

          {/* Estado */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-500">
              Estado
            </label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                    status === opt.value
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
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
            {trip ? "Guardar cambios" : "Crear viaje"}
          </button>
        </div>
      </div>

      {/* Date pickers */}
      <DatePicker
        open={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        value={startDate}
        onChange={setStartDate}
      />

      <DatePicker
        open={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        value={endDate || todayISO()}
        onChange={setEndDate}
      />
    </div>
  );
}
