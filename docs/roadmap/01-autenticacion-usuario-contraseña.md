# Feature: Autenticación con Usuario y Contraseña

## Resumen

Implementar un sistema completo de autenticación que permita a los usuarios iniciar sesión utilizando email o teléfono + contraseña, con validación OTP (One-Time Password) para dispositivos no seguros y flujo de registro de nuevos usuarios.

## Objetivos

- Permitir a usuarios existentes iniciar sesión con email/teléfono y contraseña
- Validar la identidad mediante código OTP de 6 dígitos
- Implementar marcado de dispositivos seguros para evitar OTP repetido
- Proporcionar flujo de registro para nuevos usuarios
- Mantener UX consistente con el diseño actual de la app

## Casos de Uso

### 1. Inicio de Sesión - Usuario Existente

**Actor**: Usuario registrado

**Flujo Principal**:
1. Usuario navega a pantalla de login
2. Usuario ingresa email o teléfono en campo "Email o Teléfono"
3. Usuario ingresa contraseña en campo "Contraseña"
4. Usuario presiona botón "Continuar"
5. Sistema valida credenciales
6. Si dispositivo NO está marcado como seguro:
   - Sistema genera código OTP de 6 dígitos
   - Sistema envía OTP al email/teléfono del usuario
   - Sistema redirige a pantalla de validación OTP
7. Si dispositivo está marcado como seguro:
   - Sistema autentica directamente
   - Usuario es redirigido a HomePage

**Flujos Alternativos**:

**A1: Credenciales Incorrectas**
- Sistema muestra mensaje de error: "Email o contraseña incorrectos"
- Usuario permanece en pantalla de login
- Se muestra opción "Crear cuenta" destacada

**A2: Usuario No Encontrado**
- Sistema muestra mensaje: "No encontramos una cuenta con ese email/teléfono"
- Se resalta el botón "Crear cuenta"
- Usuario puede cambiar a flujo de registro

**A3: Usuario Olvida Contraseña**
- Usuario presiona enlace "¿Olvidaste tu contraseña?"
- Sistema redirige a flujo de recuperación de contraseña (fuera de scope de esta feature)

### 2. Validación OTP

**Actor**: Usuario que completó login exitoso

**Flujo Principal**:
1. Usuario recibe código OTP de 6 dígitos en su dispositivo
2. Sistema muestra pantalla "Verifica tu identidad"
3. Usuario ingresa cada dígito en los 6 campos de input
4. Sistema valida OTP en tiempo real al completar el 6to dígito
5. Si OTP es correcto:
   - Sistema marca dispositivo como verificado (opcional: ofrecer marcarlo como seguro)
   - Usuario es redirigido a HomePage
6. Si OTP es incorrecto:
   - Sistema muestra mensaje de error: "Código incorrecto"
   - Usuario puede reintentar

**Flujos Alternativos**:

**B1: OTP Expirado**
- Sistema muestra mensaje: "El código ha expirado"
- Se habilita botón "Reenviar código"
- Usuario puede solicitar nuevo código

**B2: Usuario No Recibe OTP**
- Usuario presiona "Reenviar código"
- Sistema envía nuevo OTP
- Sistema muestra mensaje: "Código reenviado"

### 3. Registro de Nuevo Usuario

**Actor**: Usuario nuevo

**Flujo Principal**:
1. Usuario presiona tab "Crear cuenta" en pantalla de login
2. Sistema muestra formulario de registro con campos:
   - Nombre completo
   - Email o Teléfono
   - Contraseña
3. Usuario completa todos los campos
4. Usuario acepta Términos y Condiciones (checkbox)
5. Usuario presiona "Continuar"
6. Sistema valida datos:
   - Email/teléfono no existe en sistema
   - Contraseña cumple requisitos mínimos
   - Términos fueron aceptados
7. Sistema crea cuenta
8. Sistema genera y envía código OTP
9. Sistema redirige a pantalla de validación OTP
10. Usuario completa validación OTP (ver Caso de Uso 2)

**Flujos Alternativos**:

**C1: Email/Teléfono Ya Existe**
- Sistema muestra mensaje: "Ya existe una cuenta con este email/teléfono"
- Se resalta el tab "Iniciar sesión"
- Usuario puede cambiar a flujo de login

**C2: Contraseña No Cumple Requisitos**
- Sistema muestra mensaje descriptivo de requisitos
- Usuario corrige contraseña
- Validación en tiempo real al escribir

**C3: Términos No Aceptados**
- Sistema deshabilita botón "Continuar"
- Se muestra indicador visual en checkbox de términos

## Especificaciones UI/UX

### Pantalla: Login User/Password

**Componentes**:

**Header**:
- Botón atrás (ChevronLeft icon, size 24)
- Sin título fijo

**Contenido**:
- Logo de la app (cuadrado teal, 48x48px)
- Título: "Te damos la bienvenida" (text-2xl font-bold)
- Subtítulo: "Gestiona tus finanzas de forma segura." (text-sm text-gray-500)

**Tabs** (Tipo Pills):
- Tab "Iniciar sesión" (activo por defecto)
- Tab "Crear cuenta"
- Estilo activo: `bg-white text-gray-900 font-semibold`
- Estilo inactivo: `bg-transparent text-[#18B7B0] font-medium`

**Formulario de Inicio de Sesión**:
- Input "Email o Teléfono"
  - Placeholder: "Email o Teléfono"
  - Type: text
  - Clase: `rounded-xl bg-gray-50 border-gray-200`
- Input "Contraseña"
  - Placeholder: "Contraseña"
  - Type: password
  - Icono de ojo para mostrar/ocultar
  - Clase: `rounded-xl bg-gray-50 border-gray-200`
- Link "¿Olvidaste tu contraseña?" (text-[#18B7B0] text-sm, alineado a la derecha)

**Botón Continuar**:
- Clase: `w-full rounded-2xl bg-[#18B7B0] py-4 text-base font-semibold text-white`
- Estado disabled: `disabled:bg-gray-300 disabled:cursor-not-allowed`
- Habilitado solo cuando ambos campos tienen contenido

**Footer**:
- Texto: "Se enviará un código de verificación (OTP) para asegurar tu cuenta."
- Clase: `text-xs text-gray-500 text-center`

**Colores**:
- Primary (teal): `#18B7B0`
- Background: `bg-white`
- Inputs: `bg-gray-50`

### Pantalla: Register User

**Diferencias con Login**:
- Tab "Crear cuenta" activo
- Campo adicional "Nombre completo" (primer input)
- Checkbox con texto: "Al crear una cuenta, aceptas nuestros Términos y Condiciones."
  - Links "Términos" y "Condiciones" en color `text-[#18B7B0]`
  - Checkbox deshabilitado por defecto
- Botón "Continuar" deshabilitado hasta que:
  - Todos los campos tengan contenido
  - Checkbox de términos esté marcado

### Pantalla: OTP User Validation

**Header**:
- Barra de progreso/indicador (línea teal en top)
- Sin botón atrás (forzar flujo completo)

**Contenido**:
- Icono de candado con check (teal, 64x64px)
- Título: "Verifica tu identidad" (text-2xl font-bold)
- Descripción: "Ingresa el código de 6 dígitos que enviamos a tu dispositivo." (text-sm text-gray-500)

**Campos OTP**:
- 6 inputs individuales
- Solo números (inputMode: "numeric")
- Auto-focus en primer campo
- Auto-avance al siguiente campo al ingresar dígito
- Centrados horizontalmente
- Clase por input: `h-12 w-12 rounded-xl bg-gray-50 border-2 border-gray-200 text-center text-xl font-semibold focus:border-[#18B7B0]`
- Input activo/con valor: `border-[#18B7B0] bg-white`

**Botón Principal**:
- Texto: "Verificar y entrar"
- Clase: `w-full rounded-2xl bg-[#18B7B0] py-4 text-base font-semibold text-white`
- Habilitado solo cuando los 6 campos están completos

**Botón Secundario**:
- Texto: "Reenviar código"
- Clase: `text-[#18B7B0] text-sm font-medium`
- Posicionado debajo del botón principal
- Deshabilitado por 30 segundos después de cada envío (mostrar countdown)

**Estados de Validación**:
- Correcto: Animación de éxito + redirect automático
- Incorrecto: Shake animation + bordes rojos + mensaje de error
- Expirado: Mensaje de error + habilitar "Reenviar código"

## Especificaciones Técnicas

### Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Vite
- **Autenticación**: Supabase Auth
- **Estado**: Zustand (auth.store.ts)
- **Routing**: React Router v7
- **Estilos**: Tailwind CSS

### Estructura de Archivos

```
src/
├── features/
│   └── auth/
│       ├── components/
│       │   ├── LoginForm.tsx
│       │   ├── RegisterForm.tsx
│       │   ├── OTPInput.tsx
│       │   └── AuthTabs.tsx
│       ├── pages/
│       │   ├── AuthPage.tsx          # Contiene LoginForm/RegisterForm
│       │   └── OTPVerificationPage.tsx
│       ├── hooks/
│       │   ├── useLogin.ts
│       │   ├── useRegister.ts
│       │   └── useOTPVerification.ts
│       └── services/
│           └── auth.service.ts
├── state/
│   └── auth.store.ts                 # Zustand store
└── lib/
    └── supabase.ts                   # Supabase client
```

### Modelos de Datos

**User Profile** (Supabase `profiles` table):
```typescript
interface UserProfile {
  id: string;                    // UUID, matches auth.users.id
  email: string | null;
  phone: string | null;
  full_name: string;
  created_at: string;
  updated_at: string;
}
```

**Trusted Device** (Supabase `trusted_devices` table):
```typescript
interface TrustedDevice {
  id: string;                    // UUID
  user_id: string;               // FK to auth.users.id
  device_fingerprint: string;    // Unique device identifier
  device_name: string;           // User agent info
  last_used_at: string;
  created_at: string;
  expires_at: string | null;     // Optional expiration
}
```

### Auth Store (Zustand)

```typescript
interface AuthState {
  // State
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (emailOrPhone: string, password: string) => Promise<void>;
  register: (fullName: string, emailOrPhone: string, password: string) => Promise<void>;
  verifyOTP: (otp: string) => Promise<void>;
  resendOTP: () => Promise<void>;
  logout: () => Promise<void>;
  markDeviceAsTrusted: () => Promise<void>;
  checkTrustedDevice: () => Promise<boolean>;
}
```

### Supabase Auth Configuration

**Email/Phone Authentication**:
- Habilitar Email provider en Supabase Dashboard
- Habilitar Phone provider (Twilio/MessageBird)
- Configurar plantillas de email/SMS para OTP
- Configurar timeout de OTP (5 minutos recomendado)

**MFA (Multi-Factor Authentication)**:
- Habilitar TOTP MFA en Supabase
- Forzar MFA para dispositivos no confiables
- Usar `supabase.auth.mfa.challenge()` para generar OTP
- Usar `supabase.auth.mfa.verify()` para validar OTP

### Device Fingerprinting

**Librería**: `@fingerprintjs/fingerprintjs` o similar

**Implementación**:
```typescript
import FingerprintJS from '@fingerprintjs/fingerprintjs';

async function getDeviceFingerprint(): Promise<string> {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  return result.visitorId; // Unique device ID
}
```

**Almacenamiento**:
- Guardar fingerprint en localStorage: `trusted_device_id`
- Validar en cada login si el fingerprint existe en `trusted_devices` table
- Si existe y no ha expirado, skip OTP

### API Endpoints (Supabase Edge Functions)

**POST /auth/login**:
```typescript
Request:
{
  emailOrPhone: string;
  password: string;
  deviceFingerprint: string;
}

Response (Success):
{
  requiresOTP: boolean;
  session?: Session;
  message: string;
}

Response (Error):
{
  error: string;
  code: 'INVALID_CREDENTIALS' | 'USER_NOT_FOUND';
}
```

**POST /auth/register**:
```typescript
Request:
{
  fullName: string;
  emailOrPhone: string;
  password: string;
  acceptedTerms: boolean;
}

Response (Success):
{
  user: UserProfile;
  message: string;
}

Response (Error):
{
  error: string;
  code: 'EMAIL_EXISTS' | 'WEAK_PASSWORD' | 'TERMS_NOT_ACCEPTED';
}
```

**POST /auth/verify-otp**:
```typescript
Request:
{
  otp: string;
  trustDevice: boolean; // Si el usuario quiere marcar dispositivo como seguro
  deviceFingerprint?: string;
}

Response (Success):
{
  session: Session;
  user: UserProfile;
}

Response (Error):
{
  error: string;
  code: 'INVALID_OTP' | 'EXPIRED_OTP';
}
```

**POST /auth/resend-otp**:
```typescript
Request: {}

Response (Success):
{
  message: "Código reenviado";
  expiresIn: number; // seconds
}

Response (Error):
{
  error: string;
  code: 'RATE_LIMIT_EXCEEDED';
}
```

### Validaciones

**Email**:
- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Normalización: lowercase

**Teléfono**:
- Formato: E.164 (e.g., +573001234567)
- Validación con `libphonenumber-js`
- País por defecto: Colombia (+57)

**Contraseña**:
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 número
- Caracteres especiales opcionales

**Nombre Completo**:
- Mínimo 2 caracteres
- Solo letras, espacios, acentos

### Seguridad

**Rate Limiting**:
- Login: 5 intentos por hora por IP
- OTP: 3 intentos por código
- Resend OTP: 1 reenvío cada 30 segundos, máximo 5 por hora

**Protección Contra Brute Force**:
- Bloquear cuenta después de 10 intentos fallidos consecutivos
- Requerir CAPTCHA después de 3 intentos fallidos
- Implementar exponential backoff en reenvío de OTP

**Almacenamiento Seguro**:
- Contraseñas: Hash con bcrypt (cost factor 12)
- Fingerprints: Hash con SHA-256 antes de almacenar
- Session tokens: HttpOnly cookies (si es web) o secure storage (mobile)

**OTP**:
- Código de 6 dígitos numéricos
- Generado criptográficamente seguro
- Expiración: 5 minutos
- Un solo uso (invalidar después de verificar)
- Almacenar hash del OTP, no el valor plano

### Offline Support

- Caché de última sesión en localStorage
- Mostrar datos del usuario en modo offline
- Queue de operaciones de autenticación cuando vuelve online
- Indicador visual de estado offline/online

## Testing

### Unit Tests

**Componentes**:
- LoginForm: Validaciones de input, submit, estados de error
- RegisterForm: Validaciones, checkbox de términos, submit
- OTPInput: Auto-focus, auto-advance, validación de 6 dígitos

**Hooks**:
- useLogin: Flujo exitoso, credenciales incorrectas, usuario no encontrado
- useRegister: Registro exitoso, email existente, validación de campos
- useOTPVerification: Verificación exitosa, código incorrecto, reenvío

**Services**:
- auth.service: Login, register, verifyOTP, resendOTP
- Mocks de Supabase client

### Integration Tests

- Flujo completo: Login → OTP → HomePage
- Flujo completo: Register → OTP → HomePage
- Flujo de error: Credenciales incorrectas → Mensaje de error
- Flujo de recuperación: Reenvío de OTP → Verificación exitosa
- Device fingerprinting: Primer login con OTP, segundo login sin OTP

### E2E Tests (Playwright)

```typescript
test('Usuario puede iniciar sesión con email y contraseña', async ({ page }) => {
  await page.goto('/auth');
  await page.fill('[placeholder="Email o Teléfono"]', 'test@example.com');
  await page.fill('[placeholder="Contraseña"]', 'Password123');
  await page.click('button:has-text("Continuar")');
  await expect(page).toHaveURL('/auth/verify-otp');
  // ... complete OTP flow
});

test('Usuario puede registrarse con nombre, email y contraseña', async ({ page }) => {
  await page.goto('/auth');
  await page.click('button:has-text("Crear cuenta")');
  await page.fill('[placeholder="Nombre completo"]', 'Juan Pérez');
  await page.fill('[placeholder="Email o Teléfono"]', 'juan@example.com');
  await page.fill('[placeholder="Contraseña"]', 'Password123');
  await page.check('input[type="checkbox"]'); // Terms
  await page.click('button:has-text("Continuar")');
  await expect(page).toHaveURL('/auth/verify-otp');
});
```

## Dependencias

**Nuevas Librerías**:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@fingerprintjs/fingerprintjs": "^4.2.0",
    "libphonenumber-js": "^1.10.51"
  },
  "devDependencies": {
    "@testing-library/react": "^14.1.2",
    "@playwright/test": "^1.40.1"
  }
}
```

## Migrations (Supabase)

### Migration: Create Trusted Devices Table

```sql
-- Create trusted_devices table
CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint_hash TEXT NOT NULL,
  device_name TEXT,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '90 days'),

  CONSTRAINT unique_user_device UNIQUE (user_id, device_fingerprint_hash)
);

-- Create index for faster lookups
CREATE INDEX idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint_hash);

-- Enable RLS
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own trusted devices
CREATE POLICY "Users can view own trusted devices"
  ON trusted_devices FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own trusted devices
CREATE POLICY "Users can insert own trusted devices"
  ON trusted_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own trusted devices
CREATE POLICY "Users can update own trusted devices"
  ON trusted_devices FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own trusted devices
CREATE POLICY "Users can delete own trusted devices"
  ON trusted_devices FOR DELETE
  USING (auth.uid() = user_id);
```

### Migration: Update Profiles Table

```sql
-- Add missing fields to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Create index for email/phone lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
```

## Criterios de Aceptación

### Feature Completa Cuando:

- [ ] Usuario puede iniciar sesión con email + contraseña
- [ ] Usuario puede iniciar sesión con teléfono + contraseña
- [ ] Sistema valida credenciales correctamente
- [ ] Sistema muestra mensaje de error apropiado para credenciales incorrectas
- [ ] Sistema muestra mensaje cuando usuario no existe
- [ ] Sistema genera y envía OTP de 6 dígitos
- [ ] Usuario puede ingresar OTP en 6 campos individuales
- [ ] Sistema valida OTP correctamente
- [ ] Sistema muestra error cuando OTP es incorrecto
- [ ] Sistema permite reenviar OTP (con rate limiting)
- [ ] Sistema marca dispositivo como confiable
- [ ] En segundo login desde mismo dispositivo confiable, se salta OTP
- [ ] Usuario puede registrarse con nombre + email/teléfono + contraseña
- [ ] Sistema valida que email/teléfono no exista
- [ ] Sistema requiere aceptación de términos para registro
- [ ] Sistema valida requisitos de contraseña
- [ ] Después de registro exitoso, usuario pasa por validación OTP
- [ ] UI coincide pixel-perfect con diseños de referencia
- [ ] Todos los textos están en español (es-CO)
- [ ] Implementado rate limiting en login, OTP, y reenvío
- [ ] Tests unitarios cubren >80% de código
- [ ] Tests E2E cubren flujos críticos completos
- [ ] Documentación de API completa
- [ ] Feature funciona offline (caché de sesión)

## Notas de Implementación

### Fase 1: Setup Básico (1-2 días)
- Configurar Supabase Auth
- Crear estructura de archivos
- Implementar auth.store.ts
- Crear migrations de DB

### Fase 2: UI Components (2-3 días)
- Implementar AuthPage con tabs
- Crear LoginForm component
- Crear RegisterForm component
- Implementar OTPVerificationPage
- Crear OTPInput component con auto-focus/advance

### Fase 3: Auth Logic (3-4 días)
- Implementar useLogin hook
- Implementar useRegister hook
- Implementar useOTPVerification hook
- Integrar Supabase Auth API
- Implementar device fingerprinting
- Crear auth.service.ts

### Fase 4: Security & Validation (2 días)
- Implementar rate limiting
- Añadir validaciones de email/phone/password
- Implementar protección contra brute force
- Hashing de fingerprints

### Fase 5: Testing (2-3 días)
- Unit tests para componentes
- Unit tests para hooks
- Integration tests
- E2E tests con Playwright

### Fase 6: Polish & Documentation (1 día)
- Pulir animaciones y transiciones
- Verificar responsive design
- Completar documentación
- Code review

**Tiempo Total Estimado**: 11-15 días de desarrollo

## Riesgos y Mitigaciones

### Riesgo: SMS/Email Delivery Failures
**Mitigación**:
- Implementar múltiples proveedores (fallback)
- Logs detallados de entregas fallidas
- Opción de recibir OTP por método alternativo

### Riesgo: Device Fingerprinting Inconsistente
**Mitigación**:
- Usar librería probada (FingerprintJS)
- Combinar múltiples técnicas de fingerprinting
- Permitir al usuario gestionar dispositivos confiables manualmente

### Riesgo: Rate Limiting Demasiado Estricto
**Mitigación**:
- Configurar límites razonables
- Permitir bypass para usuarios verificados
- Implementar CAPTCHA antes de bloquear completamente

### Riesgo: UX Confusa en OTP
**Mitigación**:
- Instrucciones claras y concisas
- Auto-focus y auto-advance en campos
- Botón de reenvío visible y fácil de usar
- Countdown timer visible

## Referencias

### Diseños UI
- Imagen 8: Login User/password
- Imagen 9: Register User
- Imagen 10: OTP User Validation

### Documentación Técnica
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase MFA Documentation](https://supabase.com/docs/guides/auth/auth-mfa)
- [FingerprintJS Documentation](https://dev.fingerprint.com/docs)
- [libphonenumber-js Documentation](https://github.com/catamphetamine/libphonenumber-js)

### Estándares de Seguridad
- OWASP Authentication Cheat Sheet
- NIST Digital Identity Guidelines

## Changelog

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2026-01-23 | 1.0.0 | Documento inicial |
