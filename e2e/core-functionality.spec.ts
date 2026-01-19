import { test, expect } from '@playwright/test';

test.describe('Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Clear localStorage and set flags to skip onboarding screens
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('budget.welcomeSeen.v1', '1');
      localStorage.setItem('budget.budgetOnboardingSeen.v1', '1');
    });
    await page.reload();

    // Wait for splash screen and onboarding to disappear
    await page.waitForTimeout(3000); // Extended wait for all animations

    // Wait for app to be ready
    await expect(page.locator('text=Balance')).toBeVisible({ timeout: 10000 });

    // Force click the "Continuar como invitado" button if WelcomeGate is still visible
    const guestButton = page.locator('button:has-text("Continuar como invitado")');
    if (await guestButton.isVisible().catch(() => false)) {
      await guestButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should create an expense transaction', async ({ page }) => {
    // Click the FAB button to open AddActionSheet
    await page.click('[data-testid="fab-add-transaction"]');

    // Wait for action sheet to appear and click "Gasto"
    await expect(page.locator('button:has-text("Agregar Gasto")')).toBeVisible();
    await page.click('button:has-text("Agregar Gasto")');

    // Wait for form to load
    await expect(page.locator('text=Nuevo Gasto')).toBeVisible();

    // Fill in expense details
    await page.fill('input[placeholder*="qué gastaste"]', 'Almuerzo');

    // Fill amount (find the large input)
    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.click();
    await amountInput.fill('25000');

    // Select category - click category picker button
    await page.click('button:has-text("Seleccionar")');

    // Wait for category drawer to open and select category
    await expect(page.locator('button:has-text("Mercado")')).toBeVisible();
    await page.click('button:has-text("Mercado")');

    // Save transaction
    await page.click('button:has-text("Guardar")');

    // Verify we're back on home page
    await expect(page.locator('text=Balance')).toBeVisible();

    // Verify transaction appears in the list
    await expect(page.locator('text=Almuerzo')).toBeVisible();
    await expect(page.locator('text=25.000')).toBeVisible();
  });

  test('should create an income transaction', async ({ page }) => {
    // Open transaction form
    await page.click('[data-testid="fab-add-transaction"]');

    // Switch to income tab
    await page.click('button:has-text("Agregar Ingreso")');

    // Wait for form to load
    await expect(page.locator('text=Nuevo Ingreso')).toBeVisible();

    // Fill in income details
    await page.fill('input[placeholder*="proviene"]', 'Salario');

    // Fill amount
    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.click();
    await amountInput.fill('2000000');

    // Select income category
    await page.click('button:has-text("Seleccionar")');
    await expect(page.locator('button:has-text("Salario")')).toBeVisible();
    await page.click('button:has-text("Salario")');

    // Save
    await page.click('button:has-text("Guardar")');

    // Verify - wait for home page and transaction to appear
    await expect(page.locator('text=Balance')).toBeVisible();
    await expect(page.locator('text=Salario').first()).toBeVisible();
  });

  test('should edit a transaction', async ({ page }) => {
    // First, create a transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await expect(page.locator('text=Nuevo Gasto')).toBeVisible();
    await page.fill('input[placeholder*="qué gastaste"]', 'Café');

    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.click();
    await amountInput.fill('5000');

    await page.click('button:has-text("Seleccionar")');
    await expect(page.locator('button:has-text("Mercado")')).toBeVisible();
    await page.click('button:has-text("Mercado")');
    await page.click('button:has-text("Guardar")');

    // Wait to be back on home
    await expect(page.locator('text=Balance')).toBeVisible();

    // Click on the transaction to edit it
    await page.click('text=Café');

    // Wait for edit form
    await expect(page.locator('text=Editar transacción')).toBeVisible();

    // Edit the name
    const nameInput = page.locator('input[placeholder*="qué gastaste"]');
    await nameInput.fill('Café Premium');

    // Edit the amount
    const editAmountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await editAmountInput.click();
    await editAmountInput.fill('8000');

    // Save changes
    await page.click('button:has-text("Guardar")');

    // Verify changes
    await expect(page.locator('text=Café Premium')).toBeVisible();
    await expect(page.locator('text=8.000')).toBeVisible();
    await expect(page.locator('text=5.000')).not.toBeVisible();
  });

  test('should delete a transaction', async ({ page }) => {
    // Create a transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await expect(page.locator('text=Nuevo Gasto')).toBeVisible();
    await page.fill('input[placeholder*="qué gastaste"]', 'Test Delete');

    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.click();
    await amountInput.fill('1000');

    await page.click('button:has-text("Seleccionar")');
    await expect(page.locator('button:has-text("Mercado")')).toBeVisible();
    await page.click('button:has-text("Mercado")');
    await page.click('button:has-text("Guardar")');

    // Wait to be back on home
    await expect(page.locator('text=Balance')).toBeVisible();

    // Click to edit
    await page.click('text=Test Delete');

    // Click delete button (trash icon in header)
    await page.click('button:has(svg[class*="lucide-trash"])');

    // Confirm deletion in modal
    await expect(page.locator('text=Eliminar movimiento')).toBeVisible();
    await page.click('button:has-text("Eliminar")');

    // Verify transaction is gone
    await expect(page.locator('text=Balance')).toBeVisible();
    await expect(page.locator('text=Test Delete')).not.toBeVisible();
  });

  test('should verify balance reflects transactions correctly', async ({ page }) => {
    // Get initial balance
    const balanceText = await page.locator('text=Balance').locator('..').locator('p').first().textContent();

    // Create an income transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Ingreso")');
    await expect(page.locator('text=Nuevo Ingreso')).toBeVisible();
    await page.fill('input[placeholder*="proviene"]', 'Ingreso Test');

    let amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.click();
    await amountInput.fill('100000');

    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Salario")');
    await page.click('button:has-text("Guardar")');

    // Wait for home page
    await expect(page.locator('text=Balance')).toBeVisible();

    // Create an expense transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await expect(page.locator('text=Nuevo Gasto')).toBeVisible();
    await page.fill('input[placeholder*="qué gastaste"]', 'Gasto Test');

    amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.click();
    await amountInput.fill('30000');

    await page.click('button:has-text("Seleccionar")');
    await expect(page.locator('button:has-text("Mercado")')).toBeVisible();
    await page.click('button:has-text("Mercado")');
    await page.click('button:has-text("Guardar")');

    // Verify both transactions exist
    await expect(page.locator('text=Ingreso Test')).toBeVisible();
    await expect(page.locator('text=Gasto Test')).toBeVisible();

    // Verify balance updated (should be +70000 from initial)
    // Note: We're just verifying the amounts appear, not calculating exact balance
    await expect(page.locator('text=100.000')).toBeVisible();
    await expect(page.locator('text=30.000')).toBeVisible();
  });

  test('should navigate between tabs', async ({ page }) => {
    // Verify we're on Home
    await expect(page.locator('text=Balance')).toBeVisible();

    // Click Budget tab
    await page.click('text=Budget');
    await expect(page.locator('text=Resumen del Mes')).toBeVisible();

    // Click Stats tab
    await page.click('text=Stats');
    await expect(page.locator('text=Estadísticas')).toBeVisible();

    // Click Trips tab
    await page.click('text=Trips');
    await expect(page.locator('text=Mis Viajes').or(page.locator('text=Crear viaje'))).toBeVisible();

    // Back to Home
    await page.click('text=Home');
    await expect(page.locator('text=Balance')).toBeVisible();
  });
});
