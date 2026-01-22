import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Transaction List, Search, and Filters
 *
 * These tests cover:
 * 1. Day grouping with subtotals
 * 2. Text search (by name, category, notes)
 * 3. Type filters (Gastos, Ingresos, Pendientes)
 * 4. Monthly navigation
 */

test.describe("Transaction List - Day Grouping", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("budget.welcomeSeen.v1", "1");
      localStorage.setItem("budget.budgetOnboardingSeen.v1", "1");
    });
    await page.reload();
    await page.waitForTimeout(3000);
    await expect(page.locator("text=Balance")).toBeVisible({ timeout: 10000 });

    const guestButton = page.locator(
      'button:has-text("Continuar como invitado")'
    );
    if (await guestButton.isVisible().catch(() => false)) {
      await guestButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test("should group transactions by day and show correct subtotals", async ({
    page,
  }) => {
    // Create 3 transactions on the same day (today) and verify grouping
    const createTransaction = async (name: string, amount: string) => {
      await page.click('[data-testid="fab-add-transaction"]');
      await page.click('button:has-text("Agregar Gasto")');
      await page.fill('input[placeholder*="qué gastaste"]', name);
      const amountInput = page.locator(
        'input[type="text"][inputmode="decimal"]'
      );
      await amountInput.fill(amount);
      await page.click('button:has-text("Seleccionar")');
      await page.click('button:has-text("Mercado")');
      await page.click('button:has-text("Guardar")');
      await expect(page.locator("text=Balance")).toBeVisible();
      await page.waitForTimeout(300);
    };

    // Create 3 transactions on the same day
    await createTransaction("Compra agrupada 1", "10000");
    await createTransaction("Compra agrupada 2", "20000");
    await createTransaction("Compra agrupada 3", "30000");

    // Verify all transactions are visible
    await expect(page.locator("text=Compra agrupada 1")).toBeVisible();
    await expect(page.locator("text=Compra agrupada 2")).toBeVisible();
    await expect(page.locator("text=Compra agrupada 3")).toBeVisible();

    // The day header should show subtotal of -$ 60.000 for expenses
    // Verify the page shows this value somewhere (in the header)
    await expect(page.locator("text=-$ 60.000").first()).toBeVisible();
  });

  test("should show multiple transactions grouped in one day card", async ({
    page,
  }) => {
    // Create 2 transactions on same day (today) - they should appear in one group
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await page.fill('input[placeholder*="qué gastaste"]', "Gasto uno mismo dia");
    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.fill("15000");
    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Mercado")');
    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();
    await page.waitForTimeout(300);

    // Create second transaction for same day
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await page.fill('input[placeholder*="qué gastaste"]', "Gasto dos mismo dia");
    const amountInput2 = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput2.fill("25000");
    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Mercado")');
    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();

    // Verify both transactions appear
    await expect(page.locator("text=Gasto uno mismo dia")).toBeVisible();
    await expect(page.locator("text=Gasto dos mismo dia")).toBeVisible();

    // Both are grouped together with subtotal -$ 40.000
    await expect(page.locator("text=-$ 40.000").first()).toBeVisible();
  });
});

test.describe("Transaction List - Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("budget.welcomeSeen.v1", "1");
      localStorage.setItem("budget.budgetOnboardingSeen.v1", "1");
    });
    await page.reload();
    await page.waitForTimeout(3000);
    await expect(page.locator("text=Balance")).toBeVisible({ timeout: 10000 });

    const guestButton = page.locator(
      'button:has-text("Continuar como invitado")'
    );
    if (await guestButton.isVisible().catch(() => false)) {
      await guestButton.click();
      await page.waitForTimeout(1000);
    }

    // Create test transactions
    const createTransaction = async (
      name: string,
      category: string,
      note?: string
    ) => {
      await page.click('[data-testid="fab-add-transaction"]');
      await page.click('button:has-text("Agregar Gasto")');
      await page.fill('input[placeholder*="qué gastaste"]', name);
      const amountInput = page.locator(
        'input[type="text"][inputmode="decimal"]'
      );
      await amountInput.fill("10000");
      await page.click('button:has-text("Seleccionar")');
      await page.click(`button:has-text("${category}")`);
      if (note) {
        await page.fill('input[placeholder*="Agregar notas"]', note);
      }
      await page.click('button:has-text("Guardar")');
      await expect(page.locator("text=Balance")).toBeVisible();
      await page.waitForTimeout(300);
    };

    await createTransaction("Netflix Premium", "Suscripciones", "Plan familiar");
    await createTransaction("Almuerzo trabajo", "Restaurantes", "Con colegas");
    await createTransaction("Uber aeropuerto", "Transporte");
  });

  test("should filter transactions by name when searching", async ({
    page,
  }) => {
    // Search bar is always visible - fill it directly
    const searchInput = page.locator('input[placeholder*="Buscar por nombre"]');
    await expect(searchInput).toBeVisible();

    // Search by name
    await searchInput.fill("Netflix");
    await page.waitForTimeout(300);

    // Only Netflix should be visible
    await expect(page.locator("text=Netflix Premium")).toBeVisible();
    await expect(page.locator("text=Almuerzo trabajo")).not.toBeVisible();
    await expect(page.locator("text=Uber aeropuerto")).not.toBeVisible();
  });

  test("should filter transactions by category when searching", async ({
    page,
  }) => {
    // Search bar is always visible
    const searchInput = page.locator('input[placeholder*="Buscar por nombre"]');
    await searchInput.fill("Restaurantes");
    await page.waitForTimeout(300);

    // Only Almuerzo should be visible (it's in Restaurantes category)
    await expect(page.locator("text=Almuerzo trabajo")).toBeVisible();
    await expect(page.locator("text=Netflix Premium")).not.toBeVisible();
    await expect(page.locator("text=Uber aeropuerto")).not.toBeVisible();
  });

  test("should clear search and show all transactions", async ({ page }) => {
    // Search bar is always visible
    const searchInput = page.locator('input[placeholder*="Buscar por nombre"]');
    await searchInput.fill("Netflix");
    await page.waitForTimeout(300);

    // Only Netflix visible
    await expect(page.locator("text=Netflix Premium")).toBeVisible();
    await expect(page.locator("text=Almuerzo trabajo")).not.toBeVisible();

    // Clear search
    await searchInput.fill("");
    await page.waitForTimeout(300);

    // All transactions should be visible again
    await expect(page.locator("text=Netflix Premium")).toBeVisible();
    await expect(page.locator("text=Almuerzo trabajo")).toBeVisible();
    await expect(page.locator("text=Uber aeropuerto")).toBeVisible();
  });
});

test.describe("Transaction List - Type Filters", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("budget.welcomeSeen.v1", "1");
      localStorage.setItem("budget.budgetOnboardingSeen.v1", "1");
    });
    await page.reload();
    await page.waitForTimeout(3000);
    await expect(page.locator("text=Balance")).toBeVisible({ timeout: 10000 });

    const guestButton = page.locator(
      'button:has-text("Continuar como invitado")'
    );
    if (await guestButton.isVisible().catch(() => false)) {
      await guestButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test("should filter to show only expenses when clicking 'Gastos'", async ({
    page,
  }) => {
    // Create expense
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await page.fill('input[placeholder*="qué gastaste"]', "Gasto prueba filtro");
    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.fill("50000");
    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Mercado")');
    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();

    // Create income
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Ingreso")');
    await page.fill('input[placeholder*="De dónde proviene"]', "Ingreso prueba filtro");
    const amountInput2 = page.locator(
      'input[type="text"][inputmode="decimal"]'
    );
    await amountInput2.fill("100000");
    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Salario")');
    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();

    // Both should be visible initially
    await expect(page.locator("text=Gasto prueba filtro")).toBeVisible();
    await expect(page.locator("text=Ingreso prueba filtro")).toBeVisible();

    // Click "Gastos" filter
    await page.click('button:has-text("Gastos")');
    await page.waitForTimeout(300);

    // Only expense should be visible
    await expect(page.locator("text=Gasto prueba filtro")).toBeVisible();
    await expect(page.locator("text=Ingreso prueba filtro")).not.toBeVisible();

    // Click again to deselect filter
    await page.click('button:has-text("Gastos")');
    await page.waitForTimeout(300);

    // Both visible again
    await expect(page.locator("text=Gasto prueba filtro")).toBeVisible();
    await expect(page.locator("text=Ingreso prueba filtro")).toBeVisible();
  });

  test("should filter to show only income when clicking 'Ingresos'", async ({
    page,
  }) => {
    // Create expense
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await page.fill('input[placeholder*="qué gastaste"]', "Gasto para filtro ingresos");
    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.fill("30000");
    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Mercado")');
    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();

    // Create income
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Ingreso")');
    await page.fill('input[placeholder*="De dónde proviene"]', "Ingreso para filtro");
    const amountInput2 = page.locator(
      'input[type="text"][inputmode="decimal"]'
    );
    await amountInput2.fill("200000");
    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Salario")');
    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();

    // Click "Ingresos" filter
    await page.click('button:has-text("Ingresos")');
    await page.waitForTimeout(300);

    // Only income should be visible
    await expect(page.locator("text=Ingreso para filtro")).toBeVisible();
    await expect(page.locator("text=Gasto para filtro ingresos")).not.toBeVisible();
  });

  test("should filter to show only pending/planned when clicking 'Pendientes'", async ({
    page,
  }) => {
    // Create paid transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await page.fill('input[placeholder*="qué gastaste"]', "Gasto pagado");
    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.fill("40000");
    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Mercado")');
    // "Pagado" is default, just save
    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();

    // Create pending transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await page.fill('input[placeholder*="qué gastaste"]', "Gasto pendiente");
    const amountInput2 = page.locator(
      'input[type="text"][inputmode="decimal"]'
    );
    await amountInput2.fill("60000");
    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Servicios")');
    // Change status to "Pendiente"
    await page.click('button:has-text("Pendiente")');
    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();

    // Both should be visible initially
    await expect(page.locator("text=Gasto pagado")).toBeVisible();
    await expect(page.locator("text=Gasto pendiente")).toBeVisible();

    // Click "Pendientes" filter
    await page.click('button:has-text("Pendientes")');
    await page.waitForTimeout(300);

    // Only pending should be visible
    await expect(page.locator("text=Gasto pendiente")).toBeVisible();
    await expect(page.locator("text=Gasto pagado")).not.toBeVisible();
  });
});

test.describe("Transaction List - Monthly Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("budget.welcomeSeen.v1", "1");
      localStorage.setItem("budget.budgetOnboardingSeen.v1", "1");
    });
    await page.reload();
    await page.waitForTimeout(3000);
    await expect(page.locator("text=Balance")).toBeVisible({ timeout: 10000 });

    const guestButton = page.locator(
      'button:has-text("Continuar como invitado")'
    );
    if (await guestButton.isVisible().catch(() => false)) {
      await guestButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test("should only show transactions from selected month", async ({
    page,
  }) => {
    // Create transaction in current month
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await page.fill('input[placeholder*="qué gastaste"]', "Gasto mes actual");
    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.fill("25000");
    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Mercado")');
    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();

    // Verify transaction is visible in current month
    await expect(page.locator("text=Gasto mes actual")).toBeVisible();

    // Navigate to previous month
    await page.click('button[aria-label="Mes anterior"]');
    await page.waitForTimeout(500);

    // Transaction from current month should NOT be visible
    await expect(page.locator("text=Gasto mes actual")).not.toBeVisible();

    // Navigate back to current month
    await page.click('button[aria-label="Mes siguiente"]');
    await page.waitForTimeout(500);

    // Transaction should be visible again
    await expect(page.locator("text=Gasto mes actual")).toBeVisible();
  });

  test("should navigate between months using arrows", async ({ page }) => {
    // First create a transaction so we have something to see
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await page.fill('input[placeholder*="qué gastaste"]', "Test nav mensual");
    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.fill("10000");
    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Mercado")');
    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();

    // Verify transaction exists
    await expect(page.locator("text=Test nav mensual")).toBeVisible();

    // Navigate to previous month
    await page.click('button[aria-label="Mes anterior"]');
    await page.waitForTimeout(500);

    // Transaction should not be visible in previous month
    await expect(page.locator("text=Test nav mensual")).not.toBeVisible();

    // Navigate to next month (should be back to current)
    await page.click('button[aria-label="Mes siguiente"]');
    await page.waitForTimeout(500);

    // Transaction should be visible again
    await expect(page.locator("text=Test nav mensual")).toBeVisible();
  });
});
