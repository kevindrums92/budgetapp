import { test, expect } from '@playwright/test';

/**
 * Tests for features released in current version
 * Based on CHANGELOG unreleased section
 */
test.describe('Release Features - v0.7.0', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('budget.welcomeSeen.v1', '1');
      localStorage.setItem('budget.budgetOnboardingSeen.v1', '1');
    });
    await page.reload();
    await page.waitForTimeout(3000);
    await expect(page.locator('text=Balance')).toBeVisible({ timeout: 10000 });

    // Click guest button if WelcomeGate appears
    const guestButton = page.locator('button:has-text("Continuar como invitado")');
    if (await guestButton.isVisible().catch(() => false)) {
      await guestButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('CategoryMonthDetailPage - should navigate from Stats to category detail', async ({ page }) => {
    // First, create some expense transactions
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await expect(page.locator('text=Nuevo Gasto')).toBeVisible();
    await page.fill('input[placeholder*="qué gastaste"]', 'Compra Supermercado');

    let amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.click();
    await amountInput.fill('50000');

    await page.click('button:has-text("Seleccionar")');
    await expect(page.locator('button:has-text("Mercado")')).toBeVisible();
    await page.click('button:has-text("Mercado")');
    await page.click('button:has-text("Guardar")');

    // Wait to be back on home
    await expect(page.locator('text=Balance')).toBeVisible();
    await page.waitForTimeout(500);

    // Create another transaction in same category
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await expect(page.locator('text=Nuevo Gasto')).toBeVisible();
    await page.fill('input[placeholder*="qué gastaste"]', 'Restaurante');

    amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.click();
    await amountInput.fill('35000');

    await page.click('button:has-text("Seleccionar")');
    await expect(page.locator('button:has-text("Mercado")')).toBeVisible();
    await page.click('button:has-text("Mercado")');
    await page.click('button:has-text("Guardar")');

    // Wait to be back on home
    await expect(page.locator('text=Balance')).toBeVisible();
    await page.waitForTimeout(500);

    // Navigate to Stats page
    await page.click('text=Stats');
    await expect(page.locator('text=Estadísticas')).toBeVisible();

    // Wait for charts to render
    await page.waitForTimeout(1500);

    // Click on a category in the legend
    await page.locator('button:has-text("Mercado")').first().click();

    // Wait for navigation
    await page.waitForTimeout(1000);

    // Should navigate to CategoryMonthDetailPage
    await expect(page.url()).toContain('/category/');
    await expect(page.url()).toContain('/month/');

    // Verify page shows category icon and total
    await expect(page.getByRole('heading', { name: 'Mercado' })).toBeVisible();
    // Verify total (may appear in multiple places, so use first)
    await expect(page.locator('text=85.000').first()).toBeVisible();

    // Verify transaction count
    await expect(page.locator('text=2 transacciones')).toBeVisible();

    // Verify both transactions are listed
    await expect(page.locator('text=Compra Supermercado')).toBeVisible();
    await expect(page.locator('text=Restaurante')).toBeVisible();
  });

  test('CategoryMonthDetailPage - should navigate to edit transaction', async ({ page }) => {
    // Create a transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await expect(page.locator('text=Nuevo Gasto')).toBeVisible();
    await page.fill('input[placeholder*="qué gastaste"]', 'Test Category Detail');

    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.click();
    await amountInput.fill('10000');

    await page.click('button:has-text("Seleccionar")');
    await expect(page.locator('button:has-text("Mercado")')).toBeVisible();
    await page.click('button:has-text("Mercado")');
    await page.click('button:has-text("Guardar")');

    // Wait to be back on home
    await expect(page.locator('text=Balance')).toBeVisible();
    await page.waitForTimeout(500);

    // Go to Stats
    await page.click('text=Stats');
    await expect(page.locator('text=Estadísticas')).toBeVisible();

    // Wait for charts to render
    await page.waitForTimeout(1500);

    // Click category
    await page.locator('button:has-text("Mercado")').first().click();

    // Wait for navigation
    await page.waitForTimeout(1000);

    // Click on transaction to edit
    await page.click('text=Test Category Detail');

    // Wait for navigation
    await page.waitForTimeout(500);

    // Should navigate to edit page
    await expect(page.locator('text=Editar')).toBeVisible();
  });

  test('Transaction Delete Navigation - should go back to previous page after delete', async ({ page }) => {
    // Create a transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await expect(page.locator('text=Nuevo Gasto')).toBeVisible();
    await page.fill('input[placeholder*="qué gastaste"]', 'Delete Navigation Test');

    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.click();
    await amountInput.fill('5000');

    await page.click('button:has-text("Seleccionar")');
    await expect(page.locator('button:has-text("Mercado")')).toBeVisible();
    await page.click('button:has-text("Mercado")');
    await page.click('button:has-text("Guardar")');

    // Wait to be back on home
    await expect(page.locator('text=Balance')).toBeVisible();
    await page.waitForTimeout(500);

    // Go to Stats -> Category Detail
    await page.click('text=Stats');
    await expect(page.locator('text=Estadísticas')).toBeVisible();

    // Wait for charts to render
    await page.waitForTimeout(1500);

    await page.locator('button:has-text("Mercado")').first().click();

    // Wait for navigation
    await page.waitForTimeout(1000);

    // Verify we're on CategoryMonthDetailPage
    await expect(page.url()).toContain('/category/');

    // Click transaction to edit
    await page.click('text=Delete Navigation Test');

    // Wait for navigation
    await page.waitForTimeout(500);

    // Delete the transaction
    await page.click('button:has(svg[class*="lucide-trash"])');
    await page.click('button:has-text("Eliminar")');

    // Wait for navigation
    await page.waitForTimeout(1000);

    // Should navigate back to CategoryMonthDetailPage (NOT Home)
    await expect(page.url()).toContain('/category/');
    await expect(page.locator('text=Mercado')).toBeVisible();
  });

  test('Budget Page - should have gray background with section titles', async ({ page }) => {
    // Navigate to Budget page
    await page.click('text=Budget');

    // Verify section titles are visible
    await expect(page.locator('text=Resumen del Mes')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gastos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ingresos' })).toBeVisible();

    // Verify page has gray background (check computed style)
    const main = page.locator('main').first();
    const backgroundColor = await main.evaluate((el) =>
      window.getComputedStyle(el.parentElement!).backgroundColor
    );

    // bg-gray-50 should not be pure white
    expect(backgroundColor).not.toBe('rgb(255, 255, 255)');
  });

  test('BudgetOnboardingWizard - should show on first visit and allow drag', async ({ page }) => {
    // Clear the onboarding seen flag from both localStorage and reload to clear store
    await page.evaluate(() => {
      localStorage.removeItem('budget.budgetOnboardingSeen.v1');
    });

    // Reload to ensure store picks up the change
    await page.reload();
    await page.waitForTimeout(3000);

    // Click guest button if WelcomeGate appears
    const guestButton = page.locator('button:has-text("Continuar como invitado")');
    if (await guestButton.isVisible().catch(() => false)) {
      await guestButton.click();
      await page.waitForTimeout(1000);
    }

    // Navigate to Budget page
    await page.click('text=Budget');

    // Wait for page to load and wizard to appear
    await page.waitForTimeout(1500);

    // Wizard should be visible
    await expect(page.locator('text=Bienvenido al Budget')).toBeVisible({ timeout: 5000 });

    // Verify we can see the skip button
    await expect(page.locator('button:has-text("Saltar")')).toBeVisible();

    // Click "Siguiente" button
    await page.click('button:has-text("Siguiente")');

    // Wait for transition
    await page.waitForTimeout(300);

    // Should move to second slide
    await expect(page.getByRole('heading', { name: 'Establece Límites' })).toBeVisible({ timeout: 3000 });

    // Click "Siguiente" again
    await page.click('button:has-text("Siguiente")');

    // Wait for transition
    await page.waitForTimeout(300);

    // Third slide
    await expect(page.locator('text=Monitorea tu Progreso')).toBeVisible({ timeout: 3000 });

    // Click "Siguiente" again
    await page.click('button:has-text("Siguiente")');

    // Wait for transition
    await page.waitForTimeout(300);

    // Fourth (last) slide
    await expect(page.locator('text=Balance vs Budget')).toBeVisible({ timeout: 3000 });

    // Last slide should show "¡Entendido!" button instead of "Siguiente"
    await expect(page.locator('button:has-text("¡Entendido!")')).toBeVisible();

    // Click to close
    await page.click('button:has-text("¡Entendido!")');

    // Wait for wizard to close
    await page.waitForTimeout(500);

    // Wizard should close and we should see Budget page
    await expect(page.locator('text=Resumen del Mes')).toBeVisible();
  });

  test('Transaction Form Navigation - should preserve data when creating category', async ({ page }) => {
    // Start creating a transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await expect(page.locator('text=Nuevo Gasto')).toBeVisible();

    // Fill in some data
    await page.fill('input[placeholder*="qué gastaste"]', 'Test Preserve Data');

    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.click();
    await amountInput.fill('12345');

    // Click to select category
    await page.click('button:has-text("Seleccionar")');

    // Click "Nueva Categoría" button
    await page.click('button:has-text("Nueva Categoría")');

    // Should navigate to create category page
    await expect(page.locator('text=Nueva categoría')).toBeVisible();

    // Go back without creating
    await page.click('button:has(svg[class*="lucide-chevron-left"])'); // Back button

    // Should be back on transaction form
    await expect(page.locator('text=Nuevo Gasto')).toBeVisible();

    // Data should be preserved
    const nameValue = await page.locator('input[placeholder*="qué gastaste"]').inputValue();
    expect(nameValue).toBe('Test Preserve Data');

    const amountValue = await page.locator('input[type="text"][inputmode="decimal"]').inputValue();
    expect(amountValue).toBe('12345');
  });

  test('Stats Page Charts - should not have animations (iOS fix)', async ({ page }) => {
    // Create some transactions to have data in charts
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await expect(page.locator('text=Nuevo Gasto')).toBeVisible();
    await page.fill('input[placeholder*="qué gastaste"]', 'Chart Test');

    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.click();
    await amountInput.fill('10000');

    await page.click('button:has-text("Seleccionar")');
    await expect(page.locator('button:has-text("Mercado")')).toBeVisible();
    await page.click('button:has-text("Mercado")');
    await page.click('button:has-text("Guardar")');

    // Wait to be back on home
    await expect(page.locator('text=Balance')).toBeVisible();

    // Navigate to Stats
    await page.click('text=Stats');

    // Wait for charts to render
    await page.waitForTimeout(1000);

    // Verify charts are visible
    await expect(page.locator('text=Gastos por categoría')).toBeVisible();

    // Charts should be responsive to clicks immediately (no animation delay)
    // We can't directly test "no animation" but we can test that elements are clickable
    const categoryButton = page.locator('button:has-text("Mercado")').first();
    await expect(categoryButton).toBeVisible();

    // Should be able to click immediately without waiting for animation
    await categoryButton.click();

    // Should navigate successfully
    await expect(page.url()).toContain('/category/');
  });
});
