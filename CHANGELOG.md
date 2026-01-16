# Changelog

All notable changes to SmartSpend will be documented in this file.

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
