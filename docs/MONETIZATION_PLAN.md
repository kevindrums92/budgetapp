# Plan de Monetización - SmartSpend

**Versión**: 1.2
**Fecha**: 2026-02-01
**Estado**: Fase 1 ✅ | Fase 2 ✅ 90% | Fase 3 ⚡ 60%

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

### Filosofía de Monetización (Modelo Freemium Actualizado)

- **No penalizar el hábito**: La versión gratuita debe ser funcional para crear disciplina financiera
- **Retention hooks gratuitos**: Cloud backup y push notifications son GRATIS para fomentar engagement
- **Cobrar por insights y automatización avanzada**: El valor está en estadísticas, categorías ilimitadas y experiencia sin anuncios
- **Transparencia total**: Sin sorpresas, sin cobros ocultos
- **Privacidad como diferenciador**: Local-first como característica base, cloud sync como retention hook gratuito

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
- ✅ Acceso a las categorías predefinidas
- ✅ Creación de hasta **10 categorías personalizadas**
- ✅ Selección de iconos de la biblioteca completa (140+)
- ✅ Colores personalizables

**Presupuestos (Plans)**
- ✅ Hasta **2 presupuestos activos simultáneamente**
- ✅ Límites de gasto o metas de ahorro
- ✅ Períodos: Semanal, Mensual, Trimestral, Anual
- ✅ Tracking en tiempo real con indicadores visuales
- ✅ Historial de presupuestos completados

**Historial y Filtros**
- ✅ Filtro por tiempo: Este Mes, Mes Pasado, Personalizado
- ✅ Filtro por tipo: Todos, Ingresos, Gastos
- ❌ Filtro por Estado (Pagado, Pendiente, Planeado)
- ❌ Filtro por Categoría
- ❌ Filtro por Moneda
- ❌ Export CSV

**Estadísticas**
- ❌ **Toda la página de Stats es Pro**
- ❌ La pantalla se muestra blureada con invitación a unirse al plan Pro
- ❌ Quick View Cards, Dona, Balance, Filtros — todo bloqueado

**Transacciones Programadas**
- ✅ Creación de hasta **3 transacciones recurrentes**
- ✅ Frecuencias básicas: Semanal, Mensual
- ✅ Auto-confirmación masiva
- ❌ Frecuencias avanzadas (Trimestral, Anual, Personalizada)

**Internacionalización**
- ✅ 4 idiomas (Español, Inglés, Francés, Portugués)
- ✅ Selección manual de moneda principal (50+ monedas)
- ✅ Temas: Light, Dark, System

**Almacenamiento**
- ✅ Datos en localStorage (local-first)
- ✅ **Sincronización en la nube con Supabase** (retention hook)
- ✅ **Backup automático** (retention hook)
- ✅ **Acceso multi-dispositivo** (iOS, Android, Web)

**Seguridad**
- ✅ Autenticación biométrica
- ✅ **Cloud sync con cifrado end-to-end**

**Notificaciones**
- ✅ **Push notifications** (scheduled, reminders, summaries) - retention hook

**Publicidad**
- ⚠️ **Incluye anuncios no intrusivos** para mantener el servicio gratuito

#### ❌ Limitaciones Específicas

| Característica | Límite Lite | Límite Pro |
|----------------|-------------|------------|
| Categorías personalizadas | 10 | Ilimitadas |
| Presupuestos activos | 2 | Ilimitados |
| Transacciones programadas | 3 | Ilimitadas |
| Página de Stats completa | ❌ Bloqueada | ✅ |
| Cloud Sync | ✅ Gratis | ✅ |
| Backup automático | ✅ Gratis | ✅ |
| Push Notifications | ✅ Gratis | ✅ |
| Biometría | ✅ | ✅ |
| Exportación CSV/JSON | ❌ | ✅ |
| Filtros avanzados en History | ❌ (solo tiempo y tipo) | ✅ Todos |
| Publicidad | ⚠️ Incluye anuncios | ✅ 100% libre de anuncios |

---

### 2.2 SmartSpend Pro (Suscripción)

La versión Pro está diseñada para el usuario que busca **inteligencia financiera avanzada**, **automatización ilimitada** y una **experiencia sin interrupciones publicitarias**.

#### ✅ Características Premium Exclusivas

**🚫 Experiencia 100% Libre de Anuncios**
- ✅ Sin banners publicitarios
- ✅ Sin interrupciones de terceros
- ✅ Interfaz limpia y enfocada
- ✅ Rendimiento óptimo sin scripts de ads

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

**🔔 Push Notifications Inteligentes** (También en Lite)
- ✅ Notificaciones de transacciones programadas próximas
- ✅ Recordatorio diario para registrar gastos
- ✅ Resumen diario de movimientos
- ✅ Horarios personalizables con timezone automático
- ✅ Quiet hours configurable
- ✅ Firebase Cloud Messaging (iOS/Android)
- 💡 *Esta feature está disponible para todos los usuarios como retention hook*

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
| Categorías predefinidas | ✅ | ✅ |
| Categorías personalizadas | 10 máximo | ✅ Ilimitadas |
| Grupos de categorías | ❌ | ✅ Ilimitados |
| **Presupuestos** |
| Límites de gasto y metas | ✅ | ✅ |
| Presupuestos activos | 2 máximo | ✅ Ilimitados |
| Períodos avanzados | ❌ | ✅ |
| **Transacciones Programadas** |
| Recurrencias básicas | 3 máximo | ✅ Ilimitadas |
| Frecuencias avanzadas | ❌ | ✅ |
| Auto-confirmación masiva | ✅ | ✅ |
| **Estadísticas** |
| Página completa de Stats | ❌ Bloqueada (blur + CTA) | ✅ |
| **Historial y Filtros** |
| Filtro por tiempo y tipo | ✅ | ✅ |
| Filtro por Estado | ❌ | ✅ |
| Filtro por Categoría | ❌ | ✅ |
| Filtro por Moneda | ❌ | ✅ |
| Export CSV | ❌ | ✅ |
| **Almacenamiento** |
| Local (localStorage) | ✅ | ✅ |
| Cloud Sync | ✅ Gratis | ✅ |
| Backup automático | ✅ Gratis | ✅ |
| Multi-dispositivo | ✅ Gratis | ✅ |
| **Seguridad** |
| Biometría nativa | ✅ | ✅ |
| **Notificaciones** |
| Push notifications | ✅ Gratis | ✅ |
| Scheduled transaction alerts | ✅ Gratis | ✅ |
| Daily reminders & summaries | ✅ Gratis | ✅ |
| **Publicidad** |
| Experiencia sin anuncios | ❌ Incluye ads | ✅ 100% ad-free |
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
  totalCategories: 10, // Actualizado: antes era 5
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
  | 'stats_page'
  | 'history_filters'
  | 'export'
  | 'settings'
  | 'upgrade_prompt'; // Para CTAs generales de upgrade
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
  | 'unlimited_categories'
  | 'unlimited_budgets'
  | 'unlimited_scheduled'
  | 'stats_page'
  | 'export_data'
  | 'history_filters';
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
| Categorías personalizadas | Agregar límite de 10 para Lite | 🔴 Alta |
| Presupuestos activos | Agregar límite de 2 para Lite | 🔴 Alta |
| Transacciones programadas | Agregar límite de 3 para Lite | 🔴 Alta |
| Página de Stats completa | Bloquear con blur + CTA para Lite | 🔴 Alta |
| Exportación CSV/JSON | Bloquear para Lite | 🔴 Alta |
| Filtros avanzados History | Bloquear para Lite | 🔴 Alta |
| Sistema de Ads | Integrar AdMob para Lite | 🟡 Media |

#### ✅ Completados (Fase 1)

| Característica | Ubicación | Estado |
|----------------|-----------|--------|
| PaywallModal | `shared/components/modals/PaywallModal.tsx` | ✅ Completo |
| PricingCard | `shared/components/modals/PricingCard.tsx` | ✅ Completo |
| useSubscription hook | `shared/hooks/useSubscription.ts` | ✅ Completo |
| ProFeatureGate | `shared/components/gates/ProFeatureGate.tsx` | ✅ Completo |
| Screen6_ChoosePlan | `features/onboarding/phases/WelcomeOnboarding/screens/Screen6_ChoosePlan.tsx` | ✅ Completo |
| ProfilePage 3-state card | `features/profile/pages/ProfilePage.tsx` | ✅ Completo |
| pricing.ts | `constants/pricing.ts` | ✅ Completo |
| pricing-regional.ts | `constants/pricing-regional.ts` | ✅ Completo |
| i18n paywall (4 idiomas) | `i18n/locales/*/paywall.json` | ✅ Completo |
| Migration v7→v8 | `services/storage.service.ts` | ✅ Completo |

#### ❌ Faltantes por Implementar

| Característica | Descripción | Prioridad |
|----------------|-------------|-----------|
| RevenueCat integration | Servicio de pagos nativos | 🔴 Alta |
| Límites enforcement | Bloquear features al límite | 🔴 Alta |
| Stats page blocking | Blur + CTA para Lite | 🔴 Alta |
| AdMob integration | Anuncios no intrusivos | 🟡 Media |

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

### Fase 1: Fundamentos ✅ COMPLETADA (2026-01-28 a 2026-01-30)

**Objetivo**: Establecer la infraestructura de monetización

- ✅ **Día 1-2: Definición y Configuración**
  - ✅ Crear `constants/pricing.ts`
  - ✅ Crear `constants/pricing-regional.ts`
  - ✅ Actualizar `budget.types.ts` con campo `subscription`
  - ✅ Crear migration v7→v8
  - ✅ Crear namespace `paywall.json` en i18n (4 idiomas)

- ✅ **Día 3-4: Hooks y Estado**
  - ✅ Crear `useSubscription.ts` hook
  - ✅ Actualizar `budget.store.ts` con subscription state
  - ⏭️ Tests para subscription state (diferido a Fase 6)

- ✅ **Día 5-7: Componentes de UI**
  - ✅ Crear `PricingCard.tsx`
  - ✅ Crear `PaywallModal.tsx` (6 beneficios)
  - ✅ Crear `ProFeatureGate.tsx`
  - ✅ Integrar traducciones en los 4 idiomas
  - ✅ **Extra**: Screen6_ChoosePlan.tsx (onboarding)
  - ✅ **Extra**: ProfilePage 3-state card (Guest/Free/Pro)
  - ✅ **Extra**: Ads disclosure y ad-free messaging

**Entregables**:
- ✅ Infraestructura de pricing definida
- ✅ Estado de suscripción en Zustand
- ✅ Componentes de UI del paywall
- ✅ i18n completo para paywall
- ✅ Onboarding con selección de plan integrado
- ✅ ProfilePage con card dinámico de suscripción

---

### Fase 2: Integración de Pagos ✅ CASI COMPLETA (90%) (2026-01-30 a 2026-02-01)

**Objetivo**: Conectar con RevenueCat y stores

- ✅ **Día 1: Investigación**
  - ✅ Investigar opciones de pago
  - ✅ RevenueCat seleccionado como solución óptima
  - ✅ Decisión documentada

- ✅ **Día 2-3: Configuración de Stores**
  - ✅ Crear productos en RevenueCat Dashboard:
    - `co.smartspend.monthly` - $4.99/mes
    - `co.smartspend.annual` - $34.99/año
    - `co.smartspend.lifetime` - $89.99 one-time
  - ✅ Configurar Products.storekit para testing local iOS
  - ⏭️ Crear productos en Google Play Console (pendiente)
  - ⏭️ Configurar trial de 7 días en stores (pendiente)

- ✅ **Día 4: Configuración de RevenueCat**
  - ✅ Crear cuenta en RevenueCat
  - ✅ Conectar App Store Connect con API key
  - ✅ Configurar Entitlement `pro`
  - ✅ Configurar webhook URL para Supabase Edge Function
  - ✅ API keys configurados (DEV: Test Store, PROD: SmartSpend)
  - ⏭️ Conectar Google Play Console (pendiente)

- ✅ **Día 5-7: Implementación Backend y SDK**
  - ✅ Instalar `@revenuecat/purchases-capacitor` (v8.3.2)
  - ✅ Crear `revenuecat.service.ts` (mock y real SDK)
  - ✅ Crear `RevenueCatProvider.tsx` con Purchases.configure() y logIn()
  - ✅ Crear `subscription.service.ts` (3-tier fallback: SDK → Supabase → localStorage)
  - ✅ Implementar Supabase Edge Function `revenuecat-webhook`:
    - ✅ Handler para INITIAL_PURCHASE
    - ✅ Handler para NON_RENEWING_PURCHASE (lifetime)
    - ✅ Handler para RENEWAL
    - ✅ Handler para CANCELLATION
    - ✅ Handler para EXPIRATION
    - ✅ Handler para UNCANCELLATION
    - ✅ Handler para PRODUCT_CHANGE
    - ✅ Handler para BILLING_ISSUE
    - ✅ Upsert pattern para evitar duplicados
  - ✅ Crear tablas Supabase:
    - ✅ `user_subscriptions` (user_id, product_id, status, expires_at, etc.)
    - ✅ `revenuecat_events` (auditoría de webhooks)
    - ✅ RLS policies configuradas
  - ✅ Integrar `Purchases.logIn()` en RevenueCatProvider, usePaywallPurchase, PaywallModal
  - ✅ Script de testing (`test-webhook.sh`) para simular eventos RevenueCat
  - ✅ Documentación completa en `docs/subscriptions/`
  - ⏭️ Testing en sandbox iOS/Android (pendiente)

**Entregables**:
- ✅ Productos configurados en RevenueCat (iOS)
- ✅ RevenueCat SDK integrado y funcional
- ✅ Webhook backend completamente implementado
- ✅ Database schema con RLS policies
- ✅ Sistema de 3-tier fallback para subscription status
- ✅ Documentación completa
- ⏭️ Testing en sandbox iOS/Android (pendiente - 10% restante)
- ⏭️ Productos configurados en Google Play (pendiente)

---

### Fase 3: Control de Acceso ✅ PARCIALMENTE COMPLETA (60%) (2026-01-31)

**Objetivo**: Implementar límites de la versión Lite

- ✅ **Día 1-2: Categorías**
  - ✅ Límite de 10 categorías definido en `pricing.ts`
  - ✅ Hook `useSubscription` con lógica `canUseFeature('unlimited_categories')`
  - ⏭️ Modificar `AddEditCategoryPage.tsx` para enforcar límite (pendiente)
  - ⏭️ Mostrar PaywallModal al límite (pendiente)

- ✅ **Día 3-4: Presupuestos**
  - ✅ Límite de 2 presupuestos definido en `pricing.ts`
  - ✅ Hook `useSubscription` con lógica `canUseFeature('unlimited_budgets')`
  - ⏭️ Modificar `BudgetPage.tsx` para enforcar límite (pendiente)
  - ⏭️ Mostrar PaywallModal al límite (pendiente)

- ✅ **Día 5: Transacciones Programadas**
  - ✅ Límite de 3 programadas definido en `pricing.ts`
  - ✅ Implementado `shouldShowPaywall` check en `ScheduledPage.tsx`
  - ✅ PaywallModal se muestra al intentar crear más de 3

- ✅ **Día 6-7: Exportación y Filtros**
  - ✅ **Exportación CSV**: Bloqueada en `ExportCSVPage`, `TripsPage`, `HistoryPage`
  - ✅ **Backups automáticos**: Bloqueados en `BackupMethodSelector` (solo manual para Free)
  - ✅ **Filtros de History**: Estado, Categoría, Monto bloqueados para Free
  - ✅ Lock icons y PRO badges implementados
  - ⏭️ Página de Stats completa bloqueada (pendiente)

**Entregables**:
- ✅ Límites definidos en constantes
- ✅ Hooks de subscription funcionales
- ✅ CSV exports bloqueados para Lite
- ✅ Backups automáticos bloqueados para Lite
- ✅ History filters bloqueados para Lite
- ✅ Scheduled transactions con límite de 3
- ⏭️ Categorías y Presupuestos enforcement (pendiente - 40% restante)
- ⏭️ Stats page completamente bloqueada (pendiente - 40% restante)

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

- [ ] **Día 1: Sistema de Anuncios**
  - [ ] Integrar AdMob SDK
  - [ ] Configurar banner ads no intrusivos para Lite
  - [ ] Testear en sandbox

- [ ] **Día 2: Exportación**
  - [ ] Modificar `BackupPage.tsx`
  - [ ] Deshabilitar Export para Lite
  - [ ] Mostrar ProFeatureGate

- [ ] **Día 3: Filtros Avanzados en History**
  - [ ] Modificar HistoryPage (bloquear filtros Estado, Categoría, Moneda para Lite)
  - [ ] Mostrar paywall al tocar filtro bloqueado

- [ ] **Día 4-7: Testing Integral**
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
### Infraestructura ✅ COMPLETO
- ✅ Crear constants/pricing.ts
- ✅ Crear constants/pricing-regional.ts
- ✅ Actualizar budget.types.ts
- ✅ Crear migration v7→v8
- ✅ Crear i18n/paywall.json (4 idiomas)

### Hooks y Estado ✅ COMPLETO
- ✅ Crear useSubscription.ts
- ✅ Actualizar budget.store.ts

### Componentes UI ✅ COMPLETO
- ✅ Crear PricingCard.tsx
- ✅ Crear PaywallModal.tsx (6 beneficios)
- ✅ Crear ProFeatureGate.tsx
- ✅ Crear Screen6_ChoosePlan.tsx
- ✅ Actualizar ProfilePage (card 3-state)

### Integración de Pagos ✅ 90% COMPLETO
- ✅ Investigar opciones
- ✅ Configurar productos en RevenueCat (iOS)
- ✅ Configurar RevenueCat dashboard y webhook
- ✅ Instalar SDK `@revenuecat/purchases-capacitor`
- ✅ Crear `revenuecat.service.ts` (mock y real)
- ✅ Crear `subscription.service.ts` (3-tier fallback)
- ✅ Implementar Supabase Edge Function webhook
- ✅ Crear tablas `user_subscriptions` y `revenuecat_events`
- ✅ Integrar `Purchases.logIn()` en app
- ✅ Script de testing (`test-webhook.sh`)
- ⏭️ Testing en sandbox iOS/Android (pendiente)
- ⏭️ Configurar productos Google Play (pendiente)

### Control de Acceso ⚡ 60% COMPLETO
- ✅ Límite de 10 categorías custom (definido)
- ✅ Límite de 2 presupuestos (definido)
- ✅ Límite de 3 programadas (implementado y enforced)
- ✅ Export CSV/JSON solo Pro (implementado)
- ✅ Backups automáticos solo Pro (implementado)
- ✅ History: filtros Estado/Categoría/Monto bloqueados para Lite (implementado)
- ⏭️ Categorías: enforcement del límite (pendiente)
- ⏭️ Presupuestos: enforcement del límite (pendiente)
- ⏭️ Stats: toda la página bloqueada con blur + CTA (pendiente)
- ⏭️ Sistema de anuncios para Lite - AdMob (pendiente)

### Onboarding ✅ COMPLETO
- ✅ Crear Screen6_ChoosePlan.tsx
- ✅ Integrar en WelcomePage
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

## 10. Registro de Cambios

### v1.2 (2026-02-01)
- ✅ **Fase 2: 90% completa** - RevenueCat integrado con backend completo
- 🔌 **RevenueCat SDK**: Instalado y configurado `@revenuecat/purchases-capacitor` v8.3.2
- 🎯 **Productos configurados**: monthly, annual, lifetime en RevenueCat Dashboard
- 🔗 **Webhook implementado**: Supabase Edge Function maneja todos los eventos (INITIAL_PURCHASE, RENEWAL, CANCELLATION, etc.)
- 🗄️ **Database schema**: Tablas `user_subscriptions` y `revenuecat_events` con RLS policies
- 🔄 **3-tier fallback**: RevenueCat SDK → Supabase → localStorage
- 📝 **Documentación**: Guías completas en `docs/subscriptions/`
- ⚡ **Fase 3: 60% completa** - Control de acceso parcial implementado
- 🔒 **Gates implementados**: CSV exports, backups automáticos, history filters, scheduled transactions (límite 3)
- ⏭️ **Pendiente**: Testing sandbox, enforcement de límites de categorías/presupuestos, Stats page blocking

### v1.1 (2026-01-30)
- ✅ **Fase 1 completada** - Infraestructura base implementada
- 🔄 **Modelo freemium actualizado**: Cloud Sync y Push Notifications movidas a tier gratuito como retention hooks
- 🆕 **Ad-free messaging**: Pro es 100% libre de anuncios
- 🆕 **Ads disclosure**: Lite incluye anuncios no intrusivos
- 📊 **Límite de categorías**: Actualizado de 5 a 10 para Lite
- 🎨 **UI completa**: PaywallModal con 6 beneficios, ProfilePage 3-state, Screen6_ChoosePlan
- 🌍 **i18n**: 4 idiomas completos (es, en, pt, fr)

### v1.0 (2026-01-28)
- 📝 Plan inicial de monetización

---

**Última actualización**: 2026-02-01
**Estado**: Fase 1 ✅ | Fase 2 ⚡ 90% | Fase 3 ⚡ 60% | Documento vivo
