/**
 * E2E Tests: Transaction CRUD (CRITICAL - Tier 1)
 *
 * Tests complete CRUD operations for transactions.
 * Core functionality that MUST work.
 */

import { test, expect } from '@playwright/test';
import {
  setupTestUser,
  mockSupabase,
  getCurrentBalance,
  getTransactionsCount,
  getTransactions,
  expectTransactionToExist,
  expectTransactionNotToExist,
  expectBalance,
} from '../test-helpers';

test.describe('Transaction Management', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Anonymous user with completed onboarding
    await page.goto('/');
    await setupTestUser(page);
    await mockSupabase(page);

    // Navigate to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should create expense transaction', async ({ page }) => {
    // Click FAB button (floating action button)
    // Try multiple selectors
    const fabSelectors = [
      '[data-testid="fab-add-transaction"]',
      'button[class*="fixed"][class*="z-40"]',
      'button[class*="rounded-full"]',
    ];

    let fabClicked = false;
    for (const selector of fabSelectors) {
      const fab = page.locator(selector).first();
      if (await fab.isVisible({ timeout: 2000 })) {
        await fab.click();
        fabClicked = true;
        break;
      }
    }

    expect(fabClicked).toBe(true);

    // Wait for AddActionSheet to appear
    await page.waitForTimeout(500);

    // Click "Gasto Manual" (Manual Expense) button
    const addExpenseButton = page.locator('[data-testid="add-expense-button"]');
    await addExpenseButton.click();

    // Wait for transaction form
    await page.waitForURL(/\/(add|edit)/, { timeout: 5000 });

    // Should be on expense tab by default
    // Fill transaction name
    const nameInput = page.locator('[data-testid="transaction-name-input"]');
    await nameInput.fill('Almuerzo restaurante');

    // Fill amount
    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.click();
    await amountInput.fill('45000');

    // Select category (click category button to open picker)
    const categoryButton = page.locator('button').filter({
      hasText: /categoría|category/i,
    });
    await categoryButton.click();

    // Wait for category picker drawer
    await page.waitForTimeout(500);

    // Select first available category (button with rounded-full icon inside)
    const firstCategory = page
      .locator('button')
      .filter({ has: page.locator('div[class*="rounded-full"]') })
      .nth(1); // Skip "Nueva Categoría" button, select first real category
    await firstCategory.click();

    // Save transaction
    const saveButton = page.locator('button').filter({
      hasText: /guardar|save/i,
    });
    await saveButton.click();

    // Wait for navigation back to home
    await page.waitForURL('/', { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Wait for Zustand to persist state to localStorage
    await page.waitForTimeout(1000);

    // Verify transaction appears in list with correct name
    await expectTransactionToExist(page, 'Almuerzo restaurante');

    // Verify balance decreased (expense)
    const balance = await getCurrentBalance(page);
    expect(balance).toBe(-45000);
  });

  test('should create income transaction', async ({ page }) => {
    // Click FAB
    const fab = page.locator('button[class*="fixed"]').first();
    await fab.click();
    await page.waitForTimeout(500);

    // Click "Ingreso Manual" (Manual Income) button
    const addIncomeButton = page.locator('[data-testid="add-income-button"]');
    await addIncomeButton.click();

    // Wait for form (already on income tab)
    await page.waitForURL(/\/(add|edit)/, { timeout: 5000 });

    // Fill transaction name
    const nameInput = page.locator('[data-testid="transaction-name-input"]');
    await nameInput.fill('Salario mensual');

    // Fill amount
    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.click();
    await amountInput.fill('3000000');

    // Select category
    const categoryButton = page.locator('button').filter({
      hasText: /categoría|category/i,
    });
    await categoryButton.click();
    await page.waitForTimeout(500);

    const firstCategory = page
      .locator('button')
      .filter({ has: page.locator('div[class*="rounded-full"]') })
      .nth(1); // Skip "Nueva Categoría" button, select first real category
    await firstCategory.click();

    // Save
    const saveButton = page.locator('button').filter({
      hasText: /guardar|save/i,
    });
    await saveButton.click();

    // Wait for navigation
    await page.waitForURL('/', { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Verify transaction appears in list
    await expectTransactionToExist(page, 'Salario mensual');

    // Wait for Zustand to persist to localStorage
    await page.waitForTimeout(500);

    // Verify balance increased (income)
    const balance = await getCurrentBalance(page);
    expect(balance).toBe(3000000);
  });

  test('should edit transaction', async ({ page }) => {
    // First create a transaction using the UI
    const fab = page.locator('button[class*="fixed"]').first();
    await fab.click();
    await page.waitForTimeout(500);

    const addExpenseButton = page.locator('[data-testid="add-expense-button"]');
    await addExpenseButton.click();
    await page.waitForURL(/\/(add|edit)/, { timeout: 5000 });

    const nameInput = page.locator('[data-testid="transaction-name-input"]');
    await nameInput.fill('Compra original');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.click();
    await amountInput.fill('30000');

    const categoryButton = page.locator('button').filter({
      hasText: /categoría|category/i,
    });
    await categoryButton.click();
    await page.waitForTimeout(500);

    const firstCategory = page
      .locator('button')
      .filter({ has: page.locator('div[class*="rounded-full"]') })
      .nth(1);
    await firstCategory.click();

    const saveButton = page.locator('button').filter({
      hasText: /guardar|save/i,
    });
    await saveButton.click();

    await page.waitForURL('/', { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Now click on transaction to edit
    const transactionItem = page.locator('text=Compra original').first();
    await transactionItem.click();

    // Wait for edit form
    await page.waitForURL(/\/edit\//, { timeout: 5000 });

    // Modify name
    const editNameInput = page.locator('[data-testid="transaction-name-input"]');
    await editNameInput.click();
    await editNameInput.fill('Compra editada');

    // Modify amount
    const editAmountInput = page.locator('input[inputMode="decimal"]');
    await editAmountInput.click();
    await editAmountInput.fill('50000');

    // Save changes
    const editSaveButton = page.locator('button').filter({
      hasText: /guardar|save/i,
    });
    await editSaveButton.click();

    // Wait for navigation
    await page.waitForURL('/', { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Verify changes reflected in UI
    await expectTransactionToExist(page, 'Compra editada');
    await expectTransactionNotToExist(page, 'Compra original');

    // Wait for Zustand to persist
    await page.waitForTimeout(500);

    // Verify amount changed in balance (from 30000 to 50000)
    const balance = await getCurrentBalance(page);
    expect(balance).toBe(-50000);
  });

  test('should delete transaction', async ({ page }) => {
    // Create a transaction using the UI
    const fab = page.locator('button[class*="fixed"]').first();
    await fab.click();
    await page.waitForTimeout(500);

    const addExpenseButton = page.locator('[data-testid="add-expense-button"]');
    await addExpenseButton.click();
    await page.waitForURL(/\/(add|edit)/, { timeout: 5000 });

    const nameInput = page.locator('[data-testid="transaction-name-input"]');
    await nameInput.fill('Transacción a borrar');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.click();
    await amountInput.fill('10000');

    const categoryButton = page.locator('button').filter({
      hasText: /categoría|category/i,
    });
    await categoryButton.click();
    await page.waitForTimeout(500);

    const firstCategory = page
      .locator('button')
      .filter({ has: page.locator('div[class*="rounded-full"]') })
      .nth(1);
    await firstCategory.click();

    const saveButton = page.locator('button').filter({
      hasText: /guardar|save/i,
    });
    await saveButton.click();

    await page.waitForURL('/', { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Click transaction to open edit
    const transactionItem = page.locator('text=Transacción a borrar');
    await transactionItem.click();
    await page.waitForURL(/\/edit\//, { timeout: 5000 });

    // Click delete button (trash icon in header)
    const deleteButton = page.locator('button').filter({
      has: page.locator('svg[class*="lucide-trash"]'),
    });
    await deleteButton.click();

    // Wait for confirmation modal
    await page.waitForSelector('text=/eliminar movimiento|delete/i', { timeout: 5000 });

    // Confirm deletion
    const confirmButton = page.locator('button').filter({
      hasText: /eliminar|delete/i,
    }).last(); // Get the confirm button, not cancel
    await confirmButton.click();

    // Wait for navigation back
    await page.waitForURL('/', { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Verify transaction removed from list
    await expectTransactionNotToExist(page, 'Transacción a borrar');

    // Wait for Zustand to persist
    await page.waitForTimeout(500);

    // Verify balance is 0 after deletion
    await expectBalance(page, 0);
  });

  test('should create transaction with notes', async ({ page }) => {
    // Click FAB
    const fab = page.locator('button[class*="fixed"]').first();
    await fab.click();
    await page.waitForTimeout(500);

    // Click "Gasto Manual" (Manual Expense) button
    const addExpenseButton = page.locator('[data-testid="add-expense-button"]');
    await addExpenseButton.click();

    await page.waitForURL(/\/(add|edit)/, { timeout: 5000 });

    // Fill name
    const nameInput = page.locator('[data-testid="transaction-name-input"]');
    await nameInput.fill('Compra con notas');

    // Fill amount
    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.fill('25000');

    // Select category
    const categoryButton = page.locator('button').filter({
      hasText: /categoría|category/i,
    });
    await categoryButton.click();
    await page.waitForTimeout(500);
    const firstCategory = page
      .locator('button')
      .filter({ has: page.locator('div[class*="rounded-full"]') })
      .nth(1); // Skip "Nueva Categoría" button, select first real category
    await firstCategory.click();

    // Wait for category drawer to close
    await page.waitForTimeout(500);

    // Fill notes
    const notesInput = page.locator('[data-testid="transaction-notes-input"]');
    await notesInput.fill('Esta es una nota de prueba para la transacción');

    // Save
    const saveButton = page.locator('button').filter({
      hasText: /guardar|save/i,
    });
    await saveButton.click();

    await page.waitForURL('/', { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Verify transaction created successfully with notes
    await expectTransactionToExist(page, 'Compra con notas');

    // Wait for Zustand to persist
    await page.waitForTimeout(500);

    // Verify notes were saved to localStorage
    const transactions = await getTransactions(page);
    const notesTransaction = transactions.find((t: any) => t.name === 'Compra con notas');
    expect(notesTransaction).toBeDefined();
    expect(notesTransaction.notes).toBe('Esta es una nota de prueba para la transacción');
  });

  test('should persist transaction after page reload', async ({ page }) => {
    // Create transaction via UI
    const fab = page.locator('button[class*="fixed"]').first();
    await fab.click();
    await page.waitForTimeout(500);

    const addExpenseButton = page.locator('[data-testid="add-expense-button"]');
    await addExpenseButton.click();
    await page.waitForURL(/\/(add|edit)/, { timeout: 5000 });

    const nameInput = page.locator('[data-testid="transaction-name-input"]');
    await nameInput.fill('Transacción persistente');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.click();
    await amountInput.fill('15000');

    const categoryButton = page.locator('button').filter({
      hasText: /categoría|category/i,
    });
    await categoryButton.click();
    await page.waitForTimeout(500);

    const firstCategory = page
      .locator('button')
      .filter({ has: page.locator('div[class*="rounded-full"]') })
      .nth(1);
    await firstCategory.click();

    const saveButton = page.locator('button').filter({
      hasText: /guardar|save/i,
    });
    await saveButton.click();

    await page.waitForURL('/', { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Verify transaction exists
    await expectTransactionToExist(page, 'Transacción persistente');

    // Reload page to test persistence
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify transaction still exists after reload
    await expectTransactionToExist(page, 'Transacción persistente');

    // Verify data persisted correctly
    const count = await getTransactionsCount(page);
    expect(count).toBe(1);

    const balance = await getCurrentBalance(page);
    expect(balance).toBe(-15000);
  });

  test('should create recurring transaction', async ({ page }) => {
    // Click FAB
    const fab = page.locator('button[class*="fixed"]').first();
    await fab.click();
    await page.waitForTimeout(500);

    // Click "Gasto Manual"
    const addExpenseButton = page.locator('[data-testid="add-expense-button"]');
    await addExpenseButton.click();
    await page.waitForURL(/\/(add|edit)/, { timeout: 5000 });

    // Fill transaction name
    const nameInput = page.locator('[data-testid="transaction-name-input"]');
    await nameInput.fill('Suscripción Netflix');

    // Fill amount
    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.click();
    await amountInput.fill('44900');

    // Select category
    const categoryButton = page.locator('button').filter({
      hasText: /categoría|category/i,
    });
    await categoryButton.click();
    await page.waitForTimeout(500);

    const firstCategory = page
      .locator('button')
      .filter({ has: page.locator('div[class*="rounded-full"]') })
      .nth(1);
    await firstCategory.click();
    await page.waitForTimeout(500);

    // Click schedule/recurring button (Repeat icon button)
    const scheduleButton = page.locator('button').filter({
      hasText: /programar|repetir|schedule/i,
    });
    await scheduleButton.click();

    // Wait for schedule drawer to open
    await page.waitForTimeout(500);

    // Select monthly frequency (should be default, but click to ensure)
    const monthlyButton = page.locator('button').filter({
      hasText: /mensual|monthly/i,
    });
    await monthlyButton.click();

    // Save schedule configuration
    const saveScheduleButton = page.locator('button').filter({
      hasText: /guardar|aplicar|save/i,
    }).last(); // Use .last() to get the schedule drawer save button, not the main form save
    await saveScheduleButton.click();

    // Wait for drawer to close
    await page.waitForTimeout(500);

    // Save transaction
    const saveButton = page.locator('button').filter({
      hasText: /guardar|save/i,
    });
    await saveButton.click();

    // Wait for navigation
    await page.waitForURL('/', { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Verify transaction appears with recurring indicator
    await expectTransactionToExist(page, 'Suscripción Netflix');
  });

  test('should select different categories', async ({ page }) => {
    // Test 1: Create transaction with first category
    const fab = page.locator('button[class*="fixed"]').first();
    await fab.click();
    await page.waitForTimeout(500);

    const addExpenseButton = page.locator('[data-testid="add-expense-button"]');
    await addExpenseButton.click();
    await page.waitForURL(/\/(add|edit)/, { timeout: 5000 });

    const nameInput = page.locator('[data-testid="transaction-name-input"]');
    await nameInput.fill('Compra categoría 1');

    const amountInput = page.locator('input[inputMode="decimal"]');
    await amountInput.click();
    await amountInput.fill('50000');

    // Select first category
    const categoryButton = page.locator('button').filter({
      hasText: /categoría|category/i,
    });
    await categoryButton.click();
    await page.waitForTimeout(500);

    const firstCategory = page
      .locator('button')
      .filter({ has: page.locator('div[class*="rounded-full"]') })
      .nth(1);
    await firstCategory.click();
    await page.waitForTimeout(500);

    const saveButton = page.locator('button').filter({
      hasText: /guardar|save/i,
    });
    await saveButton.click();

    await page.waitForURL('/', { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Verify first transaction exists
    await expectTransactionToExist(page, 'Compra categoría 1');

    // Test 2: Create transaction with second category
    await fab.click();
    await page.waitForTimeout(500);

    await addExpenseButton.click();
    await page.waitForURL(/\/(add|edit)/, { timeout: 5000 });

    await nameInput.fill('Compra categoría 2');
    await amountInput.click();
    await amountInput.fill('75000');

    // Select second category (different from first)
    await categoryButton.click();
    await page.waitForTimeout(500);

    const secondCategory = page
      .locator('button')
      .filter({ has: page.locator('div[class*="rounded-full"]') })
      .nth(2);
    await secondCategory.click();
    await page.waitForTimeout(500);

    await saveButton.click();

    await page.waitForURL('/', { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Verify second transaction exists
    await expectTransactionToExist(page, 'Compra categoría 2');

    // Both transactions should be visible in the list
    await expectTransactionToExist(page, 'Compra categoría 1');
  });
});
