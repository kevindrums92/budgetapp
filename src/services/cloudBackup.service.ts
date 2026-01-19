import { supabase } from "@/lib/supabaseClient";
import { createBackup } from "@/services/backup.service";
import type { BudgetState } from "@/types/budget.types";
import type { BackupFile } from "@/types/backup.types";

/**
 * Cloud backup type stored in Supabase
 */
export type CloudBackup = {
  id: string;
  user_id: string;
  backup_data: BackupFile;
  backup_type: "manual" | "auto" | "pre-migration";
  created_at: string;
  size_bytes: number;
  checksum: string;
  total_transactions: number;
  total_trips: number;
  schema_version: number;
  app_version: string;
};

/**
 * Get the current authenticated user ID
 */
async function getUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Create a cloud backup in Supabase
 * @param state - Current budget state to backup
 * @param type - Type of backup (manual, auto, or pre-migration)
 * @throws Error if not authenticated or backup fails
 */
export async function createCloudBackup(
  state: BudgetState,
  type: "manual" | "auto" | "pre-migration"
): Promise<void> {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("No se pudo crear backup en la nube: no autenticado");
  }

  // Create backup file with metadata
  const backup = await createBackup(state, userId, "auto-cloud");

  // Insert into Supabase
  const { error } = await supabase.from("user_backups").insert({
    user_id: userId,
    backup_data: backup,
    backup_type: type,
    size_bytes: backup.stats.sizeBytes,
    checksum: backup.checksum,
    total_transactions: backup.stats.totalTransactions,
    total_trips: backup.stats.totalTrips,
    schema_version: backup.data.schemaVersion,
    app_version: backup.meta.appVersion,
  });

  if (error) {
    console.error("[CloudBackup] Failed to create cloud backup:", error);
    throw new Error(`Error al crear backup en la nube: ${error.message}`);
  }

  console.log(`[CloudBackup] Cloud backup created successfully (${type})`);
}

/**
 * Get all cloud backups for the current user
 * @returns Array of cloud backups, sorted by creation date (newest first)
 */
export async function getCloudBackups(): Promise<CloudBackup[]> {
  const userId = await getUserId();
  if (!userId) {
    console.warn("[CloudBackup] Cannot fetch backups: not authenticated");
    return [];
  }

  const { data, error } = await supabase
    .from("user_backups")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30); // Keep last 30 backups

  if (error) {
    console.error("[CloudBackup] Failed to fetch cloud backups:", error);
    throw new Error(`Error al cargar backups de la nube: ${error.message}`);
  }

  return (data as CloudBackup[]) ?? [];
}

/**
 * Restore from a cloud backup
 * @param backupId - ID of the cloud backup to restore
 * @returns The backup data
 * @throws Error if backup not found or restore fails
 */
export async function restoreCloudBackup(
  backupId: string
): Promise<BackupFile> {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("No se pudo restaurar: no autenticado");
  }

  const { data, error } = await supabase
    .from("user_backups")
    .select("backup_data")
    .eq("id", backupId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("[CloudBackup] Failed to restore cloud backup:", error);
    throw new Error(`Error al restaurar backup: ${error.message}`);
  }

  if (!data || !data.backup_data) {
    throw new Error("Backup no encontrado");
  }

  return data.backup_data as BackupFile;
}

/**
 * Delete a cloud backup
 * @param backupId - ID of the cloud backup to delete
 * @throws Error if delete fails
 */
export async function deleteCloudBackup(backupId: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("No se pudo eliminar: no autenticado");
  }

  const { error } = await supabase
    .from("user_backups")
    .delete()
    .eq("id", backupId)
    .eq("user_id", userId);

  if (error) {
    console.error("[CloudBackup] Failed to delete cloud backup:", error);
    throw new Error(`Error al eliminar backup: ${error.message}`);
  }

  console.log(`[CloudBackup] Cloud backup deleted: ${backupId}`);
}

/**
 * Check if enough time has passed since last cloud backup
 * @returns true if a new backup should be created
 */
export function shouldCreateCloudBackup(): boolean {
  const lastBackupTime = localStorage.getItem("budget.lastCloudBackup");
  if (!lastBackupTime) return true;

  const lastBackupTimestamp = parseInt(lastBackupTime, 10);
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  return now - lastBackupTimestamp >= sevenDays;
}

/**
 * Mark that a cloud backup was just created
 */
export function markCloudBackupCreated(): void {
  localStorage.setItem("budget.lastCloudBackup", String(Date.now()));
}
