# SmartSpend — Roadmap Estrategico hacia Top 5 Global

> Documento de analisis competitivo, features propuestas y plan de priorizacion.
> Fecha: Febrero 2026 | Version: 0.16.1

---

## 1. Estado actual del producto

### Feature set completo (v0.16.1)

| Area | Features |
|------|----------|
| **Transacciones** | CRUD completo, income/expense, notas, estados (paid/pending/planned), historial virtualizado con @tanstack/react-virtual |
| **AI Batch Entry** | Entrada por texto natural, voz (Whisper transcription + waveform), imagen/OCR (Gemini 2.5 Flash Lite). Rate limit: 5/dia free, 50/dia Pro |
| **Presupuestos** | Dos tipos: limites de gasto y metas de ahorro. Periodos: semana, mes, trimestre, ano, custom. Auto-renovacion, health check |
| **Transacciones recurrentes** | Frecuencia: diaria/semanal/mensual/anual con intervalos custom. Dedup por periodo. Preview virtual antes de materializar |
| **Viajes** | Tracking de gastos por viaje con presupuesto, categorias especificas (transporte, alojamiento, comida, actividades, compras) |
| **Estadisticas** | Donut chart, bar chart (ingreso vs gasto 6 meses), line chart (tendencia 12 meses), pie charts por categoria. Sheets interactivos: filtros, comparacion, top dia, top categoria, promedio diario |
| **Categorias** | 100+ iconos lucide, colores custom, grupos de categorias, drill-down por mes |
| **Cloud Sync** | Offline-first con sync a Supabase. Debounced push (1.2s). Pending sync queue para offline. Anonymous + OAuth sessions |
| **Auth** | Google OAuth, Apple Sign-In, Email+OTP, Anonymous auto-session. Biometric (Face ID/Fingerprint) con timeout 5min |
| **Backup** | Export/import JSON manual, auto-backup local cada 7 dias, cloud backup via Supabase |
| **Notificaciones** | Firebase Cloud Messaging. Tipos: recordatorio diario, resumen diario, transacciones proximas, alertas de presupuesto |
| **Multi-idioma** | Espanol (es), Ingles (en), Frances (fr), Portugues (pt). 17+ namespaces de traduccion |
| **Multi-moneda** | 30+ monedas con formateo por locale. Hook `useCurrency()` con formatAmount y currencyInfo |
| **Dark Mode** | Light/Dark/System con CSS variables |
| **Onboarding** | 6 pantallas welcome + 5 pantallas config inicial. Spotlight tours por pagina |
| **Monetizacion** | RevenueCat: Monthly $4.99, Annual $34.99, Lifetime $89.99. Trial 7 dias. Precios regionales (COP, BRL, MXN, ARS, CLP, PEN) |
| **Plataformas** | PWA + iOS nativo + Android nativo (Capacitor) |

### Stack tecnico

```
Frontend:   React 19 + TypeScript + Vite
State:      Zustand (single store, auto-persist localStorage)
Backend:    Supabase (Auth, Database, Edge Functions, RLS)
Mobile:     Capacitor (iOS + Android)
AI:         Gemini 2.5 Flash Lite (parse-batch edge function)
Payments:   RevenueCat SDK
Push:       Firebase Cloud Messaging
Charts:     Recharts
Testing:    Vitest + React Testing Library + Playwright (E2E)
i18n:       react-i18next
PWA:        vite-plugin-pwa + Workbox
Deploy:     Heroku (web), App Store (iOS), Play Store (Android)
```

### Features Pro (gated)

| Feature | Free | Pro |
|---------|------|-----|
| Categorias custom | 10 max | Ilimitadas |
| Presupuestos activos | 2 max | Ilimitados |
| Transacciones recurrentes | 3 max | Ilimitadas |
| AI Batch Entry | 5/dia | 50/dia |
| Estadisticas avanzadas | Bloqueado | Completo |
| Filtros de historial | Bloqueado | Completo |
| Export CSV/JSON | Bloqueado | Completo |
| Backups ilimitados | Bloqueado | Completo |
| Sin anuncios | No | Si |

---

## 2. Analisis competitivo global (2026)

### Top 10 apps de presupuesto mundial

| # | App | Mejor para | Precio | Plataforma |
|---|-----|-----------|--------|-----------|
| 1 | **YNAB** | Zero-based budgeting metodologico | $14.99/mo o $109/yr | iOS, Android, Web |
| 2 | **Monarch Money** | All-in-one (budgets + inversiones + net worth) | $14.99/mo o $99.99/yr | iOS, Android, Web |
| 3 | **Copilot Money** | Mejor diseno/UX, ecosistema Apple | $13/mo o $95/yr | iOS, Mac, Web |
| 4 | **Rocket Money** | Tracking de suscripciones + negociacion de bills | $7-14/mo (escala movil) | iOS, Android, Web |
| 5 | **PocketGuard** | Snapshot rapido "cuanto puedo gastar" | $12.99/mo o $74.99/yr | iOS, Android, Web |
| 6 | **Goodbudget** | Envelope budgeting, parejas/familias | $10/mo o $80/yr | iOS, Android, Web |
| 7 | **Empower** | Net worth + inversiones gratis | Gratis | iOS, Android, Web |
| 8 | **Spendee** | Visual simple, wallets compartidos | $14.99-$22.99/yr | iOS, Android |
| 9 | **Expensify** | Receipt scanning + expense reporting | Free tier + planes pagos | iOS, Android, Web |
| 10 | **Buxfer** | Multi-moneda internacional | Free + $3.99-$9.99/mo | iOS, Android, Web |

> **Nota**: Mint cerro operaciones. Intuit redirigió usuarios a Credit Karma (monitoreo de credito, no budgeting). Esto dejo un vacio enorme en la categoria "gratis y simple".

### Features clave de los lideres

**YNAB**: Metodologia zero-based ("dale un trabajo a cada dolar"). Loan payoff simulator. "YNAB Together" (5 usuarios compartiendo). Curva de aprendizaje alta = fortaleza (cambio de comportamiento) y debilidad (abandono).

**Monarch Money**: Sucesor post-Mint. Agregacion de cuentas bancarias, modos duales de presupuesto ("flex" y "category"), dashboard de inversiones, net worth tracking, **AI assistant** (preguntas en lenguaje natural), resumen semanal de gastos, compartir en pareja.

**Copilot Money**: Diseno premium, Apple Editor's Choice (4.8 stars). Presupuestos adaptativos que aprenden de habitos, excelente visualizacion de transacciones recurrentes, auto-categorizacion AI. Era solo iOS hasta enero 2026 (lanzo web). Sin Android aun.

**Rocket Money**: Propuesta unica: deteccion de suscripciones + servicio de cancelacion + negociacion de facturas. La negociacion cobra 35-60% del ahorro. Free tier fuerte para tracking de suscripciones.

**PocketGuard**: Calculadora de "sobrante". Despues de facturas, pagos de deuda y metas de ahorro, dice exactamente cuanto dinero discrecional queda. Simple y efectivo.

### Modelos de precio del mercado

```
Rango estandar premium:  $7-15/mes  o  $75-110/ano
SmartSpend:              $4.99/mes  o  $34.99/ano  (65% mas barato que YNAB)

Tendencias:
- Compra de por vida: practicamente extinta (excepto SmartSpend a $89.99)
- Trial: 7-34 dias es estandar
- Free tier: Feature-limited, no time-limited
- Pricing regional: Solo SmartSpend y Buxfer lo hacen bien para LATAM
```

### Tendencias 2026

**AI como feature central**:
- Auto-categorizacion inteligente que aprende de correcciones del usuario
- Insights contextuales: "Gastaste $300 mas en comida este mes - quieres ver que cambio?"
- Asistentes/chatbots: preguntas en lenguaje natural sobre finanzas
- Forecasting predictivo: proyeccion de balance futuro
- OCR + AI parsing de recibos (Expensify lidera aqui)

**Open Banking / Conexion bancaria**:
- Soporte para 10,000+ instituciones financieras
- Import de transacciones en tiempo real (no batch diario)
- Integracion con exchanges de crypto
- APIs de Open Banking habilitando datos mas ricos

**Inversiones y Net Worth**:
- Dashboards de inversiones son table stakes para top-tier
- Net worth tracking multi-asset (banco, inversiones, crypto, propiedad)
- Analisis de asignacion de portfolio

**Finanzas compartidas (pareja/familia)**:
- Presupuestos compartidos, gastos divididos, metas conjuntas
- YNAB Together (5 usuarios), Monarch (parejas), Goodbudget (5 dispositivos)
- Diferenciador mayor: la mayoria maneja dinero en pareja

**Gestion de suscripciones**:
- Deteccion automatica de cargos recurrentes
- Servicios de cancelacion
- Alertas de cambio de precio
- Comparativa anual vs mensual

### Pain points de usuarios (oportunidades)

| Pain point | % usuarios afectados | Oportunidad para SmartSpend |
|-----------|---------------------|----------------------------|
| Costo alto ($100+/ano) | Mayoria | Ya somos 65% mas baratos |
| Complejidad / curva de aprendizaje | 42% | Ya somos mas simples que YNAB |
| Sync bancario poco confiable | Alto | No dependemos de Plaid |
| Abandono despues del primer uso | 50%+ | Mejorar onboarding + quick wins |
| Privacidad de datos financieros | 49% | Local-first es nuestro diferenciador |
| Forzados a pagar post-Mint | Millones | Free tier generoso |
| Limitaciones de plataforma | Variable | Ya somos cross-platform |

---

## 3. Gaps criticos vs Top 5

Analisis honesto de lo que nos falta para competir al mas alto nivel:

### Gap 1: Sin conexion bancaria / agregacion de cuentas
Todos los top 5 tienen import automatico de transacciones via Plaid/Belvo/MX. Es "table stakes" en US/EU. En LATAM, Belvo ofrece conexion con Bancolombia, Davivienda, Nequi, etc.

### Gap 2: Sin finanzas compartidas (pareja/familia)
64% de adultos en pareja comparten finanzas. YNAB Together, Monarch couples, Goodbudget 5 dispositivos. Es la razon #1 por la que la gente paga premium.

### Gap 3: Sin tracking de inversiones / net worth
Monarch y Empower lideran aqui. No necesitamos ser Bloomberg, pero un dashboard basico de "mi patrimonio total" es esperado.

### Gap 4: Sin AI assistant / chatbot financiero
Monarch tiene un AI assistant que responde preguntas sobre tus finanzas en lenguaje natural. Ya tenemos el pipeline de Gemini — extenderlo es el paso natural.

### Gap 5: Sin forecasting predictivo
"Si sigues asi, en 3 meses tendras $X". PocketGuard hace un calculo parcial ("leftover"), pero nadie lo hace bien con proyeccion temporal.

### Gap 6: Sin tracking de suscripciones
Rocket Money construyo un negocio de $400M solo con esta feature. Nosotros ya tenemos scheduled transactions — extenderlo a deteccion automatica es natural.

### Gap 7: Sin herramienta de deuda
YNAB tiene loan calculator. En LATAM, con tasas de tarjeta de credito del 28%+, una herramienta de debt payoff seria killer.

### Gap 8: Sin multi-account
No separamos por cuenta (principal, tarjeta credito, efectivo, ahorros). Power users lo necesitan.

### Gap 9: Sin reportes customizables / PDF
Ningun competidor genera PDFs bonitos automaticamente. Diferenciador para freelancers y contadores.

### Gap 10: Sin widgets / Apple Watch
Copilot tiene los mejores widgets del mercado. Reduce friccion de registro a < 3 segundos.

### Gap 11: Sin referral / social features
YNAB crecio 70% por word-of-mouth. No tenemos ningun mecanismo de crecimiento viral.

---

## 4. Features propuestas (priorizadas)

### TIER 0 — Quick Wins (1-2 semanas cada una)

Features de alto impacto con complejidad minima:

#### QW-1: "Cuanto me queda hoy" (Daily Allowance)
Un numero grande en el home que muestre presupuesto diario restante.
- Calculo: (presupuesto mensual - gastado) / dias restantes del mes
- Inspirado en PocketGuard ("leftover calculator")
- Solo UI, calculo client-side puro
- **Impacto**: Alto. Es la metrica #1 que los usuarios quieren ver al abrir la app

#### QW-2: Weekly Digest (Push notification)
Resumen semanal automatico:
- "Esta semana gastaste $X, ahorraste $Y"
- "Top categoria: Restaurantes ($Z)"
- "Vas 12% por debajo del mes pasado"
- Edge function `send-weekly-digest` programada con pg_cron
- **Impacto**: Alto para retencion. Mantiene al usuario engaged sin abrir la app

#### QW-3: Streak Counter
"Llevas 15 dias registrando gastos consecutivamente"
- Badge visible en home
- Streak se rompe si no registras en 24h
- Gamificacion minima con maximo impacto en retencion
- Solo estado local (localStorage)
- **Impacto**: Medio-alto. Duolingo demostro que streaks funcionan

#### QW-4: Comparativa rapida en Home
Badge/chip en el home:
- "↑12% vs mes pasado" (rojo) o "↓8% vs mes pasado" (verde)
- Calculo simple: total gastos mes actual vs mes anterior
- **Impacto**: Medio. Contexto inmediato sin ir a estadisticas

#### QW-5: Celebracion de metas
Confetti animation cuando se alcanza un savings goal.
- Usar libreria `canvas-confetti` o `react-confetti`
- Trigger cuando progress >= 100%
- **Impacto**: Medio. Dopamina = retencion

---

### TIER 1 — Impacto alto, Alineado con arquitectura (1-2 meses cada una)

#### T1-1: AI Financial Assistant (Chatbot)

**Descripcion**: Asistente conversacional que responde preguntas sobre tus finanzas en lenguaje natural.

**Ejemplos de uso**:
```
Usuario: "Cuanto gaste en restaurantes este mes?"
AI: "Este mes llevas $185.000 en Restaurantes (12 transacciones).
     Es 23% mas que el mes pasado ($150.000). Tu dia mas caro
     fue el sabado 8 ($45.000 en 'Cena cumpleanos')."

Usuario: "Como voy con mi presupuesto de transporte?"
AI: "Tu presupuesto de Transporte es de $200.000/mes.
     Llevas $156.000 gastado (78%) y quedan 9 dias.
     A este ritmo, terminaras en $208.000 (4% por encima)."

Usuario: "Compara enero vs febrero"
AI: "Febrero: $1.2M gastado vs Enero: $1.4M.
     Bajaste 14%. Principales reducciones: Restaurantes (-$80K),
     Ropa (-$45K). Aumento: Transporte (+$30K)."
```

**Implementacion**:
- Nuevo edge function `ai-assistant` en Supabase
- Input: pregunta del usuario + snapshot de transacciones/presupuestos
- Modelo: Gemini 2.5 Flash Lite (mismo que batch entry)
- UI: Bottom sheet con input de texto + historial de chat
- Rate limit: 10/dia free, 100/dia Pro

**Complejidad**: Media
**Diferenciacion**: Alta (solo Monarch lo tiene, y cobra $99.99/yr)
**Prioridad**: **P0**

---

#### T1-2: Predictive Forecasting

**Descripcion**: Proyeccion de balance futuro a 30/60/90 dias.

**Datos de entrada**:
- Balance actual
- Transacciones recurrentes programadas (scheduled)
- Promedio de gasto diario (ultimos 3 meses)
- Presupuestos activos

**Visualizacion**:
- Grafico de linea en StatsPage o seccion dedicada
- Eje X: proximos 90 dias
- Eje Y: balance proyectado
- Linea solida: proyeccion base
- Area sombreada: rango optimista/pesimista (+/- 1 std dev)
- Marcadores: dias de pago recurrente, vencimientos de presupuesto

**Output key**:
- "Si sigues asi, en 30 dias tendras $X"
- "Tu proximo mes dificil sera marzo (3 pagos grandes)"
- Alerta si la proyeccion cruza $0

**Implementacion**:
- 100% client-side (no necesita backend)
- Nuevo componente `ForecastChart` con Recharts
- Calculo en `forecast.service.ts`
- Datos ya disponibles en Zustand store

**Complejidad**: Media-baja
**Diferenciacion**: Alta (nadie lo hace bien con visualizacion temporal)
**Prioridad**: **P0**

---

#### T1-3: Contextual Spending Insights

**Descripcion**: Insights accionables automaticos en vez de graficas pasivas.

**Tipos de insights**:

| Tipo | Ejemplo | Trigger |
|------|---------|---------|
| **Comparativa mensual** | "Gastaste $120K mas en comida vs mes pasado" | Categoria > 20% vs mes anterior |
| **Inactividad** | "Llevas 3 dias sin registrar - todo bien?" | 3+ dias sin transacciones |
| **Alerta presupuesto** | "Llevas 85% del presupuesto de Transporte y faltan 10 dias" | Budget progress > 80% |
| **Celebracion** | "Ahorraste $200K mas que el mes pasado!" | Ahorro > mes anterior |
| **Patron detectado** | "Tus gastos de fin de semana son 3x tus gastos entre semana" | Analisis de distribucion |
| **Suscripcion** | "Tu gasto en suscripciones subio 15% este trimestre" | Recurrentes trending up |
| **Meta cercana** | "Solo te faltan $50K para tu meta de Vacaciones!" | Savings goal > 90% |

**Implementacion**:
- Edge function `generate-insights` ejecutada semanalmente via pg_cron
- Analiza snapshot del usuario
- Genera 2-3 insights relevantes
- Entrega via push notification y/o seccion en Home
- UI: Cards colapsables con icono + texto + accion

**Complejidad**: Media
**Diferenciacion**: Alta (Copilot lo hace, cobra $95/yr)
**Prioridad**: **P1**

---

#### T1-4: Shared Wallets / Finanzas en pareja

**Descripcion**: Compartir un wallet o presupuesto con otra persona.

**Modelo propuesto**:
```
Wallet personal (default, actual) → Solo tuyo
Wallet compartido (nuevo) → Ambos ven y editan

Cada usuario tiene:
- Su wallet personal (privado)
- 0-N wallets compartidos (invitacion por email/link)
```

**Features**:
- Invitar por email o link compartible
- Ambos agregan transacciones al wallet compartido
- Presupuestos compartidos con progreso en tiempo real
- Vista de "quien gasto que" (atribucion)
- Opcional: dividir gastos 50/50 o custom split
- Notificacion cuando el otro agrega un gasto

**Implementacion**:
- Nueva tabla Supabase: `shared_wallets` (id, owner_id, name, created_at)
- Nueva tabla: `shared_wallet_members` (wallet_id, user_id, role, invited_at)
- Nueva tabla: `shared_transactions` (wallet_id, transaction data, created_by)
- RLS policies para multi-user access
- Realtime subscriptions para updates en vivo
- UI: Tab o selector de wallet en Home

**Complejidad**: Alta
**Diferenciacion**: Media (YNAB, Monarch, Goodbudget lo tienen)
**ROI**: Muy alto — es la razon #1 por la que la gente paga premium
**Prioridad**: **P1**

---

### TIER 2 — Diferenciadores de mercado (2-3 meses cada una)

#### T2-1: Debt Payoff Planner

**Descripcion**: Herramienta para planificar pago de deudas.

**Features**:
- Registrar deudas: nombre, balance, tasa de interes, pago minimo
- Estrategias de pago:
  - **Avalanche**: Pagar primero la de mayor interes (matematicamente optimo)
  - **Snowball**: Pagar primero la de menor balance (psicologicamente motivador)
- Visualizacion: timeline de cuando se paga cada deuda
- "Fecha de libertad de deuda": cuando todas estaran pagadas
- Simulador: "Si pagas $X extra/mes, te liberas Y meses antes"
- Progress tracking mensual

**Por que importa en LATAM**:
- Tarjetas de credito en Colombia: 28-32% EA
- Creditos de consumo: 18-25% EA
- Es un dolor real y masivo
- YNAB tiene un loan planner basico pero no esta pensado para tasas latinoamericanas

**Complejidad**: Media
**Diferenciacion**: Alta para LATAM
**Prioridad**: **P1**

---

#### T2-2: Subscription Tracker

**Descripcion**: Detectar y gestionar suscripciones automaticamente.

**Features**:
- Deteccion automatica: pattern matching sobre transacciones recurrentes con mismo monto y nombre similar
- Dashboard dedicado: lista de suscripciones con costo mensual/anual
- Total mensual visible: "Tus suscripciones cuestan $180.000/mes"
- Proyeccion anual: "Eso es $2.160.000/ano"
- Alertas de renovacion proxima
- "Sigues usando esto?" prompts (si no hay transaccion relacionada en 60 dias)
- Marcar como cancelada

**Implementacion**:
- Nuevo servicio `subscriptionTracker.service.ts`
- Algoritmo de deteccion:
  - Agrupar transacciones por nombre similar (fuzzy match)
  - Filtrar por frecuencia regular (mensual +/- 3 dias)
  - Filtrar por monto similar (+/- 5%)
- UI: Pagina dedicada `/subscriptions` con lista y totales
- Integracion con scheduled transactions existentes

**Complejidad**: Media
**Diferenciacion**: Media-alta (Rocket Money es el lider, pero cobra $7-14/mo solo por esto)
**Prioridad**: **P2**

---

#### T2-3: Savings Goals con gamificacion visual

**Descripcion**: Evolucionar savings goals actuales con visualizacion motivacional.

**Features**:
- Imagen/emoji representando la meta (vacaciones, carro, fondo de emergencia, laptop)
- Jarra/barra que se "llena" con animacion suave
- Hitos intermedios: 25%, 50%, 75%, 100%
- Celebracion con confetti al alcanzar cada hito
- Badge: "A este ritmo, alcanzaras tu meta en X meses"
- Sugerencia de contribucion: "Si aportas $X/semana, llegas en Y meses"
- Historial de contribuciones
- Compartir progreso (screenshot o link)

**Complejidad**: Baja-media
**Diferenciacion**: Alta (ninguna app top hace esto bien)
**Prioridad**: **P2**

---

#### T2-4: Custom Reports + PDF Export

**Descripcion**: Reportes financieros profesionales.

**Tipos de reporte**:
- **Mensual**: Resumen de ingresos, gastos, ahorro. Top categorias. Comparativa vs mes anterior
- **Trimestral**: Tendencias de 3 meses. Mejor/peor mes. Categorias trending up/down
- **Anual**: Resumen del ano completo. Totales por categoria. Mes mas caro/mas barato. Ahorro total
- **Por categoria**: Detalle de todos los gastos de una categoria en un periodo
- **Por viaje**: Resumen financiero de un viaje especifico

**Formato**:
- Vista in-app (HTML renderizado)
- Export PDF (via `html2pdf.js` o `jsPDF`)
- Auto-envio por email mensual (edge function programada)

**Complejidad**: Media
**Diferenciacion**: Alta (ningun competidor genera PDFs bonitos automaticamente)
**Prioridad**: **P2**

---

### TIER 3 — Expansion y crecimiento (3-6 meses cada una)

#### T3-1: Open Banking (Conexion bancaria LATAM)

**Descripcion**: Import automatico de transacciones desde bancos.

**Proveedores por region**:
- **LATAM**: Belvo (Bancolombia, Davivienda, Nequi, BBVA, Nubank)
- **US/EU**: Plaid (10,000+ instituciones)
- **Mexico**: Belvo + regulacion Open Finance de CNBV

**Modelo propuesto**:
```
Entrada manual (actual) → Siempre disponible, siempre default
Conexion bancaria (nuevo) → Opcional, complementa la entrada manual
```

**Principios**:
- La conexion bancaria es ADICIONAL, nunca reemplaza la entrada manual
- Respetar filosofia local-first: datos bancarios se procesan y guardan localmente
- El usuario siempre puede desconectar y seguir usando la app normalmente
- No requerir conexion bancaria para ninguna feature core

**Complejidad**: Muy alta (integracion con terceros, compliance, seguridad)
**Diferenciacion**: Baja (todos los top 5 lo tienen)
**Prioridad**: **P3** (pero necesario para escalar en US/EU)

---

#### T3-2: Widgets + Apple Watch

**Descripcion**: Acceso rapido a datos financieros desde home screen y reloj.

**Widgets iOS/Android**:
- **Small**: Balance actual + tendencia (flecha up/down)
- **Medium**: Balance + top 3 gastos de hoy + boton "Agregar gasto"
- **Large**: Balance + mini chart de la semana + transacciones recientes

**Apple Watch**:
- Complicacion: balance actual
- App: "Agregar gasto" por dictado de voz
- Notificaciones: alertas de presupuesto en la muneca

**Implementacion**:
- Capacitor no soporta widgets nativamente
- Requiere modulo nativo (Swift para iOS, Kotlin para Android)
- Comunicacion via App Groups (iOS) / SharedPreferences (Android)
- Watch app requiere watchOS target separado

**Complejidad**: Alta
**Diferenciacion**: Media (Copilot tiene los mejores widgets)
**Prioridad**: **P3**

---

#### T3-3: Referral Program + Social Features

**Descripcion**: Mecanismos de crecimiento viral.

**Referral**:
- "Invita un amigo → ambos obtienen 1 mes Pro gratis"
- Link unico de referral por usuario
- Dashboard de referrals (invitados, convertidos, recompensas)
- Limite: max 12 meses gratis por referrals (evitar abuso)

**Social/Community**:
- Retos de ahorro: "Reto no-restaurantes 1 semana" (opt-in, anonimo)
- Tabla de posiciones anonimizada: "Ahorras mas que el 75% de usuarios de tu edad"
- Compartir logros: "Alcance mi meta de Vacaciones!" (screenshot compartible)

**Complejidad**: Media
**Diferenciacion**: Media
**Prioridad**: **P3** (pero alto ROI para crecimiento organico)

---

#### T3-4: Multi-Account Support

**Descripcion**: Separar transacciones por cuenta financiera.

**Cuentas**:
- Cuenta principal (checking)
- Tarjeta de credito
- Efectivo
- Ahorros
- Nequi / Daviplata / billetera digital
- Custom

**Features**:
- Balance por cuenta individual
- Balance total consolidado
- Transferencias entre cuentas (no son gasto ni ingreso)
- Reconciliacion manual
- Selector de cuenta al agregar transaccion
- Vista filtrada por cuenta

**Impacto en arquitectura**:
- Nuevo campo `accountId` en Transaction type
- Nuevo tipo `Account` en budget.types.ts
- Migracion de schema (v9)
- Filtros en todas las vistas que muestran transacciones

**Complejidad**: Alta
**Diferenciacion**: Baja (todos los top 5 lo tienen)
**Prioridad**: **P3**

---

## 5. Matriz de priorizacion

| Feature | Impacto usuario | Complejidad | Diferenciacion | Revenue impact | Prioridad |
|---------|----------------|-------------|----------------|---------------|-----------|
| QW-1: Daily Allowance | Alto | Muy baja | Alta | Bajo | **P0** |
| QW-2: Weekly Digest | Alto | Baja | Media | Medio | **P0** |
| QW-3: Streak Counter | Medio-alto | Muy baja | Media | Bajo | **P0** |
| QW-4: Comparativa Home | Medio | Muy baja | Baja | Bajo | **P0** |
| QW-5: Celebracion metas | Medio | Baja | Alta | Bajo | **P0** |
| T1-1: AI Assistant | Alto | Media | **Muy alta** | Alto | **P0** |
| T1-2: Forecasting | Alto | Media-baja | **Muy alta** | Medio | **P0** |
| T1-3: Insights | Alto | Media | Alta | Medio | **P1** |
| T1-4: Shared Wallets | **Muy alto** | **Alta** | Media | **Muy alto** | **P1** |
| T2-1: Debt Planner | Alto | Media | Alta (LATAM) | Medio | **P1** |
| T2-2: Subscription Tracker | Medio | Media | Media-alta | Medio | **P2** |
| T2-3: Goals gamificados | Medio | Baja | Alta | Bajo | **P2** |
| T2-4: Reports + PDF | Medio | Media | Alta | Medio | **P2** |
| T3-1: Open Banking | Alto | Muy alta | Baja | Alto | **P3** |
| T3-2: Widgets + Watch | Medio | Alta | Media | Bajo | **P3** |
| T3-3: Referral + Social | Medio | Media | Media | Alto (growth) | **P3** |
| T3-4: Multi-Account | Alto | Alta | Baja | Medio | **P3** |

---

## 6. Posicionamiento estrategico

### Propuesta de valor

> **"La app de finanzas personales mas inteligente, privada y accesible del mundo."**

### Tres pilares diferenciadores

**1. Inteligente (AI-first)**
- AI Assistant conversacional
- Predictive Forecasting
- Contextual Insights automaticos
- Batch Entry (texto/voz/imagen)
- Auto-categorizacion que aprende
- Mas AI que cualquier competidor, a una fraccion del precio

**2. Privada (Local-first)**
- Datos en tu dispositivo por default
- Cloud sync opcional (no obligatorio)
- Sin conexion bancaria obligatoria
- Sin Plaid, sin terceros accediendo a tus datos
- Para el 49% de usuarios que temen compartir datos financieros
- El "anti-Plaid"

**3. Accesible (Global-first)**
- $34.99/yr (vs $109 de YNAB, $99.99 de Monarch)
- Funciona offline (mercados con internet intermitente)
- Multi-idioma nativo (es, en, fr, pt)
- Precios regionales (COP, BRL, MXN, ARS)
- Funciona con cash, sin cuenta bancaria
- Disenada para economias informales y variables

### Audiencia target (expandida)

| Segmento | Descripcion | Feature clave |
|----------|-------------|--------------|
| **LATAM millennials** | 25-40 anos, smartphone-first, ingresos variables | AI batch entry, multi-moneda, precios regionales |
| **Privacy-conscious** | No quieren conectar banco a apps | Local-first, sin Plaid |
| **Post-Mint refugees** | Buscan reemplazo simple y economico | Free tier generoso, UX simple |
| **Parejas jovenes** | Primeras finanzas compartidas | Shared wallets, presupuestos en pareja |
| **Freelancers/gig workers** | Ingresos irregulares, gastos variables | Periodos flexibles, forecasting |
| **Viajeros frecuentes** | Necesitan tracking multi-moneda por viaje | Trips feature, multi-currency |

### Competencia directa por pilar

```
AI-first:      SmartSpend vs Monarch Money (nosotros: mas AI, 65% mas baratos)
Local-first:   SmartSpend vs ??? (no hay competencia directa aqui)
Accesible:     SmartSpend vs Spendee (nosotros: mas features, similar precio)
```

---

## 7. Roadmap tentativo por quarters

### Q1 2026 (Enero - Marzo) — Foundation
- [x] Virtualizacion de listas (v0.16.1)
- [ ] QW-1: Daily Allowance en Home
- [ ] QW-2: Weekly Digest notifications
- [ ] QW-3: Streak Counter
- [ ] QW-4: Comparativa mes anterior en Home
- [ ] QW-5: Celebracion de metas (confetti)

### Q2 2026 (Abril - Junio) — AI Expansion
- [ ] T1-1: AI Financial Assistant (chatbot)
- [ ] T1-2: Predictive Forecasting
- [ ] T1-3: Contextual Spending Insights
- [ ] Mejorar auto-categorizacion con feedback loop

### Q3 2026 (Julio - Septiembre) — Social & Monetization
- [ ] T1-4: Shared Wallets / Finanzas en pareja
- [ ] T2-1: Debt Payoff Planner
- [ ] T3-3: Referral Program (basico)
- [ ] Optimizacion de conversion free → pro

### Q4 2026 (Octubre - Diciembre) — Polish & Scale
- [ ] T2-2: Subscription Tracker
- [ ] T2-3: Goals gamificados
- [ ] T2-4: Custom Reports + PDF
- [ ] T3-2: Widgets iOS/Android (si recursos disponibles)

### 2027 H1 — Platform Expansion
- [ ] T3-1: Open Banking (Belvo para LATAM)
- [ ] T3-4: Multi-Account Support
- [ ] Expansion de idiomas (Aleman, Italiano, etc.)
- [ ] Apple Watch companion app

---

## 8. Metricas de exito

### KPIs principales

| Metrica | Actual (est.) | Target Q4 2026 | Target Top 5 |
|---------|--------------|----------------|--------------|
| MAU (Monthly Active Users) | ? | 50K | 500K+ |
| DAU/MAU ratio | ? | 35% | 50%+ |
| D7 retention | ? | 40% | 55%+ |
| D30 retention | ? | 25% | 40%+ |
| Free → Pro conversion | ? | 5% | 8-12% |
| App Store rating | ? | 4.6+ | 4.7+ |
| MRR (Monthly Recurring Revenue) | ? | $5K | $100K+ |
| Avg transactions/user/month | ? | 30+ | 50+ |

### Metricas por feature

| Feature | Metrica de exito |
|---------|-----------------|
| AI Assistant | 30%+ de usuarios Pro lo usan semanalmente |
| Forecasting | 50%+ de usuarios ven la proyeccion al menos 1x/semana |
| Shared Wallets | 20%+ de usuarios Pro comparten al menos 1 wallet |
| Weekly Digest | 60%+ open rate en push notifications |
| Streak Counter | Promedio streak > 7 dias |
| Debt Planner | 15%+ de usuarios registran al menos 1 deuda |

---

## 9. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|-----------|
| Gemini API cambia pricing/limits | Media | Alto | Tener fallback a modelo alternativo (GPT-4o-mini ya implementado) |
| Apple rechaza update por guideline | Baja | Alto | Seguir guidelines estrictamente, in-app browser para todo |
| Competidor lanza feature similar | Alta | Medio | Velocidad de ejecucion, foco en LATAM primero |
| Shared wallets crea conflictos de sync | Media | Alto | Supabase Realtime + conflict resolution robusta |
| Open Banking compliance | Alta | Alto | Empezar solo con Belvo (ya tiene compliance LATAM) |
| User churn por complejidad | Media | Alto | Mantener simplicidad core, features avanzadas opt-in |

---

## 10. Referencias y fuentes

### Competidores analizados
- YNAB: https://www.ynab.com
- Monarch Money: https://www.monarchmoney.com
- Copilot Money: https://copilot.money
- Rocket Money: https://www.rocketmoney.com
- PocketGuard: https://pocketguard.com
- Goodbudget: https://goodbudget.com
- Empower: https://empower.me
- Spendee: https://www.spendee.com
- Expensify: https://www.expensify.com
- Buxfer: https://www.buxfer.com

### Fuentes de investigacion
- NerdWallet: Best Budget Apps 2026
- CNBC Select: Best Budgeting Apps 2026
- CNBC Select: Best Expense Tracker Apps 2026
- Engadget: Best Budgeting Apps 2026
- FinanceBuzz: Best Budgeting Apps 2026
- Financial Panther: Key Features Every Personal Finance App Needs 2026
- Business Research Insights: Budget Apps Market Size 2034
- Fact MR: Personal Finance Mobile App Market
- Cube Software: Best AI Budgeting Tools 2026

### Datos de mercado
- 50%+ de usuarios abandonan apps de presupuesto despues del primer uso
- 49% de usuarios preocupados por privacidad de datos financieros
- 42% citan complejidad como barrera
- 64% de adultos en pareja comparten finanzas
- Mercado global de budget apps: crecimiento proyectado a $4.2B para 2034
- Cierre de Mint dejo millones de usuarios sin herramienta gratuita
