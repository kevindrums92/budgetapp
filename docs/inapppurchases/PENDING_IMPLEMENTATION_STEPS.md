# Pending Implementation Steps - Subscription v2.0

**Status:** ⚠️ Partially Implemented
**Completed Date:** 2026-01-31

---

## ✅ Completed

- [x] Database migration (`20260131_create_subscription_tables.sql`)
- [x] Edge Function (`revenuecat-webhook/index.ts`)
- [x] Subscription service (`subscription.service.ts`)
- [x] Removed `subscription` from `BudgetState` type
- [x] Documentation (`SUBSCRIPTION_ARCHITECTURE.md`)

---

## ⚠️ Remaining Manual Steps

### 1. Update Zustand Store (budget.store.ts)

**File:** `src/state/budget.store.ts`

**What to change:**

#### Remove subscription from state persistence

Find the `saveState()` function (around line 300-350):

```typescript
// BEFORE:
function saveState() {
  const snapshot = get();
  storageService.saveState({
    ...snapshot,
    subscription: snapshot.subscription, // ❌ REMOVE THIS
  });
}

// AFTER:
function saveState() {
  const snapshot = get();
  // Extract everything EXCEPT subscription
  const { subscription, ...stateWithoutSubscription } = snapshot;
  storageService.saveState(stateWithoutSubscription);
}
```

#### Remove subscription from `getSnapshot()`

Find the `getSnapshot()` function:

```typescript
// BEFORE:
getSnapshot: () => {
  return {
    ...get(),
    subscription: get().subscription, // ❌ REMOVE THIS LINE
  };
}

// AFTER:
getSnapshot: () => {
  const { subscription, ...stateWithoutSubscription } = get();
  return stateWithoutSubscription;
}
```

#### Keep `setSubscription()` and `subscription` in store state

**IMPORTANT:** Keep subscription in the in-memory store state (for `useSubscription()` hook), but REMOVE it from persistence:

```typescript
// Keep this (in-memory state):
export const useBudgetStore = create<BudgetStore>((set, get) => ({
  // ... other state
  subscription: null, // ✅ Keep this

  setSubscription: (sub: SubscriptionState | null) => {
    set({ subscription: sub });
    // ❌ DO NOT call saveState() here anymore
  },

  // ... other actions
}));
```

---

### 2. Update CloudSyncGate

**File:** `src/shared/components/providers/CloudSyncGate.tsx`

**What to change:**

#### Remove subscription merge logic (lines 434-449)

```typescript
// BEFORE (lines 434-449):
const localSubscription = useBudgetStore.getState().subscription;
const cloudSubscription = cloud.subscription ?? null;
const mergedSubscription =
  (localSubscription?.status === 'active' ? localSubscription : null) ??
  (cloudSubscription?.status === 'active' ? cloudSubscription : null) ??
  localSubscription ??
  cloudSubscription;

console.log("[CloudSyncGate] Applying cloud data to local state:", {
  transactions: cloud.transactions.length,
  categories: cloud.categoryDefinitions.length,
  subscriptionSource: localSubscription?.status === 'active' ? 'local' : cloudSubscription?.status === 'active' ? 'cloud' : 'none',
});
replaceAllData({ ...cloud, subscription: mergedSubscription });

// AFTER:
console.log("[CloudSyncGate] Applying cloud data to local state:", {
  transactions: cloud.transactions.length,
  categories: cloud.categoryDefinitions.length,
});
replaceAllData(cloud); // No subscription merge
```

#### Add subscription fetch after cloud data loads

Add this AFTER `replaceAllData(cloud);`:

```typescript
import { getSubscription } from '@/services/subscription.service';

// ... inside initForSession() after replaceAllData(cloud)
replaceAllData(cloud);

// Fetch subscription separately
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  const subscription = await getSubscription(user.id);
  useBudgetStore.getState().setSubscription(subscription);
  console.log('[CloudSyncGate] Subscription loaded:', subscription);
}
```

---

### 3. Update RevenueCatProvider

**File:** `src/shared/components/providers/RevenueCatProvider.tsx`

**What to add:**

#### Add `Purchases.logIn()` for authenticated users

Find the `useEffect` that calls `configureRevenueCat()` (around line 20-40):

```typescript
import { supabase } from '@/lib/supabase';
import { getSubscription } from '@/services/subscription.service';
import { isNative } from '@/services/revenuecat.service';

useEffect(() => {
  async function initRevenueCat() {
    try {
      // Configure RevenueCat SDK
      await configureRevenueCat();

      // NEW: Link to authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (user && isNative()) {
        const { Purchases } = await import('@revenuecat/purchases-capacitor');
        await Purchases.logIn({ appUserID: user.id });
        console.log('[RevenueCat] Linked to user:', user.id);
      }

      // Fetch subscription using new service
      const subscription = await getSubscription(user?.id || null);
      useBudgetStore.getState().setSubscription(subscription);

    } catch (error) {
      console.error('[RevenueCat] Initialization failed:', error);
    }
  }

  initRevenueCat();
}, []);
```

---

### 4. Add `Purchases.logIn()` to PaywallModal

**File:** Find PaywallModal component (likely in `src/features/paywall/` or similar)

**What to add:**

Before calling `purchasePackage()`:

```typescript
import { supabase } from '@/lib/supabase';
import { isNative } from '@/services/revenuecat.service';

async function handlePurchase(selectedPlan: PricingPlanKey) {
  try {
    setIsLoading(true);

    // Get authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }

    // NEW: Link RevenueCat to user BEFORE purchase
    if (isNative()) {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      await Purchases.logIn({ appUserID: user.id });
      console.log('[PaywallModal] Linked to user:', user.id);
    }

    // Get offerings
    const offerings = await getOfferings();
    const packageToPurchase = offerings.availablePackages.find(
      pkg => pkg.identifier === selectedPlan
    );

    if (!packageToPurchase) {
      throw new Error('Package not found');
    }

    // Execute purchase
    await purchasePackage(packageToPurchase);

    // Refresh subscription
    const { data: { user: refreshedUser } } = await supabase.auth.getUser();
    const subscription = await getSubscription(refreshedUser?.id || null);
    useBudgetStore.getState().setSubscription(subscription);

    // Close modal
    onClose();
  } catch (error) {
    console.error('[PaywallModal] Purchase failed:', error);
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
}
```

---

### 5. Deploy Database Migration

**Run locally:**

```bash
# If using Supabase CLI
npx supabase db reset  # Resets and applies all migrations

# Or push just this migration
npx supabase db push
```

**Or in Supabase Dashboard:**

1. Go to SQL Editor
2. Copy contents of `supabase/migrations/20260131_create_subscription_tables.sql`
3. Paste and run
4. Verify tables created:
   ```sql
   SELECT * FROM user_subscriptions LIMIT 1;
   SELECT * FROM revenuecat_events LIMIT 1;
   ```

---

### 6. Deploy Edge Function

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login
npx supabase login

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy function
npx supabase functions deploy revenuecat-webhook --no-verify-jwt

# Set webhook secret
npx supabase secrets set REVENUECAT_WEBHOOK_SECRET=$(openssl rand -base64 32)

# Verify deployment
curl https://YOUR_PROJECT.supabase.co/functions/v1/revenuecat-webhook \
  -X POST \
  -H "Authorization: Bearer YOUR_SECRET_HERE" \
  -H "Content-Type: application/json" \
  -d '{"event":{"type":"TEST","id":"test-123","app_user_id":"test","app_id":"test","event_timestamp_ms":1234567890,"product_id":"test","entitlement_ids":["pro"],"purchased_at_ms":1234567890,"expiration_at_ms":null,"period_type":"NORMAL","currency":"USD","price":0,"store":"APP_STORE","environment":"SANDBOX","is_family_share":false,"country_code":"US","transaction_id":"test"},"api_version":"1.0"}'

# Expected: {"success":true}
```

---

### 7. Configure RevenueCat Webhook

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Projects → Your Project → Integrations → Webhooks
3. Click **+ New**
4. Fill in:
   - **Name:** SmartSpend Supabase Production
   - **URL:** `https://YOUR_PROJECT.supabase.co/functions/v1/revenuecat-webhook`
   - **Authorization:** `Bearer YOUR_SECRET_HERE` (get from `npx supabase secrets list`)
   - **Events:** Select all (or minimum: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION)
5. Save
6. Send test event → Verify in `revenuecat_events` table

---

### 8. Test End-to-End

#### Test 1: Fresh Install Purchase

```bash
# Delete app from device/simulator
# Reinstall
npm run build
npx cap sync ios
npx cap open ios

# In app:
1. Complete onboarding
2. Login with Google
3. Select "Start Trial"
4. Complete purchase
5. Check Xcode logs for:
   [LoginProScreen] Trial activated
   [RevenueCat] Linked to user: <user-id>

# Check Supabase:
SELECT * FROM user_subscriptions WHERE user_id = 'your-user-id';
# Should show active trial

SELECT * FROM revenuecat_events WHERE user_id = 'your-user-id' ORDER BY created_at DESC;
# Should show INITIAL_PURCHASE event
```

#### Test 2: Cross-Device Restore

```bash
# Device 2: Fresh install
# Login with same account
# Check logs:
[Subscription] Fetching from RevenueCat SDK...
[Subscription] Fetched from RevenueCat: {status: "trialing", ...}

# Verify Pro features work
```

#### Test 3: Webhook Events

```bash
# In RevenueCat Dashboard:
# - Go to Customers → Find your test user
# - Cancel subscription
# - Check Supabase:

SELECT * FROM user_subscriptions WHERE user_id = 'your-user-id';
# status should change to 'cancelled'

SELECT * FROM revenuecat_events WHERE event_type = 'CANCELLATION' ORDER BY created_at DESC LIMIT 1;
# Should show recent CANCELLATION event
```

---

## TypeScript Errors to Fix

After making the above changes, you may see TypeScript errors in files that reference `state.subscription`. Here's how to fix them:

### Error: Property 'subscription' does not exist on type 'BudgetState'

**Files likely affected:**
- `src/services/cloudState.service.ts`
- Any component that tries to access `state.subscription`

**Fix:**
- Remove any code that tries to persist or sync `subscription` in BudgetState
- Use `getSubscription()` from `subscription.service.ts` instead

---

## Environment Variables

Add to your `.env.local` (if testing locally):

```bash
# No new env vars needed for client
# Edge Function uses Supabase secrets (set via CLI)
```

---

## Verification Checklist

After completing all steps:

- [ ] Migration ran successfully (`user_subscriptions` and `revenuecat_events` tables exist)
- [ ] Edge Function deployed (check Supabase Dashboard → Edge Functions)
- [ ] RevenueCat webhook configured and test event sent successfully
- [ ] Zustand store no longer persists subscription to localStorage
- [ ] CloudSyncGate no longer merges subscription from cloud
- [ ] RevenueCatProvider calls `Purchases.logIn()` on startup
- [ ] PaywallModal calls `Purchases.logIn()` before purchase
- [ ] Test purchase flow works end-to-end
- [ ] Test cross-device restore works
- [ ] Test webhook events update Supabase correctly
- [ ] No TypeScript errors in build

---

## Need Help?

1. Check documentation: `docs/inapppurchases/SUBSCRIPTION_ARCHITECTURE.md`
2. Check Edge Function logs: Supabase Dashboard → Edge Functions → revenuecat-webhook → Logs
3. Check RevenueCat webhook logs: RevenueCat Dashboard → Integrations → Webhooks → View Logs
4. Check database: `SELECT * FROM revenuecat_events ORDER BY created_at DESC LIMIT 10;`

---

**Last Updated:** 2026-01-31
