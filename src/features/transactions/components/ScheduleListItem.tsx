import { useState } from "react";
import { icons, Power } from "lucide-react";
import { formatCOP } from "@/shared/utils/currency.utils";
import { kebabToPascal } from "@/shared/utils/string.utils";
import { formatScheduleFrequency, formatNextDate } from "@/shared/utils/schedule.utils";
import { calculateNextDate } from "@/shared/services/scheduler.service";
import { todayISO } from "@/services/dates.service";
import type { Transaction, Category } from "@/types/budget.types";

interface ScheduleListItemProps {
  transaction: Transaction;
  category?: Category;
  isEnded?: boolean;
  onInactivate?: (id: string) => void;
}

export default function ScheduleListItem({
  transaction,
  category,
  isEnded = false,
  onInactivate,
}: ScheduleListItemProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const IconComponent = category
    ? icons[kebabToPascal(category.icon) as keyof typeof icons]
    : null;

  // Calculate next date for active schedules
  const today = todayISO();
  const nextDate = transaction.schedule && !isEnded
    ? calculateNextDate(transaction.schedule, today)
    : null;

  const handleInactivateConfirm = () => {
    onInactivate?.(transaction.id);
    setShowConfirm(false);
  };

  return (
    <>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        {/* Header: Icon + Name + Badge */}
        <div className="flex items-start gap-3">
          {/* Category Icon */}
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: category ? category.color + "20" : "#f3f4f6",
            }}
          >
            {IconComponent ? (
              <IconComponent
                className="h-5 w-5"
                style={{ color: category?.color }}
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-gray-300" />
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-semibold text-gray-900">
                {transaction.name}
              </p>
              {/* Status Badge */}
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  isEnded
                    ? "bg-gray-100 text-gray-500"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {isEnded ? "Inactiva" : "Activa"}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {category?.name || transaction.category}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="mt-3 space-y-1">
          {/* Amount */}
          <p
            className={`font-semibold ${
              transaction.type === "income" ? "text-emerald-600" : "text-gray-900"
            }`}
          >
            {transaction.type === "income" ? "+" : "-"}
            {formatCOP(transaction.amount)}
          </p>

          {/* Frequency */}
          {transaction.schedule && (
            <p className="text-sm text-gray-500">
              {formatScheduleFrequency(transaction.schedule)}
            </p>
          )}

          {/* Next date (only for active) */}
          {nextDate && !isEnded && (
            <p className="text-sm text-gray-500">
              Próxima: {formatNextDate(nextDate)}
            </p>
          )}
        </div>

        {/* Actions (only for active) */}
        {!isEnded && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-50 py-2.5 text-sm font-medium text-orange-600 hover:bg-orange-100 transition-colors"
            >
              <Power className="h-4 w-4" />
              Desactivar
            </button>
          </div>
        )}
      </div>

      {/* Inactivate Confirmation Modal */}
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
              Desactivar programación
            </h3>
            <p className="mb-3 text-sm text-gray-600">
              Esto desactivará la programación de "{transaction.name}".
              No se generarán más transacciones automáticamente.
            </p>
            <div className="mb-4 rounded-lg bg-orange-50 p-3">
              <p className="text-xs font-medium text-orange-700">
                Esta acción es irreversible. Si deseas activarla de nuevo, deberás crear una nueva programación.
              </p>
            </div>
            <p className="mb-4 text-xs text-gray-500">
              Las transacciones ya registradas no se verán afectadas.
            </p>

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
                onClick={handleInactivateConfirm}
                className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-medium text-white hover:bg-orange-600"
              >
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
