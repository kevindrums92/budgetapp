# Testing Guide - BudgetApp

Guía completa para escribir y ejecutar tests en BudgetApp.

## Stack de Testing

- **Vitest** - Test runner (rápido, compatible con Vite)
- **React Testing Library** - Testing de componentes React
- **Jest-DOM** - Matchers adicionales para el DOM
- **User Event** - Simulación de interacciones de usuario
- **MSW** - Mock Service Worker para APIs (instalado, pendiente configurar)

## Comandos Disponibles

```bash
# Ejecutar tests en modo watch (recomendado para desarrollo)
npm test

# Ver tests en el navegador con UI interactiva
npm run test:ui

# Ejecutar tests una vez (para CI/CD)
npm run test:run

# Ejecutar tests con reporte de cobertura
npm run test:coverage

# Ejecutar tests en modo watch (alias)
npm run test:watch
```

## Estructura de Archivos

Los tests viven junto a los archivos que testean:

```
src/
├── services/
│   ├── dates.service.ts
│   └── dates.service.test.ts          # ✅ Test del servicio
├── state/
│   ├── budget.store.ts
│   └── budget.store.test.ts           # ✅ Test del store
├── components/
│   ├── MonthNavigator.tsx
│   └── MonthNavigator.test.tsx        # ✅ Test del componente
└── test/
    ├── setup.ts                        # Configuración global
    └── test-utils.tsx                  # Utilidades personalizadas
```

## Escribiendo Tests

### 1. Tests de Servicios (Funciones Puras)

Los servicios son los más fáciles de testear porque son funciones puras.

**Ejemplo: `dates.service.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { monthKey, monthLabelES } from './dates.service';

describe('dates.service', () => {
  describe('monthKey', () => {
    it('should extract YYYY-MM from ISO date string', () => {
      expect(monthKey('2026-01-15')).toBe('2026-01');
      expect(monthKey('2025-12-31')).toBe('2025-12');
    });
  });

  describe('monthLabelES', () => {
    it('should format month key as Spanish month label', () => {
      expect(monthLabelES('2026-01')).toBe('Enero de 2026');
    });
  });
});
```

**Buenas prácticas:**
- ✅ Agrupar tests relacionados con `describe`
- ✅ Nombres descriptivos: "should do X when Y"
- ✅ Testear casos edge (null, undefined, valores extremos)
- ✅ Un test por comportamiento

### 2. Tests del Store (Zustand)

El store se testea directamente sin necesidad de componentes.

**Ejemplo: `budget.store.test.ts`**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBudgetStore } from './budget.store';

// Mock dependencies
vi.mock('@/services/storage.service', () => ({
  loadState: vi.fn(() => null),
  saveState: vi.fn(),
}));

describe('budget.store', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useBudgetStore.getState();
    store.transactions = [];
  });

  it('should add a transaction', () => {
    const store = useBudgetStore.getState();

    store.addTransaction({
      type: 'expense',
      name: 'Test',
      category: 'food',
      amount: 100,
      date: '2026-01-15',
    });

    expect(store.transactions).toHaveLength(1);
    expect(store.transactions[0].name).toBe('Test');
  });
});
```

**Buenas prácticas:**
- ✅ Limpiar estado en `beforeEach`
- ✅ Mockear dependencias externas
- ✅ Testear operaciones CRUD completas
- ✅ Verificar efectos secundarios

### 3. Tests de Componentes

Usamos React Testing Library para testear componentes.

**Ejemplo: `MonthNavigator.test.tsx`**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import MonthNavigator from './MonthNavigator';

describe('MonthNavigator', () => {
  it('should render month navigator', () => {
    render(<MonthNavigator />);

    expect(screen.getByText('Enero de 2026')).toBeInTheDocument();
    expect(screen.getByLabelText('Mes anterior')).toBeInTheDocument();
  });

  it('should navigate to previous month', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MonthNavigator />);

    await user.click(screen.getByLabelText('Mes anterior'));

    expect(screen.getByText('Diciembre de 2025')).toBeInTheDocument();
  });
});
```

**Buenas prácticas:**
- ✅ Usar `screen` queries (getByText, getByRole, getByLabelText)
- ✅ Simular interacciones con `userEvent`
- ✅ Testear comportamiento visible, no implementación
- ✅ Verificar accesibilidad (aria-labels, roles)

## Queries de React Testing Library

### Orden de Prioridad (del más al menos preferido)

1. **getByRole** - Mejor para accesibilidad
   ```typescript
   screen.getByRole('button', { name: /guardar/i })
   ```

2. **getByLabelText** - Para inputs con labels
   ```typescript
   screen.getByLabelText('Nombre')
   ```

3. **getByPlaceholderText** - Para inputs con placeholder
   ```typescript
   screen.getByPlaceholderText('Ingresa tu nombre')
   ```

4. **getByText** - Para texto visible
   ```typescript
   screen.getByText('Bienvenido')
   ```

5. **getByTestId** - Último recurso
   ```typescript
   screen.getByTestId('custom-element')
   ```

### Variantes de Queries

- **getBy...** - Lanza error si no encuentra (para elementos que deben existir)
- **queryBy...** - Retorna null si no encuentra (para elementos que no deben existir)
- **findBy...** - Async, espera a que aparezca (para elementos que cargan)

```typescript
// Elemento debe existir
expect(screen.getByText('Title')).toBeInTheDocument();

// Elemento no debe existir
expect(screen.queryByText('Hidden')).not.toBeInTheDocument();

// Elemento aparecerá después
await screen.findByText('Loaded data');
```

## Mockear Dependencias

### Mockear Módulos Completos

```typescript
vi.mock('@/services/storage.service', () => ({
  loadState: vi.fn(() => null),
  saveState: vi.fn(),
}));
```

### Mockear Funciones Específicas

```typescript
import { loadState } from '@/services/storage.service';

vi.mock('@/services/storage.service');

// Después configurar el mock
vi.mocked(loadState).mockReturnValue({ transactions: [] });
```

### Mockear Fechas

```typescript
import { beforeEach, afterEach, vi } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});
```

## Testing de Async Code

### Esperar a que algo aparezca

```typescript
// Mal ❌
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Bien ✅
expect(await screen.findByText('Loaded')).toBeInTheDocument();
```

### Esperar a que desaparezca

```typescript
await waitFor(() => {
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
});
```

## Cobertura de Tests

### Ver Reporte

```bash
npm run test:coverage
```

El reporte se genera en `coverage/index.html` - ábrelo en el navegador para ver detalles.

### Metas de Cobertura

- **Services**: 80%+ (funciones puras, fáciles de testear)
- **Store**: 70%+ (lógica de negocio crítica)
- **Components**: 60%+ (priorizando componentes reutilizables)
- **Pages**: 40%+ (tests de integración más complejos)

## Debugging Tests

### Ver qué renderizó

```typescript
import { screen } from '@/test/test-utils';

render(<MyComponent />);
screen.debug(); // Imprime el HTML renderizado
```

### Ver elemento específico

```typescript
const element = screen.getByText('Test');
screen.debug(element);
```

### Usar UI Mode

```bash
npm run test:ui
```

Abre un navegador con interfaz interactiva para:
- Ver tests en tiempo real
- Inspeccionar renders
- Ver errores detallados

## CI/CD

El comando `npm run test:run` se ejecuta automáticamente en el script `pre-release`:

```json
{
  "scripts": {
    "pre-release": "git checkout develop && git pull && npm run build && npm run lint && npm run test:run"
  }
}
```

## Próximos Pasos

### Tests Pendientes (Prioridad)

1. **Storage Service** - localStorage operations
2. **Category CRUD** - addCategory, updateCategory, deleteCategory
3. **Transaction Form** - validaciones y submit
4. **Cloud Sync Logic** - pendingSync.service.ts

### Configurar MSW (opcional)

Para mockear llamadas a Supabase en tests:

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('*/rest/v1/user_state', () => {
    return HttpResponse.json({ success: true });
  }),
];
```

## Recursos

- [Vitest Docs](https://vitest.dev)
- [React Testing Library Docs](https://testing-library.com/react)
- [Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Tips Finales

✅ **DO:**
- Testear comportamiento, no implementación
- Usar nombres descriptivos para tests
- Mantener tests simples y enfocados
- Limpiar estado entre tests
- Mockear dependencias externas

❌ **DON'T:**
- Testear detalles de implementación (nombres de clases CSS, estructura interna)
- Hacer tests que dependan de otros tests
- Testear librerías de terceros
- Usar `waitFor` cuando `findBy` es suficiente
- Ignorar warnings de React Testing Library
