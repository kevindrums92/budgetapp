/**
 * E2E Test Helpers
 * Shared utilities for Playwright tests
 */

import { Page, expect } from '@playwright/test';

/**
 * Skip onboarding and set up minimal budget state for testing
 *
 * This helper:
 * 1. Marks onboarding as completed (v2)
 * 2. Creates a minimal budget state with essential default categories
 * 3. Allows tests to run without going through the full onboarding flow
 */
export async function skipOnboardingWithCategories(page: Page) {
  await page.evaluate(() => {
    // Clear ALL localStorage first to ensure clean state
    localStorage.clear();

    // Mark onboarding as completed
    // The storage service will automatically inject default categories
    // when it sees this flag with empty categoryDefinitions
    localStorage.setItem('budget.onboarding.completed.v2', 'true');
    localStorage.setItem('budget.onboarding.timestamp.v2', Date.now().toString());
  });
}

/**
 * Create a transaction using the FAB button and form
 */
export async function createTransaction(page: Page, data: {
  type: 'income' | 'expense';
  name: string;
  category: string;
  amount: number;
  date?: string;
  notes?: string;
}) {
  // Click FAB button
  await page.click('button[class*="fixed"][class*="z-40"]');

  // Wait for form to appear
  await page.waitForSelector('input[placeholder*="gastaste"]', { timeout: 5000 });

  // Select type (expense/income)
  if (data.type === 'income') {
    await page.click('button:has-text("Ingresos")');
  }
  // Expense is default, no need to click

  // Fill name
  await page.fill('input[placeholder*="gastaste"]', data.name);

  // Fill amount
  const amountInput = page.locator('input[inputMode="decimal"]');
  await amountInput.click();
  await amountInput.fill(data.amount.toString());

  // Select category - click category button to open picker
  await page.click('button:has-text("Categoría")');
  await page.waitForSelector(`button:has-text("${data.category}")`, { timeout: 5000 });
  await page.click(`button:has-text("${data.category}")`);

  // Fill notes if provided
  if (data.notes) {
    await page.fill('textarea[placeholder*="notas"]', data.notes);
  }

  // Fill date if provided (using DatePicker)
  if (data.date) {
    // Click date button to open picker
    await page.click('button:has-text("Fecha")');
    // Wait for date picker modal
    await page.waitForSelector('[class*="z-[80]"]', { timeout: 5000 });
    // For simplicity, we'll just close the picker and keep default date
    // Full date selection would require more complex logic
    await page.keyboard.press('Escape');
  }

  // Click Guardar button
  await page.click('button:has-text("Guardar")');

  // Wait for navigation back to home
  await page.waitForURL('/', { timeout: 5000 });
}

/**
 * Create a category
 */
export async function createCategory(page: Page, data: {
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
}) {
  // Navigate to categories page
  await page.goto('/categories');

  // Select tab
  if (data.type === 'income') {
    await page.click('button:has-text("Ingresos")');
  }

  // Click + button to add category
  await page.click('button[class*="rounded-full"]:has(svg)');

  // Wait for form
  await page.waitForSelector('input[placeholder*="categoría"]', { timeout: 5000 });

  // Fill name
  await page.fill('input[placeholder*="categoría"]', data.name);

  // Select icon (click icon picker)
  await page.click('button:has-text("Seleccionar icono")');
  // Search for icon
  await page.fill('input[placeholder*="Buscar"]', data.icon);
  // Click first result
  await page.click('button[class*="grid"] > button').first();

  // Select color (click color picker)
  await page.click('button:has-text("Seleccionar color")');
  // Click a color button (simplified - just click first)
  await page.click('button[style*="background"]').first();

  // Save
  await page.click('button:has-text("Guardar")');

  // Wait for navigation
  await page.waitForURL('/categories', { timeout: 5000 });
}

/**
 * Wait for cloud sync to complete
 */
export async function waitForCloudSync(page: Page, timeout = 5000) {
  // Wait for cloudStatus to be 'ok' in localStorage
  await page.waitForFunction(
    () => {
      const state = localStorage.getItem('budget_state');
      if (!state) return false;
      const parsed = JSON.parse(state);
      return parsed.cloudStatus === 'ok' || parsed.cloudStatus === undefined;
    },
    { timeout }
  );
}

/**
 * Select a month in the month picker
 */
export async function selectMonthInPicker(page: Page, monthKey: string) {
  // Click month selector button in TopHeader
  await page.click('button:has-text("Mes")');

  // Wait for month picker modal
  await page.waitForSelector('[class*="z-50"]', { timeout: 5000 });

  // Click the month button (simplified - would need specific month logic)
  await page.click(`button:has-text("${monthKey}")`);
}

/**
 * Mock offline state
 */
export async function goOffline(page: Page) {
  await page.context().setOffline(true);
}

/**
 * Mock online state
 */
export async function goOnline(page: Page) {
  await page.context().setOffline(false);
}

/**
 * Get current balance from localStorage
 */
export async function getCurrentBalance(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const state = localStorage.getItem('budget_state');
    if (!state) return 0;
    const parsed = JSON.parse(state);
    const income = parsed.transactions?.filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
    const expense = parsed.transactions?.filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
    return income - expense;
  });
}

/**
 * Get transactions count from localStorage
 */
export async function getTransactionsCount(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const state = localStorage.getItem('budget_state');
    if (!state) return 0;
    const parsed = JSON.parse(state);
    return parsed.transactions?.length || 0;
  });
}

/**
 * Clear all localStorage data
 */
export async function clearStorage(page: Page) {
  // Navigate to page first if not already navigated
  if (!page.url() || page.url() === 'about:blank') {
    await page.goto('/');
  }

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
