import { useState } from "react";
import { Calendar, ChevronRight, X } from "lucide-react";
import type { VirtualTransaction } from "@/shared/services/scheduler.service";
import { formatCOP } from "@/shared/utils/currency.utils";

interface ScheduledBannerProps {
  virtualTransactions: VirtualTransaction[];
  selectedMonth: string;
  onRegisterAll: () => void;
  onDismiss: () => void;
  onDismissForMonth: (month: string) => void;
}

export default function ScheduledBanner({
  virtualTransactions,
  selectedMonth,
  onRegisterAll,
  onDismiss,
  onDismissForMonth,
}: ScheduledBannerProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);

  if (virtualTransactions.length === 0) {
    return null;
  }

  const count = virtualTransactions.length;

  const handleConfirm = () => {
    onRegisterAll();
    setShowConfirm(false);
  };

  return (
    <>
      <div className="mx-4 mb-3">
        {/* Main card - Tappable to show confirmation */}
        <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="w-full text-left active:opacity-90 transition-opacity"
          >
            <div className="flex items-start gap-3 pr-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  {count} {count === 1 ? "transaccion programada" : "transacciones programadas"}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs font-medium text-white">
                  <span>Registrar todas</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDismissConfirm(true);
            }}
            className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* Dismiss Confirmation Modal */}
      {showDismissConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDismissConfirm(false)}
          />

          {/* Modal Card */}
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Ocultar transacciones programadas
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              ¿Cómo quieres ocultar este banner?
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  onDismissForMonth(selectedMonth);
                  setShowDismissConfirm(false);
                }}
                className="w-full rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                No volver a mostrar este mes
              </button>
              <button
                type="button"
                onClick={() => {
                  onDismiss();
                  setShowDismissConfirm(false);
                }}
                className="w-full rounded-xl bg-purple-500 py-3 text-sm font-medium text-white hover:bg-purple-600"
              >
                Solo por esta vez
              </button>
              <button
                type="button"
                onClick={() => setShowDismissConfirm(false)}
                className="w-full rounded-xl py-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowConfirm(false)}
          />

          {/* Modal Card */}
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Registrar transacciones
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Se registraran {count} transacciones programadas.
            </p>

            {/* Transaction list preview */}
            <div className="mb-4 max-h-40 overflow-y-auto rounded-xl bg-gray-50 p-3">
              {virtualTransactions.map((vt) => (
                <div key={vt.id} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-gray-700 truncate flex-1 mr-2">{vt.name}</span>
                  <span className={`font-medium whitespace-nowrap ${vt.type === "income" ? "text-emerald-600" : "text-gray-900"}`}>
                    {vt.type === "income" ? "+" : "-"}{formatCOP(vt.amount)}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-xl bg-purple-500 py-3 text-sm font-medium text-white hover:bg-purple-600"
              >
                Registrar todas
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
