# Push Notifications - Migraciones para Producción

## Orden de ejecución

Ejecutar estas migraciones en orden en tu base de datos de producción:

### 1. Crear tablas base
**Archivo:** `supabase/migrations/20260128_create_push_notifications_tables.sql`

Crea:
- Enum `platform_type` (ios, android)
- Tabla `push_tokens` con defaults de preferences
- Enum `notification_status` y `notification_type`
- Tabla `notification_history`
- Función `update_updated_at_column()` y trigger
- RLS policies básicas

### 2. Actualizar quiet hours default
**Archivo:** `supabase/migrations/20260128_update_quiet_hours_default.sql`

Cambia quiet hours de 22:00-08:00 a 23:59-00:00 (ventana mínima cuando está deshabilitado).

### 3. Arreglar RLS policies
**Archivo:** `supabase/migrations/20260128_fix_push_tokens_rls.sql`

Modifica RLS policies para permitir:
- Ver cualquier token (necesario para upsert)
- Actualizar tokens de otros usuarios (token takeover en mismo dispositivo)

### 4. Función refresh_push_token
**Archivo:** `supabase/migrations/20260128_fix_upsert_preserve_preferences.sql`

Crea función `refresh_push_token()` que actualiza metadata SIN tocar preferences.
Usada para token refresh en app restart.

### 5. Función upsert_push_token (FINAL)
**Archivo:** `supabase/migrations/20260128_upsert_push_token_final.sql`

Versión limpia de producción de `upsert_push_token()` que permite actualizar preferences.
Usada para cambios de preferencias del usuario.

### 6. Setup cron jobs
**Archivo:** `supabase/migrations/20260128_setup_notification_cron_jobs.sql`

Configura pg_cron para ejecutar notificaciones:
- `send-daily-reminder` a las 12:00 UTC (20:00 Colombia)
- `send-daily-summary` a las 00:00 UTC (20:00 Colombia del día anterior)
- `send-upcoming-transactions` a las 00:01 UTC

---

## Migraciones de desarrollo/debug (NO ejecutar en producción)

Estas migraciones solo se usaron para debugging local:

- ❌ `20260128_add_upsert_push_token_function.sql` - Versión inicial (reemplazada por final)
- ❌ `20260128_debug_upsert_push_token.sql` - Versión con logs RAISE NOTICE

---

## Verificación post-migración

Después de ejecutar todas las migraciones, verifica:

```sql
-- 1. Verificar que las funciones existen
SELECT proname, prosrc
FROM pg_proc
WHERE proname IN ('upsert_push_token', 'refresh_push_token', 'update_updated_at_column');

-- 2. Verificar que los cron jobs están configurados (si aplica)
SELECT * FROM cron.job WHERE jobname LIKE 'send-%';

-- 3. Verificar estructura de la tabla
\d push_tokens

-- 4. Test manual de upsert (reemplaza con tus datos)
SELECT upsert_push_token(
  'tu-user-id'::uuid,
  'test-token',
  'ios'::platform_type,
  '{"test": true}'::jsonb,
  '{"quiet_hours":{"end":"00:00","start":"23:59","enabled":true},"daily_summary":{"time":"20:00","enabled":true},"daily_reminder":{"time":"20:00","enabled":true},"scheduled_transactions":false}'::jsonb
);

-- 5. Verificar que se guardó correctamente
SELECT preferences FROM push_tokens WHERE token = 'test-token';
```

---

## Resumen de funciones finales

### `upsert_push_token(user_id, token, platform, device_info, preferences)`
- Crea o actualiza un token
- **Actualiza preferences** con el valor pasado
- Usado cuando el usuario cambia configuraciones

### `refresh_push_token(user_id, token, platform, device_info)`
- Actualiza metadata (user_id, platform, device_info)
- **NO toca preferences** (las preserva)
- Usado en app restart o token refresh automático
