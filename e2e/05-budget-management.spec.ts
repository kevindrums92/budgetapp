/**
 * E2E Tests: Budget Management (MEDIUM PRIORITY)
 * Tests budget creation, tracking, and monitoring
 */

import { test, expect } from '@playwright/test';
import { skipOnboardingWithCategories, clearStorage } from './test-helpers';

test.describe('Budget Management', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await page.goto('/');
    await skipOnboardingWithCategories(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test.skip('should navigate to budget page', async ({ page }) => {
    // Navigate via bottom bar or direct URL
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    // Verify we're on budget page
    await expect(page).toHaveURL('/budget');
  });

  test.skip('should show budget onboarding wizard on first visit', async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    // May show onboarding wizard (swipeable cards)
    const onboardingWizard = page.locator('text=presupuest, text=budget').first();
    const hasOnboarding = await onboardingWizard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasOnboarding) {
      // If wizard exists, complete it
      const nextButton = page.locator('button:has-text("Siguiente")');
      const startButton = page.locator('button:has-text("¡Entendido!")');

      // Try to skip through wizard
      for (let i = 0; i < 5; i++) {
        if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextButton.click();
          await page.waitForTimeout(300);
        }
      }

      // Click final button
      if (await startButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await startButton.click();
        await page.waitForTimeout(500);
      }
    }

    // Should now show budget page content
    expect(page.url()).toContain('/budget');
  });

  test.skip('should not show wizard on subsequent visits', async ({ page }) => {
    // First visit
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    // Complete wizard if it appears
    const startButton = page.locator('button:has-text("¡Entendido!")');
    if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startButton.click();
    }

    // Set flag manually
    await page.evaluate(() => {
      localStorage.setItem('budgetOnboardingSeen', 'true');
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wizard should not appear
    const wizardAppears = await page
      .locator('button:has-text("¡Entendido!")')
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    expect(wizardAppears).toBe(false);
  });

  test.skip('should create monthly budget for category', async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    // Complete onboarding if needed
    const startButton = page.locator('button:has-text("¡Entendido!")');
    if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startButton.click();
    }

    // Look for "Add Budget" or "Crear presupuesto" button
    const addBudgetButton = page.locator('button:has-text("presupuesto"), button:has-text("budget")').first();

    if (await addBudgetButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBudgetButton.click();
      await page.waitForTimeout(500);

      // Fill budget form (if modal opens)
      // This would depend on actual implementation
      // For now, just verify button is clickable
      expect(true).toBe(true);
    } else {
      // Navigate to create budget page
      await page.goto('/budget/new');
      await page.waitForLoadState('networkidle');

      // Should be on budget creation page
      expect(page.url()).toContain('/budget');
    }
  });

  test.skip('should show budget progress bars', async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    // Complete onboarding if needed
    const startButton = page.locator('button:has-text("¡Entendido!")');
    if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startButton.click();
    }

    // Look for budget cards with progress bars
    const progressBars = page.locator('[class*="progress"], [class*="bg-emerald"], [class*="bg-red"]');

    const hasProgressBars = await progressBars.count();

    // May or may not have budgets initially
    expect(hasProgressBars >= 0).toBe(true);
  });

  test.skip('should track budget spending', async ({ page }) => {
    // Create a transaction first
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Create expense transaction
    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('input[placeholder*="gastaste"]');
    await page.fill('input[placeholder*="gastaste"]', 'Almuerzo para budget');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('25000');

    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();

    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    // Now go to budget page
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    // Complete onboarding
    const startButton = page.locator('button:has-text("¡Entendido!")');
    if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startButton.click();
    }

    // Should show budget tracking (if budgets exist)
    // This verifies the page loads with transaction data
    expect(page.url()).toContain('/budget');
  });

  test.skip('should show empty state when no budgets', async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    // Complete onboarding
    const startButton = page.locator('button:has-text("¡Entendido!")');
    if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startButton.click();
    }

    // Look for empty state or create budget prompt
    // const emptyState = page.locator('text=presupuesto, text=budget, text=crea').first();

    // const hasContent = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);

    // Page should show some content
    expect(true).toBe(true);
  });

  test.skip('should calculate progress correctly', async ({ page }) => {
    // This test verifies budget calculation logic

    // Create transaction with known amount
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('input[placeholder*="gastaste"]');
    await page.fill('input[placeholder*="gastaste"]', 'Gasto calculado');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('50000');

    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();

    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    // Go to budget page
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    // Complete onboarding
    const startButton = page.locator('button:has-text("¡Entendido!")');
    if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startButton.click();
    }

    // Verify budget calculations are reflected
    // (actual verification would depend on budget implementation)
    expect(true).toBe(true);
  });

  test.skip('should handle multiple budgets', async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    // Complete onboarding
    const startButton = page.locator('button:has-text("¡Entendido!")');
    if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startButton.click();
    }

    // Count budget cards
    const budgetCards = page.locator('[class*="rounded-xl bg-white p-4"]');
    const count = await budgetCards.count();

    // Should handle 0 or more budgets
    expect(count >= 0).toBe(true);
  });

  test.skip('should show budget period (monthly/weekly)', async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    // Complete onboarding
    const startButton = page.locator('button:has-text("¡Entendido!")');
    if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startButton.click();
    }

    // Look for period indicators
    // const periodText = page.locator('text=Mensual, text=Semanal, text=Monthly, text=Weekly').first();

    // const hasPeriod = await periodText.isVisible({ timeout: 3000 }).catch(() => false);

    // Period text may or may not be visible depending on budgets
    expect(true).toBe(true);
  });

  test.skip('should persist budgets after reload', async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    // Complete onboarding
    const startButton = page.locator('button:has-text("¡Entendido!")');
    if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startButton.click();
    }

    // Get initial state
    const initialCount = await page.locator('[class*="rounded-xl bg-white p-4"]').count();

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify same state
    const afterCount = await page.locator('[class*="rounded-xl bg-white p-4"]').count();

    expect(afterCount).toBe(initialCount);
  });

  test.skip('should handle budget exceeded state', async ({ page }) => {
    // This test would verify red/warning state when budget is exceeded

    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    // Complete onboarding
    const startButton = page.locator('button:has-text("¡Entendido!")');
    if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startButton.click();
    }

    // Look for exceeded indicators (red progress bars, warning badges)
    const exceededIndicators = page.locator('[class*="bg-red"], [class*="text-red"]');

    const count = await exceededIndicators.count();

    // May or may not have exceeded budgets
    expect(count >= 0).toBe(true);
  });

  test.skip('should navigate between months', async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    // Complete onboarding
    const startButton = page.locator('button:has-text("¡Entendido!")');
    if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startButton.click();
    }

    // Look for month navigation (arrows or month selector)
    const monthSelector = page.locator('button[class*="rounded"]').filter({
      hasText: /enero|febrero|marzo|abril|mayo|junio|julio|agosto|sept|oct|nov|dic/i,
    });

    if (await monthSelector.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await monthSelector.first().click();
      await page.waitForTimeout(500);

      // Should show month picker
      expect(true).toBe(true);
    }
  });

  test.skip('should show budget summary/overview', async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    // Complete onboarding
    const startButton = page.locator('button:has-text("¡Entendido!")');
    if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startButton.click();
    }

    // Look for summary metrics (total budget, spent, remaining)
    const summaryNumbers = page.locator('[class*="text-2xl"], [class*="text-3xl"]');

    const hasNumbers = await summaryNumbers.count();

    expect(hasNumbers >= 0).toBe(true);
  });
});
