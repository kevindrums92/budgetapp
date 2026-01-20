import { useState } from "react";
import { Clock, HardDrive, Trash2 } from "lucide-react";
import {
  getLocalBackups,
  deleteLocalBackup,
  restoreLocalBackup,
  saveLocalBackup,
} from "@/features/backup/services/backup.service";
import { useBudgetStore } from "@/state/budget.store";
import { saveState } from "@/services/storage.service";
import type { LocalBackupEntry } from "@/features/backup/types/backup.types";

export default function LocalBackupList() {
  const [backups, setBackups] = useState<LocalBackupEntry[]>(() => getLocalBackups());
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState<LocalBackupEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<LocalBackupEntry | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const replaceAllData = useBudgetStore((s) => s.replaceAllData);
  const getSnapshot = useBudgetStore((s) => s.getSnapshot);

  const refreshBackups = () => {
    setBackups(getLocalBackups());
  };

  const handleRestoreClick = (entry: LocalBackupEntry) => {
    setConfirmRestore(entry);
  };

  const handleRestoreConfirm = async () => {
    if (!confirmRestore || isRestoring) return;

    setIsRestoring(true);
    setConfirmRestore(null);

    try {
      // Create safety backup before restore
      console.log("[LocalBackup] Creating safety backup before restore...");
      const currentState = getSnapshot();
      await saveLocalBackup(currentState);

      // Restore from backup
      const restoredState = restoreLocalBackup(confirmRestore.key);
      if (!restoredState) {
        throw new Error("Failed to restore backup");
      }

      replaceAllData(restoredState);
      saveState(restoredState);

      setSuccessMessage("Backup restaurado exitosamente");
      refreshBackups();
    } catch (error) {
      console.error("[LocalBackup] Restore failed:", error);
      setSuccessMessage("Error al restaurar backup. Tus datos no fueron modificados.");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteClick = (entry: LocalBackupEntry) => {
    setConfirmDelete(entry);
  };

  const handleDeleteConfirm = () => {
    if (!confirmDelete) return;

    deleteLocalBackup(confirmDelete.key);
    setConfirmDelete(null);
    refreshBackups();
  };

  if (backups.length === 0) {
    return (
      <div className="rounded-xl bg-gray-50 p-4 text-center">
        <HardDrive className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">
          No hay backups automáticos locales
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Se crean automáticamente cada 7 días
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Backups Automáticos Locales
        </h3>
        <span className="text-xs text-gray-500">
          {backups.length}/{5} backups
        </span>
      </div>

      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
        {backups.map((entry) => (
          <div
            key={entry.key}
            className="flex items-center gap-3 px-3 py-3"
          >
            {/* Icon */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {formatDate(entry.backup.meta.createdAt)}
              </p>
              <p className="text-xs text-gray-500">
                {entry.backup.stats.totalTransactions} transacciones,{" "}
                {entry.backup.stats.totalTrips} viajes
                {" · "}
                {formatSize(entry.sizeBytes)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => handleRestoreClick(entry)}
                disabled={isRestoring}
                className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white active:bg-blue-600 disabled:opacity-50"
              >
                {isRestoring ? "..." : "Restaurar"}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteClick(entry)}
                disabled={isRestoring}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        💡 Los backups se crean automáticamente cada 24 horas y antes de operaciones críticas.
        Se mantienen los últimos 5 backups (máx. 5MB).
      </p>

      {/* Restore Confirmation Modal */}
      {confirmRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmRestore(null)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              ¿Restaurar backup?
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Esto reemplazará tus datos actuales con el backup del{" "}
              <span className="font-medium">
                {formatDate(confirmRestore.backup.meta.createdAt)}
              </span>
              .
            </p>
            <p className="mb-4 text-sm text-gray-500">
              Se creará un backup de seguridad automáticamente antes de restaurar.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmRestore(null)}
                className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRestoreConfirm}
                className="flex-1 rounded-xl bg-blue-500 py-3 text-sm font-medium text-white hover:bg-blue-600"
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              ¿Eliminar backup?
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              ¿Estás seguro de que deseas eliminar el backup del{" "}
              <span className="font-medium">
                {formatDate(confirmDelete.backup.meta.createdAt)}
              </span>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-medium text-white hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message Modal */}
      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSuccessMessage(null)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {successMessage.includes("exitosamente") ? "✅ Éxito" : "❌ Error"}
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              {successMessage}
            </p>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Hoy ${date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays === 1) {
    return `Ayer ${date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  } else {
    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
