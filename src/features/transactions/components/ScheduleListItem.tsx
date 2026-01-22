import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { icons, Pencil, Ban } from "lucide-react";
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
  onInactivate: (id: string) => void;
}

export default function ScheduleListItem({
  transaction,
  category,
  isEnded = false,
  onInactivate,
}: ScheduleListItemProps) {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const IconComponent = category
    ? icons[kebabToPascal(category.icon) as keyof typeof icons]
    : null;

  // Calculate next date for active schedules
  const today = todayISO();
  const nextDate = transaction.schedule && !isEnded
    ? calculateNextDate(transaction.schedule, today)
    : null;

  const handleEdit = () => {
    navigate(`/edit/${transaction.id}`);
  };

  const handleInactivateConfirm = () => {
    onInactivate(transaction.id);
    setShowConfirm(false);
  };

  return (
    <>
      <div
        className={`rounded-2xl bg-white p-4 shadow-sm ${
          isEnded ? "opacity-60" : ""
        }`}
      >
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

          {/* End date (only for ended) */}
          {isEnded && transaction.schedule?.endDate && (
            <p className="text-sm text-gray-400">
              Inactivada el {formatNextDate(transaction.schedule.endDate)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleEdit}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>
          {!isEnded && (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-orange-50 py-2.5 text-sm font-medium text-orange-600 hover:bg-orange-100 transition-colors"
            >
              <Ban className="h-4 w-4" />
              Inactivar
            </button>
          )}
        </div>
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
              Inactivar programación
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Esto inactivará la programación de "{transaction.name}".
              No se generarán más transacciones automáticamente.
            </p>
            <p className="mb-4 text-xs text-gray-500">
              Esta acción es irreversible. Las transacciones ya registradas no se verán afectadas.
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
                Inactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
