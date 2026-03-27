# Plan: Sistema de Spotlight Tour para usuarios nuevos

**Estado**: En progreso
**Fecha**: 2026-02-09

---

## Contexto

Los usuarios que completan el onboarding (Welcome + FirstConfig) llegan al HomePage sin saber como usar la app. En pruebas con usuarios reales, muchos no entienden que hace el FAB, como cambiar de mes, o como navegar entre secciones. Necesitamos un sistema de **Spotlight Tour** que guie al usuario paso a paso la primera vez que abre cada seccion clave de la app.

## Enfoque: Spotlight Tour con `data-tour` attributes

Un overlay oscuro semi-transparente con un "agujero" (spotlight) que ilumina un elemento a la vez, acompanado de un tooltip explicativo. El usuario ve la UI real mientras aprende.

- **Tecnica del spotlight**: `box-shadow: 0 0 0 9999px rgba(0,0,0,0.75)` en un div posicionado sobre el target
- **Seleccion de targets**: Atributos `data-tour="nombre"` + `querySelector` + `getBoundingClientRect()`

---

## Arquitectura

### Nuevos archivos

```
src/features/tour/
  components/
    SpotlightTour.tsx          # Componente principal (overlay + spotlight + tooltip)
    TourTooltip.tsx            # Card del tooltip
  hooks/
    useSpotlightTour.ts        # Hook: estado, navegacion, persistencia
  tours/
    homeTour.ts                # Pasos del Home (5 pasos)
    statsTour.ts               # Pasos de Stats (2 pasos)
    addTransactionTour.ts      # Pasos de Add Transaction (3 pasos)
  types.ts                     # TourStep, TourConfig

src/i18n/locales/{es,en,pt,fr}/tour.json   # Traducciones
```

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/types/budget.types.ts` | Agregar `homeTourSeen`, `statsTourSeen`, `addTransactionTourSeen` |
| `src/state/budget.store.ts` | Flags + setters + getSnapshot + replaceAllData |
| `src/i18n/config.ts` | Registrar namespace `tour` |
| `src/features/transactions/pages/HomePage.tsx` | `data-tour` attrs + SpotlightTour |
| `src/features/stats/pages/StatsPage.tsx` | `data-tour` attrs + SpotlightTour |
| `src/features/transactions/pages/AddEditTransactionPage.tsx` | `data-tour` attrs + SpotlightTour |
| `src/shared/components/layout/BottomBar.tsx` | `data-tour="home-bottom-bar"` |
| `src/shared/components/navigation/MonthSelector.tsx` | `data-tour="home-month-selector"` |
| `src/features/transactions/components/BalanceCard.tsx` | `data-tour="home-balance-card"` |

---

## Tipos

```typescript
export interface TourStep {
  target: string;           // data-tour attribute value
  titleKey: string;         // i18n key (namespace: tour)
  descriptionKey: string;   // i18n key
  position?: 'top' | 'bottom' | 'auto';
  padding?: number;         // px extra around spotlight
  borderRadius?: number;    // spotlight border radius
}

export interface TourConfig {
  id: string;              // "home", "stats", "addTransaction"
  steps: TourStep[];
  startDelay?: number;     // ms before starting (default 800)
}
```

---

## Tours

### Home Tour (5 pasos)

| # | `data-tour` | Explica |
|---|-------------|---------|
| 1 | `home-fab` | Boton + para agregar gastos e ingresos |
| 2 | `home-month-selector` | Flechas para cambiar de mes |
| 3 | `home-balance-card` | Balance del mes: ingresos vs gastos |
| 4 | `home-transaction-list` | Toca cualquier movimiento para editarlo |
| 5 | `home-bottom-bar` | Navega entre Inicio, Plan, Stats y Ajustes |

### Stats Tour (2 pasos)

| # | `data-tour` | Explica |
|---|-------------|---------|
| 1 | `stats-donut-chart` | Grafico de gastos por categoria |
| 2 | `stats-quick-cards` | Resumen rapido de habitos financieros |

### Add Transaction Tour (3 pasos)

| # | `data-tour` | Explica |
|---|-------------|---------|
| 1 | `add-type-selector` | Elige gasto o ingreso |
| 2 | `add-amount-input` | Ingresa el monto |
| 3 | `add-category-picker` | Selecciona categoria |

---

## Persistencia (patron existente de budgetOnboardingSeen)

```typescript
// localStorage keys:
"budget.homeTour.v1"
"budget.statsTour.v1"
"budget.addTransactionTour.v1"
```

Sync a cloud via `getSnapshot()` + `replaceAllData()`.

---

## z-index: `z-[95]`

Entre z-[85] (Wizard/Onboarding) y z-[100] (libre).

---

## Checklist de implementacion

- [ ] 1. Tipos + Hook + Componentes base
- [ ] 2. Zustand store flags
- [ ] 3. i18n (4 idiomas + config.ts)
- [ ] 4. Home Tour (data-tour + definicion + integracion)
- [ ] 5. Stats Tour
- [ ] 6. Add Transaction Tour
- [ ] 7. Build verification (`npm run build`)

---

## Edge cases

- **Elemento no visible**: Saltar al siguiente paso
- **Scroll**: `scrollIntoView({ behavior: 'smooth', block: 'center' })` antes del spotlight
- **Resize**: Recalcular posicion con debounce
- **Dark mode**: Clases `dark:` en tooltip y overlay
- **Empty state**: Si BalanceCard no existe (sin transacciones), saltar ese paso
