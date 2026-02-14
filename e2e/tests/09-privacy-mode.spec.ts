/**
 * E2E Tests: Privacy Mode
 *
 * Tests that the privacy mode toggle censors sensitive financial data
 * (amounts in BalanceCard and SafeToSpendCard) and persists across reloads.
 */

import { test, expect } from '@playwright/test';
import { setupTestUser, mockSupabase } from '../test-helpers';

test.describe('Privacy Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setupTestUser(page);
    await mockSupabase(page);

    // Add test data (income + expense) so BalanceCard and SafeToSpend show amounts
    // Inject directly into localStorage (the store loads from there on mount)
    await page.evaluate(() => {
      const today = new Date().toISOString().slice(0, 10);
      const currentMonth = today.slice(0, 7); // YYYY-MM

      // Get existing state or create new one
      const existingState = localStorage.getItem('budget_app_v1');
      const state = existingState ? JSON.parse(existingState) : {};

      // Add test transactions
      state.transactions = [
        {
          id: 'test-income-1',
          type: 'income',
          amount: 3000000,
          name: 'Salario',
          date: today,
          category: 'salary',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'test-expense-1',
          type: 'expense',
          amount: 500000,
          name: 'Mercado',
          date: today,
          category: 'groceries',
          createdAt: new Date().toISOString(),
        },
      ];

      // Set selectedMonth to current month (so BalanceCard calculates totals)
      state.selectedMonth = currentMonth;

      // Save back to localStorage
      localStorage.setItem('budget_app_v1', JSON.stringify(state));
    });

    // Reload page to load the new data from localStorage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // =========================================================================
  // TOGGLE FUNCTIONALITY
  // =========================================================================

  test('should show Eye icon by default (privacy OFF)', async ({ page }) => {
    // Eye icon should be visible in TopHeader
    const eyeButton = page.locator('button[aria-label*="Ocultar"]');
    await expect(eyeButton).toBeVisible();

    // Verify amounts are visible (not censored)
    // Balance card should show actual numbers
    const balanceCard = page.locator('[data-tour="home-balance-card"]');
    await expect(balanceCard).toBeVisible();

    // Should contain formatted amounts (not "-----")
    const balanceText = await balanceCard.textContent();
    expect(balanceText).not.toContain('-----');
  });

  test('should toggle to EyeOff icon when clicked (privacy ON)', async ({ page }) => {
    // Click Eye icon to enable privacy mode
    const eyeButton = page.locator('button[aria-label*="Ocultar"]');
    await eyeButton.click();

    // Icon should change to EyeOff
    const eyeOffButton = page.locator('button[aria-label*="Mostrar"]');
    await expect(eyeOffButton).toBeVisible();
  });

  test('should toggle back to Eye icon when EyeOff is clicked', async ({ page }) => {
    // Enable privacy mode
    const eyeButton = page.locator('button[aria-label*="Ocultar"]');
    await eyeButton.click();

    // Disable privacy mode
    const eyeOffButton = page.locator('button[aria-label*="Mostrar"]');
    await eyeOffButton.click();

    // Should show Eye icon again
    await expect(eyeButton).toBeVisible();
  });

  // =========================================================================
  // BALANCECARD CENSORING
  // =========================================================================

  test('should censor BalanceCard amounts when privacy mode ON', async ({ page }) => {
    // Verify amounts are visible initially
    const balanceCard = page.locator('[data-tour="home-balance-card"]');
    let balanceText = await balanceCard.textContent();
    expect(balanceText).not.toContain('-----');

    // Enable privacy mode
    const eyeButton = page.locator('button[aria-label*="Ocultar"]');
    await eyeButton.click();

    // Wait for UI update
    await page.waitForTimeout(100);

    // Balance card should now show censored amounts ("$ -----")
    balanceText = await balanceCard.textContent();
    expect(balanceText).toContain('-----');

    // Should contain multiple censored amounts (balance + income + expense)
    const censoredCount = (balanceText.match(/-----/g) || []).length;
    expect(censoredCount).toBeGreaterThanOrEqual(3); // Balance, income, expense
  });

  test('should show real amounts when privacy mode toggled OFF', async ({ page }) => {
    // Enable privacy mode
    const eyeButton = page.locator('button[aria-label*="Ocultar"]');
    await eyeButton.click();
    await page.waitForTimeout(100);

    // Verify amounts are censored
    const balanceCard = page.locator('[data-tour="home-balance-card"]');
    let balanceText = await balanceCard.textContent();
    expect(balanceText).toContain('-----');

    // Disable privacy mode
    const eyeOffButton = page.locator('button[aria-label*="Mostrar"]');
    await eyeOffButton.click();
    await page.waitForTimeout(100);

    // Amounts should be visible again
    balanceText = await balanceCard.textContent();
    expect(balanceText).not.toContain('-----');
  });

  // =========================================================================
  // SAFETOSPEND CENSORING
  // =========================================================================

  test('should censor SafeToSpend amount when privacy mode ON', async ({ page }) => {
    // Look for SafeToSpendCard (may not always be visible, skip if not found)
    const safeToSpendCard = page.locator('button').filter({ hasText: /seguro para gastar|safe to spend/i }).first();
    const isVisible = await safeToSpendCard.isVisible().catch(() => false);

    if (isVisible) {
      // Get initial text (should have real amounts)
      let cardText = await safeToSpendCard.textContent();
      const hasCensoredBefore = cardText?.includes('-----');

      // Enable privacy mode
      const eyeButton = page.locator('button[aria-label*="Ocultar"]');
      await eyeButton.click();
      await page.waitForTimeout(100);

      // Should now show censored amount
      cardText = await safeToSpendCard.textContent();
      expect(cardText).toContain('-----');

      // Disable privacy mode
      const eyeOffButton = page.locator('button[aria-label*="Mostrar"]');
      await eyeOffButton.click();
      await page.waitForTimeout(100);

      // Should show real amount again
      cardText = await safeToSpendCard.textContent();
      if (!hasCensoredBefore) {
        expect(cardText).not.toContain('-----');
      }
    }
  });

  // =========================================================================
  // PERSISTENCE
  // =========================================================================

  test('should persist privacy mode ON across page reload', async ({ page }) => {
    // Enable privacy mode
    const eyeButton = page.locator('button[aria-label*="Ocultar"]');
    await eyeButton.click();
    await page.waitForTimeout(100);

    // Verify localStorage was set
    const privacyMode = await page.evaluate(() => localStorage.getItem('app_privacy_mode'));
    expect(privacyMode).toBe('1');

    // Reload page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // EyeOff icon should still be visible (privacy mode still ON)
    const eyeOffButton = page.locator('button[aria-label*="Mostrar"]');
    await expect(eyeOffButton).toBeVisible();

    // Amounts should still be censored
    const balanceCard = page.locator('[data-tour="home-balance-card"]');
    const balanceText = await balanceCard.textContent();
    expect(balanceText).toContain('-----');
  });

  test('should persist privacy mode OFF across page reload', async ({ page }) => {
    // Privacy mode starts OFF by default
    const eyeButton = page.locator('button[aria-label*="Ocultar"]');
    await expect(eyeButton).toBeVisible();

    // Verify localStorage is empty or not "1"
    const privacyMode = await page.evaluate(() => localStorage.getItem('app_privacy_mode'));
    expect(privacyMode).not.toBe('1');

    // Reload page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Eye icon should still be visible (privacy mode still OFF)
    await expect(eyeButton).toBeVisible();

    // Amounts should still be visible
    const balanceCard = page.locator('[data-tour="home-balance-card"]');
    const balanceText = await balanceCard.textContent();
    expect(balanceText).not.toContain('-----');
  });

  // =========================================================================
  // MULTI-CURRENCY SUPPORT
  // =========================================================================

  test('should use correct currency symbol in censored format', async ({ page }) => {
    // Change currency to GTQ (Quetzal)
    await page.locator('a[href="/profile"]').click();
    await page.waitForURL('/profile');

    const currencyButton = page.locator('button').filter({ hasText: /moneda/i });
    await currencyButton.click();
    await page.waitForURL('/settings/currency');

    // Select GTQ
    const gtqButton = page.locator('button').filter({ hasText: /quetzal|gtq/i });
    await gtqButton.click();
    await page.waitForTimeout(500);

    // Go back to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Enable privacy mode
    const eyeButton = page.locator('button[aria-label*="Ocultar"]');
    await eyeButton.click();
    await page.waitForTimeout(100);

    // Balance card should show "Q -----" (not "$ -----")
    const balanceCard = page.locator('[data-tour="home-balance-card"]');
    const balanceText = await balanceCard.textContent();
    expect(balanceText).toContain('Q -----');
    expect(balanceText).not.toContain('$ -----');
  });

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  test('should handle rapid toggle clicks', async ({ page }) => {
    const balanceCard = page.locator('[data-tour="home-balance-card"]');

    // Verify BalanceCard is visible initially
    await expect(balanceCard).toBeVisible();
    const initialText = await balanceCard.textContent();
    expect(initialText).not.toContain('-----'); // Starts with privacy OFF

    // Toggle ON (Eye → EyeOff)
    const eyeButton1 = page.locator('button[aria-label*="Ocultar"]');
    await eyeButton1.click();
    await page.waitForTimeout(50);

    // Verify censored
    let text = await balanceCard.textContent();
    expect(text).toContain('-----');

    // Toggle OFF (EyeOff → Eye)
    const eyeOffButton1 = page.locator('button[aria-label*="Mostrar"]');
    await eyeOffButton1.click();
    await page.waitForTimeout(50);

    // Verify visible again
    text = await balanceCard.textContent();
    expect(text).not.toContain('-----');

    // Toggle ON again (Eye → EyeOff)
    const eyeButton2 = page.locator('button[aria-label*="Ocultar"]');
    await eyeButton2.click();
    await page.waitForTimeout(50);

    // Verify censored again
    text = await balanceCard.textContent();
    expect(text).toContain('-----');

    // Final state should be consistent (censored, EyeOff icon visible)
    const finalEyeOffButton = page.locator('button[aria-label*="Mostrar"]');
    await expect(finalEyeOffButton).toBeVisible();
  });

  test('should work when navigating between pages', async ({ page }) => {
    // Enable privacy mode on home page
    const eyeButton = page.locator('button[aria-label*="Ocultar"]');
    await eyeButton.click();
    await page.waitForTimeout(100);

    // Navigate to Stats page
    await page.locator('a[href="/stats"]').click();
    await page.waitForURL('/stats');

    // EyeOff icon should still be visible
    const eyeOffButton = page.locator('button[aria-label*="Mostrar"]');
    await expect(eyeOffButton).toBeVisible();

    // Navigate back to home
    await page.locator('a[href="/"]').click();
    await page.waitForURL('/');

    // Privacy mode should still be ON
    await expect(eyeOffButton).toBeVisible();

    // Amounts should still be censored
    const balanceCard = page.locator('[data-tour="home-balance-card"]');
    const balanceText = await balanceCard.textContent();
    expect(balanceText).toContain('-----');
  });
});
