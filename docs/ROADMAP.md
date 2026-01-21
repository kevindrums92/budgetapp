# SmartSpend - Product Roadmap 2025

> **Estrategia**: Híbrido Balanceado - Calidad del código + Features clave
> **Timeline**: 4-5 meses (Feb-Jun 2025)
> **Versión actual**: v0.8.1

---

## Estado Actual (Snapshot v0.8.0)

### Métricas de Calidad
- **Code Quality Score**: 8.5/10
- **Cobertura de Tests**: 40% (E2E completo, unit tests limitados)
- **TypeScript Coverage**: 100% (strict mode)
- **Bundle Size**: Por medir (necesita analyzer)
- **Líneas de código**: ~1,378 (source)

### Features Implementadas ✅
- ✅ Transacciones (CRUD completo, filtros, búsqueda, estados)
- ✅ Transacciones recurrentes mensuales
- ✅ Presupuesto por categoría con alertas visuales
- ✅ Estadísticas (quick stats, 3 charts, drill-down)
- ✅ Viajes (gestión completa con presupuesto)
- ✅ Categorías custom (iconos, colores, límites)
- ✅ Cloud sync (Supabase + offline-first)
- ✅ Backup/restore (manual, auto-local, cloud)
- ✅ PWA instalable
- ✅ Mobile-first design system exhaustivo

### Deuda Técnica Identificada ⚠️
- ❌ 0 tests unitarios para Zustand store
- ❌ Código duplicado (`kebabToPascal` en 3+ archivos)
- ❌ 55 console.logs en producción
- ❌ Sin virtualización en listas (problema con 1000+ txs)
- ❌ StatsPage 527 líneas (debería splittearse)
- ❌ Sin lazy loading de rutas
- ❌ Merge mode en restore incompleto
- ❌ APP_VERSION hardcodeado

---

## v0.9.0 - "Fundaciones Sólidas" 🛠️
**ETA**: 3 semanas | **Objetivo**: Elevar calidad a 9.5/10, fix bugs críticos

### 🧪 Test Coverage al 60%+ (Semana 1-2)

#### Unit Tests - Zustand Store (Crítico)
- [ ] Test suite para `budget.store.ts`
  - [ ] Transaction CRUD (add, update, delete)
  - [ ] Category CRUD (add, update, delete, setLimit)
  - [ ] Trip CRUD
  - [ ] getSnapshot y replaceAllData (crítico para sync)
  - [ ] selectedMonth mutation
  - [ ] cloudMode/cloudStatus updates

#### Unit Tests - Services
- [ ] `cloudState.service.ts` (getCloudState, upsertCloudState)
- [ ] `pendingSync.service.ts` (setPendingSnapshot, clearPendingSnapshot)
- [ ] `backup.service.ts` (createBackup, validateBackup, restoreBackup)
- [ ] `recurringTransactions.service.ts` (findPendingRecurring, replicateTransaction)

#### Component Tests (Críticos)
- [ ] `TransactionList.tsx` (agrupación, ordenamiento, filtros)
- [ ] `CategoryPickerDrawer.tsx` (selección, búsqueda)
- [ ] `DatePicker.tsx` (selección de fecha, navegación)
- [ ] `ConfirmDialog.tsx` (confirmación, cancelación)

**Target**: 60%+ coverage (desde 40% actual)

**Herramientas**:
- Vitest + @testing-library/react (ya configurado)
- MSW para mocking de Supabase (ya instalado)

---

### ⚡ Performance - Quick Wins (Semana 2)

#### Virtual Scrolling
- [ ] Instalar `react-window` o `@tanstack/react-virtual`
- [ ] Virtualizar `TransactionList.tsx` (HomePage)
- [ ] Virtualizar lista de categorías (CategoryPickerDrawer)
- [ ] Test con 1000+ transacciones en dev

**Impacto esperado**: 60fps sostenido con 5000+ transacciones

#### Bundle Optimization
- [ ] Agregar `rollup-plugin-visualizer` a vite.config.ts
- [ ] Analizar bundle size actual
- [ ] Tree-shake lucide-react (import específico vs import *)
- [ ] Code splitting por ruta (React.lazy + Suspense)
  - [ ] Lazy load `StatsPage` (Recharts es pesado)
  - [ ] Lazy load `TripsPage`
  - [ ] Lazy load `BackupPage`

**Target**: Reducir bundle inicial en 30%+

---

### 🧹 Code Quality (Semana 3)

#### Logging Utility
- [ ] Crear `src/shared/utils/logger.ts`
- [ ] Environment-aware logging (silent en production)
- [ ] Niveles: `debug`, `info`, `warn`, `error`
- [ ] Namespace pattern: `logger.info('CloudSync', 'message')`
- [ ] Reemplazar 55 console.logs existentes

#### Extraer Código Duplicado
- [ ] Crear `src/shared/utils/string.utils.ts`
  - [ ] `kebabToPascal` (usado en BudgetPage, StatsPage, etc.)
  - [ ] `formatCOP` (si hay duplicación)
- [ ] Crear `src/shared/constants/ui.constants.ts`
  - [ ] `FAB_BOTTOM_OFFSET = 96`
  - [ ] `DEBOUNCE_SYNC_MS = 1200`
  - [ ] Z-index layers como constants

#### Fix TODOs
- [ ] `backup.service.ts:4` - APP_VERSION desde package.json
  - Usar Vite define: `__APP_VERSION__` desde package.json
- [ ] Implementar merge mode en restore
  - Smart merge: skip duplicates por ID, append nuevos
  - UI: radio buttons "Reemplazar todo" vs "Combinar"

---

### 📊 Métricas de Éxito v0.9.0
- ✅ Code Quality Score: 9.0/10
- ✅ Test Coverage: 60%+
- ✅ 0 critical bugs (auth bug fixed)
- ✅ Bundle size reducido 30%+
- ✅ Performance: 60fps con 5000+ transactions
- ✅ 0 console.logs en production build

---

## v1.0.0 - "Features MVP+" 🚀
**ETA**: 5 semanas | **Objetivo**: Feature parity con apps líderes, lanzamiento público

### 📤 Export a CSV/Excel (Semana 1)

#### Feature Spec
- Export de transacciones a CSV (UTF-8 con BOM para Excel)
- Export de presupuesto a CSV (categorías + límites + gastado)
- Export de trips a CSV
- Date range selector para exports
- Category filter para exports
- Botón de export en cada página (Home, Budget, Trips)

#### Implementation
- [ ] Crear `src/shared/services/export.service.ts`
  - [ ] `exportTransactionsToCSV(txs, filename)`
  - [ ] `exportBudgetToCSV(categories, month, filename)`
  - [ ] `exportTripsToCSV(trips, filename)`
- [ ] UI: Modal con opciones de export
  - Date range picker (start, end)
  - Category filter (multi-select)
  - Include notes checkbox
  - Format: CSV vs TSV
- [ ] Download automático vía `<a download>`
- [ ] Toast de confirmación "Exportado X registros"

#### CSV Format (Transactions)
```csv
Fecha,Tipo,Categoría,Descripción,Monto,Estado,Notas
2025-01-15,Gasto,Restaurantes,Almuerzo,25000,Pagado,Con Juan
```

**Acceptance Criteria**:
- ✅ CSV abre correctamente en Excel sin encoding issues
- ✅ Dates formatted as YYYY-MM-DD
- ✅ Amounts sin símbolo $ (solo números)
- ✅ Test con 1000+ transacciones (performance)

---

### ⏰ Scheduled Transactions (Semana 2-3)

#### Feature Spec
Reemplazo de "recurring transactions" manual por scheduled automáticas.

**vs Recurring actual**:
- ❌ Actual: Usuario replica manualmente cada mes
- ✅ Nuevo: Auto-crea transacciones futuras según schedule

**Schedule Types**:
- Daily (cada X días)
- Weekly (cada X semanas, día específico)
- Monthly (día del mes específico)
- Yearly (fecha específica)
- Custom (cron-like o date list)

#### Implementation
- [ ] Schema update (v5): Agregar `Transaction.schedule`
  ```typescript
  type Schedule = {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number; // every X days/weeks/months
    startDate: string; // YYYY-MM-DD
    endDate?: string; // optional end
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    lastGenerated?: string; // track last auto-created tx
  };
  ```
- [ ] Migration v4→v5: Convert existing `isRecurring` to schedule
  ```typescript
  if (tx.isRecurring) {
    tx.schedule = {
      enabled: true,
      frequency: 'monthly',
      interval: 1,
      startDate: tx.date,
      dayOfMonth: new Date(tx.date).getDate()
    };
  }
  ```
- [ ] Service: `src/shared/services/scheduler.service.ts`
  - [ ] `generateScheduledTransactions(today)` - crea txs para próximos 3 meses
  - [ ] `shouldGenerateNext(schedule, lastGenerated)` - logic
  - [ ] `calculateNextDate(schedule, from)` - date math
- [ ] Background job: Hook en App.tsx
  - [ ] Run on app open (check if new day)
  - [ ] Run on month change
  - [ ] Store `lastSchedulerRun` en localStorage
- [ ] UI: Transaction form
  - [ ] Toggle "Programar esta transacción"
  - [ ] Frequency picker (tabs: Diaria, Semanal, Mensual, Anual)
  - [ ] Interval input (cada X días/semanas/meses)
  - [ ] Start date (default: today)
  - [ ] End date (optional, checkbox "Sin fin")
  - [ ] Preview: "Próximas 3 fechas: 15 Feb, 15 Mar, 15 Abr"
- [ ] UI: Transaction list
  - [ ] Badge "Programada" en txs con schedule
  - [ ] Icon: Clock (lucide-react)
  - [ ] Future transactions rendered con opacity 50%
- [ ] UI: Scheduled transactions manager (nueva página)
  - [ ] Route: `/scheduled`
  - [ ] Lista de todas las schedules activas
  - [ ] Edit/delete schedule
  - [ ] Pause/resume schedule
  - [ ] View next 10 generated dates

#### Edge Cases
- [ ] Feb 31 → Feb 28/29 handling
- [ ] Timezone consistency (use YYYY-MM-DD ISO dates, no time)
- [ ] What if user deletes an auto-generated tx? (mark as skipped)
- [ ] What if user edits an auto-generated tx? (detach from schedule)

**Acceptance Criteria**:
- ✅ Monthly bill (Netflix $15000 el día 5) auto-crea txs por 3 meses
- ✅ Weekly salary (viernes cada semana) auto-crea correctamente
- ✅ User puede pausar/editar/eliminar schedule sin perder historial
- ✅ Migration v4→v5 preserva todas las recurring existentes
- ✅ Future txs no afectan balance actual (solo cuando date <= today)

---

### 🔔 Push Notifications Básicas (Semana 3-4)

#### Feature Spec
- **Budget alerts**: "🚨 Categoría Restaurantes al 90% del presupuesto"
- **Scheduled transaction reminders**: "📅 Mañana: Pago Netflix $15.000"
- **Daily summary**: "📊 Hoy gastaste $45.000 (promedio: $52.000)"
- **Trip budget alerts**: "✈️ Viaje a Cartagena: $200k restantes"

#### Implementation (PWA + Supabase Edge Functions)

**Phase 1: Permission & Registration**
- [ ] Request notification permission (Web Push API)
- [ ] Store permission status en budget store
- [ ] UI: Settings page toggle "Notificaciones"
- [ ] Show permission prompt modal (custom, not browser default)

**Phase 2: Subscription & Backend**
- [ ] Install `web-push` lib
- [ ] Generate VAPID keys (store en .env)
- [ ] Subscribe to push service (FCM o native Web Push)
- [ ] Store subscription en Supabase `push_subscriptions` table
- [ ] Supabase Edge Function: `check-budgets-daily` (scheduled)
  - Runs daily at 8pm
  - Query users with budget > 75%
  - Send push notification via Web Push API

**Phase 3: Notification Types**
- [ ] Budget alert (when category > 75%)
- [ ] Scheduled transaction reminder (1 day before)
- [ ] Daily summary (8pm, configurable)
- [ ] Trip budget warning (when < 20% remaining)

**Phase 4: UI**
- [ ] Settings page: Notification preferences
  - [ ] Toggle per notification type
  - [ ] Time picker para daily summary
  - [ ] Test notification button
- [ ] Notification click handler → navigate to relevant page
  - Budget alert → `/budget`
  - Scheduled tx → `/transactions?id=xyz`
  - Daily summary → `/stats`

#### PWA Considerations
- Service worker debe manejar `push` event
- Notification click → `notificationclick` event → focus app window

**Acceptance Criteria**:
- ✅ User puede habilitar/deshabilitar notificaciones
- ✅ Budget alert se envía cuando categoría alcanza 75%, 90%, 100%
- ✅ Daily summary llega a las 8pm con stats correctas
- ✅ Click en notification abre app en página relevante
- ✅ Funciona offline (queued notifications)

---

### 🛡️ Global Error Boundary (Semana 4)

#### Implementation
- [ ] Crear `src/shared/components/providers/ErrorBoundary.tsx`
  - [ ] Catch React rendering errors
  - [ ] Log error a console (dev) o external service (prod)
  - [ ] Show user-friendly error UI (Spanish)
  - [ ] "Recargar página" button
  - [ ] "Reportar error" button (opens email)
- [ ] Wrap `<App>` en ErrorBoundary
- [ ] Error UI design:
  ```tsx
  <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
    <div className="max-w-sm bg-white rounded-2xl p-6 shadow-xl text-center">
      <div className="h-16 w-16 mx-auto bg-red-100 rounded-full grid place-items-center mb-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">
        Algo salió mal
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        La aplicación encontró un error inesperado. Intenta recargar la página.
      </p>
      <button onClick={() => window.location.reload()}>
        Recargar página
      </button>
    </div>
  </div>
  ```
- [ ] Optional: Sentry integration (si quieres error tracking)

**Acceptance Criteria**:
- ✅ App no muestra "white screen of death" on errors
- ✅ Error UI es mobile-friendly y en español
- ✅ User puede recuperarse con reload

---

### 📊 Métricas de Éxito v1.0.0
- ✅ Feature parity con apps de presupuesto básicas
- ✅ Scheduled transactions reduce fricción (no más replicación manual)
- ✅ Push notifications incrementan engagement
- ✅ Export permite análisis externo (Excel, Sheets)
- ✅ 0 crashes gracias a Error Boundary
- ✅ Listo para lanzamiento público beta

---

## v1.1.0 - "Premium Features" 💎
**ETA**: 4 semanas | **Objetivo**: Features diferenciadores vs competencia

### 💱 Multi-Moneda (Semana 1-2)

#### Feature Spec
- Soporte para múltiples monedas (USD, EUR, COP, MXN, ARS, etc.)
- Exchange rates automáticos (API)
- Budget en moneda primaria con conversión automática
- Transacciones en cualquier moneda
- Stats muestran totales en moneda primaria

#### Implementation
- [ ] Schema update (v6): Agregar campos de moneda
  ```typescript
  type Transaction = {
    // ... existing fields
    currency: string; // ISO 4217 code (USD, EUR, COP)
    exchangeRate?: number; // rate to primary currency at time of tx
    amountInPrimaryCurrency: number; // auto-calculated
  };

  type BudgetState = {
    // ... existing fields
    primaryCurrency: string; // user's main currency
    supportedCurrencies: string[]; // list of enabled currencies
  };
  ```
- [ ] Migration v5→v6: Set all existing txs to COP
- [ ] Service: `src/shared/services/currency.service.ts`
  - [ ] `fetchExchangeRates()` - API call (use exchangerate-api.com free tier)
  - [ ] `convertAmount(amount, from, to, rates)`
  - [ ] `getCurrencySymbol(code)` - $ for USD, € for EUR, etc.
  - [ ] Cache rates in localStorage (refresh daily)
- [ ] UI: Settings page
  - [ ] Primary currency selector (dropdown)
  - [ ] "Monedas habilitadas" checklist
  - [ ] "Actualizar tasas de cambio" button (manual refresh)
  - [ ] Last updated timestamp
- [ ] UI: Transaction form
  - [ ] Currency selector (default: primary currency)
  - [ ] Show conversion rate when non-primary selected
  - [ ] Amount displays in both currencies
    ```
    $ 100 USD ≈ $ 432.500 COP
    ```
- [ ] UI: Stats page
  - [ ] All charts in primary currency
  - [ ] Tooltip shows original currency if different
  - [ ] Currency filter (show only COP transactions)
- [ ] UI: Transaction list
  - [ ] Badge con currency code si no es primaria
  - [ ] Hover/tap muestra conversión

#### Exchange Rate API
- Use: https://www.exchangerate-api.com/ (free tier: 1500 requests/month)
- Fallback: Manual rates if API fails
- Update frequency: Daily (or on-demand)

**Acceptance Criteria**:
- ✅ User puede registrar transacción en USD, EUR, COP sin fricción
- ✅ Budget alerts usan moneda primaria (converted amounts)
- ✅ Stats muestran totales correctos con múltiples monedas
- ✅ Exchange rates se actualizan diariamente
- ✅ Funciona offline (usa last cached rates)

---

### 📋 Budget Templates (Semana 2-3)

#### Feature Spec
Pre-built budget templates para quick setup.

**Templates**:
1. **Estudiante Universitario**
   - Transporte: $200.000
   - Alimentación: $400.000
   - Ocio: $150.000
   - Libros: $100.000

2. **Profesional Soltero**
   - Vivienda: $800.000
   - Transporte: $300.000
   - Alimentación: $600.000
   - Ahorro: $500.000
   - Ocio: $300.000

3. **Familia (2 adultos + 1 niño)**
   - Vivienda: $1.200.000
   - Alimentación: $1.000.000
   - Educación: $400.000
   - Transporte: $400.000
   - Salud: $300.000
   - Ahorro: $500.000

4. **Freelancer**
   - Vivienda: $700.000
   - Software/Tools: $200.000
   - Marketing: $300.000
   - Impuestos: $400.000
   - Ahorro: $600.000

5. **Blank Canvas** (todas las categorías con límite $0)

#### Implementation
- [ ] Create `src/shared/data/budget-templates.ts`
  ```typescript
  type BudgetTemplate = {
    id: string;
    name: string;
    description: string;
    icon: keyof typeof icons;
    categories: {
      categoryId: string;
      limit: number;
    }[];
  };
  ```
- [ ] Templates JSON data (hardcoded, 5 templates iniciales)
- [ ] UI: New onboarding step (after welcome wizard)
  - [ ] "Selecciona un presupuesto base" screen
  - [ ] Grid de templates cards con iconos
  - [ ] Preview modal: muestra todas las categorías + límites
  - [ ] "Aplicar" button → setea límites en store
  - [ ] "Personalizar después" skip button
- [ ] UI: Budget page
  - [ ] "Cargar template" button en PageHeader
  - [ ] Template picker modal (same as onboarding)
  - [ ] Confirmation: "Esto sobrescribirá tus límites actuales"
  - [ ] Option: "Mantener límites personalizados" checkbox
- [ ] Logic: Apply template
  - [ ] Loop through template categories
  - [ ] Match by category name (fuzzy match if needed)
  - [ ] Set limit via `setCategoryLimit`
  - [ ] Toast: "Presupuesto aplicado: Profesional Soltero"

**User-Generated Templates** (Future v1.2):
- [ ] "Guardar mi presupuesto como template" button
- [ ] Share template (export JSON)
- [ ] Template marketplace (?)

**Acceptance Criteria**:
- ✅ New user puede setup presupuesto completo en < 30 segundos
- ✅ Templates tienen valores realistas para Colombia
- ✅ User puede aplicar template sin perder data existente (merge option)

---

### 📸 Receipt Attachments (Semana 3-4)

#### Feature Spec
Upload de recibos (fotos/PDFs) para transacciones.

**Functionality**:
- Take photo or upload from gallery
- PDF upload support
- Image preview in transaction detail
- Download attachment
- Delete attachment
- Max 1 attachment per transaction (v1.1), multiple in v1.2

#### Implementation - Storage Strategy

**Option A: Supabase Storage (Recommended)**
- [ ] Create Supabase Storage bucket: `receipts`
- [ ] RLS policies:
  - Users can upload to `{user_id}/{transaction_id}/`
  - Users can read own files
  - Auto-delete on transaction deletion
- [ ] File naming: `{tx_id}_{timestamp}.{ext}`
- [ ] Max file size: 5MB
- [ ] Allowed types: image/*, application/pdf

**Option B: Base64 in JSON** (Simple, offline-first)
- Store as base64 string in transaction.attachment
- Pros: Works offline, simple, no extra infra
- Cons: Increases JSON size, localStorage quota issues

**Going with Option A** (Supabase Storage)

- [ ] Schema update (v7): Add attachment field
  ```typescript
  type Transaction = {
    // ... existing fields
    attachmentUrl?: string; // Supabase Storage URL
    attachmentType?: 'image' | 'pdf';
    attachmentSize?: number; // bytes
  };
  ```
- [ ] Service: `src/shared/services/attachment.service.ts`
  - [ ] `uploadReceipt(file: File, txId: string): Promise<string>`
  - [ ] `deleteReceipt(url: string): Promise<void>`
  - [ ] `getReceiptUrl(txId: string): string | null`
  - [ ] Image compression before upload (use `browser-image-compression`)
- [ ] UI: Transaction form
  - [ ] "Adjuntar recibo" button (camera icon)
  - [ ] Open native file picker (accept="image/*,application/pdf")
  - [ ] Show thumbnail preview if image uploaded
  - [ ] Show PDF icon + filename if PDF
  - [ ] "Ver" / "Eliminar" buttons on attachment
  - [ ] Upload progress indicator (0-100%)
- [ ] UI: Transaction detail modal (new component)
  - [ ] Fullscreen image viewer (pinch zoom, pan)
  - [ ] PDF viewer (use `react-pdf` or native embed)
  - [ ] Download button
  - [ ] Share button (Web Share API)
- [ ] Offline handling:
  - [ ] Store file in IndexedDB if offline
  - [ ] Upload when back online
  - [ ] pendingUploads service (similar to pendingSync)

**Security**:
- [ ] Validate file type (check magic bytes, not just extension)
- [ ] Scan for malicious files (optional, use ClamAV API)
- [ ] RLS ensures user can't access other users' receipts

**Dependencies**:
- `browser-image-compression` - compress images before upload
- `react-pdf` (optional) - PDF viewer component

**Acceptance Criteria**:
- ✅ User can take photo and attach to transaction in < 10 seconds
- ✅ Image compresses to < 500KB before upload (fast on mobile data)
- ✅ PDF receipts viewable in-app (no download needed)
- ✅ Works offline (queued upload when back online)
- ✅ Attachments deleted from storage when transaction deleted

---

### 📊 Métricas de Éxito v1.1.0
- ✅ Multi-currency opens international user base
- ✅ Templates reduce onboarding friction 70%+
- ✅ Receipt attachments improve expense tracking accuracy
- ✅ Feature set competitivo con Mint, YNAB, Wallet

---

## v1.2.0 - "Pulido & Accesibilidad" ✨
**ETA**: 2-3 semanas | **Objetivo**: Refinar UX, accesibilidad, edge cases

### ♿ Mejoras de Accesibilidad (Semana 1)

#### ARIA & Semantic HTML
- [ ] Audit con Lighthouse Accessibility (target: 95+)
- [ ] Agregar ARIA labels a todos los modals
  ```tsx
  <div role="dialog" aria-labelledby="modal-title" aria-modal="true">
    <h3 id="modal-title">Eliminar transacción</h3>
  </div>
  ```
- [ ] ARIA live regions para toasts/notifications
- [ ] `aria-describedby` en form inputs con errores
- [ ] Focus trap en modals (usar `focus-trap-react`)
- [ ] Skip navigation link (keyboard users)

#### Keyboard Navigation
- [ ] Tab order lógico en todos los forms
- [ ] Escape key cierra modals/drawers
- [ ] Enter key en inputs triggers submit
- [ ] Arrow keys navegación en date picker
- [ ] Shortcuts globales:
  - `Cmd/Ctrl + K` → Open search
  - `N` → New transaction
  - `B` → Go to budget
  - `S` → Go to stats

#### Screen Reader Testing
- [ ] Test con NVDA (Windows) o VoiceOver (Mac/iOS)
- [ ] Descriptive button labels ("Eliminar transacción Almuerzo" vs "Eliminar")
- [ ] Alt text en todas las imágenes (avatars, logos)
- [ ] Table headers for screen readers (stats tables)

#### Color Contrast
- [ ] Verificar WCAG AA compliance (4.5:1 para texto normal)
- [ ] Grays actuales (text-gray-500, etc.) cumplen?
- [ ] Agregar high-contrast mode (optional)

**Acceptance Criteria**:
- ✅ Lighthouse Accessibility score 95+
- ✅ Todo el flujo completable solo con teclado
- ✅ Screen reader lee toda la UI coherentemente
- ✅ Color contrast ratio > 4.5:1 en todo el texto

---

### 🔄 Conflict Resolution UI (Semana 1-2)

#### Feature Spec
Cuando hay conflicto de sync (edits simultáneos en múltiples devices), mostrar UI de resolución.

**Conflict Detection**:
- Compare `updatedAt` timestamps
- Si cloud version > local version → conflict
- Si ambos editaron misma transaction → show diff

#### Implementation
- [ ] Schema update (v8): Add `updatedAt` to transactions
  ```typescript
  type Transaction = {
    // ... existing fields
    updatedAt: string; // ISO timestamp
  };
  ```
- [ ] Conflict detection en `CloudSyncGate.pullAndMerge()`
  ```typescript
  const conflicts = cloudTxs.filter(cloudTx => {
    const localTx = localTxs.find(t => t.id === cloudTx.id);
    return localTx && localTx.updatedAt > cloudTx.updatedAt;
  });
  ```
- [ ] UI: Conflict resolution modal
  - [ ] List of conflicted transactions
  - [ ] Side-by-side diff view:
    ```
    Local              Cloud
    ────────────────   ────────────────
    Almuerzo           Almuerzo trabajo
    $25.000            $28.000
    15 Ene             15 Ene
    ```
  - [ ] Radio buttons: "Mantener local" / "Usar cloud" / "Editar"
  - [ ] "Resolver todos" button (apply choice to all)
- [ ] Store conflict resolution preference (always local, always cloud, ask)

**Acceptance Criteria**:
- ✅ User ve diff claro cuando hay conflicto
- ✅ Puede elegir versión sin perder data
- ✅ Preference persiste (no preguntar cada vez)

---

### 🧩 Split de Componentes Grandes (Semana 2)

#### StatsPage.tsx (527 líneas → 4 componentes)
- [ ] Extract `StatsQuickStats.tsx` (líneas 50-150)
  - Props: `{ transactions, dateRange }`
  - Renders: 4 quick stat cards
- [ ] Extract `StatsCategoryChart.tsx` (líneas 200-300)
  - Props: `{ expenses, categories }`
  - Renders: Donut chart + category list
- [ ] Extract `StatsMonthlyChart.tsx` (líneas 350-420)
  - Props: `{ transactions, last6Months }`
  - Renders: Bar chart income vs expenses
- [ ] Extract `StatsTrendChart.tsx` (líneas 430-500)
  - Props: `{ transactions, last12Months }`
  - Renders: Line chart trend

**After**: StatsPage.tsx ~120 líneas (orchestration only)

#### HomePage.tsx (313 líneas → 3 componentes)
- [ ] Extract `TransactionFilters.tsx` (líneas 50-120)
  - Props: `{ onFilterChange }`
  - Renders: Search + filter pills + type tabs
- [ ] Extract `DailyBudgetBanner.tsx` (líneas 130-180)
  - Props: `{ dailyBudget, spent, onDismiss }`
  - Renders: Banner con dismiss logic
- [ ] Extract `BalanceCard.tsx` (líneas 200-250)
  - Props: `{ balance, income, expenses }`
  - Renders: Hero balance display

**After**: HomePage.tsx ~180 líneas

**Acceptance Criteria**:
- ✅ Cada componente < 200 líneas
- ✅ Props bien tipadas
- ✅ 0 regressions en functionality

---

### ✅ Implementar Merge Mode en Backups (Semana 2)

#### Current State
- `restoreBackup` solo soporta "replace" mode
- Merge mode lanza error (TODO en código)

#### Implementation
- [ ] Merge logic en `backup.service.ts`
  ```typescript
  function mergeBackupData(
    current: BudgetState,
    backup: BudgetState,
    strategy: 'skip-duplicates' | 'keep-both'
  ): BudgetState {
    // Merge transactions by ID
    const mergedTxs = [...current.transactions];
    for (const tx of backup.transactions) {
      const exists = mergedTxs.find(t => t.id === tx.id);
      if (!exists) {
        mergedTxs.push(tx);
      } else if (strategy === 'keep-both') {
        mergedTxs.push({ ...tx, id: nanoid() }); // new ID
      }
      // else skip (duplicate)
    }

    // Same for trips, categories
    return { ...current, transactions: mergedTxs, ... };
  }
  ```
- [ ] UI: Restore modal opciones
  - [ ] Radio: "Reemplazar todo (actual)"
  - [ ] Radio: "Combinar (omitir duplicados)"
  - [ ] Radio: "Combinar (mantener ambos)" - crea nuevos IDs
  - [ ] Warning: "Combinar puede crear transacciones duplicadas"
  - [ ] Checkbox: "Crear backup antes de restaurar"

**Acceptance Criteria**:
- ✅ Merge mode funciona sin errors
- ✅ No duplicates cuando "skip-duplicates"
- ✅ Keeps both cuando "keep-both"
- ✅ Test con 100+ transactions

---

### 📊 Métricas de Éxito v1.2.0
- ✅ Lighthouse Accessibility 95+
- ✅ Code quality 9.5/10 (all large components split)
- ✅ Conflict resolution previene data loss
- ✅ Merge mode permite backup workflows avanzados

---

## Future Considerations (v1.3+)

### Features Potenciales (Not Scoped)
- **Shared budgets** - Colaboración familiar
- **Bank integration** - Plaid/Belvo API (complejo, $$)
- **AI Insights** - GPT-4 analysis de spending patterns
- **Widgets** - iOS/Android home screen widgets
- **Dark mode** - Tema oscuro completo
- **Bill reminders** - Calendar integration
- **Budget rollover** - Carry unused budget to next month
- **Savings goals** - Track progress hacia metas
- **Investment tracking** - Portfolio integration (stocks, crypto)
- **Tax reports** - Generate tax-ready exports
- **Custom categories per month** - Monthly category variations
- **Split transactions** - Single tx across multiple categories
- **Geolocation tagging** - Where did you spend?

### Infrastructure Improvements
- **CI/CD pipeline** - GitHub Actions
- **Automated deployment** - Deploy on merge to main
- **Staging environment** - Test before production
- **Monitoring** - Sentry, LogRocket
- **Analytics** - PostHog, Mixpanel
- **A/B testing** - Feature flags
- **Performance monitoring** - Web Vitals tracking
- **SEO optimization** - Meta tags, sitemap
- **Localization** - i18n support (English, Portuguese)

---

## Release Calendar

| Versión | ETA | Duración | Features Clave |
|---------|-----|----------|----------------|
| v0.9.0 | Feb 15 | 3 semanas | Fix auth bug, test coverage 60%, performance |
| v1.0.0 | Mar 22 | 5 semanas | CSV export, scheduled txs, push notifications |
| v1.1.0 | May 3 | 4 semanas | Multi-currency, templates, receipt attachments |
| v1.2.0 | May 24 | 2-3 semanas | Accessibility, conflict resolution, polish |

**Lanzamiento Beta Pública**: v1.0.0 (Mar 22)
**Lanzamiento v1.0 Estable**: v1.2.0 (Jun 1)

---

## Riesgos & Mitigaciones

### Riesgo 1: Auth Bug No Reproducible
**Probabilidad**: Media | **Impacto**: Alto

**Mitigación**:
- Logging exhaustivo en CloudSyncGate
- E2E test específico (multiple tabs, offline/online)
- Canary release a 10% users primero

### Riesgo 2: Push Notifications Bloqueadas
**Probabilidad**: Alta (users deny permission) | **Impacto**: Medio

**Mitigación**:
- Explicar valor antes de pedir permiso (modal educativo)
- Fallback: In-app notifications + email digests
- Make notifications opt-in, not mandatory

### Riesgo 3: Multi-Currency Exchange Rate API Downtime
**Probabilidad**: Media | **Impacto**: Medio

**Mitigación**:
- Cache rates en localStorage (refresh daily)
- Fallback a manual rates si API falla
- Secondary API (backup provider)

### Riesgo 4: Receipt Storage Costs (Supabase)
**Probabilidad**: Media (si muchos users) | **Impacto**: Bajo

**Mitigación**:
- Limit: 1 attachment per tx (v1.1), max 5MB
- Image compression (< 500KB target)
- Cleanup old attachments (> 1 year)
- Considerar migration a Cloudflare R2 (más barato)

### Riesgo 5: Test Coverage Demora Desarrollo
**Probabilidad**: Alta | **Impacto**: Bajo

**Mitigación**:
- Test solo critical paths (store, sync, backup)
- No buscar 100% coverage, 60% es suficiente
- Parallelize: tests mientras se desarrollan features

---

## Success Metrics (KPIs)

### Métricas Técnicas
- **Test Coverage**: 60%+ en v0.9, 70%+ en v1.0
- **Bundle Size**: < 500KB inicial, < 1.5MB total
- **Lighthouse Score**: 90+ performance, 95+ accessibility
- **Error Rate**: < 0.1% de sesiones con errors
- **Crash-Free Rate**: 99.9%

### Métricas de Producto
- **User Retention**: 40%+ en D7, 20%+ en D30 (v1.0)
- **Onboarding Completion**: 70%+ de users completan setup
- **Feature Adoption**:
  - Scheduled transactions: 30%+ de users activos
  - Push notifications: 40%+ opt-in rate
  - Receipt attachments: 15%+ de transactions con adjuntos
- **Export Usage**: 20%+ de users exportan data mensualmente

### Métricas de Negocio (si monetizas)
- **Conversion Rate** (free → paid): 5%+ target
- **Churn Rate**: < 5% monthly
- **NPS Score**: 50+ (v1.2)

---

## Definition of Done (DoD)

Para considerar una feature "completa":

- [ ] ✅ Feature implementada según spec
- [ ] ✅ Tests unitarios escritos (60%+ coverage)
- [ ] ✅ Test E2E agregado a Playwright suite
- [ ] ✅ Funciona offline (si aplica)
- [ ] ✅ Mobile-responsive (test en 375px, 768px, 1024px)
- [ ] ✅ Accessibility compliant (ARIA, keyboard nav)
- [ ] ✅ Logging apropiado (no console.log en producción)
- [ ] ✅ TypeScript sin `any` types
- [ ] ✅ Spanish locale (es-CO) en UI
- [ ] ✅ Code review aprobado
- [ ] ✅ Documentado en CLAUDE.md (si agrega patrones UI)
- [ ] ✅ CHANGELOG.md actualizado
- [ ] ✅ Merged a `develop` branch

---

## Notas Finales

Este roadmap es **living document** - se actualizará según:
- User feedback (una vez en beta pública)
- Hallazgos durante desarrollo (bugs, technical constraints)
- Market changes (competencia, nuevas APIs)

**Prioridades pueden cambiar**. Lo importante es mantener balance entre:
- ⚖️ **Calidad del código** (tests, performance, accesibilidad)
- 🚀 **Features que agregan valor** (scheduled txs, multi-currency)
- 🎨 **UX pulido** (mobile-first, intuitive, fast)

**Principios para toma de decisiones**:
1. **User value first**: ¿Esto hace la vida del usuario más fácil?
2. **Mobile-first**: ¿Funciona bien en pantalla pequeña?
3. **Offline-first**: ¿Funciona sin internet?
4. **Simple > Complex**: ¿Es la solución más simple que funciona?
5. **Measure twice, cut once**: Test exhaustivo antes de release

¡Vamos a hacer de SmartSpend la mejor app de presupuesto de Colombia! 🚀🇨🇴
