/**
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createBackup,
  validateBackup,
  restoreBackup,
  saveLocalBackup,
  getLocalBackups,
  restoreLocalBackup,
} from './backup.service';
import type { BudgetState, BackupFile } from '@/types/budget.types';

describe('backup.service', () => {
  let cryptoDigestSpy: any;
  let cryptoRandomUUIDSpy: any;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Spy on crypto functions (crypto is native in node environment)
    // Mock digest to return 32 bytes (256 bits for SHA-256)
    cryptoDigestSpy = vi.spyOn(global.crypto.subtle, 'digest').mockResolvedValue(
      new Uint8Array([
        0x9f, 0x86, 0xd0, 0x81, 0x88, 0x4c, 0x7d, 0x65, 0x9a, 0x2f, 0xea, 0xa0, 0xc5, 0x5a, 0xd0,
        0x15, 0xb1, 0xf1, 0x49, 0x39, 0x86, 0x7c, 0x01, 0x88, 0xb0, 0x9b, 0x88, 0xb0, 0x2e, 0xf0,
        0xc3, 0x55,
      ]).buffer as ArrayBuffer
    );

    cryptoRandomUUIDSpy = vi.spyOn(global.crypto, 'randomUUID').mockReturnValue(
      'backup-1234567890123-abcd1234' as `${string}-${string}-${string}-${string}-${string}`
    );
  });

  afterEach(() => {
    cryptoDigestSpy?.mockRestore();
    cryptoRandomUUIDSpy?.mockRestore();
  });

  const mockState: BudgetState = {
    schemaVersion: 4,
    transactions: [
      {
        id: '1',
        type: 'expense',
        name: 'Test Transaction',
        category: 'food',
        amount: 50000,
        date: '2026-01-15',
        createdAt: Date.now(),
      },
    ],
    categories: ['food'],
    categoryDefinitions: [],
    categoryGroups: [],
    trips: [],
    tripExpenses: [],
  };

  describe('createBackup', () => {
    it('should create backup with correct metadata', async () => {
      const backup = await createBackup(mockState, 'user-123', 'manual');

      expect(backup.meta).toBeDefined();
      expect(backup.meta.backupVersion).toBe('1.0'); // String, not number
      expect(backup.meta.appVersion).toBeDefined();
      expect(backup.meta.schemaVersion).toBe(4);
      expect(backup.meta.backupId).toBeDefined();
      expect(backup.meta.createdAt).toBeDefined();
      expect(backup.meta.userId).toBe('user-123');
      expect(backup.meta.createdBy).toBe('manual');
    });

    it('should calculate accurate stats', async () => {
      const stateWithMultipleEntities: BudgetState = {
        schemaVersion: 4,
        transactions: [
          {
            id: '1',
            type: 'expense',
            name: 'Transaction 1',
            category: 'food',
            amount: 50000,
            date: '2026-01-15',
            createdAt: Date.now(),
          },
          {
            id: '2',
            type: 'income',
            name: 'Transaction 2',
            category: 'salary',
            amount: 2000000,
            date: '2026-01-20',
            createdAt: Date.now(),
          },
        ],
        categories: ['food', 'salary'],
        categoryDefinitions: [],
        categoryGroups: [],
        trips: [
          {
            id: 'trip-1',
            name: 'Cartagena',
            destination: 'Cartagena, Colombia',
            budget: 2000000,
            startDate: '2026-02-01',
            endDate: '2026-02-07',
            status: 'planning',
            createdAt: Date.now(),
          },
        ],
        tripExpenses: [],
      };

      const backup = await createBackup(stateWithMultipleEntities);

      expect(backup.stats).toBeDefined(); // stats is top-level, not in meta
      expect(backup.stats.totalTransactions).toBe(2);
      expect(backup.stats.totalTrips).toBe(1);
      expect(backup.stats.dateRange).toEqual({
        from: '2026-01-15',
        to: '2026-01-20',
      });
      expect(backup.stats.sizeBytes).toBeGreaterThan(0);
    });

    it('should generate SHA-256 checksum', async () => {
      const backup = await createBackup(mockState);

      expect(backup.checksum).toBeDefined();
      expect(backup.checksum).toMatch(/^[a-f0-9]{64}$/);
      expect(cryptoDigestSpy).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array));
    });

    it('should include device info', async () => {
      const backup = await createBackup(mockState);

      expect(backup.meta.deviceInfo).toBeDefined();
      expect(backup.meta.deviceInfo.platform).toBeDefined();
      expect(backup.meta.deviceInfo.userAgent).toBeDefined();
      expect(backup.meta.deviceInfo.timezone).toBeDefined();
    });

    it('should handle empty state', async () => {
      const emptyState: BudgetState = {
        schemaVersion: 4,
        transactions: [],
        categories: [],
        categoryDefinitions: [],
        categoryGroups: [],
        trips: [],
        tripExpenses: [],
      };

      const backup = await createBackup(emptyState);

      expect(backup.stats.totalTransactions).toBe(0);
      expect(backup.stats.totalTrips).toBe(0);
      expect(backup.stats.dateRange).toBeNull(); // null when no transactions
      expect(backup.data).toEqual(emptyState);
    });

    it('should handle state with no userId', async () => {
      const backup = await createBackup(mockState);

      expect(backup.meta.userId).toBeUndefined();
    });

    it('should default to manual createdBy', async () => {
      const backup = await createBackup(mockState);

      expect(backup.meta.createdBy).toBe('manual');
    });

    it('should allow automatic createdBy', async () => {
      const backup = await createBackup(mockState, 'user-123', 'automatic');

      expect(backup.meta.createdBy).toBe('automatic');
    });

    it('should handle large state with many transactions', async () => {
      const largeState: BudgetState = {
        schemaVersion: 4,
        transactions: Array.from({ length: 1000 }, (_, i) => ({
          id: `tx-${i}`,
          type: 'expense' as const,
          name: `Transaction ${i}`,
          category: 'food',
          amount: 10000 + i,
          date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
          createdAt: Date.now(),
        })),
        categories: ['food'],
        categoryDefinitions: [],
        categoryGroups: [],
        trips: [],
        tripExpenses: [],
      };

      const backup = await createBackup(largeState);

      expect(backup.stats.totalTransactions).toBe(1000);
      expect(backup.stats.sizeBytes).toBeGreaterThan(10000);
      expect(backup.data.transactions).toHaveLength(1000);
    });

    it('should include all state fields in backup data', async () => {
      const backup = await createBackup(mockState);

      expect(backup.data.schemaVersion).toBe(4);
      expect(backup.data.transactions).toEqual(mockState.transactions);
      expect(backup.data.categories).toEqual(mockState.categories);
      expect(backup.data.categoryDefinitions).toEqual(mockState.categoryDefinitions);
      expect(backup.data.categoryGroups).toEqual(mockState.categoryGroups);
      expect(backup.data.trips).toEqual(mockState.trips);
      expect(backup.data.tripExpenses).toEqual(mockState.tripExpenses);
    });
  });

  describe('validateBackup', () => {
    async function createMockFile(content: string, filename = 'backup.json'): Promise<File> {
      return new File([content], filename, { type: 'application/json' });
    }

    it('should validate correct backup structure', async () => {
      const validBackup = await createBackup(mockState);
      const file = await createMockFile(JSON.stringify(validBackup));

      const result = await validateBackup(file);

      expect(result).toEqual(validBackup);
    });

    it('should reject invalid JSON', async () => {
      const file = await createMockFile('invalid json {{{');

      await expect(validateBackup(file)).rejects.toThrow('Invalid JSON format');
    });

    it('should reject missing required fields - meta', async () => {
      const invalidBackup = {
        // missing meta
        data: mockState,
        checksum: 'abc123',
      };
      const file = await createMockFile(JSON.stringify(invalidBackup));

      await expect(validateBackup(file)).rejects.toThrow(
        'Invalid backup file structure: missing required fields'
      );
    });

    it('should reject missing required fields - data', async () => {
      const validBackup = await createBackup(mockState);
      const invalidBackup = {
        meta: validBackup.meta,
        // missing data
        checksum: validBackup.checksum,
      };
      const file = await createMockFile(JSON.stringify(invalidBackup));

      await expect(validateBackup(file)).rejects.toThrow(
        'Invalid backup file structure: missing required fields'
      );
    });

    it('should reject missing required fields - checksum', async () => {
      const validBackup = await createBackup(mockState);
      const invalidBackup = {
        meta: validBackup.meta,
        data: validBackup.data,
        // missing checksum
      };
      const file = await createMockFile(JSON.stringify(invalidBackup));

      await expect(validateBackup(file)).rejects.toThrow(
        'Invalid backup file structure: missing required fields'
      );
    });

    it('should reject unsupported backup versions', async () => {
      const validBackup = await createBackup(mockState);
      const unsupportedBackup = {
        ...validBackup,
        meta: {
          ...validBackup.meta,
          backupVersion: '999',
        },
      };
      const file = await createMockFile(JSON.stringify(unsupportedBackup));

      await expect(validateBackup(file)).rejects.toThrow('Unsupported backup version');
    });

    it('should detect checksum mismatches (corrupted files)', async () => {
      const validBackup = await createBackup(mockState);
      const corruptedBackup = {
        ...validBackup,
        checksum: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', // Wrong checksum
      };
      const file = await createMockFile(JSON.stringify(corruptedBackup));

      await expect(validateBackup(file)).rejects.toThrow('checksum mismatch');
    });

    it('should warn on newer schema versions but still validate', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const validBackup = await createBackup(mockState);
      const newerSchemaBackup = {
        ...validBackup,
        data: {
          ...validBackup.data,
          schemaVersion: 999,
        },
      };

      // Recalculate checksum for the modified data
      const dataStr = JSON.stringify(newerSchemaBackup.data);
      const encoder = new TextEncoder();
      const data = encoder.encode(dataStr);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      newerSchemaBackup.checksum = hashHex;

      const file = await createMockFile(JSON.stringify(newerSchemaBackup));

      const result = await validateBackup(file);

      expect(result).toEqual(newerSchemaBackup);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Backup uses newer schema')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle empty file', async () => {
      const file = await createMockFile('');

      await expect(validateBackup(file)).rejects.toThrow('Invalid JSON format');
    });

    it('should handle file with null content', async () => {
      const file = await createMockFile('null');

      await expect(validateBackup(file)).rejects.toThrow(); // Will throw on accessing null.meta
    });

    it('should validate backup with all optional fields', async () => {
      const backup = await createBackup(mockState, 'user-123', 'automatic');
      const file = await createMockFile(JSON.stringify(backup));

      const result = await validateBackup(file);

      expect(result.meta.userId).toBe('user-123');
      expect(result.meta.createdBy).toBe('automatic');
      expect(result.meta.deviceInfo).toBeDefined();
      expect(result.stats).toBeDefined();
    });
  });

  describe('restoreBackup', () => {
    it('should return backup data in "replace" mode', async () => {
      const backup = await createBackup(mockState);

      const restored = restoreBackup(backup, 'replace');

      expect(restored).toEqual(mockState);
      expect(restored.transactions).toHaveLength(1);
      expect(restored.transactions[0].name).toBe('Test Transaction');
    });

    it('should default to "replace" mode', async () => {
      const backup = await createBackup(mockState);

      const restored = restoreBackup(backup);

      expect(restored).toEqual(mockState);
    });

    it('should throw error for "merge" mode (not yet implemented)', async () => {
      const backup = await createBackup(mockState);

      expect(() => restoreBackup(backup, 'merge')).toThrow('Merge mode not yet implemented');
    });

    it('should restore empty state', async () => {
      const emptyState: BudgetState = {
        schemaVersion: 4,
        transactions: [],
        categories: [],
        categoryDefinitions: [],
        categoryGroups: [],
        trips: [],
        tripExpenses: [],
      };
      const backup = await createBackup(emptyState);

      const restored = restoreBackup(backup);

      expect(restored.transactions).toHaveLength(0);
      expect(restored.trips).toHaveLength(0);
    });

    it('should restore all state fields correctly', async () => {
      const complexState: BudgetState = {
        schemaVersion: 4,
        transactions: [
          {
            id: '1',
            type: 'expense',
            name: 'Expense',
            category: 'food',
            amount: 50000,
            date: '2026-01-15',
            createdAt: Date.now(),
          },
        ],
        categories: ['food', 'transport'],
        categoryDefinitions: [
          {
            id: 'cat-1',
            name: 'Food',
            icon: 'utensils',
            color: '#10B981',
            type: 'expense',
            groupId: 'essential',
            isDefault: true,
            createdAt: Date.now(),
          },
        ],
        categoryGroups: [
          {
            id: 'essential',
            name: 'Esenciales',
            type: 'expense',
            color: '#EF4444',
            isDefault: true,
            createdAt: Date.now(),
          },
        ],
        trips: [
          {
            id: 'trip-1',
            name: 'Cartagena',
            destination: 'Cartagena, Colombia',
            budget: 2000000,
            startDate: '2026-02-01',
            endDate: '2026-02-07',
            status: 'planning',
            createdAt: Date.now(),
          },
        ],
        tripExpenses: [
          {
            id: 'expense-1',
            tripId: 'trip-1',
            category: 'food',
            name: 'Breakfast',
            amount: 50000,
            date: '2026-02-01',
            createdAt: Date.now(),
          },
        ],
      };
      const backup = await createBackup(complexState);

      const restored = restoreBackup(backup);

      expect(restored.transactions).toHaveLength(1);
      expect(restored.categoryDefinitions).toHaveLength(1);
      expect(restored.categoryGroups).toHaveLength(1);
      expect(restored.trips).toHaveLength(1);
      expect(restored.tripExpenses).toHaveLength(1);
    });
  });

  describe('Local storage functions', () => {
    describe('saveLocalBackup', () => {
      it('should save backup to localStorage with user namespacing', async () => {
        await saveLocalBackup(mockState, 'user-123');

        const backups = getLocalBackups('user-123');

        expect(backups).toHaveLength(1);
        expect(backups[0].backup.meta.userId).toBe('user-123');
        expect(backups[0].backup.meta.createdBy).toBe('auto-local');
      });

      it('should save backup for guest user (no userId)', async () => {
        await saveLocalBackup(mockState);

        const backups = getLocalBackups();
        expect(backups).toHaveLength(1);
      });

      it('should not throw on localStorage errors', async () => {
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => {
          throw new Error('QuotaExceededError');
        };

        await expect(saveLocalBackup(mockState)).resolves.not.toThrow();

        localStorage.setItem = originalSetItem;
      });
    });

    describe('getLocalBackups', () => {
      it('should return empty array when no backups exist', () => {
        const backups = getLocalBackups('user-123');
        expect(backups).toEqual([]);
      });

      it('should retrieve saved backups for user', async () => {
        await saveLocalBackup(mockState, 'user-123');

        const backups = getLocalBackups('user-123');

        expect(backups).toHaveLength(1);
        expect(backups[0].backup.meta.userId).toBe('user-123');
        expect(backups[0].backup.data).toEqual(mockState);
      });

      it('should filter backups by userId', async () => {
        await saveLocalBackup(mockState, 'user-123');
        await saveLocalBackup(mockState, 'user-456');

        const user123Backups = getLocalBackups('user-123');
        const user456Backups = getLocalBackups('user-456');

        expect(user123Backups).toHaveLength(1);
        expect(user456Backups).toHaveLength(1);
        expect(user123Backups[0].backup.meta.userId).toBe('user-123');
        expect(user456Backups[0].backup.meta.userId).toBe('user-456');
      });

      it('should handle guest user backups', async () => {
        await saveLocalBackup(mockState);

        const backups = getLocalBackups();

        expect(backups).toHaveLength(1);
      });

      it('should remove corrupted backups', () => {
        // Manually add a corrupted backup
        localStorage.setItem('budget.autoBackup.user-123.1234567890', 'invalid json');

        const backups = getLocalBackups('user-123');

        // Should be empty after removing corrupted backup
        expect(backups).toEqual([]);
        // Corrupted backup should be removed
        expect(localStorage.getItem('budget.autoBackup.user-123.1234567890')).toBeNull();
      });
    });

    describe('restoreLocalBackup', () => {
      it('should restore backup by key', async () => {
        await saveLocalBackup(mockState, 'user-123');
        const backups = getLocalBackups('user-123');
        const key = backups[0].key;

        const restored = restoreLocalBackup(key);

        expect(restored).toEqual(mockState);
      });

      it('should return null for non-existent key', () => {
        const restored = restoreLocalBackup('non-existent-key');
        expect(restored).toBeNull();
      });

      it('should handle guest user backups', async () => {
        await saveLocalBackup(mockState);
        const backups = getLocalBackups();
        const key = backups[0].key;

        const restored = restoreLocalBackup(key);

        expect(restored).toEqual(mockState);
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle full backup cycle: save -> get -> restore', async () => {
      // Save
      await saveLocalBackup(mockState, 'user-123');

      // Get
      const backups = getLocalBackups('user-123');
      expect(backups).toHaveLength(1);

      // Restore
      const restored = restoreLocalBackup(backups[0].key);
      expect(restored).toEqual(mockState);
    });

    it('should handle validation -> restore flow', async () => {
      const backup = await createBackup(mockState);
      const file = new File([JSON.stringify(backup)], 'backup.json', {
        type: 'application/json',
      });

      const validated = await validateBackup(file);
      const restored = restoreBackup(validated);

      expect(restored).toEqual(mockState);
    });

    it('should maintain data integrity through multiple operations', async () => {
      // Save locally
      await saveLocalBackup(mockState, 'user-123');

      // Get backup
      const backups = getLocalBackups('user-123');
      const backup = backups[0].backup;

      // Create file and validate
      const file = new File([JSON.stringify(backup)], 'backup.json', {
        type: 'application/json',
      });
      const validated = await validateBackup(file);

      // Restore from validated
      const restored = restoreBackup(validated);

      // Verify integrity
      expect(restored).toEqual(mockState);
      expect(restored.transactions[0].name).toBe('Test Transaction');
      expect(restored.transactions[0].amount).toBe(50000);
    });

    it('should handle multiple users with separate backups', async () => {
      const state1 = { ...mockState, transactions: [mockState.transactions[0]] };
      const state2 = {
        ...mockState,
        transactions: [
          {
            ...mockState.transactions[0],
            id: '2',
            name: 'Different Transaction',
          },
        ],
      };

      await saveLocalBackup(state1, 'user-123');
      await saveLocalBackup(state2, 'user-456');

      const user123Backups = getLocalBackups('user-123');
      const user456Backups = getLocalBackups('user-456');

      expect(user123Backups).toHaveLength(1);
      expect(user456Backups).toHaveLength(1);

      const restored1 = restoreLocalBackup(user123Backups[0].key);
      const restored2 = restoreLocalBackup(user456Backups[0].key);

      expect(restored1?.transactions[0].name).toBe('Test Transaction');
      expect(restored2?.transactions[0].name).toBe('Different Transaction');
    });
  });
});
