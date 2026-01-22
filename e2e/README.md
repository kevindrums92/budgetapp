# E2E Tests - SmartSpend

Tests end-to-end usando Playwright para validar la funcionalidad de la aplicación antes de cada release.

## Estructura de Tests

### `core-functionality.spec.ts`
Tests de funcionalidad básica:
- ✅ Crear transacción de gasto
- ✅ Crear transacción de ingreso
- ✅ Editar transacción
- ✅ Eliminar transacción
- ✅ Verificar cálculo de balance
- ✅ Navegación entre tabs

### `pwa-offline.spec.ts`
Tests de PWA y funcionamiento offline:
- ✅ App funciona offline después de carga inicial
- ✅ LocalStorage persiste datos después de reload
- ✅ Crear múltiples transacciones offline
- ✅ Selector de mes funciona con datos persistidos

### `release-features.spec.ts`
Tests de características del release actual (v0.7.0):
- ✅ CategoryMonthDetailPage - navegación desde Stats
- ✅ CategoryMonthDetailPage - editar transacción
- ✅ Transaction Delete Navigation - volver a página anterior
- ✅ Budget Page - diseño con fondo gris
- ✅ BudgetOnboardingWizard - mostrar y navegar slides
- ✅ Transaction Form - preservar datos al crear categoría
- ✅ Stats Page Charts - sin animaciones

### `auth-state-consistency.spec.ts`
Tests de consistencia del estado de autenticación:
- ✅ Guest mode: avatar NO visible, status "Local"
- ✅ No avatar ghost después de page reload
- ✅ Consistencia en múltiples navegaciones de página
- ✅ Stress test de navegación rápida
- ⏸️ Simulación offline (skip por limitaciones de Playwright)

### `scheduled-transactions.spec.ts`
Tests del flujo de transacciones programadas:
- ✅ Crear transacción programada y ver virtual en mes siguiente
- ✅ Modal muestra "Confirmar", "Editar" y "Desactivar" al clickear virtual
- ✅ Alerta "Sin cambios" al guardar sin modificaciones
- ✅ Modal de edición de template al cambiar monto
- ✅ "Solo este registro" crea transacción individual
- ✅ "Este y los siguientes" termina template anterior y crea nuevo
- ✅ "Confirmar" materializa virtual sin página de edición
- ✅ "Desactivar" desactiva la programación (irreversible)
- ✅ Auto-aplicar "Este y los siguientes" al cambiar frecuencia
- ✅ Cerrar modal con backdrop y botón X
- ✅ Cancelar confirmación de desactivación
- ✅ Edición directa de template NO muestra modal de elección

### `transaction-attributes.spec.ts`
Tests de atributos y estados de transacciones:
- ✅ Crear transacción con todos los campos opcionales (notas, fecha, categoría)
- ✅ Persistencia de notas después de reload (offline-first)
- ✅ Estado "Pendiente" muestra badge amber en listado
- ✅ Estado "Planeado" muestra badge blue en listado
- ✅ Estado "Pagado" (default) no muestra badge
- ✅ Cambiar estado de Pendiente a Pagado al editar
- ✅ Crear ingreso con notas y verificar balance positivo

### `list-filtering.spec.ts`
Tests de listado, búsqueda y filtros:
- ✅ Agrupar transacciones por día con subtotales correctos
- ✅ Separar transacciones de diferentes días en grupos distintos
- ✅ Filtrar por nombre al buscar
- ✅ Filtrar por categoría al buscar
- ✅ Limpiar búsqueda y mostrar todas las transacciones
- ✅ Filtro "Gastos" muestra solo gastos
- ✅ Filtro "Ingresos" muestra solo ingresos
- ✅ Filtro "Pendientes" muestra solo pendientes/planeados
- ✅ Navegación mensual muestra solo transacciones del mes seleccionado
- ✅ Navegación entre meses con flechas

## Comandos

### Correr todos los tests
```bash
npm run test:e2e
```

### Modo interactivo (UI Mode)
```bash
npm run test:e2e:ui
```
Abre una interfaz gráfica donde puedes ver y ejecutar tests visualmente.

### Modo debug (paso a paso)
```bash
npm run test:e2e:debug
```
Abre el inspector de Playwright para debuggear tests línea por línea.

### Modo headed (ver el navegador)
```bash
npm run test:e2e:headed
```
Ejecuta tests mostrando el navegador (por defecto corre headless).

### Ver reporte de última ejecución
```bash
npm run test:e2e:report
```

### Correr un test específico
```bash
npx playwright test core-functionality
```

### Correr solo un test
```bash
npx playwright test -g "should create an expense transaction"
```

## Pre-Release Checklist

Antes de cada release, ejecutar:

```bash
npm run pre-release
```

Este comando ejecuta:
1. `git pull` - actualiza código
2. `npm run build` - verifica que compila
3. `npm run lint` - verifica linting
4. `npm run test:run` - corre tests unitarios (Vitest)
5. `npm run test:e2e` - **corre tests E2E (Playwright)**

## Configuración

La configuración está en `playwright.config.ts`:
- **Base URL**: `http://localhost:5173`
- **Browser**: Chromium (Desktop Chrome)
- **Timeout**: 30 segundos por test
- **Retries**: 2 en CI, 0 en local
- **Screenshots**: Solo en fallo
- **Videos**: Solo en fallo

## Agregar Nuevos Tests

Al agregar una nueva feature:

1. Agregar test en `release-features.spec.ts` si es para el release actual
2. Mover test a `core-functionality.spec.ts` después del release
3. Usar los mismos selectores que en los tests existentes
4. Siempre hacer `beforeEach` que limpie localStorage

### Ejemplo de nuevo test

```typescript
test('should do something new', async ({ page }) => {
  // Setup
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Action
  await page.click('button:has-text("New Feature")');

  // Assert
  await expect(page.locator('text=Expected Result')).toBeVisible();
});
```

## Troubleshooting

### Tests fallan localmente pero pasan en CI
- Verifica que el servidor dev esté corriendo
- Verifica que no haya datos en localStorage de sesiones previas
- Corre con `--headed` para ver qué está pasando

### Tests son muy lentos
- Usa `test.only()` para correr solo el test que estás escribiendo
- Considera aumentar el timeout si es necesario
- Verifica que no haya memory leaks en la app

### Screenshots/videos no se generan
- Solo se generan en fallos
- Verifica la carpeta `test-results/`
- Usa `--trace on` para generar traces completos

## CI/CD Integration

Para integrar en GitHub Actions, crear `.github/workflows/e2e.yml`:

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Smoke Test Manual

Antes de release, además de correr `npm run test:e2e`, hacer smoke test manual en:
- ✅ Chrome desktop
- ✅ iPhone Safari (real device)
- ✅ Android Chrome (real device o emulador)

Ver checklist completo en `docs/bugs/release-checklist.md`.
