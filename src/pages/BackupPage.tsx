import { useState } from "react";
import { ChevronDown } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BackupExportButton from "@/components/BackupExportButton";
import BackupImportButton from "@/components/BackupImportButton";
import LocalBackupList from "@/components/LocalBackupList";

export default function BackupPage() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PageHeader title="Backup & Restore" />

      {/* Content */}
      <div className="flex-1 px-4 pt-6 pb-8">
        {/* Description */}
        <p className="text-sm text-gray-500 mb-6">
          Protege tus datos exportando o restaurando copias de seguridad
        </p>

        {/* Actions Section */}
        <div className="space-y-4 mb-8">
          {/* Export Action */}
          <div className="space-y-2.5">
            <div>
              <h2 className="text-sm font-medium text-gray-900">Exportar</h2>
              <p className="text-xs text-gray-500 mt-1">
                Descarga tus datos en formato JSON
              </p>
            </div>
            <BackupExportButton />
          </div>

          {/* Restore Action */}
          <div className="space-y-2.5">
            <div>
              <h2 className="text-sm font-medium text-gray-900">Restaurar</h2>
              <p className="text-xs text-gray-500 mt-1">
                Esto reemplazará tus datos actuales
              </p>
            </div>
            <BackupImportButton />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-6"></div>

        {/* Local Auto-Backups */}
        <div className="mb-8">
          <LocalBackupList />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-6"></div>

        {/* Learn More - Collapsible */}
        <div>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full py-3 text-left"
          >
            <span className="text-sm font-medium text-gray-700">
              ¿Qué incluye el backup?
            </span>
            <ChevronDown
              size={18}
              className={`text-gray-400 transition-transform ${
                showDetails ? "rotate-180" : ""
              }`}
            />
          </button>

          {showDetails && (
            <div className="pb-4 space-y-4 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900 mb-2">Incluye:</p>
                <ul className="space-y-1.5 pl-4">
                  <li className="list-disc">Todas tus transacciones</li>
                  <li className="list-disc">Viajes y gastos de viaje</li>
                  <li className="list-disc">Categorías personalizadas</li>
                  <li className="list-disc">Grupos de categorías</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-gray-900 mb-2">Seguridad:</p>
                <ul className="space-y-1.5 pl-4">
                  <li className="list-disc">Verificación SHA-256</li>
                  <li className="list-disc">Backup automático antes de restaurar</li>
                </ul>
              </div>

              <p className="text-xs text-gray-500">
                Guarda tus backups en un lugar seguro como Google Drive o Dropbox.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
