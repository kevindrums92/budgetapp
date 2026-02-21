# SmartSpend - Características Completas

## Resumen

SmartSpend es una aplicación PWA de control de gastos personales con enfoque local-first. Los datos se almacenan en el dispositivo y opcionalmente se sincronizan con la nube. Incluye soporte para múltiples idiomas, monedas, temas, y un sistema completo de presupuestos y estadísticas.

---

## 🌍 Internacionalización (i18n)

### Idiomas Soportados
- **Español (es)** - Idioma por defecto
- **Inglés (en)** - Traducción completa
- **Francés (fr)** - Soporte para fechas y UI
- **Portugués (pt)** - Soporte para fechas y UI

### Características de i18n
- Detección automática de idioma del navegador
- 11 namespaces de traducción para modularidad
- 300+ strings traducidos en toda la aplicación
- Traducción de categorías por defecto según idioma seleccionado
- Pluralización inteligente ("1 día" vs "5 días")
- Interpolación de variables dinámicas
- Fallback a español cuando falta traducción
- Selector de idioma en ProfilePage con confirmación

### Cobertura por Módulo
- Onboarding completo (13 pantallas)
- Home: búsqueda, filtros, presupuesto diario
- Budget: resumen mensual, límites, secciones
- Stats: gráficas, métricas, días de la semana
- Transactions: formularios, lista, programación
- Categories: lista, grupos, formularios
- Backup: métodos, exportar/restaurar
- Scheduled: transacciones programadas
- Todos los componentes y modales

---

## 💱 Sistema Multi-Moneda

### Monedas Disponibles
- **50+ monedas** organizadas por región
- Regiones: América, Europa, Asia, África, Oceanía
- Ejemplos: COP, USD, EUR, GBP, JPY, ARS, MXN, BRL, AUD, etc.

### Características
- **Auto-detección** basada en timezone y locale del usuario
- **CurrencyProvider**: Context API para gestión de moneda
- **useCurrency hook**: Hook personalizado para formateo
- **CurrencySelector**: Modal de selección con búsqueda
- Formato dinámico de montos con `formatAmount()`
- Persistencia en localStorage (`app_currency`)
- Integrado en onboarding (Screen3_Currency)
- Búsqueda por nombre o código de moneda
- Moneda recomendada basada en localización

---

## 🎨 Sistema de Temas

### Modos de Tema
- **Light** - Tema claro
- **Dark** - Tema oscuro
- **System** - Auto-detección desde preferencia del OS

### Características
- **ThemeProvider**: Context API para gestión de tema
- **useTheme hook**: Hook personalizado para cambio de tema
- Anti-flicker script en index.html (previene flash)
- Todos los componentes con soporte dark mode
- Paleta dark: `dark:bg-gray-950` (fondos), `dark:bg-gray-900` (cards)
- Splash screen adaptado a dark mode
- Persistencia en localStorage (`app_theme`)
- Selector de tema en ProfilePage

---

## 📝 Gestión de Transacciones

### Registro de Movimientos
- **Gastos e ingresos** con monto, descripción, fecha y categoría
- **Estados**: Pagado, Pendiente, Planeado (badges visuales)
- **Notas opcionales** por transacción
- Formulario optimizado para móvil con teclado numérico
- Input de monto con separadores de miles y tamaño dinámico
- DatePicker personalizado con calendario español (es-CO)
- Categorías con iconos y colores
- Guardado de borrador al navegar entre páginas

### Transacciones Programadas (Scheduled)
- **Recurrencia flexible**: diaria, semanal, mensual, trimestral, anual, personalizada
- **Intervalos personalizables**: cada 2 semanas, cada 3 meses, etc.
- **Transacciones virtuales**: visualización de futuras transacciones en el listado
- **Confirmación individual**: confirmar, editar o eliminar antes de registrar
- **Modal de opciones**: "Solo este registro" vs "Este y los siguientes"
- **Desactivación de programaciones** (irreversible)
- **Panel de gestión**: Perfil → Programadas (tabs: Activas/Inactivas)
- **Auto-confirmación** de transacciones pasadas al abrir la app
- Banner de transacciones programadas con modal de confirmación
- Indicador visual (icono Repeat) en transacciones recurrentes
- Sistema de generación lazy con cálculo on-the-fly

### Listado y Filtros
- **Vista mensual** con navegación por meses (selector global en header)
- **Agrupación por día** con totales diarios
- **Búsqueda** por nombre, categoría o notas
- **Filtros**: Todos, Gastos, Ingresos, Pendientes, Recurrentes
- **Daily totals**: Balance diario con lógica de ingresos/gastos
- Barra de búsqueda sticky debajo del balance
- Mensajes contextuales cuando no hay resultados
- Navegación directa a edición al hacer tap en transacción

### Características Adicionales
- **Transaction notes**: Campo opcional de notas
- **Draft support**: Preservación de datos del formulario
- **Transaction status**: Sistema de estados con badges
- **Search & filters**: Búsqueda y filtros en tiempo real
- **Daily budget banner**: Banner de presupuesto diario disponible
- **Transaction detail**: Vista de detalle completa
- **Delete confirmation**: Modal de confirmación al eliminar

---

## 🤖 Registro de Movimientos con IA (AI Batch Entry)

### Descripción General
**Killer Feature** que permite ingresar múltiples transacciones simultáneamente usando inteligencia artificial. Los usuarios pueden registrar gastos e ingresos de forma natural mediante voz, texto libre o fotos de recibos, y la IA automáticamente extrae y estructura las transacciones.

### Modos de Entrada

#### 1. 📝 Entrada por Texto
- **Input libre en lenguaje natural** sin formato estructurado
- Múltiples transacciones en una sola oración
- Interpretación inteligente de montos colombianos:
  - "50 mil" → $50.000
  - "2 palos" → $2.000.000
  - "una luca" → $1.000
- Soporte para fechas relativas ("ayer", "el lunes", "la semana pasada")
- Textarea con placeholder contextual
- Hook `useKeyboardDismiss` para cerrar teclado al hacer scroll

**Ejemplo:** "Gasté 50 mil en almuerzo en el D1, 30 mil en Uber y recibí 2 millones de salario"

#### 2. 🎤 Entrada por Voz
- **Grabación de audio** con visualización de forma de onda en tiempo real
- Transcripción automática con GPT-4o Mini Transcribe ($0.003/min)
- Precisión optimizada para español colombiano
- Soporte para acentos regionales (paisa, costeño, rolo, etc.)
- Timer de duración (formato MM:SS)
- Límite de 120 segundos por grabación
- Controles: Iniciar, Detener, Cancelar
- Plugin: `@capacitor-community/voice-recorder`
- Fallback a Whisper API si GPT-4o Mini falla

**Componente:** `VoiceRecorder` con `AudioWaveform` para visualización

#### 3. 📷 Entrada por Imagen (OCR de Recibos)
- **Escaneo de recibos** con OCR inteligente
- Captura desde cámara o selección de galería
- Compresión automática de imágenes (max 500KB, max 1280px)
- Procesamiento con Gemini 2.5 Flash Vision ($0.15/1M tokens input)
- Reconocimiento de:
  - Nombre del comercio
  - Items y cantidades
  - Montos totales
  - Fecha del recibo
  - Categoría del gasto
- Preview de imagen antes de procesar
- Opción de recaptura si la imagen no es clara
- Plugin: `@capacitor/camera`

**Recibos soportados:** Éxito, Carulla, Jumbo, D1, Ara, Oxxo, Rappi, restaurantes, facturas de servicios

### TransactionPreview (Vista de Confirmación)

Después de procesar el input, el usuario revisa y edita las transacciones extraídas:

- **Lista de TransactionDraftCard**: Cada transacción en un card individual
- **Edición inline** de todos los campos:
  - Tap en nombre → Editar descripción
  - Tap en categoría → Abrir `CategoryPickerDrawer`
  - Tap en monto → Editar monto con teclado numérico
  - Tap en fecha → Abrir `DatePicker`
- **Indicadores visuales**:
  - Badge "Revisar" para transacciones con baja confianza
  - Indicador de tipo (ingreso/gasto) con colores
  - Validación en tiempo real de campos requeridos
- **Resumen de totales**: Suma de ingresos y gastos
- **Acciones**:
  - Eliminar transacción individual del lote
  - Guardar todas las transacciones
  - Cancelar y descartar

### Rate Limiting y Control de Uso

- **Free Tier**: 5 requests/día por usuario
- **Pro Tier**: 100 requests/día por usuario
- **Rewarded Video**: Free users pueden ver un anuncio rewarded para ganar +1 uso adicional al alcanzar el límite
- **Rate limit check** antes de procesar
- **Modal de upsell** al alcanzar el límite (muestra PaywallModal o opción de rewarded ad)
- **Upstash Redis** para tracking de uso
- Headers de rate limit en respuesta:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

### Sistema de IA (Backend)

#### Edge Function: `parse-batch`
- **Supabase Edge Function** serverless en Deno
- **Autenticación obligatoria**: JWT de Supabase
- **Rate limiting** con Upstash Redis
- **Timeout**: 60 segundos máximo
- **Logging estructurado** para debugging

#### Pipeline de Procesamiento

1. **Transcripción de Audio** (si aplica):
   - Primario: GPT-4o Mini Transcribe API ($0.003/min)
   - Fallback: Whisper API ($0.006/min)
   - Conversión de base64 a formato compatible

2. **Extracción de Transacciones**:
   - Primario: Gemini 2.5 Flash ($0.15/1M input, $0.60/1M output)
   - Fallback: GPT-4o-mini si Gemini falla
   - System Prompt con:
     - Contexto de Colombia/COP
     - Lista completa de categorías de SmartSpend
     - Reglas de interpretación de montos y fechas
     - JSON Schema para output estructurado
   - Extracción de múltiples transacciones en un solo request

3. **Validación y Respuesta**:
   - Validación de JSON response contra schema
   - Asignación de nivel de confianza (0-1) por transacción
   - Marca de `needsReview` para transacciones ambiguas
   - Return de array de `TransactionDraft`

### Tipos TypeScript

```typescript
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
```

### Componentes Principales

- **BatchEntrySheet**: Bottom sheet full-height (z-[70])
  - Selector de tipo de input (tabs)
  - Input area según tipo seleccionado
  - Loading state con fake progress animation
  - TransactionPreview al completar procesamiento
  - Integrado desde `AddActionSheet` → botón "Agregar varias"

- **TextInputArea**: Textarea multilinea con auto-resize
- **VoiceRecorder**: Grabación con waveform en tiempo real
- **ImageCaptureView**: Camera/gallery selector con preview
- **TransactionPreview**: Lista editable de drafts con totales
- **TransactionDraftCard**: Card con edición inline de todos los campos

### Testing

**42 tests unitarios completos:**

1. **batchEntry.service.test.ts** (15 tests)
   - API calls y respuestas
   - Autenticación y JWT
   - Rate limiting
   - Manejo de errores (network, timeout, invalid response)

2. **useFakeProgress.test.ts** (10 tests)
   - Animaciones de progreso simulado
   - Timing y velocidad de incrementos
   - Cleanup al desmontar

3. **TransactionPreview.test.tsx** (17 tests)
   - Renderizado de drafts
   - Edición inline de campos
   - Eliminación de transacciones
   - Guardado de lote completo
   - Validación de campos requeridos

### Internacionalización

**Totalmente traducido a 4 idiomas:**
- Español (es): `i18n/locales/es/batch.json`
- Inglés (en): `i18n/locales/en/batch.json`
- Francés (fr): `i18n/locales/fr/batch.json`
- Portugués (pt): `i18n/locales/pt/batch.json`

**Strings incluyen:**
- Títulos y descripciones de modos de entrada
- Placeholders contextuales
- Mensajes de error específicos
- Tooltips y ayuda contextual
- Modal de rate limit y upsell

### Permisos Nativos Requeridos

**iOS** (`Info.plist`):
- `NSCameraUsageDescription`: Para escanear recibos
- `NSPhotoLibraryUsageDescription`: Para seleccionar fotos
- `NSMicrophoneUsageDescription`: Para dictar transacciones

**Android** (`AndroidManifest.xml`):
- `android.permission.CAMERA`
- `android.permission.RECORD_AUDIO`
- `android.permission.READ_EXTERNAL_STORAGE`

### Costos Proyectados

**Escenario: 1,000 usuarios × 5 batch entries/mes**

| Servicio | Uso | Costo/mes |
|----------|-----|-----------|
| Gemini 2.5 Flash (imágenes) | 5,000 imgs | $0.20 |
| Gemini 2.5 Flash (output) | ~200K tokens | $0.12 |
| GPT-4o Mini Transcribe | 5,000 min audio | $15.00 |
| Upstash Redis | ~25K requests | $0.00 (free) |
| **TOTAL** | | **~$15.32/mes** |

**Escalabilidad:**
- 10,000 usuarios: ~$150/mes
- Rate limiting mantiene costos predecibles
- Pro tier amortiza costo con suscripciones

### Seguridad

- **API Keys nunca expuestas**: Edge Function obligatoria
- **Autenticación JWT**: Solo usuarios autenticados
- **Rate limiting por usuario**: Previene abuso
- **Compresión de imágenes**: Previene payloads gigantes (max 500KB)
- **Timeout de 60s**: Previene requests eternos
- **Logging sin PII**: No se guardan imágenes ni audios

### Monitoreo y Métricas

- **Requests por día/semana** por usuario
- **Tipo de input más usado** (texto/voz/imagen)
- **Tasa de éxito/error** del procesamiento
- **Tiempo promedio de respuesta** por tipo
- **Precisión de categorización** (feedback de usuarios)
- **Costos reales vs proyectados** (alertas automáticas)

### Referencias

- [ADR-001: AI Batch Entry](ADR-001-AI-BATCH-ENTRY.md) - Decisiones arquitectónicas
- [PLAN: AI Batch Entry](PLAN-AI-BATCH-ENTRY.md) - Plan de implementación detallado
- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [OpenAI Transcription Pricing](https://platform.openai.com/docs/pricing)

---

## 🏷️ Sistema de Categorías

### Gestión de Categorías
- **140+ iconos** disponibles con búsqueda bilingüe (español/inglés)
- **Categorías predefinidas** traducidas según idioma seleccionado
- **21 categorías por defecto**: 13 gastos + 8 ingresos
- **Creación de categorías personalizadas** con nombre, icono y color
- **Icon Picker mejorado** con búsqueda en tiempo real
- Sección especial de iconos de mascotas (perro, gato, pez, conejo, pájaro, etc.)
- Empty state cuando no hay resultados en búsqueda
- Separación por tipo (gasto/ingreso)
- Colores personalizables con picker de color

### Categorías Traducidas
- Nombres en español, inglés, francés y portugués
- Helper `getCategoryDisplayName()` para mostrar traducción
- Mapeo de nombres españoles a claves de traducción
- Categorías personalizadas mantienen nombre original

### Grupos de Categorías
- **Agrupación de categorías relacionadas**
- Creación de grupos personalizados
- Iconos y colores por grupo
- Presupuestos mensuales por grupo
- Visualización de progreso vs presupuesto
- Reasignación de categorías entre grupos
- Eliminación con reasignación automática

### Icon & Color Picker
- **Modal unificado** con tabs (Iconos/Colores)
- Búsqueda de iconos con keywords bilingües
- 140+ iconos únicos sin duplicados
- Paleta de colores predefinida
- Preview en tiempo real
- Soporte i18n completo

---

## 💰 Sistema de Presupuestos (Plan)

### Dos Tipos de Planes
1. **Límites de Gasto** (Spending Limits)
   - Define un tope máximo de gasto para una categoría
   - Control de gastos variables (mercado, restaurantes, entretenimiento)
   - Alertas cuando te acercas o excedes el límite
   - Cálculo de monto restante disponible

2. **Metas de Ahorro** (Savings Goals)
   - Establece objetivos de ahorro por categoría
   - Seguimiento de progreso hacia la meta
   - Indicadores de cuánto falta para cumplir el objetivo
   - Categorías como inversiones, fondo de emergencia, proyectos

### Características del Sistema
- **Períodos flexibles**: Semanal, Mensual, Trimestral, Anual, Personalizado
- **Presupuestos recurrentes** que se renuevan automáticamente al finalizar
- **Tracking en tiempo real** con indicadores visuales de color:
  - Verde/Teal: Buen estado (< 75%)
  - Amarillo: Cerca del límite (75-100%)
  - Rojo: Límite excedido (> 100%)
- **Múltiples presupuestos** por categoría con diferentes períodos
- **Auto-renovación** de presupuestos expirados al cargar la app

### Tabs de Historial
- **Tab "Activos"**: Planes en curso
  - Health Check banners (límites excedidos, progreso de metas)
  - Alertas automáticas de estado
  - Filtrado solo en tab activo
- **Tab "Completados"**: Planes finalizados
  - Resumen de resultados:
    - ✓ Límite Respetado: Muestra cuánto ahorraste
    - ⚠ Límite Excedido: Muestra cuánto te pasaste
    - 🎉 Meta Cumplida: Muestra si superaste la meta
    - Meta No Alcanzada: Muestra % logrado y faltante
  - Historial completo de períodos finalizados
  - Análisis de desempeño

### Métricas Inteligentes
- **Sugerencia Diaria**: Cuánto gastar/ahorrar por día para cumplir objetivo
- **Días Restantes**: Cuenta regresiva del período
- **Promedio Diario** (budgets completados): Análisis del gasto/ahorro diario
- **Duración** (budgets completados): Total de días del período

### Budget Detail Page
- **Vista completa** del presupuesto individual
- **Progreso visual** con barra de estado y porcentaje
- **Métricas contextuales** según estado (activo/completado)
- **Movimientos completos**: Lista de TODAS las transacciones del período (sin límite), con contador total
- **Edición bloqueada** para presupuestos completados
- **Eliminación con confirmación** y advertencia especial para completados

### Budget Onboarding
- **Wizard de 4 pantallas** completamente rediseñado:
  1. Bienvenida: Intro a Planes (límites, metas, seguimiento)
  2. Tipos de Planes: Ejemplos visuales de límites vs metas
  3. Historial: Tabs y resúmenes de resultados
  4. Alertas: Health check, métricas y recomendaciones
- **Carousel interactivo** con Embla Carousel
- **Progress dots** animados con navegación
- **Traducido a 4 idiomas** (es, en, fr, pt)
- Se muestra solo una vez (flag en cloud sync)

### Health Check System
- **Banner de límites excedidos**: Muestra cuántos límites superaste
- **Banner de progreso de metas**: Porcentaje de metas completadas
- **Cálculo automático** de estado general
- **Visibilidad condicional**: Solo en tab "Activos"

### Cloud Sync & Persistencia
- **Sincronización completa** de presupuestos
- **Auto-renovación** sincronizada con cloud data
- **Migración de esquema** v6 → v7 con campo budgets
- **Persistencia de preferencias** (onboarding visto)
- Dark mode support en todo el módulo

---

## 📊 Estadísticas y Análisis

### Quick View Cards (4 Cards Interactivos)
1. **Daily Average** (Promedio Diario)
   - Cálculo: Total Gastado ÷ Días Transcurridos
   - Modal con breakdown detallado
   - Proyección del mes basada en tasa actual
   - Icono DollarSign en círculo teal

2. **Top Category** (Categoría con Mayor Gasto)
   - Modal con todas las transacciones de esa categoría
   - Lista scrollable con mismo UX que Top Day
   - Navegación a detalle de transacción
   - Icono de categoría con su color

3. **Top Day** (Día con Más Gastos)
   - Modal con todas las transacciones de ese día de la semana
   - Altura 80vh scrollable
   - Click en transacciones navega a detalle
   - Icono Calendar en círculo púrpura

4. **Month Comparison** (Comparación Mensual)
   - Comparación justa día a día (no meses completos)
   - Modal explicativo del cálculo
   - Iconos CheckCircle/AlertCircle
   - Verde = gastando menos, Rojo = gastando más

### Sistema de Filtrado Unificado
- **Botón "Personalizar"** con diseño teal y badge
- **Excluir categorías** de TODAS las cards (gastos fijos, etc.)
- Filtro afecta: Daily Average, Top Category, Top Day, Month Comparison
- Persistencia en cloud sync
- Badge muestra cantidad de categorías excluidas
- Label "Vista Rápida" para mejor UX
- Soporte i18n completo (es, en, fr, pt)

### Gráficos y Visualizaciones (Recharts)
- **Gráfico de Dona**: Distribución de gastos por categoría
- **Gráfico de Barras**: Comparativa ingresos vs gastos (últimos 6 meses)
- **Gráfico de Línea**: Tendencia de gastos (últimos 12 meses)
- Etiquetas de meses en locale del usuario
- Empty states cuando no hay datos
- Animaciones desactivadas para mejor UX en iOS
- Dark mode support en todos los gráficos

### Características Adicionales
- **Daily average calculation**: Fix de cálculo (días transcurridos vs total)
- **Timezone handling**: Fix de bug de timezone en día de semana
- **Category month detail**: Vista drill-down por categoría/mes
- **Transaction count**: Conteo con pluralización correcta
- **Stats cloud sync**: Sincronización de preferencias de filtrado

---

## 🔍 Historial y Filtros Avanzados

### Página de Historial
- **Búsqueda avanzada** por descripción de transacción
- **Sistema de filtros** con chips interactivos y expansibles
- **Persistencia de filtros** en localStorage (restaura al volver)
- **Reset automático** al entrar desde home (botón directo)
- **Balance calculado** de transacciones filtradas en header
- **Exportación a CSV** con filtros aplicados (feature PRO)

### Filtros Disponibles
1. **Rango de Fechas**
   - Este Mes
   - Mes Pasado
   - Personalizado (con DatePicker para inicio/fin)

2. **Tipo de Transacción**
   - Todos
   - Ingresos
   - Gastos

3. **Estado** (PRO)
   - Todos
   - Pagado
   - Pendiente
   - Planeado

4. **Categoría** (PRO)
   - Selección múltiple con modal scrollable
   - Preview de categorías seleccionadas en chip
   - Búsqueda y filtrado de categorías

5. **Rango de Monto** (PRO)
   - Mínimo y máximo configurables
   - Input numérico con validación

6. **Recurrentes** (PRO)
   - Todos
   - Solo recurrentes (templates + generadas)
   - No recurrentes
   - Detecta transacciones con `schedule.enabled` o `sourceTemplateId`

### Características de UX
- **Filtros expandibles** con animación
- **Visual feedback** con color teal (#18B7B0) en filtros activos
- **Chips informativos** muestran el valor actual del filtro
- **Contador de resultados** en tiempo real
- **Modals draggable** para categorías con gesture support
- **Dark mode** completo en todos los filtros
- **i18n** en 4 idiomas (es, en, fr, pt)

### Acceso a Filtros
- **Todos los filtros desbloqueados** para usuarios free y Pro
- Filtros disponibles: Fecha, Tipo, Estado, Categoría, Monto, Recurrentes
- Sin lock icons ni paywalls en filtros (modelo free-with-ads)

---

## 🔐 Autenticación y Cuenta

### Métodos de Autenticación
- **Google OAuth** (Sign in with Google)
- **Apple Sign In** (Sign in with Apple)
- **Anonymous Auth** (Supabase `signInAnonymously()` - cloud sync desde el primer momento)

### Anonymous Auth (Cloud Sync para todos)

Todos los usuarios nuevos reciben automáticamente una sesión anónima de Supabase con cloud sync activo. No se requiere crear cuenta para sincronizar datos con la nube.

- **Sesión anónima automática**: Al abrir la app por primera vez, `CloudSyncGate` llama `signInAnonymously()` → sesión con JWT válido y `auth.uid()` funcional
- **Cloud sync inmediato**: `cloudMode = "cloud"` para TODOS los usuarios (anónimos y autenticados)
- **RLS compatible**: Las políticas RLS de todas las tablas (`user_state`, `push_tokens`, `user_subscriptions`) usan `auth.uid() = user_id` → funcionan con sesiones anónimas sin cambios
- **Distinción UI**: Para diferenciar invitado vs autenticado en la interfaz, usar `!!user.email` (los anónimos no tienen email)
- **Fallback guest**: `cloudMode = "guest"` solo ocurre si `signInAnonymously()` falla (Supabase caído, offline en primer arranque)

### Transición Anónimo → OAuth (Flujo de Login)

Cuando un usuario anónimo decide crear cuenta (Google/Apple OAuth), ocurre una transición de sesión:

**Archivos clave**:
- `src/features/onboarding/phases/LoginFlow/LoginScreen.tsx`
- `src/features/onboarding/phases/LoginFlow/LoginProScreen.tsx`
- `src/shared/components/providers/CloudSyncGate.tsx`

**Flujo paso a paso**:

1. **Pre-OAuth** (LoginScreen/LoginProScreen `handleGoogleLogin`/`handleAppleLogin`):
   - Guarda `budget.previousAnonUserId` en localStorage (ID del usuario anónimo actual)
   - Guarda `budget.oauthTransition` con timestamp (protege datos durante la transición)

2. **Durante OAuth**:
   - `signInWithOAuth()` reemplaza la sesión anónima → emite SIGNED_OUT + SIGNED_IN
   - El flag `oauthTransition` previene que SIGNED_OUT borre los datos locales (ventana de 2 min)

3. **Post-OAuth** (CloudSyncGate SIGNED_IN handler):
   - Detecta usuario autenticado (`is_anonymous = false`)
   - Ejecuta `await initForSession()` → pull de cloud data del nuevo usuario
   - Si existe `budget.previousAnonUserId`, llama RPC `cleanup_orphaned_anonymous_user`
   - Limpia los flags de localStorage

**IMPORTANTE**: Se usa `signInWithOAuth()` (NUNCA `linkIdentity()`) en las pantallas de login. `linkIdentity()` causaba errores `identity_already_exists` cuando el email ya existía en otra cuenta. `signInWithOAuth()` crea un nuevo `user_id`, lo cual requiere limpiar el usuario anónimo huérfano.

### Limpieza de Usuarios Anónimos Huérfanos

#### Limpieza inmediata (después de OAuth)
- **Función SQL**: `cleanup_orphaned_anonymous_user(anon_user_id UUID)` - `SECURITY DEFINER`
- **Por qué SECURITY DEFINER**: El nuevo usuario autenticado no puede borrar filas del usuario anónimo por RLS (`auth.uid() ≠ anon_user_id`)
- **Verificación de seguridad**: Solo borra si `is_anonymous = true` (no-op para usuarios reales)
- **Tablas limpiadas**: `user_state`, `push_tokens`, `auth.users`
- **Non-blocking**: Si el RPC falla, el login sigue funcionando normalmente
- **Migración**: `supabase/migrations/20260206_cleanup_orphaned_anonymous_user.sql`

#### Limpieza programada (usuarios que desinstalan la app)
- **Cron job**: `pg_cron` ejecuta cada domingo a las 4 AM UTC
- **Retención**: 60 días de inactividad (`COALESCE(last_sign_in_at, created_at)`)
- **Tablas limpiadas**: `user_state`, `push_tokens`, `auth.users`
- **Migración**: `supabase/migrations/20260206_cleanup_stale_anonymous_users_cron.sql`

### Testing de Transición Auth (13 tests)
Suite completa en `CloudSyncGate.test.tsx`:

| Caso | Descripción |
|------|-------------|
| Case 1 | Invitado con datos → Login nuevo Google → Hereda datos, limpia anónimo |
| Case 2 | Invitado con datos + Pro → Login nuevo Google → Migra RevenueCat |
| Case 3 | Invitado con datos → Login cuenta existente → No sobrescribe datos cloud |
| Case 4 | Instalación fresca → Login nuevo → Limpia anónimo de corta vida |
| Case 5 | Instalación fresca → Login cuenta existente → Carga datos cloud |
| E1 | OAuth cancelado → flags permanecen (inofensivos) |
| E2 | OAuth falla → flags limpiados en catch |
| E3 | Cleanup RPC falla → non-blocking, login continúa |
| E5 | SIGNED_OUT durante OAuth → no borra datos (flag protege) |
| E5b | Flag oauthTransition stale (>2min) → procede normalmente |
| E6 | Múltiples intentos OAuth → idempotente |
| E7 | Sin previousAnonUserId → no llama cleanup |
| E8 | SIGNED_IN anónimo → cloud sync, sin cleanup |

### In-App Browser OAuth (CRITICO - Apple Guideline 4.0)
- **Archivo**: `src/shared/utils/oauth.utils.ts` → `signInWithOAuthInAppBrowser()`
- **iOS**: Safari View Controller (usuario no sale de la app)
- **Android**: Chrome Custom Tabs (usuario no sale de la app)
- **Web**: `window.open()` en nueva pestaña
- **Flujo**: `signInWithOAuth({ skipBrowserRedirect: true })` → `Browser.open({ url })`
- **CRITICO**: `skipBrowserRedirect: true` es OBLIGATORIO. Sin este flag, Supabase abre el browser externo automáticamente.

### Biometric Authentication
- **Face ID / Touch ID / Fingerprint** para usuarios autenticados
- **Plugin**: `@capgo/capacitor-native-biometric` (v8.3.2) compatible con Capacitor 8
- **Toggle de configuración** en ProfilePage (Datos y Seguridad)
- **Prompt nativo del OS** (no modal custom) con fallback automático a código del dispositivo
- **Lock screen overlay**: Bloquea la app si el usuario cancela la autenticación
- **Triggers de autenticación**:
  - Cold start (al abrir la app)
  - App resume después de 5 minutos de inactividad
- **Solo usuarios logueados** en plataformas nativas (iOS/Android)
- **Schema migration v6→v7**: Campo `security` en BudgetState
- **Cloud sync**: Configuración se sincroniza entre dispositivos
- **i18n completo**: Traducido a español, inglés, francés y portugués
- **iOS Face ID usage description** configurado en Info.plist
- **Timestamp tracking**: Previene autenticación redundante al habilitar

### Onboarding System
- **Welcome Flow**: 6 pantallas de introducción visual
- **LoginScreen**: Todos los usuarios obtienen sesión anónima con cloud sync
- **First Config Flow**: 6 pantallas de configuración inicial
  1. Selección de idioma (es/en/pt/fr)
  2. Selección de tema (light/dark/system)
  3. Selección de moneda (50+ opciones con búsqueda)
  4. Selección de categorías predeterminadas
  5. **Push notification opt-in** (solo usuarios nativos + autenticados)
  6. Confirmación y comienzo
- **OnboardingContext**: Gestión de estado con persistencia
- **OnboardingGate**: Determinación automática de punto de entrada
- **Progreso guardado**: Retoma donde el usuario dejó
- **Multi-user fix**: LoginScreen verifica cloud data SIEMPRE para detectar usuarios nuevos vs returning
- **Cloud data detection**: Previene que usuarios nuevos salten FirstConfig en dispositivos compartidos
- Migración automática desde sistema legacy

### Guest Mode (Fallback)
- **Solo ocurre** si `signInAnonymously()` falla (Supabase caído, sin conexión en primer uso)
- **Modo Local-First**: Datos solo en localStorage, sin cloud sync
- **Banner "Conectar cuenta"** en ProfilePage
- Reintento de `signInAnonymously()` en el siguiente arranque

---

## 🔔 Push Notifications

### Plataformas Soportadas
- **iOS**: APNs (Apple Push Notification service) con Firebase Cloud Messaging
- **Android**: FCM (Firebase Cloud Messaging)
- **Web**: No soportado (auto-skip en onboarding)

### Sistema de Notificaciones
- **Firebase Cloud Messaging**: Backend de notificaciones multiplataforma
- **Supabase Edge Functions**: Envío de notificaciones desde el backend
- **Push Tokens Table**: Gestión de tokens FCM por usuario en Supabase
- **Token Rotation**: Refresh automático de tokens con deactivación de tokens obsoletos
- **Preference Persistence**: Preferencias sincronizadas en la nube

### Tipos de Notificaciones
1. **Scheduled Transactions** (Transacciones Programadas)
   - Notifica sobre transacciones recurrentes próximas a vencer
   - Detecta tanto transacciones reales pendientes como virtuales de templates
   - Envío diario a las 9 AM (horario configurable)

2. **Daily Reminder** (Recordatorio Diario)
   - Recordatorio para registrar gastos del día
   - Horario configurable (default: 9 PM local)
   - Conversión automática de timezone local ↔ UTC

3. **Daily Summary** (Resumen Diario)
   - Resumen de transacciones del día
   - Horario configurable (default: 9 PM local)
   - Conversión automática de timezone local ↔ UTC

4. **Quiet Hours** (Horario Silencioso)
   - Pausa notificaciones durante horario de descanso
   - Configurable (default: 11 PM - 6 AM local)
   - Respeta timezone del usuario

### Onboarding de Notificaciones
- **Pantalla dedicada** en FirstConfig (Step 5 de 6)
- **Auto-skip para**:
  - Usuarios en web (plataforma no soportada)
  - Usuarios en modo guest (no autenticados)
- **Opt-in contextual**: Explicación de beneficios con 3 cards visuales
- **Configuración optimizada por defecto**:
  - Scheduled transactions: enabled
  - Daily reminder: 9 PM local
  - Daily summary: 9 PM local
  - Quiet hours: 11 PM - 6 AM local
- **Traducido a 4 idiomas** (es, en, pt, fr)

### Configuración de Notificaciones
- **Página dedicada**: Profile → Notifications
- **Toggles individuales** por tipo de notificación
- **Time pickers** para horarios personalizados
- **Quiet hours configurables** con horario de inicio y fin
- **Vista local con conversión UTC** transparente
- **Persistencia en la nube**: Preferencias sincronizadas entre dispositivos

### Características Técnicas
- **APNs Environment**: Production para TestFlight/App Store
- **Token Management**: 1 token activo por usuario, deactivación automática de obsoletos
- **Error Handling**: Gestión de errores de FCM, APNs, y permisos denegados
- **Timezone Utilities**: `shared/utils/timezone.ts` para conversión local ↔ UTC
- **Edge Functions**: `send-upcoming-transactions`, `send-daily-reminder`, `send-daily-summary`
- **Logging Completo**: Debug de token registration, refresh, y envío de notificaciones

---

## 💰 Monetización y Suscripciones

### Modelo Freemium (Free-with-Ads)

**Filosofía**: Todas las features están desbloqueadas para todos los usuarios. Pro = experiencia sin anuncios + AI ilimitado.

- **Free Tier**:
  - Todas las features desbloqueadas (stats, filtros, exportar CSV, categorías ilimitadas, etc.)
  - Banner ads en páginas sin bottom bar
  - Interstitial ads entre acciones (crear/editar transacciones)
  - 5 usos de AI batch entry por día (+ rewarded video para +1 extra)
- **Pro Tier**:
  - Sin anuncios (banner, interstitial, rewarded)
  - 100 usos de AI batch entry por día
  - Soporte prioritario

### RevenueCat Integration
- **Gestión de suscripciones Pro** con RevenueCat SDK
- **Planes disponibles**:
  - Pro Monthly: $4.99/mes con 7 días free trial
  - Pro Yearly: $34.99/año con 7 días free trial
  - Pro Lifetime: $89.99 pago único
- **Subscription status**: Sincronización automática del estado Pro
- **Cross-platform**: Suscripciones compartidas entre iOS y Android
- **RevenueCatProvider**: Context API para gestión de suscripción
- **useSubscription hook**: Hook personalizado con:
  - `isPro`: Estado de suscripción actual (true para active, trialing, lifetime)
  - `isTrialing`: Indica si está en período de prueba
- **PaywallModal**: Modal de suscripción con:
  - Beneficios: sin anuncios, AI ilimitado
  - Selector de plan (mensual/anual/lifetime)
  - Links a Terms of Service y Privacy Policy
  - Disclaimer de auto-renovación (requerido por Apple Guideline 3.1.2)
  - Botón "Restaurar compras"

### Sistema de Anuncios (AdMob)

**3 formatos de anuncios, todos solo para usuarios Free:**

#### 1. Banner Ads
- **Ubicación**: Todas las páginas con `PageHeader` (sin bottom bar)
- **Posición**: `BOTTOM_CENTER` con adaptive banner size
- **Gestión centralizada** en `AppFrame` (App.tsx) usando `isFormRoute`
- **Smart show/hide**:
  - Se oculta en páginas con botón fijo de guardado (`/add`, `/edit/*`, `/category/new`, etc.)
  - Se oculta durante bottom sheets (ej: category filter en History)
  - Se oculta para usuarios Pro
  - Se oculta en onboarding
  - No se muestra en web
- **Deduplicación**: Flag `isBannerVisible` previene banners duplicados
- **Padding**: Todas las páginas con banner tienen `pb-20` para evitar overlap de contenido
- **Páginas excluidas** (`isNoBannerRoute`): `/add`, `/edit/*`, `/category/new`, `/category/*/edit`, `/category-group/new`, `/category-group/*/edit`, `/trips/*/new|edit|expense/*`, `/onboarding`

#### 2. Interstitial Ads
- **Trigger**: Después de crear o editar transacciones
- **Control de frecuencia**:
  - Máximo 1 cada 3 minutos
  - Máximo 5 por sesión
  - Delay inicial de 2 minutos después de abrir la app
  - Sistema basado en acciones (muestra ad cada 3 acciones)
- **Session management** con persistencia en localStorage
- **Preload strategy**: Carga del siguiente ad en background

#### 3. Rewarded Video Ads
- **Propósito**: Permitir a usuarios free ganar +1 uso de AI batch entry
- **Flujo**: Al alcanzar límite de 5/día → opción de ver rewarded ad → +1 uso temporal
- **Integración**: En `BatchEntrySheet` con prompt contextual

### Configuración de AdMob

- **`USE_TEST_ADS` flag**: Toggle único en `ads.service.ts` para alternar entre test y producción
- **Test Ad IDs** (Google official):
  - iOS Banner: `ca-app-pub-3940256099942544/2934735716`
  - iOS Interstitial: `ca-app-pub-3940256099942544/4411468910`
  - iOS Rewarded: `ca-app-pub-3940256099942544/1712485313`
  - Android Banner: `ca-app-pub-3940256099942544/6300978111`
  - Android Interstitial: `ca-app-pub-3940256099942544/1033173712`
  - Android Rewarded: `ca-app-pub-3940256099942544/5224354917`
- **Production Ad Unit IDs** configurados para ambas plataformas en `AD_CONFIG`
- **ATT (App Tracking Transparency)**: Diálogo de permisos antes de inicializar AdMob
- **AdMobProvider**: Inicialización automática del SDK en app startup con ATT
- **Platform detection**: Auto-detección de iOS/Android, no muestra ads en web

### Archivos Clave de Ads
- `src/services/ads.service.ts` - Lógica central: show/hide/remove para banner, interstitial, rewarded
- `src/types/ads.types.ts` - Tipos: `AdConfig` con `bannerAdUnitId`, `interstitialAdUnitId`, `rewardedAdUnitId`
- `src/shared/components/providers/AdMobProvider.tsx` - Inicialización SDK + ATT
- `src/App.tsx` (AppFrame) - Banner show/hide centralizado por ruta

---

## 💾 Backup y Sincronización

### Tres Métodos de Backup
1. **Manual** - Sin backups automáticos
2. **Local** - Backups automáticos cada 7 días en localStorage
3. **Cloud** - Backups automáticos en Supabase

### Backup Local
- **Auto-backups cada 7 días** (solo usuarios logueados)
- **Namespacing por userId** (previene data leaks)
- Guest users **no tienen acceso** a backups locales
- Scheduler solo corre en cloudMode === "cloud"
- Formato: `budget.autoBackup.{userId}.{timestamp}`

### Cloud Sync (Supabase)
- **Autenticación con Supabase Auth**
- **Sincronización automática** con la nube
- **Offline-first**: Cambios pendientes se sincronizan al reconectar
- **Cloud status indicator**: Verde (synced), Teal (syncing), Gris (offline/guest)
- **Protección anti-pérdida de datos** (crítico):
  - Block push si snapshot está vacío (previene borrado accidental)
  - Verificación robusta de datos locales antes de push
  - Detección de snapshots vacíos vs snapshots con datos
  - Validación de transacciones, categorías, viajes y presupuestos
  - Sync lock para prevenir race conditions
  - Logging comprehensivo de operaciones críticas
  - 20 tests dedicados a prevención de pérdida de datos
- **Offline UX mejorado**:
  - Manejo inteligente de sesión expirada vs offline
  - No muestra "Sesión Expirada" cuando usuario está offline
  - Preserva datos de usuario en modo offline
  - Indicadores visuales claros (dot de estado en avatar)
  - Badge dinámico de sync status
  - 12 tests dedicados a UX offline
- **Subscriptions**: Auth state, pendingSync, excludedFromStats, budgets, notifications
- **Sincronización de**: transacciones, categorías, grupos, viajes, presupuestos, preferencias, configuración de notificaciones

### Export/Import
- **Exportación manual** a JSON
- **Exportación CSV** para análisis externo
- **Restauración desde archivo** JSON
- **Backup validation**: Checksum SHA-256
- **Modos de restauración**: Replace (reemplazar todo) o Merge
- Metadata completa: device info, stats, version

### Backup Service Features
- **createBackup**: Generación de metadata, cálculo de stats, checksum
- **validateBackup**: Validación de estructura, versión, integridad
- **restoreBackup**: Restauración con verificación
- **saveLocalBackup/getLocalBackups**: Namespacing por usuario
- Tests completos (41 tests)

---

## 🎨 Interfaz y Experiencia (UX/UI)

### PWA Features
- **Instalable** en dispositivos móviles
- **Funcionamiento offline** completo
- **Actualización automática** vía Workbox
- **Splash screen** con logo de la app (1.2s mínimo)
- **App icons**: 15 tamaños PNG + maskable para Android
- **Favicon**: SVG moderno + Safari pinned tab

### Design System
- **Mobile-first**: Optimizado para touch interactions
- **Color palette**:
  - Primary: `#18B7B0` (teal)
  - Income: `emerald-500/600`
  - Expense: `gray-900`
  - Success: `emerald-500`
  - Destructive: `red-500`
  - Backgrounds: `bg-gray-50` (pages), `bg-white` (cards)
- **Typography**: Sistema completo con tamaños semánticos
- **Spacing**: Safe area insets para iOS notch
- **Shadows**: Especificaciones exactas por tipo de componente
- **Border radius**: xl, 2xl, t-3xl, full según componente
- **Z-index layers**: Sistema de 9 capas (z-10 a z-[85])

### Navigation
- **BottomBar**: Home, Budget, Stats, Settings (z-50)
- **TopHeader**: Logo + nombre + selector de mes + avatar con sync status
- **PageHeader**: Componente reutilizable para páginas de detalle
- **FAB**: Floating Action Button (teal, z-40)

### HomePage Redesign
- **TopHeader**: Logo teal + selector de mes + avatar con dot de sync
- **BalanceCard**: Gradiente teal con elementos decorativos blur
- **Daily Budget Banner**: Fondo teal-50 con icono Calculator
- **Search & Filters**: Dropdown menu con SlidersHorizontal icon
- **FAB**: Color teal (#18B7B0)

### ProfilePage Redesign
- **User Account Card**: Avatar + nombre + email + badge de sync
- **3 secciones claras**:
  1. Cuenta (Idioma, Tema, Moneda)
  2. Datos (Categorías, Programadas, Exportar)
  3. Sistema (Backup, Cerrar sesión)
- **Full-screen settings pages** para cada configuración
- Avatar con dot de estado verde (sincronizado)
- Badge dinámico: "CLOUD SYNC ACTIVO", "SINCRONIZANDO", "SIN CONEXIÓN", "MODO LOCAL"

### Modals & Dialogs
- **Confirmation modals**: Centrados en viewport (nunca bottom sheet)
- **Bottom sheets**: Para selección de acciones
- **DatePicker**: Modal calendario personalizado
- **CategoryPickerDrawer**: Con drag-to-dismiss y búsqueda
- **Body scroll locking**: Previene scroll de fondo
- **Keyboard support**: Escape para cerrar
- **Animations**: Fade + scale para entrada

### Components
- **ConfirmDialog**: Modal de confirmación reutilizable
- **DatePicker**: Calendario con año picker y locale español
- **TransactionList**: Lista con grouping y filtering
- **CategoryPickerDrawer**: Picker con drag y búsqueda
- **PageHeader**: Header estandarizado con back button
- **BottomBar**: Navegación inferior con indicadores
- **FAB**: Floating action button con safe area
- Tests completos para todos los componentes (141 tests)

---

## 🧪 Testing y Calidad

### Unit Tests
- **594 tests pasando** en 21 suites
- **Zustand Store**: 79 tests (98.65% statements, 84.48% branches)
- **Services**: 147 tests
  - pendingSync.service: 20 tests (data loss prevention - CRITICO)
  - recurringTransactions.service: 22 tests
  - cloudState.service: 19 tests
  - storage.service: 26 tests (migrations v1→v7)
  - backup.service: 41 tests
  - dates.service: 26 tests
- **Components**: 153 tests
  - ConfirmDialog: 23 tests
  - DatePicker: 44 tests
  - TransactionList: 30 tests
  - CategoryPickerDrawer: 44 tests
  - ProfilePage: 12 tests (offline UX)
- **CloudSyncGate**: 13 tests (anonymous auth → OAuth transition)
- **Critical Test Suites**:
  - 20 tests para prevención de pérdida de datos (pendingSync)
  - 13 tests para transición anonymous auth → OAuth (CloudSyncGate)
  - 12 tests para UX offline y manejo de sesión expirada (ProfilePage)

### E2E Tests (Playwright)
- **transaction-attributes.spec.ts**: Estados, notas, campos opcionales
- **list-filtering.spec.ts**: Agrupación, búsqueda, filtros, navegación
- **scheduled-transactions.spec.ts**: Flow completo de programadas
- **auth-state-consistency.spec.ts**: Prevención de race conditions

### Code Quality
- **Environment-aware logging**: Silent en producción
- **Logger utility**: Namespace-based con niveles (debug, info, warn, error)
- **DRY principle**: Utilities compartidos (string, currency, ui constants)
- **TypeScript strict**: Sin errores de compilación
- **ESLint**: Código limpio sin warnings

---

## ⚡ Performance y Optimización

### Bundle Size Optimization
- **Reducción del 31%** en bundle inicial
- **Antes**: 410.63 KB gzipped (1.45 MB minified)
- **Después**: 284.09 KB gzipped (1.00 MB minified)
- **Mejora**: -126.54 KB gzipped

### Code Splitting Strategy
- **Lazy loading** de páginas pesadas:
  - StatsPage (372 KB chunk con Recharts)
  - BackupPage
  - ProfilePage
  - Trip pages
  - Category pages
- **Suspense boundaries** con loading fallback
- **16 chunks** en lugar de 1 bundle monolítico
- **Build time**: 8.79s → 6.29s (28% faster)
- **Bundle Analyzer**: rollup-plugin-visualizer para monitoring

### Impact
- **Faster initial page load**
- **Better caching** strategy
- **Improved Time to Interactive (TTI)**
- **Reduced main thread blocking**

---

## 🗄️ Data Management

### Storage Service
- **localStorage** como storage principal
- **Schema versioning**: v1 → v8 con migrations automáticas
- **Data integrity**: Validación y deduplicación
- **Error handling**: Quota exceeded, corrupted state
- **Migration paths**:
  - v1→v2: String categories to objects
  - v2→v3: Category groups addition
  - v3→v4: isRecurring field
  - v4→v5: Scheduled transactions (sourceTemplateId)
  - v5→v6: Budget system
  - v6→v7: Biometric security settings
  - v7→v8: Subscription moved to RevenueCat (removed from BudgetState)

### Cloud State Service
- **Supabase integration** para cloud sync
- **getCloudState**: Fetch de estado desde Supabase
- **upsertCloudState**: Update/insert atómico
- **Full Supabase mocking** en tests
- **Error handling**: Auth errors, database failures

### Pending Sync Service
- **Queue de cambios pendientes** para offline-first
- **setPendingSnapshot**: Guardar cambios pendientes
- **getPendingSnapshot**: Recuperar cambios pendientes
- **clearPendingSnapshot**: Limpiar después de sync
- **hasPendingSnapshot**: Verificar si hay cambios pendientes

---

## 🔧 Tecnologías Utilizadas

### Core
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool y dev server
- **Zustand** - State management
- **React Router v7** - Routing

### UI & Styling
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - Icon library (140+ iconos)
- **Embla Carousel** - Carousel component

### Data Visualization
- **Recharts** - Charts library (Pie, Bar, Line)

### i18n
- **react-i18next** - Internationalization
- **i18next** - i18n framework
- **i18next-browser-languagedetector** - Auto-detect locale

### Backend & Auth
- **Supabase** - Backend as a Service
  - Auth (email, phone, OAuth)
  - Database (PostgreSQL)
  - Storage (backups)
  - Edge Functions (push notifications)
- **@supabase/supabase-js** - Supabase client

### Push Notifications
- **Firebase Cloud Messaging (FCM)** - Backend de notificaciones multiplataforma
- **@capacitor/firebase-messaging** - Plugin de Capacitor para FCM
- **APNs** - Apple Push Notification service (iOS)
- **Firebase Admin SDK** - Envío de notificaciones desde Edge Functions

### Monetization & Ads
- **RevenueCat** - Subscription management platform
- **@revenuecat/purchases-capacitor** - RevenueCat SDK para Capacitor
- **Google AdMob** - Ad monetization platform
- **@capacitor-community/admob** - AdMob SDK para Capacitor (v8.0.0)

### Testing
- **Vitest** - Unit testing
- **@testing-library/react** - React testing utilities
- **Playwright** - E2E testing

### Build & Deploy
- **Vite PWA Plugin** - PWA generation
- **Workbox** - Service worker y caching
- **Heroku** - Deployment platform
- **Express** - Production server

---

## 📱 Compatibilidad

### Browsers
- Chrome/Edge (Chromium)
- Safari (iOS/macOS)
- Firefox

### Devices
- Mobile (iOS/Android)
- Tablet
- Desktop

### PWA Support
- Instalable en todos los dispositivos
- Offline functionality
- Push notifications (iOS/Android nativo con FCM)

---

## 🚀 Roadmap (Futuro)

Ver [ROADMAP.md](ROADMAP.md) para features planeados:
- Budgets con períodos personalizados (Q1, Bimestral, Semestral)
- Shared budgets (presupuestos compartidos)
- Transaction templates (plantillas reutilizables)
- Tags/labels para transacciones
- Attachments (adjuntos en transacciones)
- Rich notifications con acciones (confirmar transacción desde notificación)

---

## 📄 Versión Actual

**Versión**: 0.16.10 (latest release)

Para historial completo de cambios, ver [CHANGELOG.md](../CHANGELOG.md)
