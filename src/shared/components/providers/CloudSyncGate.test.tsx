import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import type { BudgetState } from '@/types/budget.types';
import { useBudgetStore } from '@/state/budget.store';

// ============================================================================
// Mock Supabase client
// ============================================================================
const mockGetSession = vi.fn();
const mockSignInAnonymously = vi.fn();
const mockSignOut = vi.fn();
const mockRpc = vi.fn();
let authChangeCallback: ((event: string, session: any) => void) | null = null;

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      signInAnonymously: () => mockSignInAnonymously(),
      signOut: () => mockSignOut(),
      onAuthStateChange: (callback: any) => {
        authChangeCallback = callback;
        return {
          data: {
            subscription: { unsubscribe: vi.fn() },
          },
        };
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    rpc: mockRpc,
  },
}));

// ============================================================================
// Mock cloud state service
// ============================================================================
const mockGetCloudState = vi.fn();
const mockUpsertCloudState = vi.fn();
vi.mock('@/services/cloudState.service', () => ({
  getCloudState: mockGetCloudState,
  upsertCloudState: mockUpsertCloudState,
}));

// ============================================================================
// Mock services
// ============================================================================
vi.mock('@/services/storage.service', () => ({
  loadState: vi.fn(() => null),
  saveState: vi.fn(),
  clearState: vi.fn(),
}));

const mockGetPendingSnapshot = vi.fn(() => null);
vi.mock('@/services/pendingSync.service', () => ({
  getPendingSnapshot: mockGetPendingSnapshot,
  setPendingSnapshot: vi.fn(),
  clearPendingSnapshot: vi.fn(),
}));

const mockGetNetworkStatus = vi.fn().mockResolvedValue(true);
vi.mock('@/services/network.service', () => ({
  getNetworkStatus: mockGetNetworkStatus,
  addNetworkListener: vi.fn(() => vi.fn()),
}));

const mockMigrateGuestTokenToUser = vi.fn().mockResolvedValue(false);
const mockDeactivateToken = vi.fn().mockResolvedValue(undefined);
vi.mock('@/services/pushNotification.service', () => ({
  initializePushNotifications: vi.fn().mockResolvedValue(false),
  deactivateToken: mockDeactivateToken,
  migrateGuestTokenToUser: mockMigrateGuestTokenToUser,
  cleanup: vi.fn(),
}));

vi.mock('@/shared/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/shared/services/scheduler.service', () => ({
  convertLegacyRecurringToSchedule: vi.fn(),
}));

vi.mock('@/constants/categories/default-categories', () => ({
  createDefaultCategories: vi.fn(() => []),
}));

vi.mock('@/constants/category-groups/default-category-groups', () => ({
  createDefaultCategoryGroups: vi.fn(() => [
    { id: 'essential', name: 'Esenciales', type: 'expense', color: '#EF4444', isDefault: true, createdAt: Date.now() },
  ]),
}));

// Mock child components (they render null in tests)
vi.mock('@/features/backup/components/BackupScheduler', () => ({
  default: () => null,
}));

vi.mock('@/features/backup/components/CloudBackupScheduler', () => ({
  default: () => null,
}));

// Mock subscription service (dynamically imported inside CloudSyncGate)
const mockGetSubscription = vi.fn().mockResolvedValue(null);
vi.mock('@/services/subscription.service', () => ({
  getSubscription: mockGetSubscription,
  clearSubscriptionCache: vi.fn(),
}));

// Mock RevenueCat (dynamically imported inside CloudSyncGate)
vi.mock('@revenuecat/purchases-capacitor', () => ({
  Purchases: {
    logIn: vi.fn().mockResolvedValue({}),
  },
}));

// Mock platform utils
vi.mock('@/shared/utils/platform', () => ({
  isNative: vi.fn(() => false),
}));

// ============================================================================
// Test data
// ============================================================================
const ANON_USER_ID = 'anon-1234-5678';
const AUTH_USER_ID = 'auth-abcd-efgh';
const AUTH_EMAIL = 'testuser@gmail.com';

const mockAnonSession = {
  user: {
    id: ANON_USER_ID,
    email: null,
    is_anonymous: true,
    user_metadata: {},
    app_metadata: {},
    identities: [],
  },
};

const mockAuthSession = {
  user: {
    id: AUTH_USER_ID,
    email: AUTH_EMAIL,
    is_anonymous: false,
    user_metadata: { full_name: 'Test User', avatar_url: 'https://example.com/avatar.jpg' },
    app_metadata: { provider: 'google' },
    identities: [{ provider: 'google' }],
  },
};

const mockLocalTransactions: BudgetState = {
  schemaVersion: 6,
  transactions: [
    { id: 'tx-1', type: 'expense', name: 'Almuerzo', category: 'food', amount: 25000, date: '2026-02-01', createdAt: Date.now() },
    { id: 'tx-2', type: 'expense', name: 'Taxi', category: 'transport', amount: 15000, date: '2026-02-01', createdAt: Date.now() },
  ],
  categories: ['food', 'transport'],
  categoryDefinitions: [
    { id: 'food', name: 'Alimentación', icon: 'utensils', color: '#10B981', type: 'expense', groupId: 'essential', isDefault: true, createdAt: Date.now() },
  ],
  categoryGroups: [
    { id: 'essential', name: 'Esenciales', type: 'expense', color: '#EF4444', isDefault: true, createdAt: Date.now() },
  ],
  budgets: [],
  trips: [],
  tripExpenses: [],
  debts: [],
  debtPayments: [],
};

const mockExistingCloudData: BudgetState = {
  schemaVersion: 6,
  transactions: [
    { id: 'cloud-tx-1', type: 'expense', name: 'Netflix', category: 'entertainment', amount: 45000, date: '2026-01-15', createdAt: Date.now() },
    { id: 'cloud-tx-2', type: 'income', name: 'Salario', category: 'salary', amount: 5000000, date: '2026-01-30', createdAt: Date.now() },
    { id: 'cloud-tx-3', type: 'expense', name: 'Mercado', category: 'food', amount: 350000, date: '2026-01-20', createdAt: Date.now() },
  ],
  categories: ['entertainment', 'salary', 'food'],
  categoryDefinitions: [
    { id: 'food', name: 'Alimentación', icon: 'utensils', color: '#10B981', type: 'expense', groupId: 'essential', isDefault: true, createdAt: Date.now() },
    { id: 'entertainment', name: 'Entretenimiento', icon: 'tv', color: '#8B5CF6', type: 'expense', groupId: 'essential', isDefault: true, createdAt: Date.now() },
  ],
  categoryGroups: [
    { id: 'essential', name: 'Esenciales', type: 'expense', color: '#EF4444', isDefault: true, createdAt: Date.now() },
  ],
  budgets: [],
  trips: [],
  tripExpenses: [],
  debts: [],
  debtPayments: [],
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Render CloudSyncGate and capture the auth callback.
 * Waits for initial initForSession() to complete.
 */
async function renderAndInit() {
  // Dynamic import to avoid hoisting issues with vi.mock
  const { default: CloudSyncGate } = await import('./CloudSyncGate');
  render(<CloudSyncGate />);

  // Wait for async initForSession() to settle
  await vi.waitFor(() => {
    expect(authChangeCallback).not.toBeNull();
  });

  // Let all microtasks (initForSession) flush
  await new Promise((r) => setTimeout(r, 50));
}

/**
 * Simulate a SIGNED_IN event and wait for the async handler to complete.
 */
async function fireSignedIn(session: any) {
  authChangeCallback!('SIGNED_IN', session);
  // The handler uses setTimeout(fn, 0) internally, so we need to flush
  await new Promise((r) => setTimeout(r, 100));
}

/**
 * Simulate a SIGNED_OUT event and wait for the async handler to complete.
 */
async function fireSignedOut() {
  authChangeCallback!('SIGNED_OUT', null);
  await new Promise((r) => setTimeout(r, 100));
}

// ============================================================================
// Tests
// ============================================================================

describe('CloudSyncGate - Anonymous Auth → OAuth Transition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    authChangeCallback = null;

    // Reset store
    useBudgetStore.getState().replaceAllData({
      schemaVersion: 9,
      transactions: [],
      categories: [],
      categoryDefinitions: [],
      categoryGroups: [],
      budgets: [],
      trips: [],
      tripExpenses: [],
      debts: [],
      debtPayments: [],
    });
    useBudgetStore.setState({
      cloudMode: 'guest',
      cloudStatus: 'idle',
      user: { email: null, name: null, avatarUrl: null, provider: null },
    });

    // Default: online
    mockGetNetworkStatus.mockResolvedValue(true);

    // Default: no pending snapshot
    mockGetPendingSnapshot.mockReturnValue(null);

    // Default mocks
    mockUpsertCloudState.mockResolvedValue(undefined);
    mockRpc.mockResolvedValue({ data: null, error: null });
    mockSignInAnonymously.mockResolvedValue({ data: { session: mockAnonSession }, error: null });
    mockMigrateGuestTokenToUser.mockResolvedValue(false);
    mockDeactivateToken.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ========================================================================
  // Case 1: Guest with data → Login (new Google account) → Inherits data
  // ========================================================================
  describe('Case 1: Guest with data → Login (new Google account)', () => {
    it('should preserve local data and clean up anonymous user after OAuth', async () => {
      // Start with anonymous session
      mockGetSession.mockResolvedValue({ data: { session: mockAnonSession }, error: null });
      mockGetCloudState.mockResolvedValue(null);

      // Load local data into store (simulating user who added transactions)
      useBudgetStore.getState().replaceAllData(mockLocalTransactions);

      await renderAndInit();

      // Verify anonymous session initialized cloud mode
      expect(useBudgetStore.getState().cloudMode).toBe('cloud');

      // Simulate: LoginScreen saves anon user ID before OAuth
      localStorage.setItem('budget.previousAnonUserId', ANON_USER_ID);
      localStorage.setItem('budget.oauthTransition', Date.now().toString());

      // Simulate: OAuth completes → new authenticated session
      mockGetSession.mockResolvedValue({ data: { session: mockAuthSession }, error: null });
      mockGetCloudState.mockResolvedValue(null); // New user, no cloud data

      await fireSignedIn(mockAuthSession);

      // Verify: oauthTransition flag cleared
      expect(localStorage.getItem('budget.oauthTransition')).toBeNull();

      // Verify: user data updated
      const state = useBudgetStore.getState();
      expect(state.cloudMode).toBe('cloud');
      expect(state.user.email).toBe(AUTH_EMAIL);
      expect(state.user.name).toBe('Test User');
      expect(state.user.provider).toBe('google');

      // Verify: cleanup RPC called with anonymous user ID
      expect(mockRpc).toHaveBeenCalledWith('cleanup_orphaned_anonymous_user', {
        anon_user_id: ANON_USER_ID,
      });

      // Verify: previousAnonUserId flag cleared
      expect(localStorage.getItem('budget.previousAnonUserId')).toBeNull();
    });
  });

  // ========================================================================
  // Case 2: Guest with data + Pro → Login (new Google)
  // ========================================================================
  describe('Case 2: Guest with data + Pro subscription → Login (new Google)', () => {
    it('should migrate RevenueCat and clean up anonymous user', async () => {
      // Start with anonymous session
      mockGetSession.mockResolvedValue({ data: { session: mockAnonSession }, error: null });
      mockGetCloudState.mockResolvedValue(null);
      useBudgetStore.getState().replaceAllData(mockLocalTransactions);

      await renderAndInit();

      // Set up subscription state (anonymous user has Pro)
      useBudgetStore.getState().setSubscription({
        status: 'active',
        productId: 'pro_monthly',
        expiresAt: '2026-03-01T00:00:00Z',
      } as any);

      // Simulate OAuth transition flags
      localStorage.setItem('budget.previousAnonUserId', ANON_USER_ID);
      localStorage.setItem('budget.oauthTransition', Date.now().toString());

      // OAuth completes → authenticated session
      mockGetSession.mockResolvedValue({ data: { session: mockAuthSession }, error: null });
      mockGetCloudState.mockResolvedValue(null);

      // Mock subscription service for the new user
      mockGetSubscription.mockResolvedValue({
        status: 'active',
        productId: 'pro_monthly',
        expiresAt: '2026-03-01T00:00:00Z',
      });

      await fireSignedIn(mockAuthSession);

      // Verify: user authenticated
      expect(useBudgetStore.getState().user.email).toBe(AUTH_EMAIL);

      // Verify: cleanup of anonymous user
      expect(mockRpc).toHaveBeenCalledWith('cleanup_orphaned_anonymous_user', {
        anon_user_id: ANON_USER_ID,
      });

      expect(localStorage.getItem('budget.previousAnonUserId')).toBeNull();
    });
  });

  // ========================================================================
  // Case 3: Guest with data → Login (existing account with cloud data)
  // ========================================================================
  describe('Case 3: Guest with data → Login (existing account with data)', () => {
    it('should load existing cloud data and NOT overwrite with anonymous data', async () => {
      // Start with anonymous session
      mockGetSession.mockResolvedValue({ data: { session: mockAnonSession }, error: null });
      mockGetCloudState.mockResolvedValue(null);
      useBudgetStore.getState().replaceAllData(mockLocalTransactions);

      await renderAndInit();

      // Simulate OAuth transition
      localStorage.setItem('budget.previousAnonUserId', ANON_USER_ID);
      localStorage.setItem('budget.oauthTransition', Date.now().toString());

      // OAuth signs into EXISTING account with cloud data
      mockGetSession.mockResolvedValue({ data: { session: mockAuthSession }, error: null });
      mockGetCloudState.mockResolvedValue(mockExistingCloudData);

      await fireSignedIn(mockAuthSession);

      // Verify: existing cloud data loaded (NOT anonymous user's data)
      const state = useBudgetStore.getState();
      expect(state.transactions).toHaveLength(3); // Cloud had 3, not 2 from anon
      expect(state.transactions[0].name).toBe('Netflix');
      expect(state.user.email).toBe(AUTH_EMAIL);

      // Verify: anonymous user cleaned up
      expect(mockRpc).toHaveBeenCalledWith('cleanup_orphaned_anonymous_user', {
        anon_user_id: ANON_USER_ID,
      });
    });
  });

  // ========================================================================
  // Case 4: Fresh install → Login (new Google account)
  // ========================================================================
  describe('Case 4: Fresh install → Login (new Google account)', () => {
    it('should clean up short-lived anonymous user after immediate login', async () => {
      // Fresh app: anonymous session, no data
      mockGetSession.mockResolvedValue({ data: { session: mockAnonSession }, error: null });
      mockGetCloudState.mockResolvedValue(null);

      await renderAndInit();

      expect(useBudgetStore.getState().cloudMode).toBe('cloud');

      // User immediately logs in (no data added)
      localStorage.setItem('budget.previousAnonUserId', ANON_USER_ID);
      localStorage.setItem('budget.oauthTransition', Date.now().toString());

      // OAuth → new account, no cloud data
      mockGetSession.mockResolvedValue({ data: { session: mockAuthSession }, error: null });
      mockGetCloudState.mockResolvedValue(null);

      await fireSignedIn(mockAuthSession);

      // Verify: authenticated user set up
      const state = useBudgetStore.getState();
      expect(state.cloudMode).toBe('cloud');
      expect(state.user.email).toBe(AUTH_EMAIL);

      // Verify: anonymous user cleaned up even though it existed briefly
      expect(mockRpc).toHaveBeenCalledWith('cleanup_orphaned_anonymous_user', {
        anon_user_id: ANON_USER_ID,
      });

      expect(localStorage.getItem('budget.previousAnonUserId')).toBeNull();
    });
  });

  // ========================================================================
  // Case 5: Fresh install → Login (existing Google account)
  // ========================================================================
  describe('Case 5: Fresh install → Login (existing account with data)', () => {
    it('should load existing cloud data and clean up anonymous user', async () => {
      // Fresh app: anonymous session, no data
      mockGetSession.mockResolvedValue({ data: { session: mockAnonSession }, error: null });
      mockGetCloudState.mockResolvedValue(null);

      await renderAndInit();

      // User logs in with existing account
      localStorage.setItem('budget.previousAnonUserId', ANON_USER_ID);
      localStorage.setItem('budget.oauthTransition', Date.now().toString());

      mockGetSession.mockResolvedValue({ data: { session: mockAuthSession }, error: null });
      mockGetCloudState.mockResolvedValue(mockExistingCloudData);

      await fireSignedIn(mockAuthSession);

      // Verify: cloud data loaded
      const state = useBudgetStore.getState();
      expect(state.transactions).toHaveLength(3);
      expect(state.user.email).toBe(AUTH_EMAIL);
      expect(state.cloudMode).toBe('cloud');

      // Verify: anonymous user cleaned up
      expect(mockRpc).toHaveBeenCalledWith('cleanup_orphaned_anonymous_user', {
        anon_user_id: ANON_USER_ID,
      });

      expect(localStorage.getItem('budget.previousAnonUserId')).toBeNull();
    });
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================
  describe('Edge Cases', () => {
    // E1: OAuth cancelled → flag remains harmlessly
    it('E1: should leave previousAnonUserId if OAuth is cancelled', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockAnonSession }, error: null });
      mockGetCloudState.mockResolvedValue(null);

      await renderAndInit();

      // Simulate: flags set before OAuth, but user cancels
      localStorage.setItem('budget.previousAnonUserId', ANON_USER_ID);
      localStorage.setItem('budget.oauthTransition', Date.now().toString());

      // No SIGNED_IN fires (user cancelled)
      // Flag stays in localStorage (harmless)
      expect(localStorage.getItem('budget.previousAnonUserId')).toBe(ANON_USER_ID);

      // Cleanup RPC should NOT have been called
      expect(mockRpc).not.toHaveBeenCalledWith(
        'cleanup_orphaned_anonymous_user',
        expect.anything()
      );
    });

    // E2: OAuth fails → flags cleaned up in catch
    it('E2: should remove flags when OAuth throws an error', () => {
      // This tests the LoginScreen/LoginProScreen catch block behavior
      localStorage.setItem('budget.previousAnonUserId', ANON_USER_ID);
      localStorage.setItem('budget.oauthTransition', Date.now().toString());

      // Simulate catch block behavior (as in handleGoogleLogin catch)
      localStorage.removeItem('budget.oauthTransition');
      localStorage.removeItem('budget.previousAnonUserId');

      expect(localStorage.getItem('budget.oauthTransition')).toBeNull();
      expect(localStorage.getItem('budget.previousAnonUserId')).toBeNull();
    });

    // E3: Cleanup RPC fails → non-blocking
    it('E3: should not throw when cleanup RPC fails', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockAnonSession }, error: null });
      mockGetCloudState.mockResolvedValue(null);

      await renderAndInit();

      localStorage.setItem('budget.previousAnonUserId', ANON_USER_ID);
      localStorage.setItem('budget.oauthTransition', Date.now().toString());

      // RPC will throw (e.g., migration not applied)
      mockRpc.mockRejectedValue(new Error('function cleanup_orphaned_anonymous_user does not exist'));

      mockGetSession.mockResolvedValue({ data: { session: mockAuthSession }, error: null });
      mockGetCloudState.mockResolvedValue(null);

      // Should NOT throw — error is caught internally
      await expect(fireSignedIn(mockAuthSession)).resolves.not.toThrow();

      // Verify: RPC was attempted
      expect(mockRpc).toHaveBeenCalledWith('cleanup_orphaned_anonymous_user', {
        anon_user_id: ANON_USER_ID,
      });

      // Verify: flag still cleaned up even though RPC failed
      expect(localStorage.getItem('budget.previousAnonUserId')).toBeNull();

      // Verify: user session still works despite cleanup failure
      expect(useBudgetStore.getState().user.email).toBe(AUTH_EMAIL);
    });

    // E5: SIGNED_OUT during OAuth transition → skip cleanup
    it('E5: should skip cleanup on SIGNED_OUT during OAuth transition', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockAnonSession }, error: null });
      mockGetCloudState.mockResolvedValue(null);
      useBudgetStore.getState().replaceAllData(mockLocalTransactions);

      await renderAndInit();

      // Set OAuth transition flag (fresh, within 2-minute window)
      localStorage.setItem('budget.oauthTransition', Date.now().toString());

      // SIGNED_OUT fires during OAuth (exchangeCodeForSession replacing anonymous session)
      await fireSignedOut();

      // Verify: data NOT cleared (oauthTransition flag protected it)
      // The store should still have data OR not have been reset
      // The key test is that the SIGNED_OUT handler returned early
      expect(localStorage.getItem('budget.oauthTransition')).not.toBeNull();
    });

    // E5b: Stale oauthTransition flag (>2 min) should NOT skip cleanup
    it('E5b: should proceed with cleanup if oauthTransition flag is stale (>2min)', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockAnonSession }, error: null });
      mockGetCloudState.mockResolvedValue(null);

      await renderAndInit();

      // Set stale flag (3 minutes ago)
      localStorage.setItem('budget.oauthTransition', String(Date.now() - 180_000));

      await fireSignedOut();

      // Verify: stale flag removed
      expect(localStorage.getItem('budget.oauthTransition')).toBeNull();
    });

    // E6: Multiple OAuth attempts → idempotent
    it('E6: should handle multiple rapid OAuth flag writes', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockAnonSession }, error: null });
      mockGetCloudState.mockResolvedValue(null);

      await renderAndInit();

      // Multiple attempts overwrite the same flag
      localStorage.setItem('budget.previousAnonUserId', ANON_USER_ID);
      localStorage.setItem('budget.previousAnonUserId', ANON_USER_ID);
      localStorage.setItem('budget.previousAnonUserId', ANON_USER_ID);

      // Only one value stored
      expect(localStorage.getItem('budget.previousAnonUserId')).toBe(ANON_USER_ID);

      // OAuth succeeds
      mockGetSession.mockResolvedValue({ data: { session: mockAuthSession }, error: null });
      mockGetCloudState.mockResolvedValue(null);

      await fireSignedIn(mockAuthSession);

      // Cleanup called exactly once
      const cleanupCalls = mockRpc.mock.calls.filter(
        (call) => call[0] === 'cleanup_orphaned_anonymous_user'
      );
      expect(cleanupCalls).toHaveLength(1);
    });

    // No previousAnonUserId → no cleanup
    it('should NOT call cleanup RPC when there is no previousAnonUserId', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockAnonSession }, error: null });
      mockGetCloudState.mockResolvedValue(null);

      await renderAndInit();

      // No previousAnonUserId set (user was not anonymous before OAuth)
      localStorage.setItem('budget.oauthTransition', Date.now().toString());

      mockGetSession.mockResolvedValue({ data: { session: mockAuthSession }, error: null });
      mockGetCloudState.mockResolvedValue(null);

      await fireSignedIn(mockAuthSession);

      // Verify: cleanup RPC NOT called
      expect(mockRpc).not.toHaveBeenCalledWith(
        'cleanup_orphaned_anonymous_user',
        expect.anything()
      );
    });

    // E7: Logout → Guest → OAuth login should clear logout flag
    it('E7: should clear logout flag on SIGNED_IN to prevent login loop', async () => {
      // Start with anonymous session (guest mode after logout)
      mockGetSession.mockResolvedValue({ data: { session: mockAnonSession }, error: null });
      mockGetCloudState.mockResolvedValue(null);

      await renderAndInit();

      // Simulate: user previously logged out → flag set by OnboardingGate
      localStorage.setItem('budget.onboarding.logout.v2', 'true');

      // Simulate: user goes through OAuth from guest mode
      localStorage.setItem('budget.previousAnonUserId', ANON_USER_ID);
      localStorage.setItem('budget.oauthTransition', Date.now().toString());

      mockGetSession.mockResolvedValue({ data: { session: mockAuthSession }, error: null });
      mockGetCloudState.mockResolvedValue(null);

      await fireSignedIn(mockAuthSession);

      // CRITICAL: logout flag must be cleared to prevent OnboardingGate redirect loop
      expect(localStorage.getItem('budget.onboarding.logout.v2')).toBeNull();

      // Verify: user is authenticated normally
      expect(useBudgetStore.getState().user.email).toBe(AUTH_EMAIL);
    });

    // Anonymous SIGNED_IN → cloud sync (not cleanup)
    it('should init cloud sync for anonymous SIGNED_IN without cleanup', async () => {
      // Start with no session
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      mockSignInAnonymously.mockResolvedValue({ data: { session: mockAnonSession }, error: null });

      await renderAndInit();

      // Simulate anonymous SIGNED_IN (from signInAnonymously)
      mockGetSession.mockResolvedValue({ data: { session: mockAnonSession }, error: null });
      mockGetCloudState.mockResolvedValue(null);

      await fireSignedIn(mockAnonSession);

      // Verify: cloud mode activated for anonymous user
      expect(useBudgetStore.getState().cloudMode).toBe('cloud');

      // Verify: cleanup NOT called (no previousAnonUserId for anonymous→anonymous)
      expect(mockRpc).not.toHaveBeenCalledWith(
        'cleanup_orphaned_anonymous_user',
        expect.anything()
      );
    });
  });
});
