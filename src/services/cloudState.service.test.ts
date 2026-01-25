import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCloudState, upsertCloudState } from './cloudState.service';
import type { BudgetState } from '@/types/budget.types';

// Mock Supabase client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockUpsert = vi.fn();
const mockFrom = vi.fn();
const mockGetSession = vi.fn();

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
    from: (table: string) => mockFrom(table),
  },
}));

describe('cloudState.service', () => {
  const mockUserId = 'test-user-123';
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
    budgets: [],
    trips: [],
    tripExpenses: [],
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup default chain for from()
    mockFrom.mockReturnValue({
      select: mockSelect,
      upsert: mockUpsert,
    });

    // Setup default chain for select()
    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    // Setup default chain for eq()
    mockEq.mockReturnValue({
      maybeSingle: mockMaybeSingle,
    });

    // Setup default successful session
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: mockUserId,
          },
        },
      },
      error: null,
    });
  });

  describe('getCloudState', () => {
    it('should return null when user is not authenticated', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await getCloudState();

      expect(result).toBeNull();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should return null when getSession returns error', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Auth error'),
      });

      const result = await getCloudState();

      expect(result).toBeNull();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should fetch cloud state for authenticated user', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { state: mockState },
        error: null,
      });

      const result = await getCloudState();

      expect(result).toEqual(mockState);
      expect(mockFrom).toHaveBeenCalledWith('user_state');
      expect(mockSelect).toHaveBeenCalledWith('state');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockMaybeSingle).toHaveBeenCalled();
    });

    it('should return null when no state exists for user', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await getCloudState();

      expect(result).toBeNull();
    });

    it('should return null when state field is null', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { state: null },
        error: null,
      });

      const result = await getCloudState();

      expect(result).toBeNull();
    });

    it('should throw error when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: dbError,
      });

      await expect(getCloudState()).rejects.toThrow('Database connection failed');
    });

    it('should handle complex state with all fields', async () => {
      const complexState: BudgetState = {
        schemaVersion: 4,
        transactions: [
          {
            id: '1',
            type: 'expense',
            name: 'Expense 1',
            category: 'food',
            amount: 50000,
            date: '2026-01-15',
            createdAt: Date.now(),
          },
          {
            id: '2',
            type: 'income',
            name: 'Income 1',
            category: 'salary',
            amount: 2000000,
            date: '2026-01-31',
            createdAt: Date.now(),
          },
        ],
        categories: ['food', 'salary'],
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
        budgets: [],
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

      mockMaybeSingle.mockResolvedValue({
        data: { state: complexState },
        error: null,
      });

      const result = await getCloudState();

      expect(result).toEqual(complexState);
      expect(result?.transactions).toHaveLength(2);
      expect(result?.categoryDefinitions).toHaveLength(1);
      expect(result?.trips).toHaveLength(1);
      expect(result?.tripExpenses).toHaveLength(1);
    });
  });

  describe('upsertCloudState', () => {
    it('should do nothing when user is not authenticated', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await upsertCloudState(mockState);

      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('should do nothing when getSession returns error', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Auth error'),
      });

      await upsertCloudState(mockState);

      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('should upsert state for authenticated user', async () => {
      mockUpsert.mockResolvedValue({
        data: null,
        error: null,
      });

      await upsertCloudState(mockState);

      expect(mockFrom).toHaveBeenCalledWith('user_state');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          state: mockState,
        }),
        { onConflict: 'user_id' }
      );
    });

    it('should include updated_at timestamp', async () => {
      mockUpsert.mockResolvedValue({
        data: null,
        error: null,
      });

      const beforeTime = new Date().toISOString();
      await upsertCloudState(mockState);
      const afterTime = new Date().toISOString();

      const upsertCall = mockUpsert.mock.calls[0];
      const upsertData = upsertCall[0];

      expect(upsertData.updated_at).toBeDefined();
      expect(upsertData.updated_at).toBeTypeOf('string');
      // Check that timestamp is recent (within test execution time)
      expect(upsertData.updated_at >= beforeTime).toBe(true);
      expect(upsertData.updated_at <= afterTime).toBe(true);
    });

    it('should throw error when upsert fails', async () => {
      const dbError = new Error('Database write failed');
      mockUpsert.mockResolvedValue({
        data: null,
        error: dbError,
      });

      await expect(upsertCloudState(mockState)).rejects.toThrow('Database write failed');
    });

    it('should handle empty state', async () => {
      const emptyState: BudgetState = {
        schemaVersion: 4,
        transactions: [],
        categories: [],
        categoryDefinitions: [],
        categoryGroups: [],
        budgets: [],
        trips: [],
        tripExpenses: [],
      };

      mockUpsert.mockResolvedValue({
        data: null,
        error: null,
      });

      await upsertCloudState(emptyState);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          state: emptyState,
        }),
        { onConflict: 'user_id' }
      );
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
          date: '2026-01-15',
          createdAt: Date.now(),
        })),
        categories: ['food'],
        categoryDefinitions: [],
        categoryGroups: [],
        budgets: [],
        trips: [],
        tripExpenses: [],
      };

      mockUpsert.mockResolvedValue({
        data: null,
        error: null,
      });

      await upsertCloudState(largeState);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          state: largeState,
        }),
        { onConflict: 'user_id' }
      );

      const upsertCall = mockUpsert.mock.calls[0];
      const upsertData = upsertCall[0];
      expect(upsertData.state.transactions).toHaveLength(1000);
    });

    it('should use onConflict option correctly', async () => {
      mockUpsert.mockResolvedValue({
        data: null,
        error: null,
      });

      await upsertCloudState(mockState);

      const upsertCall = mockUpsert.mock.calls[0];
      const options = upsertCall[1];

      expect(options).toEqual({ onConflict: 'user_id' });
    });

    it('should handle multiple rapid upserts', async () => {
      mockUpsert.mockResolvedValue({
        data: null,
        error: null,
      });

      const state1 = { ...mockState, transactions: [] };
      const state2 = { ...mockState, categories: ['test'] };
      const state3 = { ...mockState, trips: [] };

      await Promise.all([
        upsertCloudState(state1),
        upsertCloudState(state2),
        upsertCloudState(state3),
      ]);

      expect(mockUpsert).toHaveBeenCalledTimes(3);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle full sync cycle: upsert then get', async () => {
      // Setup: Upsert succeeds
      mockUpsert.mockResolvedValue({
        data: null,
        error: null,
      });

      await upsertCloudState(mockState);

      // Now setup maybeSingle to return the state we just upserted
      mockMaybeSingle.mockResolvedValue({
        data: { state: mockState },
        error: null,
      });

      const retrieved = await getCloudState();

      expect(retrieved).toEqual(mockState);
    });

    it('should handle user switching: different userId gets different state', async () => {
      const user1Id = 'user-1';
      const user2Id = 'user-2';
      const state1 = { ...mockState, transactions: [mockState.transactions[0]] };
      const state2 = { ...mockState, transactions: [] };

      // User 1 session
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: user1Id } } },
        error: null,
      });

      mockUpsert.mockResolvedValue({ data: null, error: null });
      await upsertCloudState(state1);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: user1Id }),
        expect.any(Object)
      );

      // User 2 session
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: user2Id } } },
        error: null,
      });

      await upsertCloudState(state2);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: user2Id }),
        expect.any(Object)
      );

      expect(mockUpsert).toHaveBeenCalledTimes(2);
    });

    it('should handle logout scenario: no state access after session ends', async () => {
      // First, user is authenticated
      mockMaybeSingle.mockResolvedValue({
        data: { state: mockState },
        error: null,
      });

      const state1 = await getCloudState();
      expect(state1).toEqual(mockState);

      // Then user logs out
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const state2 = await getCloudState();
      expect(state2).toBeNull();
    });
  });
});
