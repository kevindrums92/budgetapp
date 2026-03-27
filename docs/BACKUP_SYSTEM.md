# Backup & Restore System - Design Document

## Overview

Sistema completo de backup y restauración para SmartSpend que previene pérdida de datos mediante múltiples capas de protección: backups manuales, automáticos locales, y automáticos en la nube.

## Objectives

1. **User Control**: Permitir al usuario exportar/importar sus datos cuando quiera
2. **Auto-Protection**: Backups automáticos antes de operaciones críticas
3. **Cloud Safety**: Respaldo en Supabase con versionado
4. **Data Recovery**: Recuperación fácil ante pérdidas accidentales
5. **Portability**: Formato JSON estándar para máxima compatibilidad

---

## Architecture

### Three-Layer Backup System

```
┌─────────────────────────────────────────────────────────────┐
│                    BACKUP LAYERS                            │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Manual Export/Import (User-Triggered)            │
│  ├─ Download JSON file to device                           │
│  ├─ Upload JSON file from device                           │
│  └─ Full user control                                       │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Local Auto-Backup (localStorage)                 │
│  ├─ Before critical operations (restore, reset)            │
│  ├─ Periodic (every 7 days)                                │
│  ├─ Keep last 5 backups                                    │
│  └─ Max 5MB total size                                      │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Cloud Auto-Backup (Supabase)                     │
│  ├─ Weekly automatic snapshots                             │
│  ├─ Before schema migrations                               │
│  ├─ Keep last 30 days (configurable)                       │
│  └─ Versioned with timestamps                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Structure

### Backup File Format (JSON)

```json
{
  "meta": {
    "backupVersion": "1.0",
    "appVersion": "0.6.2",
    "schemaVersion": 4,
    "backupId": "uuid-v4",
    "createdAt": "2026-01-17T18:30:00.000Z",
    "createdBy": "manual" | "auto-local" | "auto-cloud",
    "userId": "a834b800-974d-4d29-8924-62e2b4cdc424",
    "deviceInfo": {
      "platform": "web",
      "userAgent": "Mozilla/5.0...",
      "timezone": "America/Bogota"
    }
  },
  "stats": {
    "totalTransactions": 245,
    "totalTrips": 3,
    "totalCategories": 24,
    "totalCategoryGroups": 6,
    "dateRange": {
      "from": "2025-01-01",
      "to": "2026-01-17"
    },
    "sizeBytes": 45678
  },
  "data": {
    "schemaVersion": 4,
    "transactions": [...],
    "trips": [...],
    "tripExpenses": [...],
    "categoryDefinitions": [...],
    "categoryGroups": [...],
    "categories": [...]  // legacy, kept for backward compat
  },
  "checksum": "sha256-hash-of-data"  // data integrity verification
}
```

### File Naming Convention

**Manual Backups:**
```
smartspend-backup-YYYY-MM-DD-HHmmss.json
Example: smartspend-backup-2026-01-17-183045.json
```

**Auto Backups (localStorage key):**
```
budget.autoBackup.{timestamp}
Example: budget.autoBackup.1737145800000
```

**Cloud Backups (Supabase):**
- Stored in `user_backups` table with `created_at` timestamp

---

## Database Schema (Supabase)

### New Table: `user_backups`

```sql
CREATE TABLE user_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_data JSONB NOT NULL,  -- Full backup file (meta + stats + data)
  backup_type TEXT NOT NULL CHECK (backup_type IN ('manual', 'auto', 'pre-migration')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  size_bytes INTEGER NOT NULL,
  checksum TEXT NOT NULL,

  -- Metadata for quick queries
  total_transactions INTEGER NOT NULL,
  total_trips INTEGER NOT NULL,
  schema_version INTEGER NOT NULL,
  app_version TEXT NOT NULL,

  -- Indexes
  CONSTRAINT user_backups_user_id_created_at_key UNIQUE (user_id, created_at)
);

-- Index for quick retrieval
CREATE INDEX idx_user_backups_user_created ON user_backups(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE user_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own backups"
  ON user_backups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own backups"
  ON user_backups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own backups"
  ON user_backups FOR DELETE
  USING (auth.uid() = user_id);
```

### Automatic Cleanup (Supabase Function)

```sql
-- Function to auto-delete old backups (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS void AS $$
BEGIN
  DELETE FROM user_backups
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Scheduled via pg_cron or Supabase Edge Function
-- Run daily at 3 AM UTC
```

---

## Features Implementation

### 1. Manual Export (Download)

**Location**: Settings Page → Backup & Restore Section

**UI Component**: `BackupExportButton.tsx`

**Flow:**
1. User clicks "Export Backup" button
2. App generates backup JSON with `createBackup()`
3. Trigger browser download with generated filename
4. Show success toast: "✅ Backup exported: smartspend-backup-2026-01-17.json"

**Code:**
```typescript
function handleExport() {
  const state = getSnapshot();
  const backup = createBackup(state, userId);
  downloadBackup(backup); // triggers download
  toast.success("Backup exported successfully");
}
```

---

### 2. Manual Import (Upload & Restore)

**Location**: Settings Page → Backup & Restore Section

**UI Component**: `BackupImportButton.tsx` + `BackupPreviewModal.tsx`

**Flow:**
1. User clicks "Import Backup"
2. File picker opens (accept=".json")
3. User selects backup JSON file
4. App validates file:
   - ✅ Valid JSON structure
   - ✅ Compatible `backupVersion`
   - ✅ Compatible `schemaVersion`
   - ✅ Checksum verification
5. Show preview modal with backup stats
6. **CRITICAL**: Show warning + confirmation
7. User selects restore mode:
   - **Replace All**: Sobrescribe todo
   - **Merge**: Combina (evita duplicados por ID)
8. Create auto-backup of current state (safety net)
9. Execute restore
10. Push to cloud (if cloud mode)
11. Reload app or navigate to home
12. Show success toast with "Undo" option (10 seconds)

**Preview Modal:**
```
╔═══════════════════════════════════════════════╗
║           📦 Restore Backup?                  ║
╠═══════════════════════════════════════════════╣
║  Created: 2026-01-10 15:30                    ║
║  App Version: 0.6.1                           ║
║  Schema Version: 4                            ║
║                                               ║
║  📊 Backup Contents:                          ║
║  • Transactions: 245                          ║
║  • Trips: 3                                   ║
║  • Categories: 24                             ║
║  • Date range: Jan 2025 - Jan 2026            ║
║                                               ║
║  ⚠️  WARNING                                  ║
║  This will replace your current data:         ║
║  • Current transactions: 198                  ║
║  • Current trips: 2                           ║
║                                               ║
║  An automatic backup of your current data     ║
║  will be created before restoring.            ║
║                                               ║
║  [Cancel]  [Replace All]  [Merge]            ║
╚═══════════════════════════════════════════════╝
```

**Undo Feature:**
After restore, show toast for 10 seconds:
```
✅ Backup restored successfully
[Undo] ← clickable, reverts to pre-restore state
```

---

### 3. Local Auto-Backup (localStorage)

**Trigger Points:**
1. **Before Restore**: Always create backup before importing
2. **Before Reset**: If user resets app data
3. **Periodic**: Every 7 days (configurable)
4. **Before Logout**: Optional, creates safety backup

**Storage Strategy:**
- Key pattern: `budget.autoBackup.{timestamp}`
- Keep last 5 backups (FIFO queue)
- Max total size: 5MB
- If size exceeded, delete oldest until under limit

**Auto-Cleanup:**
```typescript
function pruneLocalBackups() {
  const backups = getLocalBackups();

  // Keep last 5
  if (backups.length > 5) {
    backups.slice(5).forEach(b => localStorage.removeItem(b.key));
  }

  // Check total size
  const totalSize = backups.reduce((sum, b) => sum + b.sizeBytes, 0);
  if (totalSize > 5 * 1024 * 1024) { // 5MB
    // Delete oldest until under limit
    while (totalSize > 5MB && backups.length > 1) {
      const oldest = backups.pop();
      localStorage.removeItem(oldest.key);
    }
  }
}
```

**UI for Local Backups:**

In Settings → Backup & Restore:
```
📜 Recent Auto-Backups (Local)
┌─────────────────────────────────────────┐
│ • Jan 17, 2026 18:30 (245 tx, 3 trips) │  [Restore]
│ • Jan 10, 2026 12:00 (198 tx, 2 trips) │  [Restore]
│ • Jan 03, 2026 09:15 (156 tx, 1 trip)  │  [Restore]
└─────────────────────────────────────────┘
```

---

### 4. Cloud Auto-Backup (Supabase)

**Trigger Points:**
1. **Weekly**: Every Sunday at 3 AM (user's timezone)
2. **Before Schema Migration**: Automatic backup before upgrading schema
3. **Manual Trigger**: Button in Settings "Create Cloud Backup"

**Implementation:**

**Service: `cloudBackup.service.ts`**
```typescript
export async function createCloudBackup(
  state: BudgetState,
  type: 'manual' | 'auto' | 'pre-migration'
): Promise<void> {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const backup = createBackup(state, userId);
  backup.meta.createdBy = `auto-cloud`;

  const { error } = await supabase.from('user_backups').insert({
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

  if (error) throw error;
}

export async function getCloudBackups(): Promise<CloudBackup[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('user_backups')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) throw error;
  return data ?? [];
}

export async function restoreCloudBackup(backupId: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from('user_backups')
    .select('backup_data')
    .eq('id', backupId)
    .eq('user_id', userId)
    .single();

  if (error) throw error;

  const backup = data.backup_data as BackupFile;
  const restoredState = restoreBackup(backup, 'replace');
  replaceAllData(restoredState);
  saveState();
}
```

**Scheduled Cloud Backups:**

Use Supabase Edge Function or client-side scheduler:

```typescript
// In BackupScheduler component (rendered by CloudSyncGate)
useEffect(() => {
  if (cloudMode !== 'cloud') return;

  const checkAndBackup = async () => {
    const lastBackup = localStorage.getItem('budget.lastCloudBackup');
    const lastBackupTime = lastBackup ? parseInt(lastBackup) : 0;
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    if (now - lastBackupTime > sevenDays) {
      console.log("[CloudBackup] Creating weekly backup...");
      await createCloudBackup(getSnapshot(), 'auto');
      localStorage.setItem('budget.lastCloudBackup', String(now));
    }
  };

  checkAndBackup();

  // Check daily
  const interval = setInterval(checkAndBackup, 24 * 60 * 60 * 1000);
  return () => clearInterval(interval);
}, [cloudMode]);
```

**UI for Cloud Backups:**

In Settings → Backup & Restore:
```
☁️ Cloud Backups (Last 30 Days)
┌───────────────────────────────────────────────────┐
│ • Jan 17, 2026 18:30 - Manual (245 tx, 3 trips)  │  [Restore] [Delete]
│ • Jan 14, 2026 03:00 - Auto (240 tx, 3 trips)    │  [Restore] [Delete]
│ • Jan 07, 2026 03:00 - Auto (198 tx, 2 trips)    │  [Restore] [Delete]
│ • Dec 31, 2025 03:00 - Auto (156 tx, 1 trip)     │  [Restore] [Delete]
└───────────────────────────────────────────────────┘

[Create Manual Backup]
```

---

## File Structure

```
src/
├─ services/
│  ├─ backup.service.ts           # Core backup/restore logic
│  ├─ cloudBackup.service.ts      # Supabase cloud backup
│  └─ backupValidation.service.ts # Validation & checksum
├─ components/
│  ├─ BackupExportButton.tsx      # Manual export button
│  ├─ BackupImportButton.tsx      # Manual import button
│  ├─ BackupPreviewModal.tsx      # Preview before restore
│  ├─ LocalBackupList.tsx         # List of local auto-backups
│  ├─ CloudBackupList.tsx         # List of cloud backups
│  └─ BackupScheduler.tsx         # Auto-backup scheduler
├─ pages/
│  └─ SettingsPage.tsx            # Settings page with backup section
└─ types/
   └─ backup.types.ts             # BackupFile, BackupMeta, etc.
```

---

## Core Functions (backup.service.ts)

```typescript
export type BackupFile = {
  meta: BackupMeta;
  stats: BackupStats;
  data: BudgetState;
  checksum: string;
};

export type BackupMeta = {
  backupVersion: string;
  appVersion: string;
  schemaVersion: number;
  backupId: string;
  createdAt: string;
  createdBy: 'manual' | 'auto-local' | 'auto-cloud';
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
  dateRange: { from: string; to: string };
  sizeBytes: number;
};

// Generate backup file with metadata
export function createBackup(state: BudgetState, userId?: string): BackupFile {
  const data = { ...state };
  const stats = calculateStats(state);

  const meta: BackupMeta = {
    backupVersion: '1.0',
    appVersion: import.meta.env.VITE_APP_VERSION || '0.6.2',
    schemaVersion: state.schemaVersion,
    backupId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    createdBy: 'manual',
    userId,
    deviceInfo: {
      platform: 'web',
      userAgent: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  const backup: BackupFile = { meta, stats, data, checksum: '' };
  backup.checksum = calculateChecksum(backup.data);

  return backup;
}

// Validate backup file structure and integrity
export async function validateBackup(file: File): Promise<BackupFile> {
  const text = await file.text();
  const backup = JSON.parse(text) as BackupFile;

  // Validate structure
  if (!backup.meta || !backup.data || !backup.checksum) {
    throw new Error("Invalid backup file structure");
  }

  // Validate version compatibility
  if (backup.meta.backupVersion !== '1.0') {
    throw new Error(`Unsupported backup version: ${backup.meta.backupVersion}`);
  }

  // Validate checksum
  const expectedChecksum = calculateChecksum(backup.data);
  if (backup.checksum !== expectedChecksum) {
    throw new Error("Backup file corrupted (checksum mismatch)");
  }

  return backup;
}

// Restore from backup
export function restoreBackup(
  backup: BackupFile,
  mode: 'replace' | 'merge'
): BudgetState {
  if (mode === 'replace') {
    return backup.data;
  }

  // Merge mode: combine with current state, avoid duplicates
  const current = getSnapshot();

  return {
    ...backup.data,
    transactions: mergeByIdAndCreatedAt(
      current.transactions,
      backup.data.transactions
    ),
    trips: mergeByIdAndCreatedAt(current.trips, backup.data.trips),
    tripExpenses: mergeByIdAndCreatedAt(
      current.tripExpenses,
      backup.data.tripExpenses
    ),
    categoryDefinitions: mergeByIdAndCreatedAt(
      current.categoryDefinitions,
      backup.data.categoryDefinitions
    ),
    categoryGroups: mergeByIdAndCreatedAt(
      current.categoryGroups,
      backup.data.categoryGroups
    ),
  };
}

// Trigger browser download
export function downloadBackup(backup: BackupFile): void {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = generateBackupFilename(backup.meta.createdAt);
  a.click();

  URL.revokeObjectURL(url);
}

// Generate filename
function generateBackupFilename(createdAt: string): string {
  const date = new Date(createdAt);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');

  return `smartspend-backup-${yyyy}-${mm}-${dd}-${hh}${min}${ss}.json`;
}

// Calculate SHA-256 checksum
async function calculateChecksum(data: BudgetState): Promise<string> {
  const json = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(json);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Calculate backup stats
function calculateStats(state: BudgetState): BackupStats {
  const dates = state.transactions.map(t => t.date).sort();

  return {
    totalTransactions: state.transactions.length,
    totalTrips: state.trips.length,
    totalCategories: state.categoryDefinitions.length,
    totalCategoryGroups: state.categoryGroups.length,
    dateRange: {
      from: dates[0] || '',
      to: dates[dates.length - 1] || '',
    },
    sizeBytes: JSON.stringify(state).length,
  };
}

// Merge arrays by ID, prefer newer createdAt
function mergeByIdAndCreatedAt<T extends { id: string; createdAt: number }>(
  current: T[],
  incoming: T[]
): T[] {
  const map = new Map<string, T>();

  // Add current items
  current.forEach(item => map.set(item.id, item));

  // Add/update with incoming items (prefer newer)
  incoming.forEach(item => {
    const existing = map.get(item.id);
    if (!existing || item.createdAt > existing.createdAt) {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values());
}

// === LOCAL AUTO-BACKUP ===

const LOCAL_BACKUP_PREFIX = 'budget.autoBackup.';
const MAX_LOCAL_BACKUPS = 5;
const MAX_LOCAL_SIZE_MB = 5;

export function saveLocalBackup(state: BudgetState): void {
  const backup = createBackup(state);
  backup.meta.createdBy = 'auto-local';

  const key = `${LOCAL_BACKUP_PREFIX}${Date.now()}`;
  localStorage.setItem(key, JSON.stringify(backup));

  pruneLocalBackups();
}

export function getLocalBackups(): Array<{
  key: string;
  backup: BackupFile;
  sizeBytes: number;
}> {
  const keys = Object.keys(localStorage).filter(k =>
    k.startsWith(LOCAL_BACKUP_PREFIX)
  );

  return keys
    .map(key => {
      const json = localStorage.getItem(key);
      if (!json) return null;
      const backup = JSON.parse(json) as BackupFile;
      return { key, backup, sizeBytes: json.length };
    })
    .filter(Boolean)
    .sort((a, b) =>
      new Date(b.backup.meta.createdAt).getTime() -
      new Date(a.backup.meta.createdAt).getTime()
    );
}

function pruneLocalBackups(): void {
  const backups = getLocalBackups();

  // Keep last 5
  if (backups.length > MAX_LOCAL_BACKUPS) {
    backups.slice(MAX_LOCAL_BACKUPS).forEach(b => {
      localStorage.removeItem(b.key);
    });
  }

  // Check total size
  const totalSizeBytes = backups
    .slice(0, MAX_LOCAL_BACKUPS)
    .reduce((sum, b) => sum + b.sizeBytes, 0);

  const maxSizeBytes = MAX_LOCAL_SIZE_MB * 1024 * 1024;

  if (totalSizeBytes > maxSizeBytes) {
    // Delete oldest until under limit
    const kept = backups.slice(0, MAX_LOCAL_BACKUPS);
    let currentSize = totalSizeBytes;

    while (currentSize > maxSizeBytes && kept.length > 1) {
      const oldest = kept.pop()!;
      localStorage.removeItem(oldest.key);
      currentSize -= oldest.sizeBytes;
    }
  }
}
```

---

## UI/UX Design

### Settings Page Layout

```
╔═══════════════════════════════════════════════════════════╗
║  Settings                                        [X]      ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  👤 Account                                               ║
║  ├─ Email: user@example.com                              ║
║  └─ [Logout]                                             ║
║                                                           ║
║  💾 Backup & Restore                                      ║
║  ├─ Manual Backup                                        ║
║  │   [📥 Export Backup]  [📤 Import Backup]              ║
║  │                                                        ║
║  ├─ 📜 Local Auto-Backups (5 max)                        ║
║  │   • Jan 17, 2026 18:30 (245 tx, 3 trips) [Restore]   ║
║  │   • Jan 10, 2026 12:00 (198 tx, 2 trips) [Restore]   ║
║  │   • Jan 03, 2026 09:15 (156 tx, 1 trip)  [Restore]   ║
║  │                                                        ║
║  └─ ☁️ Cloud Backups (Last 30 days)                      ║
║      • Jan 17 18:30 - Manual (245 tx) [Restore][Delete] ║
║      • Jan 14 03:00 - Auto (240 tx)   [Restore][Delete] ║
║      • Jan 07 03:00 - Auto (198 tx)   [Restore][Delete] ║
║      [Create Cloud Backup Now]                           ║
║                                                           ║
║  🎨 Categories & Groups                                   ║
║  └─ [Manage Categories]                                  ║
║                                                           ║
║  ℹ️ About                                                 ║
║  ├─ Version: 0.6.2                                       ║
║  └─ Schema: v4                                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

## Migration Strategy

### Schema Migration with Auto-Backup

When upgrading schema (e.g., v4 → v5):

```typescript
export async function migrateToV5(state: BudgetState): Promise<BudgetState> {
  // 1. Create backup BEFORE migration
  console.log("[Migration] Creating pre-migration backup...");
  saveLocalBackup(state);

  if (cloudMode === 'cloud') {
    await createCloudBackup(state, 'pre-migration');
  }

  // 2. Perform migration
  console.log("[Migration] Migrating from v4 to v5...");
  const migrated = { ...state, schemaVersion: 5 as const };

  // ... migration logic ...

  // 3. Save migrated state
  console.log("[Migration] Migration complete, saving...");
  return migrated;
}
```

---

## Error Handling

### Restore Failures

If restore fails mid-operation:

```typescript
async function handleRestore(backup: BackupFile) {
  // 1. Create safety backup
  const safetyBackup = createBackup(getSnapshot());
  saveLocalBackup(getSnapshot());

  try {
    // 2. Attempt restore
    const restored = restoreBackup(backup, 'replace');
    replaceAllData(restored);
    saveState();

    if (cloudMode === 'cloud') {
      await upsertCloudState(restored);
    }

    // 3. Success
    toast.success("Backup restored successfully", {
      action: {
        label: "Undo",
        onClick: () => {
          // Revert to safety backup
          replaceAllData(safetyBackup.data);
          saveState();
          if (cloudMode === 'cloud') {
            upsertCloudState(safetyBackup.data);
          }
        },
      },
      duration: 10000,
    });

  } catch (error) {
    // 4. Failure - auto-revert
    console.error("[Restore] Failed, reverting:", error);
    replaceAllData(safetyBackup.data);
    saveState();

    toast.error("Restore failed. Your data has been preserved.");
  }
}
```

---

## Security Considerations

1. **Checksum Verification**: Always verify checksum before restore
2. **RLS Policies**: Supabase RLS ensures users only access own backups
3. **No Sensitive Data**: Backups don't include auth tokens or API keys
4. **Client-Side Encryption (Optional)**: Encrypt backup JSON before upload
5. **Size Limits**: Prevent DoS by limiting backup size (max 10MB per backup)

---

## Performance Optimization

1. **Lazy Loading**: Load cloud backups only when Settings page opens
2. **Compression**: Consider gzip compression for cloud backups (reduce storage)
3. **Debouncing**: Debounce auto-backup triggers to avoid excessive writes
4. **Background Processing**: Use Web Workers for large backup generation/validation

---

## Testing Strategy

### Test Cases

1. **Manual Export**
   - ✅ Export generates valid JSON
   - ✅ Filename follows convention
   - ✅ Checksum is correct
   - ✅ Stats match actual data

2. **Manual Import**
   - ✅ Valid backup restores successfully
   - ✅ Invalid JSON shows error
   - ✅ Corrupted checksum shows error
   - ✅ Preview shows correct stats
   - ✅ Merge mode avoids duplicates
   - ✅ Undo works within 10 seconds

3. **Local Auto-Backup**
   - ✅ Backup created before restore
   - ✅ Max 5 backups maintained
   - ✅ Total size under 5MB
   - ✅ Oldest deleted when limit reached

4. **Cloud Backup**
   - ✅ Weekly backup runs automatically
   - ✅ Manual cloud backup works
   - ✅ Restore from cloud works
   - ✅ Delete cloud backup works
   - ✅ Cleanup removes backups >30 days

---

## Roadmap

### Phase 1: Core (v0.7.0) ✅
- [x] backup.service.ts implementation
- [x] Manual Export button
- [x] Manual Import with preview modal
- [x] Local auto-backup (before restore)

### Phase 2: Auto-Local (v0.7.1) ✅
- [x] Periodic local backups (7 days)
- [x] Local backup list UI
- [x] Restore from local backup
- [x] BackupScheduler component integrated in CloudSyncGate
- [x] LocalBackupList component in Settings page

### Phase 3: Cloud (v0.8.0) ✅
- [x] Supabase user_backups table
- [x] cloudBackup.service.ts
- [x] Weekly cloud backups
- [x] Cloud backup list UI
- [x] Pre-migration backups

### Phase 4: Advanced (v0.8.1)
- [ ] Backup compression
- [ ] Client-side encryption
- [ ] Backup diff/comparison
- [ ] Selective restore (e.g., only transactions)

---

## Cost Estimation (Supabase)

**Assumptions:**
- 1000 active users
- Average backup size: 50KB (compressed)
- Weekly backups for 30 days retention = 4 backups per user

**Storage:**
- 1000 users × 4 backups × 50KB = 200MB
- Supabase Free Tier: 500MB → ✅ Fits comfortably

**Reads/Writes:**
- Writes: 1000 users × 4 backups/month = 4000/month
- Reads: minimal (only when user views Settings)
- Supabase Free Tier: 500MB egress → ✅ No problem

**Cost:** FREE on Supabase free tier

---

## Conclusion

This backup system provides **enterprise-level data protection** for SmartSpend users with:

- ✅ **Triple redundancy**: Manual, local auto, cloud auto
- ✅ **User control**: Export/import whenever needed
- ✅ **Automatic safety nets**: Backups before critical operations
- ✅ **Cloud resilience**: 30-day version history in Supabase
- ✅ **Easy recovery**: One-click restore with preview
- ✅ **Data integrity**: Checksum verification

Total implementation: ~8-10 files, ~1500 lines of code
