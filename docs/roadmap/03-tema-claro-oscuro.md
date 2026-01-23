# Feature: Tema Claro/Oscuro (Dark Mode)

## Resumen

Implementar soporte completo para modo oscuro (dark mode) en la aplicación, permitiendo a los usuarios elegir entre tema claro, oscuro o automático (según configuración del dispositivo). El sistema debe integrarse con la pantalla de selección de tema en el onboarding existente y permitir cambios desde la configuración de perfil.

## Objetivos

- Implementar tema oscuro completo para toda la aplicación
- Soportar 3 modos: Claro (light), Oscuro (dark), Automático (system)
- Detección automática de preferencia del sistema operativo
- Integrar con Screen2_Theme del onboarding existente
- Permitir cambio de tema desde ProfilePage
- Transición suave al cambiar de tema (sin flicker)
- Persistir preferencia del usuario
- Respetar sistema de colores y accesibilidad

## Modos de Tema

| Modo | Descripción | Comportamiento |
|------|-------------|----------------|
| Light | Tema claro | Siempre muestra interfaz clara, sin importar configuración del sistema |
| Dark | Tema oscuro | Siempre muestra interfaz oscura, sin importar configuración del sistema |
| System | Automático | Se adapta a la configuración del sistema operativo (auto switch) |

**Modo por Defecto**: System (automático)

## Casos de Uso

### 1. Primera Instalación - Detección Automática

**Actor**: Usuario nuevo

**Flujo Principal**:
1. Usuario abre la app por primera vez
2. Sistema detecta preferencia de tema del SO mediante `window.matchMedia('(prefers-color-scheme: dark)')`
3. Sistema aplica tema automático (system mode):
   - Si SO está en dark mode → muestra interfaz oscura
   - Si SO está en light mode → muestra interfaz clara
4. Usuario llega a pantalla "Elige tu tema" (Screen2_Theme) en onboarding
5. Opción "Automático" aparece pre-seleccionada
6. Usuario puede confirmar o cambiar a tema fijo
7. Sistema persiste la selección en localStorage: `app_theme`
8. Resto del onboarding se muestra con el tema seleccionado

**Flujos Alternativos**:

**A1: Usuario Cambia a Tema Fijo**
- Usuario selecciona "Claro" u "Oscuro"
- Sistema aplica cambio inmediatamente (cambio en vivo)
- Sistema ignora cambios futuros en configuración del SO

### 2. Cambio de Tema Desde Onboarding

**Actor**: Usuario en proceso de onboarding

**Flujo Principal**:
1. Usuario está en pantalla "Elige tu tema" (paso 2/5 de FirstConfig)
2. Sistema muestra 3 opciones:
   - Claro (Sun icon): "Interfaz luminosa ideal para el día"
   - Oscuro (Moon icon): "Reduce la fatiga visual en ambientes con poca luz"
   - Automático (Smartphone icon): "Se adapta a la configuración de tu dispositivo"
3. Usuario selecciona una opción diferente al tema actual
4. Sistema cambia inmediatamente la UI al nuevo tema (cambio en vivo)
5. Usuario ve el cambio reflejado en:
   - Fondos de pantalla
   - Colores de texto
   - Colores de tarjetas
   - Íconos
6. Usuario presiona "Continuar"
7. Sistema persiste la selección
8. Resto del onboarding se muestra en el nuevo tema

**Notas**:
- El cambio de tema es instantáneo (sin reload)
- Preview en vivo antes de continuar

### 3. Cambio de Tema Desde ProfilePage

**Actor**: Usuario autenticado

**Flujo Principal**:
1. Usuario navega a ProfilePage
2. Usuario ve sección "Preferencias" con opción "Tema"
3. Sistema muestra tema actual (ej: "Automático")
4. Usuario toca la opción "Tema"
5. Sistema abre modal con lista de 3 temas
6. Usuario selecciona nuevo tema
7. Sistema cambia inmediatamente toda la UI al nuevo tema
8. Sistema persiste la selección
9. Sistema muestra toast de confirmación: "Tema actualizado"
10. Usuario regresa a ProfilePage (ahora en nuevo tema)

**Flujos Alternativos**:

**C1: Usuario Cancela Cambio**
- Usuario cierra modal sin seleccionar
- Sistema mantiene tema actual

### 4. Modo Automático - Usuario Cambia SO

**Actor**: Usuario con tema en modo "System"

**Flujo Principal**:
1. Usuario tiene app configurada en modo "Automático"
2. Usuario cambia configuración del SO de claro a oscuro (o viceversa)
3. Sistema detecta cambio mediante event listener
4. Sistema cambia automáticamente el tema de la app
5. UI se actualiza con transición suave
6. Usuario continúa usando la app en nuevo tema

**Notas**:
- Funciona en tiempo real (no requiere reabrir app)
- Transición suave de 200ms

### 5. Usuario Regresa a la App

**Actor**: Usuario existente

**Flujo Principal**:
1. Usuario abre la app
2. Sistema lee preferencia de tema de localStorage: `app_theme`
3. Si es "system", detecta preferencia actual del SO
4. Sistema aplica tema correspondiente antes del primer render
5. App se muestra en el tema preferido (sin flicker)

**Flujos Alternativos**:

**E1: Preferencia No Existe (Usuario Legacy)**
- Sistema usa modo "system" por defecto
- Sistema persiste la preferencia

## Especificaciones UI/UX

### Sistema de Colores

#### Tema Claro (Light Mode)

**Backgrounds**:
- Page background: `bg-gray-50`
- Card background: `bg-white`
- Input background: `bg-gray-50`
- Modal backdrop: `bg-black/50`

**Text**:
- Primary: `text-gray-900`
- Secondary: `text-gray-600`
- Tertiary: `text-gray-500`
- Muted: `text-gray-400`

**Borders**:
- Default: `border-gray-200`
- Subtle: `border-gray-100`
- Strong: `border-gray-300`

**Shadows**:
- Small: `shadow-sm`
- Medium: `shadow-md`
- Large: `shadow-lg`
- Extra large: `shadow-xl`

**Accent Colors** (no cambian):
- Primary teal: `#18B7B0` / `bg-[#18B7B0]` / `text-[#18B7B0]`
- Income: `bg-emerald-500` / `text-emerald-600`
- Expense: `bg-gray-900` / `text-gray-900`

#### Tema Oscuro (Dark Mode)

**Backgrounds**:
- Page background: `dark:bg-gray-950`
- Card background: `dark:bg-gray-900`
- Input background: `dark:bg-gray-800`
- Modal backdrop: `dark:bg-black/70`

**Text**:
- Primary: `dark:text-gray-50`
- Secondary: `dark:text-gray-300`
- Tertiary: `dark:text-gray-400`
- Muted: `dark:text-gray-500`

**Borders**:
- Default: `dark:border-gray-700`
- Subtle: `dark:border-gray-800`
- Strong: `dark:border-gray-600`

**Shadows** (más sutiles):
- Small: `dark:shadow-sm dark:shadow-black/30`
- Medium: `dark:shadow-md dark:shadow-black/40`
- Large: `dark:shadow-lg dark:shadow-black/50`
- Extra large: `dark:shadow-xl dark:shadow-black/60`

**Accent Colors** (ajustados para contraste):
- Primary teal: `#18B7B0` (mantener) pero fondos con `dark:bg-[#18B7B0]/90`
- Income: `dark:bg-emerald-600` / `dark:text-emerald-400`
- Expense: `dark:bg-gray-700` / `dark:text-gray-100`

**Elementos Específicos**:
- BottomBar: `dark:bg-gray-900/99 dark:border-gray-800`
- FAB: `dark:bg-[#18B7B0] dark:shadow-[#18B7B0]/30`
- Hover states: `dark:hover:bg-gray-800`
- Active states: `dark:active:bg-gray-700`

### Transiciones

**Transición Global**:
```css
* {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
```

**Excepciones** (no animar):
- Transform properties (active:scale, etc.)
- Layout properties (width, height)
- Position properties

### Pantalla: Screen2_Theme (Onboarding)

**Modificaciones**:

**Cambios en el Componente**:
1. Importar `useTheme` hook (custom hook)
2. Reemplazar textos hardcodeados con traducciones (i18n)
3. Al cambiar tema, llamar `changeTheme(value)` inmediatamente
4. Eliminar nota "El tema se aplicará cuando se implemente el modo oscuro"
5. Agregar feedback visual del tema aplicado en la propia pantalla

**Textos Traducibles**:
```typescript
{
  "onboarding.theme.title": "Elige tu tema",
  "onboarding.theme.description": "Personaliza la apariencia de SmartSpend según tu preferencia.",
  "onboarding.theme.light.title": "Claro",
  "onboarding.theme.light.description": "Interfaz luminosa ideal para el día",
  "onboarding.theme.dark.title": "Oscuro",
  "onboarding.theme.dark.description": "Reduce la fatiga visual en ambientes con poca luz",
  "onboarding.theme.system.title": "Automático",
  "onboarding.theme.system.description": "Se adapta a la configuración de tu dispositivo",
  "onboarding.theme.continue": "Continuar",
  "onboarding.theme.skip": "Omitir configuración"
}
```

**Behavior**:
- Al montar componente, detectar tema del sistema y pre-seleccionar
- Cambio de tema es instantáneo (sin esperar a "Continuar")
- Al presionar "Continuar", persistir selección y navegar

### Pantalla: ProfilePage - Selector de Tema

**IMPORTANTE**: Ver [profile-preferences-section.md](profile-preferences-section.md) para el diseño completo de la sección **Preferencias** que incluye Idioma, Tema y Moneda juntos.

**Estructura**: Agregar nueva sección "Preferencias" después de "Main Menu" con 3 opciones:
1. Idioma (feature separada)
2. **Tema** (esta feature)
3. Moneda (feature separada)

**Opción de Tema en Preferencias**:

```tsx
{/* Tema */}
<button
  type="button"
  onClick={() => setShowThemeModal(true)}
  className="flex w-full items-center justify-between rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
>
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
      <Palette className="h-5 w-5 text-gray-500 dark:text-gray-400" />
    </div>
    <div className="text-left">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
        {t('profile.preferences.theme.label')}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {getCurrentThemeName()}
      </p>
    </div>
  </div>
  <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600" />
</button>
```

**Modal de Selección de Tema** (Bottom Sheet):

```tsx
{showThemeModal && (
  <div className="fixed inset-0 z-[70]">
    {/* Backdrop */}
    <button
      type="button"
      className="absolute inset-0 bg-black/50 dark:bg-black/70"
      onClick={() => setShowThemeModal(false)}
    />

    {/* Sheet */}
    <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl">
      {/* Drag handle */}
      <div className="flex justify-center py-3">
        <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
      </div>

      {/* Content */}
      <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <h3 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-gray-50">
          {t('profile.preferences.theme.modal.title')}
        </h3>

        <div className="space-y-2">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = currentTheme === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleThemeChange(option.value)}
                className={`flex w-full items-center gap-4 rounded-xl p-4 transition-all ${
                  isSelected
                    ? 'bg-[#18B7B0]/10 ring-2 ring-[#18B7B0]'
                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    isSelected ? 'bg-[#18B7B0]' : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${
                      isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                    }`}
                    strokeWidth={2.5}
                  />
                </div>

                <div className="flex-1 text-left">
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
                    {t(`onboarding.theme.${option.value}.title`)}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {t(`onboarding.theme.${option.value}.description`)}
                  </p>
                </div>

                {isSelected && (
                  <Check className="h-5 w-5 text-[#18B7B0]" strokeWidth={3} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  </div>
)}
```

**Textos Traducibles**:
```typescript
{
  "profile.preferences.theme.label": "Tema",
  "profile.preferences.theme.modal.title": "Selecciona tu tema",
  "profile.preferences.theme.changed": "Tema actualizado"
}
```

## Especificaciones Técnicas

### Stack Tecnológico

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS con `dark:` variants
- **Detección**: `window.matchMedia('(prefers-color-scheme: dark)')`
- **Persistencia**: localStorage (`app_theme`)
- **State**: Zustand (theme.store.ts) o Context API

### Estructura de Archivos

```
src/
├── features/
│   └── theme/
│       ├── components/
│       │   └── ThemeProvider.tsx      # Context provider
│       ├── hooks/
│       │   └── useTheme.ts            # Custom hook
│       └── utils/
│           ├── theme.constants.ts     # Constants
│           └── theme.utils.ts         # Helpers
├── state/
│   └── theme.store.ts                 # Zustand store (opcional)
└── App.tsx                            # Wrap con ThemeProvider
```

### Configuración de Tailwind

**tailwind.config.js**:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // CRITICAL: Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#18B7B0',
          50: '#E6F9F8',
          100: '#CCF3F1',
          200: '#99E7E3',
          300: '#66DBD5',
          400: '#33CFC7',
          500: '#18B7B0', // Main
          600: '#139289',
          700: '#0E6D67',
          800: '#094844',
          900: '#052322',
        },
      },
    },
  },
  plugins: [],
};
```

**CRITICAL**: Debe configurarse `darkMode: 'class'` para que funcionen las clases `dark:*`

### Theme Provider (Context API)

**src/features/theme/components/ThemeProvider.tsx**:
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'app_theme';

function getSystemTheme(): ResolvedTheme {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as Theme;
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (theme === 'system') {
      return getSystemTheme();
    }
    return theme;
  });

  // Update resolved theme when theme changes
  useEffect(() => {
    if (theme === 'system') {
      setResolvedTheme(getSystemTheme());
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  // Listen to system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove both classes first
    root.classList.remove('light', 'dark');

    // Add the resolved theme class
    root.classList.add(resolvedTheme);

    console.log('[Theme] Applied theme:', resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    console.log('[Theme] Theme changed to:', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### Custom Hook Simplificado

**src/features/theme/hooks/useTheme.ts** (re-export del provider):
```typescript
export { useTheme } from '../components/ThemeProvider';
export type { Theme, ResolvedTheme } from '../components/ThemeProvider';
```

### App Setup

**src/App.tsx**:
```tsx
import { ThemeProvider } from '@/features/theme/components/ThemeProvider';
import { BrowserRouter } from 'react-router-dom';
import Routes from './routes';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
```

### Prevención de Flicker

**index.html** (Inline script ANTES de cargar React):
```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SmartSpend</title>

    <!-- CRITICAL: Prevent theme flicker -->
    <script>
      (function() {
        const stored = localStorage.getItem('app_theme');
        const theme = stored || 'system';

        let resolvedTheme = theme;
        if (theme === 'system') {
          resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
        }

        document.documentElement.classList.add(resolvedTheme);
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Uso en Componentes

**Ejemplo: HomePage**:
```tsx
import { useTheme } from '@/features/theme/hooks/useTheme';

export default function HomePage() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <main className="pb-28 pt-4">
        <div className="px-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            Hola
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Gestiona tus finanzas
          </p>
        </div>

        {/* Balance Card */}
        <div className="mt-6 px-4">
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Balance Total
            </p>
            {/* ... rest of balance card ... */}
          </div>
        </div>
      </main>
    </div>
  );
}
```

**Ejemplo: Botones**:
```tsx
<button
  type="button"
  className="w-full rounded-2xl bg-emerald-500 dark:bg-emerald-600 py-4 text-base font-semibold text-white shadow-lg transition-all active:scale-[0.98]"
>
  Guardar Ingreso
</button>

<button
  type="button"
  className="w-full rounded-2xl bg-gray-900 dark:bg-gray-700 py-4 text-base font-semibold text-white shadow-lg transition-all active:scale-[0.98]"
>
  Guardar Gasto
</button>
```

**Ejemplo: BottomBar**:
```tsx
<nav className="fixed inset-x-0 -bottom-1 z-50 bg-white/99 dark:bg-gray-900/99 backdrop-blur-xl shadow-[0_-10px_30px_rgba(0,0,0,0.10)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.50)] border-t border-gray-200/70 dark:border-gray-800/70">
  {/* ... nav items ... */}
</nav>
```

**Ejemplo: Inputs**:
```tsx
<input
  type="text"
  className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 text-base text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#18B7B0]"
  placeholder="Descripción"
/>
```

### Integración con OnboardingContext

**Modificar: src/features/onboarding/OnboardingContext.tsx**:

```typescript
import { useTheme } from '@/features/theme/hooks/useTheme';

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { setTheme: applyTheme } = useTheme();

  // ... existing code ...

  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    setState((prev) => ({
      ...prev,
      selections: {
        ...prev.selections,
        theme,
      },
    }));

    // Aplicar el tema inmediatamente
    applyTheme(theme);

    console.log('[Onboarding] Theme selected:', theme);
  }, [applyTheme]);

  // ... rest of code ...
}
```

### Migracion de Componentes

**Patrón de Migración**:

1. Identificar todas las clases de color:
   - `bg-*`, `text-*`, `border-*`, `shadow-*`

2. Agregar variante `dark:` correspondiente:
   ```tsx
   // Antes
   <div className="bg-white text-gray-900">

   // Después
   <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50">
   ```

3. Verificar contraste suficiente (WCAG AA mínimo)

4. Probar visualmente en ambos temas

**Tabla de Conversión Rápida**:

| Light | Dark |
|-------|------|
| `bg-gray-50` | `dark:bg-gray-950` |
| `bg-gray-100` | `dark:bg-gray-800` |
| `bg-white` | `dark:bg-gray-900` |
| `text-gray-900` | `dark:text-gray-50` |
| `text-gray-600` | `dark:text-gray-300` |
| `text-gray-500` | `dark:text-gray-400` |
| `border-gray-200` | `dark:border-gray-700` |
| `border-gray-300` | `dark:border-gray-600` |
| `shadow-sm` | `dark:shadow-sm dark:shadow-black/30` |

## Testing

### Unit Tests

**ThemeProvider Tests**:
```typescript
import { render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/features/theme/components/ThemeProvider';

function TestComponent() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  it('defaults to system theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('system');
  });

  it('changes theme when setTheme is called', async () => {
    const { user } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await user.click(screen.getByText('Set Dark'));

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(localStorage.getItem('app_theme')).toBe('dark');
  });

  it('applies theme class to document', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('light') ||
           document.documentElement.classList.contains('dark')).toBe(true);
  });
});
```

**Hook Tests**:
```typescript
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/features/theme/components/ThemeProvider';

describe('useTheme', () => {
  it('returns current theme', () => {
    const wrapper = ({ children }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('system');
  });

  it('updates theme', () => {
    const wrapper = ({ children }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
  });
});
```

### Integration Tests

```typescript
describe('Theme change flow', () => {
  it('changes theme from onboarding and persists', async () => {
    render(
      <ThemeProvider>
        <OnboardingProvider>
          <Screen2_Theme />
        </OnboardingProvider>
      </ThemeProvider>
    );

    // Select dark theme
    const darkButton = screen.getByText('Oscuro');
    await userEvent.click(darkButton);

    // Verify document has dark class
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Continue to next screen
    const continueButton = screen.getByText('Continuar');
    await userEvent.click(continueButton);

    // Verify theme persisted
    expect(localStorage.getItem('app_theme')).toBe('dark');
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('User can change theme from onboarding', async ({ page }) => {
  await page.goto('/onboarding/config/2');

  // Verify default theme (system)
  const html = page.locator('html');
  await expect(html).toHaveClass(/light|dark/);

  // Click dark theme option
  await page.click('text=Oscuro');

  // Verify document has dark class
  await expect(html).toHaveClass(/dark/);

  // Continue
  await page.click('button:has-text("Continuar")');

  // Verify next screen is also in dark mode
  await expect(html).toHaveClass(/dark/);
});

test('Theme persists after page reload', async ({ page }) => {
  await page.goto('/onboarding/config/2');

  // Change to dark theme
  await page.click('text=Oscuro');
  await page.click('button:has-text("Continuar")');

  // Reload page
  await page.reload();

  // Verify still in dark mode
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('System theme updates automatically', async ({ page, context }) => {
  await page.goto('/onboarding/config/2');

  // Select system theme
  await page.click('text=Automático');

  // Emulate dark mode preference
  await page.emulateMedia({ colorScheme: 'dark' });

  // Verify dark theme applied
  await expect(page.locator('html')).toHaveClass(/dark/);

  // Emulate light mode preference
  await page.emulateMedia({ colorScheme: 'light' });

  // Verify light theme applied
  await expect(page.locator('html')).toHaveClass(/light/);
});
```

### Visual Regression Tests

```typescript
import { test, expect } from '@playwright/test';

test('HomePage looks correct in light mode', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  });

  await expect(page).toHaveScreenshot('home-light.png');
});

test('HomePage looks correct in dark mode', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });

  await expect(page).toHaveScreenshot('home-dark.png');
});
```

## Dependencias

**No se requieren nuevas librerías**. Todo se implementa con:
- Tailwind CSS (ya instalado)
- React Context API (built-in)
- localStorage (built-in)
- `window.matchMedia` (built-in)

**Opcional** (si se prefiere usar librería):
```json
{
  "dependencies": {
    "next-themes": "^0.2.1"
  }
}
```

Pero **NO es necesario**, la implementación con Context API es suficiente y más ligera.

## Criterios de Aceptación

### Feature Completa Cuando:

- [ ] Tailwind configurado con `darkMode: 'class'`
- [ ] ThemeProvider implementado y funcionando
- [ ] Hook `useTheme` disponible en toda la app
- [ ] Detección automática de tema del sistema funciona
- [ ] Script anti-flicker en index.html implementado
- [ ] Screen2_Theme actualizado y funcional
- [ ] Cambio de tema en onboarding es instantáneo
- [ ] ProfilePage tiene selector de tema funcional
- [ ] Cambio de tema desde ProfilePage es instantáneo
- [ ] Modo "system" detecta cambios del SO en tiempo real
- [ ] Preferencia de tema se persiste en localStorage
- [ ] Transición suave de 200ms al cambiar tema
- [ ] No hay flicker al cargar la app
- [ ] Todos los componentes migrados con clases `dark:*`
- [ ] Contraste adecuado en ambos temas (WCAG AA)
- [ ] Accent colors (#18B7B0) funcionan bien en ambos temas
- [ ] BottomBar se ve correctamente en ambos temas
- [ ] Modals y bottom sheets con backdrop correcto
- [ ] Inputs y forms legibles en ambos temas
- [ ] Cards y sombras apropiadas en dark mode
- [ ] Tests unitarios para ThemeProvider
- [ ] Tests E2E para cambio de tema
- [ ] Visual regression tests para componentes clave
- [ ] Documentación de convenciones de color
- [ ] Tema persiste después de cerrar y reabrir app

## Notas de Implementación

### Fase 1: Setup Básico (1 día)
- Configurar Tailwind con `darkMode: 'class'`
- Crear ThemeProvider component
- Crear useTheme hook
- Agregar script anti-flicker a index.html
- Wrap App con ThemeProvider

### Fase 2: Definir Paleta de Colores (1 día)
- Documentar paleta completa light/dark
- Crear guía de conversión de clases
- Definir excepciones y casos especiales
- Revisar contraste (WCAG)

### Fase 3: Actualizar Onboarding (1 día)
- Actualizar Screen2_Theme con useTheme
- Integrar con OnboardingContext
- Implementar cambio instantáneo
- Traducir textos (i18n)
- Eliminar nota temporal

### Fase 4: Migrar Componentes Core (4-5 días)
- HomePage
- AddEditTransactionPage
- CategoriesPage
- ProfilePage (+ agregar selector de tema)
- BudgetPage
- StatsPage
- ScheduledTransactionsPage
- BackupPage
- BottomBar
- PageHeader
- Modals y bottom sheets
- Forms y inputs

### Fase 5: Componentes Compartidos (2 días)
- DatePicker
- CategoryPickerDrawer
- AddActionSheet
- Toast/notifications
- Loading states
- Empty states

### Fase 6: Refinar Dark Mode (1-2 días)
- Ajustar sombras
- Pulir transiciones
- Revisar accesibilidad
- Ajustar accent colors si es necesario
- Verificar imágenes/íconos

### Fase 7: Testing (2-3 días)
- Unit tests para ThemeProvider
- Integration tests
- E2E tests con Playwright
- Visual regression tests

### Fase 8: Polish y Documentación (1 día)
- Verificar que no queden clases sin `dark:*`
- Revisar UX en ambos temas
- Documentar convenciones
- Crear guía de migración para futuros componentes
- Code review

**Tiempo Total Estimado**: 13-17 días de desarrollo

## Riesgos y Mitigaciones

### Riesgo: Flicker al Cargar App
**Mitigación**:
- Script inline en index.html (antes de React)
- Aplicar clase inmediatamente en `<html>`
- NO usar `useEffect` para primera carga

### Riesgo: Componentes Olvidados Sin dark:*
**Mitigación**:
- Checklist exhaustivo de componentes
- Visual testing en ambos temas
- Lint rule personalizada (opcional)
- Code review cuidadoso

### Riesgo: Contraste Insuficiente
**Mitigación**:
- Usar herramientas de verificación de contraste (WebAIM)
- Probar con usuarios reales
- Seguir WCAG 2.1 Level AA mínimo

### Riesgo: Performance al Cambiar Tema
**Mitigación**:
- Transición solo en propiedades de color (no layout)
- Usar GPU acceleration (`will-change` si es necesario)
- Evitar re-renders innecesarios

### Riesgo: Sombras Poco Visibles en Dark Mode
**Mitigación**:
- Usar sombras más fuertes: `dark:shadow-black/40`
- Combinar con borders sutiles: `dark:border-gray-800`
- Aumentar contraste entre elementos

## Extensibilidad Futura

### Más Opciones de Tema

**High Contrast Mode**:
```typescript
type Theme = 'light' | 'dark' | 'system' | 'high-contrast';
```

**AMOLED Black Mode** (para móviles OLED):
```css
.amoled {
  --bg-primary: #000000;
  --bg-secondary: #000000;
  --bg-card: #0a0a0a;
}
```

### Custom Theme Colors

Permitir al usuario personalizar el color primario (#18B7B0):
- Guardar en localStorage: `app_theme_color`
- Aplicar mediante CSS variables
- UI para selector de color en ProfilePage

### Sincronización Cloud (Futuro)

**Tabla Supabase**: `user_preferences`
```sql
ALTER TABLE user_preferences
ADD COLUMN theme VARCHAR(10) DEFAULT 'system';
```

**Flujo**:
- Al cambiar tema, sincronizar a Supabase
- Al login, cargar preferencia de cloud
- Prioridad: Cloud > LocalStorage > System detection

## Referencias

### Documentación Técnica
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [prefers-color-scheme MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [WCAG 2.1 Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

### Herramientas
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Stark Figma Plugin](https://www.getstark.co/) (verificar contraste)
- [Dark Mode Generator](https://colorffy.com/dark-theme-generator)

### Inspiración
- [Tailwind UI Dark Mode Examples](https://tailwindui.com/components/application-ui/application-shells/sidebar)
- [shadcn/ui Dark Mode](https://ui.shadcn.com/docs/dark-mode)

## Changelog

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2026-01-23 | 1.0.0 | Documento inicial |
