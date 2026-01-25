/**
 * E2E Test Helpers
 * Shared utilities for Playwright tests
 */

import { Page } from '@playwright/test';

/**
 * Skip onboarding and set up minimal budget state for testing
 *
 * This helper:
 * 1. Marks onboarding as completed (v2)
 * 2. Creates a minimal budget state with essential default categories
 * 3. Allows tests to run without going through the full onboarding flow
 */
export async function skipOnboardingWithCategories(page: Page) {
  await page.evaluate(() => {
    // Clear ALL localStorage first to ensure clean state
    localStorage.clear();

    // Mark onboarding as completed
    // The storage service will automatically inject default categories
    // when it sees this flag with empty categoryDefinitions
    localStorage.setItem('budget.onboarding.completed.v2', 'true');
    localStorage.setItem('budget.onboarding.timestamp.v2', Date.now().toString());
  });
}
