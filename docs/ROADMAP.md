# Roadmap - Budget App

> Documento de seguimiento de features y mejoras planificadas

---

## Estado Actual

### Bottom Bar (5 opciones)
| Tab | Ruta | Estado | Descripción |
|-----|------|--------|-------------|
| Home | `/` | Implementado | Control de presupuesto mensual, lista de transacciones |
| Budget | `/budget` | Esqueleto | Pendiente de implementar |
| FAB (+) | `/add` | Implementado | Agregar nueva transacción |
| Stats | `/stats` | Esqueleto | Pendiente de implementar |
| Settings | `/settings` | Placeholder | **Será reemplazado por Travel Planner** |

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

#### Budget Page
> Gestión de categorías y límites de presupuesto mensual

**Funcionalidades:**
- [x] Lista de todas las categorías
- [x] Agregar/editar/eliminar categorías personalizadas
- [x] Establecer límite mensual por categoría
- [x] Barra de progreso: gastado vs límite
- [x] Alertas visuales cuando te acercas/superas el límite
- [ ] Arrastrar para reordenar categorías
- [x] Iconos personalizados por categoría
- [x] Presupuesto mensual global (suma de todas las categorías)

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

#### Stats Page
> Visualización de datos y estadísticas

**Funcionalidades:**
- [ ] Gráfico de gastos por categoría (pie/donut chart)
- [ ] Gráfico de ingresos vs gastos por mes (bar chart)
- [ ] Tendencia de gastos últimos 6-12 meses (line chart)
- [ ] Top categorías donde más gastas
- [ ] Comparativa mes actual vs mes anterior
- [ ] Promedio diario de gastos
- [ ] Día de la semana donde más gastas
- [ ] Filtros por rango de fechas

**Librerías sugeridas:**
- Recharts (ligera, buen soporte React)
- Chart.js con react-chartjs-2

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

### v0.2.0 (Actual)
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

- **Prioridad actual**: Travel Planner para trackear el viaje a San Andrés
- **Arquitectura**: Mantener patrón local-first, sync opcional a Supabase
- **UI**: Mantener estilo iOS-like consistente con el resto de la app
