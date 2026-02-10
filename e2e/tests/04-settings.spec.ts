/**
 * E2E Tests: Settings Persistence (Tier 2)
 *
 * Tests that changing language, theme, and currency
 * actually updates the UI and persists correctly.
 */

import { test, expect } from '@playwright/test';
import { setupTestUser, mockSupabase } from '../test-helpers';

test.describe('Settings Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setupTestUser(page);
    await mockSupabase(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // =========================================================================
  // LANGUAGE
  // =========================================================================

  test('should change language from Spanish to English', async ({ page }) => {
    // Verify we start in Spanish - bottom bar should say "Inicio"
    await expect(page.locator('a[href="/"]')).toContainText('Inicio');

    // Navigate to Profile tab
    await page.locator('a[href="/profile"]').click();
    await page.waitForURL('/profile');

    // Click on language setting (shows "Idioma")
    const languageButton = page.locator('button').filter({ hasText: /idioma/i });
    await languageButton.click();
    await page.waitForURL('/settings/language');

    // Verify Spanish is currently selected (has ring styling)
    const spanishButton = page.locator('button').filter({ hasText: /español/i });
    await expect(spanishButton).toBeVisible();

    // Click English
    const englishButton = page.locator('button').filter({ hasText: /english/i });
    await englishButton.click();

    // Wait for i18n to update
    await page.waitForTimeout(500);

    // Go back to profile
    const backButton = page.locator('button[aria-label="Volver"]').or(
      page.locator('button').filter({ hasText: /volver|back/i }).first()
    );
    await backButton.first().click();
    await page.waitForURL('/profile');

    // Bottom bar should now show English labels
    await expect(page.locator('a[href="/"]')).toContainText('Home');
    await expect(page.locator('a[href="/stats"]')).toContainText('Stats');
    await expect(page.locator('a[href="/profile"]')).toContainText('Settings');

    // Verify localStorage persisted the change
    const savedLanguage = await page.evaluate(() => localStorage.getItem('app_language'));
    expect(savedLanguage).toBe('en');
  });

  test('should persist language after page reload', async ({ page }) => {
    // Set language to English via settings
    await page.locator('a[href="/profile"]').click();
    await page.waitForURL('/profile');

    await page.locator('button').filter({ hasText: /idioma/i }).click();
    await page.waitForURL('/settings/language');

    await page.locator('button').filter({ hasText: /english/i }).click();
    await page.waitForTimeout(500);

    // Reload the page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Bottom bar should STILL be in English after reload
    await expect(page.locator('a[href="/"]')).toContainText('Home');
    await expect(page.locator('a[href="/profile"]')).toContainText('Settings');
  });

  // =========================================================================
  // THEME
  // =========================================================================

  test('should switch to dark theme', async ({ page }) => {
    // Navigate to theme settings
    await page.locator('a[href="/profile"]').click();
    await page.waitForURL('/profile');

    const themeButton = page.locator('button').filter({ hasText: /tema/i });
    await themeButton.click();
    await page.waitForURL('/settings/theme');

    // Click dark theme ("Oscuro")
    const darkButton = page.locator('button').filter({ hasText: /oscuro/i });
    await darkButton.click();

    // Verify <html> element has "dark" class (Tailwind dark mode)
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Verify localStorage persisted
    const savedTheme = await page.evaluate(() => localStorage.getItem('app_theme'));
    expect(savedTheme).toBe('dark');
  });

  test('should switch back to light theme', async ({ page }) => {
    // First switch to dark
    await page.locator('a[href="/profile"]').click();
    await page.waitForURL('/profile');

    await page.locator('button').filter({ hasText: /tema/i }).click();
    await page.waitForURL('/settings/theme');

    await page.locator('button').filter({ hasText: /oscuro/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Now switch to light ("Claro")
    await page.locator('button').filter({ hasText: /claro/i }).click();

    // Verify <html> does NOT have "dark" class
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    const savedTheme = await page.evaluate(() => localStorage.getItem('app_theme'));
    expect(savedTheme).toBe('light');
  });

  // =========================================================================
  // CURRENCY
  // =========================================================================

  test('should change currency from COP to USD', async ({ page }) => {
    // Navigate to currency settings
    await page.locator('a[href="/profile"]').click();
    await page.waitForURL('/profile');

    const currencyButton = page.locator('button').filter({ hasText: /moneda/i });
    await currencyButton.click();
    await page.waitForURL('/settings/currency');

    // Search for USD
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('USD');
    await page.waitForTimeout(300);

    // Click USD option
    const usdButton = page.locator('button').filter({ hasText: /USD/ });
    await usdButton.click();

    // Verify localStorage persisted
    const savedCurrency = await page.evaluate(() => localStorage.getItem('app_currency'));
    expect(savedCurrency).toBe('USD');

    // Go back via back button (currency page has PageHeader, no BottomBar)
    const backButton = page.locator('button[aria-label="Volver"]');
    await backButton.click();
    await page.waitForURL('/profile');

    // Navigate to home via bottom bar
    await page.locator('a[href="/"]').click();
    await page.waitForURL('/');

    // Verify home page renders correctly with new currency
    const homePage = page.locator('[data-testid="home-page"]');
    await expect(homePage).toBeVisible();
  });

  test('should search currencies and show filtered results', async ({ page }) => {
    // Navigate to currency settings
    await page.locator('a[href="/profile"]').click();
    await page.waitForURL('/profile');

    await page.locator('button').filter({ hasText: /moneda/i }).click();
    await page.waitForURL('/settings/currency');

    // Search for "euro"
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('euro');
    await page.waitForTimeout(300);

    // Should show EUR in results
    const eurButton = page.locator('button').filter({ hasText: /EUR/ });
    await expect(eurButton).toBeVisible();

    // Clear search and verify regions come back
    await searchInput.clear();
    await page.waitForTimeout(300);

    // Region headers should be visible again
    const regionHeader = page.locator('text=/Am.rica|Americas/i').first();
    await expect(regionHeader).toBeVisible();
  });
});
