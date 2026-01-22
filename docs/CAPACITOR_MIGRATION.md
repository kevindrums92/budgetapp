# SmartSpend - Plan de Migración a Apps Nativas con Capacitor

> **Objetivo**: Convertir la PWA existente en apps nativas para Android e iOS
> **Tiempo estimado**: 2-3 semanas
> **Estrategia**: Capacitor (wrapper nativo que ejecuta la web app)

---

## ¿Por qué Capacitor?

| Criterio | Capacitor | React Native | PWA Builder |
|----------|-----------|--------------|-------------|
| Cambios de código | Mínimos | Reescritura total | Ninguno |
| Tiempo a producción | 2-3 semanas | 2-6 meses | 1-2 días |
| Features nativos | Excelentes | Excelentes | Limitados |
| Riesgo App Store iOS | Bajo | Ninguno | Alto |
| Mantenimiento | Bajo (1 codebase) | Alto (2 codebases) | Muy bajo |

**Capacitor es ideal porque:**
- Tu código React + Vite + Tailwind funciona sin cambios
- localStorage + Supabase sync funciona igual
- Una sola base de código para Web + iOS + Android
- Acceso a APIs nativos cuando los necesites

---

## Fase 1: Setup Inicial

### 1.1 Instalar Capacitor

```bash
# Instalar core y CLI
npm install @capacitor/core
npm install -D @capacitor/cli

# Inicializar proyecto
npx cap init "SmartSpend" "com.smartspend.budget" --web-dir dist
```

### 1.2 Crear `capacitor.config.ts`

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartspend.budget',
  appName: 'SmartSpend',
  webDir: 'dist',

  // Configuración del servidor (desarrollo)
  server: {
    // Para desarrollo local, descomentar:
    // url: 'http://192.168.1.X:5173',
    // cleartext: true,

    // Producción: usar archivos locales
    androidScheme: 'https',
  },

  // Plugins configuration
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
```

### 1.3 Agregar plataformas

```bash
# Instalar plataformas
npm install @capacitor/android @capacitor/ios

# Agregar proyectos nativos
npx cap add android
npx cap add ios

# Build y sincronizar
npm run build
npx cap sync
```

### 1.4 Estructura de carpetas resultante

```
budget-app/
├── android/                 # Proyecto Android Studio
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── assets/     # Tu dist/ copiado aquí
│   │   │   ├── res/        # Iconos, splash screens
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle
│   └── ...
├── ios/                     # Proyecto Xcode
│   ├── App/
│   │   ├── App/
│   │   │   ├── Assets.xcassets/  # Iconos, splash
│   │   │   └── Info.plist
│   │   └── public/         # Tu dist/ copiado aquí
│   └── ...
├── src/                     # Tu código React (sin cambios)
├── dist/                    # Build de Vite
└── capacitor.config.ts
```

---

## Fase 2: Configuración de Assets

### 2.1 Iconos de App

Necesitas iconos en múltiples tamaños. Usa una herramienta como [capacitor-assets](https://github.com/ionic-team/capacitor-assets):

```bash
npm install -D @capacitor/assets

# Crear carpeta con iconos fuente
mkdir resources
# Colocar: icon.png (1024x1024), splash.png (2732x2732)

# Generar todos los tamaños
npx capacitor-assets generate
```

**Tamaños requeridos:**

| Plataforma | Tipo | Tamaños |
|------------|------|---------|
| Android | Launcher | 48, 72, 96, 144, 192, 512 px |
| Android | Adaptive | 108, 162, 216, 324, 432 px (foreground + background) |
| iOS | App Icon | 20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024 px |
| iOS | Splash | Multiple sizes para diferentes dispositivos |

### 2.2 Splash Screen

```bash
npm install @capacitor/splash-screen
```

Configurar en `capacitor.config.ts` (ya incluido arriba).

Para splash screen personalizado, crear imágenes en:
- `android/app/src/main/res/drawable/splash.png`
- `ios/App/App/Assets.xcassets/Splash.imageset/`

### 2.3 Colores y tema

**Android** (`android/app/src/main/res/values/styles.xml`):
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="colorPrimary">#18B7B0</item>
        <item name="colorPrimaryDark">#0D9488</item>
        <item name="colorAccent">#10B981</item>
        <item name="android:windowBackground">@drawable/splash</item>
    </style>
</resources>
```

**iOS** - Configurar en Xcode:
- Abrir `ios/App/App.xcworkspace`
- Assets.xcassets → AccentColor → Cambiar a `#18B7B0`

---

## Fase 3: Plugins Esenciales

### 3.1 Status Bar

```bash
npm install @capacitor/status-bar
npx cap sync
```

```typescript
// src/shared/utils/native.utils.ts
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export async function configureStatusBar() {
  if (!Capacitor.isNativePlatform()) return;

  await StatusBar.setStyle({ style: Style.Light });
  await StatusBar.setBackgroundColor({ color: '#ffffff' });
}
```

### 3.2 Keyboard

```bash
npm install @capacitor/keyboard
npx cap sync
```

```typescript
import { Keyboard } from '@capacitor/keyboard';

// Escuchar eventos de teclado
Keyboard.addListener('keyboardWillShow', (info) => {
  console.log('Keyboard will show, height:', info.keyboardHeight);
});

Keyboard.addListener('keyboardWillHide', () => {
  console.log('Keyboard will hide');
});
```

### 3.3 App (Lifecycle + Deep Links)

```bash
npm install @capacitor/app
npx cap sync
```

```typescript
import { App } from '@capacitor/app';

// Detectar cuando la app vuelve al foreground
App.addListener('appStateChange', ({ isActive }) => {
  if (isActive) {
    // App volvió al frente - sincronizar datos
    console.log('App is active, syncing...');
  }
});

// Manejar back button en Android
App.addListener('backButton', ({ canGoBack }) => {
  if (!canGoBack) {
    App.exitApp();
  } else {
    window.history.back();
  }
});
```

### 3.4 Haptics (Vibración)

```bash
npm install @capacitor/haptics
npx cap sync
```

```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Feedback táctil al completar acción
export async function hapticSuccess() {
  await Haptics.impact({ style: ImpactStyle.Light });
}

// Vibración de notificación
export async function hapticNotification() {
  await Haptics.notification({ type: 'SUCCESS' });
}
```

---

## Fase 4: Push Notifications

### 4.1 Setup Firebase (Android)

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Agregar app Android con package name `com.smartspend.budget`
3. Descargar `google-services.json`
4. Colocar en `android/app/google-services.json`

**Modificar `android/build.gradle`:**
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

**Modificar `android/app/build.gradle`:**
```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

### 4.2 Setup APNS (iOS)

1. En Apple Developer Portal:
   - Crear App ID con Push Notifications capability
   - Crear Push Notification Key (.p8)
2. En Firebase:
   - Agregar app iOS
   - Subir el .p8 en Cloud Messaging settings
3. En Xcode:
   - Signing & Capabilities → + Capability → Push Notifications
   - Signing & Capabilities → + Capability → Background Modes → Remote notifications

### 4.3 Instalar plugin

```bash
npm install @capacitor/push-notifications
npx cap sync
```

### 4.4 Implementar en React

```typescript
// src/shared/services/pushNotifications.service.ts
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push] Not on native platform, skipping');
    return;
  }

  // Solicitar permisos
  const permission = await PushNotifications.requestPermissions();

  if (permission.receive !== 'granted') {
    console.log('[Push] Permission denied');
    return;
  }

  // Registrar para recibir notificaciones
  await PushNotifications.register();

  // Listeners
  PushNotifications.addListener('registration', (token) => {
    console.log('[Push] Token:', token.value);
    // Enviar token a tu backend (Supabase)
    saveTokenToBackend(token.value);
  });

  PushNotifications.addListener('registrationError', (error) => {
    console.error('[Push] Registration error:', error);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[Push] Received:', notification);
    // Manejar notificación en foreground
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('[Push] Action performed:', action);
    // Usuario tocó la notificación - navegar a la página relevante
    handleNotificationTap(action.notification);
  });
}

async function saveTokenToBackend(token: string) {
  // Guardar en Supabase para enviar notificaciones desde el servidor
  // await supabase.from('push_tokens').upsert({ user_id, token, platform });
}

function handleNotificationTap(notification: any) {
  const data = notification.data;

  if (data.type === 'budget_alert') {
    window.location.href = '/budget';
  } else if (data.type === 'scheduled_reminder') {
    window.location.href = `/?highlight=${data.transactionId}`;
  }
}
```

### 4.5 Inicializar en App.tsx

```typescript
// src/App.tsx
import { useEffect } from 'react';
import { initPushNotifications } from '@/shared/services/pushNotifications.service';

function App() {
  useEffect(() => {
    initPushNotifications();
  }, []);

  // ... resto del código
}
```

---

## Fase 5: Features Nativos Adicionales

### 5.1 Biometría (Face ID / Huella)

```bash
npm install @capawesome/capacitor-biometrics
npx cap sync
```

```typescript
import { Biometrics, BiometricAuth } from '@capawesome/capacitor-biometrics';

export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    // Verificar disponibilidad
    const { isAvailable } = await Biometrics.isAvailable();
    if (!isAvailable) return true; // Skip si no hay biometría

    // Autenticar
    await Biometrics.authenticate({
      reason: 'Desbloquea SmartSpend',
      cancelTitle: 'Cancelar',
      allowDeviceCredential: true, // Permitir PIN como fallback
    });

    return true;
  } catch (error) {
    console.error('[Biometrics] Error:', error);
    return false;
  }
}
```

**Uso**: Proteger acceso a la app o a funciones sensibles (backup, eliminar datos).

### 5.2 Cámara (Para recibos)

```bash
npm install @capacitor/camera
npx cap sync
```

```typescript
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export async function takeReceiptPhoto(): Promise<string | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt, // Cámara o galería
      saveToGallery: false,
    });

    return photo.base64String || null;
  } catch (error) {
    console.error('[Camera] Error:', error);
    return null;
  }
}
```

**iOS**: Agregar a `Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>SmartSpend necesita acceso a la cámara para fotografiar recibos</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>SmartSpend necesita acceso a tus fotos para adjuntar recibos</string>
```

### 5.3 Local Notifications (Sin servidor)

```bash
npm install @capacitor/local-notifications
npx cap sync
```

```typescript
import { LocalNotifications } from '@capacitor/local-notifications';

// Recordatorio de transacción programada
export async function scheduleTransactionReminder(
  transactionName: string,
  amount: number,
  date: Date
) {
  // Solicitar permisos
  await LocalNotifications.requestPermissions();

  // Programar notificación para el día anterior
  const reminderDate = new Date(date);
  reminderDate.setDate(reminderDate.getDate() - 1);
  reminderDate.setHours(20, 0, 0, 0); // 8pm

  await LocalNotifications.schedule({
    notifications: [
      {
        id: Math.floor(Math.random() * 100000),
        title: 'Recordatorio de pago',
        body: `Mañana: ${transactionName} - $${amount.toLocaleString('es-CO')}`,
        schedule: { at: reminderDate },
        sound: 'default',
        actionTypeId: 'TRANSACTION_REMINDER',
        extra: { transactionName, amount },
      },
    ],
  });
}

// Alerta de presupuesto
export async function sendBudgetAlert(categoryName: string, percentage: number) {
  await LocalNotifications.schedule({
    notifications: [
      {
        id: Math.floor(Math.random() * 100000),
        title: 'Alerta de presupuesto',
        body: `${categoryName} está al ${percentage}% del límite`,
        schedule: { at: new Date(Date.now() + 1000) }, // Inmediata
        sound: 'default',
      },
    ],
  });
}
```

### 5.4 Share (Compartir)

```bash
npm install @capacitor/share
npx cap sync
```

```typescript
import { Share } from '@capacitor/share';

export async function shareMonthSummary(month: string, income: number, expenses: number) {
  await Share.share({
    title: `Resumen ${month}`,
    text: `Mi resumen de ${month}:\n` +
          `Ingresos: $${income.toLocaleString('es-CO')}\n` +
          `Gastos: $${expenses.toLocaleString('es-CO')}\n` +
          `Balance: $${(income - expenses).toLocaleString('es-CO')}`,
    dialogTitle: 'Compartir resumen',
  });
}
```

### 5.5 App Badge (Contador en icono)

```bash
npm install @capawesome/capacitor-badge
npx cap sync
```

```typescript
import { Badge } from '@capawesome/capacitor-badge';

// Mostrar número de transacciones pendientes
export async function updateAppBadge(pendingCount: number) {
  if (pendingCount > 0) {
    await Badge.set({ count: pendingCount });
  } else {
    await Badge.clear();
  }
}
```

### 5.6 Preferencias/Storage Nativo

```bash
npm install @capacitor/preferences
npx cap sync
```

```typescript
import { Preferences } from '@capacitor/preferences';

// Alternativa a localStorage para datos sensibles
export async function secureSet(key: string, value: string) {
  await Preferences.set({ key, value });
}

export async function secureGet(key: string): Promise<string | null> {
  const { value } = await Preferences.get({ key });
  return value;
}
```

---

## Fase 6: Ajustes de UI para Nativo

### 6.1 Safe Areas (Notch, Home Indicator)

Ya tienes esto configurado con `env(safe-area-inset-*)` en tu CSS. Verificar que funcione correctamente en dispositivos con notch.

### 6.2 Prevenir Pull-to-Refresh en iOS

```css
/* En tu CSS global */
html, body {
  overscroll-behavior-y: none;
}
```

### 6.3 Deshabilitar zoom en inputs (iOS)

```css
input, select, textarea {
  font-size: 16px; /* iOS no hace zoom si font-size >= 16px */
}
```

### 6.4 Detectar plataforma

```typescript
import { Capacitor } from '@capacitor/core';

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

export function isWeb(): boolean {
  return Capacitor.getPlatform() === 'web';
}
```

---

## Fase 7: Build y Testing

### 7.1 Scripts de npm

Agregar a `package.json`:
```json
{
  "scripts": {
    "cap:build": "npm run build && npx cap sync",
    "cap:android": "npm run cap:build && npx cap open android",
    "cap:ios": "npm run cap:build && npx cap open ios",
    "cap:run:android": "npm run cap:build && npx cap run android",
    "cap:run:ios": "npm run cap:build && npx cap run ios"
  }
}
```

### 7.2 Testing en dispositivo real

**Android:**
```bash
# Conectar dispositivo con USB debugging habilitado
npm run cap:run:android
```

**iOS:**
```bash
# Conectar iPhone, confiar en Mac
npm run cap:run:ios
```

### 7.3 Live Reload (Desarrollo)

Para desarrollo rápido, habilitar live reload:

1. Obtener IP local: `ipconfig` (Windows) o `ifconfig` (Mac)
2. Modificar `capacitor.config.ts`:
```typescript
server: {
  url: 'http://192.168.1.100:5173', // Tu IP local
  cleartext: true,
}
```
3. Correr `npm run dev`
4. Abrir app en dispositivo

**Importante**: Quitar esta configuración para builds de producción.

---

## Fase 8: Publicación

### 8.1 Android - Google Play Store

#### Requisitos previos
- Cuenta de Google Play Developer ($25 una vez)
- 14 días de closed testing con 20+ testers

#### Generar APK/AAB firmado

1. Generar keystore:
```bash
keytool -genkey -v -keystore smartspend-release.keystore -alias smartspend -keyalg RSA -keysize 2048 -validity 10000
```

2. Configurar en `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('smartspend-release.keystore')
            storePassword 'tu_password'
            keyAlias 'smartspend'
            keyPassword 'tu_password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

3. Build:
```bash
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

#### Checklist para Play Store
- [ ] Screenshots (teléfono + tablet)
- [ ] Feature graphic (1024x500)
- [ ] Descripción corta (80 chars)
- [ ] Descripción larga (4000 chars)
- [ ] Política de privacidad (URL)
- [ ] Categoría: Finance
- [ ] Content rating questionnaire
- [ ] Data safety form

### 8.2 iOS - App Store

#### Requisitos previos
- Cuenta de Apple Developer ($99/año)
- Mac con Xcode
- iPhone/iPad para testing

#### Build para App Store

1. Abrir en Xcode:
```bash
npm run cap:ios
```

2. En Xcode:
   - Product → Archive
   - Distribute App → App Store Connect

#### Checklist para App Store
- [ ] Screenshots para cada tamaño de dispositivo
- [ ] App Preview video (opcional)
- [ ] Descripción
- [ ] Keywords
- [ ] Support URL
- [ ] Privacy Policy URL
- [ ] App Review Information (notas para reviewer)
- [ ] Age Rating
- [ ] Copyright

---

## Fase 9: Mantenimiento

### 9.1 Actualizar la app

```bash
# Después de cambios en código web
npm run build
npx cap sync

# Si hay cambios en plugins
npx cap sync

# Si hay cambios en configuración nativa
npx cap copy
```

### 9.2 Actualizar Capacitor

```bash
npm install @capacitor/core@latest @capacitor/cli@latest
npm install @capacitor/android@latest @capacitor/ios@latest
npx cap sync
```

### 9.3 Monitoreo de crashes

Opciones recomendadas:
- **Firebase Crashlytics** (gratis)
- **Sentry** (freemium)
- **Bugsnag** (freemium)

---

## Resumen de Costos

| Item | Costo | Frecuencia |
|------|-------|------------|
| Apple Developer | $99 | Anual |
| Google Play Developer | $25 | Una vez |
| Firebase (push, crashlytics) | $0 | Gratis tier |
| Total primer año | ~$124 | |
| Total años siguientes | ~$99 | |

---

## Timeline Estimado

| Fase | Duración | Descripción |
|------|----------|-------------|
| 1. Setup | 2-4 horas | Instalar Capacitor, crear proyectos |
| 2. Assets | 2-4 horas | Iconos, splash screens |
| 3. Plugins básicos | 4-6 horas | Status bar, keyboard, haptics |
| 4. Push notifications | 1-2 días | Firebase, APNS, implementación |
| 5. Features nativos | 2-3 días | Biometría, cámara, etc. (opcional) |
| 6. UI ajustes | 4-8 horas | Safe areas, bugs específicos |
| 7. Testing | 3-5 días | Dispositivos reales, QA |
| 8. Publicación | 1-2 semanas | Store setup, review process |

**Total**: 2-3 semanas para primera release

---

## Recursos

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [Community Plugins](https://github.com/capacitor-community)
- [Capawesome Plugins](https://capawesome.io/)
- [Firebase Console](https://console.firebase.google.com/)
- [Apple Developer](https://developer.apple.com/)
- [Google Play Console](https://play.google.com/console/)
