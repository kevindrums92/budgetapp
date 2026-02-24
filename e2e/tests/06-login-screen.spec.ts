/**
 * E2E Tests: LoginScreen Conditional UI
 *
 * Tests that the LoginScreen shows the correct UI elements
 * depending on how the user arrives:
 *
 * 1. Anonymous user from Settings → back button visible, no guest button
 * 2. Post-logout user → no back button, guest button visible
 */

import { test, expect } from '@playwright/test';
import { setupTestUser, mockSupabase, clearStorage, createAnonymousSession } from '../test-helpers';

test.describe('LoginScreen - Conditional UI', () => {

  // ===========================================================================
  // Scenario 1: Anonymous user navigates to Login from Settings
  // → Should see back button, should NOT see "Continue as guest"
  // ===========================================================================

  test.describe('Anonymous user from Settings', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await setupTestUser(page);
      await mockSupabase(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    test('should show back button and hide guest button', async ({ page }) => {
      // Navigate to Profile tab
      await page.locator('a[href="/profile"]').click();
      await page.waitForURL('/profile');

      // Click guest banner CTA (navigates to /onboarding/login)
      // ES: "Crea tu cuenta", EN: "Create your account"
      const guestBanner = page.locator('button').filter({
        hasText: /crea.*cuenta|create.*account/i,
      });
      await guestBanner.click();
      await page.waitForURL(/\/onboarding\/login/, { timeout: 5000 });

      // Back button should be visible
      const backButton = page.locator('button[aria-label="Volver"]');
      await expect(backButton).toBeVisible();

      // "Continue as guest" button should NOT be visible
      const guestButton = page.locator('button').filter({
        hasText: /continuar como invitado|continue as guest/i,
      });
      await expect(guestButton).not.toBeVisible();

      // Google and Apple buttons should be visible
      await expect(page.locator('button').filter({ hasText: /Google/i })).toBeVisible();
      await expect(page.locator('button').filter({ hasText: /Apple/i })).toBeVisible();
    });

    test('should navigate back to Profile when clicking back button', async ({ page }) => {
      // Go to Profile → LoginScreen
      await page.locator('a[href="/profile"]').click();
      await page.waitForURL('/profile');

      // ES: "Crea tu cuenta", EN: "Create your account"
      const guestBanner = page.locator('button').filter({
        hasText: /crea.*cuenta|create.*account/i,
      });
      await guestBanner.click();
      await page.waitForURL(/\/onboarding\/login/, { timeout: 5000 });

      // Click back button
      const backButton = page.locator('button[aria-label="Volver"]');
      await backButton.click();

      // Should navigate back to Profile
      await page.waitForURL('/profile', { timeout: 5000 });
      await expect(page.locator('button').filter({ hasText: /idioma/i })).toBeVisible();
    });
  });

  // ===========================================================================
  // Scenario 2: User after explicit logout
  // → Should NOT see back button, should see "Continue as guest"
  // ===========================================================================

  test.describe('Post-logout user', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await clearStorage(page);
      await mockSupabase(page);

      // Simulate post-logout state:
      // - Device is initialized (user has used the app before)
      // - Logout flag is set (explicit logout happened)
      // - Onboarding completed flag is cleared (markLogout clears it)
      // - Anonymous session exists (CloudSyncGate auto-creates one)
      await page.evaluate(() => {
        localStorage.setItem('budget.device.initialized', 'true');
        localStorage.setItem('budget.onboarding.logout.v2', 'true');
        // Set language/theme so the app doesn't redirect elsewhere
        localStorage.setItem('app_language', 'es');
        localStorage.setItem('app_theme', 'light');
        localStorage.setItem('app_currency', 'COP');
      });
      await createAnonymousSession(page);

      // Navigate to login screen (OnboardingGate routes here when logout flag is set)
      await page.goto('/onboarding/login');
      await page.waitForLoadState('networkidle');
    });

    test('should hide back button and show guest button', async ({ page }) => {
      // Back button should NOT be visible (replaced by empty spacer)
      const backButton = page.locator('button[aria-label="Volver"]');
      await expect(backButton).not.toBeVisible();

      // "Continue as guest" button should be visible
      const guestButton = page.locator('button').filter({
        hasText: /continuar como invitado|continue as guest/i,
      });
      await expect(guestButton).toBeVisible();

      // Google and Apple buttons should still be visible
      await expect(page.locator('button').filter({ hasText: /Google/i })).toBeVisible();
      await expect(page.locator('button').filter({ hasText: /Apple/i })).toBeVisible();
    });

    test('should continue as guest and navigate to home', async ({ page }) => {
      // Click "Continue as guest"
      const guestButton = page.locator('button').filter({
        hasText: /continuar como invitado|continue as guest/i,
      });
      await guestButton.click();

      // Should navigate to home
      await page.waitForURL('/', { timeout: 5000 });

      // Verify logout flag was cleared
      const logoutFlag = await page.evaluate(() =>
        localStorage.getItem('budget.onboarding.logout.v2')
      );
      expect(logoutFlag).toBeNull();

      // Verify onboarding marked as completed
      const completedFlag = await page.evaluate(() =>
        localStorage.getItem('budget.onboarding.completed.v2')
      );
      expect(completedFlag).toBe('true');
    });
  });
});
