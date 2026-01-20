import { useState, useEffect } from "react";
import { Download, RefreshCw, Cloud } from "lucide-react";
import PageHeader from "@/shared/components/layout/PageHeader";
import BackupExportButton from "@/features/backup/components/BackupExportButton";
import BackupImportButton from "@/features/backup/components/BackupImportButton";
import LocalBackupList from "@/features/backup/components/LocalBackupList";
import CloudBackupList from "@/features/backup/components/CloudBackupList";
import BackupMethodSelector from "@/features/backup/components/BackupMethodSelector";
import { useBudgetStore } from "@/state/budget.store";

type BackupMethod = "manual" | "local" | "cloud";

const BACKUP_METHOD_KEY = "budget.backupMethod";

export default function BackupPage() {
  const cloudMode = useBudgetStore((s) => s.cloudMode);
  const [selectedMethod, setSelectedMethod] = useState<BackupMethod | null>(null);

  // Load saved preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BACKUP_METHOD_KEY);
      if (saved === "manual" || saved === "local" || saved === "cloud") {
        setSelectedMethod(saved);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  function handleSelectMethod(method: BackupMethod) {
    setSelectedMethod(method);
    try {
      localStorage.setItem(BACKUP_METHOD_KEY, method);
    } catch {
      // Ignore localStorage errors
    }
  }

  function handleChangeMethod() {
    setSelectedMethod(null);
    try {
      localStorage.removeItem(BACKUP_METHOD_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }

  // Show introduction if no method selected
  if (!selectedMethod) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <PageHeader title="Backup & Restore" />

        <div className="flex-1 px-4 pt-6 pb-8">
          <BackupMethodSelector
            onSelect={handleSelectMethod}
            cloudMode={cloudMode}
          />
        </div>
      </div>
    );
  }

  // Show tabs with selected method
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PageHeader title="Backup & Restore" />

      {/* Tabs */}
      <div className="sticky top-[60px] z-10 bg-white border-b border-gray-200 px-4">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => handleSelectMethod("manual")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              selectedMethod === "manual"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-gray-500 border-b-2 border-transparent"
            }`}
          >
            <Download size={16} />
            Manual
          </button>

          <button
            type="button"
            onClick={() => handleSelectMethod("local")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              selectedMethod === "local"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-gray-500 border-b-2 border-transparent"
            }`}
          >
            <RefreshCw size={16} />
            Local
          </button>

          <button
            type="button"
            onClick={() => handleSelectMethod("cloud")}
            disabled={cloudMode === "guest"}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              cloudMode === "guest"
                ? "text-gray-300 border-b-2 border-transparent cursor-not-allowed"
                : selectedMethod === "cloud"
                  ? "text-emerald-600 border-b-2 border-emerald-600"
                  : "text-gray-500 border-b-2 border-transparent"
            }`}
          >
            <Cloud size={16} />
            Nube
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-6 pb-8">
        {/* Manual Backup Tab */}
        {selectedMethod === "manual" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Backup Manual
              </h2>
              <p className="text-sm text-gray-600">
                Exporta e importa tus datos en formato JSON
              </p>
            </div>

            {/* Export */}
            <div className="space-y-2.5">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Exportar</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Descarga tus datos en formato JSON
                </p>
              </div>
              <BackupExportButton />
            </div>

            {/* Restore */}
            <div className="space-y-2.5">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Restaurar</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Esto reemplazará tus datos actuales
                </p>
              </div>
              <BackupImportButton />
            </div>

            {/* Info */}
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                💡 ¿Qué incluye el backup?
              </p>
              <ul className="space-y-1 text-xs text-blue-700">
                <li>• Todas tus transacciones</li>
                <li>• Viajes y gastos de viaje</li>
                <li>• Categorías personalizadas</li>
                <li>• Verificación SHA-256</li>
              </ul>
              <p className="mt-3 text-xs text-blue-600">
                💾 Guarda tus backups en un lugar seguro como Google Drive o Dropbox
              </p>
            </div>
          </div>
        )}

        {/* Local Auto-Backup Tab */}
        {selectedMethod === "local" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Backups Automáticos Locales
              </h2>
              <p className="text-sm text-gray-600">
                Se crean automáticamente cada 24 horas
              </p>
            </div>

            <LocalBackupList />

            {/* Info */}
            <div className="rounded-xl bg-purple-50 p-4">
              <p className="text-sm text-purple-900 font-medium mb-2">
                🔄 ¿Cómo funcionan?
              </p>
              <ul className="space-y-1 text-xs text-purple-700">
                <li>• Se crean automáticamente cada 24 horas</li>
                <li>• Se mantienen los últimos 5 backups</li>
                <li>• Tamaño máximo total: 5MB</li>
                <li>• Se crean antes de operaciones críticas</li>
              </ul>
            </div>
          </div>
        )}

        {/* Cloud Backup Tab */}
        {selectedMethod === "cloud" && (
          <div className="space-y-6">
            {cloudMode === "guest" ? (
              <div className="rounded-xl bg-amber-50 p-6 text-center">
                <p className="text-amber-900 font-medium mb-2">
                  🔒 Requiere Autenticación
                </p>
                <p className="text-sm text-amber-700">
                  Inicia sesión para usar backups en la nube
                </p>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Backups en la Nube
                  </h2>
                  <p className="text-sm text-gray-600">
                    Sincronizados automáticamente cada 7 días
                  </p>
                </div>

                <CloudBackupList />

                {/* Info */}
                <div className="rounded-xl bg-sky-50 p-4">
                  <p className="text-sm text-sky-900 font-medium mb-2">
                    ☁️ ¿Cómo funcionan?
                  </p>
                  <ul className="space-y-1 text-xs text-sky-700">
                    <li>• Se crean automáticamente cada 7 días</li>
                    <li>• Se mantienen por 30 días</li>
                    <li>• Almacenados en Supabase</li>
                    <li>• Accesibles desde cualquier dispositivo</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        {/* Change Method Button */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleChangeMethod}
            className="w-full rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            ← Ver otras opciones
          </button>
        </div>
      </div>
    </div>
  );
}
