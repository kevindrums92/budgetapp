import { useEffect } from "react";
import { useBudgetStore } from "@/state/budget.store";
import { saveLocalBackup } from "@/features/backup/services/backup.service";

const BACKUP_INTERVAL_HOURS = 24;
const LAST_BACKUP_KEY = "budget.lastAutoBackup";
const BACKUP_METHOD_KEY = "budget.backupMethod";

/**
 * BackupScheduler - Automatic periodic local backups
 *
 * Runs every 24 hours and creates a local backup automatically.
 * Backups are stored in localStorage with automatic pruning.
 * Only runs when "local" backup method is active.
 */
export default function BackupScheduler() {
  const user = useBudgetStore((s) => s.user);
  const cloudMode = useBudgetStore((s) => s.cloudMode);

  useEffect(() => {
    // Only run for logged-in users (not guest mode)
    if (cloudMode !== "cloud" || !user.email) {
      console.log("[BackupScheduler] Skipping - user not logged in");
      return;
    }

    // Only run if "local" backup method is active
    const activeMethod = localStorage.getItem(BACKUP_METHOD_KEY);
    if (activeMethod !== "local") {
      console.log("[BackupScheduler] Skipping - local backup method not active");
      return;
    }

    const userId = user.email; // Use email as user identifier

    const checkAndBackup = async () => {
      try {
        // Namespace last backup time by userId
        const lastBackupKey = `${LAST_BACKUP_KEY}.${userId}`;
        const lastBackupTime = localStorage.getItem(lastBackupKey);
        const lastBackupTimestamp = lastBackupTime ? parseInt(lastBackupTime, 10) : 0;
        const now = Date.now();
        const intervalMs = BACKUP_INTERVAL_HOURS * 60 * 60 * 1000;

        // Check if it's time for a backup
        if (now - lastBackupTimestamp >= intervalMs) {
          console.log(`[BackupScheduler] Creating periodic local backup for user ${userId}...`);

          const state = useBudgetStore.getState().getSnapshot();
          await saveLocalBackup(state, userId);

          localStorage.setItem(lastBackupKey, String(now));
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
  }, [cloudMode, user.email]);

  // This component doesn't render anything
  return null;
}
