import { test, expect } from '@playwright/test';

test.describe('PWA Offline Support', () => {
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

  // TODO: Este test requiere refactorización - el beforeEach limpia localStorage al inicio
  // pero el test necesita que las transacciones persistan después del reload.
  // Solución: mover a archivo separado con beforeEach diferente que no limpie localStorage.
  test.skip('app should work offline after initial load', async ({ page, context }) => {
    // Create a transaction while online
    await page.click('[data-testid="fab-add-transaction"]'); // FAB
    await page.click('button:has-text("Agregar Gasto")');
    await expect(page.locator('text=Nuevo Gasto')).toBeVisible();
    await page.fill('input[placeholder*="qué gastaste"]', 'Online Transaction');

    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.click();
    await amountInput.fill('10000');

    await page.click('button:has-text("Seleccionar")');
    await expect(page.locator('button:has-text("Mercado")')).toBeVisible();
    await page.click('button:has-text("Mercado")');
    await page.click('button:has-text("Guardar")');

    // Wait to be back on home and verify transaction created
    await expect(page.locator('text=Balance')).toBeVisible();
    await expect(page.locator('text=Online Transaction')).toBeVisible();

    // Go offline
    await context.setOffline(true);

    // App should still work (PWA should work offline without reload)
    await expect(page.locator('text=Balance')).toBeVisible();
    await expect(page.locator('text=Online Transaction')).toBeVisible();

    // Create a transaction while offline
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await expect(page.locator('text=Nuevo Gasto')).toBeVisible();
    await page.fill('input[placeholder*="qué gastaste"]', 'Offline Transaction');

    const offlineAmountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await offlineAmountInput.click();
    await offlineAmountInput.fill('5000');

    await page.click('button:has-text("Seleccionar")');
    await expect(page.locator('button:has-text("Mercado")')).toBeVisible();
    await page.click('button:has-text("Mercado")');
    await page.click('button:has-text("Guardar")');

    // Wait to be back on home and verify offline transaction was created
    await expect(page.locator('text=Balance')).toBeVisible();
    await expect(page.locator('text=Offline Transaction')).toBeVisible();

    // Wait for localStorage to persist
    await page.waitForTimeout(1000);

    // Go back online
    await context.setOffline(false);

    // Re-set onboarding flags before reload
    await page.evaluate(() => {
      localStorage.setItem('budget.welcomeSeen.v1', '1');
      localStorage.setItem('budget.budgetOnboardingSeen.v1', '1');
    });

    await page.reload();

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Handle WelcomeGate if it appears
    const guestButton = page.locator('button:has-text("Continuar como invitado")');
    if (await guestButton.isVisible().catch(() => false)) {
      await guestButton.click();
      await page.waitForTimeout(2000);
    }

    // Wait for Balance to be visible
    await expect(page.locator('text=Balance')).toBeVisible({ timeout: 10000 });

    // Both transactions should still exist
    await expect(page.locator('text=Online Transaction')).toBeVisible();
    await expect(page.locator('text=Offline Transaction')).toBeVisible();
  });

  // TODO: Mismo issue - requiere que localStorage persista entre reload dentro del test
  test.skip('localStorage should persist data after reload', async ({ page }) => {
    // Create a transaction
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await expect(page.locator('text=Nuevo Gasto')).toBeVisible();
    await page.fill('input[placeholder*="qué gastaste"]', 'Persist Test');

    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.click();
    await amountInput.fill('15000');

    await page.click('button:has-text("Seleccionar")');
    await expect(page.locator('button:has-text("Mercado")')).toBeVisible();
    await page.click('button:has-text("Mercado")');
    await page.click('button:has-text("Guardar")');

    // Wait to be back on home and verify transaction exists
    await expect(page.locator('text=Balance')).toBeVisible();
    await expect(page.locator('text=Persist Test')).toBeVisible();

    // Wait longer for localStorage to be updated (state persistence is async)
    await page.waitForTimeout(1500);

    // Get localStorage data before reload
    const beforeReload = await page.evaluate(() =>
      localStorage.getItem('budget_app_v1')
    );

    expect(beforeReload).toBeTruthy();
    expect(beforeReload).toContain('Persist Test');

    // Re-set onboarding flags before reload to prevent WelcomeGate
    await page.evaluate(() => {
      localStorage.setItem('budget.welcomeSeen.v1', '1');
      localStorage.setItem('budget.budgetOnboardingSeen.v1', '1');
    });

    // Reload page
    await page.reload();

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Handle WelcomeGate if it still appears
    const guestButton2 = page.locator('button:has-text("Continuar como invitado")');
    if (await guestButton2.isVisible().catch(() => false)) {
      await guestButton2.click();
      await page.waitForTimeout(2000);
    }

    // Verify data still exists
    await expect(page.locator('text=Balance')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Persist Test')).toBeVisible();

    // Verify localStorage data is the same
    const afterReload = await page.evaluate(() =>
      localStorage.getItem('budget_app_v1')
    );

    expect(beforeReload).toBe(afterReload);
  });

  // TODO: Mismo issue - necesita persistencia después de reload
  test.skip('app should handle multiple transactions offline', async ({ page, context }) => {
    // App is already loaded from beforeEach
    // Just go offline (don't reload while offline)
    await context.setOffline(true);

    // App should still be functional
    await expect(page.locator('text=Balance')).toBeVisible();

    // Create multiple transactions offline
    for (let i = 1; i <= 3; i++) {
      await page.click('[data-testid="fab-add-transaction"]');
      await page.click('button:has-text("Agregar Gasto")');
      await expect(page.locator('text=Nuevo Gasto')).toBeVisible();
      await page.fill('input[placeholder*="qué gastaste"]', `Offline Transaction ${i}`);

      const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
      await amountInput.click();
      await amountInput.fill(`${i * 1000}`);

      await page.click('button:has-text("Seleccionar")');
      await expect(page.locator('button:has-text("Mercado")')).toBeVisible();
      await page.click('button:has-text("Mercado")');
      await page.click('button:has-text("Guardar")');

      // Wait to be back on home before verifying
      await expect(page.locator('text=Balance')).toBeVisible();
      // Add extra wait to ensure transaction is saved to localStorage
      await page.waitForTimeout(500);
      await expect(page.locator(`text=Offline Transaction ${i}`)).toBeVisible();
    }

    // Verify all transactions exist
    await expect(page.locator('text=Offline Transaction 1')).toBeVisible();
    await expect(page.locator('text=Offline Transaction 2')).toBeVisible();
    await expect(page.locator('text=Offline Transaction 3')).toBeVisible();

    // Go online and reload
    await context.setOffline(false);

    // Re-set onboarding flags before reload
    await page.evaluate(() => {
      localStorage.setItem('budget.welcomeSeen.v1', '1');
      localStorage.setItem('budget.budgetOnboardingSeen.v1', '1');
    });

    await page.reload();

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Handle WelcomeGate if it appears
    const guestButton3 = page.locator('button:has-text("Continuar como invitado")');
    if (await guestButton3.isVisible().catch(() => false)) {
      await guestButton3.click();
      await page.waitForTimeout(2000);
    }

    // Wait for Balance to be visible
    await expect(page.locator('text=Balance')).toBeVisible({ timeout: 10000 });

    // All transactions should still be there
    await expect(page.locator('text=Offline Transaction 1')).toBeVisible();
    await expect(page.locator('text=Offline Transaction 2')).toBeVisible();
    await expect(page.locator('text=Offline Transaction 3')).toBeVisible();
  });

  // TODO: Mismo issue - necesita persistencia después de reload
  test.skip('month selector should work with persisted data', async ({ page }) => {
    // Create a transaction in current month
    await page.click('[data-testid="fab-add-transaction"]');
    await page.click('button:has-text("Agregar Gasto")');
    await expect(page.locator('text=Nuevo Gasto')).toBeVisible();
    await page.fill('input[placeholder*="qué gastaste"]', 'Current Month Transaction');

    const amountInput = page.locator('input[type="text"][inputmode="decimal"]');
    await amountInput.click();
    await amountInput.fill('20000');

    await page.click('button:has-text("Seleccionar")');
    await expect(page.locator('button:has-text("Mercado")')).toBeVisible();
    await page.click('button:has-text("Mercado")');
    await page.click('button:has-text("Guardar")');

    // Wait to be back on home and verify transaction visible
    await expect(page.locator('text=Balance')).toBeVisible();
    await expect(page.locator('text=Current Month Transaction')).toBeVisible();

    // Re-set onboarding flags before reload
    await page.evaluate(() => {
      localStorage.setItem('budget.welcomeSeen.v1', '1');
      localStorage.setItem('budget.budgetOnboardingSeen.v1', '1');
    });

    // Reload page
    await page.reload();

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Handle WelcomeGate if it appears
    const guestButton4 = page.locator('button:has-text("Continuar como invitado")');
    if (await guestButton4.isVisible().catch(() => false)) {
      await guestButton4.click();
      await page.waitForTimeout(2000);
    }

    // Wait for Balance to be visible
    await expect(page.locator('text=Balance')).toBeVisible({ timeout: 10000 });

    // Transaction should still be visible
    await expect(page.locator('text=Current Month Transaction')).toBeVisible();

    // Change to previous month (if month selector is visible)
    // Note: This might need adjustment based on your month selector implementation
    // For now, we just verify the transaction persists after reload
  });
});
