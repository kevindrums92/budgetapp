import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { validateBackup } from "@/features/backup/services/backup.service";
import BackupPreviewModal from "./BackupPreviewModal";
import type { BackupFile } from "@/features/backup/types/backup.types";
import { logger } from "@/shared/utils/logger";

export default function BackupImportButton() {
  const [isValidating, setIsValidating] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState<BackupFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsValidating(true);

    try {
      // Validate backup file
      const backup = await validateBackup(file);

      logger.info("Backup", "File validated successfully:", {
        transactions: backup.stats.totalTransactions,
        trips: backup.stats.totalTrips,
        createdAt: backup.meta.createdAt,
      });

      // Show preview modal
      setBackupToRestore(backup);
    } catch (error) {
      logger.error("Backup", "Validation failed:", error);
      alert(`Invalid backup file: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsValidating(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleClick() {
    fileInputRef.current?.click();
  }

  function handleCloseModal() {
    setBackupToRestore(null);
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={isValidating}
        className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-900 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
      >
        <Upload size={18} strokeWidth={2} />
        <span>{isValidating ? "Validando..." : "Restaurar"}</span>
      </button>

      {backupToRestore && (
        <BackupPreviewModal backup={backupToRestore} onClose={handleCloseModal} />
      )}
    </>
  );
}
