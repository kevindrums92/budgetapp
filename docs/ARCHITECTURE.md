# Architecture - SmartSpend Budget App

This document describes the project architecture and organization principles for the SmartSpend budget tracking app.

## Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Features (Domain-Driven)](#features-domain-driven)
- [Shared Components](#shared-components)
- [Services & State](#services--state)
- [Import Guidelines](#import-guidelines)
- [Adding New Features](#adding-new-features)

---

## Overview

SmartSpend follows a **feature-based architecture** (also known as domain-driven structure), where code is organized by business domain rather than by technical layer. This approach improves:

- **Scalability**: Easy to add new features without affecting existing code
- **Maintainability**: Related code lives together, making it easier to understand and modify
- **Team collaboration**: Different developers can work on different features independently
- **Code splitting**: Easier to implement lazy loading per feature

### Core Principles

1. **Feature isolation**: Each feature is self-contained with its own pages, components, services, and types
2. **Shared resources**: Common components, utilities, and layouts live in `shared/`
3. **Clear boundaries**: Features should not import from other features directly (use shared layer or state)
4. **Explicit exports**: Each feature has an `index.ts` that controls what is exposed publicly

---

## Directory Structure

```
src/
├── app/                          # App-level configuration
│   └── App.tsx                   # Main app component with routing
│
├── features/                     # Business domains (features)
│   ├── transactions/             # Transaction management
│   ├── categories/               # Category & group management
│   ├── budget/                   # Budget limits & tracking
│   ├── trips/                    # Travel expense tracking
│   ├── backup/                   # Data backup & restore
│   ├── profile/                  # User profile & settings
│   └── stats/                    # Analytics & statistics
│
├── shared/                       # Shared/reusable code
│   ├── components/               # Shared UI components
│   │   ├── layout/               # Layout components (TopHeader, BottomBar, PageHeader)
│   │   ├── modals/               # Modal dialogs (ConfirmDialog, DatePicker)
│   │   ├── navigation/           # Navigation components (MonthNavigator, MonthSelector)
│   │   ├── ui/                   # UI primitives (LogoMark, SplashScreen, FabAdd)
│   │   └── providers/            # App-wide providers (CloudSyncGate, WelcomeGate)
│   ├── hooks/                    # Shared React hooks
│   └── utils/                    # Shared utility functions
│
├── services/                     # Global services
│   ├── storage.service.ts        # localStorage persistence
│   ├── cloudState.service.ts     # Supabase cloud sync
│   ├── pendingSync.service.ts    # Offline sync queue
│   └── dates.service.ts          # Date utilities
│
├── state/                        # State management (Zustand)
│   └── budget.store.ts           # Global Zustand store
│
├── constants/                    # App constants
│   ├── categories/               # Category-related constants
│   │   ├── default-categories.ts
│   │   ├── category-colors.ts
│   │   └── category-icons.ts
│   └── category-groups/          # Category group constants
│       └── default-category-groups.ts
│
├── types/                        # Shared TypeScript types
│   ├── budget.types.ts           # Core type definitions
│   ├── ads.types.ts              # Ad monetization types
│   └── notifications.ts          # Push notification types
│
├── lib/                          # Third-party lib configuration
│   └── supabaseClient.ts         # Supabase client setup
│
├── styles/                       # Global styles
├── assets/                       # Static assets
└── test/                         # Test utilities
```

---

## Features (Domain-Driven)

Each feature follows this internal structure:

```
features/{feature-name}/
├── pages/                # Route pages for this feature
├── components/           # Feature-specific components (NOT reused elsewhere)
├── services/             # Feature-specific business logic
├── hooks/                # Feature-specific React hooks
├── utils/                # Feature-specific utility functions
├── types/                # Feature-specific TypeScript types
└── index.ts              # Public API exports
```

### Feature: Transactions

**Purpose**: Manage income and expenses

**Files**:
- **Pages**: `HomePage`, `AddEditTransactionPage`
- **Components**: `TransactionList`, `TransactionItem`, `AddTransactionModal`, `AddActionSheet`, `RecurringBanner`, `RecurringModal`, `BalanceCard`, `HeaderBalance`
- **Services**: `recurringTransactions.service.ts`
- **Utils**: `transactions.utils.ts` (e.g., `formatCOP()`)

**Routes**:
- `/` → HomePage
- `/add` → AddEditTransactionPage (create)
- `/edit/:id` → AddEditTransactionPage (edit)

---

### Feature: Batch Entry

**Purpose**: AI-powered batch transaction entry (text, voice, receipt scan)

**Files**:
- **Components**: `BatchEntrySheet`, `InputTypeSelector`, `VoiceRecorder`, `ImageCaptureView`, `TextInputArea`, `TransactionPreview`, `TransactionDraftCard`, `AudioWaveform`
- **Services**: `batchEntry.service.ts`, `audioCapture.service.ts`, `imageCapture.service.ts`
- **Hooks**: `useFakeProgress.ts`
- **Types**: `batch-entry.types.ts`
- **Tests**: `batchEntry.service.test.ts` (15 tests), `useFakeProgress.test.ts` (10 tests), `TransactionPreview.test.tsx` (17 tests) - 42 total

**Integration**:
- Triggered from AddActionSheet via "Agregar varias" button
- Uses Supabase Edge Function (`parse-batch`) with Gemini 2.5 Flash for parsing
- Supports voice (Whisper transcription), image (receipt OCR), and text input
- Rate limiting: 5 requests/day for free users, 50/day for Pro users

**Features**:
- **Input Modes**:
  - Text: Free-form natural language (e.g., "Gasté 50 mil en almuerzo y 20 en taxi")
  - Voice: Audio recording with real-time waveform visualization and transcription via Whisper API
  - Image: Camera/gallery receipt scan with OCR and AI extraction
- **Smart Parsing**:
  - AI-powered extraction of transaction details (name, amount, category, date)
  - Category mapping with fallback system for custom categories
  - Confidence scoring and needs-review flags
  - Handles Colombian peso format (e.g., "50 mil" → 50,000)
- **Review & Edit**:
  - Inline editing: tap to edit name, category, amount, or date
  - Visual validation warnings for missing data
  - Totals summary (income/expense) with live updates
  - Bulk save or individual deletion
- **Testing**:
  - Comprehensive unit tests (42 tests) with 100% coverage
  - Mocks for Supabase, i18next, react-router-dom
  - Tests for authentication, API parsing, rate limiting, timeouts, animations

**Routes**: N/A (modal-based, no dedicated routes)

**i18n**: Complete support in 4 languages (es, en, fr, pt) via `i18n/locales/{lang}/batch.json`

---

### Feature: Categories

**Purpose**: Manage expense/income categories and groups

**Files**:
- **Pages**: `CategoriesPage`, `CategoryGroupsPage`, `AddEditCategoryPage`, `AddEditCategoryGroupPage`, `CategoryMonthDetailPage`
- **Components**: `CategoryInput`, `CategoryPickerDrawer`, `IconColorPicker`, `SetLimitModal`

**Routes**:
- `/categories` → CategoriesPage
- `/category/:id/edit` → AddEditCategoryPage
- `/category/:categoryId/month/:month` → CategoryMonthDetailPage
- `/category-groups` → CategoryGroupsPage
- `/category-group/:id/edit` → AddEditCategoryGroupPage

---

### Feature: Budget

**Purpose**: Set and track monthly budget limits per category

**Files**:
- **Pages**: `BudgetPage`
- **Components**: `BudgetOnboardingWizard`

**Routes**:
- `/budget` → BudgetPage (accessed via bottom bar)

---

### Feature: Trips

**Purpose**: Track travel expenses separately

**Files**:
- **Pages**: `TripsPage`, `TripDetailPage`, `AddEditTripPage`, `AddEditTripExpensePage`

**Routes**:
- `/trips` → TripsPage
- `/trip/:id` → TripDetailPage
- `/trip/:id/edit` → AddEditTripPage
- `/trip/:tripId/expense/:expenseId/edit` → AddEditTripExpensePage

---

### Feature: Backup

**Purpose**: Export, import, and manage backups (local & cloud)

**Files**:
- **Pages**: `BackupPage`
- **Components**: `BackupExportButton`, `BackupImportButton`, `BackupMethodSelector`, `BackupScheduler`, `CloudBackupScheduler`, `BackupPreviewModal`, `LocalBackupList`, `CloudBackupList`
- **Services**: `backup.service.ts`, `cloudBackup.service.ts`
- **Types**: `backup.types.ts`

**Routes**:
- `/backup` → BackupPage

---

### Feature: Profile

**Purpose**: User profile, authentication, and settings

**Files**:
- **Pages**: `ProfilePage`, `NotificationSettingsPage`

**Routes**:
- `/profile` → ProfilePage
- `/settings/notifications` → NotificationSettingsPage

---

### Feature: Notifications

**Purpose**: Push notification preferences and management

**Files**:
- **Pages**: `NotificationSettingsPage`
- **Services**: `pushNotification.service.ts`
- **Types**: `notifications.ts`
- **Utils**: `timezone.ts` (shared/utils)

**Routes**:
- `/settings/notifications` → NotificationSettingsPage

**Features**:
- Push notification permissions (iOS/Android native)
- Notification preferences: scheduled transactions, daily reminder, daily summary, quiet hours
- Timezone conversion utilities (local ↔ UTC)
- FCM token management and refresh
- Supabase Edge Functions for sending notifications

---

### Feature: Onboarding

**Purpose**: First-time user onboarding and configuration

**Files**:
- **Pages**: `WelcomePage`, `LoginScreen`, `AuthPage`, `OTPVerificationPage`
- **Components**: `OnboardingGate`, `OnboardingContext`, `ConfigFlow`
- **Screens**:
  - Welcome Flow (6 screens)
  - Login Flow (LoginScreen, AuthPage)
  - First Config Flow (6 screens):
    1. Language selection
    2. Theme selection
    3. Currency selection
    4. Category selection
    5. **Push notification opt-in** (native + authenticated users only)
    6. Completion
- **Utils**: `onboarding.helpers.ts`, `onboarding.constants.ts`

**Routes**:
- `/onboarding/welcome/:step` → Welcome screens
- `/onboarding/login` → Login screen
- `/onboarding/auth` → Email/phone auth
- `/onboarding/config/:step` → First config screens

**Features**:
- Welcome flow with 6 intro screens
- Login with Google OAuth, Email, or Phone
- Guest mode (local-only)
- First Config wizard (language, theme, currency, categories, push notifications)
- Push notification onboarding at step 5 (auto-skip for web/guest users)
- Progress persistence and resumption
- Multi-user bug fix: always checks cloud data first to detect new vs returning users
- Cloud data detection for seamless returning user experience

---

### Feature: Stats

**Purpose**: Data visualization and analytics

**Files**:
- **Pages**: `StatsPage`

**Routes**:
- `/stats` → StatsPage (accessed via bottom bar)

---

### Feature: Theme

**Purpose**: Theme management (light/dark/system)

**Files**:
- **Components**: `ThemeProvider`
- **Hooks**: `useTheme`
- **Pages**: `ThemeSettingsPage`

**Routes**:
- `/settings/theme` → ThemeSettingsPage

**Features**:
- Three theme modes: light, dark, system
- Anti-flicker script in index.html
- Persistence in localStorage
- Dark mode support across all components

---

### Feature: Currency

**Purpose**: Multi-currency support (50+ currencies)

**Files**:
- **Components**: `CurrencyProvider`, `CurrencySelector`
- **Hooks**: `useCurrency`
- **Pages**: `CurrencySettingsPage`
- **Utils**: `currency.utils.ts`

**Routes**:
- `/settings/currency` → CurrencySettingsPage

**Features**:
- 50+ currencies organized by region
- Auto-detection based on timezone/locale
- Search by name or code
- Format amounts with `formatAmount()`
- Persistence in localStorage

---

### Feature: Biometric

**Purpose**: Biometric authentication (Face ID/Touch ID/Fingerprint)

**Files**:
- **Components**: `BiometricGate`
- **Services**: `biometric.service.ts`

**Features**:
- Face ID / Touch ID / Fingerprint support
- Lock screen overlay
- Authentication triggers (cold start, app resume after 5min)
- Only for authenticated users on native platforms
- Cloud sync of biometric preference
- iOS Face ID usage description in Info.plist

---

## Shared Components

Components in `src/shared/components/` are reusable across multiple features.

### Layout (`shared/components/layout/`)

- **TopHeader**: Global header with logo, cloud status, month selector
- **BottomBar**: Bottom navigation bar (Home, Budget, Stats, Trips)
- **PageHeader**: Page header with back button and optional right actions

### Shared Utils (`shared/utils/`)

- **timezone.ts**: Timezone conversion utilities (local ↔ UTC) for notification times
  - `convertLocalToUTC(timeLocal: string): string` - Convert local time (HH:MM) to UTC
  - `convertUTCToLocal(timeUTC: string): string` - Convert UTC time to local for display

### Modals (`shared/components/modals/`)

- **ConfirmDialog**: Generic confirmation modal
- **DatePicker**: Custom date picker (replaces native `<input type="date">`)

### Navigation (`shared/components/navigation/`)

- **MonthNavigator**: Month forward/back navigation
- **MonthSelector**: Month picker with calendar

### UI (`shared/components/ui/`)

- **LogoMark**: App logo SVG
- **SplashScreen**: Loading splash screen
- **CloudStatusMini**: Cloud sync status indicator
- **FabAdd**: Floating action button
- **RowMenu**: Context menu for list items

### Providers (`shared/components/providers/`)

- **CloudSyncGate**: Wrapper for automatic cloud sync
- **RevenueCatProvider**: Subscription management and Pro status
- **AdMobProvider**: Ad monetization initialization (free users only)
- **OnboardingGate**: First-time user onboarding
- **BiometricGate**: Biometric authentication for app lock

---

## Services & State

### Global Services (`src/services/`)

Services that operate across features:

- **storage.service.ts**: Persist and load state from `localStorage`
  - Schema versioning: v1 → v8 with automatic migrations
  - v1→v2: String categories to objects
  - v2→v3: Category groups addition
  - v3→v4: isRecurring field
  - v4→v5: Scheduled transactions (sourceTemplateId)
  - v5→v6: Budget system
  - v6→v7: Biometric security settings
  - v7→v8: Subscription moved to RevenueCat (removed from BudgetState)
- **cloudState.service.ts**: Sync state to Supabase cloud
  - Data loss prevention with empty snapshot detection
  - Sync lock to prevent race conditions
  - Offline-first architecture with pending sync queue
- **pendingSync.service.ts**: Queue for offline sync operations
  - Critical for data loss prevention (20 tests)
  - Validates empty snapshots vs snapshots with data
- **dates.service.ts**: Date formatting and utilities (e.g., `todayISO()`, `formatDateGroupHeader()`)
- **ads.service.ts**: AdMob ad monetization (free users only)
  - Interstitial ad frequency control (max 1 ad/3min, max 5/session)
  - Session management with localStorage persistence
  - Action-based tracking system
  - Platform detection (iOS/Android)
  - Ad preloading strategy
- **pushNotification.service.ts**: Push notification management
  - Permission requests (iOS/Android native)
  - FCM token registration and refresh
  - Notification preferences (scheduled transactions, daily reminder, daily summary, quiet hours)
  - Integration with Supabase push_tokens table

### State Management (`src/state/`)

The app uses **Zustand** for global state management.

**Store**: `budget.store.ts`

**State slices**:
- Transactions: `transactions`, `addTransaction()`, `updateTransaction()`, `deleteTransaction()`
- Categories: `categoryDefinitions`, `addCategory()`, `updateCategory()`, `deleteCategory()`
- Category Groups: `categoryGroups`, `addCategoryGroup()`, `updateCategoryGroup()`, `deleteCategoryGroup()`
- Trips: `trips`, `tripExpenses`
- Budgets: `budgets`, `addBudget()`, `updateBudget()`, `deleteBudget()`, `renewExpiredBudgets()`
- UI: `selectedMonth`, `setSelectedMonth()`
- Cloud Sync: `cloudMode`, `cloudStatus`, `user`, `lastSyncAt`
- Settings: `excludedFromStats`, `budgetOnboardingSeen`
- Security: `biometricEnabled`

**Schema Version**: v8

**Persistence**: Automatically synced to `localStorage` on every mutation via `saveState()`.

---

## Import Guidelines

### Import Paths

Use TypeScript path aliases configured in `vite.config.ts`:

```typescript
// ✅ CORRECT
import { HomePage, TransactionList } from "@/features/transactions";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { formatCOP } from "@/shared/utils/currency.utils";
import { useBudgetStore } from "@/state/budget.store";
import { todayISO } from "@/services/dates.service";

// ❌ INCORRECT - Do not use relative paths for cross-feature imports
import HomePage from "../../features/transactions/pages/HomePage";
import PageHeader from "../../../shared/components/layout/PageHeader";
```

### Feature Boundaries

**Rule**: Features should NOT import from other features directly.

**Why**: Prevents circular dependencies and tight coupling.

**Solution**: Use the shared layer or global state.

```typescript
// ❌ BAD - Direct feature-to-feature import
import { CategoryInput } from "@/features/categories/components/CategoryInput";

// ✅ GOOD - Import from feature's public API
import { CategoryInput } from "@/features/categories";

// ✅ GOOD - Or use shared components if it's truly reusable
// (In this case, CategoryInput is feature-specific, so first option is correct)
```

### Index Exports

Each feature has an `index.ts` that controls what is exposed publicly:

```typescript
// src/features/transactions/index.ts
export { default as HomePage } from "./pages/HomePage";
export { default as TransactionList } from "./components/TransactionList";
export * from "./utils/transactions.utils";
```

**Importing from a feature**:

```typescript
import { HomePage, TransactionList, formatCOP } from "@/features/transactions";
```

---

## Adding New Features

To add a new feature to the app:

### 1. Create Feature Directory

```bash
mkdir -p src/features/{feature-name}/{pages,components,services,hooks,utils,types}
```

### 2. Add Files

Create your pages, components, services, etc. inside the feature directory.

### 3. Create Public API (`index.ts`)

```typescript
// src/features/{feature-name}/index.ts
export { default as FeaturePage } from "./pages/FeaturePage";
export { default as FeatureComponent } from "./components/FeatureComponent";
export * from "./utils/feature.utils";
```

### 4. Update Routes

Add routes in `src/App.tsx`:

```typescript
import { FeaturePage } from "@/features/{feature-name}";

// In router config:
<Route path="/feature" element={<FeaturePage />} />
```

### 5. Add to State (if needed)

If the feature needs global state, add a slice to `src/state/budget.store.ts`:

```typescript
interface BudgetState {
  // ... existing state
  featureData: FeatureData[];
  addFeatureItem: (item: FeatureData) => void;
}
```

### 6. Create Services (if needed)

If the feature has business logic, create a service in `src/features/{feature-name}/services/`.

### 7. Update CLAUDE.md (if applicable)

Add any feature-specific patterns or guidelines to `CLAUDE.md`.

---

## Best Practices

### Component Placement

**Ask**: Is this component reused across multiple features?

- **Yes** → Place in `src/shared/components/`
- **No** → Place in `src/features/{feature}/components/`

### Service Placement

**Ask**: Does this service operate across multiple features?

- **Yes** → Place in `src/services/`
- **No** → Place in `src/features/{feature}/services/`

### Type Placement

**Ask**: Is this type shared across features?

- **Yes** → Place in `src/types/`
- **No** → Place in `src/features/{feature}/types/`

### Constants Placement

- **Domain-specific** (categories, trips): `src/constants/{domain}/`
- **App-wide** (colors, breakpoints): `src/constants/`

---

## Migration History

**Date**: 2026-01-19
**PR**: #XXX (to be added)

**Changes**:
- Migrated from flat structure (`src/components/`, `src/pages/`) to feature-based structure
- Moved 35 components to `src/features/` or `src/shared/`
- Moved 13 pages to `src/features/{feature}/pages/`
- Reorganized constants into `src/constants/categories/` and `src/constants/category-groups/`
- Created `index.ts` exports for all features
- Updated all imports across ~50 files

**Benefits**:
- Improved code discoverability (related code lives together)
- Easier onboarding for new developers
- Better scalability for future features
- Clearer separation of concerns

---

## Future Improvements

### Code Splitting

With the feature-based structure, we can easily implement lazy loading:

```typescript
const HomePage = lazy(() => import("@/features/transactions/pages/HomePage"));
const BudgetPage = lazy(() => import("@/features/budget/pages/BudgetPage"));
```

### State Splitting

The Zustand store could be split into feature slices:

```typescript
// src/state/slices/transactionSlice.ts
export const createTransactionSlice = (set) => ({
  transactions: [],
  addTransaction: (tx) => set((state) => ({ transactions: [...state.transactions, tx] })),
});

// src/state/budget.store.ts
const useBudgetStore = create((set) => ({
  ...createTransactionSlice(set),
  ...createCategorySlice(set),
  ...createTripSlice(set),
}));
```

### Testing Structure

With features isolated, we can add co-located tests:

```
features/transactions/
├── components/
│   ├── TransactionList.tsx
│   └── __tests__/
│       └── TransactionList.test.tsx
```

---

## Questions?

For questions about the architecture or how to implement a new feature, refer to:

- This document (ARCHITECTURE.md)
- CLAUDE.md for UI/UX patterns
- Code examples in existing features

---

**Last updated**: 2026-02-04

## Recent Updates (v0.14.5)

**Date**: 2026-02-04

**Changes**:
- **Batch Entry Feature**: AI-powered batch transaction entry system
  - Three input modes: text, voice (Whisper), and image (receipt scan OCR)
  - Gemini 2.5 Flash integration via Supabase Edge Function
  - Smart category mapping with fallback system for custom categories
  - Inline editing of transaction drafts with validation
  - Rate limiting: 5/day free, 50/day Pro
  - 42 comprehensive unit tests with 100% coverage
- Refactored duplicate utilities to use existing services
  - Use `todayISO()` from `dates.service.ts` (not custom date functions)
  - Use `getNetworkStatus()` from `network.service.ts` (not custom hooks)
- Fixed test command to exit after completion (`vitest run`)
- Updated 556 total tests passing

**Benefits**:
- Faster transaction entry with AI assistance
- Support for voice and receipt scanning
- Better code maintainability with shared utilities
- CI/CD compatible test command

## Previous Updates (v0.14.4)

**Date**: 2026-02-02

**Changes**:
- Added RevenueCat integration for Pro subscription management
- Implemented AdMob ad monetization for free users
  - Intelligent frequency control with session management
  - Platform-specific configuration (iOS/Android)
  - Action-based tracking system
- Enhanced cloud sync with data loss prevention
  - Empty snapshot detection (20 critical tests)
  - Improved offline UX (12 tests)
- Schema migration v7→v8: Subscription moved to RevenueCat
- Added biometric authentication feature (Face ID/Touch ID/Fingerprint)
- Updated 514 total tests passing

**Benefits**:
- Monetization strategy for free tier users
- Robust data integrity and loss prevention
- Better offline experience with session handling
- Cross-platform subscription management
