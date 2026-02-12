/**
 * E2E Tests: Session Expired Gate (CRITICAL - Tier 1)
 *
 * Tests the session expired detection and recovery flow:
 * - When an authenticated user's session expires, a fullscreen modal appears
 * - User must re-authenticate or explicitly choose "continue as guest"
 * - Explicit logout should NOT trigger the session expired modal
 * - Local data is preserved during session expiration
 */

import { test, expect } from '@playwright/test';
import { setupTestUser } from '../test-helpers';

test.describe('Session Expired Gate', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setupTestUser(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should show session expired modal when wasAuthenticated flag exists but no valid session', async ({ page }) => {
    // Simulate: user was previously authenticated, but session expired
    await page.evaluate(() => {
      localStorage.setItem('budget.wasAuthenticated', 'true');
      localStorage.setItem('budget.lastAuthEmail', 'testuser@gmail.com');
      localStorage.setItem('budget.lastAuthProvider', 'google');

      // Remove Supabase session to simulate expiration
      const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-') && k.includes('auth-token'));
      keys.forEach(key => localStorage.removeItem(key));
    });

    // Reload to trigger cold start with no session
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Session expired modal should be visible
    const modal = page.locator('text=/sesión expiró|session expired/i');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Should show the email hint
    const emailHint = page.locator('text=testuser@gmail.com');
    await expect(emailHint).toBeVisible();

    // Should show Google and Apple buttons
    const googleButton = page.locator('button').filter({ hasText: /Google/i });
    const appleButton = page.locator('button').filter({ hasText: /Apple/i });
    await expect(googleButton).toBeVisible();
    await expect(appleButton).toBeVisible();

    // Should show "Continue as guest" button
    const guestButton = page.locator('button').filter({ hasText: /invitado|guest/i });
    await expect(guestButton).toBeVisible();
  });

  test('should dismiss modal and enter guest mode when "Continue as guest" is clicked', async ({ page }) => {
    // Set up expired session state
    await page.evaluate(() => {
      localStorage.setItem('budget.wasAuthenticated', 'true');
      localStorage.setItem('budget.lastAuthEmail', 'testuser@gmail.com');
      localStorage.setItem('budget.lastAuthProvider', 'google');

      // Remove Supabase session
      const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-') && k.includes('auth-token'));
      keys.forEach(key => localStorage.removeItem(key));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Wait for modal
    const modal = page.locator('text=/sesión expiró|session expired/i');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Click "Continue as guest"
    const guestButton = page.locator('button').filter({ hasText: /invitado|guest/i });
    await guestButton.click();

    // Modal should disappear
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Auth flags should be cleared
    const wasAuth = await page.evaluate(() => localStorage.getItem('budget.wasAuthenticated'));
    expect(wasAuth).toBeNull();

    const lastEmail = await page.evaluate(() => localStorage.getItem('budget.lastAuthEmail'));
    expect(lastEmail).toBeNull();
  });

  test('should NOT show session expired modal for normal guest users (no wasAuthenticated flag)', async ({ page }) => {
    // Normal guest user - no wasAuthenticated flag
    await page.evaluate(() => {
      // Make sure no wasAuthenticated flag exists
      localStorage.removeItem('budget.wasAuthenticated');

      // Remove Supabase session (simulating offline first launch)
      const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-') && k.includes('auth-token'));
      keys.forEach(key => localStorage.removeItem(key));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Session expired modal should NOT be visible
    const modal = page.locator('text=/sesión expiró|session expired/i');
    await expect(modal).not.toBeVisible();
  });

  test('should preserve local data when session expired modal is shown', async ({ page }) => {
    // Add some transactions to localStorage first
    await page.evaluate(() => {
      const state = localStorage.getItem('budget_app_v1');
      const parsed = state ? JSON.parse(state) : {};

      parsed.transactions = [
        {
          id: 'test-tx-1',
          type: 'expense',
          name: 'Test almuerzo',
          category: 'food',
          amount: 25000,
          date: '2026-02-12',
          createdAt: Date.now(),
        },
      ];

      localStorage.setItem('budget_app_v1', JSON.stringify(parsed));

      // Set expired session state
      localStorage.setItem('budget.wasAuthenticated', 'true');
      localStorage.setItem('budget.lastAuthEmail', 'testuser@gmail.com');

      // Remove Supabase session
      const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-') && k.includes('auth-token'));
      keys.forEach(key => localStorage.removeItem(key));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Modal should be showing
    const modal = page.locator('text=/sesión expiró|session expired/i');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Data should still be in localStorage (NOT cleared)
    const hasData = await page.evaluate(() => {
      const state = localStorage.getItem('budget_app_v1');
      if (!state) return false;
      const parsed = JSON.parse(state);
      return parsed.transactions?.length > 0;
    });

    expect(hasData).toBe(true);
  });

  test('should block interaction with app behind the modal', async ({ page }) => {
    // Set up expired session
    await page.evaluate(() => {
      localStorage.setItem('budget.wasAuthenticated', 'true');
      localStorage.setItem('budget.lastAuthEmail', 'testuser@gmail.com');

      const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-') && k.includes('auth-token'));
      keys.forEach(key => localStorage.removeItem(key));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Modal should be visible
    const modal = page.locator('text=/sesión expiró|session expired/i');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Body scroll should be locked
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('hidden');

    // The modal should have z-index 100 (blocks everything behind it)
    const modalContainer = page.locator('[class*="z-[100]"]');
    await expect(modalContainer).toBeVisible();
  });
});
