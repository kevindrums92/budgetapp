import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("backup");
  const cloudMode = useBudgetStore((s) => s.cloudMode);
  const user = useBudgetStore((s) => s.user);
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
        <PageHeader title={t("title")} />

        <div className="flex-1 px-4 pt-6 pb-8">
          <BackupMethodSelector
            onSelect={handleSelectMethod}
            cloudMode={cloudMode}
          />
        </div>
      </div>
    );
  }

  // Get method label and icon
  const getMethodInfo = () => {
    switch (selectedMethod) {
      case "manual":
        return { label: t("methods.manual"), icon: Download };
      case "local":
        return { label: t("methods.local"), icon: RefreshCw };
      case "cloud":
        return { label: t("methods.cloud"), icon: Cloud };
      default:
        return { label: "", icon: Download };
    }
  };

  const { label: methodLabel, icon: MethodIcon } = getMethodInfo();

  // Show selected method content
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PageHeader title={t("title")} />

      {/* Active Method Indicator */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {t("activeMethod")}
          </span>
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5">
            <MethodIcon size={14} className="text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">
              {methodLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-6 pb-8">
        {/* Manual Backup Tab */}
        {selectedMethod === "manual" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {t("manual.title")}
              </h2>
              <p className="text-sm text-gray-600">
                {t("manual.description")}
              </p>
            </div>

            {/* Export */}
            <div className="space-y-2.5">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{t("manual.export.title")}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {t("manual.export.description")}
                </p>
              </div>
              <BackupExportButton />
            </div>

            {/* Restore */}
            <div className="space-y-2.5">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{t("manual.restore.title")}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {t("manual.restore.warning")}
                </p>
              </div>
              <BackupImportButton />
            </div>

            {/* Info */}
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                💡 {t("manual.includes.title")}
              </p>
              <ul className="space-y-1 text-xs text-blue-700">
                <li>• {t("manual.includes.transactions")}</li>
                <li>• {t("manual.includes.trips")}</li>
                <li>• {t("manual.includes.categories")}</li>
                <li>• {t("manual.includes.checksum")}</li>
              </ul>
              <p className="mt-3 text-xs text-blue-600">
                💾 {t("manual.advice")}
              </p>
            </div>
          </div>
        )}

        {/* Local Auto-Backup Tab */}
        {selectedMethod === "local" && (
          <div className="space-y-6">
            {cloudMode === "guest" ? (
              <div className="rounded-xl bg-amber-50 p-6 text-center">
                <p className="text-amber-900 font-medium mb-2">
                  🔒 {t("local.authRequired")}
                </p>
                <p className="text-sm text-amber-700">
                  {t("local.authMessage")}
                </p>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    {t("methods.local")}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {t("local.description")}
                  </p>
                </div>

                <LocalBackupList userId={user.email || undefined} />

                {/* Info */}
                <div className="rounded-xl bg-purple-50 p-4">
                  <p className="text-sm text-purple-900 font-medium mb-2">
                    🔄 {t("local.howItWorks.title")}
                  </p>
                  <ul className="space-y-1 text-xs text-purple-700">
                    <li>• {t("local.howItWorks.frequency")}</li>
                    <li>• {t("local.howItWorks.retention")}</li>
                    <li>• {t("local.howItWorks.sizeLimit")}</li>
                    <li>• {t("local.howItWorks.timing")}</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        {/* Cloud Backup Tab */}
        {selectedMethod === "cloud" && (
          <div className="space-y-6">
            {cloudMode === "guest" ? (
              <div className="rounded-xl bg-amber-50 p-6 text-center">
                <p className="text-amber-900 font-medium mb-2">
                  🔒 {t("cloud.authRequired")}
                </p>
                <p className="text-sm text-amber-700">
                  {t("cloud.authMessage")}
                </p>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    {t("methods.cloud")}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {t("cloud.description")}
                  </p>
                </div>

                <CloudBackupList />

                {/* Info */}
                <div className="rounded-xl bg-sky-50 p-4">
                  <p className="text-sm text-sky-900 font-medium mb-2">
                    ☁️ {t("cloud.howItWorks.title")}
                  </p>
                  <ul className="space-y-1 text-xs text-sky-700">
                    <li>• {t("cloud.howItWorks.frequency")}</li>
                    <li>• {t("cloud.howItWorks.retention")}</li>
                    <li>• {t("cloud.howItWorks.storage")}</li>
                    <li>• {t("cloud.howItWorks.accessible")}</li>
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
            className="w-full rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            ← {t("changeMethod")}
          </button>
        </div>
      </div>
    </div>
  );
}
