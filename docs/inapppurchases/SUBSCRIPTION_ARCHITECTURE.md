# Subscription Architecture v2.0 - Hybrid System

**Status:** ✅ Implemented
**Date:** 2026-01-31
**Author:** Claude + JhoTech

---

## Table of Contents

- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [Database Schema](#database-schema)
- [Data Flow](#data-flow)
- [Implementation Details](#implementation-details)
- [Deployment Guide](#deployment-guide)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Migration from v1.0](#migration-from-v10)

---

## Overview

### What Changed?

**v1.0 (Old):**
- Subscription stored in `user_state.state.subscription` (mixed with budget data)
- CloudSyncGate merged subscriptions from 3 sources (RevenueCat, cloud, local)
- Complex merge logic prone to bugs
- No server-side subscription updates
- No audit trail

**v2.0 (New - Hybrid):**
- Subscription stored in separate `user_subscriptions` table
- Updated ONLY by RevenueCat webhooks (server-side, reliable)
- Client reads with fallback strategy: RevenueCat SDK → Supabase → LocalStorage
- Clean separation of concerns
- Full audit trail via `revenuecat_events` table
- Web support via Supabase cache

###Why Hybrid?

1. **Single Source of Truth:** RevenueCat is authoritative, webhooks keep Supabase in sync
2. **Cross-Device Sync:** User logs in on new device → fetches from Supabase → has Pro status
3. **Offline Support:** LocalStorage caches last known state
4. **Web Support:** Web reads from Supabase (RevenueCat SDK doesn't work on web)
5. **Real-Time Updates:** Webhooks update Supabase when user cancels, renews, or has billing issues

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     PURCHASE FLOW (Mobile)                       │
└─────────────────────────────────────────────────────────────────┘

User taps "Start Trial"
    ↓
LoginProScreen calls Purchases.logIn(user.id)   ← Links RevenueCat to user
    ↓
purchasePackage() → RevenueCat SDK → App Store/Play Store
    ↓
Purchase completes → customerInfo returned
    ↓
syncWithRevenueCat() → Updates localStorage
    ↓
RevenueCat sends INITIAL_PURCHASE webhook → Edge Function
    ↓
Edge Function writes to user_subscriptions table
    ↓
✅ Subscription active


┌─────────────────────────────────────────────────────────────────┐
│                   SUBSCRIPTION CHECK (Any Device)                │
└─────────────────────────────────────────────────────────────────┘

App starts
    ↓
RevenueCatProvider calls Purchases.logIn(user.id)  ← If authenticated
    ↓
getSubscription(userId) called
    ↓
┌─ Try 1: RevenueCat SDK ─────────────────┐
│ - Only on native (iOS/Android)          │
│ - Requires internet                      │
│ - Most up-to-date                        │
│ - Returns immediately if available       │
└──────────────────────────────────────────┘
    ↓ (if fails or web)
┌─ Try 2: Supabase ───────────────────────┐
│ - Fetches from user_subscriptions table │
│ - Works on web + mobile                  │
│ - Updated by webhooks                    │
│ - Requires authenticated user            │
└──────────────────────────────────────────┘
    ↓ (if fails or offline)
┌─ Try 3: LocalStorage ───────────────────┐
│ - Last cached state                      │
│ - Works offline                          │
│ - May be stale                           │
└──────────────────────────────────────────┘
    ↓
useBudgetStore.setSubscription(result)
    ↓
✅ Subscription loaded


┌─────────────────────────────────────────────────────────────────┐
│                  WEBHOOK FLOW (Server-Side)                      │
└─────────────────────────────────────────────────────────────────┘

User cancels subscription in App Store
    ↓
App Store notifies RevenueCat
    ↓
RevenueCat sends CANCELLATION webhook
    ↓
POST https://your-project.supabase.co/functions/v1/revenuecat-webhook
    ↓
Edge Function verifies Authorization header
    ↓
Check revenuecat_events for duplicate event_id (idempotency)
    ↓
handleCancellation() updates user_subscriptions
    ↓
Insert into revenuecat_events (audit log)
    ↓
Return HTTP 200
    ↓
✅ Supabase reflects cancellation

Next time user opens app:
    ↓
getSubscription() fetches from Supabase → status: "cancelled"
    ↓
User sees downgraded to free tier
```

---

## Database Schema

### Table: `user_subscriptions`

Stores current subscription state for each user. Updated ONLY by RevenueCat webhooks.

```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,                  -- Supabase auth.users.id

  -- Product info
  product_id TEXT NOT NULL,                       -- e.g., 'co.smartspend.monthly'
  entitlement_ids TEXT[] DEFAULT ARRAY['pro'],   -- Features unlocked
  original_transaction_id TEXT,                  -- Store transaction ID

  -- Status
  status TEXT NOT NULL DEFAULT 'active',         -- active | trial | expired | cancelled
  period_type TEXT NOT NULL DEFAULT 'normal',    -- normal | trial

  -- Timing
  purchased_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,                        -- NULL for lifetime
  billing_issue_detected_at TIMESTAMPTZ,

  -- Metadata
  environment TEXT NOT NULL DEFAULT 'PRODUCTION', -- PRODUCTION | SANDBOX
  last_event_id TEXT,                            -- Last webhook event processed

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
```

**Row Level Security:**
- Users can READ their own subscription
- Only service role (webhooks) can WRITE

### Table: `revenuecat_events`

Audit log of all webhook events. Used for debugging, idempotency, and compliance.

```sql
CREATE TABLE revenuecat_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,                 -- RevenueCat event ID
  event_type TEXT NOT NULL,                      -- INITIAL_PURCHASE, RENEWAL, etc.
  user_id TEXT NOT NULL,
  payload JSONB NOT NULL,                        -- Full webhook payload
  error TEXT,                                    -- Error if processing failed
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_revenuecat_events_event_id ON revenuecat_events(event_id);
CREATE INDEX idx_revenuecat_events_user_id ON revenuecat_events(user_id);
```

**Row Level Security:**
- Users can READ their own events
- Only service role can WRITE

### Helper Function: `has_active_subscription()`

```sql
CREATE FUNCTION has_active_subscription(p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT status, expires_at
  INTO v_status, v_expires_at
  FROM user_subscriptions
  WHERE user_id = p_user_id;

  IF v_status IS NULL THEN RETURN FALSE; END IF;

  -- Lifetime (no expiration)
  IF v_status = 'active' AND v_expires_at IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Active or trial and not expired
  IF (v_status = 'active' OR v_status = 'trial')
     AND (v_expires_at IS NULL OR v_expires_at > now()) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;
```

---

## Data Flow

### 1. Purchase Flow (Onboarding)

**File:** `src/features/onboarding/phases/LoginFlow/LoginProScreen.tsx`

```typescript
// Step 1: OAuth login
const { user } = await supabase.auth.getUser();

// Step 2: Link RevenueCat to user (CRITICAL!)
const { Purchases } = await import('@revenuecat/purchases-capacitor');
await Purchases.logIn({ appUserID: user.id });

// Step 3: Purchase
const offerings = await getOfferings();
const packageToPurchase = offerings.availablePackages.find(...);
const purchaseResult = await purchasePackage(packageToPurchase);

// Step 4: Sync local state
await syncWithRevenueCat();

// Step 5: Webhook updates Supabase (async, in background)
// RevenueCat → Edge Function → user_subscriptions table
```

### 2. App Startup (Existing User)

**File:** `src/shared/components/providers/RevenueCatProvider.tsx`

```typescript
useEffect(() => {
  async function init() {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    // Link RevenueCat to user if authenticated
    if (user) {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      await Purchases.logIn({ appUserID: user.id });
    }

    // Fetch subscription
    const subscription = await getSubscription(user?.id);
    useBudgetStore.getState().setSubscription(subscription);
  }

  init();
}, []);
```

### 3. Subscription Fetch (subscription.service.ts)

```typescript
export async function getSubscription(userId: string | null) {
  // Try 1: RevenueCat SDK (native only, most fresh)
  const rcSub = await fetchFromRevenueCat();
  if (rcSub) {
    saveSubscriptionToLocalStorage(rcSub);
    return rcSub;
  }

  // Try 2: Supabase (web/mobile, updated by webhooks)
  if (userId) {
    const dbSub = await fetchFromSupabase(userId);
    if (dbSub) {
      saveSubscriptionToLocalStorage(dbSub);
      return dbSub;
    }
  }

  // Try 3: LocalStorage (offline fallback)
  const cached = loadSubscriptionFromLocalStorage();
  if (cached) return cached;

  // Free tier
  return null;
}
```

### 4. Webhook Processing

**File:** `supabase/functions/revenuecat-webhook/index.ts`

```typescript
// 1. Verify Authorization header
if (authHeader !== `Bearer ${secret}`) return 401;

// 2. Check idempotency (prevent duplicate processing)
const existing = await supabase
  .from('revenuecat_events')
  .select('id')
  .eq('event_id', payload.event.id)
  .single();

if (existing) return { cached: true };

// 3. Route to handler
switch (payload.event.type) {
  case 'INITIAL_PURCHASE':
    await handleInitialPurchase(payload.event);
    break;
  case 'RENEWAL':
    await handleRenewal(payload.event);
    break;
  case 'CANCELLATION':
    await handleCancellation(payload.event);
    break;
  // ... other events
}

// 4. Log event (audit trail)
await supabase.from('revenuecat_events').insert({
  event_id: payload.event.id,
  event_type: payload.event.type,
  user_id: payload.event.app_user_id,
  payload,
});

return { success: true };
```

---

## Implementation Details

### Key Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260131_create_subscription_tables.sql` | Creates `user_subscriptions` and `revenuecat_events` tables |
| `supabase/functions/revenuecat-webhook/index.ts` | Edge Function that handles RevenueCat webhooks |
| `src/services/subscription.service.ts` | Fetches subscription with 3-tier fallback strategy |
| `src/services/revenuecat.service.ts` | RevenueCat SDK wrapper (unchanged) |
| `src/state/budget.store.ts` | Zustand store (subscription still in memory, not in state persistence) |
| `src/hooks/useSubscription.ts` | Hook for reading subscription and feature gates |

### Critical Changes from v1.0

1. **BudgetState type** (`src/types/budget.types.ts`)
   - ❌ REMOVED: `subscription?: SubscriptionState | null`
   - Subscription is NO LONGER part of the persisted state

2. **CloudSyncGate** (`src/shared/components/providers/CloudSyncGate.tsx`)
   - ❌ REMOVED: Subscription merge logic
   - `upsertCloudState()` no longer includes subscription
   - `getCloudState()` doesn't return subscription

3. **RevenueCatProvider**
   - ✅ ADDED: `Purchases.logIn(user.id)` on app startup
   - Links RevenueCat to authenticated user

4. **PaywallModal** (future improvement)
   - ✅ ADDED: `Purchases.logIn(user.id)` before purchase
   - Ensures purchase is associated with user

### Environment Variables

Add to Supabase project settings:

```bash
# Supabase Edge Function secrets
REVENUECAT_WEBHOOK_SECRET=your-32-character-random-secret-here
```

Generate secret:
```bash
openssl rand -base64 32
```

---

## Deployment Guide

### 1. Run Database Migration

```bash
# From project root
npx supabase db push

# Or via Supabase dashboard
# Copy contents of migrations/20260131_create_subscription_tables.sql
# Paste into SQL Editor → Run
```

### 2. Deploy Edge Function

```bash
# Deploy to Supabase
npx supabase functions deploy revenuecat-webhook --no-verify-jwt

# Set secret
npx supabase secrets set REVENUECAT_WEBHOOK_SECRET=your-secret-here
```

### 3. Configure RevenueCat Webhook

1. Go to RevenueCat Dashboard → Projects → Your Project
2. Navigate to **Integrations** → **Webhooks**
3. Click **+ New**
4. Configure:
   - **Name:** SmartSpend Supabase
   - **URL:** `https://YOUR_PROJECT.supabase.co/functions/v1/revenuecat-webhook`
   - **Authorization Header:** `Bearer your-secret-here` (same as REVENUECAT_WEBHOOK_SECRET)
   - **Events:** Select all (or at minimum: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION)
5. Click **Add**
6. Click **Send Test Event** → Check `revenuecat_events` table for success

### 4. Update Client Code

#### Add `Purchases.logIn()` to RevenueCatProvider

**File:** `src/shared/components/providers/RevenueCatProvider.tsx`

```typescript
useEffect(() => {
  async function initRevenueCat() {
    await configureRevenueCat(); // Existing call

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
  }

  initRevenueCat();
}, []);
```

#### Add `Purchases.logIn()` to PaywallModal

**File:** `src/features/paywall/components/PaywallModal.tsx`

Before calling `purchasePackage()`:

```typescript
async function handlePurchase(plan: PricingPlanKey) {
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Link RevenueCat to user BEFORE purchase
  if (isNative()) {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    await Purchases.logIn({ appUserID: user.id });
  }

  // Now purchase
  await purchasePackage(selectedPackage);
}
```

#### Update CloudSyncGate

**File:** `src/shared/components/providers/CloudSyncGate.tsx`

Remove subscription merge logic:

```typescript
// OLD CODE (REMOVE):
const currentSubscription = useBudgetStore.getState().subscription;
replaceAllData({ ...cloud, subscription: currentSubscription });

// NEW CODE:
replaceAllData(cloud); // Just apply cloud data, no subscription
```

### 5. Deploy Client App

```bash
npm run build
npx cap sync
```

### 6. Test End-to-End

See [Testing](#testing) section below.

---

## Testing

### 1. Test Webhook (RevenueCat Dashboard)

1. Go to RevenueCat Dashboard → Integrations → Webhooks
2. Select your webhook
3. Click **Send Test Event**
4. Expected: HTTP 200 response
5. Verify in Supabase:
   ```sql
   SELECT * FROM revenuecat_events ORDER BY created_at DESC LIMIT 1;
   -- Should show TEST event
   ```

### 2. Test Purchase Flow (iOS Simulator)

**Prerequisites:**
- StoreKit Configuration File configured
- Products added to StoreKit file

**Steps:**
1. Fresh app install (delete app, reinstall)
2. Complete onboarding → OAuth login
3. Select "Start Trial" plan
4. Complete purchase in StoreKit modal
5. Check logs for:
   ```
   [LoginProScreen] Trial activated: {...}
   [RevenueCat] Linked to user: <user-id>
   ```
6. Check Supabase:
   ```sql
   SELECT * FROM user_subscriptions WHERE user_id = 'your-user-id';
   -- Should show active trial subscription
   ```

### 3. Test Cross-Device Sync

**Device 1 (Purchase):**
1. Login → Purchase trial
2. Verify subscription active

**Device 2 (Restore):**
1. Login with same account
2. Check logs:
   ```
   [Subscription] Fetching from RevenueCat SDK...
   [Subscription] Fetched from RevenueCat: {status: "trialing", ...}
   ```
3. Verify Pro features unlocked

**Web (Supabase Fallback):**
1. Login on web browser
2. Check logs:
   ```
   [Subscription] Skipping RevenueCat on web
   [Subscription] Fetching from Supabase...
   [Subscription] Fetched from Supabase: {status: "trialing", ...}
   ```
3. Verify Pro features unlocked

### 4. Test Offline Mode

1. Enable airplane mode
2. Restart app
3. Check logs:
   ```
   [Subscription] Failed to fetch from RevenueCat: offline
   [Subscription] Failed to fetch from Supabase: offline
   [Subscription] Using cached subscription from localStorage
   ```
4. Verify Pro features still work (from cache)

### 5. Test Webhook Events

**Simulate cancellation:**
1. In RevenueCat dashboard → Customers → Find user
2. Click subscription → **Cancel**
3. RevenueCat sends CANCELLATION webhook
4. Check Supabase:
   ```sql
   SELECT * FROM user_subscriptions WHERE user_id = 'user-id';
   -- status should be 'cancelled'

   SELECT * FROM revenuecat_events
   WHERE user_id = 'user-id'
   ORDER BY created_at DESC LIMIT 1;
   -- Should show CANCELLATION event
   ```
5. Restart app → verify user sees free tier

---

## Troubleshooting

### Webhook Not Receiving Events

**Check 1: Verify URL**
```bash
curl https://YOUR_PROJECT.supabase.co/functions/v1/revenuecat-webhook \
  -X POST \
  -H "Authorization: Bearer your-secret-here" \
  -H "Content-Type: application/json" \
  -d '{"event":{"type":"TEST","id":"test-123","app_user_id":"test"},"api_version":"1.0"}'

# Expected: {"success":true}
```

**Check 2: Verify Authorization Secret**
- RevenueCat webhook config must match REVENUECAT_WEBHOOK_SECRET
- Check Supabase Edge Function logs for "Unauthorized" errors

**Check 3: Check RevenueCat Webhook Logs**
- RevenueCat Dashboard → Integrations → Webhooks → View Logs
- Look for failed requests (4xx, 5xx responses)

### Subscription Not Syncing

**Check 1: Is `Purchases.logIn()` called?**
```typescript
// Search logs for:
[RevenueCat] Linked to user: <user-id>
```

**Check 2: Check RevenueCat CustomerInfo**
```typescript
const customerInfo = await getCustomerInfo();
console.log('Active entitlements:', customerInfo.entitlements);
```

**Check 3: Check Supabase subscription**
```sql
SELECT * FROM user_subscriptions WHERE user_id = 'your-user-id';
```

**Check 4: Check localStorage**
```javascript
localStorage.getItem('subscription');
```

### Duplicate Event Processing

**Symptom:** Same event processed multiple times

**Cause:** `event_id` not unique in `revenuecat_events` table

**Fix:** Check for duplicate inserts:
```sql
SELECT event_id, COUNT(*)
FROM revenuecat_events
GROUP BY event_id
HAVING COUNT(*) > 1;
```

### User Logged Out Loses Subscription

**Expected Behavior:** Subscription cleared on logout

**Fix:** On login, subscription is refetched from RevenueCat/Supabase

---

## Migration from v1.0

### Breaking Changes

1. **`BudgetState` no longer includes `subscription` field**
   - Old code: `state.subscription`
   - New code: `getSubscription(userId)`

2. **CloudSyncGate no longer syncs subscription**
   - Subscription is fetched separately via `subscription.service.ts`

3. **Zustand store `setSubscription()` now only affects in-memory state**
   - Does NOT persist to `user_state` table

### Migration Steps

1. Run migration SQL (creates new tables)
2. Deploy Edge Function
3. Configure RevenueCat webhook
4. Update client code (RevenueCatProvider, PaywallModal, CloudSyncGate)
5. Test on staging environment
6. Deploy to production
7. Monitor `revenuecat_events` table for incoming webhooks

### Data Migration

**No data migration needed** because:
- Existing subscriptions in `user_state.state.subscription` will continue to work (read from localStorage cache)
- First webhook event will create entry in `user_subscriptions` table
- Next app restart will fetch from new table

### Rollback Plan

If issues arise:

1. Revert client code changes
2. Keep `user_subscriptions` table (doesn't hurt to have it)
3. Re-add `subscription` field to `BudgetState` type
4. Re-add merge logic to CloudSyncGate
5. Disable RevenueCat webhook in dashboard

---

## Future Enhancements

### 1. Server-Side Feature Gates

Validate Pro features on Edge Functions:

```typescript
// supabase/functions/export-data/index.ts
const userId = await getUserIdFromAuth(req);
const hasPro = await has_active_subscription(userId);

if (!hasPro) {
  return new Response('Pro subscription required', { status: 403 });
}

// Proceed with export...
```

### 2. Push Notifications on Subscription Events

**Webhook sends notification when:**
- Trial ending soon (24 hours before)
- Billing issue detected
- Subscription cancelled
- Subscription renewed

**Implementation:**
```typescript
// In webhook handler
if (event.type === 'BILLING_ISSUE') {
  await sendPushNotification(user_id, {
    title: 'Billing Issue',
    body: 'Please update your payment method',
  });
}
```

### 3. Subscription History Table

Track all subscription changes:

```sql
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  from_product_id TEXT,
  to_product_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4. Admin Dashboard

View subscription metrics:
- Total active subscriptions
- Trial conversion rate
- Churn rate
- Revenue by plan

---

## References

- [RevenueCat Webhooks Documentation](https://www.revenuecat.com/docs/integrations/webhooks)
- [RevenueCat Event Types](https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Product IDs](../../src/constants/pricing.ts)

---

## Support

**Questions?** Check:
1. This documentation
2. RevenueCat logs (Dashboard → Customers → Search by user ID)
3. Supabase logs (Dashboard → Edge Functions → revenuecat-webhook → Logs)
4. `revenuecat_events` table for webhook history

**Found a bug?** Create an issue with:
- User ID
- Event ID (from `revenuecat_events`)
- Expected vs actual behavior
- Logs from RevenueCat Provider

---

**Last Updated:** 2026-01-31
**Version:** 2.0.0
