# Roadmap - Budget App

> Documento de seguimiento de features y mejoras planificadas

---

## Estado Actual

### Bottom Bar (5 opciones)
| Tab | Ruta | Estado | Descripción |
|-----|------|--------|-------------|
| Home | `/` | Implementado | Control de presupuesto mensual, lista de transacciones |
| Budget | `/budget` | Implementado | Gestión de categorías y límites de presupuesto |
| FAB (+) | `/add` | Implementado | Agregar nueva transacción |
| Stats | `/stats` | Implementado | Visualización de datos y estadísticas con gráficos |
| Trips | `/trips` | Implementado | Travel Planner para planificar y trackear gastos de viajes |

---

## Prioridades

### P0 - Alta Prioridad

#### Travel Planner (Reemplaza Settings) - COMPLETADO
> Módulo para planificar y trackear gastos de viajes

**Funcionalidades core:**
- [x] Crear/editar/eliminar viajes
- [x] Definir presupuesto total por viaje
- [x] Registrar gastos asociados al viaje
- [x] Vista de progreso: gastado vs presupuesto
- [x] Fechas de inicio/fin del viaje
- [x] Ubicación/destino del viaje
- [x] Categorías de gastos (transporte, alojamiento, comida, actividades, compras, otros)

**Ideas para futuras mejoras:**
- [ ] Soporte multi-moneda (útil para viajes internacionales)
- [ ] Conversión automática a moneda base
- [ ] Fotos/notas por gasto (recuerdos del viaje)
- [ ] Resumen diario de gastos
- [ ] Alertas cuando te acercas al límite del presupuesto
- [ ] Compartir viaje con acompañantes (split expenses)
- [ ] Historial de viajes pasados con estadísticas
- [ ] Exportar resumen del viaje (PDF/imagen)

**Modelo de datos propuesto:**
```typescript
interface Trip {
  id: string
  name: string                    // "San Andrés Islas 2026"
  destination: string             // "San Andrés, Colombia"
  budget: number                  // Presupuesto total
  currency: string                // "COP" | "USD" | etc
  startDate: string               // YYYY-MM-DD
  endDate: string | null          // YYYY-MM-DD (null si aún en curso)
  status: "planning" | "active" | "completed"
  createdAt: number
}

interface TripExpense {
  id: string
  tripId: string
  category: TripExpenseCategory
  name: string                    // "Almuerzo en Johnny Cay"
  amount: number
  currency: string                // Por si pagas en otra moneda
  date: string
  notes?: string
  createdAt: number
}

type TripExpenseCategory =
  | "transport"      // Vuelos, taxis, lanchas
  | "accommodation"  // Hotel, Airbnb
  | "food"           // Restaurantes, mercado
  | "activities"     // Tours, entradas
  | "shopping"       // Souvenirs, compras
  | "other"
```

---

### P1 - Prioridad Media

#### Budget Page - COMPLETADO
> Gestión de categorías y límites de presupuesto mensual

**Funcionalidades core:**
- [x] Lista de todas las categorías
- [x] Agregar/editar/eliminar categorías personalizadas
- [x] Establecer límite mensual por categoría
- [x] Barra de progreso: gastado vs límite
- [x] Alertas visuales cuando te acercas/superas el límite (verde/amarillo/rojo)
- [x] Iconos personalizados por categoría
- [x] Presupuesto mensual global (suma de todas las categorías)
- [x] Wizard de onboarding en primera visita (pantalla completa con Embla Carousel)

**Ideas para futuras mejoras:**
- [ ] Arrastrar para reordenar categorías
- [ ] Copiar límites de mes anterior
- [ ] Plantillas de presupuesto predefinidas

**Modelo de datos propuesto:**
```typescript
interface CategoryBudget {
  category: string
  monthlyLimit: number | null     // null = sin límite
  icon?: string                   // emoji o nombre de icono
  color?: string                  // para la UI
  order: number                   // para ordenar
}
```

---

### P2 - Prioridad Baja

#### Stats Page - COMPLETADO
> Visualización de datos y estadísticas

**Funcionalidades core:**
- [x] Gráfico de gastos por categoría (donut chart con Recharts)
- [x] Gráfico de ingresos vs gastos últimos 6 meses (bar chart)
- [x] Tendencia de gastos últimos 12 meses (line chart)
- [x] Quick Stats cards:
  - [x] Promedio de gasto diario
  - [x] Categoría top (con icono y color)
  - [x] Día de la semana donde más gastas
  - [x] Comparativa vs mes anterior (% con indicador visual)
- [x] Banner de presupuesto diario (solo mes actual con presupuestos configurados)
- [x] Estados vacíos para gráficos sin datos

**Ideas para futuras mejoras:**
- [ ] Filtros por rango de fechas personalizado
- [ ] Exportar gráficos como imagen
- [ ] Comparativa entre múltiples meses seleccionables
- [ ] Proyecciones de gasto basadas en tendencias

---

## Backlog (Ideas Futuras)

### Settings (nueva ubicación)
> Mover configuraciones a un drawer o modal

- [ ] Tema claro/oscuro
- [ ] Exportar/importar datos
- [ ] Notificaciones y recordatorios
- [ ] Gestión de cuenta (si está logueado)
- [ ] Backup manual a la nube

### Mejoras Generales
- [ ] Búsqueda de transacciones
- [ ] Filtros avanzados (por fecha, categoría, monto)
- [ ] Transacciones recurrentes
- [ ] Tags/etiquetas personalizadas
- [ ] Múltiples cuentas/billeteras
- [ ] Widget para home screen (PWA)

---

## Changelog

### v0.5.0 (Actual)
- **Budget Onboarding Wizard**
  - Wizard de bienvenida pantalla completa con Embla Carousel (~5KB)
  - 4 slides educativos explicando funcionalidad del módulo Budget:
    - Slide 1: Bienvenida e introducción general (Target icon)
    - Slide 2: Cómo establecer límites mensuales (PiggyBank icon)
    - Slide 3: Sistema de monitoreo con barras de progreso (TrendingUp icon)
    - Slide 4: Diferencia entre Balance y Budget (CheckCircle2 icon)
  - Navegación fluida por swipe, dots clicables, y botones
  - Botón "Saltar" en slides intermedios
  - Se muestra solo en primera visita (flag en localStorage: `budget.budgetOnboardingSeen.v1`)
  - Animaciones suaves con fade transitions (300ms)
  - Diseño minimalista de pantalla completa
  - Integrado en BudgetPage con estado Zustand
  - Iconos grandes con fondos de color con alpha 20%
  - Progress dots animados (8px → 32px cuando activo)

### v0.4.0
- **Stats Page completada**
  - Donut chart de gastos por categoría
  - Bar chart de ingresos vs gastos (últimos 6 meses)
  - Line chart de tendencia de gastos (últimos 12 meses)
  - Quick Stats: promedio diario, categoría top, día que más gastas, comparativa mes anterior
  - Banner de presupuesto diario recomendado
  - Estados vacíos para gráficos sin datos
- **Budget Page completada**
  - Gestión completa de categorías y grupos
  - Límites mensuales por categoría
  - Sistema de colores (verde/amarillo/rojo) para alertas visuales
  - Resumen mensual con progreso global

### v0.3.0
- **Infraestructura de testing**
  - Configuración de Vitest + React Testing Library
  - Tests para storage service
  - Setup de test utilities

### v0.2.0
- **Travel Planner implementado**
  - Lista de viajes con card destacado para viaje activo
  - Crear/editar/eliminar viajes
  - Presupuesto por viaje con barra de progreso
  - Registrar gastos por categoría (transporte, alojamiento, comida, actividades, compras, otros)
  - Vista de detalle con desglose por categoría
  - Sync automático con Supabase

### v0.1.0
- Home page con lista de transacciones
- Agregar/editar/eliminar transacciones
- Categorías básicas
- Modo invitado (localStorage)
- Sync con Supabase (usuarios autenticados)
- PWA instalable

---

## Notas

- **Estado del proyecto**: Funcionalidades core completadas (Home, Budget, Stats, Trips)
- **Prioridad actual**: Pulir UX y preparar para siguientes features del backlog
- **Arquitectura**: Patrón local-first mantenido, sync opcional a Supabase
- **UI**: Estilo iOS-like consistente en toda la app
- **Librerías visuales**: Recharts para gráficos, Embla Carousel para onboarding
