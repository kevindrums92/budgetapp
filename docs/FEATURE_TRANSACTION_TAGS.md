# Feature: Transaction Tags/Status

## Problema a Resolver

Actualmente no hay forma de marcar transacciones para identificar su estado de pago. Casos de uso comunes:
- Registrar un gasto futuro pero marcarlo como "pendiente de pago"
- Identificar qué facturas/servicios ya fueron pagados
- Distinguir entre gastos planeados vs. ejecutados
- Hacer seguimiento de deudas o pagos comprometidos

## Casos de Uso Reales

### Usuario A: Servicios recurrentes
- Registra Netflix ($50.000) el día 1 de cada mes
- Lo marca como "Pendiente" hasta que se ejecute el cargo
- Cuando ve el cargo en su banco, lo cambia a "Pagado"

### Usuario B: Compras a crédito
- Compra unos zapatos ($200.000) pero los paga en cuotas
- Marca la transacción como "A crédito" o "Cuotas"
- Cada mes registra el pago de la cuota

### Usuario C: Gastos planeados
- Planea ir al cine el fin de semana ($30.000)
- Lo registra como "Planeado"
- Después del gasto real, lo marca como "Pagado"

## Propuestas de Solución

### Opción 1: Tags Flexibles (Sistema de Etiquetas)

**Concepto**: Permitir agregar múltiples tags personalizados a cada transacción.

**Ventajas**:
- Máxima flexibilidad para el usuario
- Se pueden crear tags ad-hoc: "Pendiente", "Pagado", "A crédito", "Urgente", "Opcional"
- Permite categorización multi-dimensional (ej: "Pendiente" + "Urgente")
- Escalable para futuros casos de uso

**Desventajas**:
- Puede ser complejo para usuarios novatos
- Requiere gestión de tags (crear, editar, eliminar)
- Puede generar inconsistencias (ej: "Pendiente" vs "pendiente" vs "Por pagar")
- UI más compleja

**Diseño de datos**:
```typescript
interface Tag {
  id: string;
  name: string;
  color: string; // Hex color
  icon?: string; // Lucide icon name (opcional)
}

interface Transaction {
  // ... campos existentes
  tags?: string[]; // Array de tag IDs
}

// Nuevo store
interface BudgetState {
  // ... campos existentes
  tagDefinitions: Tag[];
  addTag: (tag: Tag) => void;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  addTagToTransaction: (transactionId: string, tagId: string) => void;
  removeTagFromTransaction: (transactionId: string, tagId: string) => void;
}
```

**UI Mockup** (descripción):
- En TransactionItem: Badges pequeños debajo del nombre de categoría
- En AddEditTransactionPage: Sección "Etiquetas" con chips seleccionables
- Botón "+" para crear nueva etiqueta inline
- TagPickerDrawer similar a CategoryPickerDrawer

**Filtros**:
- En HomePage: Filtro por tags (además de búsqueda)
- Mostrar transacciones con tag "Pendiente"
- Mostrar transacciones sin tags

---

### Opción 2: Status Predefinido (Campo de Estado)

**Concepto**: Campo `status` con valores predefinidos: "Pagado", "Pendiente", "Planeado".

**Ventajas**:
- Simplicidad extrema
- Fácil de entender para cualquier usuario
- UI más limpia y directa
- Sin necesidad de gestión de tags
- Consistencia garantizada

**Desventajas**:
- Menos flexible
- No cubre casos de uso complejos (ej: "A crédito", "Urgente")
- Si se necesita más info, hay que agregar más campos

**Diseño de datos**:
```typescript
type TransactionStatus = "paid" | "pending" | "planned";

interface Transaction {
  // ... campos existentes
  status?: TransactionStatus; // Opcional, default = "paid"
}
```

**UI Mockup** (descripción):
- En TransactionItem: Badge pequeño con color según status
  - "Pagado": verde (emerald-500) o sin badge (default)
  - "Pendiente": amarillo/naranja (amber-500)
  - "Planeado": azul (blue-500)
- En AddEditTransactionPage: Toggle o selector simple
- En HomePage: Filtro rápido por status

**Colores sugeridos**:
- Pagado: Sin badge o `bg-emerald-50 text-emerald-700`
- Pendiente: `bg-amber-50 text-amber-700`
- Planeado: `bg-blue-50 text-blue-700`

---

### Opción 3: Híbrido (Status + Tags Opcionales)

**Concepto**: Campo `status` predefinido + opción de agregar tags personalizados.

**Ventajas**:
- Cubre el 80% de casos con status simple
- Permite extensión con tags para casos avanzados
- Balance entre simplicidad y flexibilidad

**Desventajas**:
- Más complejidad en la UI
- Puede confundir: ¿cuándo usar status vs. tags?
- Mayor superficie de mantenimiento

**Diseño de datos**:
```typescript
type TransactionStatus = "paid" | "pending" | "planned";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Transaction {
  // ... campos existentes
  status?: TransactionStatus;
  tags?: string[]; // Opcional, para casos avanzados
}
```

---

## Análisis Comparativo

| Aspecto | Tags Flexibles | Status Predefinido | Híbrido |
|---------|----------------|-------------------|---------|
| **Simplicidad** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Flexibilidad** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Facilidad UI** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Escalabilidad** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Consistencia** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Complejidad Dev** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |

---

## Recomendación: **Opción 2 (Status Predefinido)** 🎯

### Justificación

1. **Principio YAGNI** (You Aren't Gonna Need It):
   - El 90% de usuarios solo necesitan "Pendiente" vs "Pagado"
   - Tags flexibles son over-engineering para el caso de uso actual
   - Podemos agregar tags después si realmente se necesitan

2. **Mobile-first**:
   - UI más simple = mejor UX en móvil
   - Menos taps para marcar una transacción
   - Menos espacio visual ocupado

3. **Consistencia**:
   - No hay problema de "tags duplicados" o "mal escritos"
   - Colores y labels consistentes en toda la app

4. **Iteración rápida**:
   - Implementación más rápida
   - Fácil de testear con usuarios
   - Si no funciona, pivotear es más fácil

### Plan de Implementación

#### Fase 1: Modelo de datos (v0.8.0)
- [ ] Agregar campo `status?: TransactionStatus` al tipo Transaction
- [ ] Migración de datos: todas las transacciones existentes tienen `status: "paid"` por defecto
- [ ] Actualizar Zustand store con acciones para cambiar status

#### Fase 2: UI básica (v0.8.0)
- [ ] Badge de status en TransactionItem
  - Solo mostrar si status !== "paid"
  - Estilos: rounded-full, text-xs, padding pequeño
- [ ] Selector de status en AddEditTransactionPage
  - Tabs o segmented control: "Pagado" | "Pendiente" | "Planeado"
  - Default: "Pagado"

#### Fase 3: Filtros (v0.9.0)
- [ ] Filtro rápido en HomePage
  - Chips/tabs para filtrar por status
  - "Todos" | "Pendiente" | "Planeado" | "Pagado"
- [ ] Contador de transacciones pendientes
  - Badge en BottomBar o en TopHeader

#### Fase 4: Acciones rápidas (v0.9.0)
- [ ] Botón quick-action en TransactionItem para cambiar status
  - Tap largo o swipe para marcar como pagado
  - Iconos inline: CheckCircle (pagado), Clock (pendiente), Calendar (planeado)

---

## Diseño de UI Detallado

### TransactionItem con Badge

```
┌─────────────────────────────────────┐
│  [Icon]  Gasto hormiga              │
│          Hormiga             -60.000│
│          [Pendiente]                │  ← Badge amarillo
└─────────────────────────────────────┘
```

### AddEditTransactionPage - Selector de Status

```
┌─────────────────────────────────────┐
│  ← Editar movimiento                │
│                                     │
│  [Descripción input]                │
│  [Monto input]                      │
│  [Categoría picker]                 │
│                                     │
│  Estado                             │
│  ┌─────────┬──────────┬──────────┐  │
│  │ Pagado  │Pendiente │ Planeado │  │
│  │    ✓    │          │          │  │ ← Tabs
│  └─────────┴──────────┴──────────┘  │
│                                     │
│  [Fecha picker]                     │
│  [Guardar button]                   │
└─────────────────────────────────────┘
```

### HomePage con Filtro de Status

```
┌─────────────────────────────────────┐
│  [BalanceCard sticky]               │
│  [SearchBar sticky]                 │
│                                     │
│  ┌─────┬─────────┬─────────┬──────┐ │
│  │Todos│Pendiente│ Planeado│Pagado│ │ ← Filter chips
│  └─────┴─────────┴─────────┴──────┘ │
│                                     │
│  Hoy                        -60.000 │
│  ┌───────────────────────────────┐  │
│  │ [Icon] Gasto                  │  │
│  │        Hormiga   [Pend] -60K  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## Preguntas Abiertas

1. **¿Debería el status afectar el cálculo del balance?**
   - Opción A: Solo transacciones "Pagado" cuentan para balance
   - Opción B: Todas cuentan, status es solo visual
   - **Recomendación**: Opción B (todas cuentan). Status es metadata, no afecta balance real.

2. **¿Transacciones recurrentes heredan el status?**
   - Cuando se replica una transacción recurrente, ¿hereda el status del original?
   - **Recomendación**: No. Nueva transacción = "Pagado" por defecto.

3. **¿Status en transacciones de Ingresos?**
   - ¿Tiene sentido "Pendiente" para ingresos? (ej: salario por cobrar)
   - **Recomendación**: Sí, aplica igual. Mismos 3 estados.

4. **¿Quick action para cambiar status?**
   - ¿Botón inline en TransactionItem o solo desde edición?
   - **Recomendación**: Solo desde edición en v0.8.0. Quick action en v0.9.0.

5. **¿Notificaciones para pendientes?**
   - ¿Notificar si hay transacciones pendientes hace X días?
   - **Recomendación**: No por ahora. Feature futura (v1.0+).

---

## Métricas de Éxito

- [ ] 50%+ de usuarios activos usan el campo status en al menos 1 transacción
- [ ] Tiempo de registro de transacción no aumenta >10%
- [ ] 0 reportes de confusión sobre cómo usar status
- [ ] Feedback positivo en filtro de transacciones pendientes

---

## Alternativas Descartadas

### A. Checkbox "Pagado" simple
- Demasiado limitado (solo 2 estados)
- No permite "Planeado"

### B. Campo de texto libre "Notas de estado"
- Sin estructura, difícil de filtrar
- Inconsistente entre usuarios

### C. Colores de transacción personalizados
- Confunde con categorías
- Difícil de entender el significado

---

## Próximos Pasos

1. **Validar con usuarios** (antes de implementar):
   - Mostrar mockups a 3-5 usuarios actuales
   - Preguntar: ¿resolverían esto tu problema?
   - Iterar diseño según feedback

2. **Prototipo rápido** (1 día):
   - Implementar solo el campo status (sin UI)
   - Agregar badge básico en TransactionItem
   - Testear visualmente

3. **Implementación completa** (2-3 días):
   - Seguir el plan de Fase 1 y 2
   - Documentar en CHANGELOG
   - Release v0.8.0

4. **Análisis post-release** (1 semana después):
   - Revisar métricas de uso
   - Recoger feedback
   - Decidir si agregar Fase 3 y 4

---

## Recursos y Referencias

- Inspiración: Notion (sistema de status en DB)
- Inspiración: Todoist (prioridad de tareas)
- Color palette: Seguir guía de diseño existente (emerald, amber, blue)
- Icons: Lucide React (CheckCircle, Clock, Calendar)

---

**Autor**: Kevin (con asistencia de Claude)
**Fecha**: 2026-01-18
**Versión**: 1.0
**Estado**: Propuesta para discusión
