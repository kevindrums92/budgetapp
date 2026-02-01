# Guest Push Tokens - Soporte de Notificaciones para Usuarios Invitados

## Resumen

Esta implementación permite que usuarios invitados (guest mode, sin autenticación) puedan recibir notificaciones push, y migra automáticamente sus tokens cuando se autentican.

## Cambios Implementados

### 1. Migración de Base de Datos

**Archivo:** `supabase/migrations/20260201_support_guest_push_tokens.sql`

**Cambios principales:**

- ✅ `user_id` ahora es **nullable** en `push_tokens` (permite tokens sin usuario)
- ✅ `user_id` ahora es **nullable** en `notification_history`
- ✅ Nuevo índice: `idx_push_tokens_token_active` para queries por token
- ✅ Políticas RLS actualizadas para permitir operaciones de guest users
- ✅ Funciones RPC actualizadas (`upsert_push_token`, `refresh_push_token`)
- ✅ Nueva función: `migrate_guest_token_to_user()` para migración al loguearse

**Para aplicar la migración:**

```bash
# En Supabase local
supabase db reset

# O aplicar directamente en producción
supabase db push
```

### 2. Servicio de Push Notifications

**Archivo:** `src/services/pushNotification.service.ts`

**Cambios principales:**

#### `saveTokenToBackend()`
- Ahora acepta `user_id = null` para usuarios invitados
- Guarda tokens en la base de datos incluso sin autenticación
- Logs diferenciados para modo guest vs autenticado

#### `getPreferences()`
- Query por `token` en lugar de por `user_id` + `token`
- Funciona para ambos: autenticados y guests

#### `updatePreferences()`
- Acepta `user_id = null` para guests
- Permite actualizar preferencias en modo invitado

#### Nueva función: `migrateGuestTokenToUser()`
```typescript
export async function migrateGuestTokenToUser(): Promise<boolean>
```
- Migra un token de guest a usuario autenticado
- Llamada automáticamente cuando el usuario se loguea
- Preserva las preferencias de notificaciones del guest

### 3. Onboarding de Notificaciones

**Archivo:** `src/features/onboarding/phases/FirstConfig/screens/Screen5_Notifications.tsx`

**Cambios principales:**

- ❌ Removido auto-skip para usuarios invitados
- ✅ Ahora se muestra la pantalla de notificaciones en modo guest
- ✅ Solo hace auto-skip en web (no en native guests)

**Antes:**
```typescript
// Auto-skip for web or guest users
if (!isNative() || !session) {
  navigate(NEXT_STEP);
}
```

**Ahora:**
```typescript
// Auto-skip only for web (not for native guest users)
if (!isNative()) {
  navigate(NEXT_STEP);
}
```

### 4. CloudSyncGate - Migración Automática

**Archivo:** `src/shared/components/providers/CloudSyncGate.tsx`

**Cambios principales:**

- Importa `migrateGuestTokenToUser` del servicio
- Llama automáticamente a la migración cuando detecta `SIGNED_IN` event

```typescript
if (event === "SIGNED_IN") {
  console.log("[CloudSyncGate] SIGNED_IN event received, re-initializing...");

  // Migrate any guest push token to the authenticated user
  migrateGuestTokenToUser().then((migrated) => {
    if (migrated) {
      console.log("[CloudSyncGate] Guest push token migrated to authenticated user");
    }
  });

  initializedRef.current = false;
  initForSession();
}
```

## Flujo Completo

### Escenario 1: Usuario Invitado Habilita Push

1. Usuario está en modo invitado (no autenticado)
2. Llega a la pantalla de onboarding de notificaciones
3. Acepta el permiso de notificaciones
4. **Token se guarda en la BD con `user_id = NULL`**
5. Se aplican las `DEFAULT_NOTIFICATION_PREFERENCES`
6. Usuario recibe notificaciones normalmente

**Logs esperados:**
```
[PushNotification] Permission result: granted
[PushNotification] FCM Token obtained
[PushNotification] Token saved (guest mode): <token_id>
```

### Escenario 2: Usuario Invitado se Loguea

1. Usuario invitado con push habilitado
2. Usuario se autentica (login con email/OTP)
3. `CloudSyncGate` detecta evento `SIGNED_IN`
4. **Llama automáticamente a `migrateGuestTokenToUser()`**
5. El token se actualiza: `user_id = NULL` → `user_id = <uuid>`
6. Preferencias de notificaciones se preservan
7. Otros tokens del usuario se desactivan (solo 1 activo por usuario)

**Logs esperados:**
```
[CloudSyncGate] SIGNED_IN event received, re-initializing...
[PushNotification] Guest token migrated to user: <token_id>
[CloudSyncGate] Guest push token migrated to authenticated user
```

### Escenario 3: Usuario Autenticado Habilita Push

1. Usuario autenticado
2. Acepta el permiso de notificaciones
3. **Token se guarda en la BD con `user_id = <uuid>`**
4. Se aplican las `DEFAULT_NOTIFICATION_PREFERENCES`

**Logs esperados:**
```
[PushNotification] Permission result: granted
[PushNotification] FCM Token obtained
[PushNotification] Token saved (authenticated): <token_id>
```

## Estructura de la Base de Datos

### Tabla `push_tokens`

```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL,  -- ✅ NULLABLE para guests
  token TEXT NOT NULL UNIQUE,
  platform platform_type NOT NULL,
  device_info JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{...}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Ejemplos de Registros

**Token de Guest:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": null,
  "token": "fcm_token_abc123",
  "platform": "ios",
  "preferences": {
    "scheduled_transactions": true,
    "daily_reminder": { "enabled": true, "time": "02:00" },
    "daily_summary": { "enabled": true, "time": "02:00" },
    "quiet_hours": { "enabled": true, "start": "06:00", "end": "13:00" }
  },
  "is_active": true
}
```

**Token Migrado (después de login):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "token": "fcm_token_abc123",
  "platform": "ios",
  "preferences": {
    "scheduled_transactions": true,
    "daily_reminder": { "enabled": true, "time": "02:00" },
    "daily_summary": { "enabled": true, "time": "02:00" },
    "quiet_hours": { "enabled": true, "start": "06:00", "end": "13:00" }
  },
  "is_active": true
}
```

## Políticas RLS

### SELECT
```sql
CREATE POLICY "Users can view tokens"
  ON push_tokens FOR SELECT
  USING (
    user_id IS NULL OR  -- Guest tokens
    auth.uid() = user_id  -- Own tokens
  );
```

### INSERT
```sql
CREATE POLICY "Users can insert tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (
    user_id IS NULL OR  -- Guest token
    auth.uid() = user_id  -- Own token
  );
```

### UPDATE
```sql
CREATE POLICY "Users can update tokens"
  ON push_tokens FOR UPDATE
  USING (
    user_id IS NULL OR  -- Guest tokens
    auth.uid() = user_id  -- Own tokens
  )
  WITH CHECK (
    user_id IS NULL OR  -- Can update to guest
    auth.uid() = user_id  -- Or to self
  );
```

## Funciones RPC

### `upsert_push_token()`

```sql
CREATE OR REPLACE FUNCTION upsert_push_token(
  p_user_id UUID,  -- Acepta NULL
  p_token TEXT,
  p_platform platform_type,
  p_device_info JSONB,
  p_preferences JSONB
)
RETURNS UUID
```

- Inserta o actualiza un token
- Si `p_user_id` es NULL, es un token de guest
- Permite migración de guest → autenticado

### `refresh_push_token()`

```sql
CREATE OR REPLACE FUNCTION refresh_push_token(
  p_user_id UUID,  -- Acepta NULL
  p_token TEXT,
  p_platform platform_type,
  p_device_info JSONB
)
RETURNS UUID
```

- Actualiza metadata sin tocar preferencias
- Funciona para guests y autenticados

### `migrate_guest_token_to_user()`

```sql
CREATE OR REPLACE FUNCTION migrate_guest_token_to_user(
  p_user_id UUID,
  p_token TEXT
)
RETURNS UUID
```

- Migra un token de guest (`user_id = NULL`) a usuario autenticado
- Desactiva otros tokens activos del usuario
- Retorna el `token_id` migrado

## Testing

### Test Manual 1: Guest Habilita Push

1. Desinstalar la app o limpiar datos
2. Abrir app en modo guest
3. Completar onboarding hasta la pantalla de notificaciones
4. Aceptar el permiso
5. Verificar en logs: `Token saved (guest mode)`
6. Verificar en Supabase:
   ```sql
   SELECT * FROM push_tokens WHERE user_id IS NULL;
   ```

### Test Manual 2: Guest → Login

1. Con push habilitado en guest mode
2. Ir a perfil → Login
3. Autenticarse con email/OTP
4. Verificar en logs: `Guest push token migrated to authenticated user`
5. Verificar en Supabase:
   ```sql
   SELECT user_id, token, is_active
   FROM push_tokens
   WHERE token = '<tu_token>';
   -- user_id debe tener un UUID ahora
   ```

### Test Manual 3: Preferencias se Preservan

1. En guest mode, cambiar preferencias de notificaciones
2. Loguearse
3. Verificar que las preferencias se mantienen

## Troubleshooting

### Error: "No authenticated user, skipping token save"

**Causa:** Versión antigua del servicio que no soporta guests

**Solución:** Asegurar que tienes la versión actualizada de `pushNotification.service.ts`

### Error: "null value in column 'user_id' violates not-null constraint"

**Causa:** La migración de base de datos no se aplicó

**Solución:** Aplicar la migración `20260201_support_guest_push_tokens.sql`

### Token no se migra al loguearse

**Causa:** `migrateGuestTokenToUser()` no se llama en `CloudSyncGate`

**Solución:** Verificar que `CloudSyncGate.tsx` tiene el código de migración en el evento `SIGNED_IN`

## Compatibilidad

✅ **Compatible con usuarios autenticados existentes** (no rompe nada)

✅ **Backward compatible** con tokens existentes en la BD

✅ **No requiere cambios en Edge Functions** (envío de notificaciones sigue igual)

## Notas Importantes

1. **Guest tokens no tienen RLS strict**: Los tokens de guest pueden ser vistos por cualquiera en teoría, pero solo pueden ser modificados por el mismo token (via RPC SECURITY DEFINER)

2. **Un guest puede tener solo 1 token activo**: Si el usuario reinstala la app, el token viejo se reutiliza o se crea uno nuevo

3. **Migración automática**: No requiere acción del usuario, sucede transparentemente al loguearse

4. **Edge Functions**: No requieren cambios. Pueden enviar notificaciones a usuarios autenticados o guests por igual, simplemente buscando por `is_active = true`
