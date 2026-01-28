/**
 * E2E Tests: Onboarding Flow (CRITICAL)
 * Tests complete onboarding experience for new and returning users
 */

import { test, expect } from '@playwright/test';
import { clearStorage } from './test-helpers';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test.skip('should show welcome onboarding for first-time guest user', async ({ page }) => {
    await page.goto('/');

    // Should show Welcome Onboarding first screen
    await expect(page.locator('text=Bienvenido a SmartSpend')).toBeVisible({ timeout: 10000 });

    // Verify we're in onboarding flow
    await expect(page).toHaveURL(/\/onboarding/);

    // Navigate through welcome screens using "Siguiente" button
    const nextButton = page.locator('button:has-text("Siguiente")');

    // Screen 1 - Welcome
    await expect(page.locator('text=Bienvenido a SmartSpend')).toBeVisible();
    await nextButton.click();

    // Screen 2 - Should have some onboarding content
    await page.waitForTimeout(500);
    await nextButton.click();

    // Screen 3
    await page.waitForTimeout(500);
    await nextButton.click();

    // Screen 4
    await page.waitForTimeout(500);
    await nextButton.click();

    // Screen 5
    await page.waitForTimeout(500);
    await nextButton.click();

    // Screen 6 - Last screen should have "Comenzar" button
    await page.waitForTimeout(500);
    const startButton = page.locator('button:has-text("Comenzar")');
    await expect(startButton).toBeVisible({ timeout: 5000 });
    await startButton.click();

    // Should reach LoginScreen
    await expect(page.locator('text=Continuar como invitado')).toBeVisible({ timeout: 5000 });

    // Select guest mode
    await page.click('button:has-text("Continuar como invitado")');

    // Should redirect to HomePage
    await page.waitForURL('/', { timeout: 10000 });

    // Verify we're on home page
    await expect(page.locator('text=Inicio')).toBeVisible({ timeout: 5000 });

    // Verify welcomeSeen flag is set in localStorage
    const welcomeSeen = await page.evaluate(() => {
      return localStorage.getItem('budget.onboarding.completed.v2');
    });
    expect(welcomeSeen).toBe('true');
  });

  test.skip('should allow skipping welcome screens', async ({ page }) => {
    await page.goto('/');

    // Wait for first onboarding screen
    await page.waitForSelector('text=Bienvenido a SmartSpend', { timeout: 10000 });

    // Look for skip button if available
    const skipButton = page.locator('button:has-text("Omitir")');

    if (await skipButton.isVisible()) {
      await skipButton.click();

      // Should jump to LoginScreen
      await expect(page.locator('text=Continuar como invitado')).toBeVisible({ timeout: 5000 });
    }
  });

  test.skip('should persist onboarding completion on page reload', async ({ page }) => {
    // Complete onboarding
    await page.goto('/');
    await page.waitForSelector('text=Bienvenido a SmartSpend', { timeout: 10000 });

    // Skip to login screen
    const skipButton = page.locator('button:has-text("Omitir")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
    } else {
      // Navigate through all screens
      for (let i = 0; i < 5; i++) {
        await page.click('button:has-text("Siguiente")');
        await page.waitForTimeout(300);
      }
      await page.click('button:has-text("Comenzar")');
    }

    // Continue as guest
    await page.waitForSelector('text=Continuar como invitado', { timeout: 5000 });
    await page.click('button:has-text("Continuar como invitado")');
    await page.waitForURL('/', { timeout: 10000 });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should stay on home page (not show onboarding again)
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Bienvenido a SmartSpend')).not.toBeVisible();
  });

  test.skip('should show login screen for account creation', async ({ page }) => {
    await page.goto('/');

    // Navigate through onboarding or skip
    await page.waitForSelector('text=Bienvenido a SmartSpend', { timeout: 10000 });

    const skipButton = page.locator('button:has-text("Omitir")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
    } else {
      for (let i = 0; i < 5; i++) {
        await page.click('button:has-text("Siguiente")');
        await page.waitForTimeout(300);
      }
      await page.click('button:has-text("Comenzar")');
    }

    // Should show login options
    await expect(page.locator('text=Continuar como invitado')).toBeVisible({ timeout: 5000 });

    // Should also have "Crear cuenta" or "Iniciar sesión" options
    const hasCreateAccount = await page.locator('button:has-text("Crear cuenta")').isVisible();
    const hasSignIn = await page.locator('button:has-text("Iniciar sesión")').isVisible();

    expect(hasCreateAccount || hasSignIn).toBe(true);
  });

  test.skip('should handle returning user (guest mode)', async ({ page }) => {
    // First visit - complete onboarding as guest
    await page.goto('/');
    await page.waitForSelector('text=Bienvenido a SmartSpend', { timeout: 10000 });

    const skipButton = page.locator('button:has-text("Omitir")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
    } else {
      for (let i = 0; i < 5; i++) {
        await page.click('button:has-text("Siguiente")');
        await page.waitForTimeout(300);
      }
      await page.click('button:has-text("Comenzar")');
    }

    await page.waitForSelector('text=Continuar como invitado', { timeout: 5000 });
    await page.click('button:has-text("Continuar como invitado")');
    await page.waitForURL('/', { timeout: 10000 });

    // Create some data (transaction) to verify persistence
    const fabButton = page.locator('button[class*="fixed"][class*="z-40"]');
    if (await fabButton.isVisible()) {
      await fabButton.click();
      await page.waitForSelector('input[placeholder*="gastaste"]', { timeout: 5000 });
      await page.fill('input[placeholder*="gastaste"]', 'Test transaction');

      const amountInput = page.locator('input[inputMode="decimal"]');
      await amountInput.fill('1000');

      await page.click('button:has-text("Categoría")');
      await page.waitForTimeout(500);
      await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();
      await page.click('button:has-text("Guardar")');
      await page.waitForURL('/');
    }

    // Simulate returning user - reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should NOT show onboarding again
    await expect(page.locator('text=Bienvenido a SmartSpend')).not.toBeVisible();

    // Should go straight to home with data intact
    await expect(page).toHaveURL('/');
  });

  test.skip('should initialize with default categories in guest mode', async ({ page }) => {
    // Complete onboarding as guest
    await page.goto('/');
    await page.waitForSelector('text=Bienvenido a SmartSpend', { timeout: 10000 });

    const skipButton = page.locator('button:has-text("Omitir")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
    } else {
      for (let i = 0; i < 5; i++) {
        await page.click('button:has-text("Siguiente")');
        await page.waitForTimeout(300);
      }
      await page.click('button:has-text("Comenzar")');
    }

    await page.waitForSelector('text=Continuar como invitado', { timeout: 5000 });
    await page.click('button:has-text("Continuar como invitado")');
    await page.waitForURL('/', { timeout: 10000 });

    // Navigate to categories page
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    // Should have default expense categories
    const categoryCards = page.locator('[class*="rounded-xl bg-white p-4 shadow-sm"]');
    const count = await categoryCards.count();

    // Should have at least some default categories
    expect(count).toBeGreaterThan(0);
  });

  test.skip('should handle direct navigation to home (bypassing onboarding)', async ({ page }) => {
    // Try to navigate directly to home without onboarding
    await page.goto('/');

    // Should either:
    // 1. Redirect to onboarding if not completed
    // 2. Show home if auto-completed

    await page.waitForLoadState('networkidle');

    const currentURL = page.url();

    // Check if redirected to onboarding or stayed on home
    const isOnboarding = currentURL.includes('/onboarding');
    const isHome = currentURL === 'http://localhost:5173/';

    expect(isOnboarding || isHome).toBe(true);
  });
});
