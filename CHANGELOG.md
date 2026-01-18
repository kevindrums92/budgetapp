# Changelog

All notable changes to SmartSpend will be documented in this file.

## [unreleased] - {relase date}

### Added
- **Backup & Restore System (Phase 1 - Core)**: Manual backup and restore functionality
  - Export complete data snapshots to JSON files with metadata and checksum validation
  - Import backups with preview modal showing stats and warnings
  - Automatic safety backup created before restore operations
  - Local auto-backup system (keeps last 5 backups, max 5MB)
  - New Settings page accessible from Profile menu
  - Comprehensive error handling and data integrity verification
- **Backup & Restore System (Phase 2 - Auto-Local)**: Automatic periodic backups
  - BackupScheduler component for automatic local backups every 24 hours
  - LocalBackupList component showing all auto-backups with restore/delete actions
  - One-click restore from local backups with automatic safety backup
  - Smart backup pruning (keeps last 5, max 5MB total)
  - Visual feedback with formatted dates and file sizes
- **Backup & Restore System (Phase 3 - Cloud)**: Cloud backup functionality
  - CloudBackupScheduler component for automatic weekly cloud backups (every 7 days)
  - CloudBackupList component showing all cloud backups with restore/delete actions
  - Manual cloud backup creation via "Crear Backup" button
  - Supabase user_backups table with RLS policies for secure storage
  - Automatic cleanup of backups older than 30 days
  - Cloud backups only visible for authenticated users (cloudMode === "cloud")
  - Mobile-first modals for all confirmation dialogs

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
