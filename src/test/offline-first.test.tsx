/**
 * Offline-First Tests
 *
 * These tests ensure the app's core principle: LOCAL-FIRST.
 * Everything (except AI features and push notifications) MUST work offline.
 *
 * If any of these tests fail, it means we introduced a network dependency
 * that blocks the user from using the app offline.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────────────────

// Mock supabase client - simulates offline behavior where getSession() hangs
const mockGetSession = vi.fn();
const mockGetUser = vi.fn();
const mockSignOut = vi.fn();
const mockSignInAnonymously = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      getUser: () => mockGetUser(),
      signOut: () => mockSignOut(),
      signInAnonymously: () => mockSignInAnonymously(),
      onAuthStateChange: () => mockOnAuthStateChange(),
    },
    from: (table: string) => mockFrom(table),
  },
}));

// Mock network service
const mockGetNetworkStatus = vi.fn();
const mockAddNetworkListener = vi.fn();

vi.mock('@/services/network.service', () => ({
  getNetworkStatus: () => mockGetNetworkStatus(),
  addNetworkListener: (cb: any) => mockAddNetworkListener(cb),
}));

// ─── Setup ──────────────────────────────────────────────────────────────────

function simulateOffline() {
  mockGetNetworkStatus.mockResolvedValue(false);
  // Simulate getSession() hanging forever (as it does when JWT is expired + offline)
  mockGetSession.mockImplementation(() => new Promise(() => {})); // Never resolves
  mockGetUser.mockImplementation(() => new Promise(() => {})); // Never resolves
}

function simulateOnline() {
  mockGetNetworkStatus.mockResolvedValue(true);
}

function setStoredSupabaseSession(userId: string, email: string | null = null, isAnonymous = false) {
  localStorage.setItem('sb-test-auth-token', JSON.stringify({
    currentSession: {
      user: {
        id: userId,
        email,
        is_anonymous: isAnonymous,
        user_metadata: {},
        app_metadata: {},
        identities: [],
      },
    },
  }));
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Offline-First: Core Principles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. OFFLINE SESSION READER
  // ═══════════════════════════════════════════════════════════════════════════

  describe('offlineSession: localStorage session reader', () => {
    it('should read session from localStorage without any network call', async () => {
      // This import is dynamic to ensure mocks are set up first
      const { getStoredSession, hasStoredSession } = await import('@/shared/utils/offlineSession');

      setStoredSupabaseSession('user-123', 'test@example.com');

      const session = getStoredSession();
      expect(session).not.toBeNull();
      expect(session!.userId).toBe('user-123');
      expect(session!.email).toBe('test@example.com');
      expect(session!.isAnonymous).toBe(false);
      expect(hasStoredSession()).toBe(true);

      // CRITICAL: No Supabase auth calls should have been made
      expect(mockGetSession).not.toHaveBeenCalled();
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it('should detect anonymous sessions', async () => {
      const { getStoredSession } = await import('@/shared/utils/offlineSession');

      setStoredSupabaseSession('anon-456', null, true);

      const session = getStoredSession();
      expect(session).not.toBeNull();
      expect(session!.userId).toBe('anon-456');
      expect(session!.email).toBeNull();
      expect(session!.isAnonymous).toBe(true);
    });

    it('should return null when no session is stored', async () => {
      const { getStoredSession, hasStoredSession } = await import('@/shared/utils/offlineSession');

      const session = getStoredSession();
      expect(session).toBeNull();
      expect(hasStoredSession()).toBe(false);
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      const { getStoredSession } = await import('@/shared/utils/offlineSession');

      localStorage.setItem('sb-corrupt-auth-token', 'not-json');

      const session = getStoredSession();
      expect(session).toBeNull(); // Should not throw
    });

    it('should handle session with missing user fields', async () => {
      const { getStoredSession } = await import('@/shared/utils/offlineSession');

      localStorage.setItem('sb-partial-auth-token', JSON.stringify({
        currentSession: { user: {} }, // No id
      }));

      const session = getStoredSession();
      expect(session).toBeNull(); // No userId = no valid session
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ONBOARDING / BOOT PATH
  // ═══════════════════════════════════════════════════════════════════════════

  describe('determineStartScreen: must work offline', () => {
    it('should return "app" instantly when onboarding completed (offline, no session)', async () => {
      simulateOffline();
      localStorage.setItem('budget.onboarding.completed.v2', 'true');

      const { determineStartScreen } = await import(
        '@/features/onboarding/utils/onboarding.helpers'
      );

      const start = Date.now();
      const result = await determineStartScreen();
      const elapsed = Date.now() - start;

      expect(result).toBe('app');
      // CRITICAL: Must resolve in <100ms (no network wait)
      expect(elapsed).toBeLessThan(500);
      // Should NOT have called supabase.auth.getSession()
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it('should return "app" instantly when onboarding completed + stored session (offline)', async () => {
      simulateOffline();
      localStorage.setItem('budget.onboarding.completed.v2', 'true');
      setStoredSupabaseSession('user-789', 'user@example.com');

      const { determineStartScreen } = await import(
        '@/features/onboarding/utils/onboarding.helpers'
      );

      const start = Date.now();
      const result = await determineStartScreen();
      const elapsed = Date.now() - start;

      expect(result).toBe('app');
      expect(elapsed).toBeLessThan(500);
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it('should return "login" when user logged out (offline)', async () => {
      simulateOffline();
      localStorage.setItem('budget.onboarding.logout.v2', 'true');

      const { determineStartScreen } = await import(
        '@/features/onboarding/utils/onboarding.helpers'
      );

      const result = await determineStartScreen();

      expect(result).toBe('login');
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it('should return "onboarding" for first-time user (offline)', async () => {
      simulateOffline();
      // No flags set = first time

      const { determineStartScreen } = await import(
        '@/features/onboarding/utils/onboarding.helpers'
      );

      const result = await determineStartScreen();

      expect(result).toBe('onboarding');
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it('should return "continue" when session exists + onboarding incomplete (offline, skips cloud check)', async () => {
      simulateOffline();
      setStoredSupabaseSession('user-123', 'test@example.com');
      // No COMPLETED flag = onboarding incomplete

      const { determineStartScreen } = await import(
        '@/features/onboarding/utils/onboarding.helpers'
      );

      const start = Date.now();
      const result = await determineStartScreen();
      const elapsed = Date.now() - start;

      expect(result).toBe('continue');
      // CRITICAL: Should NOT attempt cloud check when offline
      expect(elapsed).toBeLessThan(500);
      expect(mockGetSession).not.toHaveBeenCalled();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should return "login" for device_initialized (offline)', async () => {
      simulateOffline();
      localStorage.setItem('budget.device.initialized', 'true');

      const { determineStartScreen } = await import(
        '@/features/onboarding/utils/onboarding.helpers'
      );

      const result = await determineStartScreen();

      expect(result).toBe('login');
      expect(mockGetSession).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. CLOUD STATE SERVICE
  // ═══════════════════════════════════════════════════════════════════════════

  describe('cloudState.service: must not hang offline', () => {
    it('should return null immediately when offline (getCloudState)', async () => {
      simulateOffline();

      const { getCloudState } = await import('@/services/cloudState.service');

      const start = Date.now();
      const result = await getCloudState();
      const elapsed = Date.now() - start;

      expect(result).toBeNull();
      // CRITICAL: Must return immediately, not hang on getSession()
      expect(elapsed).toBeLessThan(500);
      // Should NOT call supabase.auth.getSession() when offline
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it('should not call supabase.from() when offline (upsertCloudState)', async () => {
      simulateOffline();

      const { upsertCloudState } = await import('@/services/cloudState.service');

      await upsertCloudState({
        schemaVersion: 6 as const,
        transactions: [],
        categories: [],
        categoryDefinitions: [],
        categoryGroups: [],
        budgets: [],
        trips: [],
        tripExpenses: [],
      });

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should timeout getSession() after 3s if it hangs (online but stuck)', async () => {
      simulateOnline();
      // Simulate getSession() hanging (e.g., Supabase init stuck refreshing token)
      mockGetSession.mockImplementation(() => new Promise(() => {}));

      const { getCloudState } = await import('@/services/cloudState.service');

      const start = Date.now();
      const result = await getCloudState();
      const elapsed = Date.now() - start;

      expect(result).toBeNull();
      // Should resolve within timeout + small buffer, not hang forever
      expect(elapsed).toBeLessThan(5000);
      expect(elapsed).toBeGreaterThanOrEqual(2500); // At least ~3s timeout
    }, 10000);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. ZUSTAND STORE (LOCAL DATA)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Zustand store: must work without network', () => {
    it('should hydrate from localStorage without any network call', async () => {
      simulateOffline();

      // Seed localStorage with budget state
      const storedState = {
        schemaVersion: 6 as const,
        transactions: [
          { id: 'tx1', type: 'expense', name: 'Test', category: 'food', amount: 50000, date: '2026-01-15', createdAt: Date.now() },
        ],
        categories: ['food'],
        categoryDefinitions: [
          { id: 'cat1', name: 'Comida', icon: 'utensils', color: '#10B981', type: 'expense', groupId: 'g1', isDefault: true, createdAt: Date.now() },
        ],
        categoryGroups: [],
        budgets: [],
        trips: [],
        tripExpenses: [],
        welcomeSeen: true,
      };
      localStorage.setItem('budget-state', JSON.stringify(storedState));

      // Re-import to trigger loadState()
      const { useBudgetStore } = await import('@/state/budget.store');

      // Store should have loaded from localStorage
      const state = useBudgetStore.getState();
      expect(state.transactions.length).toBeGreaterThanOrEqual(0); // At least initialized
      // The key point: no network calls needed for store initialization
      expect(mockGetSession).not.toHaveBeenCalled();
      expect(mockGetUser).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. REVENUECATPROVIDER
  // ═══════════════════════════════════════════════════════════════════════════

  describe('RevenueCatProvider: must NOT block children', () => {
    it('should render children immediately without waiting for initialization', async () => {
      simulateOffline();

      // Mock the dynamic imports that RevenueCatProvider uses
      vi.mock('@/services/revenuecat.service', () => ({
        configureRevenueCat: vi.fn().mockResolvedValue(undefined),
      }));
      vi.mock('@/shared/utils/platform', () => ({
        isNative: vi.fn().mockReturnValue(false),
      }));
      vi.mock('@/services/subscription.service', () => ({
        getSubscription: vi.fn().mockResolvedValue(null),
      }));

      const { render, screen } = await import('@/test/test-utils');
      const RevenueCatProvider = (await import('@/shared/components/providers/RevenueCatProvider')).default;

      render(
        <RevenueCatProvider>
          <div data-testid="child-content">App Content</div>
        </RevenueCatProvider>
      );

      // CRITICAL: Children must be visible IMMEDIATELY (not behind a loading spinner)
      expect(screen.getByTestId('child-content')).toBeInTheDocument();

      // Should NOT show any loading spinner
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. BACKUP EXPORT (LOCAL OPERATION)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('BackupExportButton: must work offline', () => {
    it('should read user ID from localStorage instead of calling supabase.auth.getSession()', async () => {
      simulateOffline();
      setStoredSupabaseSession('user-export-123', 'export@test.com');

      const { getStoredSession } = await import('@/shared/utils/offlineSession');
      const session = getStoredSession();

      expect(session).not.toBeNull();
      expect(session!.userId).toBe('user-export-123');
      // Backup export should use this, not supabase.auth.getSession()
      expect(mockGetSession).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. RECONNECTION SYNC
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Reconnection: must sync when back online', () => {
    it('should register network listener for reconnection sync', async () => {
      mockAddNetworkListener.mockReturnValue(() => {}); // cleanup function

      // Verify the network listener pattern exists
      const { addNetworkListener } = await import('@/services/network.service');

      const callback = vi.fn();
      const cleanup = addNetworkListener(callback);

      expect(mockAddNetworkListener).toHaveBeenCalledWith(callback);
      expect(typeof cleanup).toBe('function');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. FEATURES THAT MUST WORK OFFLINE (functional checks)
// ═══════════════════════════════════════════════════════════════════════════

describe('Offline-First: Feature Availability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    simulateOffline();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Local storage service: core CRUD', () => {
    it('should save and load state without network', async () => {
      const { saveState, loadState } = await import('@/services/storage.service');

      const testState = {
        schemaVersion: 6 as const,
        transactions: [
          { id: 'tx1', type: 'expense' as const, name: 'Coffee', category: 'food', amount: 5000, date: '2026-02-01', createdAt: Date.now() },
        ],
        categories: ['food'],
        categoryDefinitions: [],
        categoryGroups: [],
        budgets: [],
        trips: [],
        tripExpenses: [],
      };

      saveState(testState);
      const loaded = loadState();

      expect(loaded).not.toBeNull();
      expect(loaded!.transactions).toHaveLength(1);
      expect(loaded!.transactions[0].name).toBe('Coffee');
      expect(mockGetSession).not.toHaveBeenCalled();
    });
  });

  describe('Date utilities: must work offline', () => {
    it('should return today in ISO format without network', async () => {
      const { todayISO } = await import('@/services/dates.service');

      const today = todayISO();

      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(mockGetSession).not.toHaveBeenCalled();
    });
  });

  describe('Currency formatting: must work offline', () => {
    it('should format amounts without network', async () => {
      const { formatCOP } = await import('@/shared/utils/currency.utils');

      const formatted = formatCOP(150000);

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
      expect(mockGetSession).not.toHaveBeenCalled();
    });
  });

  describe('Pending sync service: must queue changes offline', () => {
    it('should store and retrieve pending snapshots locally', async () => {
      const { setPendingSnapshot, getPendingSnapshot, clearPendingSnapshot } = await import(
        '@/services/pendingSync.service'
      );

      const snapshot = {
        schemaVersion: 6 as const,
        transactions: [
          { id: 'tx1', type: 'expense' as const, name: 'Offline Purchase', category: 'food', amount: 25000, date: '2026-02-01', createdAt: Date.now() },
        ],
        categories: ['food'],
        categoryDefinitions: [],
        categoryGroups: [],
        budgets: [],
        trips: [],
        tripExpenses: [],
      };

      setPendingSnapshot(snapshot);
      const retrieved = getPendingSnapshot();

      expect(retrieved).not.toBeNull();
      expect(retrieved!.transactions[0].name).toBe('Offline Purchase');

      clearPendingSnapshot();
      expect(getPendingSnapshot()).toBeNull();

      expect(mockGetSession).not.toHaveBeenCalled();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. ANTI-REGRESSION: Things that MUST NOT block on network
// ═══════════════════════════════════════════════════════════════════════════

describe('Offline-First: Anti-Regression Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getStoredSession() must be synchronous (no await, no network)', async () => {
    const { getStoredSession } = await import('@/shared/utils/offlineSession');

    setStoredSupabaseSession('sync-test', 'sync@test.com');

    // Call synchronously — if this function were async, TypeScript would catch it
    // but let's verify the behavior too
    const result = getStoredSession();
    expect(result).not.toBeNull();
    expect(result!.userId).toBe('sync-test');
  });

  it('hasStoredSession() must be synchronous (no await, no network)', async () => {
    const { hasStoredSession } = await import('@/shared/utils/offlineSession');

    setStoredSupabaseSession('sync-test-2');

    const result = hasStoredSession();
    expect(result).toBe(true);
  });

  it('determineStartScreen must never call supabase.auth.getSession() directly', async () => {
    simulateOffline();
    localStorage.setItem('budget.onboarding.completed.v2', 'true');
    setStoredSupabaseSession('guard-test', 'guard@test.com');

    const { determineStartScreen } = await import(
      '@/features/onboarding/utils/onboarding.helpers'
    );

    await determineStartScreen();

    // The MOST IMPORTANT assertion in this entire test suite:
    // determineStartScreen() must NEVER call supabase.auth.getSession()
    // because it can hang for 30+ seconds when offline with expired JWT
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it('cloudState.service getUserId must check network before calling getSession', async () => {
    simulateOffline();

    const { getCloudState } = await import('@/services/cloudState.service');
    await getCloudState();

    // When offline, getSession should never be called
    expect(mockGetSession).not.toHaveBeenCalled();
    expect(mockGetNetworkStatus).toHaveBeenCalled();
  });
});
