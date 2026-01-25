# SmartSpend - Guía de Colores

> Paleta de colores y directrices para mantener consistencia visual en toda la aplicación

---

## Principios de Color

1. **Mobile-first**: Colores optimizados para pantallas móviles con buen contraste
2. **Accesibilidad**: Ratio de contraste mínimo 4.5:1 (WCAG AA)
3. **Semántica**: Colores con significado claro (verde = ingresos, rojo = destructivo)
4. **Consistencia**: Usar siempre las mismas clases de Tailwind para el mismo propósito

---

## Paleta Principal

### Color Primario
```css
Primary Accent: #18B7B0 (teal)
```
**Uso**:
- Estado activo del bottom bar (`text-[#18B7B0]`)
- Elementos destacados en navegación

---

## Colores por Tipo de Transacción

### Ingresos 💰
```css
emerald-500: #10B981
emerald-600: #059669
emerald-700: #047857
```

**Clases de Tailwind**:
- Backgrounds: `bg-emerald-500`, `bg-emerald-600`, `bg-emerald-50`
- Texto: `text-emerald-600`, `text-emerald-700`
- Bordes: `border-emerald-300`, `border-emerald-500`

**Ejemplos de uso**:
```tsx
// Botón de ingreso
<button className="bg-emerald-500 hover:bg-emerald-600">
  Agregar Ingreso
</button>

// Texto de monto de ingreso
<p className="text-emerald-600 font-semibold">
  +$150.000
</p>

// Badge de ingreso
<span className="bg-emerald-50 text-emerald-700">
  Ingreso
</span>
```

---

### Gastos 💸
```css
gray-900: #111827
red-500: #EF4444
red-600: #DC2626
```

**Clases de Tailwind**:
- Texto principal: `text-gray-900`
- Backgrounds (alertas): `bg-red-50`, `bg-red-500`
- Texto (alertas): `text-red-600`, `text-red-700`

**Ejemplos de uso**:
```tsx
// Botón de gasto
<button className="bg-gray-900 hover:bg-gray-800">
  Agregar Gasto
</button>

// Texto de monto de gasto
<p className="text-gray-900 font-semibold">
  -$85.000
</p>

// Botón destructivo
<button className="bg-red-500 hover:bg-red-600">
  Eliminar
</button>
```

---

## Colores de Estados

### Estados de Transacciones

#### Pagado (Default)
- Sin badge, texto normal `text-gray-900`

#### Pendiente ⏳
```css
amber-50: #FFFBEB (background)
amber-700: #B45309 (text)
```
```tsx
<span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs">
  Pendiente
</span>
```

#### Planeado 📅
```css
blue-50: #EFF6FF (background)
blue-700: #1D4ED8 (text)
```
```tsx
<span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">
  Planeado
</span>
```

#### Programada 🔁
```css
purple-50: #FAF5FF (background)
purple-700: #7E22CE (text)
```
```tsx
<span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-xs">
  Programada
</span>
```

---

## Colores Funcionales

### Success ✅
```css
emerald-500: #10B981
emerald-600: #059669
```
**Uso**: Confirmaciones, acciones completadas, estados positivos

```tsx
// Botón de confirmación
<button className="bg-emerald-500 hover:bg-emerald-600">
  Guardar
</button>

// Toast de éxito
<div className="bg-emerald-50 border-l-4 border-emerald-500">
  Operación exitosa
</div>
```

### Destructive ❌
```css
red-500: #EF4444
red-600: #DC2626
red-700: #B91C1C
```
**Uso**: Eliminaciones, acciones peligrosas, errores

```tsx
// Botón de eliminar
<button className="bg-red-500 hover:bg-red-600">
  Eliminar
</button>

// Alerta de error
<div className="bg-red-50 text-red-700">
  Error al guardar
</div>
```

### Warning ⚠️
```css
orange-500: #F97316
orange-600: #EA580C
orange-700: #C2410C
```
**Uso**: Desactivaciones, advertencias, acciones con precaución

```tsx
// Botón de desactivar
<button className="bg-orange-500 hover:bg-orange-600">
  Desactivar
</button>

// Banner de advertencia
<div className="bg-orange-50 text-orange-700">
  Esta acción es irreversible
</div>
```

### Info ℹ️
```css
blue-500: #3B82F6
blue-600: #2563EB
blue-700: #1D4ED8
```
**Uso**: Información, ayuda, datos neutrales

```tsx
// Banner informativo
<div className="bg-blue-50 text-blue-900 p-4 rounded-xl">
  Esta transacción se generará automáticamente
</div>
```

---

## Backgrounds

### Páginas
```css
gray-50: #F9FAFB
```
**CRÍTICO**: NUNCA usar `bg-white` para páginas completas
```tsx
// ✅ CORRECTO
<div className="min-h-screen bg-gray-50">
  <PageHeader />
  <main className="px-4">...</main>
</div>

// ❌ INCORRECTO
<div className="min-h-screen bg-white">
```

### Cards y Contenedores
```css
white: #FFFFFF
```
```tsx
<div className="bg-white rounded-xl p-4 shadow-sm">
  Card content
</div>
```

### Neutral
```css
gray-100: #F3F4F6
```
**Uso**: Inputs, botones secundarios, backgrounds deshabilitados
```tsx
// Input background
<input className="bg-gray-50 border-gray-200" />

// Botón secundario
<button className="bg-gray-100 text-gray-700">
  Cancelar
</button>
```

---

## Colores de Texto

### Jerarquía de Texto
```css
Primary:   text-gray-900 (#111827) - Títulos, texto principal
Secondary: text-gray-600 (#4B5563) - Subtítulos, texto de soporte
Tertiary:  text-gray-500 (#6B7280) - Labels, texto secundario
Muted:     text-gray-400 (#9CA3AF) - Placeholders, texto deshabilitado
```

**Ejemplos**:
```tsx
// Título
<h1 className="text-lg font-semibold text-gray-900">
  Presupuesto
</h1>

// Subtítulo
<p className="text-sm text-gray-600">
  Balance disponible
</p>

// Label
<label className="text-xs font-medium text-gray-500">
  Categoría
</label>

// Placeholder
<input placeholder="Buscar" className="placeholder:text-gray-400" />
```

---

## Bordes

### Bordes por Contexto
```css
Default:  border-gray-200 (#E5E7EB)
Focus:    border-emerald-300, ring-emerald-100
Error:    border-red-300
Success:  border-emerald-300
```

**Ejemplos**:
```tsx
// Input normal
<input className="border border-gray-200" />

// Input con focus
<input className="border border-gray-200 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />

// Input con error
<input className="border border-red-300 text-red-900" />
```

---

## Shadows

### Elevación por Componente
```css
Cards:      shadow-sm
Modals:     shadow-xl, shadow-2xl
BottomBar:  shadow-[0_-10px_30px_rgba(0,0,0,0.10)]
FAB:        shadow-[0_8px_24px_rgba(0,0,0,0.25)]
```

**Ejemplos**:
```tsx
// Card
<div className="bg-white rounded-xl shadow-sm">

// Modal
<div className="bg-white rounded-2xl shadow-xl">

// Bottom bar
<nav className="shadow-[0_-10px_30px_rgba(0,0,0,0.10)]">

// FAB
<button className="shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
```

---

## Transparencias y Opacidades

### Overlays
```css
Backdrop:     bg-black/50 (50% opacity)
Hover:        bg-gray-50, bg-gray-100
Active:       opacity-50, opacity-75
```

### Category Icon Backgrounds
Usar color de la categoría con 20% de opacidad:
```tsx
<div style={{ backgroundColor: category.color + "20" }}>
  <Icon style={{ color: category.color }} />
</div>
```

---

## Combinaciones Comunes

### Botones

#### Botón Primario (Guardar/Confirmar)
```tsx
<button className="w-full rounded-2xl bg-emerald-500 py-4 text-white hover:bg-emerald-600 active:scale-[0.98]">
  Guardar
</button>
```

#### Botón Secundario (Cancelar)
```tsx
<button className="w-full rounded-xl bg-gray-100 py-3 text-gray-700 hover:bg-gray-200">
  Cancelar
</button>
```

#### Botón Destructivo (Eliminar)
```tsx
<button className="w-full rounded-xl bg-red-500 py-3 text-white hover:bg-red-600">
  Eliminar
</button>
```

#### Botón de Ingreso
```tsx
<button className="rounded-2xl bg-emerald-500 py-4 text-white hover:bg-emerald-600 active:scale-[0.98]">
  Agregar Ingreso
</button>
```

#### Botón de Gasto
```tsx
<button className="rounded-2xl bg-gray-900 py-4 text-white hover:bg-gray-800 active:scale-[0.98]">
  Agregar Gasto
</button>
```

### Badges

#### Badge Success
```tsx
<span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium">
  Activa
</span>
```

#### Badge Warning
```tsx
<span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">
  Pausada
</span>
```

#### Badge Neutral
```tsx
<span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs font-medium">
  Inactiva
</span>
```

### Banners

#### Info Banner
```tsx
<div className="rounded-xl bg-blue-50 p-4">
  <p className="text-sm text-blue-900">
    Información importante
  </p>
</div>
```

#### Success Banner
```tsx
<div className="rounded-xl bg-emerald-50 p-4">
  <p className="text-sm text-emerald-900">
    Operación exitosa
  </p>
</div>
```

#### Warning Banner
```tsx
<div className="rounded-xl bg-orange-50 p-4">
  <p className="text-xs font-medium text-orange-700">
    Esta acción es irreversible
  </p>
</div>
```

---

## Anti-patrones (Evitar)

### ❌ Colores Incorrectos
```tsx
// NO usar bg-white en páginas
<div className="min-h-screen bg-white">

// NO usar colores inconsistentes para ingresos
<p className="text-green-500">+$100.000</p> // Usar emerald-600

// NO usar red para gastos normales
<p className="text-red-600">-$50.000</p> // Usar gray-900
```

### ❌ Shadows Inconsistentes
```tsx
// NO inventar nuevas shadows
<div className="shadow-lg"> // Usar shadow-sm, shadow-xl, o custom específico

// NO olvidar shadows en modals
<div className="bg-white rounded-2xl"> // Falta shadow-xl
```

### ❌ Transparencias Incorrectas
```tsx
// NO usar opacity baja para texto importante
<p className="text-gray-900 opacity-50"> // Usar text-gray-500

// NO usar bg-black sin transparencia para overlays
<div className="bg-black"> // Usar bg-black/50
```

---

## Herramientas de Referencia

### Tailwind Config
Los colores están configurados en `tailwind.config.js`. Para agregar nuevos colores personalizados, extender el tema.

### Conversión Hex → Tailwind
- `#10B981` → `emerald-500`
- `#EF4444` → `red-500`
- `#F97316` → `orange-500`
- `#3B82F6` → `blue-500`

### Verificar Contraste
Usar herramienta: https://webaim.org/resources/contrastchecker/
- Mínimo WCAG AA: 4.5:1 para texto normal
- Mínimo WCAG AA: 3:1 para texto grande

---

## Checklist de Revisión

Antes de commitear cambios de UI:

- [ ] Páginas usan `bg-gray-50` (no `bg-white`)
- [ ] Cards usan `bg-white` con `shadow-sm`
- [ ] Ingresos usan colores `emerald-*`
- [ ] Gastos usan `gray-900` (no `red-*`)
- [ ] Botones destructivos usan `red-500`
- [ ] Botones de advertencia usan `orange-500`
- [ ] Badges usan combinación apropiada (bg-X-50 + text-X-700)
- [ ] Texto tiene jerarquía clara (gray-900 → gray-600 → gray-500)
- [ ] Overlays usan `bg-black/50`
- [ ] Icon backgrounds usan `category.color + "20"`
- [ ] Shadows siguen la guía (sm/xl/2xl/custom)
- [ ] Contraste cumple WCAG AA (4.5:1)

---

## Referencias

- [CLAUDE.md](../CLAUDE.md) - Design guidelines completas
- [Tailwind Color Palette](https://tailwindcss.com/docs/customizing-colors)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
