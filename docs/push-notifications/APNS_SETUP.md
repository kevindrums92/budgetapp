# Configurar APNS (Apple Push Notification Service)

## ¿Por qué es necesario?

Firebase Cloud Messaging (FCM) necesita **APNS** para enviar notificaciones a dispositivos iOS. Sin APNS configurado, las notificaciones funcionarán en Android pero NO en iOS.

---

## Opción 1: APNs Authentication Key (.p8) - RECOMENDADA ✅

La Authentication Key:
- **No expira nunca** (a diferencia del certificado que expira cada año)
- Es más fácil de configurar
- Es el método recomendado por Apple y Firebase

### Paso 1: Obtener información de Apple Developer

#### 1.1 Obtener Key ID

1. Ve a [Apple Developer - Keys](https://developer.apple.com/account/resources/authkeys/list)
2. Login con tu Apple ID de desarrollador
3. Busca tu key en la lista (debería tener Push Notifications habilitado)
4. El **Key ID** es el código que aparece en la columna izquierda (ej: `SZAK75V9LM`)
5. Anótalo

**Si no tienes una key creada:**
1. Click en **"+"** para crear una nueva
2. Key Name: "Firebase Push Notifications"
3. Enable: **Apple Push Notifications service (APNs)**
4. Click **Continue** → **Register**
5. **Download** el archivo .p8 (solo se puede descargar UNA VEZ, guárdalo en lugar seguro)
6. Anota el **Key ID** que se muestra

#### 1.2 Obtener Team ID

1. Ve a [Apple Developer - Membership](https://developer.apple.com/account/#!/membership)
2. Busca **Team ID** (es un código de 10 caracteres alfanuméricos)
3. Ejemplo: `ABC123XYZ4` o `X5G8H2K9L3`
4. Anótalo

### Paso 2: Subir a Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. **Project Settings** (ícono de engranaje) → **Cloud Messaging**
4. Scroll down hasta **"Clave de autenticación de APNS"**
5. Click en **"Subir"**
6. **Archivo**: Seleccionar tu archivo .p8 (ej: `AuthKey_SZAK75V9LM.p8`)
7. **Key ID**: Pegar el Key ID (ej: `SZAK75V9LM`)
8. **Team ID**: Pegar tu Team ID de 10 caracteres
9. Click **"Subir"**

### Paso 3: Verificar

Deberías ver:
```
✅ Clave de autenticación de APNS
   Archivo: AuthKey_SZAK75V9LM.p8
   ID de clave: SZAK75V9LM
   ID de equipo: ABC123XYZ4
```

---

## Opción 2: APNs Certificate (.p12) - Solo si no tienes .p8

El certificado:
- **Expira cada año** (necesitas renovarlo manualmente)
- Requiere más pasos de configuración
- Es el método legacy

### Paso 1: Crear Certificate Signing Request (CSR)

1. Abrir **Keychain Access** (Acceso a Llaveros) en Mac
2. Menu → **Keychain Access** → **Certificate Assistant** → **Request a Certificate From a Certificate Authority**
3. **User Email Address**: Tu email de Apple Developer
4. **Common Name**: "Firebase Push Notification Certificate"
5. **Request is**: Seleccionar **"Saved to disk"**
6. Click **Continue**
7. Guardar como `CertificateSigningRequest.certSigningRequest`

### Paso 2: Crear certificado en Apple Developer

1. Ve a [Apple Developer - Certificates](https://developer.apple.com/account/resources/certificates/list)
2. Click **"+"** para crear nuevo certificado
3. Seleccionar **"Apple Push Notification service SSL (Sandbox & Production)"**
4. Click **Continue**
5. **App ID**: Seleccionar `com.jhotech.smartspend` (o tu Bundle ID de producción)
6. Click **Continue**
7. **Choose File**: Seleccionar el CSR que creaste en Paso 1
8. Click **Continue**
9. **Download** el certificado (.cer)

### Paso 3: Convertir .cer a .p12

1. Doble click en el archivo .cer descargado para agregarlo a Keychain Access
2. Abrir **Keychain Access**
3. En la barra lateral, seleccionar **"My Certificates"** (o "login" → "Certificates")
4. Buscar certificado que dice: **"Apple Push Services: com.jhotech.smartspend"**
5. **Right click** en el certificado → **Export "Apple Push Services..."**
6. **File Format**: Seleccionar **"Personal Information Exchange (.p12)"**
7. **Save As**: `FirebasePushCertificate.p12`
8. Click **Save**
9. **Password**: Ingresar una contraseña (anótala, la necesitarás en Firebase)
10. **Verify**: Repetir la contraseña
11. Ingresar contraseña de tu Mac si se solicita

### Paso 4: Subir .p12 a Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. **Project Settings** → **Cloud Messaging**
4. Scroll down hasta **"Certificados de APNS"**
5. En la sección **"Producción"**, click **"Subir"**
6. **Archivo**: Seleccionar `FirebasePushCertificate.p12`
7. **Password**: Ingresar la contraseña que pusiste en Paso 3
8. Click **Subir**

### Paso 5: Renovación Anual

⚠️ **IMPORTANTE**: Los certificados expiran cada año. Debes:
1. Crear nuevo CSR (Paso 1)
2. Crear nuevo certificado en Apple Developer (Paso 2)
3. Convertir a .p12 (Paso 3)
4. Subir a Firebase (Paso 4)

---

## Testing

Después de configurar APNS, prueba enviando una notificación:

### Test desde Supabase Dashboard

1. Edge Functions → `send-daily-reminder`
2. Click **Invoke function**
3. Body: `{}`
4. Verificar logs:
   ```
   [Debug] FCM response status: 200
   ✅ Notificación enviada
   ```

### Test en dispositivo iOS real

1. Instalar app en iPhone/iPad
2. Login con usuario
3. Ir a **Profile → Configuración de Notificaciones**
4. Habilitar permiso de notificaciones (popup del sistema)
5. Configurar **Recordatorio diario** para dentro de 2 minutos
6. Esperar a que llegue la notificación
7. Tap en la notificación → Verificar que abre la app correctamente

---

## Troubleshooting

### Error: "Invalid APNs credentials"
**Causa**: Key ID o Team ID incorrectos
**Solución**:
1. Verificar Key ID en [Apple Developer - Keys](https://developer.apple.com/account/resources/authkeys/list)
2. Verificar Team ID en [Apple Developer - Membership](https://developer.apple.com/account/#!/membership)
3. Re-subir en Firebase con datos correctos

### Error: "APNs certificate expired"
**Causa**: El certificado .p12 expiró (después de 1 año)
**Solución**:
1. Crear nuevo certificado siguiendo Opción 2
2. O mejor, migrar a Authentication Key (.p8) que no expira

### Las notificaciones no llegan a iOS pero sí a Android
**Causa**: APNS no configurado o mal configurado
**Solución**:
1. Verificar que APNS esté configurado en Firebase Console → Cloud Messaging
2. Verificar que Bundle ID en Firebase coincida con el de la app (`com.jhotech.smartspend`)
3. Verificar que capabilities de Push Notifications estén habilitadas en Xcode

### Bundle ID mismatch
**Causa**: El certificado/key fue creado para un Bundle ID diferente
**Solución**:
1. Verificar que el App ID en Apple Developer sea `com.jhotech.smartspend`
2. Verificar que el Bundle ID en Firebase iOS app sea `com.jhotech.smartspend`
3. Verificar que el Bundle ID en Xcode (App target) sea `com.jhotech.smartspend`

---

## Diferencias entre .p8 y .p12

| Feature | .p8 (Authentication Key) | .p12 (Certificate) |
|---------|-------------------------|-------------------|
| Expiración | ❌ No expira | ✅ Expira cada año |
| Renovación | No requiere | Requiere cada año |
| Configuración | Más simple (2 pasos) | Más compleja (4 pasos) |
| Recomendado por Apple | ✅ Sí | ❌ Legacy |
| Múltiples apps | ✅ Una key para todas | ❌ Un cert por app |
| Revocable | ✅ Sí | ✅ Sí |

**Recomendación**: Siempre usa .p8 (Authentication Key) a menos que tengas una razón específica para usar certificado.

---

## Security

**NUNCA commitear a git:**
- `AuthKey_*.p8` ← APNs Authentication Key
- `*.p12` ← APNs Certificate
- `*.cer` ← APNs Certificate
- `CertificateSigningRequest.certSigningRequest` ← CSR

**Estos archivos ya están en .gitignore:**
```
*.p8
*.p12
*.cer
*.certSigningRequest
```

**Guardar en:**
- 1Password / LastPass / Bitwarden
- Encrypted vault (Supabase Vault para service accounts)
- Local encrypted folder (nunca en cloud sin encriptar)
