# App Store Connect - URLs Required

Esta guía lista todas las URLs que debes agregar en App Store Connect para el envío de SmartSpend.

## 📋 URLs Principales

### 1. **Privacy Policy URL** (Requerido)
```
https://smartspend.jotatech.org/es/privacy-policy
```

**Localización por idioma:**
- 🇪🇸 Español: `https://smartspend.jotatech.org/es/privacy-policy`
- 🇺🇸 English: `https://smartspend.jotatech.org/en/privacy-policy`
- 🇫🇷 Français: `https://smartspend.jotatech.org/fr/privacy-policy`
- 🇵🇹 Português: `https://smartspend.jotatech.org/pt/privacy-policy`

### 2. **Terms of Service URL** (Opcional pero recomendado)
```
https://smartspend.jotatech.org/es/terms-of-service
```

**Localización por idioma:**
- 🇪🇸 Español: `https://smartspend.jotatech.org/es/terms-of-service`
- 🇺🇸 English: `https://smartspend.jotatech.org/en/terms-of-service`
- 🇫🇷 Français: `https://smartspend.jotatech.org/fr/terms-of-service`
- 🇵🇹 Português: `https://smartspend.jotatech.org/pt/terms-of-service`

### 3. **Support URL** (Requerido)
```
https://smartspend.jotatech.org/es/support
```

**Alternativa (Email):**
```
mailto:support@jotatech.org
```

**Nota:** Si no tienes una página de soporte dedicada, puedes usar el email. Apple acepta ambos formatos.

### 4. **Marketing URL** (Opcional)
```
https://smartspend.jotatech.org
```

Esta es la URL principal de la landing page con selector de idioma automático.

---

## 🎯 Dónde Agregar las URLs en App Store Connect

### Paso 1: App Information
1. Ve a **App Store Connect** → Tu App → **App Information**
2. En la sección **General Information**:
   - **Privacy Policy URL**: Agrega la URL de Privacy Policy
   - **Category**: Verifica que esté en "Finance"
   - **Content Rights**: Marca si contiene derechos de terceros

### Paso 2: App Privacy (Data Privacy)
1. Ve a **App Privacy** en el menú lateral
2. Completa el cuestionario de privacidad
3. Agrega el **Privacy Policy URL** nuevamente aquí
4. Asegúrate de marcar correctamente qué datos recopilas:
   - ✅ **Email Address** (para cuentas cloud)
   - ✅ **Name** (para cuentas cloud)
   - ✅ **Photos** (perfil de Google OAuth)
   - ✅ **Financial Info** (transacciones, presupuestos)
   - ✅ **User ID** (Supabase user ID)
   - ❌ **No tracking** (no hay ads ni analytics de terceros)

### Paso 3: Version Information
1. Ve a la **versión actual** de tu app (ej: 1.0)
2. En **General → Support URL**: Agrega el support URL
3. En **General → Marketing URL** (opcional): Agrega el marketing URL

### Paso 4: Localizaciones
Para cada idioma que soportes (es, en, fr, pt):
1. Ve a la **localización** correspondiente
2. Actualiza las URLs si es necesario (usar las URLs con el locale correcto)

---

## ✅ Checklist Final

Antes de enviar a revisión, verifica:

- [ ] Privacy Policy URL agregado en **App Information**
- [ ] Privacy Policy URL agregado en **App Privacy**
- [ ] Support URL agregado en **Version Information**
- [ ] Marketing URL agregado (opcional)
- [ ] Terms of Service URL visible en el app (✅ Ya implementado con in-app browser)
- [ ] Privacy Policy URL visible en el app (✅ Ya implementado con in-app browser)
- [ ] App Privacy cuestionario completado correctamente
- [ ] URLs funcionan correctamente (verificar que no den 404)
- [ ] In-app browser implementado (✅ Ya completado - fix para Guideline 4.0)

---

## 🔗 Verificar URLs antes de enviar

Prueba todas las URLs en un navegador para asegurarte de que funcionan:

```bash
# Privacy Policy
open https://smartspend.jotatech.org/es/privacy-policy
open https://smartspend.jotatech.org/en/privacy-policy
open https://smartspend.jotatech.org/fr/privacy-policy
open https://smartspend.jotatech.org/pt/privacy-policy

# Terms of Service
open https://smartspend.jotatech.org/es/terms-of-service
open https://smartspend.jotatech.org/en/terms-of-service
open https://smartspend.jotatech.org/fr/terms-of-service
open https://smartspend.jotatech.org/pt/terms-of-service

# Landing principal
open https://smartspend.jotatech.org
```

---

## 📝 Notas Importantes

### Apple Guidelines Relacionadas
- **Guideline 4.0**: Links externos deben abrir en in-app browser (✅ Ya implementado)
- **Guideline 5.1.1**: Privacy Policy debe estar accesible y actualizada
- **Guideline 5.1.2**: Data Collection debe estar documentada en App Privacy

### RevenueCat (Suscripciones)
Si Apple te pregunta sobre pagos in-app:
- Usa RevenueCat para procesar suscripciones (✅ Ya configurado)
- Privacy Policy de RevenueCat: `https://www.revenuecat.com/privacy`
- Menciona que RevenueCat procesa información de compra (ya está en Privacy Policy)

### Supabase (Backend)
Si Apple te pregunta sobre almacenamiento de datos:
- Usa Supabase para almacenamiento y auth (✅ Ya configurado)
- Privacy Policy de Supabase: `https://supabase.com/privacy`
- Row Level Security (RLS) implementado para proteger datos de usuarios

---

## 🚀 Próximos Pasos

1. ✅ Verificar que todas las URLs de la landing funcionan
2. ✅ Agregar las URLs en App Store Connect (siguiente tarea)
3. ⏳ Implementar Delete Account (ISSUE #6)
4. ⏳ Verificar App Privacy settings (ISSUE #7)
5. ⏳ Enviar app a revisión nuevamente
