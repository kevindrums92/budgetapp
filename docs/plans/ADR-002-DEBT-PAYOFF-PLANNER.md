# ADR-002: Debt Payoff Planner (Planificador de Pago de Deudas)

**Fecha de Creacion:** 2026-02-10
**Estado:** 📋 En Planificacion
**Ultima Actualizacion:** 2026-02-10
**Autor:** AI Architecture Team

---

## Resumen Ejecutivo

Implementacion de un modulo de **Planificador de Pago de Deudas** para SmartSpend que permita a los usuarios registrar sus deudas (tarjetas de credito, prestamos personales, cuotas), calcular intereses, comparar estrategias de pago (Snowball vs Avalanche), simular pagos extra, y visualizar su progreso hacia la libertad financiera.

**Diferenciador clave**: Mientras apps como Undebt.it y Debt Payoff Planner son herramientas independientes, y apps LATAM como Mobills/Fintonic solo hacen tracking basico de tarjetas, SmartSpend integra el planificador directamente con el presupuesto — cada pago de deuda es tambien una transaccion que se refleja en el flujo de caja del usuario.

---

## Analisis Competitivo

| App | Region | Deudas | Estrategias | Calculo Interes | Integrado con Budget |
|-----|--------|--------|-------------|-----------------|---------------------|
| Undebt.it | Global | Completo | 8 metodos | Avanzado | No (standalone) |
| Debt Payoff Planner | Global | Completo | Snowball/Avalanche | Si | No (standalone) |
| Mobills | Brasil | Solo tarjetas | No | Basico | Parcial |
| Fintonic | Espana/LATAM | Solo tarjetas | No | No | No |
| Organizze | Brasil | Basico | No | No | No |
| Wallet (BudgetBakers) | Global | Tracking | No | No | Parcial |
| YNAB | Global | Manual | Solo snowball | No dedicado | Si (filosofia) |
| **SmartSpend** | **LATAM** | **Completo** | **Snowball/Avalanche/Custom** | **Compuesto + Frances** | **Si (nativo)** |

**Oportunidad**: Ninguna app LATAM combina planificacion de deudas + calculo de intereses + integracion nativa con presupuesto.

**Insights LATAM**:
- Tarjetas de credito en Colombia: 28-32% EA (Efectiva Anual)
- Creditos de consumo: 18-25% EA
- Es un dolor real y masivo — la mayoria de apps solo trackean, no planifican
- Research muestra que gamificacion (celebraciones, progreso visual) incrementa adherencia al plan de pago

**Competidores analizados**:
- **Mobills** (Brasil): Top app LATAM, solo maneja tarjetas con "escapar de intereses", sin estrategias de pago
- **Organizze** (Brasil): Tracking basico de facturas, sin calculo de intereses ni planificacion
- **Fintonic** (Espana/LATAM): Agregador financiero, solo alertas de tarjetas
- **Wallet (BudgetBakers)**: Modulo de deudas dedicado pero sin calculo de intereses ni estrategias
- **Undebt.it**: Mejor calculadora de deudas (8 metodos, amortizacion completa, Undebt.AI) pero NO integra con presupuesto
- **YNAB**: Filosofia de zero-based budgeting con snowball, pero no tiene modulo de deuda dedicado
- **Debt Payoff Planner**: App standalone #1 en deudas, timeline visual, pero sin integracion budget

---

## Decisiones de Arquitectura

### DA-1: Ubicacion en la navegacion → Tabs dentro de PlanPage

**Contexto**: El BottomBar actual tiene 4 tabs (`/`, `/plan`, `/stats`, `/profile`). Agregar un 5to tab rompe el grid.

**Decision**: Agregar tabs de nivel superior dentro de PlanPage: **"Presupuestos" | "Deudas"**.

**Razones**:
- PlanPage ya maneja tabs conceptualmente (budgets activos vs completados)
- "Plan" abarca presupuestos Y deudas semanticamente
- No requiere cambiar BottomBar ni routes principales
- Las deudas tienen paginas de detalle propias (`/debts/:id`) como `/plan/:id`

### DA-2: Pagos de deuda generan transacciones automaticamente

**Decision**: Al registrar un pago de deuda, se crea automaticamente una `Transaction` de tipo `expense` con referencia al `DebtPayment`. Los pagos aparecen en historial, estadisticas y flujo de caja.

```
Usuario registra pago → addDebtPayment() → addTransaction() → saveState()
```

La transaccion generada usa la categoria de la deuda (o una categoria generica "Pago de deuda") y el monto del pago.

### DA-3: Motor de calculo 100% local (no backend)

**Decision**: Todos los calculos de interes y amortizacion se ejecutan en el frontend como funciones puras. No se requiere Edge Function.

**Razones**: Calculos deterministas y livianos, funciona offline (local-first), facilmente testeable con unit tests.

### DA-4: Tasa de interes como EA (Efectiva Anual)

**Contexto**: En Colombia = EA, Mexico = CAT, Brasil = taxa mensal. La EA es la mas universal en LATAM.

**Decision**: El usuario ingresa tasa como **porcentaje anual efectivo**. Conversion interna a tasa mensual:

```typescript
const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
```

V2 puede agregar un toggle "tasa mensual / tasa anual" para flexibilidad regional.

### DA-5: Dos tipos de interes para V1

1. **Interes compuesto sobre saldo** (`compound`) → tarjetas de credito: el interes se calcula sobre el saldo pendiente cada mes
2. **Amortizacion francesa** (`french_amortization`) → prestamos a cuotas fijas: cuota fija mensual con composicion capital/interes variable

No se soporta tasa variable en V1.

### DA-6: Pro feature con count-limit pattern

Siguiendo el patron existente de `FREE_TIER_LIMITS` + `COUNT_LIMITED_FEATURES`:

- **Free**: hasta 2 deudas activas
- **Pro**: deudas ilimitadas + comparador de estrategias + simulador de pagos extra + exportar plan de amortizacion

---

## Modelo de Datos

### Nuevos tipos en `src/types/budget.types.ts`

```typescript
// ==================== DEBTS ====================

export type DebtType = "credit_card" | "personal_loan" | "installment" | "other";

export type InterestType = "compound" | "french_amortization";

export type DebtStatus = "active" | "paid_off" | "archived";

export type PayoffStrategy = "snowball" | "avalanche" | "custom";

export type Debt = {
  id: string;
  name: string;                    // "Tarjeta Bancolombia", "Credito Libre Inversion"
  type: DebtType;                  // Tipo de deuda
  interestType: InterestType;      // Tipo de calculo de interes
  originalBalance: number;         // Saldo original al crear
  currentBalance: number;          // Saldo actual (se actualiza con pagos)
  annualInterestRate: number;      // Tasa EA en porcentaje (ej: 28.5)
  minimumPayment: number;          // Pago minimo mensual
  categoryId?: string;             // Categoria asociada (opcional)
  dueDay?: number;                 // Dia del mes de corte/pago (1-31)
  totalInstallments?: number;      // Solo para installment: cuotas totales
  remainingInstallments?: number;  // Solo para installment: cuotas restantes
  fixedInstallmentAmount?: number; // Solo para french_amortization: cuota fija mensual
  status: DebtStatus;
  customPriority?: number;         // Para estrategia custom (1 = mayor prioridad)
  notes?: string;
  paidOffDate?: string;            // YYYY-MM-DD cuando se pago completamente
  createdAt: number;               // epoch ms
};

export type DebtPayment = {
  id: string;
  debtId: string;                  // Referencia a Debt.id
  amount: number;                  // Monto del pago
  principalPortion: number;        // Porcion que fue a capital
  interestPortion: number;         // Porcion que fue a interes
  balanceAfterPayment: number;     // Saldo despues del pago
  date: string;                    // YYYY-MM-DD
  transactionId?: string;          // Referencia a Transaction.id generada
  isExtra: boolean;                // Si fue un pago extra (mas del minimo)
  notes?: string;
  createdAt: number;               // epoch ms
};

// Fila de tabla de amortizacion (para proyecciones)
export type AmortizationRow = {
  month: number;
  payment: number;                 // Pago total del mes
  principal: number;               // Porcion a capital
  interest: number;                // Porcion a intereses
  balance: number;                 // Saldo restante despues del pago
};
```

### Actualizacion de BudgetState (v8 → v9)

```typescript
export type BudgetState = {
  schemaVersion: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // Agregar 9
  // ... todos los campos existentes sin cambios ...
  debts: Debt[];                   // NUEVO
  debtPayments: DebtPayment[];     // NUEVO
  debtOnboardingSeen?: boolean;    // NUEVO - flag de onboarding
};
```

### Input Types para el Store

```typescript
type AddDebtInput = {
  name: string;
  type: DebtType;
  interestType: InterestType;
  currentBalance: number;          // Saldo actual
  annualInterestRate: number;      // Tasa EA %
  minimumPayment: number;
  categoryId?: string;
  dueDay?: number;
  totalInstallments?: number;
  fixedInstallmentAmount?: number;
  notes?: string;
};

type AddDebtPaymentInput = {
  debtId: string;
  amount: number;
  date: string;                    // YYYY-MM-DD
  isExtra?: boolean;
  notes?: string;
  createTransaction?: boolean;     // Default: true
};
```

---

## Motor de Calculo Financiero

### Interes Compuesto sobre Saldo (Tarjetas de Credito)

Usado para `interestType: "compound"`. Cada mes, el interes se calcula sobre el saldo pendiente.

```typescript
/**
 * Calcula el interes mensual sobre un saldo dado.
 * @param balance - Saldo pendiente
 * @param annualRate - Tasa EA en porcentaje (ej: 28.5)
 * @returns Interes del mes
 */
function calculateMonthlyInterest(balance: number, annualRate: number): number {
  const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
  return Math.round(balance * monthlyRate);
}

/**
 * Proyecta la amortizacion de una deuda con interes compuesto.
 * @param balance - Saldo actual
 * @param annualRate - Tasa EA (porcentaje)
 * @param monthlyPayment - Pago mensual fijo
 * @param maxMonths - Limite de meses para evitar loops infinitos (default: 360)
 * @returns Tabla de amortizacion
 */
function projectCompoundPayoff(
  balance: number,
  annualRate: number,
  monthlyPayment: number,
  maxMonths: number = 360
): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  let remaining = balance;

  for (let month = 1; month <= maxMonths && remaining > 0; month++) {
    const interest = calculateMonthlyInterest(remaining, annualRate);
    const payment = Math.min(monthlyPayment, remaining + interest);
    const principal = payment - interest;
    remaining = Math.max(0, remaining - principal);
    rows.push({ month, payment, principal, interest, balance: remaining });
  }

  return rows;
}
```

### Amortizacion Francesa (Cuotas Fijas)

Usado para `interestType: "french_amortization"`. Cuota fija mensual, la composicion capital/interes cambia cada mes.

```typescript
/**
 * Calcula la cuota fija mensual de un prestamo con amortizacion francesa.
 * Formula: C = P * [r(1+r)^n] / [(1+r)^n - 1]
 * @param principal - Capital prestado
 * @param annualRate - Tasa EA (porcentaje)
 * @param totalMonths - Numero total de cuotas
 * @returns Cuota fija mensual
 */
function calculateFixedPayment(
  principal: number,
  annualRate: number,
  totalMonths: number
): number {
  const r = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
  if (r === 0) return Math.round(principal / totalMonths);
  const factor = Math.pow(1 + r, totalMonths);
  return Math.round(principal * (r * factor) / (factor - 1));
}

/**
 * Proyecta la tabla de amortizacion francesa completa.
 */
function projectFrenchAmortization(
  principal: number,
  annualRate: number,
  totalMonths: number
): AmortizationRow[] {
  const fixedPayment = calculateFixedPayment(principal, annualRate, totalMonths);
  const r = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
  const rows: AmortizationRow[] = [];
  let remaining = principal;

  for (let month = 1; month <= totalMonths && remaining > 0; month++) {
    const interest = Math.round(remaining * r);
    const princ = Math.min(fixedPayment - interest, remaining);
    remaining = Math.max(0, remaining - princ);
    rows.push({ month, payment: princ + interest, principal: princ, interest, balance: remaining });
  }

  return rows;
}
```

---

## Estrategias de Pago (Fase 2)

### Snowball (Bola de Nieve) — Menor saldo primero

```
ENTRADA: debts[] (deudas activas), extraPayment (pago extra disponible/mes)

1. Ordenar debts por currentBalance ASC (menor saldo primero)
2. Para cada mes:
   a. Calcular intereses de cada deuda
   b. Aplicar pago minimo a todas las deudas
   c. Aplicar extraPayment a la deuda con menor saldo
   d. Si una deuda llega a 0:
      - Marcar como paid_off
      - Sumar su pago minimo al extraPayment (efecto bola de nieve)
   e. Registrar estado de cada deuda
3. Repetir hasta que todas las deudas esten en 0
4. Retornar: totalInterestPaid, totalMonths, payoffDatePerDebt
```

**Psicologicamente motivador**: Quick wins al pagar deudas pequenas primero mantienen la motivacion.

### Avalanche (Avalancha) — Mayor tasa primero

```
ENTRADA: debts[] (deudas activas), extraPayment (pago extra disponible/mes)

1. Ordenar debts por annualInterestRate DESC (mayor tasa primero)
2. Para cada mes:
   a. Calcular intereses de cada deuda
   b. Aplicar pago minimo a todas las deudas
   c. Aplicar extraPayment a la deuda con mayor tasa
   d. Si una deuda llega a 0:
      - Marcar como paid_off
      - Sumar su pago minimo al extraPayment
   e. Registrar estado de cada deuda
3. Repetir hasta que todas las deudas esten en 0
4. Retornar: totalInterestPaid, totalMonths, payoffDatePerDebt
```

**Matematicamente optimo**: Minimiza el interes total pagado.

### Comparacion de Estrategias

```typescript
type StrategyResult = {
  strategy: PayoffStrategy;
  totalMonths: number;
  totalInterestPaid: number;
  totalPaid: number;                  // capital + interes
  debtFreeDate: string;               // YYYY-MM-DD
  payoffOrder: {
    debtId: string;
    debtName: string;
    payoffMonth: number;
    payoffDate: string;               // YYYY-MM-DD
  }[];
  monthlyBreakdown: MonthlySnapshot[];
};

type MonthlySnapshot = {
  month: number;
  date: string;                       // YYYY-MM-DD
  totalBalance: number;               // Saldo total de todas las deudas
  totalPayment: number;               // Pago total del mes
  debtsRemaining: number;             // Cuantas deudas quedan activas
};

type StrategySavings = {
  interestSaved: number;              // Diferencia de interes (snowball - avalanche)
  monthsSaved: number;                // Meses de diferencia
  recommendedStrategy: PayoffStrategy;
  reason: string;                     // Explicacion en espanol
};

/**
 * Compara snowball vs avalanche y retorna ambos resultados.
 */
function compareStrategies(
  debts: Debt[],
  extraMonthlyPayment: number
): { snowball: StrategyResult; avalanche: StrategyResult; savings: StrategySavings };
```

---

## Estructura de Archivos

```
src/features/debts/
├── index.ts                              # Exports publicos
├── pages/
│   ├── DebtDetailPage.tsx                # Detalle de una deuda + historial de pagos
│   ├── AddEditDebtPage.tsx               # Formulario crear/editar deuda
│   ├── AddDebtPaymentPage.tsx            # Registrar un pago
│   ├── StrategiesComparisonPage.tsx      # Comparar snowball vs avalanche [Fase 2]
│   └── ExtraPaymentSimulatorPage.tsx     # Simulador "que pasa si pago X extra" [Fase 2]
├── components/
│   ├── DebtCard.tsx                      # Card de deuda para el listado
│   ├── DebtCard.stories.tsx              # Storybook story
│   ├── DebtProgressBar.tsx               # Barra de progreso (pagado vs restante)
│   ├── DebtSummaryHeader.tsx             # Header con totales (deuda total, fecha libre)
│   ├── PaymentHistoryList.tsx            # Lista de pagos realizados
│   ├── AmortizationTable.tsx             # Tabla de amortizacion expandible
│   ├── StrategyComparisonCard.tsx        # Card comparativa [Fase 2]
│   ├── ExtraPaymentSlider.tsx            # Slider simulador [Fase 2]
│   ├── DebtOnboardingWizard.tsx          # Onboarding wizard [Fase 3]
│   └── onboarding/
│       ├── Screen1_Introduction.tsx      # Que es el planificador
│       └── Screen2_Strategies.tsx        # Snowball vs Avalanche
├── services/
│   ├── interest.service.ts               # Motor de calculo de intereses
│   ├── interest.service.test.ts          # Tests del motor de intereses
│   ├── debt.service.ts                   # Progreso, validaciones, helpers
│   ├── debt.service.test.ts              # Tests
│   ├── strategy.service.ts              # Snowball/Avalanche [Fase 2]
│   └── strategy.service.test.ts         # Tests [Fase 2]
├── hooks/
│   ├── useDebtProgress.ts                # Hook para progreso de una deuda
│   └── useDebtSummary.ts                 # Hook para totales agregados
└── utils/
    └── debt.utils.ts                     # Helpers: formateo, validaciones
```

---

## Rutas

Cambios en `src/App.tsx`:

```typescript
// Nuevas rutas para Debt Payoff Planner
<Route path="/debts/new" element={<AddEditDebtPage />} />
<Route path="/debts/:id" element={<DebtDetailPage />} />
<Route path="/debts/:id/edit" element={<AddEditDebtPage />} />
<Route path="/debts/:id/payment" element={<AddDebtPaymentPage />} />

// Fase 2:
<Route path="/debts/strategies" element={<StrategiesComparisonPage />} />
<Route path="/debts/simulator" element={<ExtraPaymentSimulatorPage />} />
```

Agregar a `isFormRoute` check en App.tsx:
```typescript
location.pathname.startsWith("/debts/")
```

---

## Monetizacion

### Cambios en `src/constants/pricing.ts`

```typescript
export type ProFeature =
  | 'unlimited_categories'
  | 'unlimited_budgets'
  | 'unlimited_scheduled'
  | 'unlimited_backups'
  | 'unlimited_debts'           // NUEVO
  | 'stats_page'
  | 'export_data'
  | 'history_filters'
  | 'debt_strategies';          // NUEVO - comparador + simulador

export type PaywallTrigger =
  | /* ... existentes ... */
  | 'debt_limit'               // NUEVO - al intentar crear 3ra deuda
  | 'debt_strategies';         // NUEVO - al acceder a comparador/simulador

export const FREE_TIER_LIMITS = {
  totalCategories: 10,
  activeBudgets: 2,
  scheduledTransactions: 3,
  activeDebts: 2,              // NUEVO
} as const;

// Agregar a COUNT_LIMITED_FEATURES:
unlimited_debts: 'activeDebts',

// Agregar a BOOLEAN_PRO_FEATURES:
'debt_strategies',
```

### Actualizacion de useSubscription.ts

Agregar case `'activeDebts'` en `getCurrentCount`:
```typescript
case 'activeDebts':
  return debts.filter(d => d.status === 'active').length;
```

---

## Migracion de Datos (Schema v8 → v9)

### En `src/services/storage.service.ts`

```typescript
// Migrate v8 to v9: Add debts and debtPayments arrays
if (parsed.schemaVersion === 8) {
  parsed.debts = [];
  parsed.debtPayments = [];
  parsed.schemaVersion = 9;
  needsSave = true;
  console.log('[Storage] Migrated v8->v9: Added debts and debtPayments');
}
```

### Otros cambios de migracion

- `defaultState` en `budget.store.ts`: agregar `debts: [], debtPayments: []`
- Actualizar tipo literal `schemaVersion: 8` → `9` en el store
- `getSnapshot()`: incluir `debts` y `debtPayments`
- `replaceAllData()`: incluir `debts` y `debtPayments`
- Safety check en `loadState()`:
  ```typescript
  if (!Array.isArray(parsed.debts)) parsed.debts = [];
  if (!Array.isArray(parsed.debtPayments)) parsed.debtPayments = [];
  ```

---

## i18n

Crear namespace `debts.json` en cada locale: `src/i18n/locales/{es,en,pt,fr}/debts.json`

### Estructura de keys (`es/debts.json` ejemplo):

```json
{
  "page": {
    "title": "Deudas",
    "noDebts": "No tienes deudas registradas",
    "noDebtsDescription": "Agrega tus tarjetas de credito, prestamos o cuotas para planificar tu pago",
    "addFirstDebt": "Agregar mi primera deuda",
    "totalDebt": "Deuda total",
    "estimatedFreeDate": "Libre de deudas en",
    "activeDebts": "Deudas activas",
    "paidOff": "Pagadas"
  },
  "tabs": {
    "budgets": "Presupuestos",
    "debts": "Deudas"
  },
  "types": {
    "credit_card": "Tarjeta de credito",
    "personal_loan": "Prestamo personal",
    "installment": "Compra a cuotas",
    "other": "Otro"
  },
  "form": {
    "titleNew": "Nueva Deuda",
    "titleEdit": "Editar Deuda",
    "name": "Nombre",
    "namePlaceholder": "Ej: Tarjeta Bancolombia",
    "type": "Tipo de deuda",
    "balance": "Saldo actual",
    "interestRate": "Tasa de interes (EA %)",
    "interestRateHelp": "Tasa efectiva anual. En Colombia, las tarjetas suelen tener entre 28% y 32% EA.",
    "minimumPayment": "Pago minimo mensual",
    "dueDay": "Dia de pago",
    "interestType": "Tipo de calculo",
    "compound": "Interes compuesto (tarjetas)",
    "frenchAmortization": "Cuota fija (prestamos)",
    "save": "Guardar",
    "delete": "Eliminar"
  },
  "payment": {
    "title": "Registrar Pago",
    "amount": "Monto del pago",
    "date": "Fecha",
    "isExtra": "Pago extra (mas del minimo)",
    "principal": "Capital",
    "interest": "Interes",
    "save": "Registrar pago"
  },
  "detail": {
    "balance": "Saldo pendiente",
    "paid": "Pagado",
    "interestPaid": "Interes pagado",
    "paymentsCount": "Pagos realizados",
    "estimatedPayoff": "Fecha estimada de pago",
    "amortizationTable": "Tabla de amortizacion",
    "paymentHistory": "Historial de pagos"
  },
  "strategies": {
    "title": "Estrategias de Pago",
    "snowball": "Bola de Nieve",
    "snowballDescription": "Pagar primero la deuda mas pequena. Genera motivacion rapida.",
    "avalanche": "Avalancha",
    "avalancheDescription": "Pagar primero la deuda con mayor interes. Ahorra mas dinero.",
    "comparison": "Comparacion",
    "interestSaved": "Ahorro en intereses",
    "monthsSaved": "Meses de diferencia",
    "recommended": "Recomendado"
  },
  "simulator": {
    "title": "Simulador de Pagos Extra",
    "extraPayment": "Pago extra mensual",
    "monthsFaster": "{{count}} meses mas rapido",
    "interestSaved": "Ahorras {{amount}} en intereses"
  },
  "celebration": {
    "title": "Deuda pagada!",
    "message": "Felicitaciones, pagaste completamente \"{{name}}\" en {{months}} meses."
  }
}
```

---

## Plan de Implementacion por Fases

### Fase 1: Core (2-3 semanas)

| Step | Descripcion | Archivos clave |
|------|-------------|----------------|
| 1.1 | Tipos `Debt`, `DebtPayment`, `AmortizationRow`, bump schema v9 | `budget.types.ts` |
| 1.2 | Migracion v8→v9 en storage + safety checks | `storage.service.ts` |
| 1.3 | CRUD store: `addDebt`, `updateDebt`, `deleteDebt`, `addDebtPayment`, `deleteDebtPayment` | `budget.store.ts` |
| 1.4 | Motor de interes: `calculateMonthlyInterest`, `projectCompoundPayoff`, `calculateFixedPayment`, `projectFrenchAmortization` | `interest.service.ts` + tests |
| 1.5 | Service: `calculateDebtProgress`, `estimatePayoffDate`, `getDebtSummary` | `debt.service.ts` + tests |
| 1.6 | PlanPage: tabs de nivel superior "Presupuestos" / "Deudas" | `PlanPage.tsx` |
| 1.7 | Componentes: `DebtCard` + `DebtProgressBar` + `DebtSummaryHeader` | `components/` |
| 1.8 | `AddEditDebtPage`: formulario CRUD completo | `pages/AddEditDebtPage.tsx` |
| 1.9 | `AddDebtPaymentPage`: registro de pagos con auto-split capital/interes | `pages/AddDebtPaymentPage.tsx` |
| 1.10 | `DebtDetailPage`: detalle + historial de pagos + tabla amortizacion | `pages/DebtDetailPage.tsx` |
| 1.11 | Pro feature gating (2 deudas free, paywall trigger) | `pricing.ts`, `useSubscription.ts` |
| 1.12 | i18n namespace `debts.json` en 4 idiomas | `i18n/locales/*/debts.json` |
| 1.13 | Rutas en App.tsx + isFormRoute | `App.tsx` |

### Fase 2: Estrategias y Simulacion (1-2 semanas)

| Step | Descripcion | Archivos clave |
|------|-------------|----------------|
| 2.1 | Motor snowball/avalanche: `calculateSnowball`, `calculateAvalanche`, `compareStrategies` | `strategy.service.ts` + tests |
| 2.2 | `StrategiesComparisonPage`: side-by-side con grafica timeline | `pages/` |
| 2.3 | `ExtraPaymentSimulatorPage`: slider de monto extra con cambio en tiempo real | `pages/` |
| 2.4 | Custom priority: reordenar deudas manualmente | `debt.utils.ts` |
| 2.5 | Pro gate para estrategias: `debt_strategies` boolean feature | `pricing.ts` |

### Fase 3: Polish y Gamificacion (1 semana)

| Step | Descripcion | Archivos clave |
|------|-------------|----------------|
| 3.1 | `DebtOnboardingWizard`: 2 pantallas explicando Snowball vs Avalanche | `onboarding/` |
| 3.2 | Celebracion al pagar deuda completamente (animacion + stats) | `DebtDetailPage.tsx` |
| 3.3 | Storybook stories para componentes reutilizables | `*.stories.tsx` |
| 3.4 | Refinamiento i18n y edge cases | `debts.json` (4 idiomas) |

---

## Testing

### Unit Tests (alta prioridad — motor financiero)

**`interest.service.test.ts`**:
1. Tarjeta con 28% EA, saldo $5M, pago minimo $150K → verificar interes mes 1
2. Verificar que con solo pago minimo, la deuda eventualmente se paga (no crece infinito)
3. Prestamo $10M, 18% EA, 36 cuotas → verificar cuota fija
4. Verificar que suma de todos los pagos de capital = principal original
5. Verificar que interes decrece y capital crece mes a mes (french)
6. Edge case: tasa 0% → cuota = principal / meses
7. Edge case: pago < interes mensual → detectar deuda impagable

**`strategy.service.test.ts`** (Fase 2):
1. 3 deudas con diferentes saldos y tasas → snowball paga menor primero
2. 3 deudas → avalanche paga mayor tasa primero
3. Avalanche ahorra mas interes en la mayoria de escenarios
4. Efecto bola de nieve: pago minimo liberado se suma al extra
5. Deuda unica → ambas estrategias dan mismo resultado

**`debt.service.test.ts`**:
1. Registrar pago → split capital/interes correcto
2. Pagar completamente → status cambia a `paid_off` + `paidOffDate` se setea
3. Pago mayor al saldo → limitar a saldo + interes del mes
4. `getDebtSummary` → totales correctos

### Component Tests
- `DebtCard`: renderizado, click handler, estado paid_off
- `DebtProgressBar`: porcentaje correcto, colores segun progreso
- `PaymentHistoryList`: orden cronologico, formateo de montos

### Verificacion end-to-end
1. `npm run build` pasa sin errores TypeScript
2. Crear deuda → aparece en PlanPage tab "Deudas"
3. Registrar pago → saldo actualizado + transaccion en historial
4. Pro gate: 3ra deuda muestra paywall
5. Navegacion: todas las rutas cargan correctamente

---

## Metricas de Exito

| Metrica | Objetivo | Como medir |
|---------|----------|------------|
| Adopcion | 20% de usuarios activos crean al menos 1 deuda | `debts.length > 0` en estado |
| Engagement | 60% de usuarios con deudas registran pagos mensualmente | `debtPayments` por mes |
| Conversion | 5% de free users que llegan al limite hacen upgrade | Paywall trigger `debt_limit` |
| Retencion | Usuarios con deudas tienen 30% mas retencion a 30 dias | Cohorte comparativo |
| Payoff | 10% de deudas pagadas completamente en 6 meses | `status === 'paid_off'` |

---

## Archivos Criticos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/types/budget.types.ts` | Agregar Debt, DebtPayment, AmortizationRow, PayoffStrategy, actualizar BudgetState a v9 |
| `src/state/budget.store.ts` | CRUD debts/payments, getSnapshot, replaceAllData, defaultState, schemaVersion |
| `src/services/storage.service.ts` | Migracion v8→v9 + safety checks |
| `src/features/budget/pages/PlanPage.tsx` | Tabs "Presupuestos" / "Deudas" |
| `src/App.tsx` | Nuevas rutas /debts/*, isFormRoute |
| `src/constants/pricing.ts` | ProFeature, FREE_TIER_LIMITS, PaywallTrigger |
| `src/hooks/useSubscription.ts` | getCurrentCount para activeDebts |
| `src/features/debts/` | **NUEVO** — todo el feature module |
| `src/i18n/locales/*/debts.json` | **NUEVO** — traducciones en 4 idiomas |

---

## Changelog del Documento

| Fecha | Cambio |
|-------|--------|
| 2026-02-10 | Creacion inicial del ADR con analisis competitivo, modelo de datos, motor de calculo, estrategias de pago, plan de implementacion por fases |
