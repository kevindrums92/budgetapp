/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSubscription } from './useSubscription';
import { useBudgetStore } from '@/state/budget.store';

// Mock logger to suppress debug output
vi.mock('@/shared/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBudgetStore.setState({ subscription: null });
  });

  describe('isPro', () => {
    it('should return false when no subscription exists', () => {
      useBudgetStore.setState({ subscription: null });
      const { result } = renderHook(() => useSubscription());
      expect(result.current.isPro).toBe(false);
    });

    it('should return true when subscription status is active', () => {
      useBudgetStore.setState({
        subscription: {
          status: 'active',
          type: 'monthly',
          trialEndsAt: null,
          expiresAt: null,
          lastChecked: new Date().toISOString(),
        },
      });
      const { result } = renderHook(() => useSubscription());
      expect(result.current.isPro).toBe(true);
    });

    it('should return true when trialing and trial has not expired', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      useBudgetStore.setState({
        subscription: {
          status: 'trialing',
          type: 'annual',
          trialEndsAt: futureDate,
          expiresAt: null,
          lastChecked: new Date().toISOString(),
        },
      });
      const { result } = renderHook(() => useSubscription());
      expect(result.current.isPro).toBe(true);
      expect(result.current.isTrialing).toBe(true);
    });

    it('should return false when trialing and trial has expired', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      useBudgetStore.setState({
        subscription: {
          status: 'trialing',
          type: 'annual',
          trialEndsAt: pastDate,
          expiresAt: null,
          lastChecked: new Date().toISOString(),
        },
      });
      const { result } = renderHook(() => useSubscription());
      expect(result.current.isPro).toBe(false);
      expect(result.current.isTrialing).toBe(false);
    });

    it('should return false when trialing with no trialEndsAt', () => {
      useBudgetStore.setState({
        subscription: {
          status: 'trialing',
          type: 'monthly',
          trialEndsAt: null,
          expiresAt: null,
          lastChecked: new Date().toISOString(),
        },
      });
      const { result } = renderHook(() => useSubscription());
      expect(result.current.isPro).toBe(false);
    });

    it('should return false when subscription status is expired', () => {
      useBudgetStore.setState({
        subscription: {
          status: 'expired',
          type: 'monthly',
          trialEndsAt: null,
          expiresAt: new Date(Date.now() - 1000).toISOString(),
          lastChecked: new Date().toISOString(),
        },
      });
      const { result } = renderHook(() => useSubscription());
      expect(result.current.isPro).toBe(false);
    });
  });

  describe('subscriptionType', () => {
    it('should return free when no subscription', () => {
      useBudgetStore.setState({ subscription: null });
      const { result } = renderHook(() => useSubscription());
      expect(result.current.subscriptionType).toBe('free');
    });

    it('should return the subscription type when active', () => {
      useBudgetStore.setState({
        subscription: {
          status: 'active',
          type: 'lifetime',
          trialEndsAt: null,
          expiresAt: null,
          lastChecked: new Date().toISOString(),
        },
      });
      const { result } = renderHook(() => useSubscription());
      expect(result.current.subscriptionType).toBe('lifetime');
    });
  });

  describe('hook return shape', () => {
    it('should NOT export canUseFeature, shouldShowPaywall, or getRemainingCount', () => {
      const { result } = renderHook(() => useSubscription());
      const keys = Object.keys(result.current);
      expect(keys).toContain('isPro');
      expect(keys).toContain('isTrialing');
      expect(keys).toContain('trialEndsAt');
      expect(keys).toContain('subscriptionType');
      expect(keys).toContain('subscription');
      // These should NOT exist anymore
      expect(keys).not.toContain('canUseFeature');
      expect(keys).not.toContain('shouldShowPaywall');
      expect(keys).not.toContain('getRemainingCount');
    });
  });
});
