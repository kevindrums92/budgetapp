import { useEffect } from "react";
import { useBudgetStore } from "@/state/budget.store";
import {
  createCloudBackup,
  shouldCreateCloudBackup,
  markCloudBackupCreated,
} from "@/features/backup/services/cloudBackup.service";

/**
 * CloudBackupScheduler - Automatically creates cloud backups every 7 days
 *
 * This component runs in the background and checks daily if a new cloud backup
 * should be created. Backups are created weekly (every 7 days) for authenticated users.
 *
 * Features:
 * - Weekly automatic backups (every 7 days)
 * - Only runs for authenticated cloud users
 * - Uses localStorage to track last backup time
 * - Checks daily but only creates backup when interval has passed
 */
export default function CloudBackupScheduler() {
  useEffect(() => {
    const checkAndBackup = async () => {
      try {
        // Only create cloud backups if enough time has passed
        if (shouldCreateCloudBackup()) {
          console.log("[CloudBackupScheduler] Creating weekly cloud backup...");

          const state = useBudgetStore.getState().getSnapshot();
          await createCloudBackup(state, "auto");

          markCloudBackupCreated();
          console.log("[CloudBackupScheduler] Weekly cloud backup created successfully");
        } else {
          const lastBackupTime = localStorage.getItem("budget.lastCloudBackup");
          if (lastBackupTime) {
            const lastBackupTimestamp = parseInt(lastBackupTime, 10);
            const now = Date.now();
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            const nextBackupIn = sevenDays - (now - lastBackupTimestamp);
            const daysRemaining = Math.ceil(nextBackupIn / (24 * 60 * 60 * 1000));
            console.log(`[CloudBackupScheduler] Next cloud backup in ${daysRemaining} days`);
          }
        }
      } catch (error) {
        console.error("[CloudBackupScheduler] Failed to create cloud backup:", error);
        // Don't throw - we don't want to break the app if cloud backup fails
      }
    };

    // Check on mount
    checkAndBackup();

    // Check daily
    const intervalId = setInterval(checkAndBackup, 24 * 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  return null; // This component doesn't render anything
}
