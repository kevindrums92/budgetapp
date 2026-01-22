# Plan: Scheduled Transactions Manager Page (`/scheduled`)

## Objetivo
Crear una página para gestionar todas las transacciones programadas (templates con `schedule`).

## Decisiones del Usuario
- **Sin estado "Pausado"** - Solo Activas y Finalizadas
- **Acceso desde ProfilePage** - Nuevo MenuItem en el menú de perfil
- **Acciones: Editar + Eliminar** - Con modal de confirmación siempre

---

## Archivos a Crear

### 1. `src/features/transactions/pages/ScheduledPage.tsx`
Página principal con PageHeader (sin BottomBar). y flecha de volver atras: Componente TopHeader

**Estructura:**
```tsx
<div className="flex min-h-screen flex-col bg-gray-50">
  <PageHeader title="Programadas" />
  <div className="flex-1 px-4 pt-6 pb-8 space-y-6">
    {/* Sección Activas */}
    {/* Sección Finalizadas (si hay) */}
    {/* Empty state si no hay ninguna */}
  </div>
</div>
```

**Lógica de clasificación (solo 2 estados):**
```typescript
const templates = transactions.filter(tx => tx.schedule !== undefined);
const active = templates.filter(t =>
  t.schedule?.enabled && (!t.schedule.endDate || t.schedule.endDate > today)
);
const ended = templates.filter(t =>
  t.schedule?.enabled && t.schedule.endDate && t.schedule.endDate <= today
);
```

### 2. `src/features/transactions/components/ScheduleListItem.tsx`
Card individual para cada template.

**Información mostrada:**
- Icono + color de categoría
- Nombre de transacción
- Nombre de categoría
- Monto (con signo según tipo)
- Descripción de frecuencia ("Mensual el día 15", "Semanal los viernes")
- Próxima fecha (solo si activa)
- Badge de estado (Activa/Finalizada)

**Acciones (2 botones):**
- **Editar** → `navigate(/edit/${id})`
- **Eliminar** → Modal de confirmación → set `schedule.endDate = today`

### 3. `src/shared/utils/schedule.utils.ts`
Helpers para formatear frecuencia en español.

```typescript
// "Diario" | "Cada 2 días"
// "Semanal los viernes" | "Cada 2 semanas los lunes"
// "Mensual el día 15" | "Cada 3 meses el día 1"
// "Anual" | "Cada 2 años"
export function formatScheduleFrequency(schedule: Schedule): string

// "15 Feb 2025"
export function formatNextDate(dateStr: string): string
```

---

## Archivos a Modificar

### 1. `src/App.tsx`
```typescript
// Agregar lazy import
const ScheduledPage = lazy(() => import("@/features/transactions/pages/ScheduledPage"));

// Agregar a isFormRoute (línea ~61-68)
location.pathname === "/scheduled" ||

// Agregar ruta (después de /edit/:id)
<Route path="/scheduled" element={<ScheduledPage />} />
```

### 2. `src/features/profile/pages/ProfilePage.tsx`
Agregar nuevo MenuItem para "Transacciones Programadas" con icono `Repeat` o `Calendar`.

```tsx
// En el menú (después de "Categorías")
<MenuItem
  icon={<Repeat size={20} />}
  label="Programadas"
  onClick={() => navigate("/scheduled")}
/>
```

---

## UI Design

### ScheduleListItem Card (Simplificado)
```
┌──────────────────────────────────────────┐
│ [🎵] Netflix              [Badge Activa] │
│      Suscripciones                       │
│      -$45.000                            │
│      Mensual el día 15                   │
│      Próxima: 15 Feb 2025                │
│                                          │
│         [Editar]    [Eliminar]           │
└──────────────────────────────────────────┘
```

### Badges de Estado (Solo 2)
- **Activa**: `bg-emerald-50 text-emerald-700`
- **Finalizada**: `bg-gray-100 text-gray-500`

### Section Headers
```tsx
<h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
  Activas ({active.length})
</h2>
```

### Empty State
```tsx
<div className="rounded-xl bg-gray-50 p-6 text-center">
  <Calendar className="mx-auto h-10 w-10 text-gray-300" />
  <p className="mt-3 text-sm font-medium text-gray-600">
    No tienes transacciones programadas
  </p>
  <p className="mt-1 text-xs text-gray-400">
    Activa la programación al crear una transacción
  </p>
</div>
```

### Modal de Confirmación para Eliminar
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="absolute inset-0 bg-black/50" onClick={onClose} />
  <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
    <h3 className="mb-2 text-lg font-semibold text-gray-900">
      Eliminar programación
    </h3>
    <p className="mb-4 text-sm text-gray-600">
      Esto terminará la programación de "{name}".
      No se generarán más transacciones a partir de hoy.
    </p>
    <p className="mb-4 text-xs text-gray-500">
      Las transacciones ya registradas no se verán afectadas.
    </p>
    <div className="flex gap-3">
      <button className="flex-1 rounded-xl bg-gray-100 py-3 ...">
        Cancelar
      </button>
      <button className="flex-1 rounded-xl bg-red-500 py-3 ...">
        Eliminar
      </button>
    </div>
  </div>
</div>
```

---

## Verificación

1. Ir a ProfilePage → Click en "Programadas"
2. Verificar que muestra templates activas
3. Click "Editar" → navegar a formulario de edición
4. Click "Eliminar" → modal de confirmación
5. Confirmar eliminación → schedule se mueve a "Finalizadas"
6. Verificar que transacciones ya generadas siguen existiendo
7. Verificar empty state cuando no hay schedules
8. Crear nueva transacción programada → verificar que aparece en la lista
