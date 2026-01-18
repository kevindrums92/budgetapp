import { useState, useEffect } from "react";
import { X, AlertTriangle, Calendar, FileText, MapPin } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { restoreBackup, saveLocalBackup } from "@/services/backup.service";
import { upsertCloudState } from "@/services/cloudState.service";
import type { BackupFile } from "@/types/backup.types";

type Props = {
  backup: BackupFile;
  onClose: () => void;
};

export default function BackupPreviewModal({ backup, onClose }: Props) {
  const getSnapshot = useBudgetStore((s) => s.getSnapshot);
  const replaceAllData = useBudgetStore((s) => s.replaceAllData);
  const cloudMode = useBudgetStore((s) => s.cloudMode);

  const [isVisible, setIsVisible] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);

  const currentState = getSnapshot();

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }

  async function handleRestore() {
    setIsRestoring(true);

    try {
      // 1. Create safety backup of current state
      console.log("[Backup] Creating safety backup before restore...");
      await saveLocalBackup(currentState);

      // 2. Restore from backup
      console.log("[Backup] Restoring backup...");
      const restoredState = restoreBackup(backup, "replace");
      replaceAllData(restoredState);

      // 3. Push to cloud if in cloud mode
      if (cloudMode === "cloud") {
        console.log("[Backup] Pushing restored state to cloud...");
        await upsertCloudState(restoredState);
      }

      console.log("[Backup] Restore successful");

      // Show success modal
      setShowSuccess(true);
    } catch (error) {
      console.error("[Backup] Restore failed:", error);
      setShowError(error instanceof Error ? error.message : "Unknown error");
      setIsRestoring(false);
    }
  }

  function handleSuccessConfirm() {
    window.location.reload();
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Success modal
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            ✅ Backup Restaurado
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            El backup se restauró exitosamente. La página se recargará para aplicar los cambios.
          </p>
          <button
            type="button"
            onClick={handleSuccessConfirm}
            className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Recargar Página
          </button>
        </div>
      </div>
    );
  }

  // Error modal
  if (showError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            ❌ Error al Restaurar
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            {showError}
          </p>
          <button
            type="button"
            onClick={() => {
              setShowError(null);
              handleClose();
            }}
            className="w-full rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 transform transition-all duration-200 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            ¿Restaurar Backup?
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Backup Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={16} />
              <span>Creado: {formatDate(backup.meta.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText size={16} />
              <span>
                Versión: {backup.meta.appVersion} (Schema v{backup.data.schemaVersion})
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Contenido del Backup
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Transacciones:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {backup.stats.totalTransactions}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Viajes:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {backup.stats.totalTrips}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Categorías:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {backup.stats.totalCategories}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Grupos:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {backup.stats.totalCategoryGroups}
                </span>
              </div>
            </div>
            {backup.stats.dateRange && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">
                <MapPin size={14} />
                <span>
                  Rango: {backup.stats.dateRange.from} - {backup.stats.dateRange.to}
                </span>
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-900 mb-1">Advertencia</p>
                <p className="text-amber-800">
                  Esto reemplazará tus datos actuales:
                </p>
                <ul className="mt-1 space-y-0.5 text-amber-700">
                  <li>• Transacciones actuales: {currentState.transactions.length}</li>
                  <li>• Viajes actuales: {currentState.trips?.length ?? 0}</li>
                </ul>
                <p className="text-amber-800 mt-2">
                  Se creará un backup automático de tus datos actuales antes de restaurar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isRestoring}
            className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleRestore}
            disabled={isRestoring}
            className="flex-1 rounded-xl bg-blue-500 py-3 text-sm font-medium text-white hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50"
          >
            {isRestoring ? "Restaurando..." : "Restaurar"}
          </button>
        </div>
      </div>
    </div>
  );
}
