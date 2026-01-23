import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarClock, ChevronRight, X } from "lucide-react";
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
  const { t } = useTranslation("transactions");
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
      <div className="mx-4 mb-5">
        <section className="bg-violet-50 border border-violet-100 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          {/* Fondo decorativo sutil */}
          <div className="absolute left-0 bottom-0 w-24 h-24 bg-violet-100/50 rounded-full -ml-8 -mb-8 blur-xl" />

          {/* Main content */}
          <div className="relative z-10 flex items-center gap-3">
            {/* Ícono centrado verticalmente */}
            <div className="w-10 h-10 rounded-full bg-white text-violet-600 flex items-center justify-center shadow-sm border border-violet-50 shrink-0">
              {/* Icono con animación de pulso */}
              <div className="relative">
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-ping opacity-75" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
                <CalendarClock size={20} strokeWidth={2} />
              </div>
            </div>

            {/* Contenido: título + botón */}
            <div className="flex-1">
              <p className="text-sm text-gray-800 font-bold leading-tight mb-1">
                {count} {t(count === 1 ? "scheduledBanner.singular" : "scheduledBanner.plural")}
              </p>
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="text-violet-600 font-bold text-sm flex items-center gap-1 hover:text-violet-700 active:scale-95 transition"
              >
                {t("scheduledBanner.review")}
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDismissConfirm(true);
            }}
            className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 hover:bg-white active:scale-95 transition-all z-20 shadow-sm"
          >
            <X className="h-3.5 w-3.5 text-violet-600" />
          </button>
        </section>
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
              {t("scheduledBanner.hideModal.title")}
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              {t("scheduledBanner.hideModal.message")}
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
                {t("scheduledBanner.hideModal.neverShowMonth")}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDismiss();
                  setShowDismissConfirm(false);
                }}
                className="w-full rounded-xl bg-violet-600 py-3 text-sm font-medium text-white hover:bg-violet-700"
              >
                {t("scheduledBanner.hideModal.hideOnce")}
              </button>
              <button
                type="button"
                onClick={() => setShowDismissConfirm(false)}
                className="w-full rounded-xl py-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                {t("scheduledBanner.hideModal.cancel")}
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
              {t("scheduledBanner.confirmModal.title")}
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              {t("scheduledBanner.confirmModal.message", { count })}
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
                {t("scheduledBanner.confirmModal.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-xl bg-violet-600 py-3 text-sm font-medium text-white hover:bg-violet-700"
              >
                {t("scheduledBanner.confirmModal.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
