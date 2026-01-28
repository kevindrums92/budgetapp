# Changelog

All notable changes to SmartSpend will be documented in this file.



## [unreleased] - {relase date}

### Added
- **OAuth Error Handling**: Add retry modal when Google login fails instead of infinite loading
  - Display error modal with "Reintentar" button when OAuth callback fails (network errors, session errors, missing code)
  - Custom event system (`oauth-error`) for communication between deep link handler (main.tsx) and LoginScreen
  - Detects retryable errors (AuthRetryableFetchError, status 0) and shows retry option
  - User can now recover from OAuth failures without closing/reopening the app
- **Onboarding Design Guidelines**: Add comprehensive fullscreen wizard pattern documentation to CLAUDE.md
  - Complete layout rules for h-dvh with flex-1 overflow-y-auto scrollable content
  - Fixed button positioning pattern (shrink-0 flex child, never position absolute)
  - SlideAnimation and ProgressDots component integration examples
  - Safe area inset handling for iOS notch/home indicator
- **Budget System Refactor (Plan)**: Complete redesign of budget system with two types of plans
  - **Spending Limits**: Set maximum spending caps for categories (groceries, restaurants, entertainment)
  - **Savings Goals**: Set savings targets for categories (investments, emergency fund, projects)
  - **Active/Completed Tabs**: Filter plans by status with health check banners showing exceeded limits and goals progress
  - **Completion Summaries**: Detailed results when plans end (limit respected/exceeded, goal achieved/not achieved with amounts)
  - **Smart Metrics**: Daily suggestions, days remaining, average daily spending/saving calculations
  - **Auto-Renewal**: Expired budgets automatically renew on app load (triggered in CloudSyncGate)
  - **Read-Only State**: Completed budgets cannot be edited, only viewed or deleted with special confirmation
  - **Redesigned Onboarding**: 4-screen wizard explaining plan types, tabs system, history analysis, and smart alerts
  - **Budget Detail Page**: New dedicated page per budget with contextual metrics, activity list, and status-based UI
  - Renamed routes: `/budget` → `/plan`, `/budget/:id` → `/plan/:id`
  - Full i18n translations (es, en, fr, pt) for all new features and onboarding content
  - Comprehensive FEATURES.md documentation update with complete system architecture

### Added
- **Dark Mode - Category Groups**: Complete dark mode support for category groups CRUD pages
  - CategoryGroupsPage: dark variants for tabs, cards, empty states, and all interactive elements
  - AddEditCategoryGroupPage: dark mode for form inputs, color picker modal, delete confirmation modal, and buttons
  - Fixed expense tab contrast in dark mode (now uses light background when active)
  - Fixed input transparency to inherit card background color
  - Disabled button state properly styled for dark mode
- **Automatic Keyboard Dismiss**: Keyboard now closes automatically when scrolling or touching outside input fields
  - New `useKeyboardDismiss` hook applied to all pages and modals with text inputs
  - Provides native mobile app UX: dismiss on scroll (500ms delay after focus) or touch outside
  - Preserves input focus when switching between fields without closing keyboard
  - Applied to 14 components: transaction forms, auth forms, search fields, modals, and settings pages
  - Full documentation added to CLAUDE.md for future implementations
- **Budget Management**: Added delete button to budget edit modal for easier budget removal

### Fixed
- **ESLint**: Removed 22 unused imports and variables across e2e test files and source code
- **Tests**: Updated budget store tests to expect schemaVersion 7 (was expecting outdated v6)
- **React Hooks**: Fixed useEffect dependency warnings in useOTPVerification and BudgetPage
- **TypeScript**: Fixed "variable used before declaration" error in useOTPVerification hook
- **Biometric Auth**: Restored biometric authentication timeout from 10s (testing) to 5 minutes (production)
- Fix failing storage service tests expecting outdated schemaVersion 6 (updated to expect v7 after biometric security migration)
- Fix localStorage mock isolation in test setup to prevent QuotaExceededError by creating fresh instance per test

### Added
- **Biometric Authentication System**: Complete Face ID/Touch ID/Fingerprint support for authenticated users on native platforms
  - Integrated `@capgo/capacitor-native-biometric` plugin (v8.3.2) with Capacitor 8 compatibility
  - Toggle in ProfilePage (Data & Security section) to enable/disable biometric authentication
  - BiometricGate component triggers native OS prompt on cold start and app resume (5 minute timeout)
  - Uses native system UI for authentication (no custom modal) with automatic fallback to device passcode when biometrics fail
  - Lock screen overlay prevents access if user cancels authentication - must authenticate successfully to unlock
  - Fixed double authentication prompt when enabling biometric - ProfilePage now updates lastAuthTimestamp after successful enable to prevent BiometricGate from prompting again immediately
  - Fixed biometric prompt appearing immediately after fresh login - CloudSyncGate now updates lastAuthTimestamp when user authenticates to prevent unnecessary Face ID prompt
  - Schema migration v6→v7 adding `security` field to BudgetState for biometric preferences
  - Cloud sync integration for biometric settings across devices
  - Full i18n support (es, en, fr, pt) for biometric UI
  - iOS Face ID usage description added to Info.plist
  - Only available for logged-in users on native platforms (iOS/Android)

### Added
- **iOS App Icon**: Added 1024x1024 app icon to iOS native project for proper home screen and App Store display
- **Legal Pages**: Added Terms of Service and Privacy Policy pages required for App Store submission
  - New pages: `/legal/terms` and `/legal/privacy`
  - Accessible from ProfilePage in new "Legal" section
  - Accessible from LoginScreen footer with clickable links
  - Full i18n support (es, en, fr, pt) via dedicated "legal" namespace
  - Complete translations for all sections in 4 languages
  - Mobile-first design with dark mode support
  - Auto-scroll to top on page load
  - Content covers: data collection, security (RLS, Supabase), user rights, third-party services, GDPR compliance
- **App Store Screenshots**: Added 9 optimized screenshots (1284×2778px) for TestFlight/App Store submission
  - Screenshots cover: home balance, budgets, statistics, history/filters, add transaction, categories, scheduled transactions, stats modals, theme selector
  - Documentation in `docs/app-store/screenshots/README.md` with order recommendations and descriptions
- **Multi-Environment Configuration**: Complete environment separation for development and production
  - Created `.env.development` (DEV Supabase project) and `.env.production` (PROD Supabase project)
  - Development app uses Bundle ID `com.jhotech.smartspend.dev` and displays as "SmartSpend Dev"
  - Production app uses Bundle ID `com.jhotech.smartspend` and displays as "SmartSpend"
  - Automated configuration script (`configure-env.cjs`) that modifies Bundle ID and Display Name before builds
  - New npm scripts: `ios:dev`, `ios:prod`, `android:dev`, `android:prod` with automatic environment setup
  - Centralized environment config in `src/config/env.ts` with typed ENV object
  - Optional EnvBadge component to visualize current environment during development
  - Comprehensive documentation in `docs/ENVIRONMENTS.md`
  - Allows installing both DEV and PROD apps simultaneously on the same device without conflicts

### Changed
- **iOS Bundle ID**: Updated from `com.smartspend.app` to `com.jhotech.smartspend` for App Store submission
  - Updated Capacitor config, Xcode project settings, and Info.plist
  - Updated CFBundleURLName for OAuth deep linking
  - Version bumped to 0.11.1 (MARKETING_VERSION)
- **Tests**: Removed obsolete test that validated transaction description as required field (now optional with category fallback)

### Fixed
- **OAuth Deep Linking Conflict**: Fixed Google OAuth redirecting to wrong app when both DEV and PROD apps are installed
  - Development app now uses `smartspend-dev://` URL scheme
  - Production app uses `smartspend://` URL scheme
  - Added `getOAuthRedirectUrl()` helper in `src/config/env.ts` that returns correct scheme per environment
  - Updated LoginScreen and AuthPage to use dynamic URL schemes
  - Configure script now updates `CFBundleURLSchemes` in Info.plist automatically
- **iOS/Android File Exports**: Fixed backup JSON and CSV exports failing on mobile devices by replacing blob URLs (which don't work on iOS) with Capacitor Filesystem + Share API for native file saving/sharing
- **Transactions Without Description Not Saving**: Fixed critical bug where transactions without description appeared to save (no error, navigated back) but were silently rejected by the store. Store's `addTransaction` was validating that `name` must not be empty. Now uses category name as fallback when description is empty, ensuring transactions are always saved.
- **CRITICAL: Guest Mode Data Loss on App Restart**: Fixed guest users losing all categories and transactions when closing and reopening the app. CloudSyncGate was incorrectly clearing localStorage on every startup when no Supabase session was detected, not distinguishing between guest mode (no session by design) and actual logout. Now only clears data when user was previously in cloud mode and logged out.
- **Budget Onboarding Button Visibility on iOS**: Fixed CTA button not visible on budget onboarding screens (4 screens) on iOS devices by changing from fixed to absolute positioning and adjusting safe area spacing to match WelcomeOnboarding pattern
- **History List Date Layout**: Fixed transaction date being compressed when category names are long by displaying date on separate line below category instead of inline with bullet separator

### Changed
- **Transaction Description Now Optional**: Changed transaction description field from required to optional based on user feedback. Only 3 fields are now required: amount, category, and date. When no description is provided, the category name is automatically used as the transaction name. Updated 7 display components (TransactionItem, HistoryPage, VirtualTransactionModal, ScheduleListItem, TopCategorySheet, TopDaySheet, CategoryMonthDetailPage) to show category name as fallback.
- **CLAUDE.md Git Workflow Rules**: Added critical rule requiring explicit user authorization before any git commit or push operations (except when using /ship command or explicitly requested)
- **Default Categories Icons**: Updated default category icons for better clarity (Arriendo: home→house, Otros Gastos: help-circle→package, Otros Ingresos: more-horizontal→coins)

### Added
- **History Page**: Added dedicated history page with advanced filters (date range presets, multi-select categories, type, status, amount range), search bar, CSV export, and localStorage filter persistence

### Changed
- **HomePage Filters**: Moved search bar and filters from HomePage to dedicated History page, replaced with flat "Ver historial completo" button for cleaner home view

### Fixed
- **Onboarding Fixed Buttons**: Fixed "Continuar" and "Comenzar" buttons not staying fixed at bottom during scroll by changing from absolute to fixed positioning with proper safe area insets
- **iOS Search Bar Positioning**: Fixed sticky search bar overlapping TopHeader on iOS by calculating dynamic top position based on safe area insets instead of hardcoded 80px
- **Onboarding Scroll Padding**: Fixed content getting cut off under fixed buttons by increasing bottom padding from pb-32 to pb-40 (categories screen) and pb-48 (complete screen)

### Changed
- **Default Categories**: Reduced default categories from 21 to 9 essentials (7 expenses: Mercado, Arriendo, Ropa, Entretenimiento, Salud, Transporte, Otros Gastos; 2 income: Salario, Otros Ingresos) for simpler onboarding
- **Z-Index Hierarchy**: Increased TopHeader z-index from z-20 to z-30 to ensure it stays above sticky search bar (z-20)

### Added
- **2FA OTP System**: Implemented mandatory OTP verification for untrusted devices on login with automatic email/SMS delivery via `send2FAOTP()`
- **OTP Back Button**: Added flat-style "Volver" button on OTP verification screen to allow users to cancel and return to login

### Fixed
- **Session Security**: Fixed critical vulnerability where users could bypass OTP verification by closing the app, now enforced via multi-layer `auth.pendingOtpVerification` flag with cleanup on unmount, app restart, and CloudSyncGate initialization
- **Trusted Device Login Loop**: Fixed infinite redirect to login after successful authentication on trusted devices by clearing logout flag immediately after password verification
- **OTP Purpose Handling**: Fixed OTP verification to correctly distinguish between 'signup' (new users) and '2fa' (returning users on untrusted devices) using purpose parameter

### Fixed
- **iOS Safe Area Insets**: Fixed all onboarding and auth screens to respect Dynamic Island/notch safe area on iOS by adding `env(safe-area-inset-top)` padding
- **Onboarding Navigation Loop**: Fixed infinite redirect loop between onboarding steps by preventing OnboardingGate from competing with flow components when user is already inside onboarding paths
- **iOS Input Zoom**: Fixed unwanted zoom when focusing search input on iOS by changing font size from 14px to 16px and adding `maximum-scale=1.0` to viewport
- **OTP Screen Layout**: Fixed verify button not being visible on auth OTP screens by changing to fixed bottom positioning with proper safe area spacing

### Changed
- **Splash Screen**: Removed Capacitor SplashScreen plugin in favor of simpler HTML-based splash screen with 800ms display time
- **Screen Orientation**: Locked app to portrait-only mode on all platforms (iOS, Android, PWA) via manifest and native configs

### Added
- **Stats Bottom Sheets**: Refactored all 5 stats modals from centered dialogs to mobile-first bottom sheets
  - Added drag-to-dismiss gesture (30% threshold) with smooth animations
  - Created dedicated components: FilterStatisticsSheet, ComparisonSheet, TopDaySheet, DailyAverageBreakdownSheet, TopCategorySheet
  - Drag handlers isolated to header only, scrollable content unaffected
  - Category exclusion notices moved to sheet headers (always visible during scroll)
  - Individual body scroll lock per sheet (removed global lock from StatsPage)
- **iOS/Android Native Support**: Complete Capacitor migration for native mobile apps
  - OAuth deep linking with custom URL scheme (`smartspend://auth/callback`)
  - Native status bar sync with app theme (dark/light mode)
  - Safe area insets for iOS notch/Dynamic Island on headers
  - Unified network service (Capacitor Network plugin for native, navigator.onLine for web)
  - Platform detection utilities (isNative, isIOS, isAndroid, isWeb)
  - Native splash screen control via @capacitor/splash-screen
  - Android hardware back button handling
- **E2E Test Suite**: Added 10 comprehensive Playwright test files covering critical user flows
  - Onboarding flow, transaction management, scheduled transactions
  - Category management, budget tracking, cloud sync
  - Trip expenses, settings/preferences, search/filtering
  - Navigation and integration tests

### Fixed
- **OAuth Login Flow**: Fixed returning users being redirected to onboarding config instead of home after login by checking localStorage directly instead of context state
- **Logout Navigation**: Fixed logout leaving user on home screen instead of login by prioritizing logout flag over active session in navigation logic
- **PageHeader Safe Area**: Added safe area inset padding for iOS to prevent back button being hidden behind notch
- **Budget Onboarding Wizard Button Spacing**: Fixed bottom button being cut off on iPhone by changing from absolute to fixed positioning with proper safe area spacing (calc(env(safe-area-inset-bottom) + 24px))
- **Native Splash Screen**: Moved splash screen hide logic from Welcome component to main.tsx with 1.2s minimum display time for smoother app startup

## [0.11.1] - 2026-01-25

### Added
- **Capacitor Integration**: Native mobile app compilation support via Capacitor
  - Installed Capacitor core, CLI, and platform plugins (iOS, Android)
  - Added native plugins: App lifecycle, Network status, Splash Screen, Status Bar, Apple Sign In
  - Configured capacitor.config.ts with app metadata and bundled web directory
  - Generated native app assets (icons, splash screens) for iOS/Android
  - Added network service and platform detection utilities
  - Updated manifest to fullscreen display mode for native apps
  - Gitignored native platform folders (regenerated via `npx cap sync`)

### Removed
- **Playwright E2E Tests**: Removed Playwright testing framework and all E2E test files
  - Deleted 6 E2E spec files (auth-state-consistency, core-functionality, list-filtering, release-features, scheduled-transactions, transaction-attributes)
  - Removed Playwright dependencies from package.json
  - Shifted testing strategy to focus on native app testing

### Fixed
- **Stats Modals Layout**: Fixed Filter Statistics and Month Comparison modals being cut off on iPhone by restructuring modal padding with proper safe area spacing

## [0.11.0] - 2026-01-25

### Added
- **Security Audit**: Comprehensive security analysis document (docs/SECURITY_AUDIT.md) covering RLS, localStorage security, E2E encryption roadmap, and industry standard comparison
- **Pre-Launch Checklist**: Security checklist (docs/PRE_LAUNCH_CHECKLIST.md) with CRITICAL, RECOMMENDED, and OPTIONAL tasks before production deployment
- **RLS Database Migrations**: Row Level Security migrations for user_state table (20260125_create_user_state_with_rls.sql and 20260125_fix_user_state_schema.sql) to prevent unauthorized data access
- **Features Documentation**: Expanded docs/FEATURES.md from 120 to 600+ lines with complete feature list including i18n (4 languages), multi-currency (50+), themes, transactions, categories (140+ icons), budgets, stats, trips, auth, and backups

### Removed
- **Apple Sign In**: Removed Sign in with Apple OAuth integration (requires Apple Developer membership)

### Fixed
- **Stats Modals Safe Area**: Fixed Close button being cut off on iPhone with notch in Top Day, Top Category, and Daily Average Breakdown modals by adding safe area inset padding

### Added
- **Enhanced Icon Picker with Search**: Major upgrade to category icon selection
  - Expanded icon library from 87 to 140+ unique icons including pets section (dog, cat, paw-print, rabbit, fish, bird, etc.)
  - Search functionality with bilingual keywords (Spanish/English) for quick icon discovery
  - Real-time filtering with search input and clear button
  - Empty state message when no icons match search query
  - Full i18n support (es, en, fr, pt) for search placeholder and no results message

### Changed
- **Top Category Modal**: Refactored Top Category card to show transactions modal instead of navigating to category page
  - Modal displays all transactions for the top category in selected month
  - Scrollable transaction list with same UX as Top Day modal
  - Clicking transactions navigates to transaction detail page
  - Better UX consistency across all 4 Quick View cards
- **Stats Modals UX Improvements**: Enhanced modal content visibility and scrollability
  - Increased modal height from 70vh to 80vh for Top Day and Top Category modals
  - Categories excluded disclaimer moved inside scrollable area for better visibility
  - All 4 Quick View modals now include "X categories excluded" note when filters are active

### Fixed
- **Icon Picker Duplicates**: Removed duplicate icons from category icon list (scissors appeared twice)

### Added
- **Stats Page Interactive Cards with Modals**: All 4 summary cards now clickable with explanatory modals
  - Daily Average modal shows current average and full category checklist
  - Month Comparison modal explains day-to-day fair comparison with visual breakdown
  - Top Category card navigates to category detail page
  - Top Day modal displays all transactions from that day of week in current month (70vh scrollable)
  - All modals include body scroll lock and proper timezone handling
- **Stats Category Filtering System**: Unified filtering across all statistics
  - New "Personalizar" button with teal design and badge showing excluded count
  - Exclude categories (bills, fixed expenses) from ALL 4 summary cards
  - Filter affects: Daily Average, Top Category, Top Day, Month Comparison
  - Full i18n support (es, en, fr, pt) for all new UI elements
  - Cloud sync persistence for excluded categories preferences
- **Stats Daily Average Breakdown Modal**: New detailed modal when clicking Daily Average card
  - Shows calculation breakdown: Total Spent ÷ Days Elapsed
  - Displays month projection based on current spending rate
  - Dynamic labels (Days Elapsed vs Days in Month) based on current/past month
  - Full i18n support (es, en, fr, pt)
- **Stats Quick View Label**: Added "Vista Rápida" label next to Personalizar button for better UX

### Changed
- **Stats Page Month Comparison Logic**: Refactored to fair day-to-day comparison
  - Now compares same number of days instead of full months
  - Modal explains whether comparing partial months or full months
  - Icons changed from trending arrows to CheckCircle/AlertCircle for clarity
  - Red/green colors now semantic (green = spending less, red = spending more)
- **Stats Card Visual Indicators**: Added chevrons and colorful icons to show cards are clickable
  - Daily Average: DollarSign icon in teal circle
  - Top Category: Category icon with color
  - Top Day: Calendar icon in purple circle
  - Month Comparison: CheckCircle/AlertCircle based on performance

### Fixed
- **Stats Cloud Sync**: Fixed excluded categories not persisting to cloud
  - Added `excludedFromStats` to CloudSyncGate subscriptions and dependencies
  - Updated `getSnapshot()` and `replaceAllData()` to include filter preferences
- **Stats Timezone Bug**: Fixed day-of-week calculations failing due to timezone issues
  - Changed from `new Date(t.date)` to `new Date(t.date + "T12:00:00")`
  - Ensures consistent day-of-week detection across timezones
- **Stats Daily Average Calculation**: Fixed incorrect daily average calculation
  - Now divides by days elapsed instead of total days in month for current month
  - Provides accurate spending rate and realistic month projection
  - Past months still use full month days for historical accuracy

### Added
- **Budget Module Complete Implementation**: Full budget tracking system with flexible periods and cloud sync
  - Create budgets for any category with weekly, monthly, quarterly, yearly, or custom periods
  - Recurring budgets that auto-renew at the end of each period
  - Real-time progress tracking with color-coded visual indicators (green/yellow/red)
  - Budget cards show spent amount, remaining amount, and progress percentage
  - Support for multiple budgets per category with different time periods
  - Budget onboarding wizard with 4 animated screens explaining features
  - Complete i18n support (es, en, pt, fr) for all budget components
  - Dark mode support throughout entire budget module

### Fixed
- **Budget Cloud Sync**: Fixed budgets and onboarding flags not syncing to cloud
  - Added `budgets`, `welcomeSeen`, and `budgetOnboardingSeen` to CloudSyncGate dependencies
  - Updated BudgetState type to include onboarding flags in cloud-synced state
  - Fixed Budget CRUD operations preserving all state fields (welcomeSeen, budgetOnboardingSeen, lastSchedulerRun)
  - Budget data now syncs automatically after create/update/delete operations
- **Budget Edit Modal**: Fixed edit mode not pre-loading existing budget data
  - Modal now properly loads category, amount, period, and recurring settings when editing
  - Separated data loading logic from animation effects for reliability

### Changed
- **Transaction Save Button**: Unified button style to emerald color for all transaction types (income/expense)
- **CategoryMonthDetailPage Dark Mode & i18n**: Complete internationalization and dark mode support
  - All UI elements now support dark theme (backgrounds, text, borders, active states)
  - Date formatting respects user's language preference (es-CO or en-US)
  - Transaction count uses proper pluralization ("1 transacción" vs "2 transacciones")
  - All hardcoded Spanish text replaced with translation keys
  - Added `monthDetail` namespace with transaction, error, and empty state translations

### Added
- **Password Reset Flow**: Complete password recovery with email OTP verification
  - New ResetPasswordOTPPage for 6-digit OTP verification with paste support
  - ForgotPasswordModal navigates to OTP verification instead of showing success state
  - Users remain logged in after password reset (redirect to home instead of login)
  - Integrated with Supabase Auth passwordless flow
- **Guest User Login Access**: Guest users who completed onboarding can now access login screen
  - ProfilePage banner "Conectar cuenta" now properly navigates to login
  - OnboardingGate allows login/auth routes for users in 'app' state
  - Enables seamless transition from guest mode to authenticated mode

### Fixed
- **First Config Categories on Skip**: Users who skip category selection now get all default categories created
- **Cloud Sync for Categories**: Categories are now pushed to cloud immediately after First Config completion
  - Prevents re-onboarding when user logs out/clears localStorage
  - Ensures cloud data exists before user can logout
- **Returning User Detection**: CloudSyncGate and onboarding.helpers now check cloud data to detect returning users
  - Auto-marks onboarding as complete when cloud has data but localStorage was cleared
  - Fixes bug where users were asked to complete First Config again after clearing localStorage
- **OTP Paste Functionality**: Fixed paste not working in OTP input (only last digit was populating)
  - Changed to functional setState pattern for rapid state updates

### Changed
- **ProfilePage Login Banner**: Redesigned login button as attractive card-style banner
  - White/gray background with teal border matching preferences cards
  - Cloud icon, title, subtitle, and call-to-action text
  - Fully translated (es/en) with loginBanner keys

### Added
- **Multi-Currency Support**: Complete currency selection system with 50+ currencies
  - CurrencyProvider context with useCurrency hook for currency management
  - Auto-detection of user's currency based on timezone and locale
  - CurrencySelector modal component for ProfilePage
  - Dynamic amount formatting via `formatAmount()` replacing hardcoded `formatCOP()`
  - Grouped currencies by region (America, Europe, Asia, Africa) with search
  - Screen3_Currency in onboarding redesigned with recommended currency and search
  - Currency preference persisted in localStorage (`app_currency`)
  - Migrated 11 components from formatCOP to useCurrency hook
- **Dark Mode for Onboarding**: All onboarding screens now respect system/user theme preference
  - Updated OnboardingLayout, FeatureCard, ProgressDots components
  - Updated all 6 WelcomeOnboarding screens (Screen1-Screen6)
  - Updated all 5 FirstConfig screens (Language, Theme, Currency, Categories, Complete)
  - Updated LoginScreen with proper dark mode classes

- **Dark Mode Support**: Complete dark/light/system theme implementation
  - Three theme modes: Light, Dark, and System (auto-detect from OS preference)
  - ThemeProvider context with useTheme hook for theme management
  - Anti-flicker script in index.html prevents flash of wrong theme on load
  - ThemeSelector component in ProfilePage for easy theme switching
  - All UI components updated with dark mode variants using Tailwind's `dark:` prefix
  - Dark palette: `dark:bg-gray-950` backgrounds, `dark:bg-gray-900` cards, `dark:text-gray-50` text
  - Splash screen adapts to dark mode (gray-950 background instead of teal)
  - Theme preference persisted in localStorage (`app_theme`)

### Added
- **i18n: Internationalize chart month labels**: StatsPage charts now use user's locale for month abbreviations (Ago/Aug, Sept/Sep, etc.)
- **i18n: Internationalize IconColorPicker modal**: Icon/color picker tabs and apply button now translated
- **i18n: Internationalize category groups modals**: Category group creation/edit page now fully translated (color picker, type warning, buttons)
- **i18n: Internationalize scheduled transactions page**: Complete internationalization including status badges, frequency text, next dates, deactivate modal
- **Internacionalización (i18n)**: Sistema completo de traducción para soporte multiidioma en TODA la aplicación
  - **Idiomas soportados**: Español (es) e Inglés (en)
  - **react-i18next**: Integración con detección automática de idioma (localStorage → navigator.language → fallback español)
  - **11 namespaces de traducción**: `common`, `onboarding`, `profile`, `home`, `budget`, `stats`, `trips`, `transactions`, `categories`, `backup`, `scheduled`
  - **37 archivos modificados**: 18 páginas/componentes migrados + 16 archivos de traducción nuevos + 3 helpers/config
  - **300+ strings traducidos**: Cada rincón de la app ahora soporta español e inglés
  - **Cobertura completa por módulo**:
    - **Onboarding (13 pantallas)**: Welcome flow, Login, First Config (idioma, tema, moneda, categorías)
    - **Home**: Búsqueda, filtros, presupuesto diario, exportar, todos los labels
    - **Budget**: Resumen mensual, límites, secciones de gastos/ingresos
    - **Stats**: Estadísticas, gráficas (donut, barras, línea), días de la semana, métricas
    - **Trips (4 páginas)**: Lista de viajes, detalle, crear/editar viaje, gastos de viaje
    - **Transactions (5 archivos)**: Formulario de transacción, lista, programación, configuración de schedules, banner de programadas
    - **Categories (4 páginas)**: Lista de categorías, grupos, formularios de crear/editar
    - **Backup**: Métodos manual/local/nube, exportar/restaurar, descripciones
    - **Scheduled**: Transacciones programadas activas/inactivas
    - **Componentes**: ConfirmDialog, TransactionList, todos los modales
  - **LanguageSelector**: Componente reutilizable para cambiar idioma con modal de confirmación en ProfilePage
  - **useLanguage hook**: Hook personalizado para gestionar cambio de idioma con i18next
  - **Traducción de categorías por defecto**: 21 categorías traducidas (13 gastos + 8 ingresos)
    - Categorías se crean con nombre en el idioma seleccionado durante onboarding
    - Helper `getCategoryDisplayName()` para mostrar categorías traducidas en selección
    - `category-translation-keys.ts`: Mapeo de nombres españoles a claves de traducción
    - Categorías personalizadas del usuario mantienen su nombre original (no se traducen)
  - **Pluralización**: Soporte para formas singular/plural (ej: "1 día" vs "5 días")
  - **Interpolación**: Variables dinámicas en traducciones (ej: "Gastado {{amount}}")
  - **Fallback inteligente**: Si falta una traducción, usa español como respaldo
- **Sistema de Onboarding Completo**: Nuevo flujo de bienvenida para usuarios nuevos
  - **Welcome Flow (6 pantallas)**: Introducción visual a las features principales de SmartSpend
  - **Login Screen**: Selección entre modo invitado (local-first) o sincronización con la nube
  - **First Config Flow (5 pantallas)**: Configuración inicial de idioma, tema, moneda y categorías
  - **Pantalla de categorías**: Selección de categorías por defecto agrupadas por tipo, con opción de deseleccionar las no deseadas
  - **OnboardingContext**: Gestión centralizada del estado de onboarding con persistencia en localStorage
  - **OnboardingGate**: Componente que determina automáticamente dónde debe comenzar el usuario (onboarding, login o app)
  - Migración automática desde sistema de welcome legacy
  - Progreso guardado: si el usuario cierra la app durante el onboarding, retoma donde dejó
- **Splash Screen**: Nuevo splash screen con diseño del logo de la app (gráfico de barras + línea de tendencia)
  - Tiempo mínimo de visualización: 1.2 segundos
  - Animación de fade out suave (0.4s)
  - Fondo teal (#0d9488) coherente con el brand
  - Previene flash blanco durante la carga
- **Nuevos iconos de la app**: Suite completa de iconos para PWA
  - favicon.svg: Favicon SVG moderno (soporte nativo en navegadores)
  - safari-pinned-tab.svg: Versión mono para Safari pinned tabs
  - Iconos PNG en 15 tamaños (16px a 1024px)
  - Iconos maskable para Android (192x192, 512x512) con safe zone del 40%
  - Script de generación automática con Sharp (`scripts/generate-icons.js`)

### Changed
- **HomePage Redesign**: Refactor completo del diseño de la página principal
  - **TopHeader**: Nuevo diseño con logo + nombre de app + selector de mes a la izquierda, avatar con indicador de sync a la derecha
    - Logo teal (#18B7B0) con gráfico de barras y línea de tendencia
    - Avatar sin funcionalidad de click (navegación solo vía BottomBar)
    - Indicador de estado de sync (dot): verde (sincronizado), teal (sincronizando), gris (offline/guest)
  - **BalanceCard**: Rediseño con gradiente teal
    - Gradiente de fondo: from-[#18B7B0] to-teal-800
    - Elementos decorativos con blur para profundidad visual
    - Layout actualizado: Balance Disponible arriba, tarjetas de Ingresos/Gastos con íconos TrendingUp/TrendingDown
    - Corrección de signos "$" duplicados (formatCOP ya incluye el símbolo)
  - **Daily Budget Banner**: Rediseño con fondo teal-50
    - Ícono Calculator en lugar de Lightbulb
    - Texto actualizado: "Podrías gastar X / día"
  - **Search & Filters**: Nueva interfaz de filtros
    - Reemplazados pills por dropdown menu con SlidersHorizontal icon
    - Opciones: Todos, Gastos, Ingresos, Pendientes, Recurrentes
    - Checkmarks visuales para opción activa
    - Click fuera del dropdown para cerrar
  - **FAB Button**: Color cambiado de negro a teal (#18B7B0)
- **BottomBar**: Tab "Trips" reemplazado por "Settings"
  - Nueva navegación: Home, Budget, Stats, Settings
  - Settings navega a ProfilePage
  - Ícono Settings (engranaje) en lugar de Plane
- **ProfilePage**: Rediseño completo de la página de configuración
  - TopHeader especial con título "Configuración" y subtítulo "General y Cuenta"
  - Card de cuenta del usuario con avatar, nombre, email y badge de sync
  - Avatar con dot de estado verde (sincronizado)
  - Badge dinámico: "CLOUD SYNC ACTIVO" (teal), "SINCRONIZANDO" (animado), "SIN CONEXIÓN" (gris), "MODO LOCAL" (gris)
  - Elemento decorativo en la esquina superior derecha de la card
  - Hover effects en la card del usuario
  - Removida redundancia del avatar en TopHeader
  - Accesible solo vía BottomBar → Settings
- **Creación de categorías**: Las categorías por defecto ya no se crean automáticamente al inicializar el store
  - Ahora se crean solo durante el onboarding según las selecciones del usuario
  - Usuarios legacy (con datos existentes) mantienen sus categorías actuales sin cambios
  - CloudSyncGate solo inyecta defaults para usuarios legacy con transacciones pero sin categorías
- **Theme color**: Actualizado a #0d9488 (teal) para coherencia visual con el nuevo brand
- **Icono de bienvenida**: Pantalla de bienvenida del onboarding ahora muestra el logo real de la app en lugar del icono genérico de billetera
- **Splash screen legacy**: Eliminado el splash screen anterior del componente React

### Fixed
- **CategoryPickerDrawer**: El gesto de drag-to-close ya no interfiere con el scroll de la lista de categorías
- **Espaciado en ConfigScreen**: Corregido el espaciado entre las tarjetas de features y el botón "Comenzar a usar SmartSpend"
- **Duplicate Currency Symbols**: Removidos signos "$" duplicados en BalanceCard y HomePage (formatCOP ya incluye el símbolo)

## [0.10.0] - 2026-01-22

### Added
- **E2E Tests**: Nuevos archivos de tests E2E para cobertura completa
  - `transaction-attributes.spec.ts`: Tests para estados (Pagado/Pendiente/Planeado), notas, campos opcionales
  - `list-filtering.spec.ts`: Tests para agrupación por día, búsqueda, filtros de tipo, navegación mensual
  - Actualizado `scheduled-transactions.spec.ts` para compatibilidad con cambios recientes en UI

- **Página de gestión de transacciones programadas** (`/scheduled`): Nueva UI para ver y administrar todas las transacciones con schedule
  - Acceso desde Perfil → Programadas
  - Tabs "Activas" / "Inactivas" para filtrar programaciones
  - Card con icono de categoría, nombre, monto, frecuencia y próxima fecha
  - Botón "Desactivar" (con confirmación y aviso de irreversibilidad)
  - Inactivas se muestran como historial (sin acciones)
  - Al desactivar: el icono de recurrencia desaparece del listado principal
  - Templates desactivadas no pueden reactivar la programación desde el formulario de edición
  - Empty state cuando no hay programaciones en cada tab

- **"Editar y registrar" para transacciones virtuales**: Nueva funcionalidad para editar y registrar transacciones programadas
  - Al hacer clic en una transacción virtual, 3 opciones: "Confirmar", "Editar" y "Eliminar"
  - "Confirmar" registra la transacción inmediatamente
  - "Editar" permite modificar valores antes de registrar
  - "Eliminar" termina la programación (con confirmación), no genera más transacciones futuras
  - Modal de elección: "Solo este registro" (crea transacción individual) vs "Este y los siguientes" (crea nuevo template)
  - Cambios en schedule (frecuencia, intervalo) aplican automáticamente "Este y los siguientes"
  - Alerta "Sin cambios" cuando se intenta guardar sin modificaciones
  - Botón eliminar oculto al editar desde virtual (previene eliminar template accidentalmente)
  - Tests unitarios (28 tests) y E2E (15 tests) para el flujo completo

### Fixed
- **Scheduled Transactions Duplication Bug**: Corregido bug crítico donde editar una transacción programada (cambiar monto/nombre) causaba duplicados al refrescar
  - Agregado campo `sourceTemplateId` para vincular transacciones generadas a su template
  - Migración v4→v5: convierte `isRecurring` a `schedule`, deduplica templates, vincula transacciones
  - Reparación automática de transacciones existentes sin `sourceTemplateId` al cargar datos
  - El scheduler ahora verifica por `sourceTemplateId + date` primero (permite editar sin duplicar)
  - Al editar transacciones legacy, se vinculan automáticamente a su template correspondiente
  - Preservación de `sourceTemplateId` en `updateTransaction` del store

### Changed
- **Scheduled Transactions**: Reemplazado sistema de generación de transacciones programadas
  - Nueva arquitectura de "generación lazy" con transacciones virtuales calculadas on-the-fly
  - Migración v5→v6: deduplicación automática de templates de schedule
  - Auto-confirmación de transacciones pasadas al abrir la app
  - Nuevo banner de transacciones programadas con modal de confirmación
  - Modal de dismiss con opciones: "No volver a mostrar este mes" o "Solo por esta vez"
  - Eliminado SchedulerJob background, RecurringBanner, RecurringModal (código legacy)
  - Tests completos para flujo de iteración de transacciones programadas (40 tests)

### Changed
- **Logging System**: Implemented environment-aware logging utility
  - Created `logger.ts` utility with namespace-based logging (debug, info, warn, error levels)
  - Silent in production builds (all logs disabled) to avoid console spam
  - Active in development with formatted `[Namespace] message` output
  - Replaced all 59 `console.log/warn/error` statements across the codebase
  - Namespaces: Backup, CloudBackup, BackupScheduler, CloudBackupScheduler, CloudSync
  - Production builds now have clean console output

- **Code Organization**: Extracted duplicate code to shared utilities
  - Created `string.utils.ts` with `kebabToPascal` function (removed 11 duplicates, -77 lines)
  - Created `currency.utils.ts` with `formatCOP` function (centralized from transactions.utils)
  - Created `ui.constants.ts` with Z-index layers, timing constants, and layout values
  - Updated 23 files to use centralized utilities
  - Improved code maintainability following DRY principle

### Performance
- **Bundle Size Optimization**: Reduced initial bundle size by 31% through code splitting
  - **Before**: 410.63 KB gzipped (1.45 MB minified) - single monolithic bundle
  - **After**: 284.09 KB gzipped (1.00 MB minified) - optimized with lazy loading
  - **Improvement**: -126.54 KB gzipped (-31% reduction in initial bundle)
  - **Code Splitting Strategy**:
    - Lazy loaded StatsPage (372 KB chunk with Recharts library)
    - Lazy loaded BackupPage, ProfilePage, and all Trip pages
    - Lazy loaded all Category management pages
    - Added Suspense boundaries with loading fallback
    - Total chunks: 16 (from 1 monolithic bundle)
  - **Build Performance**: Build time improved from 8.79s to 6.29s (28% faster)
  - **Impact**: Faster initial page load, better caching, improved Time to Interactive (TTI)
  - **Bundle Analyzer**: Added rollup-plugin-visualizer for ongoing bundle monitoring

### Added
- **Unit Tests for Zustand Store**: Comprehensive test suite for budget.store.ts
  - 79 test cases covering all CRUD operations
  - Transaction CRUD tests (add, update, delete with validation)
  - Category CRUD tests (add, update, delete, setLimit, getCategoryById)
  - Category Groups CRUD tests (add, update, delete, getCategoryGroupById, reassignment on delete)
  - Trip CRUD tests (add, update, delete with cascading trip expenses)
  - Trip Expenses CRUD tests (add, update, delete)
  - Sync helpers tests (getSnapshot, replaceAllData)
  - UI state tests (selectedMonth, cloudMode, cloudStatus, user, welcomeSeen, budgetOnboardingSeen)
  - Store coverage: 98.65% statements, 84.48% branches, 100% functions
  - All tests passing with proper mocking of storage and dates services
- **Unit Tests for Services**: Test suites for critical services
  - pendingSync.service.ts: 14 tests covering setPendingSnapshot, getPendingSnapshot, clearPendingSnapshot, hasPendingSnapshot
  - recurringTransactions.service.ts: 22 tests covering detectPendingRecurring, hasIgnoredThisMonth, markIgnoredForMonth, replicateTransaction
  - cloudState.service.ts: 19 tests covering getCloudState, upsertCloudState with full Supabase mocking
  - **storage.service.ts: 26 tests** covering localStorage operations, schema migrations, and data integrity
    - saveState/loadState/clearState: basic CRUD operations, JSON serialization, error handling
    - v1→v2 migration: string categories to Category objects, transaction category ID migration, deduplication logic
    - v2→v3 migration: categoryGroups addition
    - v3→v4 migration: isRecurring field addition to transactions
    - Edge cases: missing arrays, empty arrays, invalid state, localStorage quota errors
    - Full migration path: v1→v2→v3→v4 in single loadState call
    - Data integrity: migration persistence, corrupted state handling
  - **backup.service.ts: 41 tests** covering backup creation, validation, restore, and local storage operations
    - createBackup: metadata generation, stats calculation, SHA-256 checksum, device info, empty/large states
    - validateBackup: JSON validation, structure checks, backup version compatibility, checksum verification, corrupted file detection
    - restoreBackup: data restoration in replace mode, merge mode error handling
    - saveLocalBackup/getLocalBackups: user namespacing, automatic backup creation, filtering by userId
    - restoreLocalBackup: backup restoration by key
    - Integration tests: full backup cycles, multi-user separation, data integrity through operations
  - **dates.service.ts: 26 tests** covering date formatting and manipulation utilities
    - todayISO: date formatting in YYYY-MM-DD, single-digit padding, year boundaries
    - monthKey: YYYY-MM extraction from ISO dates, datetime string handling
    - currentMonthKey: current month key generation, updates on date changes, year transitions
    - monthLabelES: Spanish month labels for all 12 months, capitalization, different years
    - formatDateGroupHeader: "Hoy"/"Ayer" logic, weekday formatting, year boundaries, different months
    - formatTime: HH:MM formatting, morning/afternoon hours, midnight/end of day, padding, ISO 8601 with timezone
- **Unit Tests for Components**: Test suites for React UI components
  - **ConfirmDialog: 23 tests** covering confirmation modal UI and interactions
    - Rendering: conditional display based on open prop, custom vs default title/buttons/text
    - Button styling: normal (blue) vs destructive (red) confirm buttons, cancel button styling
    - User interactions: button clicks (confirm/cancel), backdrop click, keyboard shortcuts (Escape/Enter)
    - Keyboard event cleanup: listener removal on close, callback updates
    - Accessibility: button types, proper z-index hierarchy
    - Edge cases: empty messages, long text, double-click handling
  - **DatePicker: 44 tests** covering date picker modal with calendar UI
    - Rendering: open/closed states, header display, action buttons, year picker toggle
    - Initial state: selectedDate initialization from value prop, today's date handling
    - Month navigation: previous/next month buttons, year wrapping (Dec↔Jan), updating month/year state
    - Day selection: clicking days updates selectedDate, proper date object handling
    - Year picker: toggle open/close, year range generation (current year ±50), year selection updates main calendar
    - Confirm/cancel actions: onChange callback with ISO format (YYYY-MM-DD), onClose on cancel/confirm
    - Date formatting: Spanish locale (es-CO) for month/day names, proper display of selected date
    - Edge cases: leap years (Feb 29), month boundaries (Jan 31→Feb 28), past/future year selection
    - Body scroll locking: prevents background scroll when open
    - Keyboard support: Escape key closes modal
    - Accessibility: proper button types, modal structure
  - **TransactionList: 30 tests** covering transaction list with grouping, filtering, and balance calculations
    - Rendering: empty states, transaction groups by date, transaction items with proper formatting
    - Grouping and sorting: descending date order, descending createdAt within same day, date group headers (Hoy/Ayer/formatted dates)
    - Balance calculations: daily totals (expense only, income only, mixed), formatCOP currency formatting
    - Filtering by search query: name matching (case-insensitive), category name matching, notes matching, no results state
    - Filtering by type: all transactions (default), expenses only, income only, pending status only
    - Month warning banner: past month message, future month message, current month no warning
    - Transaction interactions: onClick handler called with correct transaction
    - Edge cases: undefined categoryDefinitions, missing category in definitions, transactions with no notes, mixed transaction types in same day, zero amount transactions
  - **CategoryPickerDrawer: 44 tests** covering category picker with drag-to-dismiss and search
    - Rendering: open/closed states, search input, drag handle, New Category button, Close button
    - Category filtering by transaction type: expense categories only, income categories only, proper icon/color display
    - Search filtering: case-insensitive matching, partial matches, accent-insensitive, updates on input change, empty state message
    - Category selection: onSelect callback with category, visual highlighting of selected category, proper category object passed
    - Drag-to-dismiss mechanics: touchStart records startY, touchMove updates position, touchEnd closes if threshold exceeded (80px), touchEnd resets if below threshold, backdrop opacity changes during drag
    - New Category button navigation: navigates to /category/new with type query param
    - Close actions: close button calls onClose, backdrop click calls onClose, closes on category selection
    - Body scroll locking: prevents background scroll when open
    - Edge cases: empty category list, missing icons default to Wallet, special characters in search, whitespace handling
    - Accessibility: proper button types, search input placeholder
  - Edge cases: localStorage errors, invalid JSON, year boundaries, leap years, month-end date adjustments, auth errors, database failures, corrupted backups, quota exceeded errors, schema migration edge cases
  - Integration scenarios: full sync cycles, user switching, logout handling, validation→restore flows, v1→v4 migration paths
  - **Total: 368 tests passing (2 skipped)**

## [0.9.1] - 2026-01-20

### Changed
- **Backup Method UX Redesign**: Simplified backup mechanism to operate only one method at a time
  - Removed tabs (Manual, Local, Nube) from BackupPage
  - Added "Método activo" indicator badge showing which backup method is currently active
  - Renamed change method button from "Ver otras opciones" to "Cambiar método de backup"
  - BackupScheduler (local) now only runs when "local" method is active
  - CloudBackupScheduler (cloud) now only runs when "cloud" method is active
  - Manual method does not run any automatic schedulers
  - Clearer UX showing only one backup strategy operates at a time

### Fixed
- **CRITICAL: Local Backups Cross-User Data Leak**: Fixed guest users seeing logged-in users' backups
  - Local backups now namespaced by user ID (`budget.autoBackup.{userId}.{timestamp}`)
  - Guest users cannot access "Local" backups tab (disabled + auth required message)
  - BackupScheduler only runs for logged-in users (cloudMode === "cloud")
  - `getLocalBackups()` and `saveLocalBackup()` now filter by userId
  - Prevents data leaks between different user sessions
  - Each user only sees their own auto-backups
- **CRITICAL: Logout User State Persistence**: Fixed user data persisting after logout
  - User avatar, email, and name now properly cleared on SIGNED_OUT event
  - TopHeader no longer shows ghost avatar after logout
  - ProfilePage correctly displays guest state instead of logged-in user info
  - Added setUser({ email: null, name: null, avatarUrl: null }) to SIGNED_OUT handler in CloudSyncGate

## [0.9.0] - 2026-01-19

### Fixed
- **Amount Input Display for Large Numbers**: Fixed amount being cut off and hard to read
  - Added thousands separator (.) for Colombian locale format (ej: 300.000.000)
  - Dynamic font size: text-5xl (≤8 digits), text-4xl (≤11 digits), text-3xl (>11 digits)
  - Input auto-cleans separators on edit, formats on display
  - Responsive width with flex-1 to prevent overflow
  - Amounts up to billions now fully visible and readable
- **Transaction Form Scroll Issue**: Fixed fields being cut off on small screens
  - Added `pb-32` padding to form fields container in AddEditTransactionPage
  - Toggle "Gasto recurrente mensual" y botón "Guardar" ahora visibles con scroll
  - Fixes issue where last fields were hidden behind fixed bottom button on devices with limited screen height
- **CRITICAL: Auth State Consistency Bug**: Fixed race condition causing avatar to show while CloudStatus displayed "Local"
  - **Root Cause**: Three components (TopHeader, ProfilePage, CloudSyncGate) had independent auth listeners creating inconsistent state
  - **Solution**: Centralized auth state in Zustand store as single source of truth
  - Added `user: { email, name, avatarUrl }` to budget.store.ts
  - CloudSyncGate now updates user state atomically with cloudMode
  - TopHeader simplified from 42 to 19 lines (removed independent listener)
  - ProfilePage simplified from 78 to 26 lines (removed independent listener)
  - Added E2E test suite (auth-state-consistency.spec.ts) with 4 tests to prevent regression
  - All components now read from store, eliminating race conditions

### Changed
- **HomePage Visual Redesign**: Refactor completo del diseño de la página principal
  - **BalanceCard Hero**: Diseño renovado con Balance Total centrado y destacado
    - Texto "BALANCE TOTAL" pequeño arriba
    - Monto grande (text-5xl) centrado en negro
    - Tarjetas de Ingresos/Gastos con iconos circulares (TrendingUp/TrendingDown)
    - Fondo gris para todo el componente
    - Removido comportamiento sticky
  - **Daily Budget Banner**: Reubicado arriba de la barra de búsqueda
    - Texto actualizado a "DISPONIBLE DIARIO (X DÍAS RESTANTES)"
    - Formato mejorado con monto destacado
  - **Search & Filters Sticky**: Nueva sección sticky con búsqueda y filtros
    - Barra de búsqueda y filtros agrupados en un solo contenedor sticky
    - Se pegan debajo del header al hacer scroll (top-[83.7px])
  - **Filter Pills**: Nuevos filtros de transacciones
    - Pills: Gastos, Ingresos, Pendientes
    - Comportamiento toggle (click para activar/desactivar)
    - Iconos: TrendingDown, TrendingUp, Clock
    - Sin estados hover para mejor experiencia móvil
    - Feedback táctil con active:scale-95

### Fixed
- **Category/Group Edit Pages Scroll**: Fixed scroll position persisting when navigating from scrolled list pages
  - AddEditCategoryPage now resets scroll to top on mount
  - AddEditCategoryGroupPage now resets scroll to top on mount
  - Prevents icon/color picker from appearing cut off when entering from a scrolled position

## [0.8.0] - 2026-01-18

### Added
- **Transaction Status System**: Nuevo campo de estado para transacciones
  - Estados disponibles: "Pagado", "Pendiente", "Planeado"
  - Badge visual en TransactionItem que muestra el estado (solo si no es "Pagado")
  - Selector de estado en AddEditTransactionPage con 3 botones
  - Gastos recurrentes se replican automáticamente con estado "Pendiente"
  - Ingresos recurrentes se replican con estado "Pagado"
  - Color amarillo (amber) para "Pendiente", azul para "Planeado"
- **Feature Documentation**: Documento FEATURE_TRANSACTION_TAGS.md con análisis de 3 opciones de diseño

## [0.7.2] - 2026-01-18

### Added
- **Transaction Search**: Barra de búsqueda en la lista de transacciones
  - Filtra por nombre de transacción, categoría o notas
  - Icono de búsqueda y botón X para limpiar
  - Solo aparece si hay transacciones en el mes
  - Mensaje contextual cuando no hay resultados
  - **Sticky positioning**: Se mantiene fija debajo del BalanceCard al hacer scroll
- **Daily Totals in Transaction List**: Total diario al frente de cada fecha
  - Muestra total de gastos si solo hay gastos (gris)
  - Muestra total de ingresos si solo hay ingresos (verde)
  - Muestra balance (ingresos - gastos) si hay ambos (verde si positivo, gris si negativo)

## [0.7.1] - 2026-01-18

### Added
- **Daily Budget Banner**: Banner de presupuesto diario en HomePage
  - Muestra el presupuesto disponible por día basado en el balance actual
  - Botón X para cerrar con modal de confirmación
  - Opciones: "No volver a mostrar" (persistente) o "Solo por esta vez" (sesión)
  - Solo se muestra si el presupuesto diario es mayor a 0
  - Ubicado en área gris debajo del BalanceCard

### Changed
- **BalanceCard Sticky**: El BalanceCard ahora es sticky y permanece fijo al hacer scroll
- **Recurring Transaction Text**: Texto dinámico "Ingreso/Gasto recurrente mensual" según el tipo de transacción
- **RecurringBanner Text**: Cambiado "gastos recurrentes" a "registros recurrentes" para incluir ingresos

### Removed
- **StatsPage Daily Budget Banner**: Removido el banner de presupuesto diario de StatsPage (ahora está en HomePage)

## [0.7.0] - 2026-01-18

### Added
- **Category Month Detail Page**: New drill-down view for category expenses
  - Navigate from Stats page category cards to see all transactions in that category for the month
  - PageHeader pattern with centered category icon, total spent, and transaction count
  - Shows month label and transaction count with proper singular/plural handling
  - Clean transaction list without redundant category icons
  - Recurring transaction indicator (Repeat icon) on applicable items
  - Direct navigation to edit transaction from list
  - Auto-scroll to top on mount
  - Route: `/category/:categoryId/month/:month`

### Changed
- **Stats Page Categories**: Category cards now clickable for detailed view
  - Added navigation to CategoryMonthDetailPage on category card click
  - Enhanced user flow: Stats → Category Detail → Transaction Edit
- **Stats Page Charts**: Disabled animations to fix iOS touch event issues
  - All Recharts components now use `isAnimationActive={false}`
  - Resolved issue where chart animations blocked touch interactions on iPhone
  - Pie chart hover effects disabled with CSS to prevent visual glitches on tap

### Fixed
- **iOS Touch Events**: Fixed severe touch responsiveness issues on iPhone
  - Recharts animations were blocking touch events during animation
  - Required multiple taps to interact with UI elements when scrolling near charts
  - Solution: Disabled all chart animations across Pie, Bar, and Line charts
- **CategoryMonthDetailPage Scroll**: Page now scrolls to top on mount for better UX
- **Transaction Form Navigation**: Fixed double back press bug when creating categories from transaction form
  - Proper navigation history: Home → Create Transaction → Create Category → Back to Transaction (with preserved data) → Back to Home
  - Form data now preserved when navigating to/from category creation
  - New category automatically selected when returning from successful creation
  - Draft restoration works for both successful creation and cancellation scenarios
- **WelcomeGate Google Login**: Added account selector prompt to OAuth flow
  - `prompt: 'select_account'` forces Google to show account picker
  - Prevents automatic re-login with cached account
  - Applied to both ProfilePage and WelcomeGate components
- **BudgetOnboardingWizard Layout**: Improved carousel layout and UX
  - Extended carousel container to full height for better drag area
  - Content properly centered vertically within the viewport
  - Users can now swipe from anywhere on the screen, not just content area
  - Optimized slide structure for better mobile touch response
- **Transaction Delete Navigation**: Fixed bug where deleting a transaction would always navigate to home instead of going back to the previous page (e.g., CategoryMonthDetailPage)

### Changed
- **PageHeader Standardization**: All pages now use centralized PageHeader component
  - Refactored 6 pages: AddEditTransactionPage, AddEditCategoryPage, AddEditCategoryGroupPage, TripDetailPage, AddEditTripPage, AddEditTripExpensePage
  - Removed 54 lines of duplicate header code
  - PageHeader now supports React.ReactNode titles for custom multi-line headers
  - Consistent back button behavior and rightActions prop across all pages
- **Transaction Detail UX**: Removed intermediate detail page for faster editing
  - Transactions in list now navigate directly to edit page
  - Delete button moved to edit page header with ConfirmDialog
  - Removed TransactionDetailPage.tsx and `/transaction/:id` route
  - Streamlined navigation flow: tap transaction → edit immediately
- **Trips Module Refactoring**: Complete redesign following CLAUDE.md guidelines
  - **DatePicker Component**: All date inputs now use custom DatePicker modal instead of native `<input type="date">`
    - Spanish locale (es-CO) with readable format
    - Mobile-optimized calendar UI with year picker
    - Consistent UX across AddEditTripPage and AddEditTripExpensePage
    - CLAUDE.md updated with DatePicker pattern and usage guidelines
  - **TripsPage Layout**: Improved visual hierarchy
    - Added persistent "Mis Viajes" header when trips exist
    - Dynamic section titles: "Viaje actual" / "Próximos viajes" / "Otros viajes"
    - FAB (Floating Action Button) appears only when trips exist
    - Empty state shows centered "Crear viaje" button
  - **TripDetailPage UX**: Aligned with TransactionList pattern
    - Expense items now clickable buttons (navigate to edit on tap)
    - Removed 3-dot menu (RowMenu) from expense list
    - Delete button moved to PageHeader in AddEditTripExpensePage
    - FAB appears only when expenses exist (empty state shows centered button)
    - Section header "GASTOS (n)" only visible when expenses exist
  - **AddEditTripExpensePage**: Delete functionality in header
    - Trash icon button in PageHeader rightActions (edit mode only)
    - ConfirmDialog for delete confirmation
    - Consistent with AddEditTransactionPage pattern
  - **Design System Compliance**: All pages now follow CLAUDE.md specifications
    - Correct page structure: `flex min-h-screen flex-col bg-gray-50`
    - Proper content padding: `flex-1 px-4 pt-6 pb-8`
    - FAB specs: z-40, safe-area-inset, correct shadow
    - Border radius: rounded-xl for cards, rounded-2xl for buttons
    - Spanish locale (es-CO) for all date formatting

## [0.6.2] - 2026-01-17

### Fixed
- **Critical Cloud Sync**: Prevent catastrophic data loss on re-login by implementing 4-layer protection:
  - Block push if snapshot is empty (0 transactions and 0 trips)
  - Verify local has data before initial cloud push
  - Sync lock to prevent race conditions from multiple tabs/windows
  - Comprehensive logging for all critical sync operations

## [0.6.1] - 2026-01-17

### Fixed
- **Recurring Transactions**: Fixed bug where modified amounts during replication caused transactions to still appear as pending. Detection now matches by name, category, and type only (ignoring amount).
- **Month Selector**: Moved month selector to global header, now accessible from Home, Budget, and Stats pages.
- **Category Picker**: Fixed bug where newly created categories didn't appear in transaction form. CategoryPickerDrawer now reads from dynamic store instead of static constant.

## [0.6.0] - 2026-01-17

### Added
- **Recurring Transactions System**: Complete monthly recurring transaction management
  - Mark transactions as recurring with toggle in create/edit form
  - Automatic detection of recurring transactions from previous month not yet replicated
  - Mobile-first banner notification with emerald gradient design
  - Bottom sheet modal for reviewing and selecting which transactions to replicate
  - Editable amount inputs for adjusting values before replication
  - Visual indicator (Repeat icon) on recurring transaction items
  - Smart replication logic preserving day of month with edge case handling (e.g., Feb 31 → Feb 28)
  - localStorage-based ignore functionality per month to prevent spam
  - Full cloud sync support via Supabase

### Changed
- Schema migration from v3 to v4: added optional `isRecurring` field to Transaction model
- RecurringBanner uses X button to dismiss instead of separate action buttons
- Modal design changed to bottom sheet pattern for better mobile UX

### Technical
- New service: `recurringTransactions.service.ts` with detection and replication logic
- New components: `RecurringBanner.tsx`, `RecurringModal.tsx`
- Updated `TransactionItem.tsx` with recurring indicator
- Migration logic in `storage.service.ts` for schema v3→v4
- Updated all BudgetState references to schemaVersion 4

## [0.5.1] - 2026-01-17

### Added
- **Transaction Detail Page**: New full-screen detail view for transactions
  - Navigate to transaction detail by tapping any transaction in the list
  - View all transaction information (name, category, amount, type, date, notes)
  - Edit and Delete buttons in header for quick actions
  - Clean, card-based layout with rounded corners and shadows
  - Automatic redirect if transaction doesn't exist
- **Transaction Notes Support**: Optional notes field for transactions
  - Input field in create/edit transaction form
  - Persists to localStorage and cloud sync
  - Displays in transaction detail page when present
  - Draft support when navigating away from form
- **Date Grouping Helpers**: Smart date formatting for transaction groups
  - "Hoy" for today's transactions
  - "Ayer" for yesterday's transactions
  - "Viernes, 12 Abr" format for older dates
  - `formatDateGroupHeader()` and `formatTime()` utilities in dates.service

### Changed
- **Transaction List Redesign**: Complete UX overhaul inspired by modern finance apps
  - Removed context menu (long press) in favor of direct navigation
  - Gray background (`bg-gray-50`) for better visual hierarchy
  - Transactions grouped by date with semantic headers
  - White rounded cards (`rounded-xl`) with subtle shadows
  - Compact transaction items (40x40px icons, smaller text)
  - Layout: name + category on left, amount on right
  - No dividing lines between transactions
  - Reduced item height to show more transactions on screen
  - Performance optimized with `useMemo` for grouping logic
- HomePage background changed to gray for consistency
- Transaction type definition now includes optional `notes` field

### Technical
- New component: `TransactionItem.tsx` (extracted from TransactionList)
- New page: `TransactionDetailPage.tsx` with detail view
- New route: `/transaction/:id`
- Updated `AddTxInput` type to include optional notes
- Transaction grouping logic in TransactionList using `useMemo`
- TypeScript errors fixed (unused imports removed)

## [0.5.0] - 2026-01-17

### Added
- **Budget Onboarding Wizard**: Interactive full-screen carousel for first-time users
  - 4 educational slides explaining Budget module functionality
  - Embla Carousel integration (~5KB, touch-friendly)
  - Slides cover: Welcome, Setting Limits, Progress Monitoring, Balance vs Budget
  - Shows only once per user (localStorage flag: `budget.budgetOnboardingSeen.v1`)
  - Smooth fade transitions (300ms) with animated progress dots
  - Skip button on intermediate slides, "¡Entendido!" on final slide
  - Swipe navigation, clickable dots, and button controls
  - Minimalist full-screen design with large colorful icons
- **Stats Page**: Comprehensive data visualization module
  - Donut chart showing expense distribution by category (Recharts)
  - Bar chart comparing income vs expenses for last 6 months
  - Line chart showing expense trends over last 12 months
  - Quick Stats cards:
    - Daily average spending
    - Top spending category (with icon and color)
    - Day of week with most expenses
    - Month-over-month comparison (% with visual indicator)
  - Daily budget banner for current month (when budgets are set)
  - Empty states for charts with no data
  - All visualizations use Recharts library

### Changed
- Budget Page now shows onboarding wizard on first visit
- Stats tab now fully functional with real data visualizations

### Technical
- Added dependencies: `embla-carousel`, `embla-carousel-react`, `recharts`
- New Zustand state: `budgetOnboardingSeen` with localStorage persistence
- BudgetOnboardingWizard component with z-index 85
- Stats calculations optimized with useMemo hooks

## [0.4.0] - 2026-01-15

### Added
- **Budget Page**: New page with category limits and progress tracking
  - Set monthly limits per category
  - Visual progress bars showing spending vs budget
  - Real-time budget status indicators
- **Full Category Management**: Complete CRUD for categories and groups
  - Create, edit, and delete custom categories
  - Create, edit, and delete category groups
  - Categories can be reassigned between groups
- **Profile Page**: Modern full-page profile replacing the side drawer
  - Clean, DolarApp-inspired design
  - Quick access to categories management
  - Logout button at bottom for logged-in users

### Changed
- Category groups now fully customizable (add, edit, delete)
- Simplified category and group list views (removed context menus, kept only chevron navigation)
- Improved form UX with proper placeholder text for income vs expense transactions

### Fixed
- Form data now persists when creating a new category from transaction form
- Confirmation modal always appears when deleting categories or groups
- Default categories can now be deleted
- FAB button positioning on iOS devices with safe area insets
- Category groups properly migrate when loading from cloud
- Margin spacing between headers and tab controls

## [0.3.0] - 2026-01-15

### Added
- **Rich Category System**: Categories now have icons, colors, and grouping
  - 21 default categories (13 expense, 8 income)
  - Custom category creation with icon and color picker
  - Categories grouped by type (Food, Transport, Bills, etc.)
- **Travel Planner Module**: Track trip expenses separately
  - Create trips with budget, dates, and destination
  - Add expenses per trip with categories
  - View trip spending vs budget
- **Action Sheet**: New bottom drawer for adding transactions
  - Custom DatePicker component
  - Improved transaction form UX
- **Branding**: Rebranded to SmartSpend
  - New splash screen with logo
  - Updated app icons

### Changed
- FAB button moved from bottom bar to HomePage only
- Bottom bar now has 4 tabs (Home, Budget, Stats, Trips)
- Icon/Color picker unified into single modal with tabs
- UserDrawer replaced SideMenu with cleaner design
- Version display added to UserDrawer

### Fixed
- Default categories now properly sync to cloud for all users
- Category changes now trigger cloud sync
- Splash screen z-index above bottom bar
- Body scroll blocked when menus are open
- Heroku deployment uses SOURCE_VERSION for git hash

## [0.2.0] - Previous Release

- Initial PWA budget tracking app
- Local-first with optional cloud sync via Supabase
- Basic transaction tracking with categories
- Monthly budget overview
