# Plan de Implementación: AI Batch Entry

**Proyecto:** SmartSpend - Ingreso por Lotes con IA
**Inicio:** 2026-02-03
**Estado:** 🟡 En Progreso

---

## Progreso General

```
Fase 1: Setup Inicial        [░░░░░░░░░░] 0%
Fase 2: Edge Function        [░░░░░░░░░░] 0%
Fase 3: Captura Frontend     [░░░░░░░░░░] 0%
Fase 4: UI/UX Components     [░░░░░░░░░░] 0%
Fase 5: Integración          [░░░░░░░░░░] 0%
Fase 6: Testing & QA         [░░░░░░░░░░] 0%
Fase 7: Lanzamiento          [░░░░░░░░░░] 0%
─────────────────────────────────────────
TOTAL                        [░░░░░░░░░░] 0%
```

---

## Fase 1: Setup Inicial

**Objetivo:** Preparar el entorno de desarrollo con todas las dependencias y configuraciones necesarias.

### 1.1 Instalar Dependencias NPM

- [ ] Instalar plugin de grabación de audio
  ```bash
  npm install capacitor-voice-recorder
  ```

- [ ] Instalar plugin de cámara (si no está)
  ```bash
  npm install @capacitor/camera
  ```

- [ ] Instalar librería de compresión de imágenes
  ```bash
  npm install browser-image-compression
  ```

- [ ] Sincronizar Capacitor
  ```bash
  npx cap sync
  ```

### 1.2 Configurar Permisos iOS

- [ ] Editar `ios/App/App/Info.plist` - Agregar permisos:
  ```xml
  <key>NSCameraUsageDescription</key>
  <string>SmartSpend necesita acceso a la cámara para escanear recibos y notas</string>

  <key>NSPhotoLibraryUsageDescription</key>
  <string>SmartSpend necesita acceso a tu galería para seleccionar fotos de recibos</string>

  <key>NSMicrophoneUsageDescription</key>
  <string>SmartSpend necesita acceso al micrófono para dictar tus transacciones por voz</string>
  ```

### 1.3 Configurar Permisos Android

- [ ] Verificar `android/app/src/main/AndroidManifest.xml`:
  ```xml
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-permission android:name="android.permission.RECORD_AUDIO" />
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
  ```

### 1.4 Crear Estructura de Carpetas

- [ ] Crear estructura del feature:
  ```bash
  mkdir -p src/features/batch-entry/{components,hooks,services,types}
  ```

### 1.5 Obtener API Keys

- [ ] Crear cuenta en [Google AI Studio](https://aistudio.google.com/) y obtener `GEMINI_API_KEY`
- [ ] Obtener `OPENAI_API_KEY` de [OpenAI Platform](https://platform.openai.com/)
- [ ] Crear cuenta en [Upstash](https://upstash.com/) y crear base de datos Redis
  - [ ] Copiar `UPSTASH_REDIS_REST_URL`
  - [ ] Copiar `UPSTASH_REDIS_REST_TOKEN`

### 1.6 Configurar Variables de Entorno

- [ ] Crear archivo `supabase/functions/.env`:
  ```env
  GEMINI_API_KEY=tu_api_key_aqui
  OPENAI_API_KEY=tu_api_key_aqui
  UPSTASH_REDIS_REST_URL=tu_url_aqui
  UPSTASH_REDIS_REST_TOKEN=tu_token_aqui
  ```

- [ ] Agregar secrets en Supabase Dashboard (para producción):
  ```bash
  supabase secrets set GEMINI_API_KEY=xxx
  supabase secrets set OPENAI_API_KEY=xxx
  supabase secrets set UPSTASH_REDIS_REST_URL=xxx
  supabase secrets set UPSTASH_REDIS_REST_TOKEN=xxx
  ```

**Criterio de completitud:** Todos los paquetes instalados, permisos configurados, API keys obtenidas.

---

## Fase 2: Edge Function (Backend)

**Objetivo:** Crear el endpoint serverless que procesa los inputs y devuelve transacciones estructuradas.

### 2.1 Crear Edge Function Base

- [ ] Crear carpeta y archivo:
  ```bash
  mkdir -p supabase/functions/parse-batch
  touch supabase/functions/parse-batch/index.ts
  ```

- [ ] Implementar estructura básica con CORS y auth

### 2.2 Implementar Rate Limiting

- [ ] Integrar Upstash Redis
- [ ] Configurar límite: 10 requests/hora/usuario
- [ ] Agregar headers de rate limit en respuesta
- [ ] Manejar caso de límite excedido (HTTP 429)

### 2.3 Implementar Transcripción de Audio

- [ ] Función `transcribeAudio(audioBase64: string): Promise<string>`
- [ ] Integración con GPT-4o Mini Transcribe API
- [ ] Manejo de errores y timeout (30s max)
- [ ] Fallback a Whisper si falla

### 2.4 Implementar Procesamiento con Gemini

- [ ] Función `processWithGemini(text: string, imageBase64?: string): Promise<TransactionDraft[]>`
- [ ] System Prompt con categorías de SmartSpend
- [ ] JSON Schema para output estructurado
- [ ] Fallback a GPT-4o-mini si Gemini falla

### 2.5 Definir System Prompt Final

- [ ] Crear archivo `supabase/functions/parse-batch/prompts.ts`
- [ ] Definir `SYSTEM_PROMPT` con:
  - [ ] Contexto de Colombia/COP
  - [ ] Lista de categorías del sistema
  - [ ] Reglas de interpretación de montos ("50 mil", "2 palos")
  - [ ] Manejo de fechas relativas ("ayer", "el lunes")
- [ ] Definir `JSON_SCHEMA` para validación

### 2.6 Testing Local de Edge Function

- [ ] Probar con Supabase CLI:
  ```bash
  supabase functions serve parse-batch --env-file supabase/functions/.env
  ```
- [ ] Test con texto simple
- [ ] Test con imagen de recibo
- [ ] Test con audio grabado
- [ ] Test de rate limiting

### 2.7 Deploy Edge Function

- [ ] Deploy a Supabase:
  ```bash
  supabase functions deploy parse-batch
  ```
- [ ] Verificar en dashboard de Supabase
- [ ] Test en producción con curl/Postman

**Criterio de completitud:** Edge function desplegada, respondiendo correctamente a los 3 tipos de input.

---

## Fase 3: Captura de Datos (Frontend Services)

**Objetivo:** Crear los servicios que capturan audio, imágenes y preparan los datos para enviar al backend.

### 3.1 Crear Tipos TypeScript

- [ ] Crear `src/features/batch-entry/types/batch-entry.types.ts`:
  ```typescript
  export type BatchInputType = "text" | "image" | "audio";

  export type TransactionDraft = {
    id: string;
    type: "income" | "expense";
    name: string;
    category: string;
    amount: number;
    date: string;
    notes?: string;
    needsReview: boolean;
    confidence: number;
  };

  export type BatchEntryRequest = {
    inputType: BatchInputType;
    data?: string;
    imageBase64?: string;
    audioBase64?: string;
  };

  export type BatchEntryResponse = {
    success: boolean;
    transactions: TransactionDraft[];
    confidence: number;
    rawInterpretation?: string;
    error?: string;
  };
  ```

### 3.2 Crear Servicio de Captura de Audio

- [ ] Crear `src/features/batch-entry/services/audioCapture.service.ts`
- [ ] Implementar `requestMicrophonePermission()`
- [ ] Implementar `startRecording()`
- [ ] Implementar `stopRecording(): Promise<string>` (retorna base64)
- [ ] Implementar `cancelRecording()`
- [ ] Límite de duración: 120 segundos

### 3.3 Crear Servicio de Captura de Imagen

- [ ] Crear `src/features/batch-entry/services/imageCapture.service.ts`
- [ ] Implementar `captureFromCamera(): Promise<string>`
- [ ] Implementar `selectFromGallery(): Promise<string>`
- [ ] Implementar `compressImage(base64: string): Promise<string>`
  - [ ] Max 500KB
  - [ ] Max 1280px de ancho/alto
  - [ ] Calidad 0.8

### 3.4 Crear Servicio de API

- [ ] Crear `src/features/batch-entry/services/batchEntry.service.ts`
- [ ] Implementar `parseBatch(request: BatchEntryRequest): Promise<BatchEntryResponse>`
- [ ] Manejo de autenticación (JWT de Supabase)
- [ ] Manejo de errores de red
- [ ] Timeout de 60 segundos

### 3.5 Testing de Servicios

- [ ] Test de grabación de audio en iOS
- [ ] Test de grabación de audio en Android
- [ ] Test de grabación de audio en Web
- [ ] Test de captura de imagen en iOS
- [ ] Test de captura de imagen en Android
- [ ] Test de compresión de imagen
- [ ] Test de llamada a Edge Function

**Criterio de completitud:** Servicios funcionales en las 3 plataformas (iOS, Android, Web).

---

## Fase 4: UI/UX Components

**Objetivo:** Crear la interfaz de usuario siguiendo los patrones de diseño de SmartSpend.

### 4.1 Crear Bottom Sheet Principal

- [ ] Crear `src/features/batch-entry/components/BatchEntrySheet.tsx`
- [ ] Seguir patrón de bottom sheet existente (z-[70], rounded-t-3xl)
- [ ] Estados: idle → selecting → capturing → processing → preview → done
- [ ] Animación de entrada/salida

### 4.2 Crear Selector de Tipo de Input

- [ ] Crear `src/features/batch-entry/components/InputTypeSelector.tsx`
- [ ] 3 opciones: Voz, Foto, Texto
- [ ] Iconos: Mic, Camera, Type (de lucide-react)
- [ ] Estilo de cards seleccionables

### 4.3 Crear Componente de Grabación de Voz

- [ ] Crear `src/features/batch-entry/components/VoiceRecorder.tsx`
- [ ] Visualización de onda de audio (opcional, nice-to-have)
- [ ] Timer de duración
- [ ] Botones: Cancelar, Detener
- [ ] Estados: idle, recording, processing

### 4.4 Crear Componente de Captura de Imagen

- [ ] Crear `src/features/batch-entry/components/ImageCapture.tsx`
- [ ] Opciones: Tomar foto, Seleccionar de galería
- [ ] Preview de imagen seleccionada
- [ ] Botón de reintento
- [ ] Indicador de compresión

### 4.5 Crear Componente de Texto Libre

- [ ] Crear `src/features/batch-entry/components/TextInput.tsx`
- [ ] Textarea multilinea
- [ ] Placeholder con ejemplo: "Ej: Gasté 50 mil en almuerzo y 30 mil en uber"
- [ ] Contador de caracteres (max 500)
- [ ] Usar `useKeyboardDismiss` hook

### 4.6 Crear Vista de Preview de Transacciones

- [ ] Crear `src/features/batch-entry/components/TransactionPreview.tsx`
- [ ] Lista de `TransactionDraftCard`
- [ ] Indicador de confianza general
- [ ] Botones: Cancelar, Guardar todas

### 4.7 Crear Card de Transacción Draft

- [ ] Crear `src/features/batch-entry/components/TransactionDraftCard.tsx`
- [ ] Mostrar: tipo, nombre, categoría, monto, fecha
- [ ] Indicador visual si `needsReview: true`
- [ ] Botón de editar (abre modal inline)
- [ ] Botón de eliminar del lote
- [ ] Selector de categoría inline

### 4.8 Crear Estados de Carga y Error

- [ ] Skeleton loader para procesamiento
- [ ] Mensaje de error con retry
- [ ] Modal de éxito al guardar
- [ ] Animaciones de transición

### 4.9 Integrar con FAB/AddActionSheet

- [ ] Agregar opción "Lote con IA" en AddActionSheet existente
- [ ] Icono: Sparkles o Wand2 de lucide-react
- [ ] Texto: "Ingreso por lotes"

**Criterio de completitud:** UI completa y funcional, siguiendo design system de SmartSpend.

---

## Fase 5: Integración

**Objetivo:** Conectar todos los componentes y flujos.

### 5.1 Crear Hook Principal

- [ ] Crear `src/features/batch-entry/hooks/useBatchEntry.ts`
- [ ] Estado: `BatchEntryState`
- [ ] Acciones: `setInputType`, `startCapture`, `process`, `editDraft`, `removeDraft`, `saveAll`
- [ ] Integración con servicios de captura
- [ ] Integración con API service

### 5.2 Crear Hook de Grabación

- [ ] Crear `src/features/batch-entry/hooks/useVoiceRecorder.ts`
- [ ] Estado: isRecording, duration, error
- [ ] Acciones: start, stop, cancel
- [ ] Timer automático

### 5.3 Crear Hook de Imagen

- [ ] Crear `src/features/batch-entry/hooks/useImageCapture.ts`
- [ ] Estado: imagePreview, isCompressing, error
- [ ] Acciones: captureFromCamera, selectFromGallery, clear

### 5.4 Integrar con Zustand Store

- [ ] Conectar `saveAll()` con `useBudgetStore.addTransaction()`
- [ ] Manejar transacciones múltiples en secuencia
- [ ] Feedback de progreso al guardar

### 5.5 Agregar a Navegación

- [ ] Agregar opción en `AddActionSheet.tsx`
- [ ] Manejar apertura del `BatchEntrySheet`
- [ ] Cerrar sheet al completar

### 5.6 Check de Conectividad

- [ ] Verificar conexión antes de iniciar
- [ ] Mostrar modal si está offline
- [ ] Usar hook `useOnlineStatus` existente

**Criterio de completitud:** Flujo completo E2E funcionando.

---

## Fase 6: Testing & QA

**Objetivo:** Asegurar calidad y precisión del feature.

### 6.1 Testing de Edge Function

- [ ] Unit tests con Deno test
- [ ] Test de rate limiting (11 requests seguidos)
- [ ] Test de timeout (audio largo)
- [ ] Test de fallback (simular Gemini caído)

### 6.2 Testing de Frontend

- [ ] Tests de componentes con Vitest
- [ ] Test de hooks con react-testing-library
- [ ] Tests E2E con Playwright (si aplica)

### 6.3 Testing con Datos Reales Colombianos

- [ ] Recibos de supermercado (Éxito, Carulla, Jumbo)
- [ ] Recibos de tiendas (D1, Ara, Oxxo)
- [ ] Facturas de servicios (EPM, ETB, Claro)
- [ ] Recibos de restaurantes
- [ ] Recibos de apps (Rappi, iFood)

### 6.4 Testing de Audio en Español Colombiano

- [ ] Acentos regionales (paisa, costeño, rolo, etc.)
- [ ] Términos coloquiales ("luca", "palo", "50 barras")
- [ ] Múltiples transacciones en una oración
- [ ] Ruido de fondo moderado

### 6.5 Testing de Casos Edge

- [ ] Imagen borrosa/oscura
- [ ] Audio con mucho ruido
- [ ] Texto ambiguo ("pagué la cuenta")
- [ ] Montos sin especificar
- [ ] Fechas relativas ("ayer", "el viernes")
- [ ] Mezcla de ingresos y gastos en un input

### 6.6 Testing de Performance

- [ ] Tiempo de respuesta < 10s para texto
- [ ] Tiempo de respuesta < 15s para imagen
- [ ] Tiempo de respuesta < 20s para audio (2 min)
- [ ] Tamaño de payload comprimido < 1MB

### 6.7 Testing de Errores

- [ ] Sin conexión a internet
- [ ] API key inválida
- [ ] Rate limit excedido
- [ ] Timeout de API
- [ ] Respuesta malformada de IA

**Criterio de completitud:** Todos los tests pasando, precisión > 85% en casos reales.

---

## Fase 7: Lanzamiento

**Objetivo:** Poner el feature en producción de forma controlada.

### 7.1 Feature Flag

- [ ] Implementar flag `ENABLE_AI_BATCH_ENTRY`
- [ ] Opción 1: Solo usuarios Pro
- [ ] Opción 2: Beta con grupo selecto
- [ ] UI condicional basada en flag

### 7.2 Monitoreo

- [ ] Logging de requests en Edge Function
- [ ] Métricas de uso:
  - [ ] Requests por día/semana
  - [ ] Tipo de input más usado
  - [ ] Tasa de éxito/error
  - [ ] Tiempo promedio de respuesta
- [ ] Alertas de costos en APIs

### 7.3 Documentación

- [ ] Actualizar `docs/FEATURES.md`
- [ ] Agregar sección en FAQ de la app
- [ ] Tutorial in-app (opcional)

### 7.4 Comunicación

- [ ] Preparar release notes
- [ ] Notificación in-app del nuevo feature
- [ ] Post en redes (si aplica)

### 7.5 Rollout Gradual

- [ ] Semana 1: 10% de usuarios Pro
- [ ] Semana 2: 50% de usuarios Pro
- [ ] Semana 3: 100% de usuarios Pro
- [ ] Semana 4+: Evaluar para usuarios Free

### 7.6 Post-Lanzamiento

- [ ] Monitorear costos reales vs estimados
- [ ] Recopilar feedback de usuarios
- [ ] Iterar sobre precisión del prompt
- [ ] Evaluar agregar más categorías

**Criterio de completitud:** Feature estable en producción, métricas dentro de lo esperado.

---

## Resumen de Archivos a Crear

```
src/features/batch-entry/
├── components/
│   ├── BatchEntrySheet.tsx
│   ├── InputTypeSelector.tsx
│   ├── VoiceRecorder.tsx
│   ├── ImageCapture.tsx
│   ├── TextInput.tsx
│   ├── TransactionPreview.tsx
│   └── TransactionDraftCard.tsx
├── hooks/
│   ├── useBatchEntry.ts
│   ├── useVoiceRecorder.ts
│   └── useImageCapture.ts
├── services/
│   ├── batchEntry.service.ts
│   ├── audioCapture.service.ts
│   └── imageCapture.service.ts
└── types/
    └── batch-entry.types.ts

supabase/functions/
└── parse-batch/
    ├── index.ts
    └── prompts.ts
```

---

## Comandos Útiles

```bash
# Instalar dependencias
npm install capacitor-voice-recorder @capacitor/camera browser-image-compression

# Sync Capacitor
npx cap sync

# Servir Edge Function localmente
supabase functions serve parse-batch --env-file supabase/functions/.env

# Deploy Edge Function
supabase functions deploy parse-batch

# Ver logs de Edge Function
supabase functions logs parse-batch

# Correr tests
npm run test

# Build para verificar tipos
npm run build
```

---

## Notas de Implementación

### Prioridades
1. **P0 (Crítico):** Edge Function + Texto input (MVP mínimo)
2. **P1 (Alto):** Captura de imagen + Preview
3. **P2 (Medio):** Grabación de audio
4. **P3 (Bajo):** Visualización de onda, animaciones fancy

### Dependencias entre Fases
```
Fase 1 (Setup)
    ↓
Fase 2 (Edge Function) ←─── Puede desarrollarse en paralelo
    ↓                            ↓
Fase 3 (Services) ──────────────→
    ↓
Fase 4 (UI)
    ↓
Fase 5 (Integración)
    ↓
Fase 6 (Testing)
    ↓
Fase 7 (Lanzamiento)
```

### Riesgos a Monitorear
- [ ] Costo real de APIs vs estimado
- [ ] Precisión en español colombiano
- [ ] Tiempo de respuesta en conexiones lentas
- [ ] Feedback de usuarios sobre UX

---

## Log de Progreso

| Fecha | Fase | Tarea | Estado | Notas |
|-------|------|-------|--------|-------|
| 2026-02-03 | 0 | Creación del plan | ✅ | ADR y Plan creados |
| | | | | |
| | | | | |
| | | | | |

---

*Última actualización: 2026-02-03*
