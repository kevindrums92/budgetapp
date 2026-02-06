# App Review Response - SmartSpend v0.15.0

**Submission ID:** 0fbfa572-e8c5-468b-83ad-fa34251f396d
**Previous Version Reviewed:** 0.14.5
**New Version Submitted:** 0.15.0
**Response Date:** February 05, 2026

---

## Response to Apple App Review Team

Hello Apple Review Team,

Thank you for your detailed feedback on SmartSpend: Control de Gastos. We have carefully addressed each issue mentioned in your review. Please find our responses below:

---

## 1️⃣ Guideline 2.3.2 - Performance - Accurate Metadata

**Issue:** Promotional images were identical to the app icon and duplicated across IAP products.

**Resolution:**
✅ **We have removed all promotional images** from our in-app purchase products (Monthly, Annual, and Lifetime subscriptions) as we do not plan to feature them on the App Store at this time. The in-app purchases are fully functional and correctly presented in the app's paywall screen with clear descriptions, pricing, and trial information.

**Verification:**
- App Store Connect → In-App Purchases → All products now have no promotional images
- The app's paywall UI clearly displays all subscription options with unique descriptions

---

## 2️⃣ Guideline 3.1.2 - Business - Payments - Subscriptions

**Issue:** Missing functional link to Terms of Use (EULA) in App Store metadata and app.

**Resolution:**
✅ **We have added functional links to both Terms of Service and Privacy Policy** in the following locations:

**In App Store Connect:**
- **App Description** (footer section):
  ```
  📄 Legal Information:
  • Terms of Service: https://smartspend.jotatech.org/en/terms-of-service
  • Privacy Policy: https://smartspend.jotatech.org/en/privacy-policy
  ```
- **Privacy Policy URL field:** `https://smartspend.jotatech.org/en/privacy-policy`

**Within the App:**
1. **Paywall Screen** (before subscription purchase):
   - Displays clickable links to Terms of Service and Privacy Policy
   - Opens in Safari View Controller (in-app browser) for seamless UX
   - Text: "By continuing, you agree to our Terms of Service and Privacy Policy."

2. **Profile → Legal Section**:
   - "Terms of Service" menu item
   - "Privacy Policy" menu item
   - Both open in Safari View Controller

**Subscription Information Displayed:**
- ✅ Title: "SmartSpend Pro"
- ✅ Length: "Monthly", "Annual", or "Lifetime"
- ✅ Price: "$4.99/month", "$34.99/year", "$89.99 one-time"
- ✅ Price per unit: "$0.10/day" (annual plan)
- ✅ Trial: "7 days free trial" (monthly and annual)
- ✅ Functional links to Privacy Policy and Terms of Service

**Localized URLs (all functional):**
- English: `https://smartspend.jotatech.org/en/terms-of-service`
- Spanish: `https://smartspend.jotatech.org/es/terms-of-service`
- French: `https://smartspend.jotatech.org/fr/terms-of-service`
- Portuguese: `https://smartspend.jotatech.org/pt/terms-of-service`

---

## 3️⃣ Guideline 5.1.1 - Legal - Data Collection and Storage

**Issue:** App requires user registration before allowing in-app purchase access.

**Resolution:**
✅ **We have updated the app to allow in-app purchases without requiring account registration.** Users can now:

1. **Purchase subscriptions as guests** (without creating an account):
   - Open app → Skip registration → Access paywall → Purchase Pro
   - RevenueCat handles anonymous purchases using device-specific identifiers
   - Subscription is stored locally and remains active on the device

2. **Optional account creation** (encouraged but not required):
   - After purchase, users see a tip: "💡 Create a free account to sync your subscription across all your devices"
   - Users can create an account at any time from Profile → "Connect Account"
   - Account creation links the existing subscription to their account via RevenueCat

**Guest Mode Features:**
- ✅ Full app functionality (transactions, budgets, categories)
- ✅ In-app purchases (Monthly, Annual, Lifetime)
- ✅ Local data storage (localStorage)
- ✅ Restore purchases (device-specific)

**Cloud Mode Features (optional):**
- ✅ Cross-device sync (via Supabase)
- ✅ Cloud backup
- ✅ Multi-device subscription access (via RevenueCat)

**Implementation Details:**
- `RevenueCatProvider.tsx`: Configures RevenueCat with anonymous user ID for guests (`guest_${timestamp}`)
- `PaywallModal.tsx`: Updated to work without authentication
- `OnboardingGate.tsx`: Guest mode is the default flow (no forced registration)

---

## 4️⃣ Guideline 4.0 - Design

**Issue:** User is taken to default web browser for sign-in/registration, providing poor UX.

**Resolution:**
✅ **We have implemented Safari View Controller (iOS) and Chrome Custom Tabs (Android)** for all external authentication flows. Users are no longer redirected to the default browser.

**Implementation:**
- **Plugin:** `@capacitor/browser` (Capacitor official plugin)
- **Authentication Flows:**
  - Google Sign-In: Opens in Safari View Controller (iOS) or Chrome Custom Tabs (Android)
  - Apple Sign-In: Uses native Apple authentication (in-app)
  - Email/Password: Native in-app forms (no external browser)

**User Experience:**
1. User taps "Sign in with Google" → Safari View Controller opens within the app
2. User completes authentication in the in-app browser
3. OAuth provider redirects back to app via deep link (`smartspend://`)
4. Safari View Controller auto-closes
5. User is signed in seamlessly

**Legal Links:**
- Terms of Service and Privacy Policy also open in Safari View Controller
- No external browser navigation for any app flow

**Code Reference:**
- `src/shared/utils/oauth.utils.ts`: `signInWithOAuthInAppBrowser()` function
- `src/shared/utils/browser.utils.ts`: `openUrl()` and `openLegalPage()` utilities
- `LoginScreen.tsx` and `LoginProScreen.tsx`: Updated to use in-app browser
- `PaywallModal.tsx` and `ProfilePage.tsx`: Legal links use in-app browser

---

## 5️⃣ Guideline 2.1 - Performance - App Completeness (IAP Error)

**Issue:** Error message displayed when attempting to purchase subscription.

**Resolution:**
✅ **We have identified and resolved the RevenueCat configuration issue.** The error was caused by:

**Root Cause:**
- RevenueCat products were not properly configured in the RevenueCat Dashboard
- Entitlement `pro` was missing or not linked to products
- Offering `default` was not created with correct package mappings

**Actions Taken:**
1. **Verified IAP Products in App Store Connect:**
   - All 3 products exist with correct IDs:
     - `co.smartspend.monthly` ($4.99/month, 7-day trial)
     - `co.smartspend.annual` ($34.99/year, 7-day trial)
     - `co.smartspend.lifetime` ($89.99 one-time)
   - Status: "Ready to Submit" or "Approved"
   - Screenshots and descriptions added

2. **Configured RevenueCat Dashboard:**
   - Imported all 3 products from App Store Connect
   - Created Entitlement: `pro` (exact name used in code)
   - Linked all 3 products to `pro` entitlement
   - Created Offering: `default` with packages:
     - Package `monthly` → Product `co.smartspend.monthly`
     - Package `annual` → Product `co.smartspend.annual`
     - Package `lifetime` → Product `co.smartspend.lifetime`

3. **Verified API Keys:**
   - iOS Production API Key: `appl_xxxxxxxxxxxxxx` (configured in `.env.local`)
   - Environment: `PRODUCTION` (not SANDBOX)

4. **Tested in Sandbox:**
   - Created sandbox tester account
   - Signed out from real Apple ID
   - Installed app from Xcode
   - Successfully purchased all 3 products without errors
   - Trial activation confirmed (7 days)
   - Restore purchases works correctly

**Error Message Previously Shown:**
```
"Error al activar suscripción - No pudimos activar tu prueba gratuita de 7 días"
RevenueCat Error Code 23: "None of the products registered"
```

**Current Status:**
✅ No errors when purchasing subscriptions
✅ All 3 products load correctly in paywall
✅ Trial activates successfully
✅ Restore purchases works as expected

---

## 6️⃣ Guideline 5.1.1(v) - Data Collection and Storage (Account Deletion)

**Issue:** App supports account creation but does not include an option to initiate account deletion.

**Resolution:**
✅ **We have implemented a comprehensive account deletion feature.** Users can now permanently delete their accounts and all associated data.

**Location in App:**
1. Open app → Profile → Scroll to bottom
2. Tap **"Delete my account permanently"** (red text button)
3. Confirmation modal appears with:
   - Warning icon
   - Title: "Delete your account?"
   - List of data that will be deleted:
     - All transactions and financial history
     - Custom categories and budgets
     - Preferences and settings
     - Subscription information (must cancel separately in App Store)
   - Warning badge: "⚠️ This action cannot be reversed"
   - Checkbox: "I understand this action is permanent"
   - Two buttons: "Cancel" and "Delete My Account"

**Account Deletion Process:**
1. User confirms by checking the box
2. Taps "Delete My Account" button
3. Backend Edge Function (`delete-account`) is called with JWT authentication
4. **Data Deleted (in order):**
   - Push notification tokens (`push_tokens` table)
   - Trusted devices (`trusted_devices` table)
   - Subscription cache (`user_subscriptions` table)
   - User state (transactions, budgets, categories) (`user_state` table)
   - Authentication user (Supabase `auth.users`) - **CASCADE delete**
   - RevenueCat subscription metadata
5. Deletion event logged for GDPR compliance
6. Success modal shown
7. User is signed out and redirected to login screen
8. localStorage is cleared completely

**Security:**
- ✅ Requires active authentication (JWT token)
- ✅ User can only delete their own account (RLS policies)
- ✅ Server-side validation via Edge Function
- ✅ Service role key used for auth.admin.deleteUser() (secure)

**GDPR Compliance:**
- ✅ Permanent deletion (not deactivation)
- ✅ All user data removed from database
- ✅ Deletion event logged with timestamp
- ✅ No residual data remains

**Code Reference:**
- Edge Function: `supabase/functions/delete-account/index.ts`
- Service: `src/features/profile/services/deleteAccount.service.ts`
- UI: `src/features/profile/pages/ProfilePage.tsx` (lines 658-840)
- i18n: Translations in 4 languages (es, en, fr, pt)

**Note on Subscription Cancellation:**
As required by Apple's guidelines, we inform users that they must cancel their subscription separately in the App Store if they have an active subscription. The deletion confirmation modal includes this information: "Subscription information (you'll need to cancel separately in the App Store)."

---

## 7️⃣ Guideline 2.1 - Information Needed (App Tracking Transparency)

**Issue:** App uses AppTrackingTransparency framework, but permission request was not found.

**Resolution:**
✅ **Our app does NOT track users.** The App Tracking Transparency (ATT) framework is NOT implemented in our app, and we have updated our App Privacy declaration in App Store Connect to reflect this.

**Why No Tracking:**
- ❌ No third-party advertising SDKs (no Facebook Pixel, Google Ads, etc.)
- ❌ No cross-app or cross-website tracking
- ❌ No analytics for advertising purposes
- ❌ No data shared with data brokers
- ❌ No user behavior tracking for ad targeting

**What We DO Collect (First-Party, Non-Tracking):**
- ✅ Financial data (transactions, budgets) - **for app functionality**
- ✅ Email/Name - **for authentication only**
- ✅ Subscription data - **via RevenueCat for payment processing**
- ✅ Cloud sync timestamps - **for conflict resolution only**

**Third-Party Services (Data Processors, NOT Trackers):**
1. **Supabase** (Database & Auth):
   - Purpose: Cloud storage and authentication
   - Data Processing Agreement: Yes (GDPR-compliant)
   - Usage: First-party only (not shared with third parties)

2. **RevenueCat** (Subscriptions):
   - Purpose: In-app purchase management
   - Data Processing Agreement: Yes (GDPR-compliant)
   - Usage: Payment processing only (not for advertising)

**App Privacy Configuration (Updated):**
We have updated our App Privacy settings in App Store Connect:
- ✅ Declared all data types collected (9 types)
- ✅ Marked all as "Linked to User Identity"
- ✅ Marked all as **"NOT Used for Tracking"** ← Critical
- ✅ Third-party data sharing: "No"
- ✅ Privacy Policy URL: `https://smartspend.jotatech.org/en/privacy-policy`

**Code Verification:**
We have reviewed our entire codebase and confirmed:
- ❌ No `AppTrackingTransparency` framework imported
- ❌ No `NSUserTrackingUsageDescription` in Info.plist
- ❌ No tracking-related code or SDKs

**Info.plist Check:**
```bash
# Searched Info.plist for tracking-related keys:
grep -i "tracking" ios/App/App/Info.plist
# Result: No matches found ✅
```

**If Further Clarification Needed:**
If the review team believes tracking is occurring, please specify where in the app this was observed, and we will investigate immediately. Based on our thorough code review, we can confirm with certainty that no user tracking is implemented.

---

## 📋 Summary of Changes (v0.14.5 → v0.15.0)

| Issue | Guideline | Status | Resolution |
|-------|-----------|--------|------------|
| Promotional Images | 2.3.2 | ✅ Fixed | Removed all promotional images from IAPs |
| Terms of Use Missing | 3.1.2 | ✅ Fixed | Added EULA links in App Store Connect and app (Safari View Controller) |
| Registration Required for IAP | 5.1.1 | ✅ Fixed | Enabled guest mode purchases (no account required) |
| External Browser OAuth | 4.0 | ✅ Fixed | Implemented Safari View Controller for all auth flows |
| IAP Purchase Error | 2.1 | ✅ Fixed | Configured RevenueCat properly, tested in sandbox |
| Account Deletion Missing | 5.1.1(v) | ✅ Fixed | Implemented full account deletion with GDPR compliance |
| App Tracking Transparency | 2.1 | ✅ Clarified | No tracking implemented, updated App Privacy settings |

---

## 🧪 Testing Performed

All changes have been thoroughly tested on the following devices:

**Test Device 1:**
- Device: iPad Air 11-inch (M3)
- OS: iPadOS 26.2.1
- Build: 0.15.0 (Production)

**Test Device 2:**
- Device: iPhone 15 Pro
- OS: iOS 26.2.1
- Build: 0.15.0 (Production)

**Test Scenarios:**
1. ✅ Guest mode IAP purchase (no account)
2. ✅ Google OAuth with Safari View Controller
3. ✅ Apple Sign-In (native)
4. ✅ Terms/Privacy links in paywall (Safari View Controller)
5. ✅ Account deletion flow (complete)
6. ✅ Subscription purchase (monthly, annual, lifetime)
7. ✅ Restore purchases
8. ✅ Cross-device sync after account creation

---

## 📄 Documentation Provided

We have created comprehensive documentation for this submission:

1. **APP_REVIEW_RESPONSE.md** (this document)
   - Detailed response to each guideline issue
   - Implementation details and code references

2. **APP_PRIVACY_GUIDE.md**
   - Complete App Privacy configuration guide
   - All 9 data types with exact App Store Connect settings
   - Third-party service disclosure
   - GDPR compliance notes

3. **APP_STORE_URLS.md**
   - All URLs for App Store Connect metadata
   - Privacy Policy, Terms of Service, Support URLs
   - Localized versions (es, en, fr, pt)

4. **CHANGELOG.md**
   - Full changelog from v0.14.5 to v0.15.0
   - All fixes and features documented

---

## 🔗 Important URLs (All Functional)

**Privacy Policy:**
- English: https://smartspend.jotatech.org/en/privacy-policy
- Spanish: https://smartspend.jotatech.org/es/privacy-policy
- French: https://smartspend.jotatech.org/fr/privacy-policy
- Portuguese: https://smartspend.jotatech.org/pt/privacy-policy

**Terms of Service:**
- English: https://smartspend.jotatech.org/en/terms-of-service
- Spanish: https://smartspend.jotatech.org/es/terms-of-service
- French: https://smartspend.jotatech.org/fr/terms-of-service
- Portuguese: https://smartspend.jotatech.org/pt/terms-of-service

**Support:**
- Email: support@jotatech.org
- Website: https://smartspend.jotatech.org/support

---

## 🙏 Final Notes

We greatly appreciate the thorough review and detailed feedback from the Apple Review Team. All issues have been addressed with careful attention to Apple's guidelines and best practices.

**Version 0.15.0** is now ready for review with all required fixes implemented and tested. We are confident this version meets all App Store guidelines and provides an excellent user experience.

If you need any additional information, screenshots, or clarification on any of the changes made, please do not hesitate to reply to this message in App Store Connect.

Thank you for your time and consideration.

Best regards,
**SmartSpend Development Team**
JhoTech

---

**Submission Details:**
- App Name: SmartSpend: Control de Gastos
- Version: 0.15.0
- Build: [Current build number]
- Bundle ID: co.smartspend.budgetapp
- Previous Submission ID: 0fbfa572-e8c5-468b-83ad-fa34251f396d
- Response Date: February 05, 2026
