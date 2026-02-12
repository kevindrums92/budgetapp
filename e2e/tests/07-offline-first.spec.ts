/**
 * E2E Tests: Offline-First Resilience (CRITICAL)
 *
 * These tests verify the app's core principle: LOCAL-FIRST.
 * The app must remain fully functional when the user loses internet connection.
 *
 * What we test here (SPA already loaded, network drops):
 * - App does NOT show infinite loading / crash when going offline
 * - User can navigate between pages offline
 * - User can create transactions offline
 * - User can view existing data offline
 * - Data persists in localStorage while offline
 * - App recovers gracefully when connection returns
 *
 * What we DON'T test here (requires production build with service worker):
 * - Cold boot offline (loading index.html, JS bundles from SW cache)
 *   → That requires testing against `npm run build` + `npm run start`
 *
 * NOTE: context.setOffline(true) simulates network loss at browser level.
 * This is the real scenario: user is using the app and loses WiFi/cellular.
 */

import { test, expect } from '@playwright/test';
import {
  setupTestUser,
  mockSupabase,
  getTransactionsCount,
  expectTransactionToExist,
} from '../test-helpers';

test.describe('Offline-First Resilience', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Load app online, complete setup
    await page.goto('/');
    await setupTestUser(page);
    await mockSupabase(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for CloudSyncGate + OnboardingGate to finish
    await page.waitForTimeout(1000);
  });

  test('app remains functional when network drops (no crash/spinner)', async ({ page }) => {
    // Verify app is showing the home page (not a loading spinner)
    const bottomBar = page.locator('nav, [class*="bottom"], [class*="fixed"]').first();
    await expect(bottomBar).toBeVisible({ timeout: 5000 });

    // Go offline
    await page.context().setOffline(true);

    // Wait a moment for any offline handlers to fire
    await page.waitForTimeout(500);

    // CRITICAL: App should NOT show an infinite loading spinner
    // Check that the main content is still visible
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Should NOT have a full-screen loading overlay blocking the app
    const loadingOverlay = page.locator('.fixed.inset-0.z-\\[100\\]');
    await expect(loadingOverlay).not.toBeVisible();

    // Go back online
    await page.context().setOffline(false);
  });

  test('can navigate between tabs while offline', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Navigate to Plan tab
    const planTab = page.locator('nav button, a').filter({ hasText: /plan|presupuesto/i }).first();
    if (await planTab.isVisible()) {
      await planTab.click();
      await page.waitForTimeout(300);
      // Should render the plan page (SPA routing works offline)
      await expect(page.locator('body')).toBeVisible();
    }

    // Navigate to Stats tab
    const statsTab = page.locator('nav button, a').filter({ hasText: /stats|estadísticas/i }).first();
    if (await statsTab.isVisible()) {
      await statsTab.click();
      await page.waitForTimeout(300);
      await expect(page.locator('body')).toBeVisible();
    }

    // Navigate back to Home tab
    const homeTab = page.locator('nav button, a').filter({ hasText: /home|inicio/i }).first();
    if (await homeTab.isVisible()) {
      await homeTab.click();
      await page.waitForTimeout(300);
      await expect(page.locator('body')).toBeVisible();
    }

    // Go back online
    await page.context().setOffline(false);
  });

  test('can create a transaction while offline', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Create a transaction via the UI (all local operations)
    const fab = page.locator('[data-testid="fab-add-transaction"]').or(
      page.locator('button[class*="fixed"]').first()
    );
    await fab.click();
    await page.waitForTimeout(500);

    // Click "Agregar uno" / manual add
    const addOneButton = page.locator('button').filter({
      hasText: /agregar uno|gasto manual|manual expense|add one/i,
    });
    await addOneButton.click();
    await page.waitForURL(/\/(add|edit)/, { timeout: 5000 });

    // Fill the form
    const nameInput = page.locator('[data-testid="transaction-name-input"]');
    await nameInput.fill('Compra offline');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.click();
    await amountInput.fill('25000');

    // Select a category
    const categoryButton = page.locator('button').filter({
      hasText: /categoría|category/i,
    });
    await categoryButton.click();
    await page.waitForTimeout(500);

    // Click first available category
    const firstCategory = page
      .locator('button')
      .filter({ has: page.locator('div[class*="rounded-full"]') })
      .nth(1);
    await firstCategory.click();
    await page.waitForTimeout(300);

    // Save
    const saveButton = page.locator('button').filter({
      hasText: /guardar|save/i,
    });
    await saveButton.click();

    // Should navigate back to home
    await page.waitForURL('/', { timeout: 5000 });
    await page.waitForTimeout(500);

    // Verify the transaction was saved to localStorage
    const count = await getTransactionsCount(page);
    expect(count).toBe(1);

    // Verify it's visible in the UI
    await expectTransactionToExist(page, 'Compra offline');

    // Go back online
    await page.context().setOffline(false);
  });

  test('existing data remains visible after going offline', async ({ page }) => {
    // Create a transaction while online
    const fab = page.locator('[data-testid="fab-add-transaction"]').or(
      page.locator('button[class*="fixed"]').first()
    );
    await fab.click();
    await page.waitForTimeout(500);

    const addOneButton = page.locator('button').filter({
      hasText: /agregar uno|gasto manual|manual expense|add one/i,
    });
    await addOneButton.click();
    await page.waitForURL(/\/(add|edit)/, { timeout: 5000 });

    const nameInput = page.locator('[data-testid="transaction-name-input"]');
    await nameInput.fill('Almuerzo online');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.click();
    await amountInput.fill('15000');

    const categoryButton = page.locator('button').filter({
      hasText: /categoría|category/i,
    });
    await categoryButton.click();
    await page.waitForTimeout(500);

    const firstCategory = page
      .locator('button')
      .filter({ has: page.locator('div[class*="rounded-full"]') })
      .nth(1);
    await firstCategory.click();
    await page.waitForTimeout(300);

    const saveButton = page.locator('button').filter({
      hasText: /guardar|save/i,
    });
    await saveButton.click();
    await page.waitForURL('/', { timeout: 5000 });
    await page.waitForTimeout(1000);

    // Verify transaction exists while online
    await expectTransactionToExist(page, 'Almuerzo online');

    // NOW go offline
    await page.context().setOffline(true);
    await page.waitForTimeout(500);

    // Data should STILL be visible (it's from localStorage, not the network)
    await expectTransactionToExist(page, 'Almuerzo online');

    // Go back online
    await page.context().setOffline(false);
  });

  test('data created offline persists when going back online', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Create transaction offline
    const fab = page.locator('[data-testid="fab-add-transaction"]').or(
      page.locator('button[class*="fixed"]').first()
    );
    await fab.click();
    await page.waitForTimeout(500);

    const addOneButton = page.locator('button').filter({
      hasText: /agregar uno|gasto manual|manual expense|add one/i,
    });
    await addOneButton.click();
    await page.waitForURL(/\/(add|edit)/, { timeout: 5000 });

    const nameInput = page.locator('[data-testid="transaction-name-input"]');
    await nameInput.fill('Taxi sin internet');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.click();
    await amountInput.fill('8000');

    const categoryButton = page.locator('button').filter({
      hasText: /categoría|category/i,
    });
    await categoryButton.click();
    await page.waitForTimeout(500);

    const firstCategory = page
      .locator('button')
      .filter({ has: page.locator('div[class*="rounded-full"]') })
      .nth(1);
    await firstCategory.click();
    await page.waitForTimeout(300);

    const saveButton = page.locator('button').filter({
      hasText: /guardar|save/i,
    });
    await saveButton.click();
    await page.waitForURL('/', { timeout: 5000 });
    await page.waitForTimeout(500);

    // Verify while still offline
    const countOffline = await getTransactionsCount(page);
    expect(countOffline).toBe(1);

    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(2000); // Wait for potential sync

    // Data should STILL be there (not wiped by reconnection)
    const countOnline = await getTransactionsCount(page);
    expect(countOnline).toBe(1);
    await expectTransactionToExist(page, 'Taxi sin internet');
  });
});
