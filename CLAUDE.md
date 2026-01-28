# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL RULES

### Git Workflow
**NEVER commit or push without explicit user authorization.**

- **ALWAYS ask before running `git commit`**
- **ALWAYS ask before running `git push`**
- **NEVER batch commit + push in a single command** unless explicitly instructed by the user
- After making code changes, STOP and ask the user:
  - "Should I commit these changes?"
  - Show a summary of what changed
  - Wait for explicit approval before proceeding
- Exception: Only skip asking if the user explicitly runs a command like `/ship` or says "commit and push this"

This ensures the user maintains full control over their git history and can review changes before they're committed.

## Build & Development Commands

```bash
npm run dev          # Start Vite dev server with HMR
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint on all files
npm run preview      # Preview production build locally
npm run start        # Run Express server (serves dist/, for Heroku)
```

## Architecture Overview

This is a **local-first PWA** budget tracking app built with React 19 + TypeScript + Vite. Data is stored in localStorage by default (guest mode) and optionally synced to Supabase when authenticated.

### Key Patterns

**State Management**: Zustand store (`src/state/budget.store.ts`) is the single source of truth. It:
- Hydrates from localStorage on init via `loadState()`
- Auto-persists on every mutation via `saveState()`
- Exposes `getSnapshot()` and `replaceAllData()` for cloud sync

**Cloud Sync Flow** (`src/components/CloudSyncGate.tsx`):
- Guest mode: data stays in localStorage only
- Cloud mode: authenticated users sync to Supabase `user_state` table
- Offline-first: pending changes stored via `pendingSync.service.ts`, pushed when online
- Debounced push (1.2s) on data changes

**Routing**: React Router v7 with pages in `src/pages/`. Form routes (`/add`, `/edit/:id`) hide the header/bottom bar.

### Directory Structure

- `src/state/` - Zustand store
- `src/services/` - Storage (localStorage), cloud state (Supabase), dates, pending sync
- `src/lib/` - Supabase client configuration
- `src/types/` - TypeScript types (Transaction, BudgetState)
- `src/components/` - Reusable UI components
- `src/pages/` - Route page components

### Path Alias

`@/` maps to `src/` (configured in vite.config.ts)

### Environment Variables

Requires `.env.local` with:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### PWA Configuration

PWA enabled via `vite-plugin-pwa` with auto-update. Workbox caches all static assets.

---

## Design Guidelines

### UI/UX Principles

**Mobile-First Design**: This is a mobile PWA. All UI must be optimized for touch interactions and small screens first.

**Language**: All user-facing text must be in Spanish (es-CO locale for dates/numbers).

**No Emojis in Code**: Never use emojis in user-facing text unless explicitly requested. Exception: existing patterns like "💡" in help text.

**Color Palette**:
- Primary accent: `#18B7B0` (teal, used in bottom bar active state)
- Income: `emerald-500` / `emerald-600` / `text-emerald-600`
- Expense: `gray-900` / `text-gray-900` or `red-500` / `red-600`
- Success: `emerald-500`
- Destructive: `red-500`
- Neutral backgrounds: `bg-gray-50` (page), `bg-white` (cards)

### Page Layouts

#### Full-Screen Pages (with PageHeader)

Pages that use `PageHeader` component do NOT show the bottom bar. These are detail/form pages.

**Pattern**:
```tsx
<div className="flex min-h-screen flex-col bg-gray-50">
  <PageHeader
    title="Título"
    rightActions={<button>...</button>} // optional
  />

  {/* Content */}
  <div className="flex-1 px-4 pt-6 pb-8">
    {/* Page content */}
  </div>
</div>
```

**Examples**: CategoriesPage, BackupPage, ProfilePage

**PageHeader Specs**:
- Sticky: `sticky top-0 z-10`
- Background: `bg-white`
- Shadow: `shadow-sm`
- Padding: `px-4 py-4`
- Back button: ChevronLeft icon (size 24), navigates -1
- Title: `text-lg font-semibold text-gray-900`
- Right actions: Optional buttons (Plus, FolderOpen, etc.)

#### Home Pages (with BottomBar)

Pages that show the bottom navigation bar (Home, Budget, Stats, Trips).

**Pattern**:
```tsx
<div className="bg-gray-50 min-h-screen">
  {/* Content with bottom padding to avoid bottom bar */}
  <main className="pb-28 pt-4">
    {/* Content */}
  </main>
</div>
```

**BottomBar Specs** (src/components/BottomBar.tsx):
- Fixed: `fixed inset-x-0 -bottom-1 z-50`
- Background: `bg-white/99 backdrop-blur-xl`
- Shadow: `shadow-[0_-10px_30px_rgba(0,0,0,0.10)]`
- Border: `border-t border-gray-200/70`
- Safe area: `pb-[calc(env(safe-area-inset-bottom)+10px)]`
- Active color: `text-[#18B7B0]`
- Inactive color: `text-gray-500`
- Icon size: 22px, strokeWidth 2.2 (active) / 1.8 (inactive)

#### Onboarding Pages (Fullscreen wizard screens)

Onboarding pages are fullscreen wizard-style screens with scrollable content and a fixed button at the bottom. Used for feature introductions (Welcome, Budget onboarding, etc.).

**CRITICAL Layout Rules**:
- Use `h-dvh` (exact viewport height), **NEVER** `min-h-dvh`
- Button must be **outside** the scrollable area as a `shrink-0` flex child
- **NEVER** use `position: absolute` for the bottom button
- Main content uses `flex-1 overflow-y-auto` for scrolling

**Complete Pattern**:
```tsx
import { ChevronLeft } from 'lucide-react';
import SlideAnimation from '@/features/onboarding/components/SlideAnimation';
import ProgressDots from '@/features/onboarding/components/ProgressDots';

type Props = {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  showBack: boolean;
  showSkip: boolean;
  isLast: boolean;
  currentStep: number;
  totalSteps: number;
};

export default function OnboardingScreen({
  onNext,
  onBack,
  onSkip,
  showBack,
  showSkip,
  currentStep,
  totalSteps,
}: Props) {
  return (
    <div
      className="flex h-dvh flex-col bg-gray-50 dark:bg-gray-950"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
      }}
    >
      {/* Header - shrink-0 */}
      <header className="z-10 flex shrink-0 items-center justify-between px-6 pb-2 pt-4">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 active:bg-gray-100 dark:active:bg-gray-800"
            aria-label="Volver"
          >
            <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
        ) : (
          <div className="h-10 w-10" /> {/* Spacer */}
        )}

        <ProgressDots total={totalSteps} current={currentStep} />

        {showSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
          >
            Omitir
          </button>
        ) : (
          <div className="h-10 w-10" /> {/* Spacer */}
        )}
      </header>

      {/* Main Content - flex-1 overflow-y-auto (SCROLLABLE) */}
      <main className="flex-1 overflow-y-auto px-6 pt-4">
        {/* Title Section */}
        <div className="mb-6">
          <SlideAnimation direction="right" delay={0}>
            <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
              Título de la Pantalla
            </h1>
          </SlideAnimation>

          <SlideAnimation direction="up" delay={50}>
            <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
              Descripción breve del contenido de esta pantalla.
            </p>
          </SlideAnimation>
        </div>

        {/* Content with animations */}
        <SlideAnimation direction="up" delay={100}>
          <div className="mb-4 rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            {/* Card content */}
          </div>
        </SlideAnimation>

        {/* More content... */}
      </main>

      {/* CTA Button - shrink-0 (FIXED at bottom, NOT absolute) */}
      <div className="shrink-0 px-6 pt-4 pb-2">
        <button
          type="button"
          onClick={onNext}
          className="w-full rounded-2xl bg-gray-900 dark:bg-emerald-500 py-4 text-base font-bold text-white transition-all active:scale-[0.98]"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
```

**Layout Structure Explained**:
```
┌─────────────────────────────┐
│  Header (shrink-0)          │  ← Fixed height, doesn't shrink
│  [Back] [Progress] [Skip]   │
├─────────────────────────────┤
│                             │
│  Main Content (flex-1)      │  ← Takes remaining space
│  overflow-y-auto            │  ← Scrolls when content is tall
│                             │
│  - Title                    │
│  - Cards                    │
│  - Info boxes               │
│                             │
├─────────────────────────────┤
│  Button (shrink-0)          │  ← Fixed height, doesn't shrink
│  [Continuar]                │
└─────────────────────────────┘
```

**Available Components**:

1. **SlideAnimation** (`@/features/onboarding/components/SlideAnimation`):
   - Props: `direction` ("up" | "down" | "left" | "right"), `delay` (ms)
   - Wraps content with entrance animation
   - Use staggered delays (0, 50, 100, 150...) for sequential reveals

2. **ProgressDots** (`@/features/onboarding/components/ProgressDots`):
   - Props: `total` (number), `current` (number)
   - Shows progress indicator dots

**Onboarding Screen Specs**:
- Outer container: `flex h-dvh flex-col` (CRITICAL: `h-dvh` not `min-h-dvh`)
- Safe area: `paddingTop/Bottom: max(env(safe-area-inset-*), 16px)`
- Header: `shrink-0`, `z-10`
- Main: `flex-1 overflow-y-auto px-6 pt-4`
- Button container: `shrink-0 px-6 pt-4 pb-2`
- Title: `text-3xl font-extrabold leading-tight tracking-tight`
- Subtitle: `text-base leading-relaxed text-gray-600`
- Cards: `rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm`

**Common Mistakes to Avoid**:

❌ Using `min-h-dvh` instead of `h-dvh`
✅ Always use `h-dvh` for exact viewport height (enables proper scrolling)

❌ Using `position: absolute` for the bottom button
✅ Use flexbox with `shrink-0` (button stays at bottom naturally)

❌ Using `OnboardingLayout` component for screens with lots of content
✅ Create custom layout directly when content needs to scroll

❌ Forgetting spacers when back/skip buttons are hidden
✅ Always render `<div className="h-10 w-10" />` as placeholder

❌ Not using `shrink-0` on header and button container
✅ Both must have `shrink-0` to prevent flex shrinking

**Examples**:
- `src/features/budget/components/onboarding/Screen1_Welcome.tsx`
- `src/features/budget/components/onboarding/Screen2_FlexiblePeriods.tsx`
- `src/features/budget/components/onboarding/Screen3_RecurringBudgets.tsx`
- `src/features/budget/components/onboarding/Screen4_VisualTracking.tsx`

---

#### Form Pages (Fullscreen, no header component)

Special case: Transaction form uses a custom minimal header (not PageHeader).

**Pattern** (AddEditTransactionPage):
```tsx
<div className="min-h-dvh bg-white">
  {/* Custom minimal header */}
  <div className="sticky top-0 z-20 bg-white">
    <div className="mx-auto max-w-xl px-4">
      <div className="flex h-14 items-center gap-3">
        <button /* back button */>
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="text-base font-semibold text-gray-900">
          {title}
        </h1>
      </div>
    </div>
  </div>

  {/* Form content */}

  {/* Fixed bottom button */}
  <div className="fixed inset-x-0 bottom-0 z-30 bg-white">
    <div className="mx-auto max-w-xl px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
      <button>Guardar</button>
    </div>
  </div>
</div>
```

### Component Patterns

#### Modals & Dialogs

**NEVER use browser `alert()`, `confirm()`, or `prompt()`**. Always create custom mobile-first modals.

**Confirmation Modal Pattern** (Delete, Restore, etc.):

```tsx
{confirmDelete && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/50"
      onClick={() => setConfirmDelete(false)}
    />

    {/* Modal Card */}
    <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        Eliminar movimiento
      </h3>
      <p className="mb-4 text-sm text-gray-600">
        ¿Seguro que deseas eliminar "Cita ortopedia" por $ 110.000?
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setConfirmDelete(false)}
          className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-medium text-white hover:bg-red-600"
        >
          Eliminar
        </button>
      </div>
    </div>
  </div>
)}
```

**Success/Error Modal Pattern**:

```tsx
{successMessage && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div
      className="absolute inset-0 bg-black/50"
      onClick={() => setSuccessMessage(null)}
    />
    <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        {successMessage.includes("exitosamente") ? "✅ Éxito" : "❌ Error"}
      </h3>
      <p className="mb-4 text-sm text-gray-600">
        {successMessage}
      </p>
      <button
        type="button"
        onClick={() => setSuccessMessage(null)}
        className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
      >
        OK
      </button>
    </div>
  </div>
)}
```

**Modal Specs (CRITICAL - Follow exactly)**:
- **Position**: ALWAYS centered in viewport (`fixed inset-0 z-50 flex items-center justify-center`)
- **NEVER use bottom sheet pattern for confirmation modals** - those are ONLY for action selection
- Overlay container: `fixed inset-0 z-50 flex items-center justify-center`
- Backdrop: `absolute inset-0 bg-black/50` with onClick to close
- Card: `relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl`
- Title: `text-lg font-semibold text-gray-900` with `mb-2`
- Body text: `text-sm text-gray-600` with `mb-4`
- Button container: `flex gap-3` for two buttons, or `w-full` for single button
- Cancel button: `flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200`
- Confirm button: `flex-1 rounded-xl bg-blue-500 py-3 text-sm font-medium text-white hover:bg-blue-600`
- Delete button: `flex-1 rounded-xl bg-red-500 py-3 text-sm font-medium text-white hover:bg-red-600`
- Success button: `w-full rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600`

**Bottom Sheets (Drawers)**:

Used for action selection, pickers (AddActionSheet, CategoryPickerDrawer).

```tsx
<div className="fixed inset-0 z-[70]">
  {/* Backdrop */}
  <button
    type="button"
    className="absolute inset-0 bg-black"
    onClick={onClose}
    style={{ opacity: backdropOpacity }}
  />

  {/* Sheet */}
  <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white shadow-2xl">
    {/* Drag handle */}
    <div className="flex justify-center py-3">
      <div className="h-1 w-10 rounded-full bg-gray-300" />
    </div>

    {/* Content */}
    <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
      {/* Sheet content */}
    </div>
  </div>
</div>
```

**Bottom Sheet Specs**:
- Z-index: `z-[70]`
- Border radius: `rounded-t-3xl` (top corners only)
- Drag handle: `h-1 w-10 rounded-full bg-gray-300`
- Safe area padding: `pb-[calc(env(safe-area-inset-bottom)+16px)]`

**Z-Index Layers** (CRITICAL - Never overlap):
- Header/PageHeader: `z-10`
- Sticky elements: `z-20`
- Fixed bottom buttons: `z-30`
- FAB button: `z-40`
- Drawers/CategoryPicker: `z-40`
- BottomBar: `z-50`
- Modals: `z-50`
- Bottom Sheets: `z-[70]`
- Wizard/Onboarding: `z-[85]`

#### Buttons

**Primary Action Button** (Full width, large):
```tsx
<button
  type="button"
  onClick={handleSave}
  disabled={!canSave}
  className="w-full rounded-2xl bg-emerald-500 py-4 text-base font-semibold text-white transition-colors hover:bg-emerald-600 disabled:bg-gray-300"
>
  Guardar
</button>
```

**Expense/Income Buttons** (Transaction forms):
- Expense: `bg-gray-900 hover:bg-gray-800` with `active:scale-[0.98]`
- Income: `bg-emerald-500 hover:bg-emerald-600` with `active:scale-[0.98]`
- Border radius: `rounded-2xl`
- Padding: `py-4`
- Font: `text-base font-semibold text-white`

**Modal Buttons** (Confirmation dialogs):
- Cancel: `flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200`
- Confirm: `flex-1 rounded-xl bg-blue-500 py-3 text-sm font-medium text-white hover:bg-blue-600`
- Delete: `flex-1 rounded-xl bg-red-500 py-3 text-sm font-medium text-white hover:bg-red-600`
- Success OK: `w-full rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600`

**Small Action Buttons** (List items):
```tsx
<button
  type="button"
  onClick={() => handleRestore(entry)}
  className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white active:bg-blue-600 disabled:opacity-50"
>
  Restaurar
</button>
```

**Icon Buttons** (Header actions):
```tsx
<button
  type="button"
  onClick={handleAction}
  className="rounded-full p-2 hover:bg-gray-100"
>
  <Plus className="h-5 w-5 text-gray-700" />
</button>
```

**FAB (Floating Action Button)**:
```tsx
<button
  type="button"
  className="fixed right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] active:scale-95 transition-transform"
  style={{ bottom: "calc(env(safe-area-inset-bottom) + 96px)" }}
>
  <Plus size={26} strokeWidth={2.2} />
</button>
```

**Tabs** (Type selector):
```tsx
<div className="flex gap-2 bg-white px-4 pt-3 pb-4">
  <button
    type="button"
    onClick={() => setActiveTab("expense")}
    className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
      activeTab === "expense"
        ? "bg-gray-900 text-white"
        : "bg-gray-100 text-gray-600"
    }`}
  >
    Gastos
  </button>
  <button
    type="button"
    onClick={() => setActiveTab("income")}
    className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
      activeTab === "income"
        ? "bg-emerald-500 text-white"
        : "bg-gray-100 text-gray-600"
    }`}
  >
    Ingresos
  </button>
</div>
```

**Toggle Switch** (Recurring transaction):
```tsx
<div
  className={`relative h-8 w-14 shrink-0 rounded-full transition-all duration-200 ${
    isRecurring ? "bg-emerald-500" : "bg-gray-300"
  }`}
>
  <span
    className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
      isRecurring ? "translate-x-6" : "translate-x-0"
    }`}
  />
</div>
```

**Disabled States**: Always add `disabled:opacity-50` or `disabled:bg-gray-300`

#### Form Inputs

**Transaction Form Field Pattern** (Icon + Label + Input):
```tsx
<div className="py-4">
  <div className="flex items-start gap-4">
    {/* Icon Circle */}
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
      <MessageSquare className="h-5 w-5 text-gray-500" />
    </div>

    {/* Label + Input */}
    <div className="flex-1">
      <label className="mb-1 block text-xs font-medium text-gray-500">
        Descripción
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="¿En qué gastaste?"
        className="w-full border-0 p-0 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
      />
    </div>
  </div>
</div>
```

**Input Specs**:
- No border: `border-0`
- No padding: `p-0`
- Font: `text-base text-gray-900`
- Placeholder: `placeholder:text-gray-400`
- Focus: `focus:outline-none focus:ring-0`

**Card-Style Input** (Category/Group forms):
```tsx
<div className="rounded-2xl bg-white p-4 shadow-sm">
  <label className="mb-1 block text-xs font-medium text-gray-500">
    Descripción
  </label>
  <input
    type="text"
    value={name}
    onChange={(e) => setName(e.target.value)}
    placeholder="Nombre de la categoría"
    className="w-full text-base text-gray-900 outline-none placeholder:text-gray-400"
  />
</div>
```

**Amount Input** (Large display):
```tsx
<div className="text-center">
  <p className="mb-2 text-sm font-medium text-gray-500">Monto</p>
  <div className="flex items-center justify-center">
    <span className="text-5xl font-semibold tracking-tight text-gray-900">$</span>
    <input
      type="text"
      inputMode="decimal"
      value={amount}
      onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
      placeholder="0"
      className="w-auto min-w-[60px] max-w-[200px] border-0 bg-transparent p-0 text-center text-5xl font-semibold tracking-tight placeholder:text-gray-300 focus:outline-none focus:ring-0 text-gray-900"
      style={{ width: `${Math.max(60, (amount.length || 1) * 32)}px` }}
    />
  </div>
</div>
```

**Date Input (ALWAYS use DatePicker component)**:

CRITICAL: NEVER use native `<input type="date">`. Always use the custom `DatePicker` component for all date selections.

**Pattern**:
```tsx
import DatePicker from "@/components/DatePicker";
import { Calendar } from "lucide-react";
import { useState } from "react";

// In component:
const [date, setDate] = useState(todayISO());
const [showDatePicker, setShowDatePicker] = useState(false);

// Helper to format date for display
function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Date button (clickable card)
<button
  type="button"
  onClick={() => setShowDatePicker(true)}
  className="rounded-2xl bg-white p-4 shadow-sm text-left"
>
  <label className="mb-1 block text-xs font-medium text-gray-500">
    Fecha
  </label>
  <div className="flex items-center gap-2">
    <Calendar size={18} className="text-gray-400" />
    <span className="text-base text-gray-900">
      {formatDate(date)}
    </span>
  </div>
</button>

// DatePicker component (at end of component, before closing div)
<DatePicker
  open={showDatePicker}
  onClose={() => setShowDatePicker(false)}
  value={date}
  onChange={setDate}
/>
```

**DatePicker Props**:
- `open`: boolean - Controls visibility
- `onClose`: () => void - Close handler
- `value`: string - Date in YYYY-MM-DD format
- `onChange`: (date: string) => void - Returns date in YYYY-MM-DD format

**DatePicker Features**:
- Custom modal calendar UI (not native datepicker)
- Spanish locale (es-CO)
- Year picker with scroll
- Month/day grid navigation
- Mobile-optimized touch targets
- Automatic animation on open/close
- Z-index: `z-[80]` (higher than modals)

**Keyboard Dismiss Hook (ALWAYS use for pages with inputs)**:

CRITICAL: ALWAYS use the `useKeyboardDismiss` hook in any page or component that contains text inputs, textareas, or search fields. This provides a native mobile app experience by automatically closing the keyboard when the user scrolls or touches outside the input.

**Pattern**:
```tsx
import { useKeyboardDismiss } from "@/hooks/useKeyboardDismiss";

export default function MyPage() {
  // Dismiss keyboard on scroll or touch outside
  useKeyboardDismiss();

  return (
    <div>
      <input type="text" />
      {/* ... more inputs ... */}
    </div>
  );
}
```

**When to use**:
- ✅ Pages with form inputs (AddEditTransactionPage, AddEditCategoryPage, etc.)
- ✅ Pages with search fields (HistoryPage, CurrencySettingsPage, etc.)
- ✅ Modals/drawers with inputs (AddEditBudgetModal, CategoryPickerDrawer, etc.)
- ✅ Authentication forms (LoginForm, RegisterForm, etc.)

**How it works**:
- Closes keyboard when user scrolls (after 500ms of focusing)
- Closes keyboard when user touches outside the active input
- Does NOT close when switching between inputs
- Does NOT interfere with auto-scroll when focusing inputs

**Hook location**: `src/hooks/useKeyboardDismiss.ts`

#### Cards & Containers

**Page Background**: `bg-gray-50` (NEVER use `bg-white` for pages)

**Card/Section**: `bg-white rounded-xl p-4 shadow-sm`

**Category Card** (List item):
```tsx
<button
  type="button"
  onClick={() => navigate(`/category/${category.id}/edit`)}
  className="flex w-full items-center gap-3 rounded-xl bg-white p-4 shadow-sm hover:bg-gray-50 transition-colors"
>
  {/* Icon */}
  <div
    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
    style={{ backgroundColor: category.color + "20" }}
  >
    <IconComponent className="h-5 w-5" style={{ color: category.color }} />
  </div>

  {/* Content */}
  <span className="flex-1 text-left font-medium text-gray-900">
    {category.name}
  </span>

  {/* Chevron */}
  <ChevronRight className="h-5 w-5 text-gray-300" />
</button>
```

**Transaction Item** (List item):
```tsx
<button
  type="button"
  onClick={onClick}
  className="w-full flex items-center gap-3 bg-white px-4 py-3 active:bg-gray-50 transition-colors"
>
  {/* Icon */}
  <div
    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
    style={{ backgroundColor: category.color + "20" }}
  >
    <IconComponent className="h-5 w-5" style={{ color: category.color }} />
  </div>

  {/* Info */}
  <div className="min-w-0 flex-1 text-left">
    <p className="truncate font-semibold text-gray-900 text-sm">
      {transaction.name}
    </p>
    <p className="text-xs text-gray-500">
      {category.name}
    </p>
  </div>

  {/* Amount */}
  <div className="text-right">
    <p className="whitespace-nowrap font-semibold text-sm text-gray-900">
      -{formatCOP(transaction.amount)}
    </p>
  </div>
</button>
```

**Icon Circle Backgrounds**:
- Use color + opacity: `style={{ backgroundColor: category.color + "20" }}`
- Default gray: `bg-gray-100`
- Sizes: `h-10 w-10` (transaction), `h-11 w-11` (category), `h-12 w-12` (bottom sheet action)

**Divider**: `border-t border-gray-200 my-6`

**Empty State**:
```tsx
<div className="rounded-xl bg-gray-50 p-4 text-center">
  <HardDrive className="mx-auto h-8 w-8 text-gray-400" />
  <p className="mt-2 text-sm text-gray-500">
    No hay backups automáticos locales
  </p>
  <p className="mt-1 text-xs text-gray-400">
    Se crean automáticamente cada 7 días
  </p>
</div>
```

### Spacing & Layout

**Padding**:
- Page container: `px-4 pt-6 pb-8`
- Cards: `p-4`
- Modals: `p-6`
- Bottom sheets: `px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]`
- Form fields (transaction): `py-4`
- Sections: `space-y-4` or `space-y-6`

**Gaps**:
- Button groups (modal): `gap-3`
- Icon + text: `gap-2` or `gap-3` or `gap-4` (depends on component)
- Lists: `space-y-2`
- Tabs: `gap-2`

**Safe Area Insets** (iOS notch/home indicator):
- Bottom fixed buttons: `pb-[calc(env(safe-area-inset-bottom)+16px)]`
- BottomBar: `pb-[calc(env(safe-area-inset-bottom)+10px)]`
- FAB positioning: `style={{ bottom: "calc(env(safe-area-inset-bottom) + 96px)" }}`

**Border Radius** (CRITICAL - Follow exactly):
- Small buttons/inputs: `rounded-lg`
- Medium cards/buttons: `rounded-xl`
- Large buttons/cards: `rounded-2xl`
- Bottom sheets (top only): `rounded-t-3xl`
- Circles (icons): `rounded-full`
- Icon backgrounds (square): `rounded-xl` (11x11), `rounded-full` (10x10)

**Responsive Max Width**:
- Modals: `max-w-sm`
- Forms: `max-w-xl` (transaction form uses this)
- Content: `max-w-lg`

### Typography

**Headings**:
- PageHeader title: `text-lg font-semibold text-gray-900`
- Transaction form header: `text-base font-semibold text-gray-900`
- Section header: `text-sm font-semibold text-gray-700`
- Modal title: `text-lg font-semibold text-gray-900` with `mb-2`
- Bottom sheet title: `text-lg font-semibold text-gray-900` with `mb-4` and `text-center`

**Form Labels**:
- Input label: `text-xs font-medium text-gray-500` with `mb-1 block`
- Section label: `text-xs font-semibold text-gray-500 uppercase tracking-wide`

**Body Text**:
- Input value: `text-base text-gray-900`
- Modal body: `text-sm text-gray-600`
- List item primary: `text-sm font-semibold text-gray-900` or `font-medium text-gray-900`
- List item secondary: `text-xs text-gray-500`
- Help text: `text-xs text-gray-500` or `text-xs text-gray-400`

**Large Display Text**:
- Amount input: `text-5xl font-semibold tracking-tight`
- Button large: `text-base font-semibold`
- Button medium: `text-sm font-medium`
- Button small: `text-xs font-medium`

**Text Colors** (Transaction amounts):
- Income: `text-emerald-600`
- Expense: `text-gray-900` (not red!)
- Income accent (buttons): `text-emerald-600`
- Expense accent (buttons): `text-gray-900`

**Placeholder Colors**:
- Input placeholder: `placeholder:text-gray-400`
- Large amount placeholder: `placeholder:text-gray-300`

**Bottom Bar Text**:
- Font size: `text-[11px]`
- Active: `text-[#18B7B0]`
- Inactive: `text-gray-500`
- Tracking: `tracking-tight`
- Leading: `leading-none`

### Icons

**Source**: Use `lucide-react` icons exclusively

**Sizes** (Use `size=` prop, not className):
- Tiny inline (recurring indicator): `size={14}` → `h-3 w-3`
- Small inline: `size={14}` or `size={16}`
- Medium (most UI icons): `size={18}`, `size={20}`, `size={22}`
- Large (headers, back buttons): `size={24}`, `size={26}`
- Form field icons: `h-5 w-5` (inside circles)
- Category/Transaction icons: `h-5 w-5` (inside colored circles)
- Empty state icons: `h-8 w-8`
- Bottom sheet action icons: `h-6 w-6`

**Icon Usage Patterns**:

**Category/Transaction Icon** (with colored background):
```tsx
<div
  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
  style={{ backgroundColor: category.color + "20" }}
>
  <IconComponent className="h-5 w-5" style={{ color: category.color }} />
</div>
```

**Form Field Icon** (gray circle):
```tsx
<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
  <MessageSquare className="h-5 w-5 text-gray-500" />
</div>
```

**Icon Button** (header):
```tsx
<button className="rounded-full p-2 hover:bg-gray-100">
  <Plus className="h-5 w-5 text-gray-700" />
</button>
```

**Converting kebab-case icons**:
```typescript
function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

const IconComponent = icons[kebabToPascal(category.icon) as keyof typeof icons];
```

### Animations & Transitions

**Modal Entrance** (Fade + Scale):
```tsx
const [isVisible, setIsVisible] = useState(false);

useEffect(() => {
  requestAnimationFrame(() => setIsVisible(true));
}, []);

// Overlay
className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-200 ${
  isVisible ? "opacity-100" : "opacity-0"
}`}

// Modal card
className={`bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 transform transition-all duration-200 ${
  isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
}`}
```

**Bottom Sheet Slide-Up**:
```tsx
const [isAnimating, setIsAnimating] = useState(false);

useEffect(() => {
  if (open) {
    setIsVisible(true);
    const timer = setTimeout(() => setIsAnimating(true), 10);
    return () => clearTimeout(timer);
  } else {
    setIsAnimating(false);
    const timer = setTimeout(() => setIsVisible(false), 300);
    return () => clearTimeout(timer);
  }
}, [open]);

// Sheet transform
const sheetTranslate = isAnimating ? 0 : SHEET_HEIGHT;
style={{
  transform: `translateY(${sheetTranslate}px)`,
  transition: "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)"
}}
```

**Button Interactions**:
- Large buttons: `active:scale-[0.98] transition-all`
- Small buttons: `active:scale-95 transition-transform`
- Icon buttons: `active:scale-95 transition-all`
- List items: `active:bg-gray-50 transition-colors`

**Hover States** (Desktop):
- Buttons: `hover:bg-gray-100`
- Cards: `hover:bg-gray-50 transition-colors`
- Colored buttons: `hover:bg-emerald-600`, `hover:bg-red-600`, etc.

**Transition Classes**:
- Colors: `transition-colors`
- Transform: `transition-transform`
- All: `transition-all`
- Opacity: `transition-opacity duration-200`
- Custom: `transition-all duration-200`

### Shadows

**Shadow Specs** (CRITICAL):
- Cards: `shadow-sm`
- Modals: `shadow-xl` or `shadow-2xl`
- Bottom sheets: `shadow-2xl`
- BottomBar: `shadow-[0_-10px_30px_rgba(0,0,0,0.10)]` (upward shadow)
- FAB: `shadow-[0_8px_24px_rgba(0,0,0,0.25)]`
- Fixed bottom button: `shadow-[0_-2px_10px_rgba(0,0,0,0.05)]` (subtle upward)
- Toggle switch knob: `shadow-md`

### Date Formatting

Always use `es-CO` locale:

```typescript
date.toLocaleString("es-CO", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})
```

### Error Handling

**User-Facing Errors**: Show in modals with clear Spanish messages, never use `alert()`

**Console Logging**: Use namespace pattern: `console.log("[ComponentName] Message")`

**Try-Catch**: Always wrap async operations, show error modal on failure

### Accessibility

**Buttons**: Always use `type="button"` to prevent form submission

**Click Handlers**: Use `onClick` on buttons, not divs (unless with proper role)

**Focus States**: Include `focus:outline-none focus:ring-2 focus:ring-blue-500` where appropriate

### State Management

**Local State**: Use `useState` for UI-only state (modals, dropdowns, form inputs)

**Global State**: Use Zustand store (`useBudgetStore`) for data that persists or is shared across components

**Loading States**: Always show loading state for async operations (`isLoading`, `isRestoring`, etc.)

**Optimistic Updates**: Update UI immediately, handle errors gracefully

### File Organization

**Component Files**: One component per file, named exports only

**Service Files**: Pure functions, no React hooks, export named functions

**Type Files**: Shared types in `src/types/`, component-specific types can be inline

### Common Patterns

**Category Color with Opacity**:
```typescript
style={{ backgroundColor: category.color + "20" }}  // Adds 20% opacity
style={{ color: category.color }}  // Full color for icon
```

**Conditional Classes** (Tab active state):
```tsx
className={`base-classes ${
  isActive ? "active-classes" : "inactive-classes"
}`}
```

**Icon Component Rendering**:
```tsx
const IconComponent = icons[kebabToPascal(category.icon) as keyof typeof icons];

{IconComponent && (
  <IconComponent className="h-5 w-5" style={{ color: category.color }} />
)}
```

**Number Formatting**:
```typescript
// Use formatCOP utility for currency
formatCOP(transaction.amount)  // → "110.000"

// Input: only allow numbers and decimal
onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
```

**Date Formatting Patterns**:
```typescript
// Full date with time
date.toLocaleString("es-CO", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

// Date only (transaction form)
new Date(date + "T12:00:00").toLocaleDateString("es-CO", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
})
```

**Body Scroll Locking** (Modals/Sheets):
```tsx
useEffect(() => {
  if (open) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
  return () => {
    document.body.style.overflow = "";
  };
}, [open]);
```

### Common Mistakes to Avoid

❌ Using `alert()`, `confirm()`, `prompt()`
✅ Use custom modals with mobile-first design matching exact pattern

❌ English text in UI
✅ Always Spanish (es-CO locale)

❌ `bg-white` for page backgrounds
✅ `bg-gray-50` for pages, `bg-white` for cards only

❌ Inconsistent border radius (rounded-md, rounded-lg in wrong places)
✅ Follow documented border radius: xl for cards, 2xl for large buttons, t-3xl for bottom sheets

❌ Wrong modal structure or missing backdrop
✅ Follow exact confirmation modal pattern with backdrop onClick

❌ `z-index` without checking layer hierarchy
✅ Use documented z-index layers (never invent new ones)

❌ Missing `type="button"` on buttons
✅ Always specify `type="button"` to prevent form submission

❌ Hardcoded dates without locale
✅ Use `es-CO` locale for ALL date formatting

❌ Red color for expense amounts
✅ Use `text-gray-900` for expenses, `text-emerald-600` for income

❌ Forgetting safe area insets on iOS
✅ Use `calc(env(safe-area-inset-bottom) + Xpx)` for bottom padding

❌ Icon size as className instead of size prop
✅ Use `size={24}` prop for lucide-react icons, not `className="h-6 w-6"`

❌ Missing transitions on interactive elements
✅ Add `transition-colors`, `transition-all`, or `transition-transform`

❌ Wrong shadow (using shadow-lg instead of shadow-sm on cards)
✅ Follow documented shadow specs: shadow-sm for cards, shadow-xl for modals

### Testing Checklist

Before committing UI changes:
- [ ] No browser alerts/confirms (only custom modals)
- [ ] All text in Spanish (es-CO)
- [ ] Mobile-responsive (test at 375px width minimum)
- [ ] Touch targets min 44x44px (especially buttons)
- [ ] Loading states implemented (isLoading, disabled states)
- [ ] Error handling with user-friendly Spanish messages
- [ ] TypeScript errors resolved (npm run build passes)
- [ ] Console logs use namespace pattern `[ComponentName]`
- [ ] All buttons have `type="button"`
- [ ] Z-index follows documented hierarchy
- [ ] Border radius matches patterns (xl, 2xl, t-3xl)
- [ ] Colors match palette (emerald for income, gray-900 for expense)
- [ ] Safe area insets for bottom elements
- [ ] Shadows match documented specs
- [ ] Icons use `size=` prop, not className for size
- [ ] Transitions on interactive elements
- [ ] Backdrop with onClick on modals/sheets
- [ ] Category colors use +20 opacity pattern
