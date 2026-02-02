# Testing Guide - SmartSpend

This document describes the testing strategy and critical test suites for SmartSpend.

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/services/pendingSync.service.test.ts

# Run tests in watch mode (for development)
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Critical Test Suites

### 1. PendingSync Service Tests

**Location:** `src/services/pendingSync.service.test.ts`

**Purpose:** Validate empty snapshot detection logic - **THE MOST CRITICAL TEST SUITE**.

**Critical Scenarios:**

- ✅ **Empty snapshot detection** - Correctly identifies snapshots with no actual data
- ✅ **Snapshot with transactions** - Detects as having data
- ✅ **Snapshot with categories** - Detects as having data
- ✅ **Snapshot with trips** - Detects as having data
- ✅ **Snapshot with budgets** - Detects as having data
- ✅ **Distinguish empty vs non-empty** - Core validation logic

**Why Most Critical:**
This is the **first line of defense against data loss**. These tests validate the exact logic that prevents empty localStorage from overwriting cloud data. The validation happens at the service level before any sync operations.

**Tests:** 20 tests, all passing ✅

### 2. ProfilePage Tests

**Location:** `src/features/profile/pages/ProfilePage.test.tsx`

**Purpose:** Ensure correct UI state for offline and session expiration scenarios.

**Critical Scenarios:**

- ✅ **No "Sesión Expirada" when offline** - Shows user account card with OFFLINE badge
- ✅ **Show "Sesión Expirada" when truly expired** - Shows reconnect prompt when online but no session
- ✅ **Status indicator colors** - Gray (offline), Teal (syncing), Green (synced)

**Tests:** 12 tests, all passing ✅

## Test Coverage Summary

```bash
✅ 514 tests passing across all test suites
✅ 20 critical tests for data loss prevention (pendingSync)
✅ 12 critical tests for offline UX (ProfilePage)
✅ 0 failing tests
```

## Why These Tests Matter

### Data Loss Prevention
The pendingSync tests are the **most important** tests in the codebase. They validate the core logic that prevented a critical production bug where empty localStorage would overwrite user data in the cloud.

**What they prevent:**
- ❌ Pushing empty state to cloud (would delete all user data)
- ❌ Confusing "empty" with "has data"
- ❌ Data loss when localStorage is cleared but cloud has data

### Offline UX
The ProfilePage tests ensure users have a good experience when offline:
- ✅ Shows correct status indicators
- ✅ Displays user info when offline
- ✅ Only shows "Session Expired" when truly expired (not just offline)
