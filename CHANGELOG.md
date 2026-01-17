# Changelog

All notable changes to SmartSpend will be documented in this file.

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
