/**
 * E2E Tests: Free Tier Fully Unlocked
 *
 * Verifies that ALL features are accessible to free (non-Pro) users:
 * - Unlimited categories
 * - Unlimited budgets
 * - Unlimited scheduled transactions
 * - Stats page without blur/lock
 * - History filters without lock icons
 * - Export without paywall
 */

import { test, expect } from '@playwright/test';
import { setupTestUser, mockSupabase } from '../test-helpers';

test.describe('Free Tier - All Features Unlocked', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setupTestUser(page);
    await mockSupabase(page);

    // Seed default categories + a transaction so stats has data
    await page.evaluate(() => {
      const state = localStorage.getItem('budget_app_v1');
      const parsed = state ? JSON.parse(state) : {};

      // Add 12 categories (more than old free limit of 10)
      const categories = [];
      const names = [
        'Alimentación', 'Transporte', 'Entretenimiento', 'Salud',
        'Educación', 'Hogar', 'Ropa', 'Tecnología',
        'Viajes', 'Mascotas', 'Regalos', 'Deportes',
      ];
      for (let i = 0; i < 12; i++) {
        categories.push({
          id: `cat-${i}`,
          name: names[i],
          icon: 'shopping-cart',
          color: '#18B7B0',
          type: 'expense',
          isDefault: i < 8,
        });
      }

      // Add an income category
      categories.push({
        id: 'cat-income-1',
        name: 'Salario',
        icon: 'briefcase',
        color: '#10B981',
        type: 'income',
        isDefault: true,
      });

      // Add transactions so stats page has data
      const today = new Date().toISOString().split('T')[0];
      const transactions = [
        {
          id: 'tx-1',
          name: 'Almuerzo',
          amount: 25000,
          type: 'expense',
          category: 'cat-0',
          date: today,
          notes: '',
        },
        {
          id: 'tx-2',
          name: 'Taxi',
          amount: 15000,
          type: 'expense',
          category: 'cat-1',
          date: today,
          notes: '',
        },
        {
          id: 'tx-3',
          name: 'Sueldo',
          amount: 3000000,
          type: 'income',
          category: 'cat-income-1',
          date: today,
          notes: '',
        },
      ];

      // Add 3 budgets (more than old free limit of 2)
      const budgets = [
        { id: 'budget-1', categoryId: 'cat-0', amount: 500000, period: 'monthly', startDate: today },
        { id: 'budget-2', categoryId: 'cat-1', amount: 200000, period: 'monthly', startDate: today },
        { id: 'budget-3', categoryId: 'cat-2', amount: 150000, period: 'monthly', startDate: today },
      ];

      // Add 4 scheduled transactions (more than old free limit of 3)
      const scheduled = [
        { id: 'sched-1', name: 'Netflix', amount: 30000, type: 'expense', category: 'cat-2', frequency: 'monthly', nextDate: today, isActive: true },
        { id: 'sched-2', name: 'Gym', amount: 80000, type: 'expense', category: 'cat-11', frequency: 'monthly', nextDate: today, isActive: true },
        { id: 'sched-3', name: 'Internet', amount: 60000, type: 'expense', category: 'cat-5', frequency: 'monthly', nextDate: today, isActive: true },
        { id: 'sched-4', name: 'Spotify', amount: 15000, type: 'expense', category: 'cat-2', frequency: 'monthly', nextDate: today, isActive: true },
      ];

      parsed.categoryDefinitions = categories;
      parsed.transactions = transactions;
      parsed.budgets = budgets;
      parsed.scheduledTransactions = scheduled;
      // Ensure NO subscription (free user)
      parsed.subscription = null;

      localStorage.setItem('budget_app_v1', JSON.stringify(parsed));
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should show stats page without any blur or lock overlays', async ({ page }) => {
    // Navigate to Stats
    await page.click('a[href="/stats"]');
    await page.waitForURL('/stats');
    await page.waitForLoadState('networkidle');

    // Wait for stats content to render
    await page.waitForTimeout(500);

    // Verify NO blur-sm or blur-md classes on stat cards
    const blurredElements = await page.locator('[class*="blur-sm"], [class*="blur-md"]').count();
    expect(blurredElements).toBe(0);

    // Verify NO Lock icons visible
    const lockIcons = await page.locator('svg.lucide-lock').count();
    expect(lockIcons).toBe(0);

    // Verify NO "Desbloquear" / "Unlock" CTA overlays
    const unlockCTA = await page.locator('text=/desbloquear|unlock|hazte pro|go pro/i').count();
    expect(unlockCTA).toBe(0);
  });

  test('should allow access to history page without lock icons', async ({ page }) => {
    // Navigate to History directly
    await page.goto('/history');
    await page.waitForURL('/history');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Check no Lock icons are rendered in the page
    const lockCount = await page.locator('svg.lucide-lock').count();
    expect(lockCount).toBe(0);

    // Check no opacity-60 on filter buttons (old Pro gate styling)
    const dimmedFilters = await page.locator('button[class*="opacity-60"]').count();
    expect(dimmedFilters).toBe(0);

    // Verify no paywall modal
    const paywallModal = await page.locator('text=/hazte pro|go pro/i').count();
    expect(paywallModal).toBe(0);
  });

  test('should allow export CSV without paywall', async ({ page }) => {
    // Navigate to Profile > Export CSV
    await page.click('a[href="/profile"]');
    await page.waitForURL('/profile');
    await page.waitForLoadState('networkidle');

    // Find Export CSV option
    const exportButton = page.locator('button, a').filter({
      hasText: /export.*csv|exportar.*csv/i,
    }).first();

    if (await exportButton.isVisible({ timeout: 3000 })) {
      await exportButton.click();
      await page.waitForTimeout(500);

      // Verify no PaywallModal appeared
      const paywallModal = page.locator('text=/hazte pro|go pro|suscr/i');
      await expect(paywallModal).not.toBeVisible({ timeout: 1000 });

      // Verify export options are visible (not locked)
      const lockCount = await page.locator('svg.lucide-lock').count();
      expect(lockCount).toBe(0);
    }
  });

  test('should load categories page without Pro gate or limit warning', async ({ page }) => {
    // Navigate directly to categories page
    await page.goto('/categories');
    await page.waitForURL('/categories');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Verify categories are rendered (at least some visible)
    const categoryButtons = page.locator('button').filter({
      has: page.locator('svg'),
    });
    const count = await categoryButtons.count();
    expect(count).toBeGreaterThan(0);

    // No lock icons
    const lockCount = await page.locator('svg.lucide-lock').count();
    expect(lockCount).toBe(0);

    // No paywall modal or Pro gate
    const paywallModal = await page.locator('text=/hazte pro|go pro/i').count();
    expect(paywallModal).toBe(0);
  });

  test('should have no PaywallModal or Pro gates on scheduled transactions page', async ({ page }) => {
    // Navigate to Profile > Scheduled
    await page.click('a[href="/profile"]');
    await page.waitForURL('/profile');
    await page.waitForLoadState('networkidle');

    const scheduledButton = page.locator('button, a').filter({
      hasText: /programadas|scheduled/i,
    }).first();

    if (await scheduledButton.isVisible({ timeout: 3000 })) {
      await scheduledButton.click();
      await page.waitForTimeout(500);

      // FAB should be clickable without paywall
      const fab = page.locator('button[class*="fixed"][class*="rounded-full"]').first();
      if (await fab.isVisible({ timeout: 2000 })) {
        await fab.click();
        await page.waitForTimeout(300);

        // Should navigate to add transaction, NOT show paywall
        const paywallModal = page.locator('text=/hazte pro|go pro|suscr/i');
        await expect(paywallModal).not.toBeVisible({ timeout: 1000 });
      }
    }
  });
});
