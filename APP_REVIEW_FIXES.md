# 🔄 App Review Fixes - v0.14.5 → v0.15.0

Submission ID: `0fbfa572-e8c5-468b-83ad-fa34251f396d`
Review Date: February 04, 2026
Device: iPad Air 11-inch (M3) - iPadOS 26.2.1

---

## 🔴 ISSUE #1 (CRÍTICO): IAP Purchase Error (Guideline 2.1)

**Error mostrado**: "Error al activar suscripción - No pudimos activar tu prueba gratuita de 7 días"
**Causa**: RevenueCat configuration error (code 23) - "None of the products registered"

### Product IDs configurados en la app:
```typescript
co.smartspend.monthly   // $4.99/month
co.smartspend.annual    // $34.99/year
co.smartspend.lifetime  // $89.99 one-time
```

### ✅ Checklist de corrección:

#### 1. App Store Connect - Verificar IAP Products
- [ ] Ve a App Store Connect → Tu App → Features → In-App Purchases
- [ ] Verifica que existan estos 3 productos con IDs **exactos**
- [ ] Status debe ser "Ready to Submit" o "Approved"
- [ ] Verifica precios:
  - Monthly: $4.99 USD con 7 días free trial
  - Annual: $34.99 USD con 7 días free trial
  - Lifetime: $89.99 USD (no trial)
- [ ] Cada producto debe tener:
  - Display Name
  - Description
  - Review Screenshot
  - Localized info (al menos en-US y es-ES)

#### 2. App Store Connect - Paid Apps Agreement
- [ ] Ve a Agreements, Tax, and Banking
- [ ] Asegúrate de tener el **Paid Apps Agreement** firmado y activo
- [ ] Si no está activo, fírmalo (esto es CRÍTICO para IAPs)

#### 3. RevenueCat Dashboard - Configuración
- [ ] Ve a RevenueCat Dashboard → Tu Proyecto → Products
- [ ] Importa los 3 productos de App Store Connect:
  ```
  co.smartspend.monthly
  co.smartspend.annual
  co.smartspend.lifetime
  ```
- [ ] Crea un Entitlement llamado **`pro`** (CRÍTICO: tu código usa exactamente este nombre)
- [ ] Asocia los 3 productos al entitlement `pro`
- [ ] Crea un Offering llamado **`default`** con 3 packages:
  - Package ID: `monthly` → Product: `co.smartspend.monthly`
  - Package ID: `annual` → Product: `co.smartspend.annual`
  - Package ID: `lifetime` → Product: `co.smartspend.lifetime`

#### 4. RevenueCat - Verificar API Key
- [ ] En RevenueCat Dashboard → Projects → [Tu Proyecto] → API keys
- [ ] Copia la **iOS Production API Key** (empieza con `appl_`)
- [ ] Verifica que esté en tu `.env.local`:
  ```bash
  VITE_REVENUECAT_IOS_API_KEY_PROD=appl_xxxxxxxxxxxxxxxx
  ```
- [ ] Verifica que la build de Xcode tenga acceso a esta variable

#### 5. Probar en Sandbox
```bash
# 1. Crea un Sandbox Tester en App Store Connect → Users and Access → Sandbox Testers
# 2. Sign out de tu Apple ID real en Settings → App Store
# 3. Instala la app desde Xcode
# 4. Intenta comprar → te pedirá login con sandbox tester
# 5. Verifica que la compra funcione sin error
```

**Archivos afectados**: `src/services/revenuecat.service.ts`, `.env.local`

---

## 🟡 ISSUE #2: Promotional Images (Guideline 2.3.2)

**Problema**: Las imágenes promocionales de IAP son iguales al ícono o están duplicadas.

### Solución RÁPIDA (Recomendada para aprobación rápida):
- [ ] Ve a App Store Connect → In-App Purchases → Cada producto (monthly, annual, lifetime)
- [ ] **Elimina** las promotional images
- [ ] Apple permite no tener imágenes promocionales si no planeas promover los IAPs en la Store

### Solución COMPLETA (Opcional, para futuro):
Si quieres promocionar IAPs en la App Store, crea imágenes únicas (1080x1080px):

**Monthly**:
```
Imagen con texto:
"Prueba 7 días GRATIS"
"Luego $4.99/mes"
"Cancela cuando quieras"
```

**Annual** (marca como BEST VALUE):
```
Imagen con texto:
"¡AHORRA 41%!"
"$34.99/año"
"7 días gratis"
```

**Lifetime**:
```
Imagen con texto:
"PAGO ÚNICO"
"$89.99"
"Acceso de por vida"
```

**Archivos afectados**: Ninguno (solo App Store Connect)

---

## 🟡 ISSUE #3: Terms of Use Missing (Guideline 3.1.2)

**Problema**: Falta link funcional a Terms of Use (EULA) en metadata de App Store.

### ✅ Solución:

#### 1. Crear página web pública con Terms & Privacy

**Opción A - GitHub Pages** (Gratis, recomendado):
```bash
# 1. Crea un repo público: smartspend-legal
# 2. Crea index.html con links a terms.html y privacy.html
# 3. Activa GitHub Pages en Settings
# URL final: https://tu-username.github.io/smartspend-legal/terms.html
```

**Opción B - Supabase Storage** (Ya tienes Supabase):
```bash
# 1. Sube archivos HTML a Supabase Storage (bucket público)
# 2. Obtén URLs públicas
# URL final: https://tu-proyecto.supabase.co/storage/v1/object/public/legal/terms.html
```

**Opción C - Termly.io** (Servicio gratuito para generar T&C):
```bash
# 1. Ve a https://termly.io
# 2. Genera Terms & Privacy usando su wizard
# 3. Obtén URLs públicas
```

#### 2. Actualizar App Store Connect
- [ ] Ve a App Store Connect → Tu App → App Information
- [ ] En **Apple Terms of Use (EULA)** field, agrega tu URL:
  ```
  https://tu-dominio.com/terms.html
  ```
- [ ] O agrégalo al final de **App Description**:
  ```
  📄 Legal:
  • Términos de Servicio: https://tu-dominio.com/terms.html
  • Política de Privacidad: https://tu-dominio.com/privacy.html
  ```

#### 3. Actualizar PaywallModal para mostrar links (REQUERIDO en la app)

Apple requiere que los links estén **dentro de la app** en la pantalla de compra.

**Archivo**: `src/shared/components/modals/PaywallModal.tsx`

Agrega esto ANTES del botón "Continuar":

```tsx
{/* Legal Links - REQUIRED by Apple */}
<p className="mt-4 px-6 text-center text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
  Al continuar, aceptas nuestros{' '}
  <button
    type="button"
    onClick={() => {
      window.open('https://tu-dominio.com/terms.html', '_blank');
    }}
    className="text-[#18B7B0] underline"
  >
    Términos de Servicio
  </button>
  {' '}y{' '}
  <button
    type="button"
    onClick={() => {
      window.open('https://tu-dominio.com/privacy.html', '_blank');
    }}
    className="text-[#18B7B0] underline"
  >
    Política de Privacidad
  </button>
  .
</p>
```

**Archivos afectados**: `src/shared/components/modals/PaywallModal.tsx`, App Store Connect metadata

---

## 🟠 ISSUE #4: IAP Sin Registro (Guideline 5.1.1)

**Problema**: La app requiere registro antes de permitir comprar IAPs.

### Análisis del problema:
Actualmente, el PaywallModal solo funciona si el usuario está logueado. Los usuarios guest (modo local) no pueden comprar Pro.

### ✅ Solución: Permitir compras en modo Guest

#### Cambios necesarios:

**1. Actualizar RevenueCatProvider** para funcionar en guest mode:

**Archivo**: `src/shared/components/providers/RevenueCatProvider.tsx`

```tsx
// Configurar RevenueCat con anonymous user si no hay auth
useEffect(() => {
  const initRevenueCat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || `guest_${Date.now()}`; // Anonymous ID for guests
      await configureRevenueCat(userId);
      setIsConfigured(true);
    } catch (error) {
      console.error('[RevenueCatProvider] Failed to configure:', error);
    }
  };

  initRevenueCat();
}, []);
```

**2. Actualizar PaywallModal** para sugerir login DESPUÉS de compra:

**Archivo**: `src/shared/components/modals/PaywallModal.tsx`

Agrega un mensaje debajo del botón "Continuar" para usuarios guest:

```tsx
{!user.email && (
  <p className="mt-3 px-6 text-center text-sm text-gray-600 dark:text-gray-400">
    💡 Tip: Crea una cuenta gratuita después para sincronizar tu suscripción en todos tus dispositivos.
  </p>
)}
```

**3. Actualizar onboarding para NO forzar login**:

**Archivo**: Ya está bien implementado en `LoginScreen.tsx` - tiene modo guest.

**Archivos afectados**:
- `src/shared/components/providers/RevenueCatProvider.tsx`
- `src/shared/components/modals/PaywallModal.tsx`

---

## 🟠 ISSUE #5: Auth en Navegador (Guideline 4.0)

**Problema**: El OAuth (Google/Apple Sign In) abre el navegador externo, lo cual Apple considera mala UX.

### ✅ Solución: Implementar Safari View Controller (iOS)

Apple requiere que el OAuth se maneje **dentro de la app** usando Safari View Controller o autenticación nativa.

#### Opción A: Capacitor Browser Plugin (Recomendado)

**1. Instalar plugin**:
```bash
npm install @capacitor/browser
npx cap sync
```

**2. Actualizar LoginScreen.tsx**:

**Archivo**: `src/features/onboarding/phases/LoginFlow/LoginScreen.tsx`

```tsx
import { Browser } from '@capacitor/browser';
import { isNative } from '@/shared/utils/platform';

const handleGoogleLogin = async () => {
  setLoading(true);
  setError(null);

  try {
    if (isNative()) {
      // iOS/Android: Use in-app browser (Safari View Controller)
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getOAuthRedirectUrl(),
          skipBrowserRedirect: true, // Don't auto-open browser
        },
      });

      if (authError) throw authError;
      if (!data.url) throw new Error('No auth URL');

      // Open in-app browser
      await Browser.open({
        url: data.url,
        presentationStyle: 'popover', // iOS: Modal sheet (like SafariViewController)
      });

      // Listener for deep link callback is already in useEffect
    } else {
      // Web: Use normal OAuth flow
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (authError) throw authError;
    }
  } catch (err: any) {
    console.error('[LoginScreen] Error en Google login:', err);
    setError(err.message || t('login.errorGoogle'));
    setLoading(false);
  }
};
```

**3. Agregar listener para cerrar browser**:

```tsx
useEffect(() => {
  // Close browser when auth succeeds
  const handleOAuthCallback = async () => {
    if (isNative()) {
      await Browser.close();
    }
    // ... rest of callback logic
  };

  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await handleOAuthCallback();
      }
    }
  );

  return () => {
    authListener.subscription.unsubscribe();
  };
}, []);
```

**Archivos afectados**:
- `src/features/onboarding/phases/LoginFlow/LoginScreen.tsx`
- `src/features/onboarding/phases/LoginFlow/LoginProScreen.tsx` (mismo cambio)

---

## 🟠 ISSUE #6: Eliminar Cuenta (Guideline 5.1.1v)

**Problema**: La app permite crear cuenta pero no tiene opción de eliminarla.

### ✅ Solución: Agregar Delete Account en ProfilePage

#### 1. Crear servicio de eliminación de cuenta

**Archivo**: `src/services/account.service.ts` (nuevo)

```typescript
import { supabase } from '@/lib/supabaseClient';

/**
 * Delete user account and all associated data
 *
 * Steps:
 * 1. Delete user data from user_state table (Supabase RLS handles this)
 * 2. Delete auth user (triggers cascade delete)
 * 3. Clear local storage
 */
export async function deleteAccount(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No user logged in');
  }

  // 1. Delete user data from database (optional, auth deletion cascades)
  // Supabase RLS ensures only user's own data is deleted
  const { error: dataError } = await supabase
    .from('user_state')
    .delete()
    .eq('user_id', user.id);

  if (dataError) {
    console.warn('[deleteAccount] Failed to delete user data:', dataError);
    // Continue anyway, auth deletion will cascade
  }

  // 2. Delete auth user (this triggers cascade deletes in DB)
  // Note: This requires Supabase auth.users delete permission
  // Alternative: Call edge function that uses service role key

  // Call edge function to delete user (service role has permission)
  const { error: deleteError } = await supabase.functions.invoke('delete-account', {
    body: { userId: user.id },
  });

  if (deleteError) {
    throw new Error('No se pudo eliminar la cuenta. Por favor contacta a soporte.');
  }

  // 3. Clear local storage
  localStorage.clear();

  // 4. Sign out
  await supabase.auth.signOut();
}
```

#### 2. Crear Edge Function para eliminar usuario

**Archivo**: `supabase/functions/delete-account/index.ts` (nuevo)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role (can delete users)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Service role!
    );

    // Verify requesting user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete user (cascade deletes related data)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('[delete-account] Failed to delete user:', deleteError);
      return new Response(JSON.stringify({ error: 'Failed to delete account' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[delete-account] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

Deploy:
```bash
supabase functions deploy delete-account
```

#### 3. Agregar botón "Eliminar Cuenta" en ProfilePage

**Archivo**: `src/features/profile/pages/ProfilePage.tsx`

Agrega esta sección en "Datos y Seguridad":

```tsx
{isLoggedIn && (
  <MenuItem
    icon={<Trash2 size={20} />}
    label={t('menu.deleteAccount', 'Eliminar Cuenta')}
    sublabel={t('menu.deleteAccountSubtitle', 'Eliminar permanentemente tus datos')}
    onClick={() => setShowDeleteModal(true)}
    showBadge={false}
  />
)}

{/* Delete Account Modal */}
{showDeleteModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div
      className="absolute inset-0 bg-black/50"
      onClick={() => setShowDeleteModal(false)}
    />
    <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
        Eliminar Cuenta
      </h3>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Esta acción es permanente. Se eliminarán todos tus datos, transacciones y suscripción. ¿Estás seguro?
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setShowDeleteModal(false)}
          className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
        >
          {isDeleting ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </div>
  </div>
)}
```

Handler:

```tsx
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);

async function handleDeleteAccount() {
  setIsDeleting(true);
  try {
    const { deleteAccount } = await import('@/services/account.service');
    await deleteAccount();
    // User is signed out and redirected by OnboardingGate
    navigate('/');
  } catch (error: any) {
    console.error('[ProfilePage] Delete account failed:', error);
    setErrorMessage(error.message || 'No se pudo eliminar la cuenta');
  } finally {
    setIsDeleting(false);
    setShowDeleteModal(false);
  }
}
```

**Archivos afectados**:
- `src/services/account.service.ts` (nuevo)
- `supabase/functions/delete-account/index.ts` (nuevo)
- `src/features/profile/pages/ProfilePage.tsx`

---

## 🟡 ISSUE #7: App Tracking Transparency (Guideline 2.1)

**Problema**: Apple no encuentra el permiso de App Tracking Transparency (ATT).

### Análisis:
Verifica si realmente usas tracking. Según Apple:
- **Tracking** = Vincular datos de tu app con datos de terceros para publicidad, o compartir datos con data brokers
- Si NO haces esto, NO necesitas ATT

### ✅ Solución A: Si NO haces tracking (Recomendado)

**1. Verificar que NO uses tracking**:
- ✅ RevenueCat: NO es tracking (solo pagos)
- ✅ Supabase Analytics: NO es tracking (first-party)
- ❌ Facebook Pixel, Google Analytics 4 (con ads), AppsFlyer: SÍ es tracking

**2. Actualizar App Privacy en App Store Connect**:
- [ ] Ve a App Store Connect → Tu App → App Privacy
- [ ] En "Data Collection", asegúrate de que **NO esté marcado "Track" o "Tracking"**
- [ ] Verifica que solo declares lo que realmente recolectas:
  - ✅ Email (para auth)
  - ✅ Purchase History (RevenueCat)
  - ✅ Financial Info (transacciones del usuario)
  - ❌ Advertising Data (NO recolectas esto)

**3. Remover referencias a ATT** (si las hay):

Buscar en Info.plist:
```bash
# Si existe esta key, elimínala (si no haces tracking):
NSUserTrackingUsageDescription
```

### ✅ Solución B: Si SÍ haces tracking

**1. Agregar NSUserTrackingUsageDescription a Info.plist**:

**Archivo**: `ios/App/App/Info.plist`

```xml
<key>NSUserTrackingUsageDescription</key>
<string>Usamos tu actividad para personalizar tu experiencia y mostrarte contenido relevante.</string>
```

**2. Implementar ATT request**:

**Archivo**: `src/App.tsx`

```tsx
import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';

useEffect(() => {
  const requestTracking = async () => {
    if (Capacitor.getPlatform() === 'ios') {
      // Wait for app to be active before requesting
      const { isActive } = await CapacitorApp.getState();
      if (isActive) {
        // Request ATT permission
        // Note: This requires @capacitor/app-tracking-transparency plugin
        const { AppTrackingTransparency } = await import(
          '@capacitor/app-tracking-transparency'
        );
        const { status } = await AppTrackingTransparency.requestPermission();
        console.log('[ATT] Permission status:', status);
      }
    }
  };

  // Request 1 second after app launch (Apple requirement)
  const timer = setTimeout(requestTracking, 1000);
  return () => clearTimeout(timer);
}, []);
```

Install plugin:
```bash
npm install @capacitor/app-tracking-transparency
npx cap sync
```

**Archivos afectados**:
- `ios/App/App/Info.plist`
- `src/App.tsx` (si implementas ATT)
- App Store Connect → App Privacy

---

## 📦 RESUMEN DE ARCHIVOS A MODIFICAR

### Código (si implementas todas las soluciones):
1. `src/shared/components/modals/PaywallModal.tsx` - Agregar legal links
2. `src/shared/components/providers/RevenueCatProvider.tsx` - Guest mode support
3. `src/features/onboarding/phases/LoginFlow/LoginScreen.tsx` - Safari View Controller
4. `src/features/onboarding/phases/LoginFlow/LoginProScreen.tsx` - Safari View Controller
5. `src/features/profile/pages/ProfilePage.tsx` - Delete account button
6. `src/services/account.service.ts` - NEW: Delete account service
7. `supabase/functions/delete-account/index.ts` - NEW: Edge function
8. `ios/App/App/Info.plist` - ATT description (si es necesario)

### Configuración externa:
1. **App Store Connect**:
   - Verificar IAP products
   - Agregar EULA link
   - Eliminar promotional images (o crear únicas)
   - Actualizar App Privacy (tracking)

2. **RevenueCat Dashboard**:
   - Configurar products
   - Crear entitlement "pro"
   - Crear offering "default"
   - Verificar API keys

3. **GitHub Pages / Web**:
   - Crear página pública con Terms & Privacy

---

## 🚀 ORDEN RECOMENDADO DE IMPLEMENTACIÓN

### Fase 1 - Fixes críticos (hacer primero):
1. ✅ [ISSUE #1] Configurar RevenueCat correctamente (IAP error)
2. ✅ [ISSUE #3] Crear Terms/Privacy públicos + agregar links en PaywallModal
3. ✅ [ISSUE #2] Eliminar promotional images de IAPs

### Fase 2 - Fixes importantes:
4. ✅ [ISSUE #6] Implementar Delete Account
5. ✅ [ISSUE #7] Verificar/actualizar App Privacy (ATT)

### Fase 3 - UX improvements (puede ser para siguiente versión si urge aprobar):
6. ✅ [ISSUE #4] Permitir IAP sin registro (guest mode)
7. ✅ [ISSUE #5] Safari View Controller para OAuth

---

## 📝 TESTING ANTES DE RESUBMIT

### Checklist de pruebas:

#### IAP (CRÍTICO):
- [ ] Compra Monthly en sandbox → Funciona sin error
- [ ] Compra Annual en sandbox → Funciona sin error
- [ ] Compra Lifetime en sandbox → Funciona sin error
- [ ] Restore purchases → Restaura correctamente
- [ ] Trial de 7 días se activa correctamente

#### Legal:
- [ ] PaywallModal muestra links a Terms y Privacy
- [ ] Los links abren correctamente (incluso sin login)
- [ ] Los links funcionan en iPad

#### Delete Account:
- [ ] Botón "Eliminar Cuenta" visible en Profile
- [ ] Modal de confirmación se muestra
- [ ] Eliminación funciona y limpia datos
- [ ] Usuario es redirigido a login después de eliminar

#### Auth:
- [ ] Login con Google abre Safari View Controller (no navegador externo)
- [ ] Login con Apple abre Safari View Controller
- [ ] Deep link callback funciona correctamente

---

## 💬 RESPUESTA A APP REVIEW (Draft)

Cuando resubmitas, responde en App Store Connect:

```
Hello Apple Review Team,

Thank you for your feedback. We have addressed all the issues mentioned:

1. **IAP Purchase Error (2.1)**: Fixed RevenueCat configuration. Products are now correctly registered and purchases work in sandbox.

2. **Promotional Images (2.3.2)**: Removed duplicate promotional images from all IAP products.

3. **Terms of Use (3.1.2)**:
   - Added public Terms of Service URL: [TU URL AQUÍ]
   - Added Privacy Policy URL: [TU URL AQUÍ]
   - Updated paywall screen to include functional links to both documents

4. **IAP Without Registration (5.1.1)**: Users can now purchase subscriptions without creating an account. Account creation is optional and only required for cloud sync.

5. **In-App Authentication (4.0)**: Implemented Safari View Controller for OAuth. Users are no longer redirected to external browser.

6. **Account Deletion (5.1.1v)**: Added "Delete Account" option in Profile → Data & Security. Users can permanently delete their account and all associated data.

7. **App Tracking Transparency (2.1)**: [OPCIÓN A: "Our app does not track users. Updated App Privacy declaration to reflect this." / OPCIÓN B: "Implemented ATT permission request on app launch."]

All changes have been tested on iPad Air 11-inch (M3) with iPadOS 26.2.1.

Please let us know if you need any additional information.

Best regards,
[Tu nombre]
```

---

## 🎯 DEADLINE

Si quieres aprobación rápida:
- **Mínimo**: Implementa Fase 1 (issues #1, #2, #3) + issue #6 (delete account) + issue #7 (ATT)
- **Ideal**: Implementa todo (2-3 días de trabajo)

**Versión a subir**: v0.15.0 (incrementa minor version por features nuevas)

---

## 📞 SOPORTE

Si necesitas ayuda específica con algún issue, puedo:
1. Implementar los cambios de código por ti
2. Crear los Edge Functions de Supabase
3. Guiarte en la configuración de RevenueCat
4. Crear las páginas legales (Terms/Privacy)

Dime qué prefieres empezar primero. 🚀
