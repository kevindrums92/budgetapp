# ADR-003: AI Financial Assistant (Asistente Financiero IA)

**Fecha de Creacion:** 2026-02-11
**Estado:** 📋 En Planificacion
**Ultima Actualizacion:** 2026-02-11
**Autor:** AI Architecture Team

---

## Resumen Ejecutivo

Implementacion de un **Asistente Financiero IA conversacional** para SmartSpend que responde preguntas sobre las finanzas del usuario en lenguaje natural. El asistente es de **solo lectura** (no crea ni modifica datos), se accede via un **boton central elevado (hero button)** en el BottomBar, y las conversaciones son **efimeras** (sin persistencia entre sesiones).

**Diferenciador clave**: Mientras Monarch Money cobra $99.99/yr por su AI assistant y requiere conexion bancaria, SmartSpend ofrece un asistente financiero IA a $34.99/yr que funciona con datos locales, sin necesidad de conectar cuentas bancarias. Privacidad total + IA conversacional a una fraccion del precio.

**Modelo IA**: Gemini 2.5 Flash-Lite (primario) con GPT-4o-mini (fallback), siguiendo el patron existente de batch entry.

**Monetizacion**: 10 mensajes/dia free, 100 mensajes/dia Pro.

---

## Analisis Competitivo

| App | AI Assistant | Acciones | Contexto | Precio | LATAM |
|-----|-------------|----------|----------|--------|-------|
| Cleo AI | Chatbot conversacional + voz | Si (cash advances, savings auto) | Conexion bancaria | $5.99/mo | Limitado |
| Monarch Money | AI assistant conversacional | No | Conexion bancaria | $14.99/mo | No |
| Copilot Money | Auto-categorizacion IA | No (solo categorizacion) | Conexion bancaria | $13/mo | No |
| YNAB | Sugerencias ML para categorias | No | Entrada manual | $14.99/mo | No |
| Rocket Money | Bot de negociacion de facturas | Si (negociacion) | Conexion bancaria | $7-14/mo | Solo US |
| Mobills (Brasil) | Tips basicos, sin chat | No | Manual + banco | R$11.90/mo | Solo Brasil |
| Fintonic (Espana) | Alertas basicas | No | Agregacion bancaria | Gratis + Ads | Espana, Mexico |
| **SmartSpend** | **Chatbot conversacional read-only** | **No (solo insights)** | **Local-first** | **$4.99/mo** | **Full LATAM** |

**Oportunidad**: Ninguna app LATAM combina:
- IA conversacional profunda con comprension de lenguaje natural
- Datos local-first (sin conexion bancaria requerida)
- Soporte multi-idioma (es, en, fr, pt)
- Privacidad total (datos nunca salen del control del usuario)
- Precio accesible ($34.99/yr vs $99.99-$179.88/yr de competidores)

**Insights del mercado**:
- Cleo AI muestra que la personalidad aumenta el engagement, pero un tono profesional genera mas confianza
- Los usuarios confian mas en asistentes read-only que en bots que modifican datos
- Voice input (Cleo 3.0) es tendencia pero agrega complejidad (feature V2)
- Gemini 2.5 Flash-Lite supera a GPT-4o-mini en contexto financiero espanol/LATAM

---

## Decisiones de Arquitectura

### DA-1: Boton central "Hero" en el BottomBar

**Contexto**: El BottomBar actual tiene 4 tabs iguales (Home, Plan, Stats, Profile) en `grid-cols-4`. Agregar un 5to tab igual hace los iconos demasiado pequenos en pantallas estrechas.

**Decision**: Transformar el BottomBar de `grid-cols-4` a `grid-cols-5` con el boton central (3ro) como un "hero button" visualmente elevado.

```
Antes (4 tabs):
Home    Plan    Stats    Profile

Despues (5 tabs con hero button):
Home    Plan    [✨]    Stats    Profile
                 ↑
              Elevado,
              mas grande,
              circulo teal
```

**Especificaciones visuales**:
- Boton central: `h-14 w-14` circulo teal (`bg-[#18B7B0]`), icono blanco
- Elevado: `-mt-4` (sobresale del bar)
- Icono: `Sparkles` de lucide-react (24px, blanco, strokeWidth 2.2)
- Sombra: `shadow-lg`
- Label debajo: "IA" (`text-[11px] text-gray-500`)
- Los otros 4 tabs: tamano normal (22px icons), sin cambios en estilo
- Animacion: `active:scale-95 transition-transform`
- Al tocar: Navega a `/assistant`

**Razones**:
- Patron de center button (Instagram, TikTok, Uber) es familiar para usuarios
- Llama la atencion hacia el feature premium de IA
- No hay conflicto semantico (IA es independiente de las 4 secciones)
- No rompe el modelo mental de navegacion existente

### DA-2: Asistente financiero read-only (sin acciones de escritura)

**Decision**: El asistente IA SOLO puede responder preguntas y dar insights. NO puede crear transacciones, modificar presupuestos, ni cambiar ningun dato.

**Alcance**:
- ✅ Responder: "¿Cuanto gaste en comida este mes?"
- ✅ Comparar: "¿Gaste mas en transporte este mes vs el pasado?"
- ✅ Insights: "¿Cual categoria crecio mas?"
- ✅ Presupuestos: "¿Estoy cumpliendo mi presupuesto de mercado?"
- ✅ Metas: "¿Como va mi meta de ahorro de vacaciones?"
- ❌ Ejecutar: "Agrega un gasto de $50.000 en Restaurantes"
- ❌ Modificar: "Mueve $100.000 del presupuesto de Comida a Transporte"

**Razones**:
- Reduce riesgo de errores (no hay eliminaciones/modificaciones accidentales)
- Genera confianza (el usuario sabe que la IA no toca sus datos)
- Simplifica implementacion (no requiere CRUD, no requiere undo)
- Alineado con filosofia local-first (usuario mantiene control total)

### DA-3: Conversaciones efimeras (sin persistencia)

**Decision**: El historial de chat NO se guarda en BudgetState ni en la nube. Cada sesion empieza fresca.

**Implementacion**:
- Mensajes almacenados en React state (`useState<Message[]>`)
- Se limpian al desmontar la pagina
- Sin escrituras a base de datos
- Sin sync a la nube
- No requiere migracion de schema

**Razones**:
- Privacidad: Sin registro permanente de preguntas del usuario
- Modelo de datos simple (sin nueva migracion de schema)
- Fuerza conversaciones concisas y enfocadas (mejor para rate limits)
- Reduce costos de storage (no almacenar mensajes en Supabase)

**Consideracion V2**: Feature opcional "guardar esta conversacion" con consentimiento explicito del usuario.

### DA-4: Respuesta completa (sin streaming)

**Decision**: Mostrar indicador de carga → entregar respuesta completa de una vez (sin streaming).

**Flujo UI**:
1. Usuario escribe pregunta
2. Boton "Enviar" se deshabilita, muestra spinner
3. Indicador animado de escritura aparece en el chat (3 puntos pulsantes)
4. API responde
5. Mensaje completo aparece con animacion fade-in
6. Input se rehabilita

**Razones**:
- Implementacion mas simple (sin protocolo SSE, sin chunked parsing)
- Funciona en todos los dispositivos (sin polyfills de SSE)
- Alineado con patron de batch entry (respuesta completa)
- Free tier de Gemini API no soporta streaming confiablemente
- Usuarios moviles prefieren respuestas completas (menos jarring en conexiones lentas)

### DA-5: Snapshot financiero compacto (eficiente en tokens)

**Contexto**: Gemini 2.5 Flash-Lite free tier tiene 15 RPM, 1000 RPD. Contexto grande = respuestas mas lentas + mayor costo de tokens.

**Decision**: Enviar un **snapshot compacto** de datos financieros (maximo ultimos 2 meses) en vez del historial completo de transacciones.

**Ahorro de tokens**:
- Historial completo (1000 txns): ~50,000 tokens
- Snapshot compacto (2 meses agregados): ~1,500 tokens
- **Reduccion del 97%**

**Que se incluye**:
- Mes actual: totales ingreso/gasto, top 5 categorias de gasto, top 3 categorias de ingreso
- Mes anterior: misma estructura (para comparaciones)
- Presupuestos activos: nombre, tipo, monto, gastado/ahorrado, porcentaje, excedido/completado
- Health check: limites excedidos, progreso de metas
- Moneda y locale del usuario

**Que se excluye**:
- Detalle individual de transacciones (solo agregados)
- Meses anteriores a 2
- Presupuestos archivados
- Viajes completados

### DA-6: Gemini 2.5 Flash-Lite primario, GPT-4o-mini fallback

**Decision**: Misma estrategia de modelo IA que el feature de batch entry.

**Primario**: Gemini 2.5 Flash-Lite
- Free tier: 15 RPM, 1,000 RPD
- Excelente soporte espanol/portugues
- Mejor para contexto financiero LATAM

**Fallback**: GPT-4o-mini
- Si Gemini quota agotada o falla
- Espanol ligeramente inferior pero aceptable
- Asegura disponibilidad

**Diferencia con batch entry**: Temperature mas alta (0.7 vs 0.1) para conversacion mas natural. Max output tokens limitado a 500 para respuestas concisas.

### DA-7: Rate limiting con Upstash Redis (Pro feature con count-limit)

**Decision**: Seguir el patron exacto del feature de batch entry.

**Rate limits**:
- **Free**: 10 mensajes/dia
- **Pro**: 100 mensajes/dia

**Implementacion**:
- Upstash Redis con sliding window
- Check tabla `user_subscriptions` para plan
- Retornar 429 con reset timestamp al exceder limite
- Frontend muestra contador de mensajes restantes + CTA de paywall

**Razon de los limites**:
- 10/dia free es suficiente para probar el feature y generar habito
- Se agota rapido → incentiva conversion a Pro
- 100/dia Pro es generoso (promedio estimado: 5-10 mensajes/sesion)
- Consistente con monetizacion existente

---

## Modelo de Datos

### Tipos de mensaje (solo en memoria)

```typescript
// src/features/ai-assistant/types/assistant.types.ts

export type MessageRole = 'user' | 'assistant';

export type Message = {
  id: string;                // UUID
  role: MessageRole;
  content: string;           // Texto plano del mensaje
  timestamp: number;         // epoch ms
  isError?: boolean;         // Si el API fallo
};

export type FinancialSnapshot = {
  currentMonth: MonthSnapshot;
  previousMonth: MonthSnapshot;
  activeBudgets: BudgetSnapshot[];
  budgetHealthCheck: {
    exceededLimits: number;
    totalLimits: number;
    goalPercentage: number;
    totalGoals: number;
  };
  currency: string;          // e.g., "COP", "USD", "GTQ"
  locale: string;            // e.g., "es-CO", "en-US"
};

export type MonthSnapshot = {
  key: string;               // YYYY-MM
  income: number;
  expenses: number;
  balance: number;           // income - expenses
  topExpenseCategories: CategorySummary[];  // Top 5
  topIncomeCategories: CategorySummary[];   // Top 3
};

export type CategorySummary = {
  name: string;              // Nombre traducido de la categoria
  amount: number;
  count: number;             // Numero de transacciones
};

export type BudgetSnapshot = {
  categoryName: string;
  type: 'limit' | 'goal';
  amount: number;
  spent: number;             // Para limites
  saved: number;             // Para metas
  percentage: number;        // Porcentaje de progreso
  remaining: number;
  isExceeded: boolean;       // Solo para limites
  isCompleted: boolean;      // Solo para metas
  period: {
    startDate: string;       // YYYY-MM-DD
    endDate: string;         // YYYY-MM-DD
  };
};
```

### Request/Response del Edge Function

```typescript
// Request al Edge Function ai-assistant
export type AssistantRequest = {
  question: string;                      // Pregunta del usuario en lenguaje natural
  snapshot: FinancialSnapshot;           // Contexto financiero compacto
  conversationHistory?: Message[];       // Ultimos 5 mensajes para contexto
  locale: string;                        // Idioma del usuario (es, en, fr, pt)
};

// Response del Edge Function
export type AssistantResponse = {
  success: boolean;
  answer: string;                        // Respuesta generada por la IA
  error?: string;                        // Codigo de error si fallo
  message?: string;                      // Mensaje de error amigable
  resetAt?: number;                      // Unix timestamp para reset de rate limit
};
```

**Sin cambios en BudgetState**: Los mensajes NO se persisten en `budget.store.ts`. El estado del chat vive solo en el componente AssistantPage.

---

## Diseno del Edge Function

### Archivo: `supabase/functions/ai-assistant/index.ts`

**Estructura** (espejo de `parse-batch`):

```
supabase/functions/ai-assistant/
├── index.ts        # Handler principal (auth, rate limit, Gemini/OpenAI)
└── prompt.ts       # System prompt + snapshot formatter
```

**Flujo del handler principal**:

```
1. Validar JWT via Supabase Auth
2. Obtener plan del usuario (free/pro) de user_subscriptions
3. Aplicar rate limit via Upstash Redis
4. Parsear request body (question, snapshot, conversationHistory, locale)
5. Generar system prompt con snapshot formateado
6. Llamar Gemini 2.5 Flash-Lite (fallback a GPT-4o-mini si falla)
7. Retornar respuesta JSON
```

**Diferencias clave vs parse-batch**:
- Sin transcripcion de audio
- Sin procesamiento de imagen
- Respuesta mas simple (solo texto string, sin JSON estructurado)
- Temperature mas alta (0.7 vs 0.1) para conversacion natural
- Max output tokens limitado a 500 (respuestas concisas)

**Rate limits**:
```typescript
// Free: 10 mensajes por dia
new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 d"),
  prefix: "smartspend:assistant:free",
});

// Pro: 100 mensajes por dia
new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 d"),
  prefix: "smartspend:assistant:pro",
});
```

**Variables de entorno requeridas** (ya existentes):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

---

## Diseno del System Prompt

### Archivo: `supabase/functions/ai-assistant/prompt.ts`

**Estructura del prompt**:

```
[System Prompt]
├── Rol: Asistente financiero inteligente de SmartSpend
├── Reglas:
│   ├── Responder en el idioma de la pregunta
│   ├── Usar simbolo de moneda correcto
│   ├── Formatear numeros con separadores de miles
│   ├── Ser breve (max 3-4 oraciones)
│   ├── Solo responder sobre finanzas
│   ├── No inventar datos
│   └── NUNCA crear/modificar/eliminar datos (read-only)
├── Datos del usuario:
│   ├── Mes actual (ingresos, gastos, balance, top categorias)
│   ├── Mes anterior (para comparaciones)
│   ├── Presupuestos activos (limites y metas con progreso)
│   └── Salud financiera (limites excedidos, progreso metas)
└── Ejemplos de buenas respuestas (few-shot)

[User Prompt]
├── Historial de conversacion (ultimos 5 mensajes)
└── Nueva pregunta del usuario
```

**Ejemplos de interaccion**:

```
Usuario: "¿Cuanto gaste en comida este mes?"
IA: "Este mes llevas $800.000 en Alimentacion, con 15 transacciones.
     Es 12% menos que el mes pasado ($910.000)."

Usuario: "¿Estoy cumpliendo mi presupuesto de transporte?"
IA: "Si, vas bien. Has gastado $400.000 de tu limite de $500.000
     en Transporte (80% usado). Te quedan $100.000 para el resto del mes."

Usuario: "¿Cual categoria crecio mas?"
IA: "Entretenimiento crecio 45%, de $200.000 a $290.000.
     Fue el mayor aumento este mes."

Usuario: "Compara enero vs febrero"
IA: "Febrero: $1.2M gastado vs Enero: $1.4M. Bajaste 14%.
     Principales reducciones: Restaurantes (-$80K), Ropa (-$45K).
     Aumento: Transporte (+$30K)."
```

**Multi-idioma**: System prompt diferente para es, en, fr, pt con instrucciones y formato adaptado al idioma.

---

## Estructura de Archivos

```
src/features/ai-assistant/
├── index.ts                        # Exports publicos
├── pages/
│   └── AssistantPage.tsx           # Pagina principal de chat (/assistant)
├── components/
│   ├── ChatBubble.tsx              # Burbuja de mensaje (usuario/asistente)
│   ├── ChatBubble.stories.tsx      # Storybook story
│   ├── ChatInput.tsx               # Input de texto + boton enviar
│   ├── TypingIndicator.tsx         # Animacion "IA escribiendo..." (3 puntos)
│   ├── WelcomePrompts.tsx          # Preguntas de ejemplo (estado vacio)
│   ├── WelcomePrompts.stories.tsx  # Storybook story
│   ├── RateLimitBanner.tsx         # Mensajes restantes + CTA paywall
│   └── ErrorMessage.tsx            # Estado de error con boton reintentar
├── services/
│   ├── assistant.service.ts        # Llamadas API al Edge Function
│   ├── assistant.service.test.ts   # Unit tests
│   ├── snapshot.service.ts         # Construye FinancialSnapshot del store
│   └── snapshot.service.test.ts    # Unit tests
├── hooks/
│   └── useAssistant.ts             # Hook principal de logica de chat
└── types/
    └── assistant.types.ts          # Todos los tipos TypeScript
```

### Edge Function

```
supabase/functions/ai-assistant/
├── index.ts                        # Handler principal
└── prompt.ts                       # System prompt + formatter del snapshot
```

---

## Componentes UI

### AssistantPage (Pagina principal de chat)

**Layout**: `h-dvh` (viewport exacto) con 3 secciones flex:
```
┌─────────────────────────────┐
│  Header (shrink-0, sticky)  │  ← PageHeader con back button + titulo
│  [←] Asistente Financiero   │
│  [Rate limit banner]        │  ← Mensajes restantes / banner Pro
├─────────────────────────────┤
│                             │
│  Messages (flex-1)          │  ← overflow-y-auto, scroll automatico
│  overflow-y-auto            │
│                             │
│  [Welcome prompts]          │  ← Estado vacio con 4 preguntas ejemplo
│  [User bubble]              │  ← Alineado a la derecha, fondo teal
│  [AI bubble]                │  ← Alineado a la izquierda, fondo blanco
│  [Typing indicator]         │  ← 3 puntos animados mientras carga
│                             │
├─────────────────────────────┤
│  Input (shrink-0)           │  ← Input de texto + boton enviar
│  [¿En que gaste mas...? ▷] │
│  safe-area-inset-bottom     │
└─────────────────────────────┘
```

**Specs**:
- Container: `flex h-dvh flex-col bg-gray-50 dark:bg-gray-950`
- Header: `sticky top-0 z-10 bg-white shadow-sm`
- Messages: `flex-1 overflow-y-auto px-4 py-4`
- Input: `shrink-0 bg-white px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]`
- Auto-scroll al fondo cuando llega nuevo mensaje
- `useKeyboardDismiss()` para cerrar teclado al scroll/tap fuera

### ChatBubble (Burbuja de mensaje)

**Specs por tipo**:

| Propiedad | Usuario | Asistente | Error |
|-----------|---------|-----------|-------|
| Alineacion | `justify-end` (derecha) | `justify-start` (izquierda) | `justify-start` |
| Background | `bg-[#18B7B0]` | `bg-white shadow-sm` | `bg-red-50` |
| Texto | `text-white` | `text-gray-900` | `text-red-600` |
| Max width | 80% | 80% | 80% |
| Border radius | `rounded-2xl` | `rounded-2xl` | `rounded-2xl` |
| Padding | `px-4 py-3` | `px-4 py-3` | `px-4 py-3` |
| Extra | - | - | Boton "Reintentar" |

### WelcomePrompts (Estado vacio)

Mostrado cuando `messages.length === 0`:
- Icono central: `Sparkles` en circulo `bg-[#18B7B0]/10` (h-16 w-16)
- Titulo: "¿En que puedo ayudarte?"
- Subtitulo: "Preguntame sobre tus gastos, ingresos o presupuestos"
- 4 tarjetas de preguntas ejemplo con iconos:
  1. `TrendingUp` → "¿En que categoria gaste mas?"
  2. `BarChart2` → "Comparar con mes anterior"
  3. `AlertCircle` → "¿Como van mis presupuestos?"
  4. `PiggyBank` → "Progreso de mis metas"
- Al tocar una tarjeta → auto-enviar esa pregunta

### TypingIndicator (Indicador de escritura)

- 3 puntos grises (`bg-gray-400`) con animacion de bounce escalonada
- Container: `bg-white rounded-2xl px-4 py-3 shadow-sm` (mismo estilo que burbuja de asistente)
- Animacion: keyframes bounce con delay de 0, 150ms, 300ms por punto

### RateLimitBanner (Banner de rate limit)

- **Pro**: Banner dorado con icono Crown → "Pro: Mensajes ilimitados"
- **Free (>3 restantes)**: Banner gris → "X mensajes restantes hoy"
- **Free (<=3 restantes)**: Banner rojo → "X mensajes restantes hoy"
- **Free (0 restantes)**: Banner rojo + boton "Actualizar a Pro"

### ChatInput (Input de texto)

- Container: `flex items-center gap-2`
- Input: `flex-1 rounded-xl bg-gray-100 px-4 py-3 text-sm`
- Boton enviar: circulo teal `bg-[#18B7B0] h-10 w-10 rounded-full` con icono `Send` blanco
- Deshabilitado: `disabled:opacity-50` cuando esta cargando o input vacio

---

## Rutas

### Cambios en `src/App.tsx`

```typescript
// Agregar a lazy imports:
const AssistantPage = lazy(() => import("@/features/ai-assistant/pages/AssistantPage"));

// Agregar a isFormRoute check:
const isFormRoute =
  location.pathname === "/add" ||
  location.pathname === "/assistant" || // NUEVO
  // ...rest

// Agregar ruta:
<Route path="/assistant" element={<AssistantPage />} />
```

### Cambios en BottomBar

```typescript
// Antes: grid-cols-4
<div className="grid grid-cols-4">
  <Tab to="/" ... />
  <Tab to="/plan" ... />
  <Tab to="/stats" ... />
  <Tab to="/profile" ... />
</div>

// Despues: grid-cols-5 con hero button en el centro
<div className="grid grid-cols-5">
  <Tab to="/" ... />
  <Tab to="/plan" ... />
  <HeroButton />              // NUEVO - boton elevado central
  <Tab to="/stats" ... />
  <Tab to="/profile" ... />
</div>
```

**HeroButton component**:
```tsx
function HeroButton() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-1 flex-col items-center justify-center -mt-4">
      <button
        type="button"
        onClick={() => navigate('/assistant')}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#18B7B0] shadow-lg active:scale-95 transition-transform"
      >
        <Sparkles size={24} className="text-white" strokeWidth={2.2} />
      </button>
      <span className="mt-1 text-[11px] leading-none tracking-tight text-gray-500">
        IA
      </span>
    </div>
  );
}
```

---

## Monetizacion

### Cambios en `src/constants/pricing.ts`

```typescript
export type ProFeature =
  | 'unlimited_categories'
  | 'unlimited_budgets'
  | 'unlimited_scheduled'
  | 'unlimited_backups'
  | 'unlimited_ai_assistant'    // NUEVO
  | 'stats_page'
  | 'export_data'
  | 'history_filters';

export type PaywallTrigger =
  | /* ... existentes ... */
  | 'ai_assistant_limit';       // NUEVO - al agotar mensajes diarios

export const FREE_TIER_LIMITS = {
  totalCategories: 10,
  activeBudgets: 2,
  scheduledTransactions: 3,
  aiAssistantMessages: 10,      // NUEVO - 10 mensajes por dia
} as const;

// Agregar a COUNT_LIMITED_FEATURES:
unlimited_ai_assistant: 'aiAssistantMessages',
```

**Nota**: El conteo de mensajes se maneja server-side (Upstash Redis), no client-side. El `FREE_TIER_LIMITS` se usa para el UI del banner, pero la validacion real ocurre en el Edge Function.

---

## i18n

### Crear namespace `assistant.json` en cada locale

**`src/i18n/locales/es/assistant.json`**:

```json
{
  "page": {
    "title": "Asistente Financiero",
    "subtitle": "Pregunta sobre tus finanzas"
  },
  "input": {
    "placeholder": "¿En que gaste mas este mes?",
    "send": "Enviar"
  },
  "welcome": {
    "title": "¿En que puedo ayudarte?",
    "subtitle": "Preguntame sobre tus gastos, ingresos o presupuestos"
  },
  "prompts": {
    "topCategory": "¿En que categoria gaste mas?",
    "compare": "Comparar con mes anterior",
    "budgetHealth": "¿Como van mis presupuestos?",
    "savingsGoal": "Progreso de mis metas"
  },
  "banner": {
    "remaining": "{{count}} mensajes restantes hoy",
    "upgrade": "Actualizar a Pro",
    "pro": "Pro: Mensajes ilimitados"
  },
  "typing": "Analizando tus finanzas...",
  "errors": {
    "generic": "Algo salio mal. Intenta de nuevo.",
    "rateLimitFree": "Has alcanzado tu limite de 10 mensajes diarios. Actualiza a Pro para obtener 100 mensajes/dia.",
    "rateLimitPro": "Has excedido el limite de 100 mensajes diarios. Intenta manana.",
    "noSession": "Debes iniciar sesion para usar el asistente.",
    "timeout": "La solicitud tardo demasiado. Verifica tu conexion.",
    "offline": "Sin conexion a internet. Verifica tu red.",
    "retry": "Reintentar"
  },
  "bottomBar": {
    "label": "IA"
  }
}
```

**Traducciones adicionales**: `en/assistant.json`, `fr/assistant.json`, `pt/assistant.json` con la misma estructura.

---

## Plan de Implementacion por Fases

### Fase 1: Core Chat Experience (2 semanas)

| Step | Descripcion | Archivos clave |
|------|-------------|----------------|
| 1.1 | Tipos: `Message`, `FinancialSnapshot`, `AssistantRequest/Response` | `assistant.types.ts` |
| 1.2 | Servicio de snapshot: `buildFinancialSnapshot()` desde el store | `snapshot.service.ts` + tests |
| 1.3 | Edge Function scaffold: CORS, auth, rate limit | `supabase/functions/ai-assistant/index.ts` |
| 1.4 | System prompt con soporte multi-idioma | `supabase/functions/ai-assistant/prompt.ts` |
| 1.5 | Integracion Gemini 2.5 Flash-Lite + fallback OpenAI | Edge Function |
| 1.6 | Servicio frontend: `sendMessage()`, manejo de errores | `assistant.service.ts` + tests |
| 1.7 | Hook `useAssistant`: estado de mensajes, loading, errores | `hooks/useAssistant.ts` |
| 1.8 | Componentes UI: `ChatBubble`, `ChatInput`, `TypingIndicator` | `components/` |
| 1.9 | `AssistantPage`: chat full-screen con header | `pages/AssistantPage.tsx` |
| 1.10 | Welcome prompts (estado vacio con 4 preguntas ejemplo) | `components/WelcomePrompts.tsx` |
| 1.11 | Banner de rate limit + Pro gate | `components/RateLimitBanner.tsx` |
| 1.12 | i18n namespace `assistant.json` en 4 idiomas | `i18n/locales/*/assistant.json` |
| 1.13 | BottomBar hero button + ruta `/assistant` + isFormRoute | `BottomBar.tsx`, `App.tsx` |
| 1.14 | Pricing constants: ProFeature, PaywallTrigger, FREE_TIER_LIMITS | `pricing.ts` |

### Fase 2: Polish y Optimizacion (1 semana)

| Step | Descripcion | Archivos clave |
|------|-------------|----------------|
| 2.1 | Componente de error con boton reintentar | `ErrorMessage.tsx` |
| 2.2 | Mejoras en estado de carga (typing indicator animado) | `TypingIndicator.tsx` |
| 2.3 | Storybook stories para todos los componentes | `*.stories.tsx` |
| 2.4 | Refinamiento de welcome prompts (mejores preguntas ejemplo) | `WelcomePrompts.tsx` |
| 2.5 | Optimizacion de snapshot (reducir tokens aun mas) | `snapshot.service.ts` |
| 2.6 | Formateo de moneda en respuestas (server-side) | `prompt.ts` |

### Fase 3: Features Avanzados [V2 Opcional] (1-2 semanas)

| Step | Descripcion | Archivos clave |
|------|-------------|----------------|
| 3.1 | Input de voz (speech-to-text via Whisper) | `components/VoiceButton.tsx` |
| 3.2 | Preguntas de seguimiento sugeridas despues de cada respuesta | Prompt engineering |
| 3.3 | "Preguntar sobre esta transaccion" deep link desde HistoryPage | Cross-feature |
| 3.4 | Animacion de entrada del hero button (pulse/glow al primer uso) | `BottomBar.tsx` |
| 3.5 | Feature "guardar conversacion" con persistencia opcional | Store migration |

---

## Testing

### Unit Tests (alta prioridad)

**`snapshot.service.test.ts`**:
1. Build snapshot con transacciones vacias → retorna totales en cero
2. Build snapshot con mix ingreso/gasto → agregacion correcta
3. Top categorias ordenadas por monto DESC, limitadas a 5 (expense) y 3 (income)
4. Snapshot de mes anterior incluye rango de fechas correcto
5. Presupuestos activos incluyen todos excepto 'archived'
6. Currency y locale pasados correctamente
7. Performance: sets grandes de transacciones (1000+ txns) → < 100ms

**`assistant.service.test.ts`**:
1. `sendMessage()` con snapshot valido → respuesta exitosa
2. `sendMessage()` con 429 rate limit → retorna error con `resetAt`
3. `sendMessage()` con 401 auth error → retorna error de autenticacion
4. `sendMessage()` con timeout de red → retorna error de timeout
5. Parseo de respuesta maneja JSON malformado correctamente

### Component Tests

**`ChatBubble.test.tsx`**:
1. Mensaje de usuario renderiza alineado a la derecha con fondo teal
2. Mensaje de asistente renderiza alineado a la izquierda con fondo blanco
3. Mensaje de error muestra boton reintentar
4. Callback `onRetry` se dispara al hacer click

**`WelcomePrompts.test.tsx`**:
1. Renderiza 4 prompts de ejemplo
2. `onPromptClick` se dispara con texto correcto de la pregunta
3. Iconos se muestran correctamente para cada prompt

**`RateLimitBanner.test.tsx`**:
1. Usuarios Pro ven "Mensajes ilimitados"
2. Usuarios free con 5 restantes ven banner gris
3. Usuarios free con 2 restantes ven banner rojo
4. Usuarios free con 0 restantes ven boton "Actualizar a Pro"

### Verificacion end-to-end

1. `npm run build` pasa sin errores TypeScript
2. BottomBar renderiza 5 tabs con boton central elevado
3. Tocar hero button navega a `/assistant`
4. Estado vacio muestra welcome prompts
5. Tocar un prompt → lo envia → loading → respuesta aparece
6. Usuario free ve contador de mensajes restantes
7. Al agotar mensajes → error de rate limit → CTA de paywall
8. Edge Function deployed y respondiendo a requests

---

## Metricas de Exito

| Metrica | Objetivo | Como medir |
|---------|----------|------------|
| Adopcion | 30% de usuarios activos prueban el asistente en el primer mes | Evento `ai_assistant_opened` |
| Engagement | 50% de usuarios que lo prueban envian 3+ mensajes | Mensajes por usuario unico |
| Retencion | Usuarios con 5+ sesiones de IA tienen 25% mayor retencion | Comparacion de cohortes (usuarios IA vs no-IA) |
| Conversion | 8% de usuarios free que llegan al rate limit hacen upgrade a Pro | Paywall trigger `ai_assistant_limit` → conversion |
| Costo | Costo API promedio < $0.01 por usuario por mes | Uso de Gemini/OpenAI API × usuarios free tier |
| Calidad | Tasa de respuestas utiles > 85% | Feedback in-app despues de respuestas (V2) |

---

## Archivos Criticos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/shared/components/layout/BottomBar.tsx` | Agregar hero button central, grid-cols-4 → grid-cols-5 |
| `src/App.tsx` | Nueva ruta `/assistant`, agregar a isFormRoute |
| `src/constants/pricing.ts` | Agregar ProFeature, PaywallTrigger, FREE_TIER_LIMITS |
| `src/features/ai-assistant/` | **NUEVO** — todo el feature module |
| `src/i18n/locales/*/assistant.json` | **NUEVO** — traducciones en 4 idiomas |
| `supabase/functions/ai-assistant/` | **NUEVO** — Edge Function completo |

---

## Changelog del Documento

| Fecha | Cambio |
|-------|--------|
| 2026-02-11 | Creacion inicial del ADR con analisis competitivo, 7 decisiones de arquitectura, modelo de datos, diseno de Edge Function, system prompt, componentes UI, rutas, monetizacion, i18n, plan de implementacion por fases, testing y metricas |
