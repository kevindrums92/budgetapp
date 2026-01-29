# Push Notifications - Checklist de Deployment a Producción

## ✅ Pre-requisitos

- [ ] Tienes acceso al SQL Editor de Supabase (producción)
- [ ] Tienes el Firebase Service Account JSON generado
- [ ] Has probado todo en desarrollo y funciona correctamente

## 📦 Paso 1: Database Migrations

### Opción A: Script completo (recomendado)
- [ ] Abre `docs/push-notifications/DEPLOY_TO_PRODUCTION.sql`
- [ ] Copia todo el contenido
- [ ] Pega en el SQL Editor de Supabase (producción)
- [ ] Ejecuta el script completo
- [ ] Verifica que no haya errores en la salida

### Opción B: Migraciones individuales
Si prefieres ejecutar una por una:

1. [ ] `supabase/migrations/20260128_create_push_notifications_tables.sql`
2. [ ] `supabase/migrations/20260128_update_quiet_hours_default.sql`
3. [ ] `supabase/migrations/20260128_fix_push_tokens_rls.sql`
4. [ ] `supabase/migrations/20260128_fix_upsert_preserve_preferences.sql`
5. [ ] `supabase/migrations/20260128_upsert_push_token_final.sql`
6. [ ] `supabase/migrations/20260128_setup_notification_cron_jobs.sql` (opcional)

## 🔥 Paso 2: Firebase Configuration

- [ ] Ve a Firebase Console → Project Settings → Service Accounts
- [ ] Click "Generate new private key"
- [ ] Descarga el archivo JSON
- [ ] **IMPORTANTE:** NO commitees este archivo al repositorio
- [ ] Guarda el JSON en un lugar seguro (1Password, etc.)

## 🚀 Paso 3: Deploy Edge Functions

### 3.1 Deploy las funciones
```bash
# Desde la raíz del proyecto
supabase functions deploy send-daily-reminder
supabase functions deploy send-daily-summary
supabase functions deploy send-upcoming-transactions
```

- [ ] `send-daily-reminder` deployada
- [ ] `send-daily-summary` deployada
- [ ] `send-upcoming-transactions` deployada

### 3.2 Configurar secretos
Ve a Supabase Dashboard → Edge Functions → (selecciona cada función) → Secrets

Para cada una de las 3 funciones:
- [ ] Agregar secreto `FIREBASE_SERVICE_ACCOUNT` con el contenido completo del JSON
  - Copia el JSON **completo** (incluyendo llaves `{ }`)
  - Pega como valor del secreto
  - Debe verse como: `{"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...",...}`

**Nota:** Los secretos `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` se agregan automáticamente.

## 🧪 Paso 4: Verificación

### 4.1 Verificar tablas y funciones (SQL Editor)
```sql
-- Verificar funciones
SELECT proname FROM pg_proc WHERE proname IN ('upsert_push_token', 'refresh_push_token');

-- Verificar tablas
SELECT tablename FROM pg_tables WHERE tablename IN ('push_tokens', 'notification_history');

-- Ver estructura de preferences
SELECT preferences FROM push_tokens LIMIT 1;
```

- [ ] Funciones existen
- [ ] Tablas existen
- [ ] Estructura de preferences es correcta

### 4.2 Test desde la app (desarrollo apuntando a producción)

**IMPORTANTE:** Primero prueba desde dev antes de hacer release.

Flujo de prueba:
1. [ ] Cambiar `.env.local` para apuntar a Supabase producción
2. [ ] Iniciar sesión en la app
3. [ ] Ir a Settings → Notifications
4. [ ] Activar "Permitir notificaciones" (debería pedir permisos del OS)
5. [ ] Cambiar alguna configuración (toggle de daily reminder)
6. [ ] Verificar en logs del navegador: `[PushNotification] Preferences updated successfully`
7. [ ] Ir a Supabase Dashboard → Table Editor → `push_tokens`
8. [ ] Verificar que:
   - Existe un registro con tu `user_id`
   - El campo `preferences` tiene los valores que configuraste
   - `is_active = true`
9. [ ] Cerrar la app completamente
10. [ ] Volver a abrirla
11. [ ] Ir a Settings → Notifications
12. [ ] **VERIFICAR:** Las configuraciones se mantienen (no se resetean a defaults)

- [ ] Token se crea correctamente
- [ ] Preferences se guardan correctamente
- [ ] Preferences persisten después de cerrar/abrir app
- [ ] No hay errores en console

### 4.3 Test de Edge Functions (manual)

Puedes probar manualmente las Edge Functions desde Postman o curl:

```bash
# Test send-upcoming-transactions
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-upcoming-transactions \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Deberías recibir respuesta tipo:
# {"sent": 0, "checked": 0}  (si no hay usuarios con transacciones para mañana)
```

- [ ] Edge Function responde correctamente
- [ ] No hay errores en logs de Edge Function

### 4.4 Test de notificación real (opcional)

Si quieres probar que las notificaciones lleguen:

1. [ ] Crear una transacción pending para mañana en la app
2. [ ] Esperar a que el cron job ejecute (o invocar manualmente la función)
3. [ ] Verificar que llega la notificación al dispositivo
4. [ ] Tap en la notificación → debería abrir el modal de upcoming transactions

## 🔒 Paso 5: Seguridad

- [ ] Archivo Firebase Service Account JSON **NO** está en git
- [ ] `.env.example` tiene instrucciones sobre FIREBASE_SERVICE_ACCOUNT
- [ ] `.gitignore` incluye `docs/push-notifications/*.json`
- [ ] Secretos en Supabase están configurados correctamente

## 📱 Paso 6: Release

Una vez verificado todo:

- [ ] Revertir `.env.local` a desarrollo (o eliminar si usas `.env.dev`)
- [ ] Hacer build de producción
- [ ] Generar release (Capacitor build para iOS/Android)
- [ ] Subir a App Store / Play Store
- [ ] Monitorear logs de Edge Functions durante las primeras 24h

## 🐛 Troubleshooting

### Preferences no persisten
- Verificar que `upsert_push_token` se ejecutó correctamente
- Revisar logs del SQL Editor para ver errores
- Ejecutar test manual en SQL Editor (ver DEPLOY_TO_PRODUCTION.sql)

### Edge Function falla con "Invalid token"
- Verificar que `FIREBASE_SERVICE_ACCOUNT` está configurado correctamente
- Verificar que el JSON tiene el formato correcto (no debe tener caracteres extra)
- Revisar logs de la Edge Function en Supabase Dashboard

### No llegan notificaciones
- Verificar que el cron job está configurado (ver `cron.job`)
- Verificar que el usuario tiene `preferences.daily_reminder.enabled = true`
- Verificar que `push_tokens.is_active = true`
- Revisar `notification_history` para ver si se intentó enviar

---

## 📋 Resumen de archivos

### Para producción:
- ✅ `docs/push-notifications/DEPLOY_TO_PRODUCTION.sql` - Script completo
- ✅ `supabase/migrations/20260128_*.sql` (sin .obsolete)
- ✅ `supabase/functions/send-*` - Edge Functions

### Solo desarrollo (NO deployar):
- ❌ `supabase/migrations/*.sql.obsolete`
- ❌ Logs RAISE NOTICE (ya removidos en versión final)

---

**¿Todo listo?** 🎉

Una vez completado este checklist, tu sistema de push notifications estará 100% funcional en producción.
