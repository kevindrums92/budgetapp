import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Scheduled Transactions - "Editar y registrar" Feature
 *
 * These tests cover the complete user flow for:
 * 1. Creating a scheduled transaction (template)
 * 2. Viewing virtual transactions generated from template
 * 3. Using "Registrar ahora" to materialize a virtual
 * 4. Using "Editar y registrar" to edit and register with changes
 * 5. Handling "Sin cambios" alert
 * 6. Choosing "Solo este registro" vs "Este y los siguientes"
 */

test.describe("Scheduled Transactions - Edit and Register Flow", () => {
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

    // Click guest button if WelcomeGate appears
    const guestButton = page.locator('button:has-text("Continuar como invitado")');
    if (await guestButton.isVisible().catch(() => false)) {
      await guestButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test("should create a scheduled transaction and see virtual in next month", async ({
    page,
  }) => {
    // Create a scheduled expense transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await expect(page.locator("text=Nuevo Gasto")).toBeVisible();

    // Fill transaction details
    await page.fill('input[placeholder*="qué gastaste"]', "Netflix Test");

    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.click();
    await amountInput.fill("60000");

    // Select category
    await page.click('button:has-text("Seleccionar")');
    await expect(page.locator('button:has-text("Suscripciones")')).toBeVisible();
    await page.click('button:has-text("Suscripciones")');

    // Enable schedule
    await page.click("text=Programar automáticamente");
    await expect(page.locator("text=Configurar programación")).toBeVisible();

    // Enable toggle
    await page.click('button:has-text("Desactivado")');
    await expect(page.locator('button:has-text("Activado")')).toBeVisible();

    // Save schedule config
    await page.click('button:has-text("Guardar")');

    // Wait for drawer to close
    await page.waitForTimeout(500);

    // Save the transaction
    await page.click('button:has-text("Guardar")');

    // Wait to be back on home
    await expect(page.locator("text=Balance")).toBeVisible();
    await page.waitForTimeout(500);

    // Verify the transaction appears
    await expect(page.locator("text=Netflix Test")).toBeVisible();

    // Navigate to next month to see the virtual transaction
    await page.click('button[aria-label="Mes siguiente"]');
    await page.waitForTimeout(500);

    // Should see virtual transaction (with purple "Programada" badge)
    await expect(page.locator("text=Netflix Test")).toBeVisible();
    await expect(page.locator("text=Programada").first()).toBeVisible();
  });

  test("should show 'Registrar ahora' and 'Editar y registrar' when clicking virtual", async ({
    page,
  }) => {
    // First create a scheduled transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');

    await page.fill('input[placeholder*="qué gastaste"]', "Gym Membership");
    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.fill("110000");

    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Suscripciones")');

    // Enable schedule
    await page.click("text=Programar automáticamente");
    await page.click('button:has-text("Desactivado")');
    await page.click('button:has-text("Guardar")');
    await page.waitForTimeout(300);

    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();

    // Navigate to next month
    await page.click('button[aria-label="Mes siguiente"]');
    await page.waitForTimeout(500);

    // Click on the virtual transaction
    await page.click("text=Gym Membership");

    // Should show modal with both options
    await expect(page.locator("text=Programada")).toBeVisible();
    await expect(page.locator('button:has-text("Registrar ahora")')).toBeVisible();
    await expect(page.locator('button:has-text("Editar y registrar")')).toBeVisible();
  });

  test("should show 'Sin cambios' alert when saving without modifications", async ({
    page,
  }) => {
    // Create scheduled transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');

    await page.fill('input[placeholder*="qué gastaste"]', "Sin Cambios Test");
    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.fill("50000");

    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Suscripciones")');

    await page.click("text=Programar automáticamente");
    await page.click('button:has-text("Desactivado")');
    await page.click('button:has-text("Guardar")');
    await page.waitForTimeout(300);

    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();

    // Navigate to next month
    await page.click('button[aria-label="Mes siguiente"]');
    await page.waitForTimeout(500);

    // Click on virtual and then "Editar y registrar"
    await page.click("text=Sin Cambios Test");
    await page.click('button:has-text("Editar y registrar")');

    // Wait for edit page
    await expect(page.locator("text=Editar")).toBeVisible();

    // Click save WITHOUT making changes
    await page.click('button:has-text("Guardar cambios")');

    // Should show "Sin cambios" alert
    await expect(page.locator("text=Sin cambios")).toBeVisible();
    await expect(
      page.locator("text=No has realizado ningún cambio")
    ).toBeVisible();

    // Click "Entendido"
    await page.click('button:has-text("Entendido")');

    // Alert should close, still on edit page
    await expect(page.locator("text=Sin cambios")).not.toBeVisible();
    await expect(page.locator("text=Editar")).toBeVisible();
  });

  test("should show template edit modal when changing amount from virtual", async ({
    page,
  }) => {
    // Create scheduled transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');

    await page.fill('input[placeholder*="qué gastaste"]', "Amount Change Test");
    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.fill("100000");

    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Suscripciones")');

    await page.click("text=Programar automáticamente");
    await page.click('button:has-text("Desactivado")');
    await page.click('button:has-text("Guardar")');
    await page.waitForTimeout(300);

    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();

    // Navigate to next month
    await page.click('button[aria-label="Mes siguiente"]');
    await page.waitForTimeout(500);

    // Click on virtual and then "Editar y registrar"
    await page.click("text=Amount Change Test");
    await page.click('button:has-text("Editar y registrar")');

    // Wait for edit page
    await expect(page.locator("text=Editar")).toBeVisible();

    // Change the amount
    const editAmountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await editAmountInput.click();
    await editAmountInput.clear();
    await editAmountInput.fill("150000");

    // Click save
    await page.click('button:has-text("Guardar cambios")');

    // Should show template edit choice modal
    await expect(page.locator("text=Guardar cambios")).toBeVisible();
    await expect(
      page.locator("text=Este es un registro programado")
    ).toBeVisible();
    await expect(
      page.locator('button:has-text("Solo este registro")')
    ).toBeVisible();
    await expect(
      page.locator('button:has-text("Este y los siguientes")')
    ).toBeVisible();
  });

  test("should create individual transaction when choosing 'Solo este registro'", async ({
    page,
  }) => {
    // Create scheduled transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');

    await page.fill('input[placeholder*="qué gastaste"]', "Solo Este Test");
    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.fill("80000");

    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Suscripciones")');

    await page.click("text=Programar automáticamente");
    await page.click('button:has-text("Desactivado")');
    await page.click('button:has-text("Guardar")');
    await page.waitForTimeout(300);

    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();

    // Navigate to next month
    await page.click('button[aria-label="Mes siguiente"]');
    await page.waitForTimeout(500);

    // Click on virtual and then "Editar y registrar"
    await page.click("text=Solo Este Test");
    await page.click('button:has-text("Editar y registrar")');

    // Wait for edit page
    await expect(page.locator("text=Editar")).toBeVisible();

    // Change the amount
    const editAmountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await editAmountInput.click();
    await editAmountInput.clear();
    await editAmountInput.fill("95000");

    // Click save
    await page.click('button:has-text("Guardar cambios")');

    // Wait for modal and click "Solo este registro"
    await expect(page.locator("text=Guardar cambios")).toBeVisible();
    await page.click('button:has-text("Solo este registro")');

    // Should return to transaction list
    await expect(page.locator("text=Balance")).toBeVisible();
    await page.waitForTimeout(500);

    // Should see the modified transaction with new amount
    await expect(page.locator("text=95.000")).toBeVisible();

    // Navigate to next month - should still see virtual (template unchanged)
    await page.click('button[aria-label="Mes siguiente"]');
    await page.waitForTimeout(500);

    // Virtual should still exist with original amount
    await expect(page.locator("text=Solo Este Test")).toBeVisible();
    await expect(page.locator("text=80.000")).toBeVisible();
  });

  test("should end old template and create new when choosing 'Este y los siguientes'", async ({
    page,
  }) => {
    // Create scheduled transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');

    await page.fill('input[placeholder*="qué gastaste"]', "Este y Siguientes Test");
    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.fill("70000");

    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Suscripciones")');

    await page.click("text=Programar automáticamente");
    await page.click('button:has-text("Desactivado")');
    await page.click('button:has-text("Guardar")');
    await page.waitForTimeout(300);

    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();

    // Navigate to next month
    await page.click('button[aria-label="Mes siguiente"]');
    await page.waitForTimeout(500);

    // Click on virtual and then "Editar y registrar"
    await page.click("text=Este y Siguientes Test");
    await page.click('button:has-text("Editar y registrar")');

    // Wait for edit page
    await expect(page.locator("text=Editar")).toBeVisible();

    // Change the amount
    const editAmountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await editAmountInput.click();
    await editAmountInput.clear();
    await editAmountInput.fill("85000");

    // Click save
    await page.click('button:has-text("Guardar cambios")');

    // Wait for modal and click "Este y los siguientes"
    await expect(page.locator("text=Guardar cambios")).toBeVisible();
    await page.click('button:has-text("Este y los siguientes")');

    // Should return to transaction list
    await expect(page.locator("text=Balance")).toBeVisible();
    await page.waitForTimeout(500);

    // Should see new template with updated amount in current month
    await expect(page.locator("text=85.000")).toBeVisible();

    // Navigate to next month - should see new virtual with new amount
    await page.click('button[aria-label="Mes siguiente"]');
    await page.waitForTimeout(500);

    await expect(page.locator("text=Este y Siguientes Test")).toBeVisible();
    await expect(page.locator("text=85.000")).toBeVisible();
  });

  test("should use 'Registrar ahora' to materialize virtual without edit page", async ({
    page,
  }) => {
    // Create scheduled transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');

    await page.fill('input[placeholder*="qué gastaste"]', "Registrar Ahora Test");
    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.fill("45000");

    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Suscripciones")');

    await page.click("text=Programar automáticamente");
    await page.click('button:has-text("Desactivado")');
    await page.click('button:has-text("Guardar")');
    await page.waitForTimeout(300);

    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();

    // Navigate to next month
    await page.click('button[aria-label="Mes siguiente"]');
    await page.waitForTimeout(500);

    // Click on virtual
    await page.click("text=Registrar Ahora Test");

    // Click "Registrar ahora"
    await page.click('button:has-text("Registrar ahora")');

    // Should stay on list (modal closes), virtual becomes real
    await page.waitForTimeout(500);
    await expect(page.locator("text=Balance")).toBeVisible();

    // Transaction should now appear without "Programada" badge
    await expect(page.locator("text=Registrar Ahora Test")).toBeVisible();

    // Click on it - should go to edit page directly (not virtual modal)
    await page.click("text=Registrar Ahora Test");
    await expect(page.locator("text=Editar")).toBeVisible();
  });

  test("should auto-apply 'Este y los siguientes' when changing schedule frequency", async ({
    page,
  }) => {
    // Create scheduled transaction with monthly frequency
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');

    await page.fill('input[placeholder*="qué gastaste"]', "Frequency Change Test");
    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.fill("30000");

    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Suscripciones")');

    await page.click("text=Programar automáticamente");
    await page.click('button:has-text("Desactivado")');
    // Default is monthly, leave as is
    await page.click('button:has-text("Guardar")');
    await page.waitForTimeout(300);

    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();

    // Navigate to next month
    await page.click('button[aria-label="Mes siguiente"]');
    await page.waitForTimeout(500);

    // Click on virtual and then "Editar y registrar"
    await page.click("text=Frequency Change Test");
    await page.click('button:has-text("Editar y registrar")');

    // Wait for edit page
    await expect(page.locator("text=Editar")).toBeVisible();

    // Change frequency to weekly
    await page.click("text=Programado automáticamente");
    await expect(page.locator("text=Configurar programación")).toBeVisible();

    await page.click("text=Semanal");
    await page.click('button:has-text("Guardar")');
    await page.waitForTimeout(300);

    // Click save - should NOT show modal, should auto-apply "Este y los siguientes"
    await page.click('button:has-text("Guardar cambios")');

    // Should return to list without showing the choice modal
    await expect(page.locator("text=Balance")).toBeVisible();
    await page.waitForTimeout(500);

    // Verify the new template with weekly frequency was created
    await expect(page.locator("text=Frequency Change Test")).toBeVisible();

    // Navigate one week forward to see next virtual
    // The new template should generate weekly virtuals
    await page.click('button[aria-label="Mes siguiente"]');
    await page.waitForTimeout(500);

    // Should see multiple weekly occurrences (or at least the next one)
    await expect(page.locator("text=Frequency Change Test")).toBeVisible();
  });

  test("should close virtual modal when clicking backdrop", async ({ page }) => {
    // Create scheduled transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');

    await page.fill('input[placeholder*="qué gastaste"]', "Modal Close Test");
    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.fill("25000");

    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Suscripciones")');

    await page.click("text=Programar automáticamente");
    await page.click('button:has-text("Desactivado")');
    await page.click('button:has-text("Guardar")');
    await page.waitForTimeout(300);

    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();

    // Navigate to next month
    await page.click('button[aria-label="Mes siguiente"]');
    await page.waitForTimeout(500);

    // Click on virtual to open modal
    await page.click("text=Modal Close Test");

    // Modal should be visible
    await expect(page.locator('button:has-text("Registrar ahora")')).toBeVisible();

    // Click backdrop (the semi-transparent overlay)
    await page.click(".bg-black\\/50");

    // Modal should close
    await page.waitForTimeout(300);
    await expect(
      page.locator('button:has-text("Registrar ahora")')
    ).not.toBeVisible();
  });

  test("should close virtual modal when clicking X button", async ({ page }) => {
    // Create scheduled transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');

    await page.fill('input[placeholder*="qué gastaste"]', "X Button Test");
    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.fill("15000");

    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Suscripciones")');

    await page.click("text=Programar automáticamente");
    await page.click('button:has-text("Desactivado")');
    await page.click('button:has-text("Guardar")');
    await page.waitForTimeout(300);

    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();

    // Navigate to next month
    await page.click('button[aria-label="Mes siguiente"]');
    await page.waitForTimeout(500);

    // Click on virtual to open modal
    await page.click("text=X Button Test");

    // Modal should be visible
    await expect(page.locator('button:has-text("Registrar ahora")')).toBeVisible();

    // Click the X button
    await page.click('button:has(svg[class*="lucide-x"])');

    // Modal should close
    await page.waitForTimeout(300);
    await expect(
      page.locator('button:has-text("Registrar ahora")')
    ).not.toBeVisible();
  });
});

test.describe("Scheduled Transactions - Template Direct Edit", () => {
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

    const guestButton = page.locator('button:has-text("Continuar como invitado")');
    if (await guestButton.isVisible().catch(() => false)) {
      await guestButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test("should NOT show modal when editing template directly", async ({
    page,
  }) => {
    // Create scheduled transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');

    await page.fill('input[placeholder*="qué gastaste"]', "Direct Edit Test");
    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.fill("200000");

    await page.click('button:has-text("Seleccionar")');
    await page.click('button:has-text("Suscripciones")');

    await page.click("text=Programar automáticamente");
    await page.click('button:has-text("Desactivado")');
    await page.click('button:has-text("Guardar")');
    await page.waitForTimeout(300);

    await page.click('button:has-text("Guardar")');
    await expect(page.locator("text=Balance")).toBeVisible();

    // Click directly on the template (in current month, not the virtual)
    await page.click("text=Direct Edit Test");

    // Should go directly to edit page (no virtual modal)
    await expect(page.locator("text=Editar")).toBeVisible();

    // Change the amount
    const editAmountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await editAmountInput.click();
    await editAmountInput.clear();
    await editAmountInput.fill("250000");

    // Click save - should NOT show template choice modal
    await page.click('button:has-text("Guardar cambios")');

    // Should return directly to list (no modal shown)
    await expect(page.locator("text=Balance")).toBeVisible();
    await page.waitForTimeout(500);

    // Amount should be updated
    await expect(page.locator("text=250.000")).toBeVisible();
  });
});
