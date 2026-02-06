# App Privacy - Apple App Store Connect Configuration

**App:** SmartSpend (Budget Tracker)
**Version:** 0.15.0+
**Last Updated:** 2026-02-05
**Purpose:** Complete guide to configure App Privacy settings in App Store Connect

---

## 📋 Overview

This document provides the **exact configuration** needed for App Store Connect → App Privacy section. Apple requires all apps to disclose what user data is collected, how it's used, and whether it's shared with third parties.

### Key Principles

✅ **We collect:** Email, Name, Financial Info, Purchase History, User ID
✅ **We use it for:** App functionality, cloud sync, account management
❌ **We do NOT track:** No advertising, no analytics, no cross-app tracking
❌ **We do NOT sell data:** Data is never shared with data brokers

---

## 🔐 Data Collection Summary

### Data Types Collected

| Data Type | Collected? | Purpose | Linked to User? | Used for Tracking? |
|-----------|-----------|---------|-----------------|-------------------|
| **Contact Info** | ✅ Yes | Auth & Account | ✅ Yes | ❌ No |
| - Email Address | ✅ Yes | Sign-in, notifications | ✅ Yes | ❌ No |
| - Name | ✅ Yes | Account personalization | ✅ Yes | ❌ No |
| - Phone Number | ⚠️ Optional | Alternative sign-in | ✅ Yes | ❌ No |
| **Financial Info** | ✅ Yes | App functionality | ✅ Yes | ❌ No |
| - Purchase History | ✅ Yes | RevenueCat subscriptions | ✅ Yes | ❌ No |
| - Payment Info | ❌ No | Handled by Apple/RevenueCat | - | - |
| - Other Financial Info | ✅ Yes | User's transactions/budgets | ✅ Yes | ❌ No |
| **Identifiers** | ✅ Yes | App functionality | ✅ Yes | ❌ No |
| - User ID | ✅ Yes | Cloud sync, RLS security | ✅ Yes | ❌ No |
| - Device ID | ✅ Yes | Push notifications, trusted devices | ✅ Yes | ❌ No |
| **Usage Data** | ⚠️ Minimal | App functionality | ✅ Yes | ❌ No |
| - Product Interaction | ✅ Yes | Cloud sync timestamps | ✅ Yes | ❌ No |
| **User Content** | ✅ Yes | App functionality | ✅ Yes | ❌ No |
| - Other User Content | ✅ Yes | Categories, notes, trip details | ✅ Yes | ❌ No |

### Data We DO NOT Collect

❌ Location
❌ Health & Fitness
❌ Photos or Videos (only OAuth profile pictures)
❌ Browsing History
❌ Search History
❌ Contacts
❌ Sensitive Info (race, religion, sexual orientation, etc.)
❌ Diagnostics (crash logs sent to Apple automatically)

---

## 🛠️ Step-by-Step Configuration in App Store Connect

### Step 1: Access App Privacy Section

1. Go to **App Store Connect** → Your App → **App Privacy**
2. Click **Get Started** (if first time) or **Edit** (if updating)

### Step 2: Data Collection - Answer Questions

#### Question 1: "Does your app collect data from users?"

**Answer:** ✅ **Yes**

---

### Step 3: Select Data Types Collected

You'll need to add **5 data types**. Click **Add Data Type** for each:

---

#### Data Type 1: Contact Info → Email Address

**Configuration:**

1. **How is this data collected?**
   - ✅ Collected from the app

2. **Is the Email Address linked to the user's identity?**
   - ✅ Yes

3. **Do you or your third-party partners use Email Address for tracking purposes?**
   - ❌ No

4. **For what purposes do you use Email Address?**
   - ✅ App Functionality
   - ✅ Other Purposes → **Account Management**

5. **Description (if "Other Purposes" selected):**
   ```
   Email is used for account authentication (sign-in with email/password or OAuth) and optional cloud backup notifications.
   ```

---

#### Data Type 2: Contact Info → Name

**Configuration:**

1. **How is this data collected?**
   - ✅ Collected from the app

2. **Is the Name linked to the user's identity?**
   - ✅ Yes

3. **Do you or your third-party partners use Name for tracking purposes?**
   - ❌ No

4. **For what purposes do you use Name?**
   - ✅ App Functionality

5. **Description:**
   ```
   Name (full name) is collected during account creation or via OAuth providers (Google, Apple) for account personalization.
   ```

---

#### Data Type 3: Contact Info → Phone Number

**Configuration:**

1. **How is this data collected?**
   - ✅ Collected from the app

2. **Is the Phone Number linked to the user's identity?**
   - ✅ Yes

3. **Do you or your third-party partners use Phone Number for tracking purposes?**
   - ❌ No

4. **For what purposes do you use Phone Number?**
   - ✅ App Functionality

5. **Description:**
   ```
   Phone number is an optional sign-in method. Users can choose to authenticate with phone + password instead of email.
   ```

---

#### Data Type 4: Financial Info → Purchase History

**Configuration:**

1. **How is this data collected?**
   - ✅ Collected from the app

2. **Is the Purchase History linked to the user's identity?**
   - ✅ Yes

3. **Do you or your third-party partners use Purchase History for tracking purposes?**
   - ❌ No

4. **For what purposes do you use Purchase History?**
   - ✅ App Functionality

5. **Description:**
   ```
   Purchase history (subscription status, product IDs, transaction IDs) is collected via RevenueCat to manage Pro subscriptions and unlock premium features.
   ```

---

#### Data Type 5: Financial Info → Other Financial Info

**Configuration:**

1. **How is this data collected?**
   - ✅ Collected from the app

2. **Is the Other Financial Info linked to the user's identity?**
   - ✅ Yes

3. **Do you or your third-party partners use Other Financial Info for tracking purposes?**
   - ❌ No

4. **For what purposes do you use Other Financial Info?**
   - ✅ App Functionality

5. **Description:**
   ```
   Financial data includes user-created transactions (income/expenses), budgets, categories, and trip expenses. This is the core functionality of the app. Data is stored locally (guest mode) or synced to Supabase (cloud mode) with Row Level Security (RLS).
   ```

---

#### Data Type 6: Identifiers → User ID

**Configuration:**

1. **How is this data collected?**
   - ✅ Collected from the app

2. **Is the User ID linked to the user's identity?**
   - ✅ Yes

3. **Do you or your third-party partners use User ID for tracking purposes?**
   - ❌ No

4. **For what purposes do you use User ID?**
   - ✅ App Functionality

5. **Description:**
   ```
   User ID (Supabase auth.uid) is used for cloud sync, Row Level Security (RLS) policies, and linking data to user accounts. It ensures users can only access their own data.
   ```

---

#### Data Type 7: Identifiers → Device ID

**Configuration:**

1. **How is this data collected?**
   - ✅ Collected from the app

2. **Is the Device ID linked to the user's identity?**
   - ✅ Yes

3. **Do you or your third-party partners use Device ID for tracking purposes?**
   - ❌ No

4. **For what purposes do you use Device ID?**
   - ✅ App Functionality

5. **Description:**
   ```
   Device ID is used for push notification tokens and trusted device management. This allows users to receive budget reminders and manage which devices can access their account.
   ```

---

#### Data Type 8: Usage Data → Product Interaction

**Configuration:**

1. **How is this data collected?**
   - ✅ Collected from the app

2. **Is the Product Interaction linked to the user's identity?**
   - ✅ Yes

3. **Do you or your third-party partners use Product Interaction for tracking purposes?**
   - ❌ No

4. **For what purposes do you use Product Interaction?**
   - ✅ App Functionality

5. **Description:**
   ```
   We only collect timestamps of when user state is updated (for cloud sync conflict resolution). No analytics, no user behavior tracking, no third-party analytics tools.
   ```

---

#### Data Type 9: User Content → Other User Content

**Configuration:**

1. **How is this data collected?**
   - ✅ Collected from the app

2. **Is the Other User Content linked to the user's identity?**
   - ✅ Yes

3. **Do you or your third-party partners use Other User Content for tracking purposes?**
   - ❌ No

4. **For what purposes do you use Other User Content?**
   - ✅ App Functionality

5. **Description:**
   ```
   User content includes custom category names, transaction notes, trip details, and budget labels. This content is created by users and stored for app functionality.
   ```

---

### Step 4: Data Sharing with Third Parties

#### Question: "Do you or your third-party partners collect data from this app to use for their own purposes?"

**Answer:** ❌ **No**

**Explanation:**
- **Supabase:** Only processes data on our behalf (data processor, not controller). Subject to DPA.
- **RevenueCat:** Only processes subscription data for payment processing. Subject to DPA.
- **Google/Apple OAuth:** Only provides authentication, we don't share user data back to them.

---

### Step 5: Privacy Policy URL

**Question:** "Does your app have a privacy policy?"

**Answer:** ✅ **Yes**

**Privacy Policy URL:**
```
https://smartspend.jotatech.org/en/privacy-policy
```

**Localized URLs:**
- 🇪🇸 Spanish: `https://smartspend.jotatech.org/es/privacy-policy`
- 🇺🇸 English: `https://smartspend.jotatech.org/en/privacy-policy`
- 🇫🇷 French: `https://smartspend.jotatech.org/fr/privacy-policy`
- 🇵🇹 Portuguese: `https://smartspend.jotatech.org/pt/privacy-policy`

---

## ✅ Verification Checklist

Before submitting to App Review:

- [ ] All 9 data types configured in App Privacy
- [ ] Privacy Policy URL added and functional (no 404)
- [ ] Privacy Policy accessible in-app (PaywallModal, ProfilePage) ✅ Already implemented
- [ ] Terms of Service accessible in-app ✅ Already implemented
- [ ] Account deletion implemented ✅ Already implemented (ISSUE #6)
- [ ] No tracking selected for any data type
- [ ] All descriptions match actual app behavior
- [ ] Data types marked as "Linked to User Identity"
- [ ] Third-party data sharing set to "No"

---

## 🔍 Common Review Issues

### Issue: "Privacy Policy not accessible in app"

**Solution:** ✅ Already fixed
- PaywallModal shows Terms & Privacy links with in-app browser
- ProfilePage → Legal section shows Terms & Privacy links
- Uses `openLegalPage()` utility for in-app browser (Safari View Controller on iOS)

### Issue: "App Tracking Transparency (ATT) permission missing"

**Solution:** ✅ Not required
- We do NOT track users for advertising or analytics
- ATT is only required if you track users across apps/websites for ads
- Our usage is purely first-party (app functionality)

### Issue: "Data not matching app behavior"

**Solution:** ✅ Verified
- All data types listed match actual code implementation
- See `src/features/auth/`, `src/services/cloudState.service.ts`, `supabase/migrations/`

---

## 📝 Third-Party Services Disclosure

### Supabase (Database & Auth)

- **Purpose:** Cloud storage and authentication
- **Data Shared:** Email, Name, User ID, Financial Data (transactions/budgets)
- **Privacy Policy:** https://supabase.com/privacy
- **Data Processing Agreement:** Yes (GDPR-compliant)
- **Data Residency:** US (can be configured to EU if needed)

### RevenueCat (Subscriptions)

- **Purpose:** In-app purchase management
- **Data Shared:** User ID, Purchase History, Subscription Status
- **Privacy Policy:** https://www.revenuecat.com/privacy
- **Data Processing Agreement:** Yes (GDPR-compliant)
- **Notes:** RevenueCat only processes subscription data, does not track users

### Google OAuth (Optional)

- **Purpose:** Sign-in with Google
- **Data Shared:** Email, Name, Profile Picture
- **Privacy Policy:** https://policies.google.com/privacy
- **Notes:** Only used if user chooses "Sign in with Google"

### Apple Sign-In (Optional)

- **Purpose:** Sign-in with Apple
- **Data Shared:** Email (or relay), Name (optional)
- **Privacy Policy:** https://www.apple.com/legal/privacy/
- **Notes:** Only used if user chooses "Sign in with Apple"

---

## 🚀 Next Steps

1. ✅ Review this guide
2. ⏳ Go to App Store Connect → App Privacy → Edit
3. ⏳ Configure all 9 data types as documented above
4. ⏳ Add Privacy Policy URL
5. ⏳ Save changes
6. ⏳ Verify everything looks correct
7. ⏳ Submit app for review

---

## 📞 Support

If Apple rejects due to privacy issues:
- Review this guide again
- Check that Privacy Policy URL is accessible
- Verify in-app links to Terms & Privacy work (tested in PaywallModal)
- Check that Account Deletion is visible in ProfilePage (ISSUE #6 ✅)

---

## 📚 Related Documents

- [APP_STORE_URLS.md](./APP_STORE_URLS.md) - All URLs for App Store Connect
- [APP_REVIEW_FIXES.md](./APP_REVIEW_FIXES.md) - App Review fixes history
- [docs/SECURITY_AUDIT.md](./docs/SECURITY_AUDIT.md) - Security audit and RLS policies
- [CLAUDE.md](./CLAUDE.md) - Development guidelines (in-app browser, OAuth, etc.)

---

## 🎯 Apple Guidelines Compliance

- ✅ **Guideline 5.1.1** - Privacy Policy accessible ✅
- ✅ **Guideline 5.1.1** - Account Deletion implemented ✅
- ✅ **Guideline 5.1.2** - App Privacy disclosures accurate
- ✅ **Guideline 2.1** - No tracking (ATT not required)
- ✅ **Guideline 4.0** - In-app browser for legal links ✅

---

**Last Updated:** 2026-02-05
**Status:** ✅ Ready for App Store Connect configuration
