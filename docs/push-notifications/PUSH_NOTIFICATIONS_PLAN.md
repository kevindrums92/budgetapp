# Plan de Implementación: Push Notifications

## Resumen Ejecutivo

Este documento describe el plan completo para integrar push notifications en SmartSpend, una PWA con Capacitor que usa Supabase como backend. Basado en las mejores prácticas de 2026, implementaremos un sistema robusto y escalable de notificaciones push para iOS, Android y Web.

---

## 📊 Investigación y Decisiones Técnicas (2026)

### Alternativas Evaluadas

1. **@capacitor/push-notifications (Plugin Oficial)**
   - ❌ Problema: Retorna tokens nativos APNs en iOS (hexadecimal)
   - ❌ Firebase espera tokens FCM, no APNs nativos
   - ⚠️ Requiere manejo manual del "iOS Wall"

2. **@capacitor-firebase/messaging (Community Plugin)** ✅ SELECCIONADO
   - ✅ Maneja automáticamente el "native swizzling" en iOS
   - ✅ Retorna tokens FCM unificados en ambas plataformas
   - ✅ Soporte para rich notifications
   - ✅ Arquitectura production-ready
   - ✅ API única para iOS, Android y Web

3. **OneSignal**
   - ⚠️ Solución third-party completa
   - ⚠️ Lock-in de proveedor
   - ⚠️ Costos adicionales a escala

### Decisión Final

**Stack Técnico:**
- **Frontend**: `@capacitor-firebase/messaging` (v6.x)
- **Backend**: Supabase Edge Functions + Firebase Cloud Messaging (FCM)
- **Notificaciones Web**: Web Push API con Service Worker
- **Almacenamiento**: Tabla `push_tokens` en Supabase PostgreSQL

### Fuentes de Investigación

- [Push Notifications Capacitor Plugin API](https://capacitorjs.com/docs/apis/push-notifications)
- [The Push Notifications Guide for Capacitor - Capawesome](https://capawesome.io/blog/the-push-notifications-guide-for-capacitor/)
- [Supabase Sending Push Notifications Guide](https://supabase.com/docs/guides/functions/examples/push-notifications)
- [Real-Time Push Notifications with Supabase Edge Functions and Firebase](https://medium.com/@vignarajj/real-time-push-notifications-with-supabase-edge-functions-and-firebase-581c691c610e)
- [The Complete Guide to Capacitor Push Notifications](https://dev.to/saltorgil/the-complete-guide-to-capacitor-push-notifications-ios-android-firebase-bh4)

---

## 🎯 Objetivos

### Funcionalidades Core

1. **Recordatorio Diario Inteligente**
   - Hora configurable por el usuario
   - Solo se envía si NO ha registrado ningún movimiento en el día
   - Mensaje: "Recuerda registrar tus movimientos del día"
   - Navegación directa a pantalla de agregar transacción

2. **Alertas de Transacciones Pendientes/Programadas**
   - Notificación 1 día antes de la ejecución
   - Diferencia entre "pendiente" y "programada" en el mensaje
   - Incluye nombre y monto de la transacción
   - Ejemplo: "Transacción programada para mañana: Netflix por $14.990"
   - Navegación a detalle de transacción para confirmar o editar

3. **Alertas de Presupuesto**
   - Notificación al alcanzar 75% del límite de gasto
   - Alerta al exceder el límite (100%+)
   - Progreso de metas de ahorro (50%, 75%, 100%)
   - Navegación directa al presupuesto afectado

4. **Resumen Diario Opcional**
   - Hora configurable (por defecto 8:00 PM)
   - Resumen de gastos e ingresos del día
   - Categoría con más gasto
   - Solo si hubo actividad en el día
   - Navegación a estadísticas del día

### Requisitos No Funcionales

- ✅ Funcionamiento offline (queue de notificaciones pendientes)
- ✅ Soporte multi-dispositivo (un usuario en varios dispositivos)
- ✅ Preferencias granulares (habilitar/deshabilitar por tipo)
- ✅ Respeto a Do Not Disturb (horario configurable)
- ✅ Traducción completa (es, en, fr, pt)
- ✅ Dark mode support

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                      SmartSpend App                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PushNotificationService                              │   │
│  │  - registerDevice()                                   │   │
│  │  - handleNotification()                               │   │
│  │  - updatePreferences()                                │   │
│  └──────────────────────────────────────────────────────┘   │
│           │                                                   │
│           │ FCM Token                                         │
│           ▼                                                   │
└───────────────────────────────────────────────────────────────┘
            │
            │ Store Token
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL                       │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  push_tokens                                          │   │
│  │  - id (uuid, PK)                                      │   │
│  │  - user_id (uuid, FK → auth.users)                   │   │
│  │  - token (text, unique)                               │   │
│  │  - platform (enum: ios, android, web)                │   │
│  │  - device_info (jsonb)                                │   │
│  │  - preferences (jsonb)                                │   │
│  │  - is_active (boolean)                                │   │
│  │  - created_at, updated_at                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  notification_history                                 │   │
│  │  - id (uuid, PK)                                      │   │
│  │  - user_id (uuid, FK)                                 │   │
│  │  - notification_type (text)                           │   │
│  │  - title, body (text)                                 │   │
│  │  - data (jsonb)                                       │   │
│  │  - status (enum: sent, delivered, clicked, failed)   │   │
│  │  - sent_at, delivered_at, clicked_at                  │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
            │
            │ Database Trigger / Webhook
            ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Edge Functions (Deno)                  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  send-push-notification                               │   │
│  │  - Query user tokens                                  │   │
│  │  - Check preferences                                  │   │
│  │  - Compose message (i18n)                             │   │
│  │  - Call FCM HTTP v1 API                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  schedule-budget-alerts                               │   │
│  │  - Cron job (daily 8:00 AM local)                    │   │
│  │  - Check budget thresholds                            │   │
│  │  - Trigger notifications                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  schedule-transaction-reminders                       │   │
│  │  - Cron job (daily 9:00 AM local)                    │   │
│  │  - Query scheduled transactions                       │   │
│  │  - Trigger reminders                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
            │
            │ HTTP v1 API
            ▼
┌─────────────────────────────────────────────────────────────┐
│         Firebase Cloud Messaging (FCM)                       │
│         - APNs Gateway (iOS)                                 │
│         - FCM Gateway (Android)                              │
│         - Web Push Protocol (Web)                            │
└─────────────────────────────────────────────────────────────┘
            │
            │ Push Notification
            ▼
        User Devices
```

### Flujo de Registro de Dispositivo

1. **App Init**:
   - Usuario completa onboarding o hace login
   - App solicita permisos de notificaciones
   - Registro con FCM para obtener token

2. **Token Storage**:
   - Token se envía a Supabase con metadata (platform, device_info)
   - Backend valida y almacena en `push_tokens`
   - Token se asocia al `user_id` autenticado

3. **Token Refresh**:
   - FCM puede rotar tokens (iOS especialmente)
   - Listener detecta cambios y actualiza backend
   - Tokens antiguos se marcan como inactivos

### Flujo de Envío de Notificaciones

1. **Trigger Event**:
   - Evento en la app (nueva transacción, límite alcanzado, cron job)
   - Edge Function detecta evento vía Database Trigger o Cron

2. **Processing**:
   - Edge Function consulta `push_tokens` del usuario
   - Filtra por preferencias (tipo de notificación habilitado)
   - Compone mensaje según idioma del usuario

3. **Delivery**:
   - Edge Function llama FCM HTTP v1 API
   - FCM enruta a APNs (iOS) o FCM Gateway (Android/Web)
   - Notificación aparece en dispositivo

4. **Tracking**:
   - Estado se guarda en `notification_history`
   - Analytics de entrega y engagement

---

## 📋 Plan de Implementación (Fases)

### Fase 1: Setup de Firebase y Capacitor Plugin (Semana 1)

#### 1.1 Configuración de Firebase

**Tareas:**
- [ ] Crear proyecto en Firebase Console
- [ ] Habilitar Firebase Cloud Messaging (FCM)
- [ ] Configurar aplicaciones iOS y Android
- [ ] Descargar archivos de configuración:
  - `google-services.json` (Android)
  - `GoogleService-Info.plist` (iOS)
- [ ] Generar Service Account Key para Edge Functions
- [ ] Configurar FCM HTTP v1 API en Firebase Console

**Archivos a crear:**
- `android/app/google-services.json`
- `ios/App/App/GoogleService-Info.plist`
- `.env.local` variables:
  ```
  VITE_FIREBASE_API_KEY=...
  VITE_FIREBASE_PROJECT_ID=...
  VITE_FIREBASE_MESSAGING_SENDER_ID=...
  VITE_FIREBASE_APP_ID=...
  ```

#### 1.2 Instalación de Plugin

**Comandos:**
```bash
npm install @capacitor-firebase/messaging
npm install firebase
npx cap sync
```

**Configurar Capacitor:**
```typescript
// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // ... existing config
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    FirebaseMessaging: {
      // iOS config
      enableAutoRequestPermissions: false,
    },
  },
};
```

#### 1.3 Configuración iOS

**Tareas:**
- [ ] Habilitar Push Notifications capability en Xcode
- [ ] Configurar APNs Authentication Key en Apple Developer
- [ ] Subir APNs Key a Firebase Console
- [ ] Agregar `GoogleService-Info.plist` al proyecto Xcode
- [ ] Actualizar `Info.plist` con permisos:
  ```xml
  <key>UIBackgroundModes</key>
  <array>
    <string>remote-notification</string>
  </array>
  ```

#### 1.4 Configuración Android

**Tareas:**
- [ ] Agregar `google-services.json` a `android/app/`
- [ ] Aplicar plugin de Google Services en `build.gradle`:
  ```gradle
  apply plugin: 'com.google.gms.google-services'
  ```
- [ ] Configurar icono de notificación en `AndroidManifest.xml`

#### 1.5 Web Push Configuration

**Tareas:**
- [ ] Generar Web Push certificates en Firebase Console
- [ ] Configurar Service Worker para Web Push
- [ ] Agregar `firebase-messaging-sw.js` en `/public`

---

### Fase 2: Backend - Base de Datos (Semana 1-2)

#### 2.1 Crear Tabla `push_tokens`

**Migration SQL:**
```sql
-- supabase/migrations/20260128_create_push_tokens.sql

-- Enum para plataformas
CREATE TYPE platform_type AS ENUM ('ios', 'android', 'web');

-- Tabla principal de tokens
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform platform_type NOT NULL,
  device_info JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{
    "scheduled_transactions": true,
    "budget_alerts": true,
    "daily_reminder": {
      "enabled": false,
      "time": "20:00"
    },
    "daily_summary": {
      "enabled": false,
      "time": "20:00"
    },
    "quiet_hours": {
      "enabled": false,
      "start": "22:00",
      "end": "08:00"
    }
  }',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tokens"
  ON push_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
  ON push_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
  ON push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 2.2 Crear Tabla `notification_history`

**Migration SQL:**
```sql
-- supabase/migrations/20260128_create_notification_history.sql

-- Enum para status
CREATE TYPE notification_status AS ENUM ('sent', 'delivered', 'clicked', 'failed');

-- Enum para tipos de notificación
CREATE TYPE notification_type AS ENUM (
  'scheduled_transaction',
  'budget_limit_warning',
  'budget_limit_exceeded',
  'savings_goal_progress',
  'daily_reminder',
  'weekly_summary',
  'backup_success',
  'sync_error',
  'app_update'
);

-- Tabla de historial
CREATE TABLE notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_id UUID REFERENCES push_tokens(id) ON DELETE SET NULL,
  notification_type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  status notification_status DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX idx_notification_history_status ON notification_history(status);
CREATE INDEX idx_notification_history_sent_at ON notification_history(sent_at DESC);

-- RLS Policies
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification history"
  ON notification_history FOR SELECT
  USING (auth.uid() = user_id);

-- Solo Edge Functions pueden insertar
CREATE POLICY "Service role can insert notifications"
  ON notification_history FOR INSERT
  WITH CHECK (true); -- Solo service_role key puede insertar
```

#### 2.3 Función Helper para Actualización de Timestamp

```sql
-- supabase/migrations/20260128_create_helper_functions.sql

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### Fase 3: Frontend - Service de Notificaciones (Semana 2)

#### 3.1 Crear `PushNotificationService`

**Archivo:** `src/services/pushNotification.service.ts`

```typescript
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';
import type { NotificationPreferences, PushToken } from '@/types/notifications';

class PushNotificationService {
  private static instance: PushNotificationService;
  private token: string | null = null;
  private listeners: Array<() => void> = [];

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Inicializa el servicio de notificaciones
   */
  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform() && !this.isWebPushSupported()) {
      console.log('[PushNotification] Platform not supported');
      return;
    }

    try {
      // Solicitar permisos
      await this.requestPermissions();

      // Obtener token FCM
      await this.getToken();

      // Setup listeners
      this.setupListeners();

      console.log('[PushNotification] Initialized successfully');
    } catch (error) {
      console.error('[PushNotification] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Solicita permisos de notificaciones al usuario
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const result = await FirebaseMessaging.requestPermissions();

      if (result.receive === 'granted') {
        console.log('[PushNotification] Permissions granted');
        return true;
      } else {
        console.log('[PushNotification] Permissions denied');
        return false;
      }
    } catch (error) {
      console.error('[PushNotification] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Obtiene el token FCM del dispositivo
   */
  async getToken(): Promise<string | null> {
    try {
      const result = await FirebaseMessaging.getToken();
      this.token = result.token;

      // Guardar token en Supabase
      await this.saveTokenToBackend(this.token);

      console.log('[PushNotification] Token obtained:', this.token);
      return this.token;
    } catch (error) {
      console.error('[PushNotification] Failed to get token:', error);
      return null;
    }
  }

  /**
   * Guarda el token en Supabase
   */
  private async saveTokenToBackend(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
      const deviceInfo = await this.getDeviceInfo();

      const { error } = await supabase
        .from('push_tokens')
        .upsert(
          {
            user_id: user.id,
            token,
            platform,
            device_info: deviceInfo,
            is_active: true,
            last_used_at: new Date().toISOString(),
          },
          {
            onConflict: 'token',
          }
        );

      if (error) throw error;

      console.log('[PushNotification] Token saved to backend');
    } catch (error) {
      console.error('[PushNotification] Failed to save token:', error);
    }
  }

  /**
   * Configura los listeners de notificaciones
   */
  private setupListeners(): void {
    // Notificación recibida (app en foreground)
    const notificationListener = FirebaseMessaging.addListener(
      'notificationReceived',
      (notification) => {
        console.log('[PushNotification] Notification received:', notification);
        // Mostrar notificación local o toast
        this.handleForegroundNotification(notification);
      }
    );

    // Notificación clickeada
    const actionListener = FirebaseMessaging.addListener(
      'notificationActionPerformed',
      (action) => {
        console.log('[PushNotification] Notification action:', action);
        // Navegar a la pantalla correspondiente
        this.handleNotificationAction(action);
      }
    );

    // Token actualizado
    const tokenListener = FirebaseMessaging.addListener(
      'tokenReceived',
      (event) => {
        console.log('[PushNotification] Token refreshed:', event.token);
        this.token = event.token;
        this.saveTokenToBackend(event.token);
      }
    );

    this.listeners.push(
      () => notificationListener.remove(),
      () => actionListener.remove(),
      () => tokenListener.remove()
    );
  }

  /**
   * Maneja notificaciones cuando la app está en foreground
   */
  private async handleForegroundNotification(notification: any): Promise<void> {
    // Implementar lógica custom (toast, banner, etc.)
    // Por ahora, simplemente logueamos
    console.log('[PushNotification] Foreground notification:', notification);
  }

  /**
   * Maneja acciones cuando el usuario toca una notificación
   */
  private handleNotificationAction(action: any): void {
    const { data } = action.notification;

    // Routing basado en el tipo de notificación
    switch (data?.type) {
      case 'scheduled_transaction':
        // Navegar a transacciones programadas
        window.location.href = '/scheduled';
        break;
      case 'budget_alert':
        // Navegar a presupuestos
        window.location.href = '/budget';
        break;
      case 'transaction_reminder':
        // Navegar a agregar transacción
        window.location.href = '/add';
        break;
      default:
        // Home por defecto
        window.location.href = '/';
    }
  }

  /**
   * Actualiza las preferencias de notificaciones
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (!this.token) {
        console.warn('[PushNotification] No token available to update preferences');
        return;
      }

      const { error } = await supabase
        .from('push_tokens')
        .update({ preferences })
        .eq('token', this.token)
        .eq('user_id', user.id);

      if (error) throw error;

      console.log('[PushNotification] Preferences updated');
    } catch (error) {
      console.error('[PushNotification] Failed to update preferences:', error);
    }
  }

  /**
   * Obtiene las preferencias actuales
   */
  async getPreferences(): Promise<NotificationPreferences | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !this.token) return null;

      const { data, error } = await supabase
        .from('push_tokens')
        .select('preferences')
        .eq('token', this.token)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      return data?.preferences as NotificationPreferences;
    } catch (error) {
      console.error('[PushNotification] Failed to get preferences:', error);
      return null;
    }
  }

  /**
   * Desactiva el token actual (logout)
   */
  async deactivateToken(): Promise<void> {
    try {
      if (!this.token) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .eq('token', this.token)
        .eq('user_id', user.id);

      if (error) throw error;

      console.log('[PushNotification] Token deactivated');
    } catch (error) {
      console.error('[PushNotification] Failed to deactivate token:', error);
    }
  }

  /**
   * Limpia listeners
   */
  destroy(): void {
    this.listeners.forEach((remove) => remove());
    this.listeners = [];
    console.log('[PushNotification] Service destroyed');
  }

  /**
   * Obtiene información del dispositivo
   */
  private async getDeviceInfo(): Promise<Record<string, any>> {
    // Implementar usando @capacitor/device
    return {
      platform: Capacitor.getPlatform(),
      // Agregar más info según necesidad
    };
  }

  /**
   * Verifica si Web Push está soportado
   */
  private isWebPushSupported(): boolean {
    return 'PushManager' in window && 'serviceWorker' in navigator;
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
```

#### 3.2 Crear Tipos TypeScript

**Archivo:** `src/types/notifications.ts`

```typescript
export type NotificationType =
  | 'daily_reminder' // "Recuerda registrar tus movimientos"
  | 'upcoming_transaction' // Transacción pendiente/programada para mañana
  | 'budget_limit_warning' // 75% del presupuesto alcanzado
  | 'budget_limit_exceeded' // 100%+ del presupuesto
  | 'savings_goal_progress' // Progreso de meta de ahorro
  | 'daily_summary' // Resumen diario opcional
  | 'backup_success' // Backup completado (futuro)
  | 'sync_error' // Error de sincronización (futuro)
  | 'app_update'; // Actualización disponible (futuro)

export type NotificationStatus = 'sent' | 'delivered' | 'clicked' | 'failed';

export type Platform = 'ios' | 'android' | 'web';

export interface NotificationPreferences {
  scheduled_transactions: boolean; // Transacciones pendientes/programadas
  budget_alerts: boolean; // Alertas de presupuesto (75%, 100%)
  daily_reminder: {
    enabled: boolean;
    time: string; // "20:00" - Hora local del usuario
  };
  daily_summary: {
    enabled: boolean;
    time: string; // "20:00" - Hora local del usuario
  };
  quiet_hours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "08:00"
  };
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: Platform;
  device_info: Record<string, any>;
  preferences: NotificationPreferences;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_used_at: string;
}

export interface NotificationHistoryEntry {
  id: string;
  user_id: string;
  token_id: string | null;
  notification_type: NotificationType;
  title: string;
  body: string;
  data: Record<string, any>;
  status: NotificationStatus;
  error_message: string | null;
  sent_at: string;
  delivered_at: string | null;
  clicked_at: string | null;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  icon?: string;
  image?: string;
}
```

#### 3.3 Integrar en Zustand Store

**Archivo:** `src/state/budget.store.ts` (agregar sección)

```typescript
// Agregar a BudgetState interface
notificationPreferences?: NotificationPreferences;

// Agregar acción
setNotificationPreferences: (preferences: NotificationPreferences) => {
  set({ notificationPreferences: preferences });
  get().saveState(); // Persistir en localStorage
},
```

#### 3.4 Inicializar en App Root

**Archivo:** `src/App.tsx` (modificar)

```typescript
import { pushNotificationService } from '@/services/pushNotification.service';
import { useEffect } from 'react';
import { useBudgetStore } from '@/state/budget.store';

function App() {
  const { user } = useBudgetStore();

  useEffect(() => {
    // Inicializar notificaciones solo para usuarios autenticados
    if (user && !import.meta.env.DEV) {
      pushNotificationService.initialize().catch(console.error);
    }

    // Cleanup al desmontar
    return () => {
      pushNotificationService.destroy();
    };
  }, [user]);

  return (
    // ... resto del código
  );
}
```

---

### Fase 4: Backend - Supabase Edge Functions (Semana 3)

#### 4.1 Estructura de Edge Functions

```
supabase/functions/
├── send-push-notification/       # Core: envío de notificaciones con FCM
│   ├── index.ts
│   └── _shared/
│       ├── fcm.ts                # Cliente FCM con auth
│       ├── i18n.ts               # Traducciones de mensajes
│       └── types.ts              # Tipos compartidos
│
├── schedule-daily-reminders/     # Caso 1: Recordatorio diario inteligente
│   └── index.ts
│
├── schedule-transaction-alerts/  # Caso 2: Transacciones pendientes/programadas
│   └── index.ts
│
├── check-budget-alerts/          # Caso 3: Alertas de presupuesto (webhook)
│   └── index.ts
│
├── schedule-daily-summaries/     # Caso 4: Resumen diario opcional
│   └── index.ts
│
└── _shared/
    ├── supabaseClient.ts         # Cliente Supabase configurado
    ├── utils.ts                  # Helpers (timezone, date, etc.)
    └── queries.ts                # Queries SQL reutilizables
```

#### 4.2 Edge Function: `send-push-notification`

**Archivo:** `supabase/functions/send-push-notification/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendFCMNotification } from './_shared/fcm.ts';
import { getLocalizedMessage } from './_shared/i18n.ts';
import type { NotificationRequest } from './_shared/types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: NotificationRequest = await req.json();

    const { user_id, notification_type, data, locale = 'es' } = body;

    // 1. Obtener tokens activos del usuario
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (tokensError) throw tokensError;
    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active tokens found' }),
        { status: 404 }
      );
    }

    // 2. Filtrar por preferencias
    const eligibleTokens = tokens.filter((token) => {
      const prefs = token.preferences;

      // Verificar preferencia de tipo de notificación
      const typeEnabled = checkNotificationTypeEnabled(notification_type, prefs);
      if (!typeEnabled) return false;

      // Verificar quiet hours
      if (prefs.quiet_hours?.enabled) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const { start, end } = prefs.quiet_hours;

        if (isWithinQuietHours(currentTime, start, end)) {
          return false;
        }
      }

      return true;
    });

    if (eligibleTokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No eligible tokens (preferences)' }),
        { status: 200 }
      );
    }

    // 3. Componer mensaje localizado
    const message = getLocalizedMessage(notification_type, data, locale);

    // 4. Enviar notificaciones
    const results = await Promise.allSettled(
      eligibleTokens.map(async (tokenData) => {
        try {
          await sendFCMNotification(tokenData.token, message, tokenData.platform);

          // Guardar en historial
          await supabase.from('notification_history').insert({
            user_id,
            token_id: tokenData.id,
            notification_type,
            title: message.title,
            body: message.body,
            data: data || {},
            status: 'sent',
          });

          return { success: true, token: tokenData.id };
        } catch (error) {
          // Guardar error en historial
          await supabase.from('notification_history').insert({
            user_id,
            token_id: tokenData.id,
            notification_type,
            title: message.title,
            body: message.body,
            data: data || {},
            status: 'failed',
            error_message: error.message,
          });

          return { success: false, token: tokenData.id, error: error.message };
        }
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return new Response(
      JSON.stringify({
        message: 'Notifications processed',
        successful,
        failed,
        total: results.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending push notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

function checkNotificationTypeEnabled(type: string, prefs: any): boolean {
  const typeMapping: Record<string, string> = {
    scheduled_transaction: 'scheduled_transactions',
    budget_limit_warning: 'budget_alerts',
    budget_limit_exceeded: 'budget_alerts',
    savings_goal_progress: 'budget_alerts',
    daily_reminder: 'custom_reminders',
    weekly_summary: 'custom_reminders',
    backup_success: 'system_notifications',
    sync_error: 'system_notifications',
    app_update: 'system_notifications',
  };

  const prefKey = typeMapping[type];
  return prefs[prefKey] !== false; // true por defecto
}

function isWithinQuietHours(current: string, start: string, end: string): boolean {
  // Implementar lógica de comparación de horas
  // Manejar caso donde end < start (cruza medianoche)
  const [currH, currM] = current.split(':').map(Number);
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  const currMinutes = currH * 60 + currM;
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (endMinutes > startMinutes) {
    // Mismo día
    return currMinutes >= startMinutes && currMinutes <= endMinutes;
  } else {
    // Cruza medianoche
    return currMinutes >= startMinutes || currMinutes <= endMinutes;
  }
}
```

#### 4.3 Helper: FCM Client

**Archivo:** `supabase/functions/send-push-notification/_shared/fcm.ts`

```typescript
import { JWT } from 'https://esm.sh/google-auth-library@9';

const FCM_ENDPOINT = 'https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send';
const SERVICE_ACCOUNT_KEY = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY')!);

let accessTokenCache: { token: string; expiry: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Revisar cache
  if (accessTokenCache && accessTokenCache.expiry > Date.now()) {
    return accessTokenCache.token;
  }

  // Generar nuevo token
  const client = new JWT({
    email: SERVICE_ACCOUNT_KEY.client_email,
    key: SERVICE_ACCOUNT_KEY.private_key,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });

  const token = await client.authorize();

  accessTokenCache = {
    token: token.access_token!,
    expiry: Date.now() + 3000 * 1000, // 50 min (expira en 1 hora)
  };

  return token.access_token!;
}

export async function sendFCMNotification(
  token: string,
  message: { title: string; body: string; data?: Record<string, any> },
  platform: 'ios' | 'android' | 'web'
): Promise<void> {
  const accessToken = await getAccessToken();

  const payload: any = {
    message: {
      token,
      notification: {
        title: message.title,
        body: message.body,
      },
      data: message.data || {},
    },
  };

  // Platform-specific config
  if (platform === 'ios') {
    payload.message.apns = {
      payload: {
        aps: {
          alert: {
            title: message.title,
            body: message.body,
          },
          sound: 'default',
          badge: 1,
        },
      },
    };
  } else if (platform === 'android') {
    payload.message.android = {
      priority: 'high',
      notification: {
        sound: 'default',
        icon: 'ic_notification',
        color: '#18B7B0',
      },
    };
  }

  const response = await fetch(FCM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`FCM Error: ${error}`);
  }
}
```

#### 4.4 Helper: i18n

**Archivo:** `supabase/functions/send-push-notification/_shared/i18n.ts`

```typescript
const translations = {
  es: {
    daily_reminder: {
      title: 'Recuerda registrar tus movimientos',
      body: 'No olvides registrar los gastos del día 💰',
    },
    upcoming_transaction_scheduled: {
      title: 'Transacción programada para mañana',
      body: '{name} por {amount}',
    },
    upcoming_transaction_pending: {
      title: 'Transacción pendiente para mañana',
      body: '{name} por {amount}',
    },
    upcoming_transactions_multiple: {
      title: 'Transacciones para mañana',
      body: 'Tienes {count} transacciones por un total de {amount}',
    },
    budget_limit_warning: {
      title: '⚠️ Alerta de presupuesto',
      body: 'Has alcanzado el 75% de tu presupuesto de {category}',
    },
    budget_limit_exceeded: {
      title: '🚨 Presupuesto excedido',
      body: 'Has superado tu límite de {category} por {amount}',
    },
    daily_summary_expenses_only: {
      title: '📊 Resumen del día',
      body: 'Gastaste {amount} en {count} transacciones. Categoría top: {category}',
    },
    daily_summary_with_income: {
      title: '📊 Resumen del día',
      body: 'Gastaste {expenses}, recibiste {income}. Balance: {balance}',
    },
    daily_summary_income_only: {
      title: '📊 Resumen del día',
      body: 'Registraste {income} en {count} ingresos',
    },
  },
  en: {
    daily_reminder: {
      title: 'Remember to log your expenses',
      body: "Don't forget to log today's expenses 💰",
    },
    upcoming_transaction_scheduled: {
      title: 'Scheduled transaction for tomorrow',
      body: '{name} for {amount}',
    },
    upcoming_transaction_pending: {
      title: 'Pending transaction for tomorrow',
      body: '{name} for {amount}',
    },
    upcoming_transactions_multiple: {
      title: 'Transactions for tomorrow',
      body: 'You have {count} transactions for a total of {amount}',
    },
    budget_limit_warning: {
      title: '⚠️ Budget alert',
      body: "You've reached 75% of your {category} budget",
    },
    budget_limit_exceeded: {
      title: '🚨 Budget exceeded',
      body: "You've exceeded your {category} limit by {amount}",
    },
    daily_summary_expenses_only: {
      title: '📊 Daily summary',
      body: 'You spent {amount} in {count} transactions. Top category: {category}',
    },
    daily_summary_with_income: {
      title: '📊 Daily summary',
      body: 'Spent {expenses}, earned {income}. Balance: {balance}',
    },
    daily_summary_income_only: {
      title: '📊 Daily summary',
      body: 'You earned {income} in {count} incomes',
    },
  },
  fr: {
    daily_reminder: {
      title: 'Rappel pour enregistrer vos dépenses',
      body: "N'oubliez pas d'enregistrer les dépenses d'aujourd'hui 💰",
    },
    upcoming_transaction_scheduled: {
      title: 'Transaction programmée pour demain',
      body: '{name} pour {amount}',
    },
    upcoming_transaction_pending: {
      title: 'Transaction en attente pour demain',
      body: '{name} pour {amount}',
    },
    upcoming_transactions_multiple: {
      title: 'Transactions pour demain',
      body: 'Vous avez {count} transactions pour un total de {amount}',
    },
    budget_limit_warning: {
      title: '⚠️ Alerte budget',
      body: 'Vous avez atteint 75% de votre budget {category}',
    },
    budget_limit_exceeded: {
      title: '🚨 Budget dépassé',
      body: 'Vous avez dépassé votre limite {category} de {amount}',
    },
    daily_summary_expenses_only: {
      title: '📊 Résumé quotidien',
      body: 'Vous avez dépensé {amount} en {count} transactions. Catégorie top: {category}',
    },
    daily_summary_with_income: {
      title: '📊 Résumé quotidien',
      body: 'Dépensé {expenses}, reçu {income}. Balance: {balance}',
    },
    daily_summary_income_only: {
      title: '📊 Résumé quotidien',
      body: 'Vous avez reçu {income} en {count} revenus',
    },
  },
  pt: {
    daily_reminder: {
      title: 'Lembre-se de registrar suas despesas',
      body: 'Não esqueça de registrar as despesas de hoje 💰',
    },
    upcoming_transaction_scheduled: {
      title: 'Transação programada para amanhã',
      body: '{name} por {amount}',
    },
    upcoming_transaction_pending: {
      title: 'Transação pendente para amanhã',
      body: '{name} por {amount}',
    },
    upcoming_transactions_multiple: {
      title: 'Transações para amanhã',
      body: 'Você tem {count} transações por um total de {amount}',
    },
    budget_limit_warning: {
      title: '⚠️ Alerta de orçamento',
      body: 'Você atingiu 75% do seu orçamento de {category}',
    },
    budget_limit_exceeded: {
      title: '🚨 Orçamento excedido',
      body: 'Você excedeu seu limite de {category} por {amount}',
    },
    daily_summary_expenses_only: {
      title: '📊 Resumo diário',
      body: 'Você gastou {amount} em {count} transações. Categoria top: {category}',
    },
    daily_summary_with_income: {
      title: '📊 Resumo diário',
      body: 'Gastou {expenses}, recebeu {income}. Saldo: {balance}',
    },
    daily_summary_income_only: {
      title: '📊 Resumo diário',
      body: 'Você recebeu {income} em {count} receitas',
    },
  },
};

export function getLocalizedMessage(
  type: string,
  data: Record<string, any>,
  locale: string
): { title: string; body: string } {
  const lang = translations[locale as keyof typeof translations] || translations.es;
  const template = lang[type as keyof typeof lang] || lang.scheduled_transaction;

  let title = template.title;
  let body = template.body;

  // Reemplazar placeholders
  Object.keys(data).forEach((key) => {
    const placeholder = `{${key}}`;
    title = title.replace(placeholder, data[key]);
    body = body.replace(placeholder, data[key]);
  });

  return { title, body };
}
```

#### 4.5 Edge Function: Recordatorio Diario Inteligente

**Archivo:** `supabase/functions/schedule-daily-reminders/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const currentHour = new Date().getUTCHours();

    // Obtener usuarios con daily_reminder habilitado para esta hora
    const { data: tokens, error } = await supabase
      .from('push_tokens')
      .select(`
        id,
        token,
        platform,
        user_id,
        preferences,
        auth.users!inner(id),
        user_state!inner(id, data)
      `)
      .eq('is_active', true)
      .eq('preferences->daily_reminder->enabled', true);

    if (error) throw error;

    let sentCount = 0;
    let skippedCount = 0;

    for (const tokenData of tokens || []) {
      const { preferences, user_state } = tokenData;
      const reminderTime = preferences.daily_reminder?.time || '20:00';
      const [hour] = reminderTime.split(':').map(Number);

      // Verificar si es la hora correcta para este usuario
      // TODO: Ajustar por timezone del usuario
      if (currentHour !== hour) {
        continue;
      }

      // Verificar si ya hay transacciones hoy
      const today = new Date().toISOString().split('T')[0];
      const todayTransactions = user_state.data.transactions?.filter(
        (t: any) => t.date === today
      ) || [];

      if (todayTransactions.length > 0) {
        skippedCount++;
        continue; // Ya registró algo hoy, no enviar
      }

      // Verificar quiet hours
      if (isWithinQuietHours(preferences.quiet_hours)) {
        skippedCount++;
        continue;
      }

      // Enviar notificación
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            user_id: tokenData.user_id,
            notification_type: 'daily_reminder',
            data: {},
            locale: user_state.data.settings?.language || 'es',
          }),
        });

        sentCount++;
      } catch (error) {
        console.error(`Failed to send reminder to user ${tokenData.user_id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Daily reminders processed',
        sent: sentCount,
        skipped: skippedCount,
        total: tokens?.length || 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing daily reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

function isWithinQuietHours(quietHours: any): boolean {
  if (!quietHours?.enabled) return false;

  const now = new Date();
  const currentTime = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;
  const { start, end } = quietHours;

  const [currH, currM] = currentTime.split(':').map(Number);
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  const currMinutes = currH * 60 + currM;
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (endMinutes > startMinutes) {
    return currMinutes >= startMinutes && currMinutes <= endMinutes;
  } else {
    return currMinutes >= startMinutes || currMinutes <= endMinutes;
  }
}
```

---

#### 4.6 Edge Function: Transacciones Pendientes/Programadas

**Archivo:** `supabase/functions/schedule-transaction-alerts/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Obtener usuarios con transacciones para mañana
    const { data: users, error } = await supabase
      .from('user_state')
      .select(`
        id,
        data,
        auth.users!inner(id),
        push_tokens!inner(token, platform, preferences, is_active)
      `)
      .eq('push_tokens.is_active', true)
      .eq('push_tokens.preferences->scheduled_transactions', true);

    if (error) throw error;

    let sentCount = 0;

    for (const user of users || []) {
      const upcomingTransactions = getUpcomingTransactions(
        user.data,
        tomorrowStr
      );

      if (upcomingTransactions.length === 0) continue;

      // Determinar tipo de mensaje según cantidad
      let notificationType: string;
      let messageData: any;

      if (upcomingTransactions.length === 1) {
        const t = upcomingTransactions[0];
        notificationType = t.type === 'scheduled'
          ? 'upcoming_transaction_scheduled'
          : 'upcoming_transaction_pending';

        messageData = {
          name: t.name,
          amount: formatAmount(t.amount),
          transaction_id: t.id,
        };
      } else {
        notificationType = 'upcoming_transactions_multiple';
        const total = upcomingTransactions.reduce((sum, t) => sum + t.amount, 0);

        messageData = {
          count: upcomingTransactions.length,
          amount: formatAmount(total),
          transaction_ids: upcomingTransactions.map(t => t.id),
        };
      }

      // Enviar notificación
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            user_id: user.id,
            notification_type: notificationType,
            data: messageData,
            locale: user.data.settings?.language || 'es',
          }),
        });

        sentCount++;
      } catch (error) {
        console.error(`Failed to send alert to user ${user.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Transaction alerts processed',
        sent: sentCount,
        total: users?.length || 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing transaction alerts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

function getUpcomingTransactions(userData: any, tomorrowStr: string): any[] {
  const upcoming: any[] = [];

  // 1. Transacciones pendientes para mañana
  const pendingTransactions = userData.transactions?.filter(
    (t: any) => t.status === 'pending' && t.date === tomorrowStr
  ) || [];

  upcoming.push(
    ...pendingTransactions.map((t: any) => ({ ...t, type: 'pending' }))
  );

  // 2. Transacciones programadas para mañana
  const scheduledTemplates = userData.scheduledTransactions?.filter(
    (st: any) => {
      if (!st.is_active) return false;
      const nextOccurrence = calculateNextOccurrence(st);
      return nextOccurrence === tomorrowStr;
    }
  ) || [];

  upcoming.push(
    ...scheduledTemplates.map((st: any) => ({
      id: st.id,
      name: st.name,
      amount: st.amount,
      type: 'scheduled',
    }))
  );

  return upcoming;
}

function calculateNextOccurrence(scheduledTransaction: any): string {
  // Implementar lógica de cálculo de próxima ocurrencia
  // según recurrence type (daily, weekly, monthly, etc.)
  // Retornar fecha en formato "YYYY-MM-DD"
  // TODO: Implementar lógica completa
  return '';
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}
```

---

#### 4.7 Edge Function: Alertas de Presupuesto (Webhook)

**Archivo:** `supabase/functions/check-budget-alerts/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Obtener todos los presupuestos activos
    const { data: budgets, error } = await supabase
      .from('user_state')
      .select('id, data')
      .not('data->budgets', 'is', null);

    if (error) throw error;

    const alerts: Array<{ user_id: string; type: string; data: any }> = [];

    // 2. Calcular progreso y detectar alertas
    for (const user of budgets || []) {
      const budgetsData = user.data.budgets || [];

      for (const budget of budgetsData) {
        if (!budget.is_active) continue;

        const progress = calculateBudgetProgress(budget, user.data.transactions);

        // Alerta al 75%
        if (progress >= 75 && progress < 100 && !budget.alert_75_sent) {
          alerts.push({
            user_id: user.id,
            type: 'budget_limit_warning',
            data: {
              category: budget.category_name,
              percentage: progress.toFixed(0),
            },
          });
        }

        // Alerta al exceder
        if (progress >= 100 && !budget.alert_100_sent) {
          const exceeded = budget.current_amount - budget.limit;
          alerts.push({
            user_id: user.id,
            type: 'budget_limit_exceeded',
            data: {
              category: budget.category_name,
              amount: `$${exceeded.toLocaleString()}`,
            },
          });
        }
      }
    }

    // 3. Enviar notificaciones
    const sendPromises = alerts.map((alert) =>
      fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          user_id: alert.user_id,
          notification_type: alert.type,
          data: alert.data,
        }),
      })
    );

    await Promise.allSettled(sendPromises);

    return new Response(
      JSON.stringify({ message: 'Budget alerts processed', count: alerts.length }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing budget alerts:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

function calculateBudgetProgress(budget: any, transactions: any[]): number {
  // Implementar lógica de cálculo
  // Filtrar transacciones del período del presupuesto
  // Calcular porcentaje
  return 0; // Placeholder
}
```

#### 4.8 Edge Function: Resumen Diario

**Archivo:** `supabase/functions/schedule-daily-summaries/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const currentHour = new Date().getUTCHours();

    // Obtener usuarios con daily_summary habilitado
    const { data: users, error } = await supabase
      .from('user_state')
      .select(`
        id,
        data,
        auth.users!inner(id),
        push_tokens!inner(token, platform, preferences, is_active)
      `)
      .eq('push_tokens.is_active', true)
      .eq('push_tokens.preferences->daily_summary->enabled', true);

    if (error) throw error;

    let sentCount = 0;
    let skippedCount = 0;

    for (const user of users || []) {
      const token = user.push_tokens[0];
      const { preferences } = token;
      const summaryTime = preferences.daily_summary?.time || '20:00';
      const [hour] = summaryTime.split(':').map(Number);

      // Verificar si es la hora correcta
      // TODO: Ajustar por timezone
      if (currentHour !== hour) {
        continue;
      }

      // Calcular estadísticas del día
      const today = new Date().toISOString().split('T')[0];
      const todayTransactions = user.data.transactions?.filter(
        (t: any) => t.date === today
      ) || [];

      if (todayTransactions.length === 0) {
        skippedCount++;
        continue; // No hay actividad hoy, no enviar
      }

      // Verificar quiet hours
      if (isWithinQuietHours(preferences.quiet_hours)) {
        skippedCount++;
        continue;
      }

      // Calcular estadísticas
      const stats = calculateDailySummary(todayTransactions);

      // Determinar tipo de mensaje
      let notificationType: string;
      if (stats.expenseCount > 0 && stats.incomeCount > 0) {
        notificationType = 'daily_summary_with_income';
      } else if (stats.expenseCount > 0) {
        notificationType = 'daily_summary_expenses_only';
      } else {
        notificationType = 'daily_summary_income_only';
      }

      // Enviar notificación
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            user_id: user.id,
            notification_type: notificationType,
            data: {
              amount: formatAmount(stats.totalExpenses),
              count: stats.expenseCount,
              category: stats.topCategory,
              expenses: formatAmount(stats.totalExpenses),
              income: formatAmount(stats.totalIncome),
              balance: formatAmount(stats.balance),
            },
            locale: user.data.settings?.language || 'es',
          }),
        });

        sentCount++;
      } catch (error) {
        console.error(`Failed to send summary to user ${user.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Daily summaries processed',
        sent: sentCount,
        skipped: skippedCount,
        total: users?.length || 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing daily summaries:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

function calculateDailySummary(transactions: any[]): any {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const income = transactions.filter((t) => t.type === 'income');

  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  // Categoría con más gasto
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((t) => {
    categoryTotals[t.category_name] =
      (categoryTotals[t.category_name] || 0) + t.amount;
  });

  const topCategoryEntry = Object.entries(categoryTotals).sort(
    ([, a], [, b]) => b - a
  )[0];

  return {
    expenseCount: expenses.length,
    incomeCount: income.length,
    totalExpenses,
    totalIncome,
    balance,
    topCategory: topCategoryEntry ? topCategoryEntry[0] : null,
    topCategoryAmount: topCategoryEntry ? topCategoryEntry[1] : 0,
  };
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

function isWithinQuietHours(quietHours: any): boolean {
  if (!quietHours?.enabled) return false;

  const now = new Date();
  const currentTime = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;
  const { start, end } = quietHours;

  const [currH, currM] = currentTime.split(':').map(Number);
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  const currMinutes = currH * 60 + currM;
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (endMinutes > startMinutes) {
    return currMinutes >= startMinutes && currMinutes <= endMinutes;
  } else {
    return currMinutes >= startMinutes || currMinutes <= endMinutes;
  }
}
```

---

#### 4.9 Configurar Cron Jobs en Supabase

**Dashboard Supabase → Database → Cron Jobs**

```sql
-- 1. Recordatorio diario inteligente - Ejecutar cada hora (usuarios configuran su hora)
select cron.schedule(
  'hourly-daily-reminders',
  '0 * * * *',  -- Cada hora en punto
  $$
    select
      net.http_post(
        url := 'https://YOUR_PROJECT.supabase.co/functions/v1/schedule-daily-reminders',
        headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
      ) as request_id;
  $$
);

-- 2. Transacciones pendientes/programadas - Ejecutar diariamente a las 9:00 AM UTC
select cron.schedule(
  'daily-transaction-alerts',
  '0 9 * * *',
  $$
    select
      net.http_post(
        url := 'https://YOUR_PROJECT.supabase.co/functions/v1/schedule-transaction-alerts',
        headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
      ) as request_id;
  $$
);

-- 3. Resumen diario - Ejecutar cada hora entre 18:00-23:00 UTC (usuarios configuran su hora)
select cron.schedule(
  'hourly-daily-summaries',
  '0 18-23 * * *',  -- Cada hora entre 18:00 y 23:00
  $$
    select
      net.http_post(
        url := 'https://YOUR_PROJECT.supabase.co/functions/v1/schedule-daily-summaries',
        headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
      ) as request_id;
  $$
);

-- 4. Verificar cron jobs activos
SELECT * FROM cron.job;

-- 5. Eliminar un cron job (si es necesario)
-- SELECT cron.unschedule('job_name');
```

**Notas sobre Cron Jobs:**
- `hourly-daily-reminders`: Se ejecuta cada hora. La Edge Function filtra usuarios según su hora configurada.
- `daily-transaction-alerts`: Se ejecuta una vez al día a las 9 AM UTC (3 AM COT).
- `hourly-daily-summaries`: Se ejecuta cada hora entre 6 PM y 11 PM UTC (1 PM - 6 PM COT). La Edge Function filtra usuarios según su hora configurada.

**Optimización de horarios por timezone:**
En la implementación real, considera:
1. Almacenar el timezone del usuario en `user_state.data.settings.timezone`
2. Calcular la hora UTC equivalente a la hora local del usuario
3. Ejecutar cron jobs más frecuentemente (cada 30 min) para mejor granularidad

---

### Fase 5: UI - Pantalla de Preferencias (Semana 3-4)

#### 5.1 Crear `NotificationSettingsPage`

**Archivo:** `src/pages/NotificationSettingsPage.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Clock } from 'lucide-react';
import { pushNotificationService } from '@/services/pushNotification.service';
import type { NotificationPreferences } from '@/types/notifications';
import { useTranslation } from 'react-i18next';

export default function NotificationSettingsPage() {
  const { t } = useTranslation('notifications');
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      const prefs = await pushNotificationService.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(key: keyof NotificationPreferences, value: boolean) {
    if (!preferences) return;

    const updated = { ...preferences, [key]: value };
    setPreferences(updated);

    try {
      await pushNotificationService.updatePreferences({ [key]: value });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      // Revertir cambio
      setPreferences(preferences);
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">
      <div className="text-gray-500">{t('loading')}</div>
    </div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {t('title')}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-6 pb-8 space-y-6">
        {/* Notification Types */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            {t('sections.types')}
          </h2>
          <div className="space-y-2">
            <ToggleRow
              icon={<Bell size={20} />}
              label={t('types.scheduled_transactions')}
              description={t('types.scheduled_transactions_desc')}
              value={preferences?.scheduled_transactions ?? true}
              onChange={(val) => handleToggle('scheduled_transactions', val)}
            />
            <ToggleRow
              icon={<Bell size={20} />}
              label={t('types.budget_alerts')}
              description={t('types.budget_alerts_desc')}
              value={preferences?.budget_alerts ?? true}
              onChange={(val) => handleToggle('budget_alerts', val)}
            />
          </div>
        </section>

        {/* Daily Reminder (with time picker) */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            {t('sections.daily_reminder')}
          </h2>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <Bell size={20} className="text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {t('types.daily_reminder')}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t('types.daily_reminder_desc')}
                  </p>
                  {preferences?.daily_reminder?.enabled && (
                    <p className="mt-2 text-sm text-teal-600">
                      {t('time_configured')}: {preferences.daily_reminder.time}
                    </p>
                  )}
                </div>
              </div>
              <ToggleSwitch
                value={preferences?.daily_reminder?.enabled ?? false}
                onChange={(val) => {
                  if (!preferences) return;
                  const updated = {
                    ...preferences,
                    daily_reminder: {
                      ...preferences.daily_reminder,
                      enabled: val,
                    },
                  };
                  setPreferences(updated);
                  pushNotificationService.updatePreferences({
                    daily_reminder: updated.daily_reminder,
                  });
                }}
              />
            </div>

            {/* Time Picker (si está habilitado) */}
            {preferences?.daily_reminder?.enabled && (
              <div className="mt-4">
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  {t('select_time')}
                </label>
                <input
                  type="time"
                  value={preferences.daily_reminder.time}
                  onChange={(e) => {
                    const updated = {
                      ...preferences,
                      daily_reminder: {
                        ...preferences.daily_reminder,
                        time: e.target.value,
                      },
                    };
                    setPreferences(updated);
                    pushNotificationService.updatePreferences({
                      daily_reminder: updated.daily_reminder,
                    });
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                />
              </div>
            )}
          </div>
        </section>

        {/* Daily Summary (with time picker) */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            {t('sections.daily_summary')}
          </h2>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <Bell size={20} className="text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {t('types.daily_summary')}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t('types.daily_summary_desc')}
                  </p>
                  {preferences?.daily_summary?.enabled && (
                    <p className="mt-2 text-sm text-teal-600">
                      {t('time_configured')}: {preferences.daily_summary.time}
                    </p>
                  )}
                </div>
              </div>
              <ToggleSwitch
                value={preferences?.daily_summary?.enabled ?? false}
                onChange={(val) => {
                  if (!preferences) return;
                  const updated = {
                    ...preferences,
                    daily_summary: {
                      ...preferences.daily_summary,
                      enabled: val,
                    },
                  };
                  setPreferences(updated);
                  pushNotificationService.updatePreferences({
                    daily_summary: updated.daily_summary,
                  });
                }}
              />
            </div>

            {/* Time Picker (si está habilitado) */}
            {preferences?.daily_summary?.enabled && (
              <div className="mt-4">
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  {t('select_time')}
                </label>
                <input
                  type="time"
                  value={preferences.daily_summary.time}
                  onChange={(e) => {
                    const updated = {
                      ...preferences,
                      daily_summary: {
                        ...preferences.daily_summary,
                        time: e.target.value,
                      },
                    };
                    setPreferences(updated);
                    pushNotificationService.updatePreferences({
                      daily_summary: updated.daily_summary,
                    });
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                />
              </div>
            )}
          </div>
        </section>

        {/* Quiet Hours */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            {t('sections.quiet_hours')}
          </h2>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <Clock size={20} className="text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {t('quiet_hours.title')}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t('quiet_hours.description')}
                  </p>
                  {preferences?.quiet_hours?.enabled && (
                    <p className="mt-2 text-sm text-teal-600">
                      {preferences.quiet_hours.start} - {preferences.quiet_hours.end}
                    </p>
                  )}
                </div>
              </div>
              <ToggleSwitch
                value={preferences?.quiet_hours?.enabled ?? false}
                onChange={(val) => {
                  if (!preferences) return;
                  const updated = {
                    ...preferences,
                    quiet_hours: {
                      ...preferences.quiet_hours,
                      enabled: val,
                    },
                  };
                  setPreferences(updated);
                  pushNotificationService.updatePreferences({
                    quiet_hours: updated.quiet_hours,
                  });
                }}
              />
            </div>

            {/* Time Pickers (si está habilitado) */}
            {preferences?.quiet_hours?.enabled && (
              <div className="mt-4 flex gap-4">
                {/* Implementar time pickers */}
              </div>
            )}
          </div>
        </section>

        {/* Help Text */}
        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            💡 {t('help_text')}
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function ToggleRow({
  icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
            {icon}
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{label}</p>
            <p className="mt-1 text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <ToggleSwitch value={value} onChange={onChange} />
      </div>
    </div>
  );
}

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-all duration-200 ${
        value ? 'bg-emerald-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
          value ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
```

#### 5.2 Agregar Ruta

**Archivo:** `src/App.tsx` (agregar ruta)

```typescript
<Route path="/notifications" element={<NotificationSettingsPage />} />
```

#### 5.3 Agregar Link en ProfilePage

**Archivo:** `src/pages/ProfilePage.tsx` (agregar botón)

```typescript
<button
  type="button"
  onClick={() => navigate('/notifications')}
  className="flex w-full items-center gap-3 rounded-xl bg-white p-4 shadow-sm hover:bg-gray-50 transition-colors"
>
  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50">
    <Bell className="h-5 w-5 text-teal-600" />
  </div>
  <span className="flex-1 text-left font-medium text-gray-900">
    {t('profile.notifications')}
  </span>
  <ChevronRight className="h-5 w-5 text-gray-300" />
</button>
```

#### 5.4 Agregar Traducciones

**Archivo:** `src/locales/es/notifications.json`

```json
{
  "title": "Notificaciones",
  "loading": "Cargando preferencias...",
  "sections": {
    "types": "Notificaciones básicas",
    "daily_reminder": "Recordatorio diario",
    "daily_summary": "Resumen diario",
    "quiet_hours": "Horario silencioso"
  },
  "types": {
    "scheduled_transactions": "Transacciones pendientes/programadas",
    "scheduled_transactions_desc": "Alertas 1 día antes de transacciones pendientes o programadas",
    "budget_alerts": "Alertas de presupuesto",
    "budget_alerts_desc": "Avisos al alcanzar 75% o exceder límites",
    "daily_reminder": "Recordatorio de registro",
    "daily_reminder_desc": "Recuerda registrar tus movimientos si no has registrado nada en el día",
    "daily_summary": "Resumen diario",
    "daily_summary_desc": "Resumen de gastos e ingresos al final del día (solo si hay actividad)"
  },
  "time_configured": "Hora configurada",
  "select_time": "Selecciona la hora",
  "quiet_hours": {
    "title": "No molestar",
    "description": "Silenciar notificaciones en horario específico"
  },
  "help_text": "Las notificaciones te ayudan a mantener el control de tus finanzas. Puedes personalizarlas según tus necesidades."
}
```

**Archivo:** `src/locales/en/notifications.json`

```json
{
  "title": "Notifications",
  "loading": "Loading preferences...",
  "sections": {
    "types": "Basic notifications",
    "daily_reminder": "Daily reminder",
    "daily_summary": "Daily summary",
    "quiet_hours": "Quiet hours"
  },
  "types": {
    "scheduled_transactions": "Pending/scheduled transactions",
    "scheduled_transactions_desc": "Alerts 1 day before pending or scheduled transactions",
    "budget_alerts": "Budget alerts",
    "budget_alerts_desc": "Alerts when reaching 75% or exceeding limits",
    "daily_reminder": "Log reminder",
    "daily_reminder_desc": "Reminds you to log expenses if you haven't logged anything today",
    "daily_summary": "Daily summary",
    "daily_summary_desc": "Summary of expenses and income at end of day (only if there's activity)"
  },
  "time_configured": "Time configured",
  "select_time": "Select time",
  "quiet_hours": {
    "title": "Do not disturb",
    "description": "Silence notifications during specific hours"
  },
  "help_text": "Notifications help you stay on top of your finances. You can customize them according to your needs."
}
```

---

### Fase 6: Testing y Optimización (Semana 4)

#### 6.1 Unit Tests

**Archivo:** `src/services/__tests__/pushNotification.service.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pushNotificationService } from '../pushNotification.service';

vi.mock('@capacitor-firebase/messaging', () => ({
  FirebaseMessaging: {
    requestPermissions: vi.fn(),
    getToken: vi.fn(),
    addListener: vi.fn(),
  },
}));

describe('PushNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize successfully', async () => {
    // Implementar tests
  });

  it('should request permissions', async () => {
    // Implementar tests
  });

  it('should get FCM token', async () => {
    // Implementar tests
  });

  // ... más tests
});
```

#### 6.2 E2E Tests (Playwright)

**Archivo:** `e2e/push-notifications.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Push Notifications Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login como usuario autenticado
    // ...
  });

  test('should navigate to notification settings', async ({ page }) => {
    await page.click('[data-testid="profile-link"]');
    await page.click('[data-testid="notifications-button"]');

    await expect(page.locator('h1')).toContainText('Notificaciones');
  });

  test('should toggle notification preferences', async ({ page }) => {
    await page.goto('/notifications');

    const toggle = page.locator('[data-testid="budget-alerts-toggle"]');
    const initialState = await toggle.isChecked();

    await toggle.click();
    await page.waitForTimeout(500); // Wait for backend update

    const newState = await toggle.isChecked();
    expect(newState).toBe(!initialState);
  });

  // ... más tests
});
```

#### 6.3 Testing Manual

**Checklist:**
- [ ] Permisos en iOS (Settings → SmartSpend → Notifications)
- [ ] Permisos en Android (Settings → Apps → SmartSpend → Notifications)
- [ ] Token se guarda en Supabase correctamente
- [ ] Notificación de prueba desde Firebase Console llega al dispositivo
- [ ] Notificación aparece en foreground
- [ ] Tap en notificación navega a pantalla correcta
- [ ] Preferencias se actualizan en tiempo real
- [ ] Quiet hours funcionan correctamente
- [ ] Multiple devices reciben notificaciones
- [ ] Token se actualiza al reinstalar app

#### 6.4 Performance Optimization

**Backend:**
- [ ] Implementar rate limiting en Edge Functions
- [ ] Batch envío de notificaciones (máx 500 tokens por request FCM)
- [ ] Índices de base de datos optimizados
- [ ] Caching de access tokens FCM

**Frontend:**
- [ ] Lazy load de página de configuración
- [ ] Debounce en toggles (evitar múltiples requests)
- [ ] Error handling robusto con retry logic
- [ ] Offline queue para notificaciones fallidas

---

## 📱 Casos de Uso Detallados

### Caso 1: Recordatorio Diario Inteligente

**Descripción:** Notificación a hora configurable para recordar registrar movimientos, pero SOLO si el usuario no ha registrado nada en el día.

**Trigger:** Cron job configurable por usuario (hora personalizada)

**Lógica de Negocio:**
```typescript
// Pseudocódigo de la lógica
function shouldSendDailyReminder(user) {
  // 1. Verificar si el usuario tiene habilitado el recordatorio
  if (!user.preferences.daily_reminder.enabled) return false;

  // 2. Obtener transacciones del día actual (en timezone del usuario)
  const today = getUserLocalDate(user.timezone); // "2026-01-28"
  const todayTransactions = user.transactions.filter(t => t.date === today);

  // 3. Solo enviar si NO hay transacciones del día
  if (todayTransactions.length > 0) return false;

  // 4. Verificar quiet hours
  if (isWithinQuietHours(user.preferences.quiet_hours)) return false;

  return true;
}
```

**Flow Completo:**
1. **Cron Job Multiple:** Sistema ejecuta edge function cada hora (o cada 30min)
2. **Query Inteligente:**
   ```sql
   -- Obtener usuarios cuyo recordatorio debe ejecutarse en esta hora
   SELECT u.id, u.data, pt.token, pt.preferences
   FROM auth.users u
   JOIN user_state us ON us.id = u.id
   JOIN push_tokens pt ON pt.user_id = u.id
   WHERE pt.is_active = true
     AND pt.preferences->>'daily_reminder'->>'enabled' = 'true'
     AND EXTRACT(HOUR FROM NOW() AT TIME ZONE u.timezone) =
         (pt.preferences->>'daily_reminder'->>'time')::TIME::HOUR
   ```
3. **Verificación de Actividad:**
   - Edge Function obtiene `user_state.data.transactions`
   - Filtra transacciones con `date = today` (en timezone del usuario)
   - Si `todayTransactions.length === 0` → Enviar notificación
   - Si `todayTransactions.length > 0` → Skip
4. **Mensaje Localizado:**
   - **ES:** "Recuerda registrar tus movimientos del día 💰"
   - **EN:** "Remember to log your expenses today 💰"
   - **FR:** "N'oubliez pas d'enregistrer vos dépenses aujourd'hui 💰"
   - **PT:** "Lembre-se de registrar suas despesas hoje 💰"
5. **Data Payload:**
   ```json
   {
     "type": "daily_reminder",
     "action": "add_transaction"
   }
   ```
6. **Navegación al Tap:**
   - App detecta `type: daily_reminder`
   - Navega a `/add` (pantalla de agregar transacción)

**Configuración de Usuario:**
```json
{
  "daily_reminder": {
    "enabled": true,
    "time": "20:00"  // Hora local del usuario
  }
}
```

**Edge Function:** `schedule-daily-reminders/index.ts`

**Optimización:**
- Cache de usuarios ya procesados en la hora actual (evitar duplicados)
- Batch de máximo 100 usuarios por ejecución
- Rate limiting: 1 recordatorio por usuario por día

---

### Caso 2: Transacciones Pendientes/Programadas (1 día antes)

**Descripción:** Notificación 1 día antes de que se ejecute una transacción pendiente o programada, indicando el tipo, nombre y monto.

**Trigger:** Cron job diario a las 9:00 AM (hora del servidor, ajustado por timezone)

**Lógica de Negocio:**
```typescript
// Pseudocódigo
function getUpcomingTransactions(user) {
  const tomorrow = addDays(getUserLocalDate(user.timezone), 1);

  // Buscar transacciones programadas para mañana
  const scheduledTemplates = user.scheduledTransactions
    .filter(st => st.is_active && getNextOccurrence(st) === tomorrow);

  // Buscar transacciones con estado "pending" para mañana
  const pendingTransactions = user.transactions
    .filter(t => t.status === 'pending' && t.date === tomorrow);

  return {
    scheduled: scheduledTemplates,
    pending: pendingTransactions
  };
}
```

**Flow Completo:**
1. **Cron Job Diario:** Ejecuta a las 9:00 AM UTC
2. **Query de Transacciones:**
   ```sql
   -- Obtener usuarios con transacciones para mañana
   WITH tomorrow_date AS (
     SELECT (CURRENT_DATE + INTERVAL '1 day')::TEXT as date
   )
   SELECT
     u.id as user_id,
     us.data as user_data,
     pt.token,
     pt.platform,
     pt.preferences
   FROM auth.users u
   JOIN user_state us ON us.id = u.id
   JOIN push_tokens pt ON pt.user_id = u.id
   CROSS JOIN tomorrow_date
   WHERE pt.is_active = true
     AND pt.preferences->>'scheduled_transactions' = 'true'
     AND (
       -- Tiene transacciones programadas activas
       EXISTS (
         SELECT 1 FROM jsonb_array_elements(us.data->'scheduledTransactions') st
         WHERE st->>'is_active' = 'true'
       )
       OR
       -- Tiene transacciones pendientes
       EXISTS (
         SELECT 1 FROM jsonb_array_elements(us.data->'transactions') t
         WHERE t->>'status' = 'pending'
           AND t->>'date' = tomorrow_date.date
       )
     )
   ```
3. **Procesamiento por Usuario:**
   - Calcular `nextOccurrence` para cada `scheduledTransaction`
   - Filtrar las que caen en `tomorrow`
   - Filtrar transacciones con `status: 'pending'` y `date: tomorrow`
4. **Composición de Mensajes:**

   **Para Transacciones Programadas:**
   - **ES:** "Transacción programada para mañana: {name} por {amount}"
   - **EN:** "Scheduled transaction for tomorrow: {name} for {amount}"
   - **FR:** "Transaction programmée pour demain: {name} pour {amount}"
   - **PT:** "Transação programada para amanhã: {name} por {amount}"

   **Para Transacciones Pendientes:**
   - **ES:** "Transacción pendiente para mañana: {name} por {amount}"
   - **EN:** "Pending transaction for tomorrow: {name} for {amount}"
   - **FR:** "Transaction en attente pour demain: {name} pour {amount}"
   - **PT:** "Transação pendente para amanhã: {name} por {amount}"

5. **Agrupación (si hay múltiples):**
   - Si hay 1 transacción: Mensaje individual
   - Si hay 2-3 transacciones: "Tienes 2 transacciones para mañana: Netflix ($14.990) y Spotify ($9.990)"
   - Si hay 4+: "Tienes 5 transacciones programadas para mañana por un total de $89.990"

6. **Data Payload:**
   ```json
   {
     "type": "upcoming_transaction",
     "transaction_type": "scheduled", // o "pending"
     "transaction_ids": ["uuid1", "uuid2"],
     "count": 2
   }
   ```

7. **Navegación al Tap:**
   - Si es 1 transacción: Navega a detalle de transacción `/transaction/{id}`
   - Si son múltiples: Navega a `/scheduled` con filtro de "upcoming"

**Edge Function:** `schedule-transaction-reminders/index.ts`

**Optimización:**
- Deduplicación: Si una transacción programada ya generó una transacción real, no notificar
- Timezone handling: Calcular "mañana" según timezone del usuario
- Batch processing: Procesar 50 usuarios por batch

---

### Caso 3: Alerta de Límite de Presupuesto

**Descripción:** Notificación cuando el usuario alcanza el 75% o 100% de un presupuesto activo.

**Trigger:** Database trigger al insertar/actualizar transacción que afecta un presupuesto

**Lógica de Negocio:**
```typescript
// Pseudocódigo
function checkBudgetAlerts(transaction, budgets) {
  const affectedBudgets = budgets.filter(b =>
    b.is_active &&
    b.category_id === transaction.category_id &&
    isWithinPeriod(transaction.date, b.start_date, b.end_date)
  );

  for (const budget of affectedBudgets) {
    const progress = calculateProgress(budget, transactions);

    // Alerta 75%
    if (progress >= 75 && progress < 100 && !budget.alert_75_sent) {
      sendAlert('budget_limit_warning', { budget, progress });
      markAlertSent(budget.id, '75');
    }

    // Alerta 100%
    if (progress >= 100 && !budget.alert_100_sent) {
      const exceeded = budget.current_amount - budget.limit;
      sendAlert('budget_limit_exceeded', { budget, exceeded });
      markAlertSent(budget.id, '100');
    }
  }
}
```

**Flow Completo:**
1. **Trigger Event:** Usuario guarda nueva transacción
2. **Cloud Sync:** Frontend sincroniza cambios a `user_state`
3. **Database Webhook:**
   ```sql
   -- Crear webhook en Supabase Dashboard
   CREATE OR REPLACE FUNCTION notify_budget_changes()
   RETURNS TRIGGER AS $$
   BEGIN
     PERFORM net.http_post(
       url := 'https://YOUR_PROJECT.supabase.co/functions/v1/check-budget-alerts',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := json_build_object(
         'user_id', NEW.id,
         'transaction_id', (NEW.data->'transactions'->-1)->>'id'
       )::jsonb
     );
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER on_user_state_update
     AFTER UPDATE ON user_state
     FOR EACH ROW
     WHEN (OLD.data->>'transactions' IS DISTINCT FROM NEW.data->>'transactions')
     EXECUTE FUNCTION notify_budget_changes();
   ```

4. **Edge Function `check-budget-alerts`:**
   - Recibe `user_id` y `transaction_id`
   - Obtiene `user_state.data`
   - Identifica presupuestos activos afectados por la transacción
   - Calcula progreso actual
   - Determina si enviar alerta (75% o 100%)

5. **Cálculo de Progreso:**
   ```typescript
   function calculateProgress(budget, transactions) {
     const relevantTransactions = transactions.filter(t =>
       t.category_id === budget.category_id &&
       t.type === 'expense' &&
       t.date >= budget.start_date &&
       t.date <= budget.end_date
     );

     const spent = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);

     if (budget.type === 'spending_limit') {
       return (spent / budget.limit) * 100;
     } else {
       // savings_goal
       return (spent / budget.goal) * 100;
     }
   }
   ```

6. **Mensajes Localizados:**

   **Alerta 75%:**
   - **ES:** "⚠️ Alerta: Has alcanzado el 75% de tu presupuesto de {category}"
   - **EN:** "⚠️ Alert: You've reached 75% of your {category} budget"
   - **FR:** "⚠️ Alerte: Vous avez atteint 75% de votre budget {category}"
   - **PT:** "⚠️ Alerta: Você atingiu 75% do seu orçamento de {category}"

   **Alerta 100%:**
   - **ES:** "🚨 Presupuesto excedido: Has superado tu límite de {category} por {amount}"
   - **EN:** "🚨 Budget exceeded: You've exceeded your {category} limit by {amount}"
   - **FR:** "🚨 Budget dépassé: Vous avez dépassé votre limite {category} de {amount}"
   - **PT:** "🚨 Orçamento excedido: Você excedeu seu limite de {category} por {amount}"

7. **Data Payload:**
   ```json
   {
     "type": "budget_alert",
     "alert_level": "75", // o "100"
     "budget_id": "uuid",
     "category_name": "Restaurantes",
     "progress": 78.5,
     "exceeded_amount": 15000  // solo si > 100%
   }
   ```

8. **Navegación al Tap:**
   - Navega a `/budget/detail/{budget_id}`
   - Muestra el presupuesto con animación destacada

**Edge Functions:**
- `check-budget-alerts/index.ts` (webhook trigger)
- `send-push-notification/index.ts` (envío actual)

**Prevención de Duplicados:**
- Agregar campos en budget object:
  ```typescript
  {
    alert_75_sent: boolean,
    alert_75_sent_at: string | null,
    alert_100_sent: boolean,
    alert_100_sent_at: string | null
  }
  ```
- Resetear flags cuando se renueva el presupuesto

---

### Caso 4: Resumen Diario Opcional

**Descripción:** Notificación al final del día con resumen de actividad financiera, solo si hubo movimientos.

**Trigger:** Cron job configurable por usuario (hora personalizada, por defecto 8:00 PM)

**Lógica de Negocio:**
```typescript
function shouldSendDailySummary(user) {
  // 1. Verificar si está habilitado
  if (!user.preferences.daily_summary.enabled) return false;

  // 2. Obtener transacciones del día
  const today = getUserLocalDate(user.timezone);
  const todayTransactions = user.transactions.filter(t => t.date === today);

  // 3. Solo enviar si HAY actividad
  if (todayTransactions.length === 0) return false;

  // 4. Verificar quiet hours
  if (isWithinQuietHours(user.preferences.quiet_hours)) return false;

  return true;
}
```

**Flow Completo:**
1. **Cron Job Multiple:** Ejecuta cada hora entre 6:00 PM - 11:00 PM
2. **Query de Usuarios Elegibles:**
   ```sql
   SELECT u.id, us.data, pt.token, pt.preferences
   FROM auth.users u
   JOIN user_state us ON us.id = u.id
   JOIN push_tokens pt ON pt.user_id = u.id
   WHERE pt.is_active = true
     AND pt.preferences->'daily_summary'->>'enabled' = 'true'
     AND EXTRACT(HOUR FROM NOW() AT TIME ZONE u.timezone) =
         (pt.preferences->'daily_summary'->>'time')::TIME::HOUR
   ```

3. **Cálculo de Estadísticas:**
   ```typescript
   function calculateDailySummary(transactions) {
     const expenses = transactions.filter(t => t.type === 'expense');
     const income = transactions.filter(t => t.type === 'income');

     const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
     const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
     const balance = totalIncome - totalExpenses;

     // Categoría con más gasto
     const categoryTotals = {};
     expenses.forEach(t => {
       categoryTotals[t.category_name] = (categoryTotals[t.category_name] || 0) + t.amount;
     });
     const topCategory = Object.entries(categoryTotals)
       .sort(([,a], [,b]) => b - a)[0];

     return {
       expenseCount: expenses.length,
       incomeCount: income.length,
       totalExpenses,
       totalIncome,
       balance,
       topCategory: topCategory ? topCategory[0] : null,
       topCategoryAmount: topCategory ? topCategory[1] : 0
     };
   }
   ```

4. **Composición de Mensajes:**

   **Casos según actividad:**

   a) **Solo gastos:**
   - **ES:** "📊 Resumen del día: Gastaste {amount} en {count} transacciones. Categoría top: {category}"
   - **EN:** "📊 Daily summary: You spent {amount} in {count} transactions. Top category: {category}"

   b) **Gastos e ingresos:**
   - **ES:** "📊 Resumen del día: Gastaste {expenses}, recibiste {income}. Balance: {balance}"
   - **EN:** "📊 Daily summary: Spent {expenses}, earned {income}. Balance: {balance}"

   c) **Solo ingresos:**
   - **ES:** "📊 Resumen del día: Registraste {income} en {count} ingresos"
   - **EN:** "📊 Daily summary: You earned {income} in {count} incomes"

5. **Ejemplos Reales:**
   - "📊 Resumen del día: Gastaste $45.000 en 3 transacciones. Categoría top: Comida ($25.000)"
   - "📊 Daily summary: Spent $120.50 in 5 transactions. Top category: Transport ($45.20)"
   - "📊 Resumen del día: Gastaste $85.000, recibiste $200.000. Balance: +$115.000"

6. **Data Payload:**
   ```json
   {
     "type": "daily_summary",
     "date": "2026-01-28",
     "stats": {
       "total_expenses": 45000,
       "total_income": 0,
       "transaction_count": 3,
       "top_category": "Comida"
     }
   }
   ```

7. **Navegación al Tap:**
   - Navega a `/stats` con filtro de hoy
   - Muestra desglose detallado del día

**Configuración de Usuario:**
```json
{
  "daily_summary": {
    "enabled": true,
    "time": "20:00"  // Hora local
  }
}
```

**Edge Function:** `schedule-daily-summaries/index.ts`

**Optimización:**
- Cache de resúmenes calculados
- Limitar a 1 resumen por usuario por día
- No enviar si el usuario ya abrió la app después de la última transacción

---

## 🔒 Seguridad y Privacy

### Consideraciones de Seguridad

1. **Token Storage:**
   - Tokens FCM son sensibles, almacenar con RLS habilitado
   - NUNCA exponer tokens en logs o respuestas de API
   - Invalidar tokens al hacer logout

2. **Authentication:**
   - Edge Functions requieren `service_role_key` para escribir en `notification_history`
   - Frontend solo puede modificar sus propios tokens (RLS)

3. **Rate Limiting:**
   - Limitar cantidad de notificaciones por usuario/día
   - Prevenir spam de notificaciones

4. **Data Privacy:**
   - No incluir información sensible en payload de notificación
   - Usar `data` field para pasar IDs, cargar detalles en la app

### GDPR/Privacy Compliance

- [ ] Obtener consentimiento explícito antes de registrar token
- [ ] Proveer opción de deshabilitar todas las notificaciones
- [ ] Permitir eliminación de tokens (derecho al olvido)
- [ ] Transparencia en uso de datos (Privacy Policy)

---

## 📊 Métricas y Monitoreo

### Métricas Clave

1. **Engagement:**
   - Tasa de apertura (clicked / sent)
   - Tiempo promedio hasta click
   - Notificaciones por usuario/día

2. **Delivery:**
   - Tasa de éxito (sent / total)
   - Tasa de fallo por plataforma
   - Latencia promedio de entrega

3. **User Behavior:**
   - Tipos de notificaciones más clickeadas
   - Horarios de mayor engagement
   - Tasa de opt-out

### Dashboard en Supabase

**Query para métricas:**
```sql
-- Tasa de apertura últimos 7 días
SELECT
  notification_type,
  COUNT(*) FILTER (WHERE status = 'sent') AS sent,
  COUNT(*) FILTER (WHERE status = 'clicked') AS clicked,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'clicked')::decimal /
    NULLIF(COUNT(*) FILTER (WHERE status = 'sent'), 0) * 100,
    2
  ) AS open_rate
FROM notification_history
WHERE sent_at >= NOW() - INTERVAL '7 days'
GROUP BY notification_type
ORDER BY open_rate DESC;
```

---

## 🚀 Roadmap Futuro

### Post-MVP Features

1. **Rich Notifications:**
   - Imágenes en notificaciones
   - Botones de acción (Confirmar, Posponer, Ver)
   - Inline reply

2. **Notification Center:**
   - Inbox de notificaciones dentro de la app
   - Historial persistente

3. **Smart Scheduling:**
   - ML para determinar mejor horario por usuario
   - Análisis de engagement patterns

4. **Segmentation:**
   - Campañas segmentadas por comportamiento
   - A/B testing de mensajes

5. **Multi-Language Fallback:**
   - Detectar idioma del dispositivo automáticamente
   - Override en preferencias de usuario

---

## 📚 Recursos y Documentación

### Documentación Oficial

- [Capacitor Firebase Messaging Plugin](https://github.com/capawesome-team/capacitor-firebase/tree/main/packages/messaging)
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [APNs Documentation (Apple)](https://developer.apple.com/documentation/usernotifications)

### Tutoriales y Guías

- [The Complete Guide to Capacitor Push Notifications](https://dev.to/saltorgil/the-complete-guide-to-capacitor-push-notifications-ios-android-firebase-bh4)
- [Real-Time Push Notifications with Supabase Edge Functions](https://medium.com/@vignarajj/real-time-push-notifications-with-supabase-edge-functions-and-firebase-581c691c610e)
- [Capawesome Push Notifications Guide](https://capawesome.io/blog/the-push-notifications-guide-for-capacitor/)

---

## ✅ Checklist de Implementación

### Fase 1: Setup (Semana 1)
- [ ] Crear proyecto Firebase
- [ ] Configurar FCM en Firebase Console
- [ ] Instalar `@capacitor-firebase/messaging`
- [ ] Configurar iOS (APNs key, Info.plist, Xcode capabilities)
- [ ] Configurar Android (google-services.json, build.gradle)
- [ ] Configurar Web Push (service worker, certificates)
- [ ] Generar Service Account Key para Edge Functions
- [ ] Agregar variables de entorno

### Fase 2: Backend (Semana 1-2)
- [ ] Crear tabla `push_tokens` con migration
- [ ] Crear tabla `notification_history` con migration
- [ ] Configurar RLS policies
- [ ] Crear Edge Function `send-push-notification` (core)
- [ ] Crear Edge Function `schedule-daily-reminders` (Caso 1)
- [ ] Crear Edge Function `schedule-transaction-alerts` (Caso 2)
- [ ] Crear Edge Function `check-budget-alerts` (Caso 3)
- [ ] Crear Edge Function `schedule-daily-summaries` (Caso 4)
- [ ] Implementar helpers (FCM client, i18n con mensajes específicos)
- [ ] Configurar 3 Cron Jobs en Supabase
- [ ] Testing de Edge Functions

### Fase 3: Frontend (Semana 2)
- [ ] Crear tipos TypeScript (`notifications.ts`)
- [ ] Crear `PushNotificationService`
- [ ] Integrar en Zustand Store
- [ ] Inicializar en `App.tsx`
- [ ] Crear página `NotificationSettingsPage`
- [ ] Agregar traducciones (es, en, fr, pt)
- [ ] Agregar link en ProfilePage
- [ ] Testing unitario del servicio

### Fase 4: Testing (Semana 3)
- [ ] Unit tests del servicio
- [ ] E2E tests de la UI
- [ ] Testing manual en iOS
- [ ] Testing manual en Android
- [ ] Testing manual en Web
- [ ] Testing de flujos completos (end-to-end)

### Fase 5: Optimización (Semana 4)
- [ ] Performance testing
- [ ] Rate limiting en Edge Functions
- [ ] Batch sending optimization
- [ ] Error handling robusto
- [ ] Retry logic con exponential backoff
- [ ] Analytics y logging

### Fase 6: Launch
- [ ] Documentación interna actualizada
- [ ] Release notes
- [ ] Privacy policy actualizada
- [ ] Submit a App Store / Play Store con permisos de notificaciones
- [ ] Monitoreo de métricas post-launch

---

## 🎯 Conclusión

Este plan proporciona una hoja de ruta completa para implementar push notifications en SmartSpend usando las mejores prácticas de 2026. La arquitectura propuesta es escalable, segura y ofrece una experiencia de usuario excepcional tanto en plataformas nativas (iOS/Android) como en Web.

---

## 📋 Resumen de Casos de Uso Implementados

| # | Caso de Uso | Trigger | Condición Crítica | Edge Function | Cron Schedule |
|---|-------------|---------|-------------------|---------------|---------------|
| 1 | **Recordatorio Diario Inteligente** | Hora configurable (default 8:00 PM) | Solo si NO hay transacciones del día | `schedule-daily-reminders` | Cada hora (`0 * * * *`) |
| 2 | **Transacciones Pendientes/Programadas** | Diario 9:00 AM | 1 día antes de ejecución | `schedule-transaction-alerts` | Diario 9 AM (`0 9 * * *`) |
| 3 | **Alerta de Límite de Presupuesto** | Al registrar transacción | Alcanzar 75% o 100% del límite | `check-budget-alerts` | Webhook (tiempo real) |
| 4 | **Resumen Diario Opcional** | Hora configurable (default 8:00 PM) | Solo si HAY actividad en el día | `schedule-daily-summaries` | Cada hora 18-23 (`0 18-23 * * *`) |

### Preferencias de Usuario

```typescript
{
  // Caso 3: Alertas de presupuesto (on/off simple)
  budget_alerts: boolean,

  // Caso 2: Transacciones pendientes/programadas (on/off simple)
  scheduled_transactions: boolean,

  // Caso 1: Recordatorio diario con hora configurable
  daily_reminder: {
    enabled: boolean,
    time: "20:00"  // Hora local del usuario
  },

  // Caso 4: Resumen diario con hora configurable
  daily_summary: {
    enabled: boolean,
    time: "20:00"  // Hora local del usuario
  },

  // Global: Horario silencioso
  quiet_hours: {
    enabled: boolean,
    start: "22:00",
    end: "08:00"
  }
}
```

### Mensajes por Caso de Uso

**Caso 1 - Recordatorio Diario:**
- 🇪🇸 "Recuerda registrar tus movimientos del día 💰"
- 🇺🇸 "Remember to log your expenses today 💰"

**Caso 2 - Transacciones:**
- 🇪🇸 "Transacción programada para mañana: Netflix por $14.990"
- 🇺🇸 "Scheduled transaction for tomorrow: Netflix for $14.990"

**Caso 3 - Presupuesto:**
- 🇪🇸 "⚠️ Alerta: Has alcanzado el 75% de tu presupuesto de Restaurantes"
- 🇺🇸 "⚠️ Alert: You've reached 75% of your Restaurants budget"

**Caso 4 - Resumen:**
- 🇪🇸 "📊 Resumen del día: Gastaste $45.000 en 3 transacciones. Categoría top: Comida"
- 🇺🇸 "📊 Daily summary: You spent $45.000 in 3 transactions. Top category: Food"

---

**Próximos pasos inmediatos:**
1. ✅ Revisar y aprobar este plan actualizado con los 4 casos de uso
2. Crear proyecto Firebase
3. Comenzar Fase 1: Setup de Firebase y Capacitor Plugin

**Tiempo estimado total:** 4 semanas de desarrollo + 1 semana de testing y ajustes

---

**Autor:** Claude Code
**Fecha:** 2026-01-28
**Versión:** 2.0 (Casos de Uso Detallados)
