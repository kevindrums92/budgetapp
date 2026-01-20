import { useEffect } from "react";
import { useBudgetStore } from "@/state/budget.store";
import { saveLocalBackup } from "@/features/backup/services/backup.service";

const BACKUP_INTERVAL_HOURS = 24;
const LAST_BACKUP_KEY = "budget.lastAutoBackup";

/**
 * BackupScheduler - Automatic periodic local backups
 *
 * Runs every 24 hours and creates a local backup automatically.
 * Backups are stored in localStorage with automatic pruning.
 */
export default function BackupScheduler() {
  useEffect(() => {
    const checkAndBackup = async () => {
      try {
        const lastBackupTime = localStorage.getItem(LAST_BACKUP_KEY);
        const lastBackupTimestamp = lastBackupTime ? parseInt(lastBackupTime, 10) : 0;
        const now = Date.now();
        const intervalMs = BACKUP_INTERVAL_HOURS * 60 * 60 * 1000;

        // Check if it's time for a backup
        if (now - lastBackupTimestamp >= intervalMs) {
          console.log("[BackupScheduler] Creating periodic local backup...");

          const state = useBudgetStore.getState().getSnapshot();
          await saveLocalBackup(state);

          localStorage.setItem(LAST_BACKUP_KEY, String(now));
          console.log("[BackupScheduler] Periodic backup created successfully");
        } else {
          const nextBackupIn = intervalMs - (now - lastBackupTimestamp);
          const hoursRemaining = Math.ceil(nextBackupIn / (60 * 60 * 1000));
          console.log(`[BackupScheduler] Next backup in ${hoursRemaining} hours`);
        }
      } catch (error) {
        console.error("[BackupScheduler] Failed to create periodic backup:", error);
      }
    };

    // Check on mount
    checkAndBackup();

    // Check daily (24 hours)
    const intervalId = setInterval(checkAndBackup, 24 * 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // This component doesn't render anything
  return null;
}
