import { Download, RefreshCw, Cloud } from "lucide-react";

export type BackupMethod = "manual" | "local" | "cloud";

type Props = {
  onSelect: (method: BackupMethod) => void;
  cloudMode: "guest" | "cloud";
};

/**
 * BackupMethodSelector - Introduction screen for choosing backup method
 *
 * Displays 3 options:
 * - Manual: Export/import on demand
 * - Local: Automatic backups every 24 hours (localStorage)
 * - Cloud: Weekly backups in Supabase (requires auth)
 */
export default function BackupMethodSelector({ onSelect, cloudMode }: Props) {
  const isCloudDisabled = cloudMode === "guest";

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
          Protege tus Datos
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Elige cómo quieres proteger tu información
        </p>
      </div>

      {/* Method Cards */}
      <div className="space-y-3">
        {/* Manual Backup */}
        <button
          type="button"
          onClick={() => onSelect("manual")}
          className="w-full rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm border-2 border-transparent hover:border-emerald-500 dark:hover:border-emerald-400 transition-all text-left active:scale-[0.98]"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
              <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-1">
                📱 Manual
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Exporta e importa cuando quieras
              </p>
              <ul className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                <li>• Control total sobre tus backups</li>
                <li>• Archivos JSON en tu dispositivo</li>
                <li>• Compatible con cualquier app</li>
              </ul>
            </div>
          </div>
        </button>

        {/* Local Auto-Backup */}
        <button
          type="button"
          onClick={() => onSelect("local")}
          className="w-full rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm border-2 border-transparent hover:border-emerald-500 dark:hover:border-emerald-400 transition-all text-left active:scale-[0.98]"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/30">
              <RefreshCw className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-1">
                🔄 Automático Local
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Backups automáticos cada 24 horas
              </p>
              <ul className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                <li>• Sin internet necesario</li>
                <li>• Últimos 5 backups (máx. 5MB)</li>
                <li>• Restauración con un clic</li>
              </ul>
            </div>
          </div>
        </button>

        {/* Cloud Backup */}
        <button
          type="button"
          onClick={() => !isCloudDisabled && onSelect("cloud")}
          disabled={isCloudDisabled}
          className={`w-full rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm border-2 border-transparent text-left transition-all ${
            isCloudDisabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-emerald-500 dark:hover:border-emerald-400 active:scale-[0.98]"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-900/30">
              <Cloud className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-1">
                ☁️ En la Nube
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Backups semanales en Supabase
              </p>
              <ul className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                <li>• {isCloudDisabled ? "Requiere iniciar sesión" : "Sincronizado en la nube"}</li>
                <li>• Historial de 30 días</li>
                <li>• Acceso desde cualquier dispositivo</li>
              </ul>
            </div>
          </div>
          {isCloudDisabled && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 rounded-lg px-3 py-2">
              💡 Inicia sesión para usar backups en la nube
            </p>
          )}
        </button>
      </div>

      {/* Footer Note */}
      <p className="text-xs text-center text-gray-400 dark:text-gray-500">
        Puedes cambiar de método en cualquier momento
      </p>
    </div>
  );
}
