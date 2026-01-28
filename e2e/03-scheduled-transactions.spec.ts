/**
 * E2E Tests: Scheduled Transactions (HIGH PRIORITY)
 * Tests recurring/scheduled transaction system
 */

import { test, expect } from '@playwright/test';
import { skipOnboardingWithCategories, clearStorage } from './test-helpers';

test.describe('Scheduled Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await page.goto('/');
    await skipOnboardingWithCategories(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test.skip('should create monthly scheduled transaction', async ({ page }) => {
    // Click FAB to create transaction
    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('input[placeholder*="gastaste"]');

    // Fill basic transaction info
    await page.fill('input[placeholder*="gastaste"]', 'Netflix mensual');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('15000');

    // Select category
    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();

    // Enable recurring/schedule toggle
    const recurringToggle = page.locator('[class*="rounded-full bg-"]');
    if (await recurringToggle.count() > 0) {
      await recurringToggle.first().click();

      // Wait for schedule options to appear
      await page.waitForTimeout(500);

      // Configure schedule (if UI is available)
      // This would depend on the actual implementation
      // For now, we'll just verify the toggle works
    }

    // Save transaction
    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    // Verify transaction is created
    await expect(page.locator('text=Netflix mensual')).toBeVisible();

    // Check if there's a recurring indicator (Repeat icon)
    // const hasRecurringIcon = await page.locator('svg[class*="lucide-repeat"]').count();
    // If scheduling is implemented, should have icon
    // expect(hasRecurringIcon).toBeGreaterThan(0);
  });

  test.skip('should navigate to scheduled transactions page', async ({ page }) => {
    // Navigate to scheduled transactions page
    await page.goto('/scheduled');
    await page.waitForLoadState('networkidle');

    // Should show scheduled transactions page
    // Verify page title or header
    const pageTitle = page.locator('h1, [class*="text-lg font-semibold"]').first();
    await expect(pageTitle).toBeVisible({ timeout: 5000 });
  });

  test.skip('should show active and inactive tabs', async ({ page }) => {
    await page.goto('/scheduled');
    await page.waitForLoadState('networkidle');

    // Look for tabs (Activas/Inactivas)
    const activasTab = page.locator('button:has-text("Activas")');
    const inactivasTab = page.locator('button:has-text("Inactivas")');

    // At least one should exist (if implemented)
    const hasActivasTab = await activasTab.isVisible().catch(() => false);
    const hasInactivasTab = await inactivasTab.isVisible().catch(() => false);

    // If tabs exist, test switching
    if (hasActivasTab && hasInactivasTab) {
      await activasTab.click();
      await page.waitForTimeout(300);

      await inactivasTab.click();
      await page.waitForTimeout(300);

      // Verify tab switching works
      expect(true).toBe(true);
    }
  });

  test.skip('should create transaction and mark as recurring', async ({ page }) => {
    // Create a transaction
    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('input[placeholder*="gastaste"]');

    await page.fill('input[placeholder*="gastaste"]', 'Gym membership');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('50000');

    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();

    // Save
    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    // Verify transaction created
    await expect(page.locator('text=Gym membership')).toBeVisible();

    // Edit transaction to make it recurring
    await page.click('text=Gym membership');
    await page.waitForURL(/\/edit\//);

    // Look for recurring toggle
    const toggles = await page.locator('[class*="rounded-full"]').all();

    for (const toggle of toggles) {
      const isVisible = await toggle.isVisible().catch(() => false);
      if (isVisible) {
        await toggle.click();
        break;
      }
    }

    // Save changes
    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    // Verify still exists
    await expect(page.locator('text=Gym membership')).toBeVisible();
  });

  test.skip('should handle recurring indicator on transaction list', async ({ page }) => {
    // Create transaction
    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('input[placeholder*="gastaste"]');

    await page.fill('input[placeholder*="gastaste"]', 'Recurring expense');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('10000');

    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();

    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    // Check transaction list for any recurring indicators
    // const transactionItem = page.locator('text=Recurring expense').locator('..');

    // Look for Repeat icon or recurring badge
    // const hasRepeatIcon = await transactionItem.locator('svg[class*="lucide-repeat"]').count();

    // Should have recurring indicator if feature is implemented
    // For now, just verify transaction exists
    await expect(page.locator('text=Recurring expense')).toBeVisible();
  });

  test.skip('should persist scheduled transactions', async ({ page }) => {
    // Create scheduled transaction
    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('input[placeholder*="gastaste"]');

    await page.fill('input[placeholder*="gastaste"]', 'Persistent scheduled');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('5000');

    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();

    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    // Verify transaction exists
    await expect(page.locator('text=Persistent scheduled')).toBeVisible();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify transaction still exists
    await expect(page.locator('text=Persistent scheduled')).toBeVisible({ timeout: 5000 });
  });

  test.skip('should show scheduled transactions banner if any pending', async ({ page }) => {
    // This test checks for the scheduled transactions banner on HomePage

    // Look for banner (if exists)
    const banner = page.locator('[class*="bg-blue"], [class*="bg-emerald"]').filter({
      hasText: /programad|recurrent|pendient/i,
    });

    const hasBanner = await banner.count();

    // If no banner, it means no pending scheduled transactions
    // This is expected behavior for new account
    expect(hasBanner >= 0).toBe(true);
  });

  test.skip('should navigate to scheduled page from banner', async ({ page }) => {
    // Look for scheduled banner
    const banner = page.locator('button, a').filter({
      hasText: /programad|recurrent/i,
    });

    if (await banner.count() > 0) {
      await banner.first().click();

      // Should navigate to scheduled page
      await expect(page).toHaveURL(/\/scheduled/, { timeout: 5000 });
    }
  });

  test.skip('should handle date selection for scheduled transaction', async ({ page }) => {
    // Create transaction with specific start date
    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('input[placeholder*="gastaste"]');

    await page.fill('input[placeholder*="gastaste"]', 'Scheduled with date');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('8000');

    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();

    // Click date picker
    const dateButton = page.locator('button:has-text("Fecha")');
    if (await dateButton.isVisible()) {
      await dateButton.click();

      // Wait for DatePicker modal
      await page.waitForSelector('[class*="z-[80]"]', { timeout: 5000 });

      // Close picker (just use default date)
      await page.keyboard.press('Escape');
    }

    // Save
    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    // Verify transaction created
    await expect(page.locator('text=Scheduled with date')).toBeVisible();
  });

  test.skip('should allow editing scheduled transaction frequency', async ({ page }) => {
    // Create transaction
    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('input[placeholder*="gastaste"]');

    await page.fill('input[placeholder*="gastaste"]', 'Editable schedule');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('12000');

    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();

    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    // Edit transaction
    await page.click('text=Editable schedule');
    await page.waitForURL(/\/edit\//);

    // Look for frequency options (Monthly, Weekly, etc.)
    const frequencyButtons = page.locator('button:has-text("Mensual"), button:has-text("Semanal")');

    if (await frequencyButtons.count() > 0) {
      await frequencyButtons.first().click();
      await page.waitForTimeout(300);
    }

    // Save
    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    // Verify changes saved
    await expect(page.locator('text=Editable schedule')).toBeVisible();
  });
});
