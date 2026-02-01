# Checklist: Configurar Push Notifications en Producción

## 🔥 Firebase Setup (5 min)

### 1. Crear/Seleccionar Proyecto
- [ ] Ir a [Firebase Console](https://console.firebase.google.com/)
- [ ] Crear nuevo proyecto o seleccionar proyecto de producción

### 2. ⚠️ CRÍTICO: Habilitar FCM API
- [ ] Opción A: Firebase Console → Project Settings → Cloud Messaging → "Manage API in Google Cloud Console" → **ENABLE**
- [ ] Opción B: Abrir [este link](https://console.cloud.google.com/apis/library/fcm.googleapis.com) → Seleccionar proyecto → **ENABLE**
- [ ] Esperar 1-2 minutos para que se propague
- [ ] **Sin este paso = Error 401 UNAUTHENTICATED**

### 3. Agregar Apps

**iOS:**
- [ ] Project Settings → General → Add app → iOS
- [ ] Bundle ID: `com.jhotech.smartspend` (SIN .dev)
- [ ] Download `GoogleService-Info.plist`
- [ ] Guardar en `ios/App/App/GoogleService-Info.plist`

**Android:**
- [ ] Project Settings → General → Add app → Android
- [ ] Package name: `com.jhotech.smartspend`
- [ ] Download `google-services.json`
- [ ] Guardar en `android/app/google-services.json`

### 4. ⚠️ CRÍTICO: Configurar APNS (Solo iOS)

**Opción A - APNs Authentication Key (.p8) - RECOMENDADA:**
- [ ] Obtener Key ID desde [Apple Developer - Keys](https://developer.apple.com/account/resources/authkeys/list)
- [ ] Obtener Team ID desde [Apple Developer - Membership](https://developer.apple.com/account/#!/membership)
- [ ] Firebase Console → Cloud Messaging → "Clave de autenticación de APNS" → Subir
- [ ] Seleccionar archivo .p8 (ej: `AuthKey_XXXXX.p8`)
- [ ] Ingresar Key ID (ej: `SZAK75V9LM`)
- [ ] Ingresar Team ID (10 caracteres)
- [ ] Subir

**Opción B - APNs Certificate (.p12) - Solo si no tienes .p8:**
- [ ] Crear CSR con Keychain Access
- [ ] Crear certificado en [Apple Developer - Certificates](https://developer.apple.com/account/resources/certificates/list)
- [ ] Seleccionar "Apple Push Notification service SSL (Sandbox & Production)"
- [ ] App ID: `com.jhotech.smartspend`
- [ ] Upload CSR y descargar .cer
- [ ] Exportar como .p12 desde Keychain Access
- [ ] Firebase Console → Cloud Messaging → "Certificados de APNS" → Subir .p12

**⚠️ Sin APNS configurado, las notificaciones NO llegarán a dispositivos iOS**

### 5. Service Account Key
- [ ] Project Settings → Service Accounts
- [ ] Click "Generate new private key"
- [ ] Descargar JSON (contiene client_email, private_key, project_id)
- [ ] **Guardar en lugar seguro** (lo necesitarás para Supabase)

---

## 💾 Supabase Setup (10 min)

### 1. Habilitar Extensiones
- [ ] Database → Extensions → Buscar `pg_cron` → Enable
- [ ] Database → Extensions → Buscar `pg_net` → Enable

### 2. Ejecutar Migraciones
- [ ] SQL Editor → Ejecutar `supabase/migrations/20260128_create_push_notifications_tables.sql`
- [ ] SQL Editor → Ejecutar `supabase/migrations/20260128_setup_notification_cron_jobs.sql`
- [ ] Verificar tablas creadas: `SELECT * FROM push_tokens;`

### 3. Configurar Vault Secrets
- [ ] Settings → Vault → Add secret:
  - Name: `supabase_url`
  - Secret: `https://TU_PROJECT_ID.supabase.co`
- [ ] Settings → Vault → Add secret:
  - Name: `supabase_service_role_key`
  - Secret: Tu service role key (de Settings → API)

### 4. Deploy Edge Functions

**Opción A - Dashboard (Recomendado):**
- [ ] Edge Functions → Create new function: `send-daily-reminder`
  - Copiar código de `supabase/functions/send-daily-reminder/index.ts`
  - Deploy
- [ ] Edge Functions → Create new function: `send-upcoming-transactions`
  - Copiar código de `supabase/functions/send-upcoming-transactions/index.ts`
  - Deploy
- [ ] Edge Functions → Create new function: `send-daily-summary`
  - Copiar código de `supabase/functions/send-daily-summary/index.ts`
  - Deploy

**Opción B - CLI:**
```bash
supabase link --project-ref TU_PROJECT_REF
supabase functions deploy send-daily-reminder
supabase functions deploy send-upcoming-transactions
supabase functions deploy send-daily-summary
```

### 5. Configurar Secret en Edge Functions

**Para CADA función** (send-daily-reminder, send-upcoming-transactions, send-daily-summary):
- [ ] Edge Functions → Seleccionar función → Secrets
- [ ] Add secret:
  - Name: `FIREBASE_SERVICE_ACCOUNT`
  - Value: **TODO el JSON** del Service Account (paso Firebase #4)
  - Copiar desde `{` hasta `}` incluyendo comillas

---

## 📱 App Setup (5 min)

### 1. Actualizar Archivos Firebase
- [ ] Reemplazar `ios/App/App/GoogleService-Info.plist` (de Firebase paso #3)
- [ ] Reemplazar `android/app/google-services.json` (de Firebase paso #3)

### 2. Verificar Capacitor Config
- [ ] `capacitor.config.ts`:
  ```typescript
  {
    appId: "com.jhotech.smartspend",  // SIN .dev
    appName: "SmartSpend",
  }
  ```

### 3. Actualizar Variables de Entorno
- [ ] `.env.local` o `.env.production`:
  ```
  VITE_SUPABASE_URL=https://TU_PROJECT_ID_PROD.supabase.co
  VITE_SUPABASE_ANON_KEY=TU_ANON_KEY_PROD
  ```

### 4. Build
```bash
npm run build
npx cap sync
```

---

## ✅ Testing (5 min)

### 1. Test Manual de Edge Function
- [ ] Supabase Dashboard → Edge Functions → send-daily-reminder
- [ ] Click "Invoke function"
- [ ] Body: `{}`
- [ ] Verificar logs:
  ```
  [Debug] Has client_email: true
  [Debug] Has private_key: true
  [Debug] Has project_id: true
  [Debug] OAuth response status: 200
  [Debug] Access token generated: true
  ```
- [ ] **Si ves error 401 → Volver a Firebase paso #2 (habilitar API)**

### 2. Test en Dispositivo Real
- [ ] Instalar app en dispositivo
- [ ] Login con usuario
- [ ] Ir a Profile → Configuración de Notificaciones
- [ ] Habilitar permiso de notificaciones
- [ ] Verificar token guardado en Supabase:
  ```sql
  SELECT * FROM push_tokens ORDER BY created_at DESC LIMIT 5;
  ```

### 3. Test de Notificación
- [ ] Configurar daily_reminder para dentro de 2 minutos (hora UTC)
- [ ] Esperar a que llegue la notificación
- [ ] Tap en la notificación → Verificar navegación correcta

### 4. Verificar Cron Jobs
```sql
-- Ver jobs activos
SELECT * FROM cron.job;

-- Ver historial de ejecuciones
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Ver notificaciones enviadas
SELECT * FROM notification_history ORDER BY sent_at DESC LIMIT 10;
```

---

## 🔴 Errores Comunes

### Error 401 UNAUTHENTICATED
**Causa:** Firebase Cloud Messaging API no está habilitada
**Solución:** Firebase paso #2 (habilitar API), esperar 2 minutos, retry

### Error: No active tokens found
**Causa:** Usuario no ha habilitado notificaciones en la app
**Solución:** Ir a Profile → Configuración de Notificaciones → Habilitar

### Notificaciones no llegan
**Causa:** Cron jobs no se ejecutan o preferencias deshabilitadas
**Solución:**
```sql
-- Verificar preferencias del usuario
SELECT preferences FROM push_tokens WHERE user_id = 'USER_ID';

-- Verificar cron jobs
SELECT * FROM cron.job;
```

### Service Account no configurado
**Causa:** Secret FIREBASE_SERVICE_ACCOUNT vacío o malformado
**Solución:** Edge Functions → Función → Secrets → Verificar que el JSON completo esté ahí

---

## 📊 Monitoreo

### Ver estadísticas de notificaciones
```sql
SELECT
  notification_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM notification_history
WHERE sent_at > NOW() - INTERVAL '24 hours'
GROUP BY notification_type;
```

### Ver tokens activos por plataforma
```sql
SELECT
  platform,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as active
FROM push_tokens
GROUP BY platform;
```

### Ver últimas ejecuciones de cron
```sql
SELECT
  jobname,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobname LIKE 'send-%'
ORDER BY start_time DESC
LIMIT 20;
```

---

## ⏰ Cambiar Horarios de Cron Jobs

Los cron jobs usan **UTC** como zona horaria. Para Colombia (UTC-5), debes **sumar 5 horas** al horario deseado.

### Cambiar horario de `send-upcoming-transactions`

**Ejemplo: Para que se ejecute a las 11:00 AM COT (Colombia):**

```sql
-- Ver horario actual
SELECT jobid, schedule, jobname FROM cron.job WHERE jobname = 'send-upcoming-transactions';

-- Cambiar a 11:00 AM COT = 4:00 PM UTC (16:00)
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'send-upcoming-transactions'),
  schedule := '0 16 * * *'  -- Minuto 0, Hora 16 (4:00 PM UTC = 11:00 AM UTC-5)
);

-- Verificar el cambio
SELECT jobid, schedule, jobname FROM cron.job WHERE jobname = 'send-upcoming-transactions';
```

### Formato de Schedule

El formato es: `minuto hora día mes día_de_semana`

**Ejemplos comunes:**
- `0 16 * * *` = 4:00 PM UTC = 11:00 AM COT
- `30 15 * * *` = 3:30 PM UTC = 10:30 AM COT
- `0 14 * * *` = 2:00 PM UTC = 9:00 AM COT

### Conversión rápida UTC ↔ Colombia

| Hora COT (UTC-5) | Hora UTC | Cron Schedule |
|------------------|----------|---------------|
| 8:00 AM | 1:00 PM | `0 13 * * *` |
| 9:00 AM | 2:00 PM | `0 14 * * *` |
| 10:00 AM | 3:00 PM | `0 15 * * *` |
| 11:00 AM | 4:00 PM | `0 16 * * *` |
| 12:00 PM | 5:00 PM | `0 17 * * *` |

---

## 💰 Costos

- **Firebase FCM:** $0 (gratis ilimitado)
- **Supabase Free Tier:** Hasta 5,000 usuarios activos
  - 500k Edge Function invocations/month
  - Estimado: ~86k/month para 1,000 usuarios (17% del límite)
- **Supabase Pro:** $25/month si superas 10,000 usuarios

---

## 🔒 Seguridad

**NUNCA commitear a git:**
- `ios/App/App/GoogleService-Info.plist` (producción)
- `android/app/google-services.json` (producción)
- Firebase Service Account JSON
- `.env.local` / `.env.production`

**Ya están en .gitignore:**
```
ios/App/App/GoogleService-Info.plist
android/app/google-services.json
docs/push-notifications/*.json
.env.local
.env.production
```
