/**
 * RevenueCat Service
 *
 * Service layer for handling in-app purchases and subscriptions.
 *
 * MOCK MODE: Currently using mock data for local development.
 * To enable real purchases, install @revenuecat/purchases-capacitor
 * and uncomment the real implementation sections.
 */

import { PRICING_PLANS, TRIAL_PERIOD_DAYS } from '@/constants/pricing';

// ==================== TYPES ====================

export interface RevenueCatOffering {
  identifier: string;
  serverDescription: string;
  availablePackages: RevenueCatPackage[];
}

export interface RevenueCatPackage {
  identifier: string;
  packageType: 'monthly' | 'annual' | 'lifetime' | 'custom';
  product: RevenueCatProduct;
  offeringIdentifier: string;
}

export interface RevenueCatProduct {
  identifier: string;
  description: string;
  title: string;
  price: number;
  priceString: string;
  currencyCode: string;
  introPrice?: {
    price: number;
    priceString: string;
    period: string;
    cycles: number;
  };
}

export interface RevenueCatCustomerInfo {
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  latestExpirationDate: string | null;
  entitlements: {
    [key: string]: RevenueCatEntitlement;
  };
  originalAppUserId: string;
}

export interface RevenueCatEntitlement {
  identifier: string;
  isActive: boolean;
  willRenew: boolean;
  periodType: 'trial' | 'intro' | 'normal' | 'promotional';
  latestPurchaseDate: string;
  expirationDate: string | null;
  unsubscribeDetectedAt: string | null;
  billingIssueDetectedAt: string | null;
  productIdentifier: string;
}

export interface PurchaseResult {
  customerInfo: RevenueCatCustomerInfo;
  productIdentifier: string;
  transactionDate: string;
}

// ==================== MOCK DATA ====================

const MOCK_OFFERINGS: RevenueCatOffering = {
  identifier: 'default',
  serverDescription: 'Default offering',
  availablePackages: [
    {
      identifier: 'monthly',
      packageType: 'monthly',
      offeringIdentifier: 'default',
      product: {
        identifier: PRICING_PLANS.monthly.id,
        title: 'SmartSpend Pro (Monthly)',
        description: 'Monthly subscription with 7-day free trial',
        price: PRICING_PLANS.monthly.price,
        priceString: `$${PRICING_PLANS.monthly.price}`,
        currencyCode: 'USD',
        introPrice: {
          price: 0,
          priceString: 'Free',
          period: `${TRIAL_PERIOD_DAYS} days`,
          cycles: 1,
        },
      },
    },
    {
      identifier: 'annual',
      packageType: 'annual',
      offeringIdentifier: 'default',
      product: {
        identifier: PRICING_PLANS.annual.id,
        title: 'SmartSpend Pro (Annual)',
        description: `Annual subscription with 7-day free trial. Save ${PRICING_PLANS.annual.savingsPercent}%!`,
        price: PRICING_PLANS.annual.price,
        priceString: `$${PRICING_PLANS.annual.price}`,
        currencyCode: 'USD',
        introPrice: {
          price: 0,
          priceString: 'Free',
          period: `${TRIAL_PERIOD_DAYS} days`,
          cycles: 1,
        },
      },
    },
    {
      identifier: 'lifetime',
      packageType: 'lifetime',
      offeringIdentifier: 'default',
      product: {
        identifier: PRICING_PLANS.lifetime.id,
        title: 'SmartSpend Pro (Lifetime)',
        description: 'One-time purchase. Pay once, use forever.',
        price: PRICING_PLANS.lifetime.price,
        priceString: `$${PRICING_PLANS.lifetime.price}`,
        currencyCode: 'USD',
      },
    },
  ],
};

// Mock customer info for free user (no subscription)
const MOCK_FREE_USER: RevenueCatCustomerInfo = {
  activeSubscriptions: [],
  allPurchasedProductIdentifiers: [],
  latestExpirationDate: null,
  entitlements: {},
  originalAppUserId: 'mock_user_free',
};

// ==================== MOCK STATE ====================

// LocalStorage key for persisting mock customer info
const MOCK_CUSTOMER_INFO_KEY = 'revenuecat.mockCustomerInfo';

// Load mock customer info from localStorage (survives page refreshes)
function loadMockCustomerInfo(): RevenueCatCustomerInfo {
  try {
    const saved = localStorage.getItem(MOCK_CUSTOMER_INFO_KEY);
    if (saved) {
      console.log('[RevenueCat] Loaded saved mock customer info from localStorage');
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('[RevenueCat] Failed to load mock customer info:', error);
  }
  return MOCK_FREE_USER;
}

// Save mock customer info to localStorage
function saveMockCustomerInfo(info: RevenueCatCustomerInfo): void {
  try {
    localStorage.setItem(MOCK_CUSTOMER_INFO_KEY, JSON.stringify(info));
    console.log('[RevenueCat] Saved mock customer info to localStorage');
  } catch (error) {
    console.warn('[RevenueCat] Failed to save mock customer info:', error);
  }
}

let mockCustomerInfo: RevenueCatCustomerInfo = loadMockCustomerInfo();
let isConfigured = false;

// ==================== SERVICE FUNCTIONS ====================

/**
 * Configure RevenueCat SDK
 * In production, this initializes the SDK with API keys
 *
 * @param _userId - Optional user ID for anonymous users (prefixed with _ to indicate unused in mock)
 */
export async function configureRevenueCat(_userId?: string): Promise<void> {
  console.log('[RevenueCat] Configuring SDK (MOCK MODE)');

  // TODO: Uncomment when ready for production
  // import Purchases from '@revenuecat/purchases-capacitor';
  // await Purchases.configure({
  //   apiKey: Platform.OS === 'ios' ? IOS_API_KEY : ANDROID_API_KEY,
  //   appUserID: _userId,
  // });

  // Mock implementation
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
  isConfigured = true;

  console.log('[RevenueCat] SDK configured successfully');
}

/**
 * Get available offerings (products)
 * Returns the list of subscription packages available for purchase
 */
export async function getOfferings(): Promise<RevenueCatOffering | null> {
  if (!isConfigured) {
    console.warn('[RevenueCat] SDK not configured. Call configureRevenueCat() first');
    return null;
  }

  console.log('[RevenueCat] Fetching offerings (MOCK MODE)');

  // TODO: Uncomment when ready for production
  // import Purchases from '@revenuecat/purchases-capacitor';
  // const { offerings } = await Purchases.getOfferings();
  // return offerings.current || null;

  // Mock implementation
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API call
  return MOCK_OFFERINGS;
}

/**
 * Get current customer info
 * Returns subscription status and entitlements
 */
export async function getCustomerInfo(): Promise<RevenueCatCustomerInfo> {
  if (!isConfigured) {
    console.warn('[RevenueCat] SDK not configured. Returning free user');
    return MOCK_FREE_USER;
  }

  console.log('[RevenueCat] Fetching customer info (MOCK MODE)');

  // TODO: Uncomment when ready for production
  // import Purchases from '@revenuecat/purchases-capacitor';
  // const { customerInfo } = await Purchases.getCustomerInfo();
  // return customerInfo;

  // Mock implementation
  await new Promise((resolve) => setTimeout(resolve, 200)); // Simulate API call
  return mockCustomerInfo;
}

/**
 * Purchase a package
 * Initiates the purchase flow for a subscription or one-time purchase
 *
 * @param packageToPurchase - The package to purchase
 */
export async function purchasePackage(
  packageToPurchase: RevenueCatPackage
): Promise<PurchaseResult> {
  if (!isConfigured) {
    throw new Error('RevenueCat SDK not configured');
  }

  console.log('[RevenueCat] Purchasing package:', packageToPurchase.identifier);

  // TODO: Uncomment when ready for production
  // import Purchases from '@revenuecat/purchases-capacitor';
  // const { customerInfo, productIdentifier } = await Purchases.purchasePackage({
  //   aPackage: packageToPurchase,
  // });

  // Mock implementation - Simulate successful purchase with trial
  await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate purchase flow

  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_PERIOD_DAYS);

  const mockPurchasedInfo: RevenueCatCustomerInfo = {
    activeSubscriptions: [packageToPurchase.product.identifier],
    allPurchasedProductIdentifiers: [packageToPurchase.product.identifier],
    latestExpirationDate: packageToPurchase.packageType === 'lifetime' ? null : trialEnd.toISOString(),
    entitlements: {
      pro: {
        identifier: 'pro',
        isActive: true,
        willRenew: packageToPurchase.packageType !== 'lifetime',
        periodType: packageToPurchase.product.introPrice ? 'trial' : 'normal',
        latestPurchaseDate: now.toISOString(),
        expirationDate: packageToPurchase.packageType === 'lifetime' ? null : trialEnd.toISOString(),
        unsubscribeDetectedAt: null,
        billingIssueDetectedAt: null,
        productIdentifier: packageToPurchase.product.identifier,
      },
    },
    originalAppUserId: 'mock_user_pro',
  };

  // Update mock state and persist to localStorage
  mockCustomerInfo = mockPurchasedInfo;
  saveMockCustomerInfo(mockCustomerInfo);

  console.log('[RevenueCat] Purchase successful!');
  console.log('[RevenueCat] Trial ends at:', trialEnd.toISOString());

  return {
    customerInfo: mockPurchasedInfo,
    productIdentifier: packageToPurchase.product.identifier,
    transactionDate: now.toISOString(),
  };
}

/**
 * Restore purchases
 * Restores previous purchases from the user's account
 */
export async function restorePurchases(): Promise<RevenueCatCustomerInfo> {
  if (!isConfigured) {
    throw new Error('RevenueCat SDK not configured');
  }

  console.log('[RevenueCat] Restoring purchases (MOCK MODE)');

  // TODO: Uncomment when ready for production
  // import Purchases from '@revenuecat/purchases-capacitor';
  // const { customerInfo } = await Purchases.restorePurchases();
  // return customerInfo;

  // Mock implementation - Simulate restore
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // In mock mode, just return current state
  console.log('[RevenueCat] Purchases restored');
  return mockCustomerInfo;
}

/**
 * Check if user has active Pro entitlement
 */
export function hasProEntitlement(customerInfo: RevenueCatCustomerInfo): boolean {
  const proEntitlement = customerInfo.entitlements.pro;
  return proEntitlement?.isActive ?? false;
}

/**
 * Check if user is in trial period
 */
export function isInTrialPeriod(customerInfo: RevenueCatCustomerInfo): boolean {
  const proEntitlement = customerInfo.entitlements.pro;
  if (!proEntitlement || !proEntitlement.isActive) return false;
  return proEntitlement.periodType === 'trial';
}

/**
 * Get trial end date
 */
export function getTrialEndDate(customerInfo: RevenueCatCustomerInfo): Date | null {
  const proEntitlement = customerInfo.entitlements.pro;
  if (!proEntitlement || !proEntitlement.expirationDate) return null;
  if (proEntitlement.periodType !== 'trial') return null;
  return new Date(proEntitlement.expirationDate);
}

/**
 * Get subscription type
 */
export function getSubscriptionType(
  customerInfo: RevenueCatCustomerInfo
): 'free' | 'trial' | 'monthly' | 'annual' | 'lifetime' {
  const proEntitlement = customerInfo.entitlements.pro;

  if (!proEntitlement || !proEntitlement.isActive) {
    return 'free';
  }

  if (proEntitlement.periodType === 'trial') {
    return 'trial';
  }

  const productId = proEntitlement.productIdentifier;

  if (productId === PRICING_PLANS.monthly.id) return 'monthly';
  if (productId === PRICING_PLANS.annual.id) return 'annual';
  if (productId === PRICING_PLANS.lifetime.id) return 'lifetime';

  return 'free';
}

// ==================== MOCK HELPERS (FOR TESTING) ====================

/**
 * Mock helper: Reset to free user
 * Only available in mock mode for testing
 */
export function __mockResetToFreeUser(): void {
  console.log('[RevenueCat] MOCK: Resetting to free user');
  mockCustomerInfo = MOCK_FREE_USER;
  saveMockCustomerInfo(mockCustomerInfo);
}

/**
 * Mock helper: Simulate trial expiration
 * Only available in mock mode for testing
 */
export function __mockExpireTrial(): void {
  console.log('[RevenueCat] MOCK: Expiring trial');
  const expired = new Date();
  expired.setDate(expired.getDate() - 1); // Yesterday

  if (mockCustomerInfo.entitlements.pro) {
    mockCustomerInfo = {
      ...mockCustomerInfo,
      activeSubscriptions: [],
      latestExpirationDate: expired.toISOString(),
      entitlements: {
        pro: {
          ...mockCustomerInfo.entitlements.pro,
          isActive: false,
          expirationDate: expired.toISOString(),
        },
      },
    };
    saveMockCustomerInfo(mockCustomerInfo);
  }
}

/**
 * Mock helper: Simulate converting trial to paid
 * Only available in mock mode for testing
 */
export function __mockConvertTrialToPaid(type: 'monthly' | 'annual' | 'lifetime'): void {
  console.log('[RevenueCat] MOCK: Converting trial to paid:', type);

  if (mockCustomerInfo.entitlements.pro) {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    mockCustomerInfo = {
      ...mockCustomerInfo,
      entitlements: {
        pro: {
          ...mockCustomerInfo.entitlements.pro,
          periodType: 'normal',
          expirationDate: type === 'lifetime' ? null : futureDate.toISOString(),
          productIdentifier: PRICING_PLANS[type].id,
        },
      },
    };
    saveMockCustomerInfo(mockCustomerInfo);
  }
}
