import { useMemo } from 'react';
import { useBudgetStore } from '@/state/budget.store';
import { FREE_TIER_LIMITS, COUNT_LIMITED_FEATURES } from '@/constants/pricing';
import type { ProFeature } from '@/constants/pricing';
import type { SubscriptionState, Category, Budget, Transaction, Debt } from '@/types/budget.types';
import { logger } from '@/shared/utils/logger';

type SubscriptionInfo = {
  isPro: boolean;
  isTrialing: boolean;
  trialEndsAt: string | null;
  subscriptionType: SubscriptionState['type'] | 'free';
  subscription: SubscriptionState | null;
  canUseFeature: (feature: ProFeature) => boolean;
  shouldShowPaywall: (feature: ProFeature) => boolean;
  getRemainingCount: (feature: ProFeature) => number | null;
};

function computeIsPro(sub: SubscriptionState | null | undefined): boolean {
  if (!sub) return false;
  if (sub.status === 'active') return true;
  if (sub.status === 'trialing') {
    if (!sub.trialEndsAt) return false;
    return new Date(sub.trialEndsAt) > new Date();
  }
  return false;
}

function getCurrentCount(
  limitKey: keyof typeof FREE_TIER_LIMITS,
  categoryDefinitions: Category[],
  budgets: Budget[],
  transactions: Transaction[],
  debts: Debt[],
): number {
  switch (limitKey) {
    case 'totalCategories':
      return categoryDefinitions.length;
    case 'activeBudgets':
      return budgets.filter((b) => b.status === 'active').length;
    case 'scheduledTransactions':
      return transactions.filter((t) => t.schedule?.enabled).length;
    case 'activeDebts':
      return debts.filter((d) => d.status === 'active').length;
    default:
      return 0;
  }
}

export function useSubscription(): SubscriptionInfo {
  const subscription = useBudgetStore((s) => s.subscription);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const budgets = useBudgetStore((s) => s.budgets);
  const transactions = useBudgetStore((s) => s.transactions);
  const debts = useBudgetStore((s) => s.debts);

  return useMemo(() => {
    const isPro = computeIsPro(subscription);
    const isTrialing = subscription?.status === 'trialing' && isPro;
    const trialEndsAt = subscription?.trialEndsAt ?? null;
    const subscriptionType = subscription?.type ?? 'free';

    // Debug logs (development only)
    logger.debug('useSubscription', 'subscription:', subscription);
    logger.debug('useSubscription', 'isPro:', isPro);
    logger.debug('useSubscription', 'isTrialing:', isTrialing);
    logger.debug('useSubscription', 'subscriptionType:', subscriptionType);

    function canUseFeature(feature: ProFeature): boolean {
      logger.debug('canUseFeature', 'checking feature:', feature, 'isPro:', isPro);

      if (isPro) return true;

      const limitKey = COUNT_LIMITED_FEATURES[feature];
      if (limitKey) {
        const currentCount = getCurrentCount(limitKey, categoryDefinitions, budgets, transactions, debts);
        logger.debug('canUseFeature', 'limitKey:', limitKey, 'currentCount:', currentCount, 'limit:', FREE_TIER_LIMITS[limitKey]);
        return currentCount < FREE_TIER_LIMITS[limitKey];
      }

      // Boolean pro features: blocked for free users
      return false;
    }

    function shouldShowPaywall(feature: ProFeature): boolean {
      return !canUseFeature(feature);
    }

    function getRemainingCount(feature: ProFeature): number | null {
      if (isPro) return null; // unlimited
      const limitKey = COUNT_LIMITED_FEATURES[feature];
      if (!limitKey) return null; // not a count-limited feature
      const current = getCurrentCount(limitKey, categoryDefinitions, budgets, transactions, debts);
      return Math.max(0, FREE_TIER_LIMITS[limitKey] - current);
    }

    return {
      isPro,
      isTrialing,
      trialEndsAt,
      subscriptionType,
      subscription: subscription ?? null,
      canUseFeature,
      shouldShowPaywall,
      getRemainingCount,
    };
  }, [subscription, categoryDefinitions, budgets, transactions, debts]);
}
