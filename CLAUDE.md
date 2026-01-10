# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
