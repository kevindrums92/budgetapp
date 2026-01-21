# Changelog

All notable changes to SmartSpend will be documented in this file.

## [unreleased] - {relase date}

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
