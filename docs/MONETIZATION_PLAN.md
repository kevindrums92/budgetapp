# Plan de Monetización - SmartSpend

**Versión**: 1.0
**Fecha**: 2026-01-28
**Estado**: Planificación

## Tabla de Contenidos

- [1. Introducción](#1-introducción)
- [2. Definición de Versiones: Lite vs Pro](#2-definición-de-versiones-lite-vs-pro)
- [3. Implementación del Paywall](#3-implementación-del-paywall)
- [4. Integración de Pagos con Capacitor](#4-integración-de-pagos-con-capacitor)
- [5. Onboarding con Trial](#5-onboarding-con-trial)
- [6. Análisis del Código Actual](#6-análisis-del-código-actual)
- [7. Hoja de Ruta de Implementación](#7-hoja-de-ruta-de-implementación)

---

## 1. Introducción

Este documento establece el plan completo para la integración de la estrategia de monetización en SmartSpend, transformando la aplicación de una PWA gratuita a un modelo freemium con suscripción Pro.

### Objetivos Principales

1. **Definir claramente** las limitaciones de la versión Lite y las ventajas de la versión Pro
2. **Implementar un paywall efectivo** que no interrumpa la experiencia del usuario
3. **Integrar pagos nativos** usando las mejores prácticas de Capacitor
4. **Crear un onboarding atractivo** con prueba gratuita de 7 días
5. **Mantener la arquitectura local-first** como ventaja competitiva

### Filosofía de Monetización

- **No penalizar el hábito**: La versión gratuita debe ser funcional para crear disciplina financiera
- **Cobrar por automatización y seguridad**: El valor está en la conveniencia, no en las características básicas
- **Transparencia total**: Sin sorpresas, sin cobros ocultos
- **Privacidad como diferenciador**: Local-first como característica premium de privacidad

---

## 2. Definición de Versiones: Lite vs Pro

### 2.1 SmartSpend Lite (Gratuito)

La versión Lite permite al usuario establecer una disciplina financiera básica sin barreras económicas.

#### ✅ Características Incluidas

**Transacciones**
- ✅ Registro manual ilimitado de gastos e ingresos
- ✅ Descripción, monto, fecha y categoría
- ✅ Estados: Pagado, Pendiente, Planeado
- ✅ Notas por transacción
- ✅ Búsqueda y filtros básicos (Todos, Gastos, Ingresos)
- ✅ Navegación mensual

**Categorías**
- ✅ Acceso a las 21 categorías predefinidas
- ✅ Creación de hasta **3 categorías personalizadas**
- ✅ Selección de iconos de la biblioteca completa (140+)
- ✅ Colores personalizables

**Presupuestos (Plans)**
- ✅ Hasta **2 presupuestos activos simultáneamente**
- ✅ Límites de gasto o metas de ahorro
- ✅ Períodos: Semanal, Mensual, Trimestral, Anual
- ✅ Tracking en tiempo real con indicadores visuales
- ✅ Historial de presupuestos completados

**Estadísticas**
- ✅ Balance mensual (Ingresos - Gastos)
- ✅ Gráfico de Dona (Distribución por categoría)
- ✅ Vista básica del mes actual
- ❌ Quick View Cards (bloqueadas con blur)
- ❌ Comparación mensual
- ❌ Top categoría y top día
- ❌ Filtrado de categorías en estadísticas

**Transacciones Programadas**
- ✅ Creación de hasta **3 transacciones recurrentes**
- ✅ Frecuencias básicas: Semanal, Mensual
- ❌ Frecuencias avanzadas (Trimestral, Anual, Personalizada)
- ❌ Auto-confirmación masiva

**Internacionalización**
- ✅ 4 idiomas (Español, Inglés, Francés, Portugués)
- ✅ Selección manual de moneda principal (50+ monedas)
- ✅ Temas: Light, Dark, System

**Almacenamiento**
- ✅ Datos en localStorage (local-first)
- ❌ Sincronización en la nube
- ❌ Backup automático
- ❌ Acceso multi-dispositivo

**Seguridad**
- ❌ Autenticación biométrica
- ❌ Cloud sync con cifrado

**Notificaciones**
- ❌ Push notifications (scheduled, reminders, summaries)

#### ❌ Limitaciones Específicas

| Característica | Límite Lite | Límite Pro |
|----------------|-------------|------------|
| Categorías personalizadas | 3 | Ilimitadas |
| Presupuestos activos | 2 | Ilimitados |
| Transacciones programadas | 3 | Ilimitadas |
| Quick View Cards | Bloqueadas | Desbloqueadas |
| Cloud Sync | ❌ | ✅ |
| Biometría | ❌ | ✅ |
| Exportación CSV/JSON | ❌ | ✅ |
| Filtros avanzados en Stats | ❌ | ✅ |
| Backup automático | ❌ | ✅ |

---

### 2.2 SmartSpend Pro (Suscripción)

La versión Pro está diseñada para el usuario que busca optimizar su tiempo, asegurar su información y obtener inteligencia sobre su comportamiento financiero.

#### ✅ Características Premium

**☁️ Cloud Sync & Backup Automático**
- ✅ Sincronización en tiempo real con Supabase
- ✅ Acceso multi-dispositivo (iOS, Android, Web)
- ✅ Backup automático en la nube
- ✅ Recuperación ante pérdida del dispositivo
- ✅ Historial de versiones de datos

**🔐 Seguridad Biométrica Nativa**
- ✅ Face ID (iOS)
- ✅ Touch ID (iOS)
- ✅ Huella dactilar (Android)
- ✅ Bloqueo de app con autenticación nativa del OS
- ✅ Configuración por dispositivo sincronizada

**📊 Análisis Predictivo y Métricas Inteligentes**
- ✅ **Quick View Cards** completas:
  - Promedio diario real (gasto/día)
  - Comparación mensual justa día a día
  - Top categoría con modal de detalle
  - Top día de la semana con transacciones
- ✅ Proyección de fin de mes basada en tasa actual
- ✅ Filtrado avanzado: Excluir categorías de estadísticas
- ✅ Drill-down por categoría y mes

**🔁 Automatización de Programadas**
- ✅ Transacciones recurrentes ilimitadas
- ✅ Frecuencias avanzadas: Trimestral, Anual, Personalizada
- ✅ Auto-confirmación masiva de transacciones pendientes
- ✅ Generación lazy de registros futuros
- ✅ Desactivación temporal de programaciones

**🎨 Personalización Ilimitada**
- ✅ Categorías personalizadas sin límite
- ✅ Grupos de categorías ilimitados
- ✅ Acceso a 140+ iconos
- ✅ Colores personalizados

**💰 Presupuestos Avanzados**
- ✅ Presupuestos ilimitados activos
- ✅ Presupuestos compartidos (futuro)
- ✅ Períodos personalizados avanzados
- ✅ Health Check System completo

**📤 Exportación de Datos**
- ✅ Exportación a CSV (análisis en Excel/Sheets)
- ✅ Exportación a JSON (backup completo)
- ✅ Importación desde backup JSON
- ✅ Validación con checksum SHA-256

**🔍 Filtros Avanzados y Exclusiones**
- ✅ Excluir categorías específicas de estadísticas
- ✅ Filtros persistentes sincronizados
- ✅ Búsqueda avanzada en transacciones

**🔔 Push Notifications Inteligentes**
- ✅ Notificaciones de transacciones programadas próximas
- ✅ Recordatorio diario para registrar gastos
- ✅ Resumen diario de movimientos
- ✅ Horarios personalizables con timezone automático
- ✅ Quiet hours configurable
- ✅ Firebase Cloud Messaging (iOS/Android)

**🌍 Multi-moneda Dinámica (Futuro)**
- ✅ Billeteras en múltiples divisas
- ✅ Tipos de cambio actualizados
- ✅ Conversión automática para estadísticas

---

### 2.3 Tabla Comparativa Completa

| Característica | Lite | Pro |
|----------------|------|-----|
| **Transacciones** |
| Registro manual ilimitado | ✅ | ✅ |
| Estados y notas | ✅ | ✅ |
| Búsqueda y filtros básicos | ✅ | ✅ |
| **Categorías** |
| Categorías predefinidas (21) | ✅ | ✅ |
| Categorías personalizadas | 3 máximo | ✅ Ilimitadas |
| Grupos de categorías | ❌ | ✅ Ilimitados |
| **Presupuestos** |
| Límites de gasto y metas | ✅ | ✅ |
| Presupuestos activos | 2 máximo | ✅ Ilimitados |
| Períodos avanzados | ❌ | ✅ |
| **Transacciones Programadas** |
| Recurrencias básicas | 3 máximo | ✅ Ilimitadas |
| Frecuencias avanzadas | ❌ | ✅ |
| Auto-confirmación masiva | ❌ | ✅ |
| **Estadísticas** |
| Balance mensual | ✅ | ✅ |
| Gráfico de Dona | ✅ | ✅ |
| Quick View Cards | ❌ Bloqueadas | ✅ |
| Filtros avanzados | ❌ | ✅ |
| Exclusión de categorías | ❌ | ✅ |
| **Almacenamiento** |
| Local (localStorage) | ✅ | ✅ |
| Cloud Sync | ❌ | ✅ |
| Backup automático | ❌ | ✅ |
| Multi-dispositivo | ❌ | ✅ |
| **Seguridad** |
| Biometría nativa | ❌ | ✅ |
| Cifrado en tránsito | ❌ | ✅ |
| **Notificaciones** |
| Push notifications | ❌ | ✅ |
| Scheduled transaction alerts | ❌ | ✅ |
| Daily reminders & summaries | ❌ | ✅ |
| **Exportación** |
| CSV / JSON | ❌ | ✅ |
| **Configuración** |
| Idiomas (4) | ✅ | ✅ |
| Monedas (50+) | ✅ | ✅ |
| Temas (3) | ✅ | ✅ |

---

## 3. Implementación del Paywall

### 3.1 Principios de Diseño del Paywall

El paywall debe seguir los principios de la psicología del consumo digital en 2026:

1. **Regla de los 3 segundos**: El usuario debe comprender los beneficios en < 3 segundos
2. **Orientado a resultados**: Copy enfocado en resultados ("Alcanza tus metas 3x más rápido")
3. **Jerarquía visual**: 3 opciones de precio con "Mejor Valor" destacado
4. **Transparencia en el trial**: Timeline visual de cuándo termina la prueba
5. **Prueba social**: Badges de seguridad, testimonios (post-lanzamiento)

### 3.2 Estructura de Precios

#### Precios Globales (USD)

```typescript
// src/constants/pricing.ts

export const PRICING_PLANS = {
  monthly: {
    id: 'smartspend_monthly',
    price: 4.99,
    currency: 'USD',
    period: 'month',
    label: 'Mensual',
    savingsPercent: 0,
  },
  annual: {
    id: 'smartspend_annual',
    price: 34.99,
    currency: 'USD',
    period: 'year',
    label: 'Anual',
    savingsPercent: 41, // vs 12 × $4.99 = $59.88
    monthlyEquivalent: 2.91,
    badge: 'Mejor Valor',
  },
  lifetime: {
    id: 'smartspend_lifetime',
    price: 89.99,
    currency: 'USD',
    period: 'lifetime',
    label: 'De por vida',
    savingsPercent: null,
  },
} as const;

export const TRIAL_PERIOD_DAYS = 7;

export const FREE_TIER_LIMITS = {
  customCategories: 3,
  activeBudgets: 2,
  scheduledTransactions: 3,
} as const;
```

#### Precios Regionalizados (PPP)

```typescript
// src/constants/pricing-regional.ts

export const REGIONAL_PRICING = {
  CO: { // Colombia
    monthly: 14900, // COP
    annual: 119900,
    currency: 'COP',
  },
  BR: { // Brasil
    monthly: 19.90, // BRL
    annual: 149.00,
    currency: 'BRL',
  },
  MX: { // México
    monthly: 89, // MXN
    annual: 699,
    currency: 'MXN',
  },
  // ... más regiones
} as const;
```

### 3.3 Componentes del Paywall

#### 3.3.1 Componente Principal: `PaywallModal`

**Ubicación**: `src/shared/components/modals/PaywallModal.tsx`

**Props**:
```typescript
interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  trigger: PaywallTrigger;
  feature?: string;
  onSelectPlan: (planId: string) => void;
}

type PaywallTrigger =
  | 'onboarding'
  | 'category_limit'
  | 'budget_limit'
  | 'scheduled_limit'
  | 'quick_view'
  | 'cloud_sync'
  | 'biometric'
  | 'export'
  | 'settings';
```

### 3.4 Lógica de Control de Acceso

#### 3.4.1 Hook: `useSubscription`

**Ubicación**: `src/shared/hooks/useSubscription.ts`

```typescript
export interface SubscriptionStatus {
  isPro: boolean;
  isTrialing: boolean;
  trialEndsAt: string | null;
  subscriptionType: 'free' | 'trial' | 'monthly' | 'annual' | 'lifetime';
  canUseFeature: (feature: ProFeature) => boolean;
  shouldShowPaywall: (feature: ProFeature) => boolean;
}

export type ProFeature =
  | 'cloud_sync'
  | 'biometric'
  | 'unlimited_categories'
  | 'unlimited_budgets'
  | 'unlimited_scheduled'
  | 'quick_view_cards'
  | 'export_data'
  | 'advanced_filters'
  | 'auto_confirm_scheduled';
```

---

## 4. Integración de Pagos con Capacitor

### 4.1 Investigación de Opciones

Necesitamos investigar la mejor alternativa para integrar pagos nativos (Apple In-App Purchase y Google Play Billing) con Capacitor.

#### 🔍 Usar Context7 MCP para Investigación

**Tarea**: Investigar las siguientes opciones y recomendar la mejor para SmartSpend:

1. **RevenueCat** (Recomendado en el documento de estrategia)
   - SDK multiplataforma
   - Backend de suscripciones gestionado
   - PPP automático
   - Analytics integrado
   - Pricing: Free hasta $2.5K MRR, luego 1% de ingresos

2. **Capacitor Purchases** (Plugin oficial de Ionic)
   - `@capacitor-community/purchases`
   - Integración directa con RevenueCat
   - Capacitor 6+ compatible

3. **Cordova IAP Plugin**
   - `cordova-plugin-purchase`
   - Más maduro pero menos integrado con Capacitor

4. **Native APIs directas**
   - StoreKit 2 (iOS) + Google Play Billing Library

**Criterios de Evaluación**:
- ✅ Compatibilidad con Capacitor 8
- ✅ Soporte para trial de 7 días
- ✅ Manejo de suscripciones y lifetime
- ✅ PPP automático por región
- ✅ Sandbox testing fácil
- ✅ Documentación y comunidad activa
- ✅ Costos razonables

### 4.2 Arquitectura Propuesta (Basada en RevenueCat)

```
┌─────────────────────────────────────────────────────────────┐
│                    SmartSpend App (React)                    │
├─────────────────────────────────────────────────────────────┤
│  useSubscription Hook                                        │
│  └─ Zustand Store (subscription state)                       │
├─────────────────────────────────────────────────────────────┤
│  RevenueCat Service (src/services/revenuecat.service.ts)     │
├─────────────────────────────────────────────────────────────┤
│  Capacitor RevenueCat Plugin                                 │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     RevenueCat Backend                       │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌──────────────────────┬──────────────────────────────────────┐
│   Apple App Store    │      Google Play Store               │
└──────────────────────┴──────────────────────────────────────┘
```

---

## 5. Onboarding con Trial

### 5.1 Flujo de Onboarding Actualizado

**Flujo actual**:
1. Screen 1: Welcome
2. Screen 2: Features
3. Screen 3: Privacy
4. Screen 4: Smart Budgets
5. Screen 5: Insights
6. Screen 6: Get Started

**Flujo propuesto con Trial**:
1. Screen 1: Welcome
2. Screen 2: Features
3. Screen 3: Privacy
4. Screen 4: Smart Budgets
5. Screen 5: Insights
6. **Screen 6 (nuevo)**: Choose Your Plan
   - Opción 1: "Probar Pro Gratis (7 días)" → Paywall Modal
   - Opción 2: "Continuar con Lite" → First Config Flow

---

## 6. Análisis del Código Actual

### 6.1 Estado de Funcionalidades Implementadas

#### ✅ Completas y Listas

| Característica | Ubicación | Estado |
|----------------|-----------|--------|
| Transacciones ilimitadas | `features/transactions/` | ✅ Funcional |
| 21 categorías predefinidas | `constants/categories/` | ✅ Funcional |
| Categorías personalizadas | `features/categories/` | ✅ Funcional (sin límite) |
| Presupuestos (Plans) | `features/budget/` | ✅ Funcional (sin límite) |
| Transacciones programadas | `features/transactions/services/` | ✅ Funcional (sin límite) |
| Quick View Cards | `features/stats/components/` | ✅ Funcional |
| Cloud Sync | `shared/components/providers/CloudSyncGate.tsx` | ✅ Funcional |
| Autenticación biométrica | `features/profile/` | ✅ Funcional |
| Push Notifications | `services/pushNotification.service.ts` | ✅ Funcional |
| Exportación CSV/JSON | `features/backup/` | ✅ Funcional |

#### 🚧 Requieren Modificación para Monetización

| Característica | Acción Requerida | Prioridad |
|----------------|------------------|-----------|
| Categorías personalizadas | Agregar límite de 3 para Lite | 🔴 Alta |
| Presupuestos activos | Agregar límite de 2 para Lite | 🔴 Alta |
| Transacciones programadas | Agregar límite de 3 para Lite | 🔴 Alta |
| Quick View Cards | Agregar blur + paywall para Lite | 🔴 Alta |
| Cloud Sync | Solo para Pro | 🔴 Alta |
| Biometría | Solo para Pro | 🔴 Alta |
| Push Notifications | Solo para Pro | 🔴 Alta |

#### ❌ Faltantes por Implementar

| Característica | Descripción | Prioridad |
|----------------|-------------|-----------|
| PaywallModal | Modal de paywall con pricing | 🔴 Alta |
| useSubscription hook | Hook de estado de suscripción | 🔴 Alta |
| ProFeatureGate | Componente de control de acceso | 🔴 Alta |
| RevenueCat integration | Servicio de pagos | 🔴 Alta |
| Screen6_ChoosePlan | Pantalla de elección de plan | 🔴 Alta |

### 6.2 Cambios Necesarios en el Schema

```typescript
// src/types/budget.types.ts
export interface BudgetState {
  // ... campos existentes

  subscription: {
    status: 'free' | 'trialing' | 'active' | 'expired' | 'cancelled';
    type: 'free' | 'trial' | 'monthly' | 'annual' | 'lifetime';
    trialEndsAt: string | null;
    expiresAt: string | null;
    lastChecked: string;
  } | null;

  schemaVersion: 8; // Incrementar de 7 a 8
}
```

### 6.3 Archivos a Crear

```
src/
├── constants/
│   ├── pricing.ts                    # ← CREAR
│   └── pricing-regional.ts           # ← CREAR
│
├── services/
│   └── revenuecat.service.ts         # ← CREAR
│
├── shared/
│   ├── components/
│   │   ├── modals/
│   │   │   ├── PaywallModal.tsx      # ← CREAR
│   │   │   └── PricingCard.tsx       # ← CREAR
│   │   └── gates/
│   │       └── ProFeatureGate.tsx    # ← CREAR
│   └── hooks/
│       └── useSubscription.ts        # ← CREAR
│
└── i18n/
    └── locales/
        └── */
            └── paywall.json          # ← CREAR
```

### 6.4 Archivos a Modificar

```
- src/types/budget.types.ts
- src/state/budget.store.ts
- src/services/storage.service.ts
- src/app/App.tsx
- src/features/categories/pages/AddEditCategoryPage.tsx
- src/features/budget/pages/BudgetPage.tsx
- src/features/transactions/pages/ScheduledTransactionsPage.tsx
- src/features/stats/components/QuickViewCards.tsx
- src/features/profile/pages/ProfilePage.tsx
- src/features/onboarding/pages/WelcomePage.tsx
```

---

## 7. Hoja de Ruta de Implementación

### Fase 1: Fundamentos (Semana 1)

**Objetivo**: Establecer la infraestructura de monetización

- [ ] **Día 1-2: Definición y Configuración**
  - [ ] Crear `constants/pricing.ts`
  - [ ] Crear `constants/pricing-regional.ts`
  - [ ] Actualizar `budget.types.ts` con campo `subscription`
  - [ ] Crear migration v7→v8
  - [ ] Crear namespace `paywall.json` en i18n (4 idiomas)

- [ ] **Día 3-4: Hooks y Estado**
  - [ ] Crear `useSubscription.ts` hook
  - [ ] Actualizar `budget.store.ts` con subscription state
  - [ ] Crear tests para subscription state

- [ ] **Día 5-7: Componentes de UI**
  - [ ] Crear `PricingCard.tsx`
  - [ ] Crear `PaywallModal.tsx`
  - [ ] Crear `ProFeatureGate.tsx`
  - [ ] Integrar traducciones en los 4 idiomas

**Entregables**:
- ✅ Infraestructura de pricing definida
- ✅ Estado de suscripción en Zustand
- ✅ Componentes de UI del paywall
- ✅ i18n completo para paywall

---

### Fase 2: Integración de Pagos (Semana 2)

**Objetivo**: Conectar con RevenueCat y stores

- [ ] **Día 1: Investigación (Context7 MCP)**
  - [ ] Investigar opciones de pago
  - [ ] Comparar RevenueCat vs alternativas
  - [ ] Tomar decisión final

- [ ] **Día 2-3: Configuración de Stores**
  - [ ] Crear productos en App Store Connect
  - [ ] Crear productos en Google Play Console
  - [ ] Configurar trial de 7 días
  - [ ] Configurar precios PPP

- [ ] **Día 4: Configuración de RevenueCat**
  - [ ] Crear cuenta en RevenueCat
  - [ ] Conectar App Store Connect
  - [ ] Conectar Google Play Console
  - [ ] Configurar Entitlement `pro`

- [ ] **Día 5-7: Implementación**
  - [ ] Instalar `@revenuecat/purchases-capacitor`
  - [ ] Crear `revenuecat.service.ts`
  - [ ] Integrar en `App.tsx`
  - [ ] Testing en sandbox

**Entregables**:
- ✅ Productos configurados en ambas stores
- ✅ RevenueCat integrado y funcional
- ✅ Flujo de compra testeado

---

### Fase 3: Control de Acceso (Semana 3)

**Objetivo**: Implementar límites de la versión Lite

- [ ] **Día 1-2: Categorías**
  - [ ] Modificar `AddEditCategoryPage.tsx`
  - [ ] Agregar lógica de límite de 3 categorías
  - [ ] Mostrar PaywallModal al límite

- [ ] **Día 3-4: Presupuestos**
  - [ ] Modificar `BudgetPage.tsx`
  - [ ] Agregar lógica de límite de 2 presupuestos
  - [ ] Mostrar PaywallModal al límite

- [ ] **Día 5: Transacciones Programadas**
  - [ ] Modificar `ScheduledTransactionsPage.tsx`
  - [ ] Agregar lógica de límite de 3 programadas

- [ ] **Día 6-7: Quick View Cards**
  - [ ] Modificar `QuickViewCards.tsx`
  - [ ] Agregar blur overlay con Lock icon
  - [ ] Mostrar PaywallModal al click

**Entregables**:
- ✅ Límites de Lite implementados
- ✅ Paywalls contextuales funcionando
- ✅ UX de "bloqueado" clara

---

### Fase 4: Onboarding con Trial (Semana 4)

**Objetivo**: Integrar el paywall en el flujo de onboarding

- [ ] **Día 1-2: Screen 6**
  - [ ] Crear `Screen6_ChoosePlan.tsx`
  - [ ] Diseñar UI de elección de plan
  - [ ] Traducir a 4 idiomas

- [ ] **Día 3: Integración en WelcomePage**
  - [ ] Modificar `WelcomePage.tsx`
  - [ ] Actualizar lógica de navegación

- [ ] **Día 4-5: ProfilePage Updates**
  - [ ] Agregar badge de trial
  - [ ] Crear sección "Gestionar Suscripción"
  - [ ] Agregar botón "Restaurar Compras"

- [ ] **Día 6-7: Testing**
  - [ ] Testing E2E del flujo completo
  - [ ] Verificar sincronización con Supabase

**Entregables**:
- ✅ Onboarding completo con trial
- ✅ ProfilePage con gestión de suscripción
- ✅ Flujos testeados end-to-end

---

### Fase 5: Features Solo Pro (Semana 5)

**Objetivo**: Bloquear características premium

- [ ] **Día 1: Cloud Sync**
  - [ ] Modificar `CloudSyncGate.tsx`
  - [ ] Solo permitir para Pro

- [ ] **Día 2: Biometría**
  - [ ] Modificar toggle en ProfilePage
  - [ ] Solo permitir para Pro

- [ ] **Día 3: Exportación**
  - [ ] Modificar `BackupPage.tsx`
  - [ ] Deshabilitar Export para Lite

- [ ] **Día 4: Filtros Avanzados**
  - [ ] Modificar StatsPage
  - [ ] Solo permitir para Pro

- [ ] **Día 5-7: Testing Integral**
  - [ ] Suite de tests E2E para monetización
  - [ ] Documentar casos de prueba

**Entregables**:
- ✅ Todas las features Pro bloqueadas
- ✅ Suite de tests E2E completa

---

### Fase 6: Polish y Lanzamiento (Semana 6)

**Objetivo**: Preparar para producción

- [ ] **Día 1-2: Legal**
  - [ ] Términos de Suscripción
  - [ ] Política de Cancelación
  - [ ] Compliance App Store/Play Store

- [ ] **Día 3: Analytics**
  - [ ] Configurar eventos en RevenueCat
  - [ ] Tracking de conversiones

- [ ] **Día 4: Copy Optimization**
  - [ ] Revisar beneficios del paywall
  - [ ] Revisar traducciones

- [ ] **Día 5: Testing en Sandbox**
  - [ ] Testing iOS sandbox
  - [ ] Testing Android sandbox

- [ ] **Día 6-7: Preparación**
  - [ ] Release notes
  - [ ] Screenshots de Pro
  - [ ] Solicitar Small Business Program

**Entregables**:
- ✅ App lista para producción
- ✅ Aspectos legales cubiertos
- ✅ Analytics configurado

---

## 8. KPIs y Métricas

| Métrica | Objetivo |
|---------|----------|
| Impresión a Trial Start | 15-20% |
| Trial a Pago | 40-54% |
| Churn Mensual | < 5% |
| ARPU (Anual) | $15.75 USD |
| % Usuarios Pro | 5-10% |

---

## 9. Checklist de Implementación

```markdown
### Infraestructura
- [ ] Crear constants/pricing.ts
- [ ] Crear constants/pricing-regional.ts
- [ ] Actualizar budget.types.ts
- [ ] Crear migration v7→v8
- [ ] Crear i18n/paywall.json (4 idiomas)

### Hooks y Estado
- [ ] Crear useSubscription.ts
- [ ] Actualizar budget.store.ts

### Componentes UI
- [ ] Crear PricingCard.tsx
- [ ] Crear PaywallModal.tsx
- [ ] Crear ProFeatureGate.tsx

### Integración de Pagos
- [ ] Investigar opciones (Context7)
- [ ] Configurar productos en stores
- [ ] Configurar RevenueCat
- [ ] Instalar SDK
- [ ] Crear revenuecat.service.ts

### Control de Acceso
- [ ] Límite de 3 categorías
- [ ] Límite de 2 presupuestos
- [ ] Límite de 3 programadas
- [ ] Blur en Quick View Cards

### Onboarding
- [ ] Crear Screen6_ChoosePlan.tsx
- [ ] Integrar en WelcomePage
- [ ] Trial badge en ProfilePage

### Testing
- [ ] Tests unitarios
- [ ] Tests E2E
- [ ] Testing en sandbox

### Lanzamiento
- [ ] Release notes
- [ ] Screenshots
- [ ] Small Business Program
```

---

**Última actualización**: 2026-01-28
**Estado**: Documento vivo - Actualizar conforme avanza la implementación
