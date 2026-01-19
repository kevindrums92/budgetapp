# Plan de Publicación - Budget App

**Fecha inicio**: 18 de enero, 2026
**Objetivo**: Publicar la app en Apple App Store y Google Play Store usando Capacitor

---

## 📋 Estado Actual

### ✅ Fortalezas
- PWA funcional con arquitectura local-first
- UI pulida y optimizada para móvil
- Sync a la nube opcional (Supabase)
- Stack moderno: React 19, TypeScript, Vite
- Offline-first con localStorage + service worker
- Diseño responsive y mobile-first

### 🔍 Por Verificar
- Cumplimiento completo de requisitos PWA
- Rendimiento en dispositivos reales
- Permisos necesarios (notificaciones, almacenamiento)
- Iconos en todos los tamaños requeridos

---

## 🎯 Tecnología Seleccionada: **Capacitor**

### ¿Por qué Capacitor?
1. ✅ Soporte PWA de primera clase
2. ✅ Un solo código base para web + iOS + Android
3. ✅ Compatible con React y TypeScript
4. ✅ Acceso nativo completo cuando se necesita
5. ✅ Moderno, activo, y sucesor oficial de Cordova
6. ✅ Hot reload y excelente DX

### Alternativas Descartadas
- ❌ **Cordova**: Descontinuado desde 2020
- ❌ **PWA Builder**: Muy limitado, menos control
- ❌ **React Native**: Requiere reescribir toda la app

---

## 💰 Costos Estimados

### Cuentas de Desarrollador
| Tienda | Costo | Frecuencia |
|--------|-------|------------|
| Apple Developer | $99 USD | Anual |
| Google Play Console | $25 USD | Una sola vez |
| **Total primer año** | **$124 USD** | |
| **Años siguientes** | **$99 USD** | Anual |

### Otros Costos Potenciales
- Dominio para privacy policy (si no existe): ~$15 USD/año
- Certificado SSL (usualmente gratis con hosting)
- Herramientas de diseño para assets (opcional)

---

## 📅 Plan de Acción

### **Fase 1: Preparación** (1-2 semanas)

#### 1.1 Auditoría PWA
- [ ] Verificar manifest.json completo
- [ ] Confirmar service worker funcional
- [ ] Probar offline mode en diferentes escenarios
- [ ] Validar HTTPS en producción
- [ ] Verificar que todos los assets se cachean correctamente
- [ ] Lighthouse audit score (objetivo: 90+)

#### 1.2 Assets Gráficos
- [ ] **App Icon** - 1024x1024px (requerido por Apple)
- [ ] Iconos Android (múltiples tamaños)
  - 48x48, 72x72, 96x96, 144x144, 192x192, 512x512
- [ ] Iconos iOS (múltiples tamaños)
  - 20x20, 29x29, 40x40, 58x58, 60x60, 76x76, 80x80, 87x87, 120x120, 152x152, 167x167, 180x180, 1024x1024
- [ ] **Splash Screens** Android (varios tamaños)
- [ ] **Splash Screens** iOS (varios tamaños)
- [ ] Screenshots para App Store (iPhone)
  - 6.7" (1290x2796) - requerido
  - 6.5" (1284x2778) - recomendado
  - 5.5" (1242x2208) - recomendado
- [ ] Screenshots para Google Play
  - Mínimo 2, máximo 8 por tipo de dispositivo
  - 16:9 o 9:16 aspect ratio
  - Mínimo 320px, máximo 3840px

#### 1.3 Documentos Legales (CRÍTICO)
- [ ] **Privacy Policy** (Política de Privacidad)
  - Qué datos recopila la app
  - Cómo se usan los datos
  - Integración con Supabase
  - Derechos del usuario
  - Contacto del desarrollador
- [ ] **Terms of Service** (Términos de Servicio)
  - Uso aceptable de la app
  - Limitación de responsabilidad
  - Propiedad intelectual
- [ ] Hosting público de estos documentos (GitHub Pages, sitio web, etc.)

#### 1.4 Metadata de la App
- [ ] **Nombre de la app** (máx 30 caracteres)
- [ ] **Descripción corta** (máx 80 caracteres) - Google Play
- [ ] **Descripción completa**
  - Apple App Store: texto + keywords
  - Google Play: hasta 4000 caracteres
- [ ] **Keywords** (Apple) - máx 100 caracteres
- [ ] **Categoría principal** (ej: Finanzas)
- [ ] **Categoría secundaria** (opcional)
- [ ] **Rating de contenido**
  - ESRB, PEGI, etc.
  - Probablemente "Everyone" / "Para todos"
- [ ] **Información de contacto**
  - Email de soporte
  - Sitio web (opcional pero recomendado)

---

### **Fase 2: Integración Capacitor** (1 semana)

#### 2.1 Instalación Inicial
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
```

**Configuración inicial:**
- [ ] Nombre de la app
- [ ] App ID (ej: `com.tuempresa.budgetapp`)
- [ ] Directorio web: `dist`

#### 2.2 Agregar Plataformas
```bash
# Android
npm install @capacitor/android
npx cap add android

# iOS
npm install @capacitor/ios
npx cap add ios
```

#### 2.3 Configuración Específica

**Android (`android/app/build.gradle`):**
- [ ] Verificar `minSdkVersion` (mínimo 22)
- [ ] Configurar `targetSdkVersion` (34 o superior)
- [ ] Configurar permisos en `AndroidManifest.xml`

**iOS (`ios/App/Info.plist`):**
- [ ] Configurar permisos (notificaciones, etc.)
- [ ] Configurar orientación de pantalla
- [ ] URL schemes (si aplica)

#### 2.4 Plugins Necesarios

**Push Notifications:**
```bash
npm install @capacitor/push-notifications
```
- [ ] Configurar en iOS (APNs certificates)
- [ ] Configurar en Android (Firebase Cloud Messaging)
- [ ] Adaptar código web a API nativa

**Splash Screen:**
```bash
npm install @capacitor/splash-screen
```
- [ ] Configurar auto-hide
- [ ] Agregar assets de splash screen

**Status Bar:**
```bash
npm install @capacitor/status-bar
```
- [ ] Configurar color y estilo

**App:**
```bash
npm install @capacitor/app
```
- [ ] Listeners para deep links
- [ ] Manejo de back button (Android)

#### 2.5 Build & Sync
```bash
npm run build
npx cap sync
npx cap open android  # Abre Android Studio
npx cap open ios      # Abre Xcode
```

#### 2.6 Pruebas en Dispositivos Reales
- [ ] Probar en Android (mínimo 2 dispositivos diferentes)
- [ ] Probar en iOS (mínimo iPhone reciente)
- [ ] Verificar gestos nativos
- [ ] Verificar safe areas (notch, home indicator)
- [ ] Probar modo offline
- [ ] Probar sincronización con cloud
- [ ] Verificar rendimiento (60fps en transiciones)
- [ ] Probar notificaciones push (si aplica)

---

### **Fase 3: Publicación** (2-3 semanas)

#### 3.1 Google Play Store

**Requisitos previos:**
- [ ] Cuenta de Google Play Console ($25 USD)
- [ ] APK o AAB firmado
- [ ] Todos los assets listos

**Pasos de publicación:**
1. [ ] Crear app en Google Play Console
2. [ ] Completar ficha de la tienda
   - Título, descripción corta/larga
   - Screenshots (mínimo 2)
   - Ícono 512x512
   - Feature graphic 1024x500
3. [ ] Configurar contenido
   - Clasificación de contenido
   - Público objetivo
   - Categoría
4. [ ] Agregar política de privacidad (URL)
5. [ ] Generar firma de la app (keystore)
6. [ ] Build de release firmado
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
7. [ ] Subir AAB a Play Console
8. [ ] Configurar distribución (países, dispositivos)
9. [ ] Enviar a revisión

**Tiempo estimado:** 3-7 días para aprobación

#### 3.2 Apple App Store

**Requisitos previos:**
- [ ] Cuenta de Apple Developer ($99 USD/año)
- [ ] Mac con Xcode actualizado
- [ ] Certificados y provisioning profiles
- [ ] Todos los assets listos

**Pasos de publicación:**
1. [ ] Registrar App ID en Apple Developer
2. [ ] Crear certificados de distribución
3. [ ] Crear provisioning profile
4. [ ] Configurar App en App Store Connect
5. [ ] Completar metadata
   - Nombre (máx 30 caracteres)
   - Subtítulo (máx 30 caracteres)
   - Descripción
   - Keywords (máx 100 caracteres)
   - Screenshots (mínimo 3)
   - Preview video (opcional)
6. [ ] Configurar Privacy Policy URL
7. [ ] Configurar rating (probablemente 4+)
8. [ ] Build en Xcode (Archive)
9. [ ] Subir a App Store Connect vía Xcode
10. [ ] Completar información de revisión
    - Notas para el revisor
    - Información de contacto
    - Cuenta demo (si la app requiere login)
11. [ ] Enviar a revisión

**Tiempo estimado:** 1-2 semanas para revisión inicial

---

## ⚠️ Consideraciones Importantes

### Posibles Rechazos de Apple

**Razones comunes de rechazo:**
1. **App parece "solo un wrapper web"**
   - Solución: Asegurar que usa features nativas (splash, status bar, gestos)
   - Agregar experiencia optimizada para móvil

2. **Falta funcionalidad suficiente**
   - Solución: Asegurar que todas las features funcionan correctamente
   - No incluir "próximamente" o features incompletas

3. **Problemas con Privacy Policy**
   - Solución: Política completa, clara, y accesible

4. **Problemas de rendimiento**
   - Solución: Optimizar bundle size, lazy loading, assets

5. **Permisos no justificados**
   - Solución: Solo solicitar permisos necesarios y explicar por qué

### In-App Purchases (IAP)

**Si planeas monetizar:**
- Apple requiere usar su sistema (30% comisión)
- No puedes linkear a métodos de pago externos
- Debes implementar StoreKit (iOS) y Google Billing (Android)

**Recomendación inicial:** Lanzar gratis, evaluar monetización después

### Actualizaciones

**Proceso de actualización:**
1. Incrementar versión en `package.json` y configs de Capacitor
2. Build nueva versión
3. Subir a tiendas
4. Apple: ~3-7 días de revisión
5. Google: ~1-3 días de revisión

**CI/CD (futuro):**
- Considerar GitHub Actions para builds automáticos
- Fastlane para automatizar deploys

---

## 📊 KPIs y Métricas

### Pre-Launch
- [ ] Lighthouse PWA score: 90+
- [ ] Performance score: 90+
- [ ] Accessibility score: 90+
- [ ] Bundle size: < 500KB (gzipped)
- [ ] First Contentful Paint: < 1.5s

### Post-Launch (Primeros 30 días)
- Descargas totales
- Usuarios activos diarios (DAU)
- Usuarios activos mensuales (MAU)
- Tasa de retención D1, D7, D30
- Crashes / errores reportados
- Rating promedio en tiendas
- Reviews (cantidad y sentimiento)

### Herramientas de Analytics
- [ ] Firebase Analytics (gratis)
- [ ] Google Analytics 4 (opcional)
- [ ] Crashlytics para crash reporting

---

## 🔗 Recursos y Referencias

### Documentación Oficial
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Capacitor PWA Guide](https://capacitorjs.com/docs/web/progressive-web-apps)
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)

### Tutoriales Útiles
- [Progressive Web to Native Mobile with Capacitor](https://without.systems/progressive-web-to-native-mobile-with-capacitor)
- [Publishing PWAs to App Stores](https://web.dev/articles/pwas-in-app-stores)

### Herramientas
- [App Icon Generator](https://www.appicon.co/)
- [Splash Screen Generator](https://capacitorjs.com/docs/guides/splash-screens-and-icons)
- [Privacy Policy Generator](https://app-privacy-policy-generator.nisrulz.com/)

---

## ✅ Checklist Final Pre-Launch

### Técnico
- [ ] Build de producción funciona sin errores
- [ ] Service worker configurado correctamente
- [ ] Todos los assets optimizados
- [ ] No hay console.errors en producción
- [ ] Performance optimizado
- [ ] Tested en iOS y Android

### Legal
- [ ] Privacy Policy publicada
- [ ] Terms of Service publicados
- [ ] Compliance con GDPR (si aplica)
- [ ] Compliance con COPPA (si menores usan app)

### Marketing
- [ ] Screenshots atractivos
- [ ] Descripción clara y concisa
- [ ] Keywords relevantes (Apple)
- [ ] Feature graphic llamativo (Google)
- [ ] Video preview (opcional pero recomendado)

### Soporte
- [ ] Email de soporte configurado
- [ ] Sistema de feedback en app (opcional)
- [ ] FAQ básico preparado
- [ ] Plan de respuesta a reviews

---

## 📝 Notas y Decisiones

### Decisiones Pendientes
- [ ] ¿Nombre final de la app?
- [ ] ¿App ID? (ej: com.tuempresa.budgetapp)
- [ ] ¿Monetización inicial? (gratis vs freemium vs pago)
- [ ] ¿Push notifications desde día 1?
- [ ] ¿Soporte para tablet/iPad?

### Riesgos Identificados
1. **Tiempo de revisión de Apple** - Puede tomar más de lo esperado
2. **Rechazo inicial** - Es común en primer submit
3. **Bugs específicos de plataforma** - Pueden surgir en dispositivos reales
4. **Rendimiento en dispositivos antiguos** - Necesita testing exhaustivo

### Próximos Pasos Inmediatos
1. Auditoría PWA completa
2. Generación de assets gráficos
3. Creación de Privacy Policy
4. Instalación y configuración de Capacitor

---

**Última actualización:** 18 de enero, 2026
**Mantenido por:** [Tu nombre/equipo]
