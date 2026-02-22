/**
 * E2E Tests: Navigation & Tab Switching (Tier 2)
 *
 * Tests tab navigation, back button behavior,
 * and that form pages hide the bottom bar.
 */

import { test, expect } from '@playwright/test';
import { setupTestUser, mockSupabase } from '../test-helpers';

test.describe('Navigation & Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setupTestUser(page);
    await mockSupabase(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // =========================================================================
  // TAB SWITCHING
  // =========================================================================

  test('should navigate between all 4 tabs', async ({ page }) => {
    // Start at Home - verify we're on home page
    const homePage = page.locator('[data-testid="home-page"]');
    await expect(homePage).toBeVisible({ timeout: 5000 });

    // Verify bottom bar is visible with 4 tabs
    const bottomBar = page.locator('a[href="/"]').first();
    await expect(bottomBar).toBeVisible();

    // Navigate to Plan tab
    await page.locator('a[href="/plan"]').click();
    await page.waitForURL('/plan');
    // Plan page should be visible (may show onboarding wizard or empty state)
    await expect(page.locator('a[href="/plan"]')).toBeVisible();

    // Navigate to Stats tab
    await page.locator('a[href="/stats"]').click();
    await page.waitForURL('/stats');

    // Navigate to Profile tab
    await page.locator('a[href="/profile"]').click();
    await page.waitForURL('/profile');

    // Verify we see profile content (preferences section)
    const preferencesLabel = page.locator('text=/idioma|language/i').first();
    await expect(preferencesLabel).toBeVisible({ timeout: 5000 });

    // Navigate back to Home tab
    await page.locator('a[href="/"]').click();
    await page.waitForURL('/');
    await expect(homePage).toBeVisible();
  });

  test('should highlight active tab', async ({ page }) => {
    // On Home - "Inicio" tab should be active (teal color)
    const homeTab = page.locator('a[href="/"]').first();
    await expect(homeTab).toHaveClass(/text-\[#18B7B0\]/);

    // Other tabs should be inactive (gray)
    const planTab = page.locator('a[href="/plan"]');
    await expect(planTab).toHaveClass(/text-gray-500/);

    // Navigate to Plan - verify it becomes active
    await planTab.click();
    await page.waitForURL('/plan');
    await expect(planTab).toHaveClass(/text-\[#18B7B0\]/);
    await expect(homeTab).toHaveClass(/text-gray-500/);
  });

  // =========================================================================
  // BOTTOM BAR VISIBILITY
  // =========================================================================

  test('should hide bottom bar on form pages', async ({ page }) => {
    // Bottom bar should be visible on home
    const bottomBarContainer = page.locator('a[href="/plan"]');
    await expect(bottomBarContainer).toBeVisible();

    // Navigate to Add Transaction form
    const fab = page.locator('[data-testid="fab-add-transaction"]');
    await fab.click();
    await page.waitForTimeout(500);

    const addExpenseButton = page.locator('[data-testid="add-expense-button"]');
    await addExpenseButton.click();
    await page.waitForURL(/\/(add|edit)/, { timeout: 5000 });

    // Bottom bar should be HIDDEN on form page
    await expect(bottomBarContainer).not.toBeVisible();

    // Go back to home
    const backButton = page.locator('button[aria-label="Volver"]').or(
      page.locator('button').filter({ has: page.locator('svg') }).first()
    );
    await backButton.first().click();

    // Bottom bar should be visible again on home
    await page.waitForURL('/', { timeout: 5000 });
    await expect(bottomBarContainer).toBeVisible();
  });

  // =========================================================================
  // BACK BUTTON BEHAVIOR
  // =========================================================================

  test('should navigate back from settings subpages', async ({ page }) => {
    // Go to Profile
    await page.locator('a[href="/profile"]').click();
    await page.waitForURL('/profile');

    // Go to Language settings
    await page.locator('button').filter({ hasText: /idioma/i }).click();
    await page.waitForURL('/settings/language');

    // Click back button
    const backButton = page.locator('button[aria-label="Volver"]');
    await backButton.click();

    // Should be back at Profile
    await page.waitForURL('/profile');
    await expect(page.locator('button').filter({ hasText: /idioma/i })).toBeVisible();
  });

  test('should navigate back from transaction form to home', async ({ page }) => {
    // Open Add Transaction form
    const fab = page.locator('[data-testid="fab-add-transaction"]');
    await fab.click();
    await page.waitForTimeout(500);

    await page.locator('[data-testid="add-expense-button"]').click();
    await page.waitForURL(/\/(add|edit)/, { timeout: 5000 });

    // Verify we're on the form (header says "Nuevo Gasto")
    const formHeader = page.locator('h1').filter({ hasText: /nuevo gasto|new expense/i });
    await expect(formHeader).toBeVisible();

    // Click back
    const backButton = page.locator('button[aria-label="Volver"]').first();
    await backButton.click();

    // Should return to home
    await page.waitForURL('/', { timeout: 5000 });
    const homePage = page.locator('[data-testid="home-page"]');
    await expect(homePage).toBeVisible();
  });

  // =========================================================================
  // DEEP LINKING (direct URL navigation)
  // =========================================================================

  test('should handle direct URL to settings page', async ({ page }) => {
    // Navigate directly to currency settings
    await page.goto('/settings/currency');
    await page.waitForLoadState('networkidle');

    // Should render the currency settings page
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Back button should work to go to profile
    const backButton = page.locator('button[aria-label="Volver"]');
    await backButton.click();

    // Should navigate back (could be profile or home depending on history)
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url).toMatch(/\/(profile)?$/);
  });

  test('should redirect unknown routes to home', async ({ page }) => {
    // Navigate to a non-existent route
    await page.goto('/some-random-page');
    await page.waitForLoadState('networkidle');

    // Should redirect to home page
    const homePage = page.locator('[data-testid="home-page"]');
    await expect(homePage).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('localhost:5173');
  });

  // =========================================================================
  // PROFILE PAGE CONTENT
  // =========================================================================

  test('should display all profile menu sections', async ({ page }) => {
    // Navigate to Profile
    await page.locator('a[href="/profile"]').click();
    await page.waitForURL('/profile');

    // Verify preference items exist
    await expect(page.locator('button').filter({ hasText: /idioma/i })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /tema/i })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /moneda/i })).toBeVisible();

    // Verify management items exist
    await expect(page.locator('button').filter({ hasText: /categor.as/i })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /programadas/i })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /backup/i })).toBeVisible();

    // Verify legal items exist
    await expect(page.locator('text=/t.rminos/i').first()).toBeVisible();
    await expect(page.locator('text=/privacidad/i').first()).toBeVisible();
  });
});
