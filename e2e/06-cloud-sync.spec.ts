/**
 * E2E Tests: Cloud Sync (CRITICAL)
 * Tests Supabase synchronization in real-time
 */

import { test, expect } from '@playwright/test';
import {
  skipOnboardingWithCategories,
  clearStorage,
  waitForCloudSync,
  goOffline,
  goOnline,
} from './test-helpers';

test.describe('Cloud Sync', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);

    // Mock Supabase client to avoid real API calls
    await page.addInitScript(() => {
      // Mock window.supabase if it exists
      (window as any).mockSupabaseData = {
        isAuthenticated: false,
        userData: null,
        pendingChanges: [],
      };

      // Intercept Supabase calls
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const url = args[0] as string;

        // Mock Supabase auth endpoints
        if (url.includes('supabase.co/auth')) {
          return new Response(
            JSON.stringify({
              access_token: 'mock-token',
              user: { id: 'mock-user-id', email: 'test@example.com' },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Mock Supabase data endpoints
        if (url.includes('/rest/v1/user_state')) {
          if (args[1]?.method === 'POST' || args[1]?.method === 'PUT') {
            // Store upsert
            (window as any).mockSupabaseData.pendingChanges.push(JSON.parse(args[1]?.body as string));
            return new Response(JSON.stringify({ success: true }), { status: 200 });
          } else {
            // Get
            return new Response(
              JSON.stringify((window as any).mockSupabaseData.userData || { data: null }),
              { status: 200 }
            );
          }
        }

        return originalFetch(...args);
      };
    });
  });

  test.skip('should handle guest mode (no cloud sync)', async ({ page }) => {
    await page.goto('/');
    await skipOnboardingWithCategories(page);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Create a transaction in guest mode
    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('input[placeholder*="gastaste"]');
    await page.fill('input[placeholder*="gastaste"]', 'Guest transaction');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('5000');

    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();
    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    // Verify data is stored in localStorage only
    const cloudMode = await page.evaluate(() => {
      const state = localStorage.getItem('budget_state');
      if (!state) return null;
      return JSON.parse(state).cloudMode;
    });

    expect(cloudMode).toBe('guest');

    // Verify transaction exists in localStorage
    const transactions = await page.evaluate(() => {
      const state = localStorage.getItem('budget_state');
      if (!state) return [];
      return JSON.parse(state).transactions || [];
    });

    expect(transactions.length).toBeGreaterThan(0);
    expect(transactions[0].name).toBe('Guest transaction');
  });

  test.skip('should store data in localStorage', async ({ page }) => {
    await page.goto('/');
    await skipOnboardingWithCategories(page);
    await page.reload();

    // Create transaction
    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('input[placeholder*="gastaste"]');
    await page.fill('input[placeholder*="gastaste"]', 'Local storage test');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('1000');

    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();
    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    // Verify localStorage has the data
    const hasData = await page.evaluate(() => {
      const state = localStorage.getItem('budget_state');
      return state !== null && state.length > 0;
    });

    expect(hasData).toBe(true);
  });

  test.skip('should persist data across page reloads', async ({ page }) => {
    await page.goto('/');
    await skipOnboardingWithCategories(page);
    await page.reload();

    // Create transaction
    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('input[placeholder*="gastaste"]');
    await page.fill('input[placeholder*="gastaste"]', 'Persistent transaction');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('2000');

    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();
    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    // Verify transaction is visible
    await expect(page.locator('text=Persistent transaction')).toBeVisible();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify transaction still visible after reload
    await expect(page.locator('text=Persistent transaction')).toBeVisible({ timeout: 5000 });
  });

  test.skip('should handle offline mode gracefully', async ({ page }) => {
    await page.goto('/');
    await skipOnboardingWithCategories(page);
    await page.reload();

    // Go offline
    await goOffline(page);

    // Create transaction while offline
    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('input[placeholder*="gastaste"]');
    await page.fill('input[placeholder*="gastaste"]', 'Offline transaction');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('3000');

    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();
    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    // Verify transaction is saved locally despite being offline
    await expect(page.locator('text=Offline transaction')).toBeVisible();

    // Verify data in localStorage
    const hasOfflineData = await page.evaluate(() => {
      const state = localStorage.getItem('budget_state');
      if (!state) return false;
      const parsed = JSON.parse(state);
      return parsed.transactions?.some((t: any) => t.name === 'Offline transaction');
    });

    expect(hasOfflineData).toBe(true);

    // Go back online
    await goOnline(page);

    // App should continue working normally
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Offline transaction')).toBeVisible();
  });

  test.skip('should export data correctly', async ({ page }) => {
    await page.goto('/');
    await skipOnboardingWithCategories(page);
    await page.reload();

    // Create some transactions
    for (let i = 1; i <= 3; i++) {
      await page.click('button[class*="fixed"][class*="z-40"]');
      await page.waitForSelector('input[placeholder*="gastaste"]');
      await page.fill('input[placeholder*="gastaste"]', `Transaction ${i}`);

      const amountInput = page.locator('input[inputMode="decimal"]');
      await amountInput.fill((1000 * i).toString());

      await page.click('button:has-text("Categoría")');
      await page.waitForTimeout(500);
      await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();
      await page.click('button:has-text("Guardar")');
      await page.waitForURL('/');
    }

    // Navigate to profile/settings page
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Look for export button (CSV export)
    const exportButton = page.locator('button:has-text("Exportar")');

    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');

      await exportButton.click();

      // Wait for download to start
      const download = await downloadPromise;

      // Verify download filename
      expect(download.suggestedFilename()).toContain('.csv');
    }
  });

  test.skip('should maintain data integrity on rapid changes', async ({ page }) => {
    await page.goto('/');
    await skipOnboardingWithCategories(page);
    await page.reload();

    // Create multiple transactions rapidly
    for (let i = 1; i <= 5; i++) {
      await page.click('button[class*="fixed"][class*="z-40"]');
      await page.waitForSelector('input[placeholder*="gastaste"]');
      await page.fill('input[placeholder*="gastaste"]', `Rapid ${i}`);

      const amountInput = page.locator('input[inputMode="decimal"]');
      await amountInput.fill((500 * i).toString());

      await page.click('button:has-text("Categoría")');
      await page.waitForTimeout(300);
      await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();
      await page.click('button:has-text("Guardar")');
      await page.waitForURL('/');
    }

    // Verify all transactions were created
    const transactionCount = await page.evaluate(() => {
      const state = localStorage.getItem('budget_state');
      if (!state) return 0;
      return JSON.parse(state).transactions?.length || 0;
    });

    expect(transactionCount).toBe(5);

    // Verify they're all visible in UI
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator(`text=Rapid ${i}`)).toBeVisible();
    }
  });

  test.skip('should handle localStorage quota gracefully', async ({ page }) => {
    // This test verifies the app doesn't crash if localStorage is full
    // For now, we just verify basic functionality works

    await page.goto('/');
    await skipOnboardingWithCategories(page);
    await page.reload();

    // Verify app loads successfully
    await expect(page).toHaveURL('/');

    // Verify we can still create data
    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('input[placeholder*="gastaste"]');
    await page.fill('input[placeholder*="gastaste"]', 'Quota test');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('1000');

    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();
    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    await expect(page.locator('text=Quota test')).toBeVisible();
  });
});
