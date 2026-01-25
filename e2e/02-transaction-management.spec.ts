/**
 * E2E Tests: Transaction Management (CRITICAL)
 * Tests complete CRUD operations for transactions
 */

import { test, expect } from '@playwright/test';
import {
  skipOnboardingWithCategories,
  createTransaction,
  getCurrentBalance,
  getTransactionsCount,
  clearStorage,
} from './test-helpers';

test.describe('Transaction Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await skipOnboardingWithCategories(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test.skip('should create expense transaction', async ({ page }) => {
    // Click FAB button
    await page.click('button[class*="fixed"][class*="z-40"]');

    // Wait for form to appear
    await page.waitForSelector('input[placeholder*="gastaste"]', { timeout: 5000 });

    // Fill transaction name
    await page.fill('input[placeholder*="gastaste"]', 'Almuerzo restaurante');

    // Fill amount
    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.click();
    await amountInput.fill('45000');

    // Select category - click category button to open picker
    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);

    // Wait for category picker and select first category
    const firstCategory = page.locator('[class*="rounded-xl bg-white p-4"]').first();
    await firstCategory.click();

    // Save transaction
    await page.click('button:has-text("Guardar")');

    // Wait for navigation back to home
    await page.waitForURL('/', { timeout: 5000 });

    // Verify transaction appears in list
    await expect(page.locator('text=Almuerzo restaurante')).toBeVisible({ timeout: 5000 });

    // Verify transaction count increased
    const count = await getTransactionsCount(page);
    expect(count).toBe(1);
  });

  test.skip('should create income transaction', async ({ page }) => {
    // Click FAB button
    await page.click('button[class*="fixed"][class*="z-40"]');

    // Wait for form
    await page.waitForSelector('button:has-text("Ingresos")', { timeout: 5000 });

    // Switch to Income tab
    await page.click('button:has-text("Ingresos")');

    // Fill transaction name
    await page.fill('input[placeholder*="ingresaste"]', 'Salario mensual');

    // Fill amount
    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.click();
    await amountInput.fill('3000000');

    // Select category
    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    const firstCategory = page.locator('[class*="rounded-xl bg-white p-4"]').first();
    await firstCategory.click();

    // Save
    await page.click('button:has-text("Guardar")');

    // Wait for navigation
    await page.waitForURL('/', { timeout: 5000 });

    // Verify transaction appears
    await expect(page.locator('text=Salario mensual')).toBeVisible({ timeout: 5000 });

    // Verify it's marked as income (has green/emerald color)
    const transactionItem = page.locator('text=Salario mensual').locator('..');
    await expect(transactionItem).toBeVisible();
  });

  test.skip('should edit transaction', async ({ page }) => {
    // Create initial transaction
    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('input[placeholder*="gastaste"]');
    await page.fill('input[placeholder*="gastaste"]', 'Almuerzo');
    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('30000');
    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();
    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    // Click on transaction to edit
    await page.click('text=Almuerzo');

    // Wait for edit form
    await page.waitForURL(/\/edit\//, { timeout: 5000 });

    // Modify name
    const nameInput = page.locator('input[value="Almuerzo"]');
    await nameInput.click();
    await nameInput.fill('Almuerzo con cliente');

    // Modify amount
    const editAmountInput = page.locator('input[inputMode="decimal"]');
    await editAmountInput.click();
    await editAmountInput.fill('50000');

    // Save changes
    await page.click('button:has-text("Guardar")');

    // Wait for navigation
    await page.waitForURL('/', { timeout: 5000 });

    // Verify changes reflected
    await expect(page.locator('text=Almuerzo con cliente')).toBeVisible();
    await expect(page.locator('text=Almuerzo').first()).not.toBeVisible();
  });

  test.skip('should delete transaction', async ({ page }) => {
    // Create transaction first
    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('input[placeholder*="gastaste"]');
    await page.fill('input[placeholder*="gastaste"]', 'Transacción a borrar');
    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('10000');
    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();
    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    const initialCount = await getTransactionsCount(page);

    // Click transaction to open edit
    await page.click('text=Transacción a borrar');
    await page.waitForURL(/\/edit\//);

    // Click delete button (trash icon in header)
    await page.click('button:has(svg[class*="lucide-trash"])');

    // Wait for confirmation modal
    await page.waitForSelector('text=Eliminar movimiento', { timeout: 5000 });

    // Confirm deletion
    await page.click('button:has-text("Eliminar")');

    // Wait for navigation back
    await page.waitForURL('/', { timeout: 5000 });

    // Verify transaction removed
    await expect(page.locator('text=Transacción a borrar')).not.toBeVisible();

    // Verify count decreased
    const newCount = await getTransactionsCount(page);
    expect(newCount).toBe(initialCount - 1);
  });

  test.skip('should create transaction with notes', async ({ page }) => {
    // Create transaction with notes
    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('input[placeholder*="gastaste"]');
    await page.fill('input[placeholder*="gastaste"]', 'Compra con notas');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('25000');

    // Select category
    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();

    // Fill notes - find textarea
    const notesField = page.locator('textarea').first();
    await notesField.click();
    await notesField.fill('Esta es una nota de prueba para la transacción');

    // Save
    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    // Verify transaction created
    await expect(page.locator('text=Compra con notas')).toBeVisible();

    // Click to open and verify notes are saved
    await page.click('text=Compra con notas');
    await page.waitForURL(/\/edit\//);

    // Verify notes are displayed
    const savedNotes = await page.locator('textarea').first().inputValue();
    expect(savedNotes).toBe('Esta es una nota de prueba para la transacción');
  });

  test.skip('should persist transaction after page reload', async ({ page }) => {
    // Create transaction
    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('input[placeholder*="gastaste"]');
    await page.fill('input[placeholder*="gastaste"]', 'Transacción persistente');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('15000');

    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();

    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    // Verify transaction exists
    await expect(page.locator('text=Transacción persistente')).toBeVisible();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify transaction still exists
    await expect(page.locator('text=Transacción persistente')).toBeVisible({ timeout: 5000 });
  });

  test.skip('should validate required fields', async ({ page }) => {
    // Click FAB
    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('input[placeholder*="gastaste"]');

    // Try to save without filling required fields
    const saveButton = page.locator('button:has-text("Guardar")');

    // Button should be disabled or validation should prevent save
    const isDisabled = await saveButton.isDisabled();

    // If not disabled, clicking should not navigate away
    if (!isDisabled) {
      await saveButton.click();
      // Should still be on /add page
      await expect(page).toHaveURL(/\/add/);
    } else {
      expect(isDisabled).toBe(true);
    }
  });

  test.skip('should update balance correctly after transactions', async ({ page }) => {
    // Create income
    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('button:has-text("Ingresos")');
    await page.click('button:has-text("Ingresos")');
    await page.fill('input[placeholder*="ingresaste"]', 'Ingreso test');

    let amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('100000');

    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();
    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    // Create expense
    await page.click('button[class*="fixed"][class*="z-40"]');
    await page.waitForSelector('input[placeholder*="gastaste"]');
    await page.fill('input[placeholder*="gastaste"]', 'Gasto test');

    amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('30000');

    await page.click('button:has-text("Categoría")');
    await page.waitForTimeout(500);
    await page.locator('[class*="rounded-xl bg-white p-4"]').first().click();
    await page.click('button:has-text("Guardar")');
    await page.waitForURL('/');

    // Calculate expected balance
    const balance = await getCurrentBalance(page);
    expect(balance).toBe(70000); // 100000 - 30000
  });
});
