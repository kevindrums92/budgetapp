import { useEffect } from "react";
import { useBudgetStore } from "@/state/budget.store";
import {
  createCloudBackup,
  shouldCreateCloudBackup,
  markCloudBackupCreated,
} from "@/features/backup/services/cloudBackup.service";
import { logger } from "@/shared/utils/logger";

const BACKUP_METHOD_KEY = "budget.backupMethod";

/**
 * CloudBackupScheduler - Automatically creates cloud backups every 7 days
 *
 * This component runs in the background and checks daily if a new cloud backup
 * should be created. Backups are created weekly (every 7 days) for authenticated users.
 * Only runs when "cloud" backup method is active.
 *
 * Features:
 * - Weekly automatic backups (every 7 days)
 * - Only runs for authenticated cloud users
 * - Only runs when cloud backup method is active
 * - Uses localStorage to track last backup time
 * - Checks daily but only creates backup when interval has passed
 */
export default function CloudBackupScheduler() {
  const cloudMode = useBudgetStore((s) => s.cloudMode);
  const userEmail = useBudgetStore((s) => s.user.email);

  useEffect(() => {
    // Only run for authenticated users (not anonymous)
    if (cloudMode !== "cloud" || !userEmail) {
      logger.info("CloudBackupScheduler", "Skipping - user not authenticated");
      return;
    }

    // Only run if "cloud" backup method is active
    const activeMethod = localStorage.getItem(BACKUP_METHOD_KEY);
    if (activeMethod !== "cloud") {
      logger.info("CloudBackupScheduler", "Skipping - cloud backup method not active");
      return;
    }

    const checkAndBackup = async () => {
      try {
        // Only create cloud backups if enough time has passed
        if (shouldCreateCloudBackup()) {
          logger.info("CloudBackupScheduler", "Creating weekly cloud backup...");

          const state = useBudgetStore.getState().getSnapshot();
          await createCloudBackup(state, "auto");

          markCloudBackupCreated();
          logger.info("CloudBackupScheduler", "Weekly cloud backup created successfully");
        } else {
          const lastBackupTime = localStorage.getItem("budget.lastCloudBackup");
          if (lastBackupTime) {
            const lastBackupTimestamp = parseInt(lastBackupTime, 10);
            const now = Date.now();
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            const nextBackupIn = sevenDays - (now - lastBackupTimestamp);
            const daysRemaining = Math.ceil(nextBackupIn / (24 * 60 * 60 * 1000));
            logger.info("CloudBackupScheduler", `Next cloud backup in ${daysRemaining} days`);
          }
        }
      } catch (error) {
        logger.error("CloudBackupScheduler", "Failed to create cloud backup:", error);
        // Don't throw - we don't want to break the app if cloud backup fails
      }
    };

    // Check on mount
    checkAndBackup();

    // Check daily
    const intervalId = setInterval(checkAndBackup, 24 * 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [cloudMode, userEmail]);

  return null; // This component doesn't render anything
}
