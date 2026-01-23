# Plan de Refactorización: First Interaction Flow

## 📋 Resumen Ejecutivo

Este documento describe el plan para refactorizar la pantalla de bienvenida actual (`WelcomeGate.tsx`) y reemplazarla con un flujo de primera interacción completo de 15 pantallas, organizado en 3 momentos clave.

**Objetivo**: Mejorar la experiencia de primer uso (FTUE - First Time User Experience) con un onboarding más informativo y una configuración inicial personalizada.

**Enfoque**: 100% Mobile-First - Esta app está siendo preparada para deployment en tiendas móviles (iOS/Android) vía Capacitor.

### ⚠️ Regla Crítica: One-Time Onboarding

**Welcome Onboarding y First Config son ONE-TIME ONLY:**

| Escenario | Welcome | Login | Config |
|-----------|---------|-------|--------|
| **Primera vez** | ✅ Se muestra | ✅ Se muestra | ✅ Se muestra |
| **Logout** | ❌ NO | ✅ Solo Login | ❌ NO |

El flujo completo (Welcome → Login → Config) solo se ve **una vez en la vida del usuario**. Después de logout, solo ven el **Login** y van directo a la app.

---

## 🎯 Estado Actual vs. Estado Deseado

### Estado Actual (WelcomeGate.tsx)

**Funcionalidad actual:**
- Pantalla única de bienvenida con logo y título
- Dos opciones principales:
  - Iniciar sesión con Google (OAuth)
  - Continuar como invitado (modo local)
- Lógica de persistencia: `localStorage` key `budget.welcomeSeen.v1`
- Auto-dismiss si el usuario ya tiene sesión activa
- Listener de auth state changes para detectar login exitoso

**Limitaciones:**
- No explica las funcionalidades de la app
- No presenta beneficios clave al usuario
- No hay configuración inicial personalizada
- Experiencia mínima de onboarding

### Estado Deseado (15 Pantallas)

**Nuevo flujo completo:**

1. **Welcome Onboarding** (6 pantallas) - Educación sobre la app
2. **Login Flow** (4 pantallas) - Opciones de autenticación
3. **First Config** (5 pantallas) - Configuración inicial personalizada

---

## 📱 Estructura de las 15 Pantallas

### Fase 1: Welcome Onboarding (6 pantallas)

Objetivo: Presentar las funcionalidades clave de SmartSpend

| # | Pantalla | Contenido Principal | Componentes Visuales |
|---|----------|---------------------|---------------------|
| 1 | Bienvenido a SmartSpend | Presentación inicial con logo y features principales | Logo animado, cards de "Funciona sin conexión" y "Datos en tu dispositivo" |
| 2 | Registro Instantáneo | Explicación de registro rápido y seguro | Ilustración de form con animaciones |
| 3 | Presupuestos Tranquilos | Gestión de presupuestos sin estrés | Cards de categorías de ejemplo |
| 4 | Análisis de Hábitos | Visualización de patrones de gasto | Gráficas y charts de ejemplo |
| 5 | Automatización de Movimientos | Transacciones recurrentes automáticas | Timeline de movimientos programados |
| 6 | Entiende tu Plata | Dashboard de insights financieros | Donut chart con métricas (promedio diario, categoría top, día pico) |

**Patrón común:**
- Navegación por dots indicadores (1-6)
- Botón "Empezar" o "Continuar" en cada pantalla
- Animaciones suaves entre pantallas
- **✅ Skip option**: Botón "Omitir" visible en TODAS las pantallas
  - Al hacer skip → Salta directamente a **Login Flow**
  - Permite al usuario avanzar rápidamente si no quiere ver la intro

---

### Fase 2: Login Flow (4 pantallas)

Objetivo: Ofrecer múltiples opciones de autenticación con énfasis en privacidad

| # | Pantalla | Contenido Principal | Opciones de Auth |
|---|----------|---------------------|------------------|
| 1 | Control Total y Acceso | Privacidad primero - datos locales | Explorar como invitado, Google, Apple, Usuario/Contraseña |
| 2 | Control Total y Acceso (Variant) | Énfasis en seguridad y cifrado E2E | Mismas opciones con diferentes highlights |
| 3 | Control Total y Acceso (Variant) | Énfasis en control del usuario | Mismas opciones con diferentes copy |
| 4 | Control Total y Acceso (Final) | Selección definitiva de método | Confirmación de método elegido |

**Nota:** Las 4 pantallas son variaciones del mismo concepto. Durante la implementación, evaluaremos si:
- Usamos solo 1 pantalla
- Implementamos A/B testing
- Usamos diferentes pantallas según el contexto (primera vez vs. returning user)

**⭐ IMPORTANTE - Esta pantalla se usa en DOS contextos:**
1. **Primera vez**: Como parte del flujo completo (Welcome → **Login** → Config)
2. **Logout**: Como pantalla standalone (solo **Login** → App)

**Referencia de diseño:** `docs/roadmap/first interaction pages/2 loginFlow/control_total_y_acceso_1/screen.png`

**Patrón común:**
- Progress indicators (2 dots)
- Íconos de escudo/lock para representar seguridad
- Botones grandes y accesibles
- Mensajes de privacidad y términos al final
- **❌ NO SKIPPEABLE**: El usuario DEBE elegir un método de autenticación
  - Guest mode siempre disponible (no requiere conexión)
  - Google OAuth (requiere conexión)
  - Esta fase es obligatoria para continuar

---

### Fase 3: First Config (5 pantallas)

Objetivo: Personalizar la experiencia inicial del usuario

| # | Pantalla | Configuración | Opciones | Estado Actual |
|---|----------|---------------|----------|---------------|
| 1 | Bienvenido (Config Intro) | Introducción a la configuración | N/A - solo bienvenida | ✅ Ready |
| 2 | Bienvenido (Variant) | Segunda variación | N/A | ✅ Ready |
| 3 | Bienvenido (Variant) | Tercera variación | N/A | ✅ Ready |
| 4 | Bienvenido (Variant) | Cuarta variación | N/A | ✅ Ready |
| 5 | Idioma | Selección de idioma | 🇪🇸 Español, 🇺🇸 English, 🇧🇷 Português, 🇫🇷 Français | ⚠️ Feature pending (i18n) |

**Pantallas adicionales futuras (no implementadas inicialmente):**
- **Tema**: Claro / Oscuro (feature pending - dark mode)
- **Moneda**: COP, USD, EUR, etc. (feature pending - multi-currency)
- **Notificaciones**: Permisos de notificaciones push (feature pending)
- **Categorías Iniciales**: Selección de categorías default (puede usar las actuales)

**Estrategia:**
- Implementar pantallas 1-4 (bienvenida/intro)
- Pantalla 5 (idioma): UI ready, funcionalidad cuando tengamos i18n
- Skip configuraciones pendientes y marcar para implementación futura

**Patrón común:**
- Progress indicators (4 dots)
- Card-based selections
- Botón "Continuar" persistente
- Botón "Atrás" opcional
- **✅ Skip option**: Botón "Omitir configuración" visible en TODAS las pantallas
  - Al hacer skip → Completa onboarding y entra a la app
  - Configuración puede hacerse después desde Settings

---

## 🔀 Flujo de Navegación y Skip Logic

### 🔑 Regla Crítica: Primera Vez vs. Logout

**⭐ IMPORTANTE:**

| Escenario | Flujo | Welcome Onboarding | Login Flow | First Config |
|-----------|-------|-------------------|-----------|--------------|
| **Primera Vez** | Completo | ✅ Se muestra | ✅ Se muestra | ✅ Se muestra |
| **Logout (Usuario Returning)** | Solo Login | ❌ NO se muestra | ✅ Se muestra | ❌ NO se muestra |

**Explicación:**
- **Primera vez**: Usuario nuevo ve todo (Welcome → Login → Config)
- **Logout**: Usuario ya conoce la app, solo necesita login de nuevo
- **Key**: Welcome Onboarding y First Config son **ONE-TIME ONLY**

### Reglas de Skip por Fase

| Fase | Skip Permitido | Destino al Skip | Botón | Visible en Logout |
|------|----------------|-----------------|-------|------------------|
| **Welcome Onboarding** (1-6) | ✅ Sí | → Login Flow | "Omitir" (top-right) | ❌ No |
| **Login Flow** | ❌ No | N/A | N/A - Obligatorio | ✅ Sí |
| **First Config** (1-5) | ✅ Sí | → App Home | "Omitir configuración" (bottom) | ❌ No |

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                         APP START                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │ Check Onboarding│
                    │   Ever Done?    │
                    └───────┬─────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
            YES │                       │ NO (FIRST TIME)
                │                       │
                │               ┌───────▼─────────┐
                │               │  PHASE 1:       │
                │               │  WELCOME        │◄─┐
                │               │  ONBOARDING     │  │
                │               │  (Screens 1-6)  │  │
                │               └────┬────────┬───┘  │
                │                    │      SKIP     │
                │               NEXT │        │      │
                │                    └────┬───┘      │
                │                         │          │
        ┌───────▼────────┐        ┌───────▼──────┐  │
        │   Check Auth   │        │  PHASE 2:    │◄─┘
        │    Session?    │        │  LOGIN FLOW  │
        └───────┬────────┘        │  (Required)  │
                │                 └───────┬───────┘
        ┌───────┴────────┐               │
        │                │               │ Auth Selected
    YES │            NO  │               │ (Guest/Google)
        │     (LOGOUT)   │               │
  ┌─────▼─────┐  ┌───────▼───────┐      │
  │  APP HOME │  │  PHASE 2:     │      │
  │           │  │  LOGIN FLOW   │◄─────┘
  └───────────┘  │  (Direct)     │
                 └───────┬───────┘
                         │
                         │ Auth Success
                         │
                         │
                 ┌───────▼─────────┐
                 │  Is First Time? │
                 └───────┬─────────┘
                         │
               ┌─────────┴──────────┐
               │                    │
           YES │                NO  │
               │              (LOGOUT)
               │                    │
        ┌──────▼─────────┐    ┌─────▼──────┐
        │  PHASE 3:      │    │  APP HOME  │
        │  FIRST CONFIG  │◄─┐ │            │
        │  (Screens 1-5) │  │ └────────────┘
        └────┬───────┬───┘  │
             │     SKIP     │
        DONE │       │      │
             └───┬───┘      │
                 │          │
           ┌─────▼──────┐   │
           │  APP HOME  │   │
           │            │   │
           └────────────┘   │
                            │
                         BACK
                       (optional)
```

**Leyenda:**
- **First Time Path** (GRIS): Welcome → Login → Config → App
- **Logout Path** (AZUL): Login → App (directo, sin welcome ni config)
- **Skip Paths** (ROJO): Shortcuts disponibles en first time

### Implementación de Skip

**Welcome Onboarding Skip:**

```typescript
function handleSkipWelcome() {
  // Guardar que se skipeó
  updateOnboardingProgress({
    phase: 'login',
    step: 0,
    welcomeSkipped: true,
  });

  // Navegar a Login Flow
  navigateToPhase('login');
}
```

**Login Flow - NO Skip:**

```typescript
// NO skip button en esta fase
// Usuario debe elegir: Guest o Google (o Apple/Email en futuro)
function handleAuthSelection(method: 'guest' | 'google') {
  setAuthMethod(method);

  // Check si es primera vez o logout
  const isFirstTime = !localStorage.getItem(ONBOARDING_KEYS.COMPLETED);

  if (method === 'guest') {
    // Marcar guest mode
    if (isFirstTime) {
      // Primera vez: continuar a config
      navigateToPhase('config');
    } else {
      // Logout: marcar completado y ir directo a app
      markOnboardingComplete();
      navigateToApp();
    }
  } else {
    // Iniciar OAuth flow
    signInWithGoogle().then(() => {
      if (isFirstTime) {
        // Primera vez: continuar a config
        navigateToPhase('config');
      } else {
        // Logout: marcar completado y ir directo a app
        markOnboardingComplete();
        navigateToApp();
      }
    });
  }
}
```

**First Config Skip:**

```typescript
function handleSkipConfig() {
  // Marcar onboarding como completado con configuración skipeada
  markOnboardingComplete({
    configSkipped: true,
    selections: {}, // Sin selecciones
  });

  // Entrar a la app
  navigateToApp();
}
```

### Botones de Skip - UI Specs

**Welcome Onboarding Skip Button:**
```tsx
<button
  type="button"
  onClick={handleSkipWelcome}
  className="absolute top-4 right-4 px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
>
  Omitir
</button>
```

**First Config Skip Button:**
```tsx
<button
  type="button"
  onClick={handleSkipConfig}
  className="w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
>
  Omitir configuración
</button>
```

**Posicionamiento:**
- Welcome skip: Top-right (absolute positioning)
- Config skip: Bottom, debajo del botón "Continuar"
- Login: NO skip button

---

## 🔓 Logout Flow

### Implementación de Logout

**Cuando el usuario hace logout:**

```typescript
async function handleLogout() {
  // 1. Cerrar sesión de Supabase
  await supabase.auth.signOut();

  // 2. Limpiar estado de autenticación
  useBudgetStore.setState({
    // Mantener datos locales
    // Solo limpiar info de usuario autenticado
  });

  // 3. NO limpiar flag de onboarding completado
  // const onboardingCompleted = localStorage.getItem(ONBOARDING_KEYS.COMPLETED);
  // ❌ NO borrar este flag

  // 4. Navegar a Login (directo, sin welcome)
  navigate('/onboarding/login');

  console.log('[Auth] User logged out, redirecting to login');
}
```

**Lógica en LoginFlow component:**

```typescript
function LoginFlow() {
  // Detectar si es primera vez o logout
  const isFirstTime = localStorage.getItem(ONBOARDING_KEYS.COMPLETED) !== 'true';

  const handleAuthSuccess = () => {
    if (isFirstTime) {
      // Primera vez: ir a config
      navigate('/onboarding/config');
    } else {
      // Logout/returning: ir directo a app
      markOnboardingComplete(); // Actualizar timestamp
      navigate('/home');
    }
  };

  return (
    <div>
      {/* Login UI - igual para ambos contextos */}
      <h1>Tus finanzas, bajo tu control total</h1>

      {/* Auth buttons */}
      <button onClick={() => handleGuestLogin()}>
        Explorar como invitado
      </button>
      <button onClick={() => handleGoogleLogin()}>
        Continuar con Google
      </button>
    </div>
  );
}
```

### Persistencia de Datos en Logout

**Importante:** Al hacer logout, NO borrar:
- ✅ Datos de transacciones (localStorage)
- ✅ Categorías y configuración
- ✅ Flag `ONBOARDING_KEYS.COMPLETED`
- ✅ Preferencias del usuario

**Solo limpiar:**
- ❌ Token de sesión (Supabase)
- ❌ Info de usuario autenticado (email, avatar, etc.)

```typescript
// ✅ CORRECTO - Logout sin borrar datos
function handleLogout() {
  supabase.auth.signOut();
  // Datos locales se mantienen
  navigate('/onboarding/login');
}

// ❌ INCORRECTO - No hacer esto
function handleLogoutWrong() {
  supabase.auth.signOut();
  localStorage.clear(); // ❌ Esto borra TODO, incluyendo datos
  navigate('/onboarding/login');
}
```

### Testing de Logout Flow

**Test Cases:**

1. **Logout básico:**
   ```
   Login → App (uso normal) → Logout → Login screen (directo) ✅
   ```

2. **Logout con datos:**
   ```
   - Usuario tiene transacciones guardadas
   - Hace logout
   - Login de nuevo
   - Transacciones siguen ahí ✅
   ```

3. **Logout y cambio de cuenta:**
   ```
   - Usuario A logueado (Google)
   - Logout
   - Login como Usuario B (Google)
   - Datos de A se mantienen locales
   - Datos de B se sincronizan si tiene cloud ✅
   ```

4. **Logout después de primera vez:**
   ```
   - Primera vez: Welcome → Login → Config → App
   - Logout
   - Login de nuevo: Solo Login → App (sin Welcome/Config) ✅
   ```

---

## 📱 Consideraciones Mobile-First y Capacitor

### Mobile-First Design Principles

**Prioridad 1: Touch-Optimized**

- **Touch Targets**: Mínimo 44x44px (recomendado 48x48px)
- **Botones grandes**: `py-4` para botones principales
- **Spacing amplio**: Evitar botones pegados, mínimo `gap-3`
- **Gestures**: Considerar swipe left/right para navegación (opcional)

**Prioridad 2: Performance**

- **Animaciones 60fps**: Solo `transform` y `opacity`
- **Lazy loading**: Cargar pantallas on-demand
- **Image optimization**: SVG para ilustraciones, WebP para photos
- **Bundle size**: Mantener <500KB por chunk

**Prioridad 3: Native Feel**

- **Bouncy animations**: `transition-all duration-300`
- **Active states**: `active:scale-[0.98]` en botones
- **No delays**: Feedback inmediato en interacciones
- **Native scrolling**: `-webkit-overflow-scrolling: touch`

### Capacitor Integration

**Safe Area Insets (iOS Notch/Home Indicator)**

```css
/* Top safe area - para evitar el notch */
.onboarding-header {
  padding-top: env(safe-area-inset-top);
  padding-top: max(env(safe-area-inset-top), 16px);
}

/* Bottom safe area - para evitar el home indicator */
.onboarding-footer {
  padding-bottom: env(safe-area-inset-bottom);
  padding-bottom: max(env(safe-area-inset-bottom), 16px);
}

/* Full screen mode */
.onboarding-screen {
  min-height: 100dvh; /* dvh = dynamic viewport height */
}
```

**Status Bar Configuration**

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // ...
  plugins: {
    StatusBar: {
      style: 'light', // 'light' or 'dark'
      backgroundColor: '#18B7B0', // Match primary color
    },
    SplashScreen: {
      launchShowDuration: 0, // Disable native splash
      backgroundColor: '#F9FAFB', // Match bg-gray-50
    },
  },
};
```

**Splash Screen → Onboarding Transition**

```typescript
import { SplashScreen } from '@capacitor/splash-screen';

useEffect(() => {
  // Hide native splash when onboarding is ready
  SplashScreen.hide();
}, []);
```

**Keyboard Handling (Forms en Config)**

```typescript
import { Keyboard } from '@capacitor/keyboard';

useEffect(() => {
  // Listener para cuando el teclado aparece
  Keyboard.addListener('keyboardWillShow', (info) => {
    // Ajustar padding del contenido
    document.querySelector('.config-form')?.style.paddingBottom =
      `${info.keyboardHeight}px`;
  });

  Keyboard.addListener('keyboardWillHide', () => {
    document.querySelector('.config-form')?.style.paddingBottom = '0px';
  });

  return () => {
    Keyboard.removeAllListeners();
  };
}, []);
```

**Network Status (Para Login Flow)**

```typescript
import { Network } from '@capacitor/network';

const [isOnline, setIsOnline] = useState(true);

useEffect(() => {
  Network.addListener('networkStatusChange', (status) => {
    setIsOnline(status.connected);
  });

  // Check initial status
  Network.getStatus().then((status) => {
    setIsOnline(status.connected);
  });
}, []);

// En el login screen
{!isOnline && (
  <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
    <WifiOff size={16} className="inline mr-2" />
    Sin conexión. Puedes continuar como invitado.
  </div>
)}
```

**Haptic Feedback (Touch Response)**

```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

function handleButtonPress() {
  // Light haptic para feedback
  Haptics.impact({ style: ImpactStyle.Light });

  // ... rest of logic
}

function handleError() {
  // Vibration pattern para error
  Haptics.notification({ type: 'ERROR' });
}
```

**App State (Background/Foreground)**

```typescript
import { App } from '@capacitor/app';

useEffect(() => {
  // Guardar progreso cuando la app va a background
  App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) {
      // Save onboarding progress
      persistOnboardingState();
    }
  });
}, []);
```

### Testing en Dispositivos

**Dispositivos Target:**

- **iOS**: iPhone 12/13/14 (mínimo iOS 14)
- **Android**: Pixel 5/6, Samsung Galaxy (mínimo Android 10)
- **Screen sizes**: 375px - 428px width (common mobile sizes)

**Test Cases Mobile:**

1. ✅ Safe area insets correctos (notch, home indicator)
2. ✅ Orientación portrait (bloquear landscape)
3. ✅ Teclado no tapa inputs
4. ✅ Scroll suave y nativo
5. ✅ Botones con área touch adecuada
6. ✅ Animaciones smooth (60fps)
7. ✅ Network offline handling
8. ✅ Background/foreground transitions
9. ✅ Permisos nativos (si aplica)
10. ✅ Deep links (si aplica)

**Capacitor Plugins Necesarios:**

```json
{
  "dependencies": {
    "@capacitor/core": "^5.0.0",
    "@capacitor/ios": "^5.0.0",
    "@capacitor/android": "^5.0.0",
    "@capacitor/app": "^5.0.0",           // App state
    "@capacitor/splash-screen": "^5.0.0", // Splash control
    "@capacitor/status-bar": "^5.0.0",    // Status bar styling
    "@capacitor/keyboard": "^5.0.0",      // Keyboard handling
    "@capacitor/network": "^5.0.0",       // Network status
    "@capacitor/haptics": "^5.0.0",       // Haptic feedback
  }
}
```

### Orientation Lock

```typescript
import { ScreenOrientation } from '@capacitor/screen-orientation';

useEffect(() => {
  // Lock to portrait mode during onboarding
  ScreenOrientation.lock({ orientation: 'portrait' });

  return () => {
    // Unlock when leaving onboarding
    ScreenOrientation.unlock();
  };
}, []);
```

---

## 🏗️ Arquitectura Propuesta

### Estructura de Componentes

```
src/
├── features/
│   └── onboarding/
│       ├── OnboardingFlow.tsx          // Router principal del flujo
│       ├── OnboardingContext.tsx       // Context para estado compartido
│       │
│       ├── phases/
│       │   ├── WelcomeOnboarding/
│       │   │   ├── WelcomeOnboardingFlow.tsx
│       │   │   ├── screens/
│       │   │   │   ├── Screen1_Welcome.tsx
│       │   │   │   ├── Screen2_QuickRegister.tsx
│       │   │   │   ├── Screen3_BudgetsCalm.tsx
│       │   │   │   ├── Screen4_HabitsAnalysis.tsx
│       │   │   │   ├── Screen5_AutomatedMovements.tsx
│       │   │   │   └── Screen6_UnderstandMoney.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── LoginFlow/
│       │   │   ├── LoginFlow.tsx
│       │   │   ├── screens/
│       │   │   │   └── ControlAndAccess.tsx  // Consolidado (1 pantalla)
│       │   │   └── index.ts
│       │   │
│       │   └── FirstConfig/
│       │       ├── FirstConfigFlow.tsx
│       │       ├── screens/
│       │       │   ├── ConfigIntro.tsx        // Consolidado (pantallas 1-4)
│       │       │   └── LanguageSelect.tsx     // Pantalla 5
│       │       └── index.ts
│       │
│       ├── components/
│       │   ├── OnboardingLayout.tsx      // Layout wrapper común
│       │   ├── ProgressDots.tsx          // Indicadores de progreso
│       │   ├── FeatureCard.tsx           // Cards de features
│       │   ├── AuthButton.tsx            // Botones de autenticación
│       │   ├── ConfigOption.tsx          // Opciones de configuración
│       │   └── SlideAnimation.tsx        // Transiciones entre pantallas
│       │
│       ├── hooks/
│       │   ├── useOnboardingProgress.ts  // Hook para tracking de progreso
│       │   └── useOnboardingPersistence.ts // Hook para persistencia
│       │
│       └── utils/
│           ├── onboarding.constants.ts   // Constantes del flujo
│           └── onboarding.types.ts       // Types compartidos
│
└── shared/
    └── components/
        └── providers/
            └── WelcomeGate.tsx           // ⚠️ DEPRECAR - Reemplazar con OnboardingFlow
```

### Sistema de Navegación

**Opción 1: State Machine (Recomendado)**

```typescript
type OnboardingPhase = 'welcome' | 'login' | 'config' | 'complete';
type OnboardingStep = number;

interface OnboardingState {
  phase: OnboardingPhase;
  step: OnboardingStep;
  completed: boolean; // TRUE = ya se hizo alguna vez (no volver a mostrar welcome/config)

  // Context flags
  isFirstTime: boolean; // TRUE = nunca completó onboarding, FALSE = logout
  isReturningUser: boolean; // TRUE = ya completó onboarding antes, ahora logout

  // Skip tracking por fase (solo aplica en primera vez)
  welcomeSkipped: boolean;  // Welcome → Login
  configSkipped: boolean;   // Config → App
  // Login NO es skippeable

  selections: {
    authMethod?: 'guest' | 'google' | 'apple' | 'email';
    language?: string;
    theme?: 'light' | 'dark';
    // ... otros
  };

  // Timestamps
  firstCompletedAt?: number; // Cuando se completó por PRIMERA vez
  lastLoginAt?: number;      // Último login (para logout tracking)
}
```

**Opción 2: React Router (Alternativa)**

```typescript
// Routes
/onboarding/welcome/:step      // 1-6
/onboarding/login              // Consolidado
/onboarding/config/:step       // 1-2 (intro + language)
/onboarding/complete           // Redirect to app
```

**Recomendación:** State Machine para mejor control y sincronización

---

### Persistencia y Estado

**LocalStorage Keys:**

```typescript
const ONBOARDING_KEYS = {
  COMPLETED: 'budget.onboarding.completed.v2',      // Boolean - onboarding completado
  PROGRESS: 'budget.onboarding.progress.v2',        // JSON - progreso actual
  SELECTIONS: 'budget.onboarding.selections.v2',    // JSON - selecciones del usuario
  TIMESTAMP: 'budget.onboarding.timestamp.v2',      // Number - cuándo se completó
}

// ⚠️ Deprecar: 'budget.welcomeSeen.v1'
```

**Zustand Store Integration:**

```typescript
// Agregar a budget.store.ts
interface BudgetState {
  // ... existing state
  onboarding: {
    completed: boolean;
    progress: OnboardingProgress | null;
    selections: OnboardingSelections;
  };
  setOnboardingCompleted: (completed: boolean) => void;
  updateOnboardingProgress: (progress: OnboardingProgress) => void;
  resetOnboarding: () => void; // Para testing/debugging
}
```

---

### Lógica de Display

**Decisión de qué mostrar al iniciar la app:**

```typescript
async function determineStartScreen(): Promise<'app' | 'onboarding' | 'login'> {
  // 1. Check si el onboarding ya se completó alguna vez
  const onboardingEverCompleted = localStorage.getItem(ONBOARDING_KEYS.COMPLETED) === 'true';

  // 2. Check si hay sesión activa
  const { data } = await supabase.auth.getSession();
  const hasActiveSession = !!data.session;

  // CASO 1: Usuario con sesión activa → APP
  if (hasActiveSession) {
    // Si tiene sesión pero nunca hizo onboarding, marcarlo como completado
    // (esto cubre casos edge como deep links o sesiones previas)
    if (!onboardingEverCompleted) {
      markOnboardingComplete();
    }
    return 'app';
  }

  // CASO 2: Primera vez (nunca completó onboarding) → ONBOARDING COMPLETO
  if (!onboardingEverCompleted) {
    // Check legacy welcome para migración
    const legacyWelcomeSeen = localStorage.getItem('budget.welcomeSeen.v1');
    if (legacyWelcomeSeen === '1') {
      // Usuario legacy: migrar y enviar directo a app (ya tiene datos)
      markOnboardingComplete();
      return 'app';
    }

    return 'onboarding'; // Welcome → Login → Config
  }

  // CASO 3: Logout (ya completó onboarding antes) → LOGIN DIRECTO
  // Usuario returning que se deslogueó, solo mostrar login
  return 'login';
}

// Uso en el router principal
const startScreen = await determineStartScreen();

switch (startScreen) {
  case 'app':
    navigate('/home');
    break;
  case 'onboarding':
    navigate('/onboarding/welcome/1'); // Empieza desde welcome
    break;
  case 'login':
    navigate('/onboarding/login'); // Directo a login, sin welcome ni config
    break;
}
```

**Implementación de markOnboardingComplete:**

```typescript
function markOnboardingComplete() {
  localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
  localStorage.setItem(ONBOARDING_KEYS.TIMESTAMP, Date.now().toString());

  // Update Zustand store
  useBudgetStore.setState({
    onboarding: {
      completed: true,
      progress: null,
      selections: {},
    }
  });

  console.log('[Onboarding] Marked as completed');
}
```

**Migración de usuarios existentes:**

```typescript
function migrateFromLegacyWelcome() {
  const legacySeen = localStorage.getItem('budget.welcomeSeen.v1');
  if (legacySeen === '1') {
    // Usuario ya pasó por el welcome anterior
    localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
    localStorage.setItem(ONBOARDING_KEYS.TIMESTAMP, Date.now().toString());

    // Eliminar key legacy
    localStorage.removeItem('budget.welcomeSeen.v1');

    console.log('[Onboarding] Migrated from legacy welcome');
  }
}
```

---

## 🎨 Consideraciones de Diseño

### Adaptación a Design Guidelines

**Cambios necesarios respecto a los HTMLs de referencia:**

1. **Material Icons → Lucide React**
   - Reemplazar `material-icons-round` con componentes de `lucide-react`
   - Mapeo de iconos comunes:
     - `account_balance_wallet` → `Wallet`
     - `trending_up` → `TrendingUp`
     - `security` → `Shield` / `Lock`
     - `wifi_off` → `WifiOff`
     - `lock_person` → `UserLock`
     - `check_circle` → `CheckCircle`
     - `arrow_forward` → `ArrowRight` / `ChevronRight`

2. **Tailwind Config**
   - Usar colores de CLAUDE.md:
     - Primary: `#18B7B0` (ya coincide ✅)
     - Background: `bg-gray-50` (no `bg-background-light`)
     - Cards: `bg-white` con `shadow-sm`
   - Border radius:
     - Large buttons: `rounded-2xl`
     - Cards: `rounded-xl`
     - Modals: `rounded-2xl`

3. **Typography**
   - Font family: `Inter` (mantener)
   - Headings: `text-3xl font-bold` → `text-2xl font-bold` (ajustar según CLAUDE.md)
   - Body text: `text-base text-gray-600`

4. **Buttons**
   - Primary button: `bg-emerald-500 hover:bg-emerald-600` (para acciones principales)
   - Secondary: `bg-gray-100 text-gray-700`
   - Auth buttons: seguir patrón de WelcomeGate actual

5. **Animaciones**
   - Mantener animaciones suaves (fade-in, slide)
   - Usar `transition-all duration-300` para transiciones
   - Active states: `active:scale-[0.98]`

6. **Dark Mode**
   - Implementar solo UI (la funcionalidad vendrá después)
   - Clases: `dark:bg-gray-900`, `dark:text-white`, etc.

7. **Safe Area Insets**
   - Bottom padding: `pb-[calc(env(safe-area-inset-bottom)+16px)]`
   - Top padding: `pt-[calc(env(safe-area-inset-top)+16px)]` donde aplique

---

### Componentes Reutilizables

**ProgressDots Component:**

```typescript
interface ProgressDotsProps {
  total: number;
  current: number;
  variant?: 'default' | 'bar'; // dots o barra
}

// Ejemplo: <ProgressDots total={6} current={3} />
```

**FeatureCard Component:**

```typescript
interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  iconBgColor?: string;
  iconColor?: string;
}

// Ejemplo: <FeatureCard icon={WifiOff} title="Funciona sin conexión" />
```

**AuthButton Component:**

```typescript
interface AuthButtonProps {
  provider: 'google' | 'apple' | 'email' | 'guest';
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}
```

---

## 📝 Plan de Implementación

### Fase de Implementación 1: Setup y Estructura Base (Día 1-2)

**Tareas:**

1. ✅ Crear estructura de carpetas en `src/features/onboarding/`
2. ✅ Crear types y constantes base
3. ✅ Crear OnboardingContext con state management
4. ✅ Crear OnboardingFlow router principal
5. ✅ Crear componentes base reutilizables:
   - OnboardingLayout
   - ProgressDots
   - FeatureCard
   - AuthButton
6. ✅ Crear hooks: useOnboardingProgress, useOnboardingPersistence
7. ✅ Setup migración de legacy welcome

**Entregables:**
- Estructura de carpetas completa
- Componentes base funcionando
- Context y hooks listos para uso
- Sistema de migración implementado

---

### Fase de Implementación 2: Welcome Onboarding (Día 3-5)

**Tareas:**

1. ✅ Implementar Screen1_Welcome con animaciones
2. ✅ Implementar Screen2_QuickRegister
3. ✅ Implementar Screen3_BudgetsCalm
4. ✅ Implementar Screen4_HabitsAnalysis
5. ✅ Implementar Screen5_AutomatedMovements
6. ✅ Implementar Screen6_UnderstandMoney con donut chart
7. ✅ Conectar navegación entre pantallas
8. ✅ Implementar botón "Omitir" en todas las pantallas (skip → Login Flow)
9. ✅ Implementar transiciones/animaciones
10. ✅ Testing de navegación, skip, y persistencia

**Componentes visuales necesarios:**
- DonutChart (para Screen6)
- CategoryCard (para Screen3)
- MetricCard (para Screen6)
- TimelineItem (para Screen5)

**Decisiones de diseño:**
- ✅ **Skip functionality definido**:
  - Welcome Onboarding: Skip en TODAS las pantallas → va a Login
  - Login Flow: NO skip (obligatorio)
  - First Config: Skip en TODAS las pantallas → va a App
- ¿Swipe para navegar? → **Opcional, implementar si hay tiempo**
- ¿Animaciones entre pantallas? → **Sí, slide left/right**

**Entregables:**
- 6 pantallas de onboarding funcionando
- Navegación fluida con animaciones
- Skip functionality
- Progress tracking

---

### Fase de Implementación 3: Login Flow (Día 6-7)

**Tareas:**

1. ✅ Consolidar diseño de login (decidir entre las 4 variantes)
2. ✅ Implementar ControlAndAccess.tsx
3. ✅ Integrar autenticación con Supabase:
   - Google OAuth (ya existe)
   - Apple OAuth (nuevo - requires Apple Developer account)
   - Email/Password (nuevo - requires setup)
   - Guest mode (ya existe)
4. ✅ Implementar loading states y error handling
5. ✅ **Verificar que NO haya skip button** (fase obligatoria)
6. ✅ Conectar con OnboardingContext
7. ✅ Testing de flujos de auth

**Decisiones técnicas:**

**Auth Providers a implementar inicialmente:**
- ✅ Google OAuth (ya funciona)
- ✅ Guest mode (ya funciona)
- ⏸️ Apple OAuth (pendiente - requires Apple Developer setup)
- ⏸️ Email/Password (pendiente - evaluar necesidad)

**Estrategia:**
- Mantener los dos métodos que ya funcionan (Google + Guest)
- Mostrar opciones de Apple y Email pero con estado "Coming soon" o disabled
- Implementar Apple/Email en futuras iteraciones cuando tengamos los requisitos

**UI de botones:**
- Botones principales: Google, Guest (enabled)
- Botones secundarios: Apple, Email (disabled con tooltip "Próximamente")

**Entregables:**
- Pantalla de login consolidada
- Auth con Google y Guest funcionando
- Error handling robusto
- **Lógica dual:** Login funciona en contexto de primera vez Y en contexto de logout
- Integración con OnboardingFlow

---

### Fase de Implementación 4: First Config (Día 8-9)

**Tareas:**

1. ✅ Consolidar pantallas de bienvenida config (1-4) en una sola
2. ✅ Implementar ConfigIntro.tsx
3. ✅ Implementar LanguageSelect.tsx (UI only)
4. ✅ Placeholder para features pendientes:
   - Dark mode toggle (UI ready, no functional)
   - Currency selector (UI ready, no functional)
5. ✅ Guardar selecciones en context y localStorage
6. ✅ Implementar botón "Omitir configuración" en todas las pantallas (skip → App)
7. ✅ Testing del flujo completo end-to-end

**Features por implementar (futuro):**
- i18n para idiomas
- Dark mode theme
- Multi-currency support
- Notification permissions

**Estrategia para features pendientes:**
- Crear UI completa pero con funcionalidad mock
- Agregar TODOs en código para futuras implementaciones
- Documentar en roadmap técnico

**Entregables:**
- Pantallas de configuración funcionando
- Selecciones guardadas correctamente
- Skip option implementado
- Flujo completo end-to-end

---

### Fase de Implementación 5: Integración y Testing (Día 10)

**Tareas:**

1. ✅ Reemplazar `WelcomeGate.tsx` con nuevo `OnboardingFlow`
2. ✅ Implementar lógica de decisión de display
3. ✅ Testing end-to-end del flujo completo:
   - Primera vez usuario (Welcome → Login → Config → App)
   - Skip onboarding (Welcome skip, Config skip)
   - Completar onboarding
   - **Logout flow** (solo Login → App, sin Welcome/Config)
   - Migración de legacy welcome
4. ✅ Testing de edge cases:
   - Usuario ya logueado
   - Interrupción del flujo (cerrar app)
   - Volver atrás en el flujo
   - Network offline durante auth
5. ✅ Performance testing:
   - Lazy loading de pantallas
   - Optimización de animaciones
   - Bundle size
6. ✅ Accessibility testing:
   - Navegación por teclado
   - Screen reader support
   - Focus management

**Checklist de testing:**

**Flow Testing:**
- [ ] **Primera vez (first-time user):**
  - [ ] Se muestra Welcome Onboarding completo
  - [ ] Se muestra Login Flow
  - [ ] Se muestra First Config
  - [ ] Se marca onboarding como completado
- [ ] **Logout (returning user):**
  - [ ] NO se muestra Welcome Onboarding
  - [ ] Se muestra SOLO Login Flow
  - [ ] NO se muestra First Config
  - [ ] Después de login va directo a app
- [ ] **Sesión activa:**
  - [ ] Auto-skip directo a app
  - [ ] NO muestra ninguna pantalla de onboarding

**Skip Functionality (solo primera vez):**
- [ ] Skip desde Welcome → va a Login Flow
- [ ] NO hay skip en Login Flow (verificar)
- [ ] Skip desde Config → va a App

**Persistence:**
- [ ] ¿Se persiste el progreso correctamente?
- [ ] ¿Se persiste flag "completed" correctamente?
- [ ] ¿Migra usuarios legacy correctamente?

**Auth:**
- [ ] ¿Funciona Google auth en primera vez?
- [ ] ¿Funciona Google auth en logout?
- [ ] ¿Funciona guest mode en primera vez?
- [ ] ¿Funciona guest mode en logout?
- [ ] ¿Se guardan las selecciones de config (solo primera vez)?

**UI/UX:**
- [ ] ¿Las animaciones son smooth (60fps)?
- [ ] **Mobile testing:**
  - [ ] Safe area insets correctos (iOS notch)
  - [ ] Touch targets >44px
  - [ ] Scroll nativo suave
  - [ ] Teclado no tapa inputs
  - [ ] Funciona en portrait
  - [ ] Haptic feedback (si aplica)

**Edge Cases:**
- [ ] ¿Funciona offline (guest mode)?
- [ ] ¿Network status detection funciona?
- [ ] ¿Logout durante onboarding (primera vez)?
- [ ] ¿Clear localStorage y volver a primera vez?
- [ ] ¿Múltiples logouts consecutivos?

**Entregables:**
- OnboardingFlow integrado en la app
- Todos los flujos testeados y funcionando
- Documentación de uso
- No breaking changes para usuarios existentes

---

### Fase de Implementación 6: Polish y Docs (Día 11)

**Tareas:**

1. ✅ Refinamiento de animaciones
2. ✅ Ajustes de diseño según feedback
3. ✅ Performance optimizations
4. ✅ Documentación técnica:
   - README del feature
   - Comentarios en código
   - Docs de uso para futuros devs
5. ✅ Crear flag de feature para testing interno
6. ✅ Analytics/tracking events (opcional)

**Feature Flag:**

```typescript
const FEATURE_FLAGS = {
  NEW_ONBOARDING: true, // Set to false to rollback
}

// In app init
if (FEATURE_FLAGS.NEW_ONBOARDING) {
  return <OnboardingFlow />;
} else {
  return <WelcomeGate />; // Fallback to old
}
```

**Entregables:**
- Feature pulido y listo para producción
- Documentación completa
- Feature flag para safe rollout

---

## 🔧 Consideraciones Técnicas

### Dependencies

**Nuevas dependencias necesarias:**

```json
{
  "dependencies": {
    "framer-motion": "^11.0.0",     // Para animaciones avanzadas (opcional)
    "react-swipeable": "^7.0.0"     // Para gestures de swipe (opcional)
  }
}
```

**Alternativa sin dependencias adicionales:**
- Usar solo CSS transitions y `useState` para animaciones
- Implementar swipe con `onTouchStart/onTouchEnd` custom

**Recomendación:** Empezar sin deps adicionales, agregar solo si es necesario

---

### Performance

**Optimizaciones:**

1. **Code Splitting:**
   ```typescript
   const WelcomeOnboardingFlow = lazy(() => import('./phases/WelcomeOnboarding'));
   const LoginFlow = lazy(() => import('./phases/LoginFlow'));
   const FirstConfigFlow = lazy(() => import('./phases/FirstConfig'));
   ```

2. **Image Optimization:**
   - Ilustraciones en SVG (escalables, ligeras)
   - Lazy loading de imágenes pesadas
   - Sprites para iconos repetidos

3. **Animation Performance:**
   - Usar `transform` y `opacity` (GPU accelerated)
   - Evitar animaciones de `width`, `height`, `top`, `left`
   - `will-change` para elementos animados

4. **Bundle Size:**
   - Tree shaking de lucide-react icons
   - Lazy load de componentes no críticos
   - Analizar con `webpack-bundle-analyzer`

---

### Accessibility

**Checklist:**

- [ ] Todos los botones tienen labels descriptivos
- [ ] Navegación por teclado funciona (Tab, Enter, Escape)
- [ ] Focus visible en elementos interactivos
- [ ] ARIA labels donde sea necesario
- [ ] Screen reader support
- [ ] Color contrast ratio WCAG AA (4.5:1 para texto)
- [ ] Skip option accesible desde teclado
- [ ] Loading states anunciados por screen reader

**ARIA Attributes:**

```typescript
<div role="region" aria-label="Onboarding paso 1 de 6">
  <button aria-label="Continuar al siguiente paso">
    Empezar
  </button>
</div>
```

---

### Analytics (Opcional)

**Events a trackear:**

```typescript
// Onboarding started
trackEvent('onboarding_started', {
  timestamp: Date.now(),
  source: 'first_load' | 'manual',
});

// Onboarding step completed
trackEvent('onboarding_step_completed', {
  phase: 'welcome' | 'login' | 'config',
  step: number,
  timestamp: Date.now(),
});

// Onboarding phase skipped
trackEvent('onboarding_phase_skipped', {
  phase: 'welcome' | 'config', // Solo welcome y config son skippeables
  step_at_skip: number,
  destination: 'login' | 'app',
  timestamp: Date.now(),
});

// Onboarding completed
trackEvent('onboarding_completed', {
  duration_seconds: number,
  auth_method: 'google' | 'guest' | 'apple' | 'email',
  config_selections: {...},
});

// Auth method selected
trackEvent('auth_method_selected', {
  method: 'google' | 'guest' | 'apple' | 'email',
  context: 'first_time' | 'logout', // ⭐ Importante: diferenciar contextos
  timestamp: Date.now(),
});

// Login screen viewed
trackEvent('login_screen_viewed', {
  context: 'first_time' | 'logout', // ⭐ Track si es primera vez o logout
  came_from: 'welcome_onboarding' | 'app_logout' | 'app_start',
  timestamp: Date.now(),
});
```

**Herramientas:**
- Google Analytics 4
- Mixpanel
- Custom telemetry (localStorage)

---

## 🧪 Testing Strategy

### Unit Tests

**Componentes a testear:**

```typescript
// ProgressDots.test.tsx
describe('ProgressDots', () => {
  it('renders correct number of dots', () => {});
  it('highlights current step', () => {});
  it('uses correct variant', () => {});
});

// OnboardingContext.test.tsx
describe('OnboardingContext', () => {
  it('initializes with correct default state', () => {});
  it('updates progress correctly', () => {});
  it('persists to localStorage', () => {});
  it('migrates from legacy welcome', () => {});
});
```

### Integration Tests

**Flows a testear:**

```typescript
describe('Onboarding Flow', () => {
  it('completes full onboarding flow', async () => {
    // 1. Start onboarding
    // 2. Navigate through welcome screens (1-6)
    // 3. Select auth method
    // 4. Complete config
    // 5. Verify redirect to app
    // 6. Verify persistence
  });

  it('skips onboarding if already completed', () => {});
  it('resumes onboarding from saved progress', () => {});
  it('migrates legacy users correctly', () => {});
});
```

### E2E Tests (Playwright/Cypress)

```typescript
test('First time user completes onboarding', async ({ page }) => {
  await page.goto('/');

  // Should show onboarding
  await expect(page.locator('text=Bienvenido a SmartSpend')).toBeVisible();

  // Navigate through welcome screens
  for (let i = 0; i < 6; i++) {
    await page.click('button:has-text("Continuar")');
  }

  // Select guest mode
  await page.click('button:has-text("Explorar como invitado")');

  // Skip config
  await page.click('button:has-text("Omitir")');

  // Should be in app
  await expect(page.locator('text=Balance')).toBeVisible();
});
```

---

## 📅 Timeline Estimado

| Fase | Duración | Descripción |
|------|----------|-------------|
| Setup y Estructura | 2 días | Crear arquitectura, componentes base, context |
| Welcome Onboarding | 3 días | 6 pantallas + navegación + animaciones |
| Login Flow | 2 días | Auth integration + error handling |
| First Config | 2 días | Config screens + persistence |
| Integración y Testing | 1 día | End-to-end testing, edge cases |
| Polish y Docs | 1 día | Refinamiento, documentación |
| **Total** | **11 días** | ~2 semanas de trabajo |

**Notas:**
- Timeline asume 1 developer full-time
- Puede paralelizarse con 2 devs (7-8 días)
- Buffer de 2-3 días para QA y fixes

---

## 🚀 Deployment Strategy

### Rollout Plan

**Stage 1: Internal Testing (1 semana)**
- Deploy con feature flag OFF
- Testing interno del equipo
- Collect feedback y bugs

**Stage 2: Beta Testing (1 semana)**
- Feature flag ON para usuarios beta
- A/B testing (20% new onboarding, 80% old)
- Monitor analytics y error rates

**Stage 3: Full Rollout (gradual)**
- Semana 1: 50% usuarios
- Semana 2: 100% usuarios
- Keep old WelcomeGate como fallback

**Rollback Plan:**
- Feature flag a false revierte a WelcomeGate
- No data loss (ambos sistemas compatibles)
- Monitor error rates en Sentry

---

## 📊 Success Metrics

**Métricas de éxito:**

1. **Completion Rate**
   - Target: >70% de usuarios completan onboarding
   - Baseline: N/A (no hay onboarding actual)

2. **Time to Complete**
   - Target: 2-3 minutos promedio
   - Max acceptable: 5 minutos

3. **Skip Rate**
   - Target: <30% de usuarios hacen skip
   - Monitor por fase (welcome, login, config)

4. **Auth Conversion**
   - Target: >40% eligen auth method (Google/Apple/Email)
   - vs. Guest: <60%

5. **Drop-off Points**
   - Identify qué pantallas tienen más abandono
   - Optimize pantallas con >20% drop-off

6. **User Satisfaction**
   - Survey post-onboarding (opcional)
   - Target: 4+ stars de 5

---

## 🔮 Future Enhancements

**Post-MVP Features:**

1. **Video Tutorials** (cada pantalla puede tener un video corto)
2. **Interactive Demos** (sandbox mode en algunas pantallas)
3. **Personalization** (onboarding diferente según perfil de usuario)
4. **Gamification** (badges, progreso, rewards)
5. **Multi-language Support** (cuando tengamos i18n)
6. **Dark Mode Support** (cuando tengamos dark theme)
7. **Voice-over / Audio** (accessibility)
8. **Offline Mode** (descargar assets para uso offline)

---

## 🗑️ Deprecation Plan

### WelcomeGate.tsx

**Plan de deprecación:**

1. **Fase 1** (Deployment): Keep both systems
   ```typescript
   const USE_NEW_ONBOARDING = import.meta.env.VITE_NEW_ONBOARDING === 'true';

   if (USE_NEW_ONBOARDING) {
     return <OnboardingFlow />;
   }
   return <WelcomeGate />;
   ```

2. **Fase 2** (1 mes después): Default to new, keep fallback
   ```typescript
   const USE_NEW_ONBOARDING = import.meta.env.VITE_NEW_ONBOARDING !== 'false';
   ```

3. **Fase 3** (2 meses después): Remove WelcomeGate completely
   - Delete `WelcomeGate.tsx`
   - Delete legacy localStorage key
   - Update all references

**Migration Checklist:**
- [ ] Analytics muestra <5% de usuarios usando old onboarding
- [ ] No critical bugs en new onboarding (0 P0/P1 bugs)
- [ ] Success metrics alcanzados
- [ ] Team approval para removal

---

## 📝 Notas Adicionales

### Decisiones Pendientes

**Design:**
- [ ] ¿Cuál variante de login usar? (tenemos 4 diseños)
- [ ] ¿Cuál variante de config intro usar? (tenemos 4 diseños)
- [ ] ¿Permitimos swipe entre pantallas?
- [x] ✅ **Skip functionality** (DEFINIDO):
  - Welcome: Skip en todas → va a Login
  - Login: NO skip (obligatorio)
  - Config: Skip en todas → va a App

**Technical:**
- [ ] ¿Usamos framer-motion o solo CSS?
- [ ] ¿Implementamos Apple OAuth en v1 o después?
- [ ] ¿Implementamos Email/Password auth en v1 o después?
- [ ] ¿Agregamos analytics desde el inicio?

**Product:**
- [ ] ¿Hacemos A/B testing de variantes?
- [ ] ¿Cuáles pantallas de config implementamos en v1?
- [ ] ¿Implementamos todos los auth methods o solo Google + Guest?

### Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Usuarios existentes pierden datos | Baja | Alto | Sistema de migración robusto, testing exhaustivo |
| Auth providers no funcionan | Media | Alto | Mantener guest mode siempre disponible (no requiere network) |
| Performance issues en móvil | Media | Medio | Lazy loading, animaciones GPU-accelerated, testing en devices |
| Usuarios no completan onboarding | Baja | Medio | Skip option en Welcome y Config, Login obligatorio pero simple |
| Bundle size aumenta significativamente | Baja | Bajo | Code splitting, lazy loading, tree shaking |
| Safe area issues en iOS | Media | Medio | CSS env() variables, testing en iPhone con notch |
| Keyboard tapa inputs (mobile) | Media | Bajo | Capacitor Keyboard plugin, scroll automático |

---

## 🤝 Team Responsibilities

**Developer:**
- Implementar componentes y lógica
- Testing unitario e integración
- Code review

**Designer:**
- Validar implementación vs. diseños
- Ajustes de UI/UX
- Assets y recursos visuales

**Product:**
- Decisiones de features y priorización
- Validar flows y experiencia
- Define success metrics

**QA:**
- Testing manual en devices
- E2E testing
- Bug reporting y validation

---

## 📚 Referencias

**Diseños:**
- `docs/roadmap/first interaction pages/1 welcomeOnboarding/` - 6 pantallas
- `docs/roadmap/first interaction pages/2 loginFlow/` - 4 pantallas
- `docs/roadmap/first interaction pages/3 firstConfig/` - 5 pantallas

**Código Actual:**
- `src/shared/components/providers/WelcomeGate.tsx` - Implementación actual
- `src/state/budget.store.ts` - Store de Zustand
- `src/lib/supabaseClient.ts` - Cliente de Supabase

**Design Guidelines:**
- `CLAUDE.md` - Guías de diseño y patrones

**Tech Stack:**
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- Supabase
- Lucide React Icons

---

## ✅ Checklist de Completitud

**Pre-Implementation:**
- [x] Plan documentado
- [ ] Design decisions finalizadas
- [ ] Tech stack confirmado
- [ ] Timeline aprobado

**Implementation:**
- [ ] Estructura de carpetas creada
- [ ] Componentes base implementados
- [ ] Welcome Onboarding (6 screens)
- [ ] Login Flow (1 screen consolidada)
- [ ] First Config (2 screens)
- [ ] Navegación y routing
- [ ] Animaciones y transiciones
- [ ] Persistencia y migración
- [ ] Auth integration

**Testing:**
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual testing en devices
- [ ] Accessibility testing
- [ ] Performance testing

**Deployment:**
- [ ] Feature flag implementado
- [ ] Beta testing completado
- [ ] Analytics en place
- [ ] Documentación actualizada
- [ ] Full rollout

**Post-Deployment:**
- [ ] Monitor metrics
- [ ] Collect feedback
- [ ] Bug fixes
- [ ] WelcomeGate deprecated

---

## 🎯 Conclusion

Este plan provee una hoja de ruta clara para refactorizar el experience de primera vez del usuario en SmartSpend. El nuevo flujo de 15 pantallas (consolidadas en ~9 screens reales) mejorará significativamente el onboarding, educación del usuario, y configuración inicial.

**Reglas Clave del Flujo:**

1. **Welcome Onboarding y First Config son ONE-TIME ONLY**
   - Solo se muestran en la primera vez
   - Nunca más se vuelven a mostrar

2. **Login Flow es el único persistente**
   - Se muestra en primera vez (como parte del flujo completo)
   - Se muestra en logout (como pantalla standalone)

3. **Logout NO borra datos locales**
   - Mantiene transacciones, categorías, configuración
   - Solo cierra sesión y vuelve a Login

**Next Steps:**
1. Review y approval del plan
2. Finalizar decisiones de diseño pendientes
3. Kickoff de implementación
4. Seguir timeline propuesto

---

## 📊 Resumen Visual del Flujo

### Comparación Visual: Primera Vez vs. Logout

```
┌─────────────────────────────────────────────────────────────────────┐
│                    🆕 PRIMERA VEZ (Usuario Nuevo)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [APP START]                                                         │
│       │                                                              │
│       ├─► [Welcome Onboarding] (6 pantallas)                        │
│       │    "Bienvenido", "Features", "Beneficios"                   │
│       │    ✅ Puede skipear → va a Login                            │
│       │                                                              │
│       ├─► [Login Flow] (obligatorio)                                │
│       │    "Control Total y Acceso"                                 │
│       │    ❌ NO skippeable                                         │
│       │                                                              │
│       ├─► [First Config] (2-5 pantallas)                            │
│       │    "Idioma", "Tema", etc.                                   │
│       │    ✅ Puede skipear → va a App                              │
│       │                                                              │
│       └─► [APP HOME] ✅                                             │
│                                                                      │
│  Tiempo total: 30 seg - 3 min (según skips)                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│              🔄 LOGOUT (Usuario Returning) ⭐                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [APP START]                                                         │
│       │                                                              │
│       │  ❌ NO Welcome (ya lo vio)                                  │
│       │                                                              │
│       ├─► [Login Flow] (obligatorio)                                │
│       │    "Control Total y Acceso"                                 │
│       │    Misma pantalla, diferente contexto                       │
│       │                                                              │
│       │  ❌ NO Config (ya lo hizo)                                  │
│       │                                                              │
│       └─► [APP HOME] ✅                                             │
│                                                                      │
│  Tiempo total: ~15 segundos                                          │
└─────────────────────────────────────────────────────────────────────┘

💡 Nota: Welcome Onboarding y First Config son ONE-TIME ONLY
         Solo el Login Flow persiste después del primer uso
```

### Skip Navigation Summary

```
╔═══════════════════════════════════════════════════════════════╗
║                   ONBOARDING FLOW COMPLETO                    ║
╚═══════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────┐
│  FASE 1: WELCOME ONBOARDING (6 pantallas)                  │
│  ✅ SKIPPEABLE - Botón "Omitir" en top-right              │
├─────────────────────────────────────────────────────────────┤
│  1. Bienvenido a SmartSpend        [Omitir] ────┐          │
│  2. Registro Instantáneo           [Omitir] ────┤          │
│  3. Presupuestos Tranquilos        [Omitir] ────┤          │
│  4. Análisis de Hábitos            [Omitir] ────┼─────┐    │
│  5. Automatización de Movimientos  [Omitir] ────┤     │    │
│  6. Entiende tu Plata              [Omitir] ────┘     │    │
│                                                        │    │
│  [Continuar] ──────────────────────────────────────┐  │    │
└────────────────────────────────────────────────────┼──┼────┘
                                                     ▼  ▼
┌─────────────────────────────────────────────────────────────┐
│  FASE 2: LOGIN FLOW (1 pantalla)                           │
│  ❌ NO SKIPPEABLE - Obligatorio elegir método              │
├─────────────────────────────────────────────────────────────┤
│  • Control Total y Acceso                                   │
│    └─ Opciones:                                             │
│       ✓ Explorar como invitado (Guest mode)                │
│       ✓ Continuar con Google                                │
│       ⏸ Continuar con Apple (coming soon)                  │
│       ⏸ Usuario y contraseña (coming soon)                 │
│                                                             │
│  [Seleccionar método] ──────────────────────────────────┐  │
└─────────────────────────────────────────────────────────┼──┘
                                                          ▼
┌─────────────────────────────────────────────────────────────┐
│  FASE 3: FIRST CONFIG (2-5 pantallas)                      │
│  ✅ SKIPPEABLE - Botón "Omitir configuración" bottom      │
├─────────────────────────────────────────────────────────────┤
│  1. Config Intro                  [Omitir configuración]─┐ │
│  2. Selección de Idioma           [Omitir configuración]─┤ │
│  (3-5: Future features)                                  │ │
│                                                           │ │
│  [Continuar] ──────────────────────────────────────────┐ │ │
└────────────────────────────────────────────────────────┼─┼─┘
                                                         ▼ ▼
┌─────────────────────────────────────────────────────────────┐
│                      🎉 APP HOME                            │
│                   (Balance, Budget, etc.)                   │
└─────────────────────────────────────────────────────────────┘
```

### User Journeys

**Journey 1: Primera Vez - Usuario Completo**
```
Welcome 1 → Welcome 2 → ... → Welcome 6 → Login → Config 1 → Config 2 → App
Tiempo: ~3 minutos
Context: Usuario nuevo que quiere ver todo
```

**Journey 2: Primera Vez - Usuario Rápido (skip welcome)**
```
Welcome 1 [Omitir] → Login → Config 1 → Config 2 → App
Tiempo: ~1 minuto
Context: Usuario nuevo que ya conoce apps de budget
```

**Journey 3: Primera Vez - Usuario Muy Rápido (skip welcome + config)**
```
Welcome 1 [Omitir] → Login → Config 1 [Omitir configuración] → App
Tiempo: ~30 segundos
Context: Usuario nuevo con prisa
```

**Journey 4: Logout - Usuario Returning ⭐**
```
Login (directo) → App
Tiempo: ~15 segundos
Context: Usuario que se deslogueó y vuelve a entrar
Nota: NO ve Welcome ni Config, solo Login
```

**Journey 5: Usuario con Sesión Activa**
```
(Auto-skip onboarding completo) → App
Tiempo: 0 segundos
Context: Usuario que abre la app y ya tiene sesión
```

### Métricas de Skip

**Tracking esperado:**

| Escenario | % Esperado | Acción |
|-----------|-----------|--------|
| Completan todo el onboarding (primera vez) | 60-70% | 🎯 Target ideal |
| Skip welcome, completan config (primera vez) | 15-20% | ✅ Aceptable |
| Skip welcome y config (primera vez) | 10-15% | ⚠️ Monitor |
| Abandonan en Login | <5% | 🚨 Investigar |
| **Returning users (logout)** | 100% | ✅ Solo ven Login |

---

**Contacto para Questions:**
- Design: [Designer]
- Technical: [Developer]
- Product: [Product Owner]
