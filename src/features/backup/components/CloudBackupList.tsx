import { useState, useEffect } from "react";
import { Cloud, Trash2, Download } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import {
  getCloudBackups,
  restoreCloudBackup,
  deleteCloudBackup,
  createCloudBackup,
  markCloudBackupCreated,
  type CloudBackup,
} from "@/features/backup/services/cloudBackup.service";
import { saveLocalBackup } from "@/features/backup/services/backup.service";

/**
 * CloudBackupList - Display and manage cloud backups from Supabase
 *
 * Features:
 * - List all cloud backups (last 30 days)
 * - Manual backup creation
 * - Restore from cloud backup (creates safety backup first)
 * - Delete cloud backups
 * - Mobile-first modals for all confirmations
 */
export default function CloudBackupList() {
  const [backups, setBackups] = useState<CloudBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Modal states
  const [confirmRestore, setConfirmRestore] = useState<{
    backup: CloudBackup;
    index: number;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    backup: CloudBackup;
    index: number;
  } | null>(null);
  const [showResult, setShowResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const replaceAllData = useBudgetStore((s) => s.replaceAllData);

  // Load backups on mount
  useEffect(() => {
    loadBackups();
  }, []);

  async function loadBackups() {
    try {
      setLoading(true);
      setError(null);
      const data = await getCloudBackups();
      setBackups(data);
    } catch (err) {
      console.error("[CloudBackupList] Failed to load backups:", err);
      setError(err instanceof Error ? err.message : "Error al cargar backups");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateManualBackup() {
    try {
      setCreating(true);
      const state = useBudgetStore.getState().getSnapshot();
      await createCloudBackup(state, "manual");
      markCloudBackupCreated();
      setShowResult({
        type: "success",
        message: "Backup manual creado exitosamente en la nube",
      });
      await loadBackups(); // Reload list
    } catch (err) {
      console.error("[CloudBackupList] Failed to create manual backup:", err);
      setShowResult({
        type: "error",
        message:
          err instanceof Error ? err.message : "Error al crear backup manual",
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleRestoreConfirm() {
    if (!confirmRestore) return;

    try {
      // Create safety backup before restore
      console.log("[CloudBackupList] Creating safety backup before restore...");
      const currentState = useBudgetStore.getState().getSnapshot();
      await saveLocalBackup(currentState);

      // Restore from cloud
      console.log("[CloudBackupList] Restoring from cloud backup...");
      const backupData = await restoreCloudBackup(confirmRestore.backup.id);

      // Replace all data
      replaceAllData(backupData.data);

      setConfirmRestore(null);
      setShowResult({
        type: "success",
        message: "Backup restaurado exitosamente. La página se recargará.",
      });

      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error("[CloudBackupList] Failed to restore backup:", err);
      setConfirmRestore(null);
      setShowResult({
        type: "error",
        message:
          err instanceof Error ? err.message : "Error al restaurar backup",
      });
    }
  }

  async function handleDeleteConfirm() {
    if (!confirmDelete) return;

    try {
      await deleteCloudBackup(confirmDelete.backup.id);
      setConfirmDelete(null);
      setShowResult({
        type: "success",
        message: "Backup eliminado exitosamente",
      });
      await loadBackups(); // Reload list
    } catch (err) {
      console.error("[CloudBackupList] Failed to delete backup:", err);
      setConfirmDelete(null);
      setShowResult({
        type: "error",
        message: err instanceof Error ? err.message : "Error al eliminar backup",
      });
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getBackupTypeLabel(type: string): string {
    switch (type) {
      case "manual":
        return "Manual";
      case "auto":
        return "Automático";
      case "pre-migration":
        return "Pre-migración";
      default:
        return type;
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Cloud className="h-5 w-5 text-blue-500" />
          <h3 className="text-base font-semibold text-gray-900">
            Backups en la Nube
          </h3>
        </div>
        <p className="text-sm text-gray-500">Cargando backups...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Cloud className="h-5 w-5 text-blue-500" />
          <h3 className="text-base font-semibold text-gray-900">
            Backups en la Nube
          </h3>
        </div>
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={loadBackups}
          className="mt-3 text-sm text-blue-500 hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-500" />
            <h3 className="text-base font-semibold text-gray-900">
              Backups en la Nube
            </h3>
          </div>
          <button
            type="button"
            onClick={handleCreateManualBackup}
            disabled={creating}
            className="rounded-xl bg-blue-500 px-4 py-2 text-xs font-medium text-white hover:bg-blue-600 disabled:bg-gray-300"
          >
            {creating ? "Creando..." : "Crear Backup"}
          </button>
        </div>

        {backups.length === 0 ? (
          <p className="text-sm text-gray-500">
            No hay backups en la nube. Crea tu primer backup manual o espera el
            backup automático semanal.
          </p>
        ) : (
          <div className="space-y-3">
            {backups.map((backup, index) => (
              <div
                key={backup.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(backup.created_at)}
                    </p>
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                      {getBackupTypeLabel(backup.backup_type)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {backup.total_transactions} transacciones • {backup.total_trips}{" "}
                    viajes • {formatSize(backup.size_bytes)}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-3">
                  <button
                    type="button"
                    onClick={() => setConfirmRestore({ backup, index })}
                    className="rounded-lg bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100"
                    aria-label="Restaurar backup"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete({ backup, index })}
                    className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100"
                    aria-label="Eliminar backup"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 text-xs text-gray-400">
          Los backups se eliminan automáticamente después de 30 días. Se crea un
          backup automático cada 7 días.
        </p>
      </div>

      {/* Restore Confirmation Modal */}
      {confirmRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmRestore(null)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              ¿Restaurar backup de la nube?
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Esto reemplazará tus datos actuales con el backup del{" "}
              <span className="font-medium">
                {formatDate(confirmRestore.backup.created_at)}
              </span>
              .
            </p>
            <p className="mb-4 text-sm text-gray-500">
              Se creará un backup de seguridad local automáticamente antes de
              restaurar.
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
                {formatDate(confirmDelete.backup.created_at)}
              </span>
              ?
            </p>
            <p className="mb-4 text-sm text-gray-500">
              Esta acción no se puede deshacer.
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

      {/* Success/Error Result Modal */}
      {showResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowResult(null)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {showResult.type === "success" ? "✅ Éxito" : "❌ Error"}
            </h3>
            <p className="mb-4 text-sm text-gray-600">{showResult.message}</p>
            <button
              type="button"
              onClick={() => setShowResult(null)}
              className={`w-full rounded-xl py-3 text-sm font-medium text-white ${
                showResult.type === "success"
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
