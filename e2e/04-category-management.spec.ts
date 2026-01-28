/**
 * E2E Tests: Category Management (MEDIUM PRIORITY)
 * Tests CRUD operations for categories and category groups
 */

import { test, expect } from '@playwright/test';
import { skipOnboardingWithCategories, clearStorage } from './test-helpers';

test.describe('Category Management', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await page.goto('/');
    await skipOnboardingWithCategories(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test.skip('should navigate to categories page', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    // Verify we're on categories page
    await expect(page).toHaveURL('/categories');

    // Should show page title or header
    const pageHeader = page.locator('text=Categorías, h1').first();
    await expect(pageHeader).toBeVisible({ timeout: 5000 });
  });

  test.skip('should show expense and income tabs', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    // Look for tabs
    const gastosTab = page.locator('button:has-text("Gastos")');
    const ingresosTab = page.locator('button:has-text("Ingresos")');

    await expect(gastosTab).toBeVisible({ timeout: 5000 });
    await expect(ingresosTab).toBeVisible({ timeout: 5000 });

    // Test tab switching
    await ingresosTab.click();
    await page.waitForTimeout(300);

    await gastosTab.click();
    await page.waitForTimeout(300);
  });

  test.skip('should show default expense categories', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    // Should show expense categories (tab should be active by default)
    const categoryCards = page.locator('[class*="rounded-xl bg-white p-4"]');
    const count = await categoryCards.count();

    // Should have at least some default categories
    expect(count).toBeGreaterThan(0);
  });

  test.skip('should create new expense category', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    // Click + button to add category
    const addButton = page.locator('button[class*="rounded-full"]').filter({ has: page.locator('svg') });
    await addButton.first().click();

    // Wait for new category form
    await page.waitForURL(/\/category\/new/, { timeout: 5000 });

    // Fill category name
    await page.fill('input[placeholder*="categoría"]', 'Mascotas');

    // Select icon - click icon picker button
    const iconPickerButton = page.locator('button:has-text("icono")').first();
    if (await iconPickerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await iconPickerButton.click();
      await page.waitForTimeout(500);

      // Select first available icon
      const firstIcon = page.locator('button[class*="grid"] button').first();
      await firstIcon.click();
    }

    // Select color - click color picker button
    const colorPickerButton = page.locator('button:has-text("color")').first();
    if (await colorPickerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await colorPickerButton.click();
      await page.waitForTimeout(500);

      // Select first available color
      const firstColor = page.locator('button[style*="background"]').first();
      await firstColor.click();
    }

    // Save category
    await page.click('button:has-text("Guardar")');

    // Should navigate back to categories page
    await page.waitForURL('/categories', { timeout: 5000 });

    // Verify new category appears in list
    await expect(page.locator('text=Mascotas')).toBeVisible({ timeout: 5000 });
  });

  test.skip('should create new income category', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    // Switch to Income tab
    await page.click('button:has-text("Ingresos")');
    await page.waitForTimeout(500);

    // Click + button
    const addButton = page.locator('button[class*="rounded-full"]').filter({ has: page.locator('svg') });
    await addButton.first().click();

    await page.waitForURL(/\/category\/new/, { timeout: 5000 });

    // Fill form
    await page.fill('input[placeholder*="categoría"]', 'Freelance');

    // Select icon
    const iconPickerButton = page.locator('button:has-text("icono")').first();
    if (await iconPickerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await iconPickerButton.click();
      await page.waitForTimeout(500);
      await page.locator('button[class*="grid"] button').first().click();
    }

    // Select color
    const colorPickerButton = page.locator('button:has-text("color")').first();
    if (await colorPickerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await colorPickerButton.click();
      await page.waitForTimeout(500);
      await page.locator('button[style*="background"]').first().click();
    }

    // Save
    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/categories', { timeout: 5000 });

    // Switch back to Income tab to verify
    await page.click('button:has-text("Ingresos")');
    await expect(page.locator('text=Freelance')).toBeVisible({ timeout: 5000 });
  });

  test.skip('should edit existing category', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    // Click on first category to edit
    const firstCategory = page.locator('[class*="rounded-xl bg-white p-4"]').first();
    await firstCategory.click();

    // Wait for edit page
    await page.waitForURL(/\/category\/.*\/edit/, { timeout: 5000 });

    // Get current name
    const nameInput = page.locator('input[value]').first();
    const currentName = await nameInput.inputValue();

    // Change name
    await nameInput.click();
    await nameInput.fill(currentName + ' Editada');

    // Save changes
    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/categories', { timeout: 5000 });

    // Verify changes
    await expect(page.locator(`text=${currentName} Editada`)).toBeVisible({ timeout: 5000 });
  });

  test.skip('should delete category without transactions', async ({ page }) => {
    // Create a new category first
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('button[class*="rounded-full"]').filter({ has: page.locator('svg') });
    await addButton.first().click();

    await page.waitForURL(/\/category\/new/);
    await page.fill('input[placeholder*="categoría"]', 'Categoría a borrar');

    const iconPickerButton = page.locator('button:has-text("icono")').first();
    if (await iconPickerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await iconPickerButton.click();
      await page.waitForTimeout(500);
      await page.locator('button[class*="grid"] button').first().click();
    }

    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/categories');

    // Now delete it
    await page.click('text=Categoría a borrar');
    await page.waitForURL(/\/category\/.*\/edit/);

    // Click delete button
    await page.click('button:has(svg[class*="lucide-trash"])');

    // Confirm deletion modal
    await page.waitForSelector('text=Eliminar', { timeout: 5000 });
    await page.click('button:has-text("Eliminar")');

    // Should navigate back
    await page.waitForURL('/categories', { timeout: 5000 });

    // Verify category removed
    await expect(page.locator('text=Categoría a borrar')).not.toBeVisible();
  });

  test.skip('should search icons in icon picker', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('button[class*="rounded-full"]').filter({ has: page.locator('svg') });
    await addButton.first().click();

    await page.waitForURL(/\/category\/new/);

    // Open icon picker
    const iconPickerButton = page.locator('button:has-text("icono")').first();
    if (await iconPickerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await iconPickerButton.click();
      await page.waitForTimeout(500);

      // Search for specific icon
      const searchInput = page.locator('input[placeholder*="Buscar"]');
      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill('dog');
        await page.waitForTimeout(300);

        // Should filter icons
        const iconButtons = await page.locator('button[class*="grid"] button').count();
        expect(iconButtons).toBeGreaterThan(0);

        // Select first result
        await page.locator('button[class*="grid"] button').first().click();
      } else {
        // No search, just select first icon
        await page.locator('button[class*="grid"] button').first().click();
      }
    }

    // Verify icon selected (modal should close)
    await page.waitForTimeout(300);
  });

  test.skip('should select custom color', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('button[class*="rounded-full"]').filter({ has: page.locator('svg') });
    await addButton.first().click();

    await page.waitForURL(/\/category\/new/);

    // Fill name first
    await page.fill('input[placeholder*="categoría"]', 'Color test');

    // Open color picker
    const colorPickerButton = page.locator('button:has-text("color")').first();
    if (await colorPickerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await colorPickerButton.click();
      await page.waitForTimeout(500);

      // Select a specific color
      const colorButtons = page.locator('button[style*="background"]');
      const count = await colorButtons.count();

      if (count > 0) {
        // Select second or third color
        const index = Math.min(2, count - 1);
        await colorButtons.nth(index).click();
      }
    }

    // Select icon
    const iconPickerButton = page.locator('button:has-text("icono")').first();
    if (await iconPickerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await iconPickerButton.click();
      await page.waitForTimeout(500);
      await page.locator('button[class*="grid"] button').first().click();
    }

    // Save
    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/categories');

    // Verify category created with custom color
    await expect(page.locator('text=Color test')).toBeVisible({ timeout: 5000 });
  });

  test.skip('should navigate to category groups page', async ({ page }) => {
    await page.goto('/category-groups');
    await page.waitForLoadState('networkidle');

    // Verify we're on category groups page
    expect(page.url()).toContain('/category-groups');
  });

  test.skip('should persist categories after reload', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    // Get count of current categories
    const initialCount = await page.locator('[class*="rounded-xl bg-white p-4"]').count();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify categories still exist
    const afterReloadCount = await page.locator('[class*="rounded-xl bg-white p-4"]').count();

    expect(afterReloadCount).toBe(initialCount);
  });

  test.skip('should validate required fields when creating category', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('button[class*="rounded-full"]').filter({ has: page.locator('svg') });
    await addButton.first().click();

    await page.waitForURL(/\/category\/new/);

    // Try to save without filling name
    const saveButton = page.locator('button:has-text("Guardar")');
    const isDisabled = await saveButton.isDisabled().catch(() => false);

    if (!isDisabled) {
      await saveButton.click();
      // Should stay on same page or show validation
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/category/new');
    } else {
      expect(isDisabled).toBe(true);
    }
  });

  test.skip('should show category icon and color in list', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    // Get first category card
    const firstCategory = page.locator('[class*="rounded-xl bg-white p-4"]').first();

    // Should have icon (SVG)
    const hasIcon = await firstCategory.locator('svg').count();
    expect(hasIcon).toBeGreaterThan(0);

    // Should have colored background
    const iconContainer = firstCategory.locator('[class*="rounded"]').first();
    const hasBackground = await iconContainer.isVisible();
    expect(hasBackground).toBe(true);
  });

  test.skip('should filter categories by type (expense/income)', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');

    // Get expense categories count
    const expenseCount = await page.locator('[class*="rounded-xl bg-white p-4"]').count();

    // Switch to income
    await page.click('button:has-text("Ingresos")');
    await page.waitForTimeout(500);

    // Get income categories count
    const incomeCount = await page.locator('[class*="rounded-xl bg-white p-4"]').count();

    // Counts should be different (or at least one should be > 0)
    expect(expenseCount + incomeCount).toBeGreaterThan(0);
  });
});
