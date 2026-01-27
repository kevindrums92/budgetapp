# Ambientes de SmartSpend

SmartSpend tiene configurados 2 ambientes separados con proyectos de Supabase independientes.

## Ambientes Disponibles

### 🔧 Development (Dev)
- **Proyecto Supabase:** `qvzxdwilplizcgybqqsx`
- **Bundle ID:** `com.jhotech.smartspend.dev`
- **Display Name:** `SmartSpend Dev`
- **Uso:** Desarrollo local, pruebas, features experimentales
- **Archivo:** `.env.development`

### 🚀 Production (Prod)
- **Proyecto Supabase:** `plvuebqjwjcheyxprlmg`
- **Bundle ID:** `com.jhotech.smartspend`
- **Display Name:** `SmartSpend`
- **Uso:** Builds para TestFlight y App Store
- **Archivo:** `.env.production`

**✨ Beneficio:** Puedes tener ambas apps instaladas simultáneamente en tu dispositivo sin conflictos. "SmartSpend Dev" para desarrollo y "SmartSpend" desde TestFlight.

---

## 📱 Comandos para Desarrollo Local

### Web (localhost)

```bash
# Desarrollo (DEV) - por defecto
npm run dev

# Ver producción en web (raro, solo para debugging)
npm run dev:prod
```

### iOS (Xcode)

```bash
# Desarrollo (DEV)
npm run ios:dev

# Producción (PROD) - para preparar builds de TestFlight/App Store
npm run ios:prod
```

### Android (Android Studio)

```bash
# Desarrollo (DEV)
npm run android:dev

# Producción (PROD) - para preparar builds de Play Store
npm run android:prod
```

---

## 🏗️ Flujo de Trabajo Recomendado

### Desarrollo diario:
```bash
# Web
npm run dev

# iOS
npm run ios:dev

# Android
npm run android:dev
```
✅ Usa ambiente **DEV** (desarrollo)

### Preparar build para TestFlight/App Store:
```bash
# iOS
npm run ios:prod
```
1. El comando genera el build con ambiente **PROD**
2. Se abre Xcode automáticamente
3. En Xcode: Product → Archive
4. Distribuir a App Store Connect

✅ Usa ambiente **PROD** (producción)

---

## 🔍 Verificar Ambiente Actual

Para saber en qué ambiente está corriendo la app, puedes:

1. **Consola del navegador/Xcode:**
   - Abre la consola
   - Busca logs que contengan `[Supabase]` o similares
   - Verifica la URL de Supabase que aparece

2. **Código (opcional):**
   - Puedes agregar un badge visual en ProfilePage mostrando el ambiente
   - Ver `import.meta.env.VITE_ENV` para obtener el ambiente

---

## 📋 Checklist Pre-Build

Antes de crear un build para TestFlight/App Store:

- [ ] Ejecutar `npm run ios:prod` (NO `ios:dev`)
- [ ] Verificar en Xcode que el Bundle ID es `com.jhotech.smartspend`
- [ ] Incrementar Build Number en Xcode (General → Build)
- [ ] Cambiar Version Number solo si es un release mayor
- [ ] Archive desde Xcode
- [ ] Upload a App Store Connect

---

## 🗂️ Archivos de Configuración

```
.env.development           → Ambiente DEV (commiteado al repo)
.env.production            → Ambiente PROD (commiteado al repo)
.env.local                 → Overrides locales (ignorado por git)
.env.*.local               → Overrides por ambiente (ignorado por git)
scripts/configure-env.js   → Script que configura Bundle ID y Display Name
```

**Nota:** Los archivos `.env.development` y `.env.production` SÍ se commitean al repo porque contienen proyectos de Supabase separados (no son credenciales sensibles).

**Cómo funciona:**
- Al ejecutar `npm run ios:dev`, el script `configure-env.js` modifica automáticamente:
  - `capacitor.config.ts` → appId y appName
  - `ios/App/App/Info.plist` → CFBundleDisplayName
  - `ios/App/App.xcodeproj/project.pbxproj` → PRODUCT_BUNDLE_IDENTIFIER
- Esto genera una app completamente separada que no conflictúa con la de TestFlight

---

## ⚠️ Importante

- **NUNCA** uses `npm run ios:dev` para builds de TestFlight/App Store
- **SIEMPRE** usa `npm run ios:prod` para builds de producción
- Si necesitas probar producción localmente, usa `npm run dev:prod` en web
- Los datos en DEV y PROD están separados (no se sincronizan entre sí)

### 📝 Git y Archivos Nativos

Los archivos nativos (`capacitor.config.ts`, `Info.plist`, `project.pbxproj`) cambian automáticamente al ejecutar los scripts de configuración.

**REGLA IMPORTANTE:**
- ✅ **SÍ commitear** estos archivos cuando están en estado de PRODUCCIÓN
- ❌ **NO commitear** cambios temporales hechos por `npm run ios:dev`
- Antes de commitear, asegúrate de que estos archivos estén en estado PROD:
  ```bash
  npm run configure:prod
  git add capacitor.config.ts ios/
  git commit -m "..."
  ```

**Verificación rápida antes de commit:**
- `capacitor.config.ts` debe tener `appId: 'com.jhotech.smartspend'` (sin `.dev`)
- `Info.plist` debe tener `<string>SmartSpend</string>` (sin "Dev")

---

## 🆘 Troubleshooting

### "No puedo ver mis datos en la app"
- Verifica que estés usando el ambiente correcto
- Si desarrollaste con DEV, los datos están en el proyecto DEV
- Si usaste PROD, los datos están en el proyecto PROD

### "Mi build de TestFlight apunta a DEV"
- Verifica que ejecutaste `npm run ios:prod` (NO `ios:dev`)
- Limpia build: `rm -rf ios/App/build` y vuelve a generar

### "Cambios en .env no se reflejan"
- Detén el servidor
- Ejecuta el comando correcto (`ios:dev` o `ios:prod`)
- Los cambios en `.env` requieren rebuild completo
