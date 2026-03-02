/**
 * E2E Tests: Privacy Mode (3-Level)
 *
 * Tests the 3-level privacy toggle: off → partial → full → off
 * - off:     Everything visible (Eye icon, aria-label "Ocultar montos")
 * - partial: BalanceCard + SafeToSpend censored (EyeClosed icon, aria-label "Ocultar todo")
 * - full:    ALL amounts censored including transactions (EyeOff icon, aria-label "Mostrar montos")
 */

import { test, expect } from '@playwright/test';
import { setupTestUser, mockSupabase } from '../test-helpers';

test.describe('Privacy Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setupTestUser(page);
    await mockSupabase(page);

    // Add test data (income + expense) so BalanceCard and SafeToSpend show amounts
    await page.evaluate(() => {
      const today = new Date().toISOString().slice(0, 10);
      const currentMonth = today.slice(0, 7); // YYYY-MM

      const existingState = localStorage.getItem('budget_app_v1');
      const state = existingState ? JSON.parse(existingState) : {};

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

      state.selectedMonth = currentMonth;
      localStorage.setItem('budget_app_v1', JSON.stringify(state));
    });

    // Reload page to load the new data from localStorage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // =========================================================================
  // TOGGLE FUNCTIONALITY (3-state cycle: off → partial → full → off)
  // =========================================================================

  test('should show Eye icon by default (privacy OFF)', async ({ page }) => {
    // Eye icon should be visible in TopHeader with "Ocultar montos" label
    const eyeButton = page.locator('button[aria-label="Ocultar montos"]');
    await expect(eyeButton).toBeVisible();

    // Verify amounts are visible (not censored)
    const balanceCard = page.locator('[data-tour="home-balance-card"]');
    await expect(balanceCard).toBeVisible();

    const balanceText = await balanceCard.textContent();
    expect(balanceText).not.toContain('-----');
  });

  test('should cycle off → partial → full → off', async ({ page }) => {
    // State 1: OFF — Eye icon, "Ocultar montos"
    const offButton = page.locator('button[aria-label="Ocultar montos"]');
    await expect(offButton).toBeVisible();

    // Click 1: OFF → PARTIAL — EyeClosed icon, "Ocultar todo"
    await offButton.click();
    const partialButton = page.locator('button[aria-label="Ocultar todo"]');
    await expect(partialButton).toBeVisible();

    // Click 2: PARTIAL → FULL — EyeOff icon, "Mostrar montos"
    await partialButton.click();
    const fullButton = page.locator('button[aria-label="Mostrar montos"]');
    await expect(fullButton).toBeVisible();

    // Click 3: FULL → OFF — Eye icon, "Ocultar montos"
    await fullButton.click();
    await expect(offButton).toBeVisible();
  });

  // =========================================================================
  // PARTIAL LEVEL CENSORING (BalanceCard censored, transactions visible)
  // =========================================================================

  test('should censor BalanceCard amounts at partial level', async ({ page }) => {
    // Verify amounts are visible initially
    const balanceCard = page.locator('[data-tour="home-balance-card"]');
    let balanceText = await balanceCard.textContent();
    expect(balanceText).not.toContain('-----');

    // Click once: OFF → PARTIAL
    const eyeButton = page.locator('button[aria-label="Ocultar montos"]');
    await eyeButton.click();
    await page.waitForTimeout(100);

    // Balance card should now show censored amounts ("$ -----")
    balanceText = await balanceCard.textContent();
    expect(balanceText).toContain('-----');

    // Should contain multiple censored amounts (balance + income + expense)
    const censoredCount = (balanceText!.match(/-----/g) || []).length;
    expect(censoredCount).toBeGreaterThanOrEqual(3);
  });

  test('should keep transaction items visible at partial level', async ({ page }) => {
    // Click once: OFF → PARTIAL
    const eyeButton = page.locator('button[aria-label="Ocultar montos"]');
    await eyeButton.click();
    await page.waitForTimeout(100);

    // Transaction amounts should still be visible (not censored)
    const salarioItem = page.locator('button').filter({ hasText: 'Salario' });
    const salarioText = await salarioItem.textContent();
    expect(salarioText).toContain('3.000.000');
    expect(salarioText).not.toContain('-----');
  });

  // =========================================================================
  // FULL LEVEL CENSORING (everything censored)
  // =========================================================================

  test('should censor all amounts at full level', async ({ page }) => {
    // Click twice: OFF → PARTIAL → FULL
    await page.locator('button[aria-label="Ocultar montos"]').click();
    await page.waitForTimeout(50);
    await page.locator('button[aria-label="Ocultar todo"]').click();
    await page.waitForTimeout(100);

    // BalanceCard should be censored
    const balanceCard = page.locator('[data-tour="home-balance-card"]');
    const balanceText = await balanceCard.textContent();
    expect(balanceText).toContain('-----');

    // Transaction amounts should also be censored
    const salarioItem = page.locator('button').filter({ hasText: 'Salario' });
    const salarioText = await salarioItem.textContent();
    expect(salarioText).toContain('-----');
  });

  test('should show all amounts when toggled back to OFF', async ({ page }) => {
    // Full cycle: OFF → PARTIAL → FULL → OFF
    await page.locator('button[aria-label="Ocultar montos"]').click();
    await page.waitForTimeout(50);
    await page.locator('button[aria-label="Ocultar todo"]').click();
    await page.waitForTimeout(50);
    await page.locator('button[aria-label="Mostrar montos"]').click();
    await page.waitForTimeout(100);

    // All amounts should be visible again
    const balanceCard = page.locator('[data-tour="home-balance-card"]');
    const balanceText = await balanceCard.textContent();
    expect(balanceText).not.toContain('-----');
  });

  // =========================================================================
  // SAFETOSPEND CENSORING
  // =========================================================================

  test('should censor SafeToSpend amount at partial level', async ({ page }) => {
    const safeToSpendCard = page.locator('button').filter({ hasText: /seguro para gastar|safe to spend/i }).first();
    const isVisible = await safeToSpendCard.isVisible().catch(() => false);

    if (isVisible) {
      // Get initial text (should have real amounts)
      let cardText = await safeToSpendCard.textContent();
      const hasCensoredBefore = cardText?.includes('-----');

      // Click once: OFF → PARTIAL
      await page.locator('button[aria-label="Ocultar montos"]').click();
      await page.waitForTimeout(100);

      // Should now show censored amount
      cardText = await safeToSpendCard.textContent();
      expect(cardText).toContain('-----');

      // Go back to OFF via full cycle (PARTIAL → FULL → OFF)
      await page.locator('button[aria-label="Ocultar todo"]').click();
      await page.waitForTimeout(50);
      await page.locator('button[aria-label="Mostrar montos"]').click();
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

  test('should persist partial level across page reload', async ({ page }) => {
    // Click once: OFF → PARTIAL
    await page.locator('button[aria-label="Ocultar montos"]').click();
    await page.waitForTimeout(100);

    // Verify localStorage was set to 'partial'
    const privacyMode = await page.evaluate(() => localStorage.getItem('app_privacy_mode'));
    expect(privacyMode).toBe('partial');

    // Reload page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // EyeClosed icon should still be visible (partial level persisted)
    const partialButton = page.locator('button[aria-label="Ocultar todo"]');
    await expect(partialButton).toBeVisible();

    // Amounts should still be censored
    const balanceCard = page.locator('[data-tour="home-balance-card"]');
    const balanceText = await balanceCard.textContent();
    expect(balanceText).toContain('-----');
  });

  test('should persist full level across page reload', async ({ page }) => {
    // Click twice: OFF → PARTIAL → FULL
    await page.locator('button[aria-label="Ocultar montos"]').click();
    await page.waitForTimeout(50);
    await page.locator('button[aria-label="Ocultar todo"]').click();
    await page.waitForTimeout(100);

    // Verify localStorage was set to 'full'
    const privacyMode = await page.evaluate(() => localStorage.getItem('app_privacy_mode'));
    expect(privacyMode).toBe('full');

    // Reload page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // EyeOff icon should still be visible (full level persisted)
    const fullButton = page.locator('button[aria-label="Mostrar montos"]');
    await expect(fullButton).toBeVisible();

    // Amounts should still be censored
    const balanceCard = page.locator('[data-tour="home-balance-card"]');
    const balanceText = await balanceCard.textContent();
    expect(balanceText).toContain('-----');
  });

  test('should persist privacy mode OFF across page reload', async ({ page }) => {
    // Privacy mode starts OFF by default
    const eyeButton = page.locator('button[aria-label="Ocultar montos"]');
    await expect(eyeButton).toBeVisible();

    // Verify localStorage is empty (OFF removes the key)
    const privacyMode = await page.evaluate(() => localStorage.getItem('app_privacy_mode'));
    expect(privacyMode).toBeNull();

    // Reload page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Eye icon should still be visible (privacy mode still OFF)
    await expect(page.locator('button[aria-label="Ocultar montos"]')).toBeVisible();

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

    // Click once: OFF → PARTIAL
    await page.locator('button[aria-label="Ocultar montos"]').click();
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

  test('should handle full 3-level cycle with correct censoring at each step', async ({ page }) => {
    const balanceCard = page.locator('[data-tour="home-balance-card"]');

    // Start: OFF — amounts visible
    await expect(balanceCard).toBeVisible();
    let text = await balanceCard.textContent();
    expect(text).not.toContain('-----');

    // Click 1: OFF → PARTIAL — balance censored
    await page.locator('button[aria-label="Ocultar montos"]').click();
    await page.waitForTimeout(50);
    text = await balanceCard.textContent();
    expect(text).toContain('-----');

    // Click 2: PARTIAL → FULL — still censored
    await page.locator('button[aria-label="Ocultar todo"]').click();
    await page.waitForTimeout(50);
    text = await balanceCard.textContent();
    expect(text).toContain('-----');

    // Click 3: FULL → OFF — amounts visible again
    await page.locator('button[aria-label="Mostrar montos"]').click();
    await page.waitForTimeout(50);
    text = await balanceCard.textContent();
    expect(text).not.toContain('-----');

    // Final state: OFF, Eye icon visible
    await expect(page.locator('button[aria-label="Ocultar montos"]')).toBeVisible();
  });

  test('should work when navigating between pages', async ({ page }) => {
    // Click once: OFF → PARTIAL
    await page.locator('button[aria-label="Ocultar montos"]').click();
    await page.waitForTimeout(100);

    // Navigate to Stats page
    await page.locator('a[href="/stats"]').click();
    await page.waitForURL('/stats');

    // Partial button should still be visible ("Ocultar todo")
    const partialButton = page.locator('button[aria-label="Ocultar todo"]');
    await expect(partialButton).toBeVisible();

    // Navigate back to home
    await page.locator('a[href="/"]').click();
    await page.waitForURL('/');

    // Privacy mode should still be partial
    await expect(partialButton).toBeVisible();

    // Amounts should still be censored
    const balanceCard = page.locator('[data-tour="home-balance-card"]');
    const balanceText = await balanceCard.textContent();
    expect(balanceText).toContain('-----');
  });
});
