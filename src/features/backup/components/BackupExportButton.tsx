import { useState } from "react";
import { Download } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { createBackup, downloadBackup } from "@/features/backup/services/backup.service";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/shared/utils/logger";

export default function BackupExportButton() {
  const getSnapshot = useBudgetStore((s) => s.getSnapshot);
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);

    try {
      // Get current user ID if authenticated
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;

      // Create backup
      const state = getSnapshot();
      const backup = await createBackup(state, userId, "manual");

      // Trigger download
      await downloadBackup(backup);

      logger.info("Backup", "Export successful:", {
        transactions: backup.stats.totalTransactions,
        trips: backup.stats.totalTrips,
        filename: `smartspend-backup-${backup.meta.createdAt.split("T")[0]}.json`,
      });
    } catch (error) {
      logger.error("Backup", "Export failed:", error);
      alert("Failed to export backup. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
    >
      <Download size={18} strokeWidth={2} />
      <span>{isExporting ? "Exportando..." : "Exportar"}</span>
    </button>
  );
}
