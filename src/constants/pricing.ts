// ==================== SUBSCRIPTION TYPES ====================

export type ProFeature =
  | 'unlimited_categories'
  | 'unlimited_budgets'
  | 'unlimited_scheduled'
  | 'unlimited_backups'
  | 'stats_page'
  | 'export_data'
  | 'history_filters'
  | 'unlimited_ai_assistant';

export type PaywallTrigger =
  | 'onboarding'
  | 'category_limit'
  | 'budget_limit'
  | 'scheduled_limit'
  | 'stats_page'
  | 'history_filters'
  | 'export'
  | 'backup_features'
  | 'settings'
  | 'upgrade_prompt' // Para CTAs generales de upgrade
  | 'batch_entry_limit' // Límite de IA batch entry para usuarios free
  | 'ai_assistant_limit'; // Límite de mensajes del asistente IA para usuarios free

// ==================== PRICING PLANS ====================

export const PRICING_PLANS = {
  monthly: {
    id: 'co.smartspend.monthly',
    price: 4.99,
    currency: 'USD',
    period: 'month' as const,
    savingsPercent: 0,
    monthlyEquivalent: 4.99,
    badge: null,
  },
  annual: {
    id: 'co.smartspend.annual',
    price: 34.99,
    currency: 'USD',
    period: 'year' as const,
    savingsPercent: 41,
    monthlyEquivalent: 2.92,
    badge: 'bestValue' as const,
  },
  lifetime: {
    id: 'co.smartspend.lifetime',
    price: 89.99,
    currency: 'USD',
    period: 'lifetime' as const,
    savingsPercent: null,
    monthlyEquivalent: null,
    badge: null,
  },
} as const;

export type PricingPlanKey = keyof typeof PRICING_PLANS;
export type PricingPlan = (typeof PRICING_PLANS)[PricingPlanKey];

// ==================== FREE TIER LIMITS ====================

export const TRIAL_PERIOD_DAYS = 7;

export const FREE_TIER_LIMITS = {
  totalCategories: 10,
  activeBudgets: 2,
  scheduledTransactions: 3,
} as const;

// Map count-limited ProFeatures to their corresponding FREE_TIER_LIMITS key
export const COUNT_LIMITED_FEATURES: Partial<Record<ProFeature, keyof typeof FREE_TIER_LIMITS>> = {
  unlimited_categories: 'totalCategories',
  unlimited_budgets: 'activeBudgets',
  unlimited_scheduled: 'scheduledTransactions',
};

// Features that are boolean (on/off) — blocked entirely for free users
export const BOOLEAN_PRO_FEATURES: ProFeature[] = [
  'stats_page',
  'export_data',
  'history_filters',
  'unlimited_backups',
];
