# Plan: Refactorización Completa de Presupuesto (Budget)

## Resumen Ejecutivo

Transformar el sistema de presupuesto de **límites mensuales por categoría** a **presupuestos independientes con períodos flexibles** que permitan crear múltiples presupuestos por categoría en diferentes rangos de tiempo.

**NOTA IMPORTANTE:** Como nadie usa la funcionalidad de Budget actualmente, NO necesitamos backward compatibility. Esta es una implementación desde cero que elimina el código legacy existente.

### Estado Actual vs. Estado Deseado

**Actual:**
- `monthlyLimit` como propiedad de `Category` (NO USADO)
- Feature de Budget prácticamente no implementada
- Nadie usa la funcionalidad actualmente
- Sin concepto de "cuentas" o "wallets"

**Deseado (Nueva implementación desde cero):**
- Entidades `Budget` independientes
- Períodos flexibles: semana, mes, trimestre, año, custom
- Múltiples presupuestos por categoría
- Presupuestos recurrentes (auto-renovación)
- Preparado para cuentas/wallets (feature pendiente)
- Vista detallada por presupuesto con métricas avanzadas

---

## Fase 1: Modelado de Datos

### 1.1 Nuevos tipos TypeScript

Crear nuevos tipos en `src/types/budget.types.ts`:

**`BudgetPeriod`**
- `type: "week" | "month" | "quarter" | "year" | "custom"`
- `startDate: string` (YYYY-MM-DD)
- `endDate: string` (YYYY-MM-DD)

**`Budget`**
- `id: string`
- `categoryId: string` (referencia a Category)
- `amount: number` (monto del presupuesto)
- `period: BudgetPeriod`
- `accountId?: string` (opcional, para futura feature de cuentas)
- `isRecurring: boolean` (si se renueva automáticamente)
- `status: "active" | "completed" | "archived"` (estado del presupuesto)
- `createdAt: number`

### 1.2 Actualizar BudgetState

Agregar al state:
- `budgets: Budget[]` (array de presupuestos)
- Mantener `categoryDefinitions` sin cambios
- **Eliminar** `monthlyLimit` de Category (nadie usa Budget actualmente)

### 1.3 Schema Migration

Incrementar `schemaVersion` de 4 a 5:
- Agregar campo `budgets: []` (array vacío inicial)
- Eliminar `monthlyLimit` de todas las categorías existentes
- No hay datos de presupuesto que migrar (nadie usa la feature)

---

## Fase 2: Servicios y Lógica de Negocio

### 2.1 Budget Service (`src/features/budget/services/budget.service.ts`)

**Funciones principales:**

**`getActiveBudgetsForPeriod(budgets, startDate, endDate)`**
- Filtra presupuestos activos en un rango de fechas
- Retorna array de presupuestos que se solapan con el período

**`calculateBudgetProgress(budget, transactions)`**
- Calcula gastado vs. presupuesto
- Filtra transacciones por categoryId y período
- Retorna: `{ spent, remaining, percentage, status }`

**`calculateDailyRecommendation(budget, spent, remainingDays)`**
- Calcula gasto diario recomendado
- Fórmula: `(budget.amount - spent) / remainingDays`
- Retorna monto sugerido por día

**`calculateProjectedSpending(budget, spent, daysPassed, totalDays)`**
- Proyecta gasto final basado en tendencia actual
- Fórmula: `(spent / daysPassed) * totalDays`
- Retorna proyección de gasto total

**`getRemainingDays(budget)`**
- Calcula días restantes del presupuesto
- Considera fecha actual vs. endDate

**`shouldRenewBudget(budget)`**
- Verifica si un presupuesto recurrente debe renovarse
- Retorna boolean

**`renewRecurringBudget(budget)`**
- Crea nuevo presupuesto con el mismo monto y categoría
- Calcula siguiente período según tipo (week → +7 días, month → +1 mes, etc.)
- Retorna nuevo Budget

### 2.2 Period Calculator (`src/features/budget/utils/period.utils.ts`)

**`getPeriodDates(type, referenceDate?)`**
- Given a period type, calcula startDate y endDate
- "week": lunes a domingo de la semana actual
- "month": primer día al último día del mes
- "quarter": inicio/fin del trimestre
- "year": 1 de enero a 31 de diciembre
- Retorna: `{ startDate, endDate }`

**`getNextPeriod(period)`**
- Calcula el siguiente período para recurrencia
- Retorna nuevo BudgetPeriod

**`isDateInPeriod(date, period)`**
- Verifica si una fecha está dentro del período
- Útil para filtrar transacciones

---

## Fase 3: Zustand Store - Acciones

### 3.1 Budget Actions en `budget.store.ts`

**`createBudget(budget: Omit<Budget, "id" | "createdAt">)`**
- Genera ID único
- Agrega timestamp
- Valida que no exista presupuesto duplicado (misma categoría + período solapado)
- Push al array de budgets
- Llama saveState

**`updateBudget(id: string, updates: Partial<Budget>)`**
- Encuentra presupuesto por ID
- Aplica cambios
- Valida overlaps si cambia período
- saveState

**`deleteBudget(id: string)`**
- Filtra presupuesto del array
- saveState

**`archiveBudget(id: string)`**
- Cambia status a "archived"
- No elimina (mantiene historial)
- saveState

**`renewExpiredBudgets()`**
- Itera sobre budgets activos y recurrentes
- Usa `shouldRenewBudget` para detectar expirados
- Crea nuevos budgets con `renewRecurringBudget`
- Marca budgets anteriores como "completed"
- Llamar en inicio de app (useEffect)

---

## Fase 4: UI - Componentes Nuevos

### 4.1 Budget Overview Page (Rehacer `BudgetPage.tsx`)

**Funcionalidad:**
- Selector de período (tabs: Esta semana, Este mes, Este trimestre, Este año)
- Indicador circular de progreso (total gastado / total presupuestado)
- Stats cards: Total presupuestado, Total gastado, Días restantes del período
- Lista de presupuestos activos (cards clickeables)
- FAB "Crear presupuesto"
- Estado vacío si no hay presupuestos

**Datos a mostrar:**
- Filtra budgets por período seleccionado
- Suma de amounts de budgets activos
- Suma de transacciones que matchean categorías + período
- Porcentaje de progreso global

### 4.2 Budget Card Component (`BudgetCard.tsx`)

**Props:** `budget: Budget`, `spent: number`, `onClick: () => void`

**Muestra:**
- Icono y nombre de categoría
- Monto presupuestado
- Progreso visual (barra o número)
- Monto gastado / restante
- Indicador de estado (en riesgo, ok, excedido)

### 4.3 Add/Edit Budget Modal (`AddEditBudgetModal.tsx`)

**Campos del formulario:**
- Category picker (drawer)
- Amount input (grande, estilo transacción)
- Period selector (botón que abre modal de períodos)
- Account selector (botón, placeholder "Cash" - deshabilitado o hardcoded por ahora)
- Toggle "Repetir presupuesto" (isRecurring)
- Botón guardar

**Period Picker Modal (`PeriodPickerModal.tsx`):**
- Lista de opciones: Esta semana, Este mes, Este trimestre, Este año, Personalizado
- Si elige "Personalizado", muestra dos DatePickers (inicio/fin)
- Al seleccionar, cierra y retorna período

### 4.4 Budget Detail Page (`BudgetDetailPage.tsx`)

**Ruta:** `/budget/:budgetId`

**Layout:**
- Header con back + edit button
- Card de resumen:
  - Icono + nombre de categoría
  - Monto total del presupuesto
  - Gastado / Restante (dos columnas)
  - Rango de fechas + días restantes
  - Account (placeholder "Cash")
- Gráfico/chart de progreso (puede ser simple por ahora, line chart o bar chart)
- Métricas:
  - "Gasto diario recomendado": resultado de `calculateDailyRecommendation`
  - "Proyección de gasto": resultado de `calculateProjectedSpending`
- Lista de transacciones relacionadas (filtradas por categoría + período)
- Botón eliminar/archivar presupuesto (bottom)

---

## Fase 5: Integración y Flujos

### 5.1 Scheduler de Renovación

**En `App.tsx` o `main.tsx` (al iniciar app):**
- useEffect que llama `renewExpiredBudgets()` una vez al día
- Guardar `lastBudgetRenewalCheck` en localStorage
- Comparar con fecha actual, si cambió de día → ejecutar renovación

### 5.2 Relación con Transacciones

**Transacciones NO cambian:**
- Siguen usando `category: string` (ID de categoría)
- Budgets filtran transacciones por categoryId + período
- No se agrega `budgetId` a transacciones (desacoplado)

### 5.3 Cloud Sync

**user_state en Supabase:**
- Ya incluye todo el BudgetState
- Budgets se sincronizarán automáticamente como parte de `replaceAllData` / `getSnapshot`
- No requiere cambios en cloud sync

---

## Fase 6: Limpieza de Código Legacy

### 6.1 Migración de datos

**En `storage.service.ts` (loadState):**
- Detectar `schemaVersion === 4`
- Ejecutar función `migrateV4toV5(state)`
  - Agregar campo `budgets: []` (array vacío)
  - Eliminar `monthlyLimit` de todas las categorías
  - Incrementar schemaVersion a 5
  - saveState

**Nota:** Como nadie usa Budget actualmente, no hay datos que migrar. Solo actualizamos el schema.

### 6.2 Eliminar código legacy

**Eliminar inmediatamente:**
- `setCategoryLimit` action del store (si existe)
- `SetLimitModal` component (componente viejo de límites)
- Cualquier referencia a `monthlyLimit` en el código
- Actualizar tests que usen la funcionalidad antigua

---

## Fase 7: Cuentas/Wallets (Preparación)

**NOTA:** Esta feature NO está implementada aún, pero el presupuesto debe estar preparado.

### 7.1 Modelo de datos (futuro)

**Account type (a crear después):**
- `id: string`
- `name: string` (ej: "Efectivo", "Nequi", "Tarjeta Débito")
- `type: "cash" | "bank" | "credit"`
- `balance: number`
- `color: string`
- `icon: string`

### 7.2 Cambios en Budget

**Campo `accountId` en Budget:**
- Por ahora es `undefined` o se hardcodea a un ID ficticio "cash"
- Cuando se implemente Accounts:
  - Agregar selector de cuenta en AddEditBudgetModal
  - Filtrar transacciones por accountId si está definido
  - Mostrar icono de cuenta en BudgetCard y BudgetDetailPage

**En UI:**
- Por ahora, siempre mostrar "Cash" (hardcoded)
- Botón de selector deshabilitado con tooltip "Próximamente"
- O simplemente ocultar hasta que se implemente

---

## Fase 8: Testing y Validación

### 8.1 Casos de prueba

**Creación de presupuestos:**
- [ ] Crear presupuesto semanal
- [ ] Crear presupuesto mensual
- [ ] Crear presupuesto trimestral
- [ ] Crear presupuesto anual
- [ ] Crear presupuesto custom (fechas específicas)
- [ ] Crear presupuesto recurrente
- [ ] Validar que no se solapen presupuestos de misma categoría

**Cálculos:**
- [ ] Verificar gasto calculado correctamente (transacciones en período)
- [ ] Verificar días restantes
- [ ] Verificar recomendación diaria
- [ ] Verificar proyección de gasto
- [ ] Verificar porcentaje de progreso

**Renovación:**
- [ ] Presupuesto recurrente semanal se renueva correctamente
- [ ] Presupuesto recurrente mensual se renueva al cambiar mes
- [ ] Presupuesto no recurrente NO se renueva

**Migración:**
- [ ] Schema V4→V5 agrega campo budgets correctamente
- [ ] monthlyLimit se elimina de categorías existentes
- [ ] No se rompe nada con el cambio de schema

### 8.2 Edge cases

- Presupuesto custom que termina en medio del mes
- Presupuesto de categoría eliminada (validar integridad)
- Múltiples presupuestos solapados (prevenir)
- Transacciones anteriores al período del presupuesto (no contar)
- Zona horaria (usar siempre YYYY-MM-DD sin hora)

---

## Orden de Implementación Recomendado

1. **Tipos y migración** (Fase 1)
   - Crear nuevos types (Budget, BudgetPeriod)
   - Implementar migración V4→V5
   - Actualizar BudgetState
   - Eliminar monthlyLimit de Category

2. **Servicios y utilidades** (Fase 2)
   - budget.service.ts (cálculos, renovación)
   - period.utils.ts (manejo de períodos)
   - Funciones de cálculo y renovación

3. **Store actions** (Fase 3)
   - createBudget, updateBudget, deleteBudget, archiveBudget
   - renewExpiredBudgets
   - Eliminar setCategoryLimit legacy

4. **UI - Formulario de creación** (Fase 4.3)
   - AddEditBudgetModal
   - PeriodPickerModal
   - Probar creación de presupuestos

5. **UI - Vista general** (Fase 4.1)
   - Rediseñar BudgetPage
   - BudgetCard component
   - Empty state

6. **UI - Vista detalle** (Fase 4.4)
   - BudgetDetailPage
   - Métricas avanzadas
   - Lista de transacciones

7. **Scheduler** (Fase 5.1)
   - Renovación automática
   - Testing de recurrencia

8. **Testing completo** (Fase 8)
   - Casos de prueba
   - Edge cases
   - Validación de migración

9. **Cleanup** (Fase 6)
   - Eliminar código legacy (monthlyLimit, setCategoryLimit, SetLimitModal)
   - Actualizar docs
   - Release

---

## Consideraciones Finales

### Estilos

**IMPORTANTE:** Mantener los estilos actuales de la app (CLAUDE.md), NO replicar los de las imágenes de referencia. Solo tomar la lógica y funcionalidad.

### Traducciones

- Todos los textos en español (es-CO)
- Usar i18n para nuevos textos
- Agregar keys en archivos de traducción

### Rendimiento

- Calcular métricas de presupuesto en useMemo (puede ser costoso con muchas transacciones)
- Indexar budgets por período si el array crece mucho
- Lazy load de BudgetDetailPage

### Accesibilidad

- Budget cards deben ser clickeables con teclado
- Modals con focus trap
- ARIA labels en gráficos

### Futuro

Esta refactorización prepara el camino para:
- Sistema de cuentas/wallets (accountId ya está en el modelo)
- Presupuestos compartidos (multi-usuario)
- Alertas y notificaciones (cuando se excede presupuesto)
- Reports y analytics avanzados
- Exportación de presupuestos

---

## Preguntas Pendientes (a resolver antes de implementar)

1. **Validación de overlaps:** ¿Permitir múltiples presupuestos para misma categoría en períodos que se solapan? ¿O prevenir?
   - Recomendación: Prevenir y mostrar warning

2. **Account por defecto:** ¿Crear un account ficticio "Cash" hardcoded hasta que se implemente la feature completa?
   - Recomendación: Sí, crear un ID constante "default-cash" y usarlo

3. **Presupuestos históricos:** ¿Mantener budgets completados en el state o archivarlos?
   - Recomendación: Mantener con status "completed", permitir filtrar en UI (no hay datos legacy que migrar)

4. **Gráficos:** ¿Qué librería usar para charts? (Chart.js, Recharts, Nivo, etc.)
   - Recomendación: Empezar simple con divs + CSS, después evaluar librería

5. **Período "custom":** ¿Validar que endDate > startDate? ¿Límite máximo de duración?
   - Recomendación: Validar endDate > startDate, máximo 1 año

---

## Resumen de Archivos a Crear/Modificar

### Crear:
- `src/types/budget.types.ts` (agregar Budget, BudgetPeriod)
- `src/features/budget/services/budget.service.ts`
- `src/features/budget/utils/period.utils.ts`
- `src/features/budget/components/BudgetCard.tsx`
- `src/features/budget/components/AddEditBudgetModal.tsx`
- `src/features/budget/components/PeriodPickerModal.tsx`
- `src/features/budget/pages/BudgetDetailPage.tsx`

### Modificar:
- `src/types/budget.types.ts` (BudgetState, eliminar monthlyLimit de Category)
- `src/state/budget.store.ts` (actions, schemaVersion 4→5)
- `src/features/budget/pages/BudgetPage.tsx` (rediseño completo)
- `src/shared/services/storage.service.ts` (migración V4→V5)
- Archivos de traducción (`public/locales/es/budget.json`)

### Eliminar:
- `Category.monthlyLimit` (de types)
- `setCategoryLimit` action (del store, si existe)
- `SetLimitModal` component (componente legacy)

---

**Última actualización:** 2026-01-24
