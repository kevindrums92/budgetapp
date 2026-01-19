import type { BudgetState } from "./budget.types";

export type BackupMeta = {
  backupVersion: string;
  appVersion: string;
  schemaVersion: number;
  backupId: string;
  createdAt: string; // ISO string
  createdBy: "manual" | "auto-local" | "auto-cloud";
  userId?: string;
  deviceInfo: {
    platform: string;
    userAgent: string;
    timezone: string;
  };
};

export type BackupStats = {
  totalTransactions: number;
  totalTrips: number;
  totalCategories: number;
  totalCategoryGroups: number;
  dateRange: { from: string; to: string } | null;
  sizeBytes: number;
};

export type BackupFile = {
  meta: BackupMeta;
  stats: BackupStats;
  data: BudgetState;
  checksum: string;
};

export type LocalBackupEntry = {
  key: string;
  backup: BackupFile;
  sizeBytes: number;
};
