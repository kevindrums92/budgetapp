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
- **Actividad reciente**: Lista de transacciones relacionadas
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

## 🔐 Autenticación y Cuenta

### Métodos de Autenticación
- **Google OAuth** (Sign in with Google)
- **Apple Sign In** (Sign in with Apple)

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
- **LoginScreen**: Selección entre modo invitado o cloud sync
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

### Guest Mode
- **Modo Local-First**: Datos solo en localStorage
- **Banner "Conectar cuenta"** en ProfilePage
- Navegación a login para convertir guest a user
- Seamless transition a modo cloud
- Guest users completan onboarding sin autenticación
- Push notifications auto-skip para guest users (solo para usuarios autenticados)

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
- **Cloud status indicator**: Verde (sync), Teal (syncing), Gris (offline/guest)
- **Protección anti-pérdida de datos**:
  - Block push si snapshot está vacío
  - Verificación de datos locales antes de push
  - Sync lock para prevenir race conditions
  - Logging comprehensivo de operaciones críticas
- **Subscriptions**: Auth state, pendingSync, excludedFromStats, budgets
- Sincronización de: transacciones, categorías, grupos, viajes, presupuestos, preferencias

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
- **368 tests pasando** (2 skipped)
- **Zustand Store**: 79 tests (98.65% statements, 84.48% branches)
- **Services**: 127 tests
  - pendingSync.service: 14 tests
  - recurringTransactions.service: 22 tests
  - cloudState.service: 19 tests
  - storage.service: 26 tests (migrations v1→v4)
  - backup.service: 41 tests
  - dates.service: 26 tests
- **Components**: 141 tests
  - ConfirmDialog: 23 tests
  - DatePicker: 44 tests
  - TransactionList: 30 tests
  - CategoryPickerDrawer: 44 tests

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
- **Schema versioning**: v1 → v7 con migrations automáticas
- **Data integrity**: Validación y deduplicación
- **Error handling**: Quota exceeded, corrupted state
- **Migration paths**:
  - v1→v2: String categories to objects
  - v2→v3: Category groups addition
  - v3→v4: isRecurring field
  - v4→v5: Scheduled transactions (sourceTemplateId)
  - v5→v6: Budget system
  - v6→v7: Biometric security settings

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
- Advanced filtering (búsqueda avanzada)
- Tags/labels para transacciones
- Attachments (adjuntos en transacciones)
- Rich notifications con acciones (confirmar transacción desde notificación)

---

## 📄 Versión Actual

**Versión**: 0.13.0+ (develop branch)

Para historial completo de cambios, ver [CHANGELOG.md](../CHANGELOG.md)
