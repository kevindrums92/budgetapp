# 📋 Plan de Implementación: Refactor Budget → Plan (Límites y Metas)

## 🎯 Objetivo

Transformar el módulo de Budget para soportar dos tipos de comportamiento:
1. **Límites de Gasto** (restrictivos) - comportamiento actual
2. **Metas de Ahorro** (acumulativos) - nuevo modelo "Piggy Bank"

---

## 📊 Análisis del Estado Actual

### Archivos a Revisar

Antes de empezar, necesitamos mapear todos los archivos que referencian "budget":

```bash
# Buscar todos los archivos que usan "budget"
- src/state/budget.store.ts
- src/types/budget.types.ts (si existe)
- src/pages/BudgetPage.tsx (o similar)
- src/components/BottomBar.tsx
- src/services/*.ts (cualquier servicio relacionado)
- public/locales/{es,en,fr,pt}/translation.json
- Rutas en App.tsx o router
```

### Estado Actual del Modelo

```typescript
// Estructura actual (aproximada)
interface Budget {
  id: string;
  categoryId: string;
  amount: number; // Límite o meta
  period: 'monthly' | 'weekly'; // Opcional
  createdAt: string;
  updatedAt: string;
}
```

---

## 🔧 Fase 1: Modelo de Datos

### 1.1 Actualizar Type Definitions

**Archivo**: `src/types/budget.types.ts` (o donde esté definido)

```typescript
export type BudgetType = 'limit' | 'goal';

export interface Budget {
  id: string;
  categoryId: string;
  amount: number; // Límite máximo (limit) o Meta a alcanzar (goal)
  type: BudgetType; // NUEVO
  period: 'monthly' | 'weekly';
  createdAt: string;
  updatedAt: string;
}

// Tipo auxiliar para cálculos de progreso
export interface BudgetProgress {
  budget: Budget;
  spent: number; // Para limits: cuánto se ha gastado
  saved: number; // Para goals: cuánto se ha ahorrado
  percentage: number; // 0-100 (puede superar 100 en limits)
  remaining: number; // Para limits: cuánto queda | Para goals: cuánto falta
  isExceeded: boolean; // Solo para limits
  isCompleted: boolean; // Solo para goals
}
```

### 1.2 Actualizar Zustand Store

**Archivo**: `src/state/budget.store.ts`

```typescript
// En las acciones del store, añadir:

addBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
  const newBudget: Budget = {
    ...budget,
    id: generateId(),
    type: budget.type || 'limit', // Default a limit
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  set((state) => ({
    budgets: [...state.budgets, newBudget],
  }));

  // Trigger save to localStorage
  get().saveState();
},

// Método helper para calcular progreso
getBudgetProgress: (budgetId: string): BudgetProgress | null => {
  const state = get();
  const budget = state.budgets.find((b) => b.id === budgetId);
  if (!budget) return null;

  const category = state.categories.find((c) => c.id === budget.categoryId);
  if (!category) return null;

  // Filtrar transacciones de esta categoría en el periodo actual
  const transactions = state.transactions.filter((t) => {
    return t.categoryId === budget.categoryId && isInCurrentPeriod(t.date, budget.period);
  });

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  if (budget.type === 'limit') {
    // Lógica para límites (gasto)
    const percentage = (totalAmount / budget.amount) * 100;
    const remaining = budget.amount - totalAmount;

    return {
      budget,
      spent: totalAmount,
      saved: 0,
      percentage: Math.min(percentage, 100),
      remaining,
      isExceeded: totalAmount > budget.amount,
      isCompleted: false,
    };
  } else {
    // Lógica para metas (ahorro)
    const percentage = (totalAmount / budget.amount) * 100;
    const remaining = budget.amount - totalAmount;

    return {
      budget,
      spent: 0,
      saved: totalAmount,
      percentage: Math.min(percentage, 100),
      remaining: Math.max(remaining, 0),
      isExceeded: false,
      isCompleted: totalAmount >= budget.amount,
    };
  }
},

// Método helper para health check
getBudgetHealthCheck: () => {
  const state = get();
  const allProgress = state.budgets.map((b) => get().getBudgetProgress(b.id)).filter(Boolean);

  const limits = allProgress.filter((p) => p.budget.type === 'limit');
  const goals = allProgress.filter((p) => p.budget.type === 'goal');

  const exceededLimits = limits.filter((p) => p.isExceeded).length;

  // Promedio ponderado de metas completadas
  const goalTotalAmount = goals.reduce((sum, g) => sum + g.budget.amount, 0);
  const goalSavedAmount = goals.reduce((sum, g) => sum + g.saved, 0);
  const goalPercentage = goalTotalAmount > 0 ? (goalSavedAmount / goalTotalAmount) * 100 : 0;

  return {
    exceededLimits,
    totalLimits: limits.length,
    goalPercentage: Math.round(goalPercentage),
    totalGoals: goals.length,
  };
},
```

### 1.3 Migración de Datos

**Archivo**: `src/services/migration.service.ts` (NUEVO)

```typescript
/**
 * Migración automática: añadir type: 'limit' a todos los budgets existentes
 * Se ejecuta en la hidratación del store
 */
export function migrateBudgetsToV2(budgets: any[]): Budget[] {
  return budgets.map((budget) => {
    // Si ya tiene type, no hacer nada
    if (budget.type) return budget;

    // Caso contrario, marcar como limit (comportamiento anterior)
    return {
      ...budget,
      type: 'limit' as BudgetType,
    };
  });
}

// En budget.store.ts, al cargar desde localStorage:
loadState: () => {
  const saved = localStorage.getItem('budget-state');
  if (!saved) return;

  const parsed = JSON.parse(saved);

  // Migrar budgets si es necesario
  if (parsed.budgets) {
    parsed.budgets = migrateBudgetsToV2(parsed.budgets);
  }

  set(parsed);
},
```

---

## 🎨 Fase 2: UI/UX

### 2.1 Renombrar Módulo: Budget → Plan

**Archivos afectados**:
- `src/pages/BudgetPage.tsx` → `src/pages/PlanPage.tsx`
- `src/components/BottomBar.tsx` (cambiar label y ruta)
- Router/Routes

**BottomBar Update**:

```tsx
const navItems = [
  { path: "/", icon: Home, label: t("bottomBar.home") },
  { path: "/plan", icon: Target, label: t("bottomBar.plan") }, // Cambio aquí
  { path: "/stats", icon: TrendingUp, label: t("bottomBar.stats") },
  { path: "/settings", icon: Settings, label: t("bottomBar.settings") },
];
```

### 2.2 Página Principal: PlanPage

**Archivo**: `src/pages/PlanPage.tsx`

```tsx
export default function PlanPage() {
  const budgets = useBudgetStore((s) => s.budgets);
  const getBudgetProgress = useBudgetStore((s) => s.getBudgetProgress);
  const getHealthCheck = useBudgetStore((s) => s.getBudgetHealthCheck);

  const healthCheck = getHealthCheck();
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header con Health Check */}
      <div className="bg-white px-4 pt-6 pb-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Mi Plan</h1>

        {/* Health Check */}
        {healthCheck.totalLimits > 0 && healthCheck.exceededLimits > 0 && (
          <div className="mb-3 rounded-xl bg-red-50 p-3 border border-red-200">
            <p className="text-sm font-medium text-red-700">
              ⚠️ Tienes {healthCheck.exceededLimits} límite{healthCheck.exceededLimits > 1 ? 's' : ''} excedido{healthCheck.exceededLimits > 1 ? 's' : ''}
            </p>
          </div>
        )}

        {healthCheck.totalGoals > 0 && (
          <div className="rounded-xl bg-teal-50 p-3 border border-teal-200">
            <p className="text-sm font-medium text-teal-700">
              🎯 Has completado el {healthCheck.goalPercentage}% de tus metas de ahorro
            </p>
          </div>
        )}
      </div>

      {/* Lista de Budgets */}
      <main className="pb-28 pt-4 px-4">
        <div className="space-y-3">
          {budgets.length === 0 ? (
            <EmptyStatePlan />
          ) : (
            budgets.map((budget) => {
              const progress = getBudgetProgress(budget.id);
              if (!progress) return null;

              return (
                <BudgetCard key={budget.id} progress={progress} />
              );
            })
          )}
        </div>
      </main>

      {/* FAB Button */}
      <button
        type="button"
        onClick={() => navigate('/plan/add')}
        className="fixed right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] active:scale-95 transition-transform"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 96px)" }}
      >
        <Plus size={26} strokeWidth={2.2} />
      </button>
    </div>
  );
}
```

### 2.3 Componente: BudgetCard

**Archivo**: `src/components/BudgetCard.tsx` (NUEVO)

```tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BudgetProgress } from "@/types/budget.types";
import { formatCOP } from "@/services/format.service";
import ProgressBar from "@/components/ProgressBar";
import * as icons from "lucide-react";

interface Props {
  progress: BudgetProgress;
}

export default function BudgetCard({ progress }: Props) {
  const navigate = useNavigate();
  const { budget, spent, saved, percentage, remaining, isExceeded, isCompleted } = progress;

  // Obtener categoría (desde store)
  const category = useBudgetStore((s) =>
    s.categories.find((c) => c.id === budget.categoryId)
  );

  if (!category) return null;

  // Determinar color según tipo
  const barColor = budget.type === 'limit'
    ? (isExceeded ? '#ef4444' : '#18B7B0') // Rojo si excedido, teal si normal
    : '#18B7B0'; // Siempre teal para metas

  // Renderizar texto según tipo
  const renderText = () => {
    if (budget.type === 'limit') {
      return (
        <>
          <p className="text-sm text-gray-600">
            Gastaste <span className="font-semibold text-gray-900">{formatCOP(spent)}</span> de {formatCOP(budget.amount)}
          </p>
          <p className={`text-xs ${isExceeded ? 'text-red-600' : 'text-gray-500'}`}>
            {isExceeded
              ? `Excedido por ${formatCOP(Math.abs(remaining))}`
              : `Te quedan ${formatCOP(remaining)}`
            }
          </p>
        </>
      );
    } else {
      return (
        <>
          <p className="text-sm text-gray-600">
            Llevas <span className="font-semibold text-teal-700">{formatCOP(saved)}</span> de {formatCOP(budget.amount)}
          </p>
          <p className="text-xs text-teal-600">
            {isCompleted
              ? '¡Meta alcanzada! 🎉'
              : `¡Faltan ${formatCOP(remaining)}!`
            }
          </p>
        </>
      );
    }
  };

  // Ícono de categoría
  const IconComponent = icons[kebabToPascal(category.icon) as keyof typeof icons];

  return (
    <button
      type="button"
      onClick={() => navigate(`/plan/${budget.id}`)}
      className="w-full rounded-xl bg-white p-4 shadow-sm hover:bg-gray-50 transition-colors text-left"
    >
      {/* Header: Ícono + Nombre */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: category.color + "20" }}
        >
          {IconComponent && (
            <IconComponent className="h-5 w-5" style={{ color: category.color }} />
          )}
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{category.name}</h3>
          <p className="text-xs text-gray-500">
            {budget.type === 'limit' ? 'Límite de gasto' : 'Meta de ahorro'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar percentage={percentage} color={barColor} />

      {/* Stats */}
      <div className="mt-3">
        {renderText()}
      </div>
    </button>
  );
}
```

### 2.4 Componente: ProgressBar (Actualizado)

**Archivo**: `src/components/ProgressBar.tsx`

```tsx
interface Props {
  percentage: number; // 0-100
  color?: string; // Color personalizado (hex)
}

export default function ProgressBar({ percentage, color = '#18B7B0' }: Props) {
  const cappedPercentage = Math.min(percentage, 100);

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${cappedPercentage}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}
```

### 2.5 Formulario de Creación: AddEditPlanPage

**Archivo**: `src/pages/AddEditPlanPage.tsx` (NUEVO)

**Step 0**: Selector de tipo

```tsx
export default function AddEditPlanPage() {
  const [step, setStep] = useState(0); // 0: selector, 1: formulario
  const [type, setType] = useState<BudgetType | null>(null);

  // Step 0: Elegir tipo
  if (step === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <PageHeader title="Crear Plan" />

        <div className="flex-1 px-4 pt-6 pb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            ¿Qué quieres hacer?
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Elige el tipo de plan que deseas crear
          </p>

          <div className="space-y-3">
            {/* Opción: Límite */}
            <button
              type="button"
              onClick={() => {
                setType('limit');
                setStep(1);
              }}
              className="w-full rounded-xl bg-white p-6 shadow-sm hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50">
                  <ShieldAlert className="h-6 w-6 text-red-600" />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Controlar un gasto
                  </h3>
                  <p className="text-sm text-gray-600">
                    Define un límite máximo para una categoría. Te avisaremos si te pasas.
                  </p>
                </div>
              </div>
            </button>

            {/* Opción: Meta */}
            <button
              type="button"
              onClick={() => {
                setType('goal');
                setStep(1);
              }}
              className="w-full rounded-xl bg-white p-6 shadow-sm hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50">
                  <Target className="h-6 w-6 text-teal-600" />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Ahorrar para una meta
                  </h3>
                  <p className="text-sm text-gray-600">
                    Crea una meta de ahorro. Irás registrando aportes hasta completarla.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Formulario (continúa con el form actual adaptado)
  return <BudgetFormStep type={type!} />;
}
```

### 2.6 Empty State

**Archivo**: `src/components/EmptyStatePlan.tsx`

```tsx
export default function EmptyStatePlan() {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl bg-white p-8 text-center shadow-sm">
      <Target className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        No tienes ningún plan
      </h3>
      <p className="mt-2 text-sm text-gray-600">
        Crea límites de gasto o metas de ahorro para organizar tu dinero
      </p>
      <button
        type="button"
        onClick={() => navigate('/plan/add')}
        className="mt-4 rounded-xl bg-teal-500 px-6 py-3 text-sm font-medium text-white hover:bg-teal-600"
      >
        Crear mi primer plan
      </button>
    </div>
  );
}
```

---

## 🌍 Fase 3: Internacionalización (i18n)

### 3.1 Actualizar Traducciones

**Archivos**: `public/locales/{es,en,fr,pt}/translation.json`

#### Español (es)

```json
{
  "bottomBar": {
    "home": "Inicio",
    "plan": "Plan",
    "stats": "Stats",
    "settings": "Ajustes"
  },
  "plan": {
    "title": "Mi Plan",
    "empty": {
      "title": "No tienes ningún plan",
      "description": "Crea límites de gasto o metas de ahorro para organizar tu dinero",
      "cta": "Crear mi primer plan"
    },
    "healthCheck": {
      "exceededLimits": "Tienes {{count}} límite excedido",
      "exceededLimits_plural": "Tienes {{count}} límites excedidos",
      "goalsProgress": "Has completado el {{percentage}}% de tus metas de ahorro"
    },
    "type": {
      "limit": "Límite de gasto",
      "goal": "Meta de ahorro"
    },
    "create": {
      "title": "Crear Plan",
      "question": "¿Qué quieres hacer?",
      "description": "Elige el tipo de plan que deseas crear",
      "limitOption": "Controlar un gasto",
      "limitDescription": "Define un límite máximo para una categoría. Te avisaremos si te pasas.",
      "goalOption": "Ahorrar para una meta",
      "goalDescription": "Crea una meta de ahorro. Irás registrando aportes hasta completarla."
    },
    "card": {
      "spent": "Gastaste",
      "of": "de",
      "remaining": "Te quedan {{amount}}",
      "exceeded": "Excedido por {{amount}}",
      "saved": "Llevas",
      "missing": "¡Faltan {{amount}}!",
      "completed": "¡Meta alcanzada! 🎉"
    }
  }
}
```

#### Inglés (en)

```json
{
  "bottomBar": {
    "home": "Home",
    "plan": "Plan",
    "stats": "Stats",
    "settings": "Settings"
  },
  "plan": {
    "title": "My Plan",
    "empty": {
      "title": "You have no plans",
      "description": "Create spending limits or savings goals to organize your money",
      "cta": "Create my first plan"
    },
    "healthCheck": {
      "exceededLimits": "You have {{count}} exceeded limit",
      "exceededLimits_plural": "You have {{count}} exceeded limits",
      "goalsProgress": "You've completed {{percentage}}% of your savings goals"
    },
    "type": {
      "limit": "Spending limit",
      "goal": "Savings goal"
    },
    "create": {
      "title": "Create Plan",
      "question": "What do you want to do?",
      "description": "Choose the type of plan you want to create",
      "limitOption": "Control spending",
      "limitDescription": "Set a maximum limit for a category. We'll warn you if you exceed it.",
      "goalOption": "Save for a goal",
      "goalDescription": "Create a savings goal. Track your contributions until you complete it."
    },
    "card": {
      "spent": "Spent",
      "of": "of",
      "remaining": "{{amount}} remaining",
      "exceeded": "Exceeded by {{amount}}",
      "saved": "Saved",
      "missing": "{{amount}} left!",
      "completed": "Goal reached! 🎉"
    }
  }
}
```

*(Repetir para francés y portugués)*

---

## ✅ Fase 4: Testing

### 4.1 Unit Tests

**Archivo**: `src/state/budget.store.test.ts`

```typescript
describe('Budget Store - Type Logic', () => {
  it('should calculate progress correctly for limit type', () => {
    // Test que spent + remaining = amount
    // Test que isExceeded = true cuando spent > amount
  });

  it('should calculate progress correctly for goal type', () => {
    // Test que saved + remaining = amount
    // Test que isCompleted = true cuando saved >= amount
  });

  it('should return correct health check', () => {
    // Test con 2 limits (1 excedido) y 2 goals (1 completa)
    // Verificar que exceededLimits = 1
    // Verificar que goalPercentage sea el promedio ponderado
  });

  it('should migrate old budgets to type: limit', () => {
    const oldBudgets = [{ id: '1', categoryId: 'cat1', amount: 100 }];
    const migrated = migrateBudgetsToV2(oldBudgets);
    expect(migrated[0].type).toBe('limit');
  });
});
```

### 4.2 Manual Testing Checklist

- [ ] Crear un límite, añadir transacciones hasta excederlo, verificar color rojo
- [ ] Crear una meta, añadir transacciones hasta completarla, verificar color teal y mensaje de éxito
- [ ] Verificar que el balance en HomePage se reduce al añadir transacciones de meta
- [ ] Verificar health check con múltiples límites y metas
- [ ] Probar migración: cargar datos antiguos sin `type`, verificar que se marcan como `limit`
- [ ] Verificar i18n en todos los idiomas (es, en, fr, pt)
- [ ] Probar en móvil: safe areas, scroll, bottom bar
- [ ] Verificar accesibilidad: botones con `type="button"`, focus states

---

## 🚀 Fase 5: Deployment

### 5.1 Orden de Implementación

1. **Tipos y Store** (Fase 1) - Core lógica
2. **Componentes UI** (Fase 2) - Renderizado
3. **i18n** (Fase 3) - Traducciones
4. **Testing** (Fase 4) - Validación
5. **Deploy** - Push a producción

### 5.2 Rollout Plan

- **Versión**: 2.0.0 (breaking change en estructura de datos)
- **Changelog**: Documentar migración automática
- **User Communication**: Añadir nota en app explicando nueva funcionalidad

---

## 💡 Opiniones y Mejoras Propuestas

### ✅ Cosas que me gustan del plan original

1. **No migración de schema**: Correcto, si todos tienen budget vacío es más limpio
2. **Modelo Piggy Bank**: Intuitivo y fácil de explicar a usuarios
3. **Health Check**: Excelente UX para resumir estado global
4. **Renombrar a "Plan"**: Mucho más amigable que "Budget"

### 🎯 Sugerencias de Mejora

> **Nota**: No necesitamos añadir un campo `deadline` porque ya existe el campo `period` (week, month, quarter, year, custom) que funciona perfecto para establecer el plazo de las metas. El selector de período existente ya cubre esta necesidad.

#### 1. **Notificaciones push (futuras)**

Para el health check:
- Notificar cuando un límite está al 80% (antes de excederlo)
- Notificar cuando una meta se completa

#### 2. **Separar visualmente límites y metas en la lista**

En lugar de mezclar, usar tabs:

```tsx
<div className="flex gap-2 bg-white px-4 pt-3 pb-4">
  <button onClick={() => setActiveTab('all')} /* ... */>
    Todos
  </button>
  <button onClick={() => setActiveTab('limits')} /* ... */>
    Límites
  </button>
  <button onClick={() => setActiveTab('goals')} /* ... */>
    Metas
  </button>
</div>
```

#### 3. **Añadir campo "notes" opcional**

Para que el usuario pueda escribir "Para las vacaciones en Cartagena" o "Gasto máximo en restaurantes"

```typescript
interface Budget {
  // ... campos existentes
  notes?: string;
}
```

#### 4. **Mejorar empty state con ilustración**

En lugar de solo ícono, usar una ilustración SVG más atractiva (puedes usar undraw.co o similar)

#### 5. **Añadir estado "archived"**

Para metas completadas o límites antiguos que no se quieren eliminar:

```typescript
interface Budget {
  // ... campos existentes
  archived: boolean; // Default false
  archivedAt?: string;
}
```

**UX**: Botón "Ver archivados" en PlanPage

#### 6. **Celebración al completar meta**

Cuando `isCompleted = true`, mostrar un confetti animation (usar `canvas-confetti` library)

```tsx
import confetti from 'canvas-confetti';

useEffect(() => {
  if (progress.isCompleted && progress.budget.type === 'goal') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}, [progress]);
```

#### 7. **Gráfico de progreso histórico**

En la página de detalle (`/plan/:id`), mostrar un line chart con la evolución del progreso a lo largo del tiempo

#### 8. **Sugerencias inteligentes**

Basado en historial de transacciones:
- "Sugerencia: Tu gasto promedio en Restaurantes es $400.000/mes. ¿Quieres crear un límite?"
- "Sugerencia: Has ahorrado consistentemente $200.000/mes. ¿Quieres crear una meta?"

#### 9. **Colores más diferenciados**

Para evitar confusión visual:
- Límites normales: `#6B7280` (gray-500) - neutral
- Límites excedidos: `#EF4444` (red-500) - alarma
- Metas: `#18B7B0` (teal) - positivo

---

## 📝 Checklist Final de Implementación

### Fase 1: Core
- [ ] Actualizar types (Budget, BudgetType, BudgetProgress)
- [ ] Actualizar Zustand store (addBudget, getBudgetProgress, getHealthCheck)
- [ ] Crear migration service (migrateBudgetsToV2)
- [ ] Test unitarios del store

### Fase 2: UI
- [ ] Renombrar archivos (BudgetPage → PlanPage)
- [ ] Actualizar BottomBar (label "Plan", ruta /plan)
- [ ] Crear BudgetCard component
- [ ] Actualizar ProgressBar (añadir prop color)
- [ ] Crear AddEditPlanPage con selector de tipo (Step 0)
- [ ] Crear EmptyStatePlan component
- [ ] Actualizar rutas en App.tsx

### Fase 3: i18n
- [ ] Actualizar es/translation.json
- [ ] Actualizar en/translation.json
- [ ] Actualizar fr/translation.json
- [ ] Actualizar pt/translation.json

### Fase 4: Testing
- [ ] Tests unitarios (store logic)
- [ ] Manual testing (checklist completo)
- [ ] Probar migración con datos reales

### Fase 5: Polish
- [ ] Añadir animaciones (modal entrance, card hover)
- [ ] Verificar safe areas en iOS
- [ ] Verificar accesibilidad (a11y)
- [ ] Code review

### Fase 6: Deploy
- [ ] Update CHANGELOG.md
- [ ] Crear PR con descripción completa
- [ ] Deploy a producción
- [ ] Monitor errores en Sentry (si aplica)

---

## 📚 Referencias

- [CLAUDE.md](../CLAUDE.md) - Guía de diseño del proyecto
- [Zustand Docs](https://zustand-demo.pmnd.rs/) - State management
- [i18next](https://www.i18next.com/) - Internacionalización
- [Lucide Icons](https://lucide.dev/) - Iconografía

---

## 🎉 Resultado Esperado

Al finalizar este refactor:

1. ✅ Los usuarios podrán crear **límites de gasto** (restrictivos)
2. ✅ Los usuarios podrán crear **metas de ahorro** (acumulativos modelo Piggy Bank)
3. ✅ El módulo se llamará **"Plan"** en lugar de "Budget"
4. ✅ El health check mostrará estado de límites y metas de forma clara
5. ✅ La UI diferenciará visualmente límites (rojo si excede) vs metas (teal siempre)
6. ✅ Migración automática de datos existentes sin pérdida de información
7. ✅ Soporte multiidioma completo (es, en, fr, pt)

---

**Fecha de creación**: 2026-01-27
**Versión**: 1.0
**Autor**: Plan de Implementación - Refactor Budget→Plan
