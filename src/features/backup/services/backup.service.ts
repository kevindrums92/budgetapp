import type { BudgetState } from "@/types/budget.types";
import type { BackupFile, BackupMeta, BackupStats, LocalBackupEntry } from "@/features/backup/types/backup.types";
import { logger } from "@/shared/utils/logger";

const APP_VERSION = __APP_VERSION__;
const BACKUP_VERSION = "1.0";
const LOCAL_BACKUP_PREFIX = "budget.autoBackup.";
const MAX_LOCAL_BACKUPS = 5;
const MAX_LOCAL_SIZE_MB = 5;

// ==================== CORE BACKUP FUNCTIONS ====================

/**
 * Generate a complete backup file with metadata and checksum
 */
export async function createBackup(
  state: BudgetState,
  userId?: string,
  createdBy: BackupMeta["createdBy"] = "manual"
): Promise<BackupFile> {
  const stats = calculateStats(state);

  const meta: BackupMeta = {
    backupVersion: BACKUP_VERSION,
    appVersion: APP_VERSION,
    schemaVersion: state.schemaVersion,
    backupId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    createdBy,
    userId,
    deviceInfo: {
      platform: "web",
      userAgent: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  const data = { ...state };
  const checksum = await calculateChecksum(data);

  return { meta, stats, data, checksum };
}

/**
 * Validate backup file structure and integrity
 */
export async function validateBackup(file: File): Promise<BackupFile> {
  // Read file content
  const text = await file.text();
  let backup: BackupFile;

  try {
    backup = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON format");
  }

  // Validate structure
  if (!backup.meta || !backup.data || !backup.checksum) {
    throw new Error("Invalid backup file structure: missing required fields");
  }

  // Validate backup version
  if (backup.meta.backupVersion !== BACKUP_VERSION) {
    throw new Error(
      `Unsupported backup version: ${backup.meta.backupVersion} (expected ${BACKUP_VERSION})`
    );
  }

  // Validate checksum
  const expectedChecksum = await calculateChecksum(backup.data);
  if (backup.checksum !== expectedChecksum) {
    throw new Error("Backup file corrupted: checksum mismatch");
  }

  // Validate schema version compatibility
  if (backup.data.schemaVersion > 4) {
    logger.warn(
      "Backup",
      `Warning: Backup uses newer schema v${backup.data.schemaVersion}, current app supports up to v4`
    );
  }

  return backup;
}

/**
 * Restore state from backup
 */
export function restoreBackup(
  backup: BackupFile,
  mode: "replace" | "merge" = "replace"
): BudgetState {
  if (mode === "replace") {
    return backup.data;
  }

  // Merge mode: combine with current state
  // Note: For merge to work, we need access to current state
  // This will be handled in the component calling this function
  throw new Error("Merge mode not yet implemented");
}

/**
 * Trigger browser download of backup file
 */
export function downloadBackup(backup: BackupFile): void {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const filename = generateBackupFilename(backup.meta.createdAt);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  // Cleanup
  URL.revokeObjectURL(url);
}

// ==================== LOCAL AUTO-BACKUP ====================

/**
 * Save backup to localStorage (auto-backup)
 * @param userId - User ID to namespace the backup (undefined for guest mode)
 */
export async function saveLocalBackup(state: BudgetState, userId?: string): Promise<void> {
  const backup = await createBackup(state, userId, "auto-local");
  // Namespace by userId to prevent cross-user data leaks
  const userPrefix = userId ? `${userId}.` : "guest.";
  const key = `${LOCAL_BACKUP_PREFIX}${userPrefix}${Date.now()}`;

  try {
    localStorage.setItem(key, JSON.stringify(backup));
    pruneLocalBackups(userId);
  } catch (error) {
    logger.error("Backup", "Failed to save local backup:", error);
    // If quota exceeded, try to prune first and retry
    pruneLocalBackups(userId);
    try {
      localStorage.setItem(key, JSON.stringify(backup));
    } catch {
      logger.error("Backup", "Failed to save local backup after pruning");
    }
  }
}

/**
 * Get all local auto-backups for a specific user, sorted by newest first
 * @param userId - User ID to filter backups (undefined for guest mode)
 */
export function getLocalBackups(userId?: string): LocalBackupEntry[] {
  // Namespace filter to prevent cross-user data leaks
  const userPrefix = userId ? `${userId}.` : "guest.";
  const fullPrefix = `${LOCAL_BACKUP_PREFIX}${userPrefix}`;

  const keys = Object.keys(localStorage).filter((k) =>
    k.startsWith(fullPrefix)
  );

  const backups: LocalBackupEntry[] = [];

  for (const key of keys) {
    try {
      const json = localStorage.getItem(key);
      if (!json) continue;

      const backup = JSON.parse(json) as BackupFile;
      backups.push({
        key,
        backup,
        sizeBytes: json.length,
      });
    } catch (error) {
      logger.error("Backup", `Failed to parse local backup ${key}:`, error);
      // Remove corrupted backup
      localStorage.removeItem(key);
    }
  }

  // Sort by creation date (newest first)
  return backups.sort(
    (a, b) =>
      new Date(b.backup.meta.createdAt).getTime() -
      new Date(a.backup.meta.createdAt).getTime()
  );
}

/**
 * Restore from a local backup
 */
export function restoreLocalBackup(key: string): BudgetState | null {
  try {
    const json = localStorage.getItem(key);
    if (!json) return null;

    const backup = JSON.parse(json) as BackupFile;
    return backup.data;
  } catch (error) {
    logger.error("Backup", `Failed to restore local backup ${key}:`, error);
    return null;
  }
}

/**
 * Delete a specific local backup
 */
export function deleteLocalBackup(key: string): void {
  localStorage.removeItem(key);
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate backup statistics
 */
function calculateStats(state: BudgetState): BackupStats {
  const dates = state.transactions.map((t) => t.date).sort();

  return {
    totalTransactions: state.transactions.length,
    totalTrips: state.trips?.length ?? 0,
    totalCategories: state.categoryDefinitions?.length ?? 0,
    totalCategoryGroups: state.categoryGroups?.length ?? 0,
    dateRange:
      dates.length > 0
        ? {
            from: dates[0],
            to: dates[dates.length - 1],
          }
        : null,
    sizeBytes: new Blob([JSON.stringify(state)]).size,
  };
}

/**
 * Calculate SHA-256 checksum of data
 */
async function calculateChecksum(data: BudgetState): Promise<string> {
  const json = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(json);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate backup filename with timestamp
 */
function generateBackupFilename(createdAt: string): string {
  const date = new Date(createdAt);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  return `smartspend-backup-${yyyy}-${mm}-${dd}-${hh}${min}${ss}.json`;
}

/**
 * Prune old local backups to stay within limits
 * @param userId - User ID to filter backups (undefined for guest mode)
 */
function pruneLocalBackups(userId?: string): void {
  const backups = getLocalBackups(userId);

  // Keep only last MAX_LOCAL_BACKUPS
  if (backups.length > MAX_LOCAL_BACKUPS) {
    const toDelete = backups.slice(MAX_LOCAL_BACKUPS);
    toDelete.forEach((b) => localStorage.removeItem(b.key));
  }

  // Check total size
  const remaining = backups.slice(0, MAX_LOCAL_BACKUPS);
  let totalSize = remaining.reduce((sum, b) => sum + b.sizeBytes, 0);
  const maxSizeBytes = MAX_LOCAL_SIZE_MB * 1024 * 1024;

  // Delete oldest until under size limit
  while (totalSize > maxSizeBytes && remaining.length > 1) {
    const oldest = remaining.pop()!;
    localStorage.removeItem(oldest.key);
    totalSize -= oldest.sizeBytes;
  }
}
