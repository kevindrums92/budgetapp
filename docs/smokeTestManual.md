# Manual de Smoke Testing - SmartSpend

Casos de prueba manuales para verificar funcionalidad crítica de la aplicación antes de releases.

---

## 1. Onboarding - Welcome Flow

### TC-001: Primera instalación - Usuario nuevo 100%
**Precondiciones:**
- App instalada por primera vez
- No hay localStorage previo
- No hay sesión de Supabase activa

**Pasos:**
1. Abrir la app
2. Verificar que se muestra Welcome screen 1/6
3. Hacer swipe left o click en "Siguiente" para navegar por las 6 pantallas
4. En pantalla 6/6, hacer click en "Comenzar"

**Resultado esperado:**
- ✅ Se muestran las 6 pantallas de Welcome en orden
- ✅ Animaciones fluidas al hacer swipe
- ✅ Dots de progreso actualizados correctamente
- ✅ Botón "Omitir" visible en pantallas 2-5
- ✅ Pantalla 6 muestra "Comenzar" en lugar de "Siguiente"
- ✅ Al completar, navega a Login Screen

---

### TC-002: Skip Welcome Flow
**Precondiciones:**
- App instalada por primera vez
- No hay localStorage previo

**Pasos:**
1. Abrir la app
2. En cualquier pantalla 2-5 del Welcome, hacer click en "Omitir"

**Resultado esperado:**
- ✅ Navega directamente a Login Screen
- ✅ No se pierde el progreso (si vuelve atrás, debe continuar desde donde omitió)

---

### TC-003: Modo invitado - Guest Mode
**Precondiciones:**
- Completado Welcome Flow
- En Login Screen

**Pasos:**
1. En Login Screen, hacer click en "Continuar como invitado"
2. Verificar navegación a First Config pantalla 1 (Idioma)
3. Completar las 5 pantallas de First Config:
   - Pantalla 1: Seleccionar idioma (Español/English)
   - Pantalla 2: Seleccionar tema (Claro/Oscuro/Sistema)
   - Pantalla 3: Seleccionar moneda (usar búsqueda)
   - Pantalla 4: Seleccionar categorías (al menos 3)
   - Pantalla 5: Push notifications (debe auto-skip en web o mostrar en native si es invitado)
   - Pantalla 6: Completar

**Resultado esperado:**
- ✅ Navega correctamente por las 5 pantallas
- ✅ Selecciones persisten al navegar entre pantallas
- ✅ Pantalla 5 (Push) se omite automáticamente en web/guest
- ✅ Pantalla 6 muestra resumen y botón "Comenzar a usar SmartSpend"
- ✅ Al completar, navega a Home (app)
- ✅ Home muestra avatar sin color (gris) indicando modo guest
- ✅ Se pueden crear transacciones sin problemas

---

## 2. Onboarding - First Config

### TC-004: First Config - Validación de selecciones
**Precondiciones:**
- En First Config flow

**Pasos:**
1. En pantalla 4 (Categorías), deseleccionar todas las categorías
2. Intentar avanzar a pantalla 5

**Resultado esperado:**
- ✅ NO permite avanzar si no hay al menos 1 categoría seleccionada
- ✅ Muestra mensaje de error o botón "Continuar" deshabilitado

---

### TC-005: First Config - Persistencia al cerrar app
**Precondiciones:**
- En medio del First Config (pantalla 2 o 3)

**Pasos:**
1. Cerrar la app (Force quit)
2. Reabrir la app

**Resultado esperado:**
- ✅ Retoma desde la última pantalla guardada
- ✅ Selecciones previas persisten (idioma, tema seleccionados)
- ✅ No vuelve a Welcome Flow

---

## 3. Login - Google OAuth

### TC-006: Login con Google - Usuario nuevo
**Precondiciones:**
- Completado Welcome Flow
- En Login Screen
- Cuenta Google sin datos previos en SmartSpend

**Pasos:**
1. Hacer click en "Continuar con Google"
2. Completar flujo OAuth de Google
3. Verificar navegación después del login

**Resultado esperado:**
- ✅ Abre navegador/modal de Google OAuth
- ✅ Permite seleccionar cuenta de Google
- ✅ Después de autenticar, navega a First Config pantalla 1
- ✅ Completa First Config normalmente
- ✅ Al finalizar, navega a Home
- ✅ Avatar muestra color teal indicando cloud sync activo
- ✅ Dot de sincronización verde en TopHeader

---

### TC-007: Login con Google - Usuario que vuelve
**Precondiciones:**
- Usuario ya completó First Config previamente con esta cuenta Google
- Tiene datos guardados en la nube
- Reinstalar app o limpiar localStorage

**Pasos:**
1. Abrir app (Welcome Flow)
2. Omitir Welcome
3. En Login Screen, hacer click en "Continuar con Google"
4. Seleccionar la misma cuenta Google que tiene datos

**Resultado esperado:**
- ✅ Después de autenticar, navega DIRECTAMENTE a Home (NO pasa por First Config)
- ✅ Datos se sincronizan desde la nube (transacciones, categorías visibles)
- ✅ Avatar con color teal
- ✅ Dot de sincronización verde

---

### TC-008: Usuario invitado que conecta cuenta - NO debe repetir First Config
**Precondiciones:**
- Usuario completó First Config como invitado
- Tiene transacciones creadas localmente
- Está en modo guest

**Pasos:**
1. Desde ProfilePage, hacer click en banner "Conectar cuenta"
2. Navega a Login Screen
3. Hacer click en "Continuar con Google"
4. Completar flujo OAuth

**Resultado esperado:**
- ✅ Después de autenticar, navega DIRECTAMENTE a Home (NO pasa por First Config) ⚠️ **CRÍTICO**
- ✅ Transacciones locales se mantienen visibles
- ✅ Avatar cambia de gris a teal (cloud sync activado)
- ✅ Datos locales se sincronizan a la nube automáticamente

---

### TC-009: Logout y login con cuenta diferente
**Precondiciones:**
- Usuario A logueado con Google
- Tiene datos en su cuenta

**Pasos:**
1. Desde ProfilePage, hacer click en "Cerrar sesión"
2. Confirmar logout
3. En Login Screen, hacer click en "Continuar con Google"
4. Seleccionar cuenta Google DIFERENTE (Usuario B)
5. Si Usuario B es nuevo → completa First Config
6. Si Usuario B tiene datos → skip First Config

**Resultado esperado:**
- ✅ Después de logout, localStorage se limpia correctamente
- ✅ Navega a Login Screen (NO a Welcome)
- ✅ Usuario B NO ve datos de Usuario A
- ✅ Si Usuario B es nuevo, pasa por First Config
- ✅ Si Usuario B tiene datos en la nube, skip First Config y carga sus datos

---

## 4. Login - Casos Edge

### TC-010: OAuth error - Retry
**Precondiciones:**
- En Login Screen
- Simular error de red (desconectar WiFi momentáneamente)

**Pasos:**
1. Hacer click en "Continuar con Google"
2. Esperar error de OAuth (network error)
3. Hacer click en "Reintentar" en el modal de error

**Resultado esperado:**
- ✅ Muestra modal de error con botón "Reintentar"
- ✅ Al hacer click en "Reintentar", vuelve a intentar OAuth
- ✅ No queda en estado de loading infinito

---

### TC-011: Usuario cierra OAuth sin completar
**Precondiciones:**
- En Login Screen

**Pasos:**
1. Hacer click en "Continuar con Google"
2. Cuando se abre el navegador/modal de OAuth, cerrarlo sin seleccionar cuenta
3. Verificar estado de la app

**Resultado esperado:**
- ✅ Vuelve a Login Screen
- ✅ NO muestra error
- ✅ Puede intentar login de nuevo
- ✅ Puede elegir "Continuar como invitado" sin problemas

---

### TC-012: Usuario con sesión expirada
**Precondiciones:**
- Usuario logueado con Google
- Sesión de Supabase expirada (token inválido)

**Pasos:**
1. Abrir la app
2. Verificar comportamiento

**Resultado esperado:**
- ✅ Detecta sesión expirada
- ✅ Navega automáticamente a Login Screen
- ✅ NO pierde datos locales
- ✅ Puede volver a loguearse con Google

---

## 5. Push Notifications - Onboarding

### TC-013: Push notification opt-in - Native + Authenticated
**Precondiciones:**
- App nativa (iOS/Android)
- Usuario nuevo logueado con Google
- En First Config pantalla 5

**Pasos:**
1. Llegar a pantalla 5 de First Config (Push Notifications)
2. Verificar que se muestra la pantalla de opt-in
3. Hacer click en "Activar notificaciones"
4. Aceptar permisos en el diálogo del sistema
5. Continuar a pantalla 6

**Resultado esperado:**
- ✅ Pantalla 5 se muestra con información sobre push notifications
- ✅ Diálogo del sistema (iOS/Android) aparece al hacer click
- ✅ Permisos se guardan correctamente
- ✅ Token FCM se registra en Supabase
- ✅ Puede continuar normalmente a pantalla 6

---

### TC-014: Push notification opt-in - Skip
**Precondiciones:**
- App nativa (iOS/Android)
- Usuario nuevo logueado con Google
- En First Config pantalla 5

**Pasos:**
1. Llegar a pantalla 5 de First Config
2. Hacer click en "Omitir" o navegar con swipe
3. Continuar a pantalla 6

**Resultado esperado:**
- ✅ Puede omitir sin problemas
- ✅ NO se solicitan permisos
- ✅ Puede continuar a pantalla 6 normalmente
- ✅ Puede activar push notifications más tarde desde ProfilePage o banner en HomePage

---

### TC-015: Push notification opt-in - Usuario niega permisos
**Precondiciones:**
- App nativa (iOS/Android)
- Usuario nuevo logueado con Google
- En First Config pantalla 5

**Pasos:**
1. Llegar a pantalla 5 de First Config
2. Hacer click en "Activar notificaciones"
3. DENEGAR permisos en el diálogo del sistema
4. Verificar comportamiento

**Resultado esperado:**
- ✅ NO muestra error
- ✅ Puede continuar a pantalla 6
- ✅ Banner de push notifications en HomePage se mostrará más tarde (estrategia de reintento)

---

## 6. Onboarding - Navigation Edge Cases

### TC-016: Botón Back durante First Config
**Precondiciones:**
- En pantalla 3 o 4 de First Config

**Pasos:**
1. Hacer click en botón "Volver" (chevron left)
2. Verificar navegación
3. Volver a avanzar con "Continuar"

**Resultado esperado:**
- ✅ Navega a pantalla anterior correctamente
- ✅ Selecciones previas persisten
- ✅ Puede avanzar de nuevo sin problemas

---

### TC-017: Deep link durante onboarding
**Precondiciones:**
- En medio de First Config
- Recibir deep link externo (ej: OAuth callback, notificación)

**Pasos:**
1. Simular deep link mientras está en First Config
2. Verificar comportamiento

**Resultado esperado:**
- ✅ Completa el flujo del deep link (OAuth, etc.)
- ✅ Retoma First Config donde lo dejó (si corresponde)
- ✅ No pierde progreso

---

## Notas de Testing

### Datos de prueba
- **Cuentas Google de prueba:**
  - user1@test.com (con datos existentes)
  - user2@test.com (sin datos, usuario nuevo)
  - user3@test.com (cuenta alterna para test de multi-user)

### Entornos
- **Dev**: Bundle ID `com.jhotech.smartspend.dev`
- **Prod**: Bundle ID `com.jhotech.smartspend`

### Plataformas a probar
- ✅ Web (PWA)
- ✅ iOS nativo (TestFlight)
- ✅ Android nativo (APK)

### Comandos útiles para testing
```bash
# Limpiar localStorage (consola del navegador)
localStorage.clear()

# Verificar keys de onboarding
localStorage.getItem('onboarding.completed.v1')
localStorage.getItem('onboarding.progress.v1')

# Verificar sesión de Supabase
await supabase.auth.getSession()

# Simular logout
await supabase.auth.signOut()
```

---

## Checklist Pre-Release

Antes de cada release, verificar:
- [ ] TC-001: Primera instalación
- [ ] TC-003: Modo invitado funcional
- [ ] TC-006: Login con Google - Usuario nuevo
- [ ] TC-007: Login con Google - Usuario que vuelve
- [ ] TC-008: Usuario invitado que conecta cuenta ⚠️ **CRÍTICO**
- [ ] TC-009: Logout y login con cuenta diferente
- [ ] TC-013: Push opt-in en native (si aplica)

---

**Última actualización:** 2026-01-29
**Versión de la app:** 0.13.0
