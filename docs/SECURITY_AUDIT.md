# Security Audit - SmartSpend

**Fecha:** 2026-03-10
**Estado:** En progreso

---

## Resumen

Auditoría de seguridad completa de la arquitectura SmartSpend: RLS policies, Edge Functions, autenticación, rate limiting, y manejo de datos.

**Resultado general:** La app tiene buenas bases (RLS en todas las tablas, PKCE OAuth, sin XSS, sin secrets hardcodeados), pero hay vulnerabilidades importantes en Edge Functions, rate limiting, y validación de datos.

---

## Tareas

### CRITICO

- [ ] **SEC-01: Restringir CORS en Edge Functions**
  - **Riesgo:** Todas las Edge Functions retornan `Access-Control-Allow-Origin: *`, permitiendo que cualquier sitio web haga requests a nuestras funciones en nombre de usuarios autenticados.
  - **Archivos:** Todas las Edge Functions (`parse-batch`, `delete-account`, `redeem-promo`, notificaciones)
  - **Fix:** Crear lista blanca de dominios permitidos (dominio de la app, preview/staging). Para funciones nativas (Capacitor), el origin es `null` — asegurarse de manejarlo.
  - **Notas:** El webhook de RevenueCat no necesita CORS (server-to-server).

- [x] **SEC-02: Validar tamaño de payload en parse-batch**
  - **Riesgo:** No hay límite de tamaño en `audioBase64`, `imageBase64`, ni `data` (texto). Un atacante puede enviar payloads de GB, agotando cuota de Gemini/OpenAI y generando costos.
  - **Archivo:** `supabase/functions/parse-batch/index.ts`
  - **Fix:** Validar antes de procesar:
    - `imageBase64`: max 5MB (después de decodificar base64)
    - `audioBase64`: max 10MB
    - `data` (texto): max 100KB
  - **Retornar:** HTTP 413 si excede el límite.

- [ ] **SEC-03: Corregir rate limit de Pro en parse-batch**
  - **Riesgo:** Hay un TODO olvidado en línea ~75. Pro tiene 50 req/hora en vez de 10. Esto es 5x más de lo planeado, generando costos innecesarios.
  - **Archivo:** `supabase/functions/parse-batch/index.ts:75`
  - **Fix:** Cambiar `50` → `10` en `Ratelimit.slidingWindow()`.

- [ ] **SEC-04: Hacer rate limiting obligatorio en parse-batch**
  - **Riesgo:** Si Upstash Redis no está configurado o cae, `getRateLimiter()` retorna `null` y el rate limiting se desactiva completamente. Cualquier usuario podría hacer requests ilimitados.
  - **Archivo:** `supabase/functions/parse-batch/index.ts:65`
  - **Fix:** Si `rateLimiter` es `null`, retornar HTTP 503 en vez de continuar sin límites. Opcionalmente agregar fallback in-memory como última defensa.

- [ ] **SEC-05: Migrar rate limit de redeem-promo a Redis**
  - **Riesgo:** El rate limiting usa un `Map` in-memory que se resetea en cada cold start de la función. Un atacante puede hacer brute-force de códigos promo esperando cold starts.
  - **Archivo:** `supabase/functions/redeem-promo/index.ts:51-70`
  - **Fix:** Migrar a Upstash Redis (mismo patrón que parse-batch). Límite sugerido: 5 intentos/hora por usuario.

---

### ALTO

- [ ] **SEC-06: Arreglar RLS de push_tokens para guests**
  - **Riesgo:** Las policies de SELECT, UPDATE, y DELETE permiten que cualquier usuario autenticado acceda a tokens de guests (`user_id IS NULL`). Esto permite:
    - Ver metadata de dispositivos de guests (information disclosure)
    - Eliminar tokens de guests (DoS — dejan de recibir notificaciones)
  - **Archivo:** `supabase/migrations/20260201_support_guest_push_tokens.sql` (líneas 38-71)
  - **Fix:** Restringir policies a `auth.uid() = user_id` solamente. Para operaciones de guest tokens, usar funciones SECURITY DEFINER existentes (`upsert_push_token`, `refresh_push_token`).
  - **Migration nueva:** Crear migración SQL que reemplace las 4 policies actuales.

- [ ] **SEC-07: Agregar constraint de tamaño a user_state**
  - **Riesgo:** La columna `state` (JSONB) no tiene límite de tamaño. Un usuario puede subir un estado gigante y consumir almacenamiento de la base de datos.
  - **Archivos:**
    - `supabase/migrations/20260125_create_user_state_with_rls.sql`
    - `src/services/cloudState.service.ts`
  - **Fix:**
    - DB: `ALTER TABLE user_state ADD CONSTRAINT state_size_limit CHECK (octet_length(state::text) <= 5242880);` (5MB)
    - Client: Validar tamaño del snapshot antes de hacer upsert.
  - **Notas:** Verificar primero cuál es el tamaño promedio actual de los estados en producción para definir un límite razonable.

- [ ] **SEC-08: Verificar subscription server-side en parse-batch**
  - **Riesgo:** El plan del usuario (free/pro) se determina client-side. Un usuario free puede manipular localStorage o el request para obtener rate limits de Pro.
  - **Archivos:**
    - `supabase/functions/parse-batch/index.ts`
    - `src/features/batch-entry/hooks/useBatchEntry.ts`
  - **Fix:** En parse-batch, consultar `user_subscriptions` directo en la DB para verificar el plan. No confiar en el valor que venga del cliente.
  - **Notas:** El contador diario client-side (`budget.batchDailyCount.*`) es solo UX — el rate limit real lo debe hacer el servidor.

- [ ] **SEC-09: Rate limit en creación de cuentas anónimas**
  - **Riesgo:** `signInAnonymously()` no tiene rate limiting. Un atacante puede crear miles de cuentas anónimas, cada una con 20 req/día de batch entry, llenando storage y abusando APIs.
  - **Archivo:** Auth flow (Supabase-side)
  - **Fix:** Opciones:
    - Supabase Dashboard: Habilitar rate limit en Auth (si existe la opción)
    - Edge Function wrapper: Crear función que valide device fingerprint antes de crear sesión anónima
    - DB trigger: Limitar cantidad de sesiones anónimas por IP/device
  - **Notas:** El cleanup de anónimos (60 días) es muy lento para mitigar esto. Prevenir es mejor que limpiar.

- [ ] **SEC-10: Sanitizar input contra prompt injection en parse-batch**
  - **Riesgo:** El texto del usuario se concatena directamente en el prompt de Gemini/OpenAI sin sanitización. Un atacante puede inyectar instrucciones que manipulen la respuesta del modelo.
  - **Archivo:** `supabase/functions/parse-batch/index.ts:262, 378`
  - **Fix:**
    - Escapar comillas y caracteres especiales en el input del usuario
    - Agregar instrucciones de sistema que ignoren intentos de override
    - Limitar largo del texto a ~5000 caracteres
    - Validar que la respuesta del modelo tenga estructura esperada (ya se hace parcialmente con JSON schema)
  - **Notas:** No existe protección 100% contra prompt injection, pero capas de defensa reducen el riesgo significativamente.

---

### MEDIO

- [ ] **SEC-11: Usar comparación timing-safe para webhook secret**
  - **Riesgo:** El secret de RevenueCat se compara con `!==` (string comparison simple). Un atacante sofisticado podría usar timing attacks para descubrir el secret carácter por carácter.
  - **Archivo:** `supabase/functions/revenuecat-webhook/index.ts:103-123`
  - **Fix:** Usar `crypto.subtle.timingSafeEqual()` o comparar HMACs en vez de strings directos.

- [ ] **SEC-12: Reducir uso de service_role key**
  - **Riesgo:** Las funciones de notificaciones (`send-daily-reminder`, `send-daily-summary`, `send-upcoming-transactions`) usan `SUPABASE_SERVICE_ROLE_KEY` aunque solo leen datos. Si una función se compromete, el atacante tiene acceso total a la DB.
  - **Archivos:** `supabase/functions/send-daily-reminder/index.ts`, `send-daily-summary/index.ts`, `send-upcoming-transactions/index.ts`
  - **Fix:** Evaluar si se puede usar una key con permisos reducidos (read-only) para funciones que solo leen. Las funciones que escriben (delete-account, revenuecat-webhook, redeem-promo) sí necesitan service_role.
  - **Notas:** Supabase no ofrece keys con permisos intermedios nativamente. Alternativa: crear un rol PostgreSQL read-only y usarlo con RLS.

- [ ] **SEC-13: Resolver race condition en promo codes**
  - **Riesgo:** El optimistic lock en `redeem-promo` puede permitir 1 redemption extra del límite en condiciones de carrera.
  - **Archivo:** `supabase/functions/redeem-promo/index.ts:193-204`
  - **Fix:** Crear una función SQL `SECURITY DEFINER` que haga el incremento atómico con `UPDATE ... SET current_redemptions = current_redemptions + 1 WHERE current_redemptions < max_redemptions`. Si no actualiza ninguna fila, el código está agotado.

- [ ] **SEC-14: Reducir ventana de cleanup de anónimos**
  - **Riesgo:** Usuarios anónimos stale se limpian después de 60 días. Esto da una ventana larga para acumular datos basura si se abusa la creación de cuentas (SEC-09).
  - **Archivo:** `supabase/migrations/20260206_cleanup_stale_anonymous_users_cron.sql`
  - **Fix:** Reducir de 60 a 30 días. Si SEC-09 se implementa, 30 días es suficiente.

- [ ] **SEC-15: Agregar policies explícitas a tablas sin ellas**
  - **Riesgo:** `notification_history` y `promo_codes` dependen de denegación implícita (RLS habilitado sin policies = todo denegado). Funciona, pero es frágil y poco claro.
  - **Archivos:** Migrations de `notification_history` y `promo_codes`
  - **Fix:** Agregar policies explícitas que denieguen INSERT/UPDATE/DELETE para usuarios regulares (`WITH CHECK (false)` / `USING (false)`).

---

## Lo que está bien

- **RLS en todas las tablas** con policies correctas de `auth.uid() = user_id`
- **PKCE OAuth flow** con in-app browser (Apple Guideline 4.0)
- **Cero XSS** — no hay `dangerouslySetInnerHTML`, React escapa todo
- **Sin secrets hardcodeados** — todo por env vars, client solo usa anon key
- **Session expiration** — modal bloqueante que fuerza re-auth
- **Single-device session policy** — al hacer login, se revocan todas las demás sesiones (`signOut({ scope: 'others' })`)
- **Push-only cloud sync** — local es siempre source of truth, cloud es backup. Sin pull-first ni merge logic.
- **Cleanup de anónimos huérfanos** — verifica `is_anonymous = true`
- **SECURITY DEFINER functions** — todas con uso legítimo y verificaciones
- **Delete account** — verifica JWT, cascade correcto
- **Cloud sync** — protección contra data loss (valida snapshots vacíos)
- **Sync lock** — previene race conditions entre tabs
