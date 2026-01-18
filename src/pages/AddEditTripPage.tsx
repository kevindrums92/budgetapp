import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBudgetStore } from "@/state/budget.store";
import { todayISO } from "@/services/dates.service";
import type { TripStatus } from "@/types/budget.types";
import PageHeader from "@/components/PageHeader";

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

  // Precarga / Reset
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
    // creando
    setName("");
    setDestination("");
    setBudget("");
    setStartDate(todayISO());
    setEndDate("");
    setStatus("active");
  }, [trip]);

  // Si intentan entrar a /trips/:id/edit que no existe => volvemos
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

  return (
    <div className="min-h-[100dvh] bg-white">
      {/* Top bar */}
      <PageHeader
        title={
          <div className="flex flex-col -mt-1">
            <span className="font-semibold text-gray-900">
              {trip ? "Editar viaje" : "Nuevo viaje"}
            </span>
            <span className="text-[11px] text-gray-500">
              {trip ? "Actualiza los datos" : "Crea un viaje para trackear gastos"}
            </span>
          </div>
        }
        onBack={goBack}
      />

      {/* Content */}
      <div className="mx-auto max-w-xl px-4 py-4 pb-36">
        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre del viaje</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: San Andrés 2026, Europa Verano..."
              className="w-full border px-3 py-2 text-sm outline-none focus:border-[#18B7B0]"
            />
          </div>

          {/* Destino */}
          <div>
            <label className="mb-1 block text-sm font-medium">Destino</label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Ej: San Andrés, Colombia"
              className="w-full border px-3 py-2 text-sm outline-none focus:border-[#18B7B0]"
            />
          </div>

          {/* Presupuesto */}
          <div>
            <label className="mb-1 block text-sm font-medium">Presupuesto</label>
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              inputMode="numeric"
              placeholder="Ej: 2000000"
              className="w-full border px-3 py-2 text-sm outline-none focus:border-[#18B7B0]"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              Cuánto planeas gastar en total (sin puntos ni comas).
            </p>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Fecha inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border px-3 py-2 text-sm outline-none focus:border-[#18B7B0]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Fecha fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border px-3 py-2 text-sm outline-none focus:border-[#18B7B0]"
              />
              <p className="mt-1 text-[11px] text-gray-500">Opcional</p>
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="mb-1 block text-sm font-medium">Estado</label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`border px-3 py-2 text-sm font-medium ${
                    status === opt.value ? "bg-black text-white" : "bg-white text-gray-900"
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
              {trip ? "Guardar cambios" : "Crear viaje"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
