# ADR-001: AI Batch Entry Module

**Fecha de Creación:** 2026-02-03
**Estado:** 📋 En Planificación
**Última Actualización:** 2026-02-03
**Autor:** AI Architecture Team

---

## Resumen Ejecutivo

Implementación de una funcionalidad "Killer Feature" de **Ingreso por Lotes (Batch Entry)** impulsada por IA para SmartSpend. Permite a los usuarios ingresar múltiples transacciones mediante:

- 🎤 **Voz:** "Gasté 50 mil en almuerzo, 30 mil en Uber y recibí 2 millones de salario"
- 📷 **Imagen:** Foto de recibo o nota escrita a mano
- ⌨️ **Texto:** Entrada libre en lenguaje natural

---

## Stack Tecnológico Confirmado

> ⚠️ **IMPORTANTE:** Verificado el 2026-02-03. Las tecnologías han sido validadas como disponibles y compatibles.

### Captura de Datos (Frontend)

| Componente | Paquete | Versión | Estado |
|------------|---------|---------|--------|
| Grabación de Audio | `capacitor-voice-recorder` | ^7.0.6 | ✅ Verificado |
| Captura de Imágenes | `@capacitor/camera` | ^8.0.0 | ✅ Compatible con Capacitor 8 |
| Compresión de Imágenes | `browser-image-compression` | ^2.0.2 | ✅ Verificado |

### Inteligencia Artificial (Backend)

| Componente | Proveedor | Modelo | Pricing | Estado |
|------------|-----------|--------|---------|--------|
| **Visión/NLP Principal** | Google | **Gemini 2.5 Flash** | $0.15/1M in, $0.60/1M out | ✅ Recomendado |
| Visión/NLP Económico | Google | Gemini 2.5 Flash-Lite | $0.10/1M in, $0.40/1M out | ✅ Alternativa |
| Visión Fallback | OpenAI | GPT-4o-mini | $0.15/1M in, $0.60/1M out | ✅ Backup |
| **Transcripción Principal** | OpenAI | GPT-4o Mini Transcribe | **$0.003/min** | ✅ Recomendado (nuevo) |
| Transcripción Fallback | OpenAI | Whisper API | $0.006/min | ✅ Backup |

### Infraestructura (Backend)

| Componente | Servicio | Tier | Límites | Estado |
|------------|----------|------|---------|--------|
| Edge Functions | Supabase | Incluido | 500K inv/mes | ✅ Listo |
| Rate Limiting | Upstash Redis | Free | 500K cmd/mes | ✅ Suficiente |
| Almacenamiento | Supabase Storage | Incluido | Para audiologs si necesario | ✅ Disponible |

### Modelos Descartados

| Modelo | Razón |
|--------|-------|
| ~~Gemini 1.5 Flash~~ | ❌ **RETIRADO** (Abril 2025) |
| ~~Gemini 1.5 Pro~~ | ❌ **RETIRADO** (Abril 2025) |
| ~~GPT-4o (full)~~ | ❌ Muy costoso para este caso de uso |
| ~~Claude 3.5 Sonnet~~ | ❌ Pricing no competitivo vs Gemini |
| ~~Deepgram~~ | ❌ Menor precisión que Whisper para español |

---

## Proyección de Costos (Actualizada)

### Escenario: 1,000 usuarios × 5 batch entries/mes

| Servicio | Uso | Costo Unitario | Total/mes |
|----------|-----|----------------|-----------|
| Gemini 2.5 Flash (imágenes) | 5,000 imgs (~1.3M tokens) | $0.15/1M | **$0.20** |
| Gemini 2.5 Flash (output) | ~200K tokens | $0.60/1M | **$0.12** |
| GPT-4o Mini Transcribe (audio) | 5,000 min | $0.003/min | **$15.00** |
| Upstash Redis | ~25K requests | Free tier | **$0.00** |
| **TOTAL** | | | **~$15.32/mes** |

### Comparación con Plan Original

| Escenario | Plan Original (Whisper) | Plan Actualizado (GPT-4o Mini) | Ahorro |
|-----------|------------------------|-------------------------------|--------|
| 1,000 usuarios | ~$30/mes | ~$15/mes | **50%** |
| 10,000 usuarios | ~$300/mes | ~$150/mes | **50%** |

---

## Plan de Implementación

### Fase 1: Infraestructura (Backend)

- [ ] **1.1** Crear Edge Function `parse-batch`
  - [ ] Setup básico con Deno
  - [ ] Integración con Gemini 2.5 Flash API
  - [ ] Integración con GPT-4o Mini Transcribe
  - [ ] Manejo de errores y fallbacks
  - [ ] Logging estructurado

- [ ] **1.2** Implementar Rate Limiting
  - [ ] Configurar Upstash Redis
  - [ ] Límite: 10 requests/hora/usuario
  - [ ] Headers de rate limit en respuesta

- [ ] **1.3** Definir System Prompt
  - [ ] Prompt para extracción de transacciones
  - [ ] JSON Schema para output estructurado
  - [ ] Testing con casos de uso colombianos

- [ ] **1.4** Variables de entorno
  - [ ] `GEMINI_API_KEY`
  - [ ] `OPENAI_API_KEY`
  - [ ] `UPSTASH_REDIS_REST_URL`
  - [ ] `UPSTASH_REDIS_REST_TOKEN`

### Fase 2: Captura de Datos (Frontend)

- [ ] **2.1** Instalar dependencias
  ```bash
  npm install capacitor-voice-recorder @capacitor/camera browser-image-compression
  npx cap sync
  ```

- [ ] **2.2** Configurar permisos nativos
  - [ ] iOS: `Info.plist` (Camera, Microphone, Photo Library)
  - [ ] Android: `AndroidManifest.xml`

- [ ] **2.3** Crear servicio de captura
  - [ ] `src/features/batch-entry/services/capture.service.ts`
  - [ ] Grabación de audio (max 120s)
  - [ ] Captura de imagen + compresión (max 500KB)
  - [ ] Validación de formatos

### Fase 3: UI/UX (Frontend)

- [ ] **3.1** Crear componentes base
  - [ ] `BatchEntrySheet.tsx` - Bottom sheet principal
  - [ ] `InputTypeSelector.tsx` - Selector de tipo de input
  - [ ] `VoiceRecorder.tsx` - Interfaz de grabación
  - [ ] `ImageCapture.tsx` - Preview de imagen
  - [ ] `TextInput.tsx` - Campo de texto libre

- [ ] **3.2** Crear flujo de preview
  - [ ] `TransactionPreview.tsx` - Lista editable de drafts
  - [ ] Edición inline de cada transacción
  - [ ] Indicador de "needsReview"
  - [ ] Botón de confirmar/guardar

- [ ] **3.3** Estados de carga y error
  - [ ] Skeleton loaders
  - [ ] Mensajes de error en español
  - [ ] Retry automático

- [ ] **3.4** Integración con store
  - [ ] Hook `useBatchEntry.ts`
  - [ ] Conexión con `addTransaction()` de Zustand

### Fase 4: Testing y QA

- [ ] **4.1** Testing de Edge Function
  - [ ] Unit tests con Deno
  - [ ] Tests de integración con APIs reales
  - [ ] Test de rate limiting

- [ ] **4.2** Testing de Frontend
  - [ ] Tests de componentes
  - [ ] Tests E2E con Playwright

- [ ] **4.3** Testing con datos reales
  - [ ] Recibos colombianos (Éxito, Carulla, D1, Rappi)
  - [ ] Audio en español colombiano
  - [ ] Casos edge (montos ambiguos, fechas relativas)

### Fase 5: Lanzamiento

- [ ] **5.1** Feature flag
  - [ ] Habilitar solo para usuarios Pro inicialmente
  - [ ] O beta testing con grupo selecto

- [ ] **5.2** Monitoreo
  - [ ] Métricas de uso (requests/día, tipo de input)
  - [ ] Costos reales vs proyectados
  - [ ] Tasa de error y precisión

- [ ] **5.3** Documentación
  - [ ] Actualizar FEATURES.md
  - [ ] Guía de usuario en la app

---

## Estructura de Archivos

```
src/
├── features/
│   └── batch-entry/
│       ├── components/
│       │   ├── BatchEntrySheet.tsx
│       │   ├── InputTypeSelector.tsx
│       │   ├── VoiceRecorder.tsx
│       │   ├── ImageCapture.tsx
│       │   ├── TextInput.tsx
│       │   ├── TransactionPreview.tsx
│       │   └── TransactionDraftCard.tsx
│       ├── hooks/
│       │   ├── useBatchEntry.ts
│       │   ├── useVoiceRecorder.ts
│       │   └── useImageCapture.ts
│       ├── services/
│       │   ├── batchEntry.service.ts
│       │   └── capture.service.ts
│       └── types/
│           └── batch-entry.types.ts
│
supabase/
└── functions/
    └── parse-batch/
        ├── index.ts
        └── prompts.ts
```

---

## Tipos TypeScript

```typescript
// src/features/batch-entry/types/batch-entry.types.ts

export type BatchInputType = "text" | "image" | "audio";

export type TransactionDraft = {
  id: string;                    // UUID temporal
  type: "income" | "expense";
  name: string;
  category: string;              // ID de categoría
  amount: number;
  date: string;                  // YYYY-MM-DD
  notes?: string;
  needsReview: boolean;          // Si la IA no está segura
  confidence: number;            // 0-1
};

export type BatchEntryRequest = {
  inputType: BatchInputType;
  data?: string;                 // Texto libre
  imageBase64?: string;          // Imagen comprimida
  audioBase64?: string;          // Audio grabado
};

export type BatchEntryResponse = {
  success: boolean;
  transactions: TransactionDraft[];
  confidence: number;            // Confianza general
  rawInterpretation?: string;    // Para debugging
  error?: string;
};

export type BatchEntryState = {
  inputType: BatchInputType | null;
  isRecording: boolean;
  isProcessing: boolean;
  drafts: TransactionDraft[];
  error: string | null;
};
```

---

## System Prompt (Borrador)

```typescript
const SYSTEM_PROMPT = `Eres un asistente financiero experto en extraer transacciones de texto, audio transcrito o imágenes de recibos.

CONTEXTO:
- App de presupuesto personal en Colombia
- Divisa por defecto: COP (Peso Colombiano)
- Usuario puede mencionar múltiples transacciones en un solo input
- Fecha actual: ${new Date().toISOString().split('T')[0]}

CATEGORÍAS DISPONIBLES:

GASTOS (type: "expense"):
- food_drink: Comida y Bebida (restaurantes, supermercado, café, domicilios)
- home_utilities: Hogar y Servicios (arriendo, servicios públicos, internet, gas)
- transport: Transporte (gasolina, Uber, taxi, bus, peajes, parqueadero)
- lifestyle: Estilo de Vida (ropa, gym, entretenimiento, suscripciones, Netflix)
- miscellaneous: Otros (cualquier gasto que no encaje en las anteriores)

INGRESOS (type: "income"):
- primary_income: Ingresos Principales (salario, freelance, honorarios)
- other_income: Otros Ingresos (ventas, reembolsos, regalos, transferencias recibidas)

REGLAS DE EXTRACCIÓN:
1. Extrae TODAS las transacciones mencionadas, sin límite
2. Los montos SIEMPRE son números positivos (el "type" indica si es gasto/ingreso)
3. Interpreta montos colombianos: "50 mil" = 50000, "2 palos" = 2000000, "una luca" = 1000
4. Si no se especifica fecha, usa la fecha actual
5. Si no puedes determinar la categoría con certeza, usa "miscellaneous" o "other_income"
6. Si falta información crítica (monto), marca "needsReview": true
7. "confidence" es tu nivel de certeza de 0 a 1

EJEMPLOS DE INTERPRETACIÓN:
- "almuerzo" → food_drink
- "uber", "taxi", "didi" → transport
- "netflix", "spotify", "gym" → lifestyle
- "arriendo", "servicios", "agua", "luz" → home_utilities
- "salario", "sueldo", "nómina" → primary_income
- "me pagaron", "me devolvieron" → other_income

RESPONDE ÚNICAMENTE con JSON válido. Sin markdown, sin explicaciones, sin texto adicional.`;
```

---

## Diagrama de Secuencia

```
┌─────────┐     ┌─────────────┐     ┌───────────────────┐     ┌─────────────┐
│  User   │     │ SmartSpend  │     │ Supabase Edge     │     │ AI APIs     │
│ (App)   │     │ (React)     │     │ /parse-batch      │     │             │
└────┬────┘     └──────┬──────┘     └─────────┬─────────┘     └──────┬──────┘
     │                 │                      │                      │
     │ 1. Tap "+" FAB  │                      │                      │
     │ → "Lote con IA" │                      │                      │
     │────────────────>│                      │                      │
     │                 │                      │                      │
     │ 2. Selecciona   │                      │                      │
     │ tipo de input   │                      │                      │
     │────────────────>│                      │                      │
     │                 │                      │                      │
     │ 3. Captura      │                      │                      │
     │ (graba/foto/    │                      │                      │
     │  escribe)       │                      │                      │
     │────────────────>│                      │                      │
     │                 │                      │                      │
     │                 │ 4. Comprime imagen   │                      │
     │                 │ (si aplica)          │                      │
     │                 │                      │                      │
     │                 │ 5. POST /parse-batch │                      │
     │                 │ + JWT + payload      │                      │
     │                 │─────────────────────>│                      │
     │                 │                      │                      │
     │                 │                      │ 6. Validar JWT       │
     │                 │                      │ 7. Check rate limit  │
     │                 │                      │                      │
     │                 │                      │ 8a. Si audio:        │
     │                 │                      │ → GPT-4o Mini Trans  │
     │                 │                      │─────────────────────>│
     │                 │                      │<─────────────────────│
     │                 │                      │ (texto transcrito)   │
     │                 │                      │                      │
     │                 │                      │ 8b. Gemini 2.5 Flash │
     │                 │                      │ + System Prompt      │
     │                 │                      │ + JSON Schema        │
     │                 │                      │─────────────────────>│
     │                 │                      │<─────────────────────│
     │                 │                      │ (TransactionDraft[]) │
     │                 │                      │                      │
     │                 │ 9. Return response   │                      │
     │                 │<─────────────────────│                      │
     │                 │                      │                      │
     │ 10. Mostrar     │                      │                      │
     │ preview         │                      │                      │
     │<────────────────│                      │                      │
     │                 │                      │                      │
     │ 11. Editar/     │                      │                      │
     │ Confirmar       │                      │                      │
     │────────────────>│                      │                      │
     │                 │                      │                      │
     │                 │ 12. addTransaction() │                      │
     │                 │ × N transacciones    │                      │
     │                 │ (Zustand store)      │                      │
     │                 │                      │                      │
     │ 13. Éxito!      │                      │                      │
     │<────────────────│                      │                      │
```

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Gemini 2.5 Flash deprecation | Baja | Alto | Monitorear changelog, tener fallback a OpenAI |
| Costos exceden presupuesto | Media | Medio | Límite de duración de audio (120s), feature Pro-only |
| Baja precisión en español colombiano | Media | Alto | Fine-tune de prompt, feedback loop con usuarios |
| Rate limit abuse | Baja | Bajo | Upstash + límite por usuario autenticado |
| Usuario sin conexión | Alta | Medio | Bloquear feature con mensaje claro |

---

## Decisiones Arquitectónicas Clave

### ✅ Decisión 1: Edge Function obligatoria
**Razón:** Nunca exponer API keys de OpenAI/Gemini en el frontend compilado.

### ✅ Decisión 2: Gemini 2.5 Flash sobre GPT-4o-mini para visión
**Razón:** Costo de imagen ~$0.039 vs ~$0.08 (2x más barato), similar precisión.

### ✅ Decisión 3: GPT-4o Mini Transcribe sobre Whisper clásico
**Razón:** 50% más barato ($0.003/min vs $0.006/min) con misma API.

### ✅ Decisión 4: JSON Mode/Schema obligatorio
**Razón:** Garantiza output estructurado y parseable, elimina errores de formato.

### ✅ Decisión 5: Bloquear feature offline
**Razón:** Mejor UX que OCR local degradado. La transcripción requiere internet de todos modos.

### ✅ Decisión 6: Rate limit por usuario autenticado
**Razón:** Previene abuso, permite tracking de uso para optimización.

---

## Referencias y Fuentes

- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini Models Documentation](https://ai.google.dev/gemini-api/docs/models)
- [OpenAI Transcription Pricing](https://costgoat.com/pricing/openai-transcription)
- [OpenAI API Pricing](https://platform.openai.com/docs/pricing)
- [capacitor-voice-recorder npm](https://www.npmjs.com/package/capacitor-voice-recorder)
- [@capacitor/camera npm](https://www.npmjs.com/package/@capacitor/camera)
- [browser-image-compression npm](https://www.npmjs.com/package/browser-image-compression)
- [Upstash Redis Pricing](https://upstash.com/docs/redis/overall/pricing)
- [Supabase Edge Functions Rate Limiting](https://supabase.com/docs/guides/functions/examples/rate-limiting)

---

## Changelog del Documento

| Fecha | Cambio |
|-------|--------|
| 2026-02-03 | Creación inicial del ADR |
| 2026-02-03 | **Actualización crítica:** Gemini 1.5 Flash retirado, migrar a 2.5 Flash |
| 2026-02-03 | Agregar GPT-4o Mini Transcribe como opción más económica |
| 2026-02-03 | Ajustar versiones a Capacitor 8 (proyecto actual) |
