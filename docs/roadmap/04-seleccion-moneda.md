# Feature: Selección de Moneda

## Resumen

Implementar un sistema completo de selección de moneda con detección automática basada en la región del usuario. El sistema debe soportar las monedas más importantes a nivel mundial, permitir selección manual durante el onboarding y desde configuración, y preparar la base para multi-currency en el futuro.

## Objetivos

- Soportar lista completa de monedas mundiales (top 50+)
- Detectar automáticamente moneda basada en región/país del dispositivo
- Integrar con Screen3_Currency del onboarding existente
- Permitir cambio de moneda desde ProfilePage
- Formatear cantidades según la moneda seleccionada
- Persistir preferencia del usuario
- Preparar estructura para multi-currency (futuro)
- Mantener COP (Peso Colombiano) como moneda por defecto fallback

## Monedas Soportadas

### Top Monedas Mundiales (Por Regiones)

#### América
| Código | Moneda | Símbolo | País/Región | Locale |
|--------|--------|---------|-------------|--------|
| USD | Dólar Estadounidense | $ | Estados Unidos | en-US |
| CAD | Dólar Canadiense | C$ | Canadá | en-CA |
| MXN | Peso Mexicano | $ | México | es-MX |
| BRL | Real Brasileño | R$ | Brasil | pt-BR |
| ARS | Peso Argentino | $ | Argentina | es-AR |
| CLP | Peso Chileno | $ | Chile | es-CL |
| COP | Peso Colombiano | $ | Colombia | es-CO |
| PEN | Sol Peruano | S/ | Perú | es-PE |
| UYU | Peso Uruguayo | $ | Uruguay | es-UY |
| VES | Bolívar Venezolano | Bs. | Venezuela | es-VE |
| GTQ | Quetzal Guatemalteco | Q | Guatemala | es-GT |
| DOP | Peso Dominicano | RD$ | Rep. Dominicana | es-DO |

#### Europa
| Código | Moneda | Símbolo | País/Región | Locale |
|--------|--------|---------|-------------|--------|
| EUR | Euro | € | Zona Euro | es-ES |
| GBP | Libra Esterlina | £ | Reino Unido | en-GB |
| CHF | Franco Suizo | CHF | Suiza | de-CH |
| SEK | Corona Sueca | kr | Suecia | sv-SE |
| NOK | Corona Noruega | kr | Noruega | nb-NO |
| DKK | Corona Danesa | kr | Dinamarca | da-DK |
| PLN | Zloty Polaco | zł | Polonia | pl-PL |
| CZK | Corona Checa | Kč | República Checa | cs-CZ |
| HUF | Florín Húngaro | Ft | Hungría | hu-HU |
| RON | Leu Rumano | lei | Rumanía | ro-RO |
| RUB | Rublo Ruso | ₽ | Rusia | ru-RU |
| TRY | Lira Turca | ₺ | Turquía | tr-TR |

#### Asia-Pacífico
| Código | Moneda | Símbolo | País | Locale |
|--------|--------|---------|------|--------|
| CNY | Yuan Chino | ¥ | China | zh-CN |
| JPY | Yen Japonés | ¥ | Japón | ja-JP |
| KRW | Won Surcoreano | ₩ | Corea del Sur | ko-KR |
| INR | Rupia India | ₹ | India | hi-IN |
| AUD | Dólar Australiano | A$ | Australia | en-AU |
| NZD | Dólar Neozelandés | NZ$ | Nueva Zelanda | en-NZ |
| SGD | Dólar de Singapur | S$ | Singapur | en-SG |
| HKD | Dólar de Hong Kong | HK$ | Hong Kong | zh-HK |
| TWD | Dólar Taiwanés | NT$ | Taiwán | zh-TW |
| THB | Baht Tailandés | ฿ | Tailandia | th-TH |
| MYR | Ringgit Malayo | RM | Malasia | ms-MY |
| IDR | Rupia Indonesia | Rp | Indonesia | id-ID |
| PHP | Peso Filipino | ₱ | Filipinas | en-PH |
| VND | Dong Vietnamita | ₫ | Vietnam | vi-VN |
| PKR | Rupia Pakistaní | ₨ | Pakistán | ur-PK |

#### Medio Oriente & África
| Código | Moneda | Símbolo | País/Región | Locale |
|--------|--------|---------|-------------|--------|
| SAR | Riyal Saudí | ﷼ | Arabia Saudita | ar-SA |
| AED | Dirham Emiratí | د.إ | EAU | ar-AE |
| ILS | Shekel Israelí | ₪ | Israel | he-IL |
| ZAR | Rand Sudafricano | R | Sudáfrica | en-ZA |
| EGP | Libra Egipcia | £ | Egipto | ar-EG |
| NGN | Naira Nigeriana | ₦ | Nigeria | en-NG |
| KES | Chelín Keniano | KSh | Kenia | en-KE |
| MAD | Dirham Marroquí | د.م. | Marruecos | ar-MA |

**Total**: 50+ monedas soportadas

**Moneda por Defecto (Fallback)**: COP (Peso Colombiano)

### Detección Automática por Región

**Mapeo País → Moneda**:
```typescript
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // América
  US: 'USD',
  CA: 'CAD',
  MX: 'MXN',
  BR: 'BRL',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  PE: 'PEN',
  UY: 'UYU',
  VE: 'VES',
  GT: 'GTQ',
  DO: 'DOP',

  // Europa
  ES: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  IT: 'EUR',
  PT: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  IE: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  GB: 'GBP',
  CH: 'CHF',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  PL: 'PLN',
  CZ: 'CZK',
  HU: 'HUF',
  RO: 'RON',
  RU: 'RUB',
  TR: 'TRY',

  // Asia-Pacífico
  CN: 'CNY',
  JP: 'JPY',
  KR: 'KRW',
  IN: 'INR',
  AU: 'AUD',
  NZ: 'NZD',
  SG: 'SGD',
  HK: 'HKD',
  TW: 'TWD',
  TH: 'THB',
  MY: 'MYR',
  ID: 'IDR',
  PH: 'PHP',
  VN: 'VND',
  PK: 'PKR',

  // Medio Oriente & África
  SA: 'SAR',
  AE: 'AED',
  IL: 'ILS',
  ZA: 'ZAR',
  EG: 'EGP',
  NG: 'NGN',
  KE: 'KES',
  MA: 'MAD',

  // ... más países según sea necesario
};
```

**Detección con `Intl.DateTimeFormat`**:
```typescript
function detectCountryCode(): string | null {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Parsear timezone para extraer país
    // Ejemplo: "America/Bogota" → CO
    // Ejemplo: "Europe/Madrid" → ES
    return extractCountryFromTimezone(timezone);
  } catch {
    return null;
  }
}
```

## Casos de Uso

### 1. Primera Instalación - Detección Automática

**Actor**: Usuario nuevo

**Flujo Principal**:
1. Usuario abre la app por primera vez
2. Sistema detecta región/país del dispositivo mediante:
   - `Intl.DateTimeFormat().resolvedOptions().timeZone`
   - O mediante `@capacitor/device` en mobile
3. Sistema mapea país a moneda usando tabla `COUNTRY_TO_CURRENCY`
4. Si el país no está en la tabla, usa COP como fallback
5. Sistema muestra onboarding con moneda detectada
6. En pantalla "Elige tu moneda" (Screen3_Currency), la moneda detectada aparece pre-seleccionada en la parte superior
7. Usuario puede confirmar o cambiar a otra moneda
8. Sistema persiste la selección en localStorage: `app_currency`
9. Onboarding continúa con moneda seleccionada

**Flujos Alternativos**:

**A1: Detección Falla**
- Sistema usa COP (Peso Colombiano) como fallback
- Usuario puede cambiar manualmente en onboarding

**A2: Usuario Omite Configuración**
- Sistema mantiene moneda detectada automáticamente
- Usuario puede cambiar después desde ProfilePage

### 2. Cambio de Moneda Desde Onboarding

**Actor**: Usuario en proceso de onboarding

**Flujo Principal**:
1. Usuario está en pantalla "Elige tu moneda" (paso 3/5 de FirstConfig)
2. Sistema muestra lista de monedas agrupadas por región:
   - **Recomendada** (la detectada, destacada al tope)
   - **América**
   - **Europa**
   - **Asia-Pacífico**
   - **Medio Oriente & África**
3. Usuario puede:
   - Buscar moneda mediante input de búsqueda
   - Scrollear por las categorías
   - Seleccionar cualquier moneda
4. Al seleccionar, sistema aplica formato de vista previa (opcional)
5. Usuario presiona "Continuar"
6. Sistema persiste la selección en localStorage
7. Resto del onboarding usa la nueva moneda

**Notas**:
- Lista es scrollable con virtual scroll para performance
- Búsqueda filtra por código, nombre o país

### 3. Cambio de Moneda Desde ProfilePage

**Actor**: Usuario autenticado

**Flujo Principal**:
1. Usuario navega a ProfilePage
2. Usuario ve sección "Preferencias" con opción "Moneda"
3. Sistema muestra moneda actual (ej: "COP - Peso Colombiano")
4. Usuario toca la opción "Moneda"
5. Sistema abre bottom sheet con lista de monedas
6. Usuario busca o scrollea para seleccionar nueva moneda
7. Sistema muestra modal de confirmación:
   - "¿Cambiar moneda a USD?"
   - "Nota: Esto no convierte tus transacciones existentes"
8. Usuario confirma
9. Sistema cambia moneda y persiste selección
10. Sistema muestra toast: "Moneda actualizada a USD"
11. Usuario regresa a ProfilePage

**Flujos Alternativos**:

**C1: Usuario Tiene Transacciones Existentes**
- Sistema advierte que no se convertirán automáticamente
- Usuario puede cancelar o confirmar
- Si confirma, transacciones mantienen sus valores originales

**C2: Usuario Cancela Cambio**
- Sistema mantiene moneda actual
- No se realiza ningún cambio

### 4. Formateo de Cantidades

**Actor**: Usuario usando la app

**Flujo Principal**:
1. Usuario crea transacción por $1,234.56
2. Sistema formatea según moneda seleccionada:
   - COP: "$1.234" (sin decimales)
   - USD: "$1,234.56"
   - EUR: "1.234,56 €"
   - JPY: "¥1,235" (sin decimales)
3. Sistema usa `Intl.NumberFormat` con locale correcto
4. Formato se aplica en:
   - HomePage (balance, transacciones)
   - Estadísticas
   - Forms de transacciones
   - Exportación de backups

## Especificaciones UI/UX

### Pantalla: Screen3_Currency (Onboarding)

**Modificaciones Completas**:

**Header con Búsqueda**:
```tsx
<div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-950 px-6 pb-4">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Buscar moneda..."
      className="w-full rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 pl-10 pr-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#18B7B0]"
    />
  </div>
</div>
```

**Lista Agrupada con Moneda Recomendada**:
```tsx
<div className="flex-1 px-6 overflow-y-auto">
  {/* Moneda Recomendada */}
  {detectedCurrency && !searchQuery && (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        Recomendada para ti
      </h3>
      <CurrencyButton
        currency={detectedCurrency}
        selected={selected === detectedCurrency.code}
        onSelect={() => setSelected(detectedCurrency.code)}
        highlighted
      />
    </div>
  )}

  {/* América */}
  {renderCurrencyGroup('América', americaCurrencies)}

  {/* Europa */}
  {renderCurrencyGroup('Europa', europeCurrencies)}

  {/* Asia-Pacífico */}
  {renderCurrencyGroup('Asia-Pacífico', asiaCurrencies)}

  {/* Medio Oriente & África */}
  {renderCurrencyGroup('Medio Oriente & África', africaCurrencies)}

  {/* No results */}
  {filteredCurrencies.length === 0 && (
    <div className="py-12 text-center">
      <DollarSign className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700" />
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        No se encontró ninguna moneda
      </p>
    </div>
  )}
</div>
```

**Componente de Moneda**:
```tsx
<button
  type="button"
  onClick={onSelect}
  className={`flex w-full items-center justify-between rounded-xl p-3.5 shadow-sm transition-all active:scale-[0.98] ${
    highlighted
      ? 'bg-gradient-to-br from-[#18B7B0]/20 to-[#18B7B0]/10 ring-2 ring-[#18B7B0]'
      : selected
      ? 'bg-white dark:bg-gray-900 ring-2 ring-[#18B7B0]'
      : 'bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700'
  }`}
>
  <div className="flex items-center gap-3">
    <div className="text-2xl">{currency.flag}</div>
    <div className="text-left">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
        {currency.code}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {currency.name}
      </p>
    </div>
  </div>

  <div className="flex items-center gap-3">
    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
      {currency.symbol}
    </span>
    {selected && (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#18B7B0]">
        <Check className="h-4 w-4 text-white" strokeWidth={3} />
      </div>
    )}
  </div>
</button>
```

**Textos Traducibles**:
```typescript
{
  "onboarding.currency.title": "Elige tu moneda",
  "onboarding.currency.description": "Selecciona la moneda principal para tus registros financieros.",
  "onboarding.currency.search": "Buscar moneda...",
  "onboarding.currency.recommended": "Recomendada para ti",
  "onboarding.currency.regions.america": "América",
  "onboarding.currency.regions.europe": "Europa",
  "onboarding.currency.regions.asia": "Asia-Pacífico",
  "onboarding.currency.regions.africa": "Medio Oriente & África",
  "onboarding.currency.noResults": "No se encontró ninguna moneda",
  "onboarding.currency.continue": "Continuar",
  "onboarding.currency.skip": "Omitir configuración"
}
```

### Pantalla: ProfilePage - Selector de Moneda

**IMPORTANTE**: Ver [profile-preferences-section.md](profile-preferences-section.md) para el diseño completo de la sección **Preferencias** que incluye Idioma, Tema y Moneda juntos.

**Estructura**: Agregar nueva sección "Preferencias" después de "Main Menu" con 3 opciones:
1. Idioma (feature separada)
2. Tema (feature separada)
3. **Moneda** (esta feature)

**Opción de Moneda en Preferencias**:

```tsx
{/* Moneda */}
<button
  type="button"
  onClick={() => setShowCurrencyModal(true)}
  className="flex w-full items-center justify-between rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
>
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
      <DollarSign className="h-5 w-5 text-gray-500 dark:text-gray-400" />
    </div>
    <div className="text-left">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
        {t('profile.preferences.currency.label')}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {currentCurrency?.code} - {currentCurrency?.name}
      </p>
    </div>
  </div>
  <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600" />
</button>
```

**Bottom Sheet con Búsqueda** (similar a onboarding pero más compacto):

```tsx
{showCurrencyModal && (
  <div className="fixed inset-0 z-[70]">
    {/* Backdrop */}
    <button
      type="button"
      className="absolute inset-0 bg-black/50 dark:bg-black/70"
      onClick={() => setShowCurrencyModal(false)}
    />

    {/* Sheet */}
    <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl max-h-[80vh] flex flex-col">
      {/* Drag handle */}
      <div className="flex justify-center py-3">
        <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
      </div>

      {/* Header */}
      <div className="px-4 pb-3">
        <h3 className="mb-3 text-center text-lg font-semibold text-gray-900 dark:text-gray-50">
          {t('profile.preferences.currency.modal.title')}
        </h3>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('profile.preferences.currency.modal.search')}
            className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 pl-9 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#18B7B0]"
          />
        </div>
      </div>

      {/* Scrollable currency list */}
      <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        {renderCurrencyGroups()}
      </div>
    </div>
  </div>
)}
```

**Modal de Confirmación** (si hay transacciones):

```tsx
{showConfirmModal && (
  <div className="fixed inset-0 z-[80] flex items-center justify-center">
    <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={() => setShowConfirmModal(false)} />

    <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
        <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
      </div>

      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
        ¿Cambiar moneda a {selectedCurrency?.code}?
      </h3>

      <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
        Tus transacciones existentes mantendrán sus valores originales. No se realizará conversión automática.
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setShowConfirmModal(false)}
          className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirmChange}
          className="flex-1 rounded-xl bg-[#18B7B0] py-3 text-sm font-medium text-white hover:bg-[#16a39d]"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
)}
```

**Textos Traducibles**:
```typescript
{
  "profile.preferences.currency.label": "Moneda",
  "profile.preferences.currency.modal.title": "Selecciona tu moneda",
  "profile.preferences.currency.modal.search": "Buscar...",
  "profile.preferences.currency.confirmChange.title": "¿Cambiar moneda a {code}?",
  "profile.preferences.currency.confirmChange.message": "Tus transacciones existentes mantendrán sus valores originales. No se realizará conversión automática.",
  "profile.preferences.currency.changed": "Moneda actualizada"
}
```

## Especificaciones Técnicas

### Stack Tecnológico

- **Formateo**: `Intl.NumberFormat` (built-in)
- **Detección**: `Intl.DateTimeFormat` + `@capacitor/device`
- **Persistencia**: localStorage (`app_currency`)
- **State**: Zustand (currency.store.ts) o Context API
- **Search**: Fuzzy search con `fuse.js` (opcional)

### Estructura de Archivos

```
src/
├── features/
│   └── currency/
│       ├── components/
│       │   ├── CurrencyProvider.tsx     # Context provider
│       │   ├── CurrencyPicker.tsx       # Reusable picker
│       │   └── CurrencyButton.tsx       # Single currency item
│       ├── hooks/
│       │   └── useCurrency.ts           # Custom hook
│       ├── utils/
│       │   ├── currency.constants.ts    # CURRENCIES, COUNTRY_TO_CURRENCY
│       │   ├── currency.detector.ts     # Auto-detection logic
│       │   └── currency.formatters.ts   # Formatting helpers
│       └── types/
│           └── currency.types.ts        # TypeScript types
├── state/
│   └── currency.store.ts                # Zustand store (opcional)
└── App.tsx                              # Wrap con CurrencyProvider
```

### Types

**src/features/currency/types/currency.types.ts**:
```typescript
export interface Currency {
  code: string;           // ISO 4217 code (USD, EUR, etc.)
  name: string;           // Full name (Dólar Estadounidense)
  symbol: string;         // Currency symbol ($, €, ¥)
  flag: string;           // Emoji flag (🇺🇸, 🇪🇺)
  locale: string;         // Locale for formatting (en-US, es-ES)
  decimals: number;       // Number of decimal places (2, 0, etc.)
  region: CurrencyRegion; // Geographic region
}

export type CurrencyRegion =
  | 'america'
  | 'europe'
  | 'asia'
  | 'africa';

export interface CurrencyFormatOptions {
  showSymbol?: boolean;      // Show currency symbol (default: true)
  showCode?: boolean;        // Show currency code (default: false)
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}
```

### Currency Constants

**src/features/currency/utils/currency.constants.ts**:
```typescript
import type { Currency } from '../types/currency.types';

export const CURRENCIES: Currency[] = [
  // América
  {
    code: 'USD',
    name: 'Dólar Estadounidense',
    symbol: '$',
    flag: '🇺🇸',
    locale: 'en-US',
    decimals: 2,
    region: 'america',
  },
  {
    code: 'CAD',
    name: 'Dólar Canadiense',
    symbol: 'C$',
    flag: '🇨🇦',
    locale: 'en-CA',
    decimals: 2,
    region: 'america',
  },
  {
    code: 'MXN',
    name: 'Peso Mexicano',
    symbol: '$',
    flag: '🇲🇽',
    locale: 'es-MX',
    decimals: 2,
    region: 'america',
  },
  {
    code: 'BRL',
    name: 'Real Brasileño',
    symbol: 'R$',
    flag: '🇧🇷',
    locale: 'pt-BR',
    decimals: 2,
    region: 'america',
  },
  {
    code: 'ARS',
    name: 'Peso Argentino',
    symbol: '$',
    flag: '🇦🇷',
    locale: 'es-AR',
    decimals: 2,
    region: 'america',
  },
  {
    code: 'CLP',
    name: 'Peso Chileno',
    symbol: '$',
    flag: '🇨🇱',
    locale: 'es-CL',
    decimals: 0,
    region: 'america',
  },
  {
    code: 'COP',
    name: 'Peso Colombiano',
    symbol: '$',
    flag: '🇨🇴',
    locale: 'es-CO',
    decimals: 0,
    region: 'america',
  },
  // ... [AGREGAR RESTO DE 50+ MONEDAS AQUÍ]

  // Europa
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    locale: 'es-ES',
    decimals: 2,
    region: 'europe',
  },
  {
    code: 'GBP',
    name: 'Libra Esterlina',
    symbol: '£',
    flag: '🇬🇧',
    locale: 'en-GB',
    decimals: 2,
    region: 'europe',
  },
  // ... resto de Europa

  // Asia-Pacífico
  {
    code: 'CNY',
    name: 'Yuan Chino',
    symbol: '¥',
    flag: '🇨🇳',
    locale: 'zh-CN',
    decimals: 2,
    region: 'asia',
  },
  {
    code: 'JPY',
    name: 'Yen Japonés',
    symbol: '¥',
    flag: '🇯🇵',
    locale: 'ja-JP',
    decimals: 0,
    region: 'asia',
  },
  // ... resto de Asia

  // África & Medio Oriente
  {
    code: 'SAR',
    name: 'Riyal Saudí',
    symbol: '﷼',
    flag: '🇸🇦',
    locale: 'ar-SA',
    decimals: 2,
    region: 'africa',
  },
  // ... resto de África
];

export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // América
  US: 'USD',
  CA: 'CAD',
  MX: 'MXN',
  BR: 'BRL',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  PE: 'PEN',
  // ... resto de mapeo

  // Europa
  ES: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  IT: 'EUR',
  PT: 'EUR',
  // ... resto de Europa

  // Asia
  CN: 'CNY',
  JP: 'JPY',
  KR: 'KRW',
  IN: 'INR',
  // ... resto de Asia

  // África & Medio Oriente
  SA: 'SAR',
  AE: 'AED',
  ZA: 'ZAR',
  // ... resto
};

export const DEFAULT_CURRENCY = 'COP';

// Helper to get currency by code
export function getCurrencyByCode(code: string): Currency | undefined {
  return CURRENCIES.find((c) => c.code === code);
}

// Get currencies by region
export function getCurrenciesByRegion(region: CurrencyRegion): Currency[] {
  return CURRENCIES.filter((c) => c.region === region);
}
```

### Currency Detector

**src/features/currency/utils/currency.detector.ts**:
```typescript
import { COUNTRY_TO_CURRENCY, DEFAULT_CURRENCY } from './currency.constants';

/**
 * Detect currency based on device region/timezone
 */
export async function detectCurrency(): Promise<string> {
  try {
    // Method 1: Try Capacitor Device plugin (mobile)
    if ('Capacitor' in window) {
      const { Device } = await import('@capacitor/device');
      const info = await Device.getInfo();
      const countryCode = info.languageTag?.split('-')[1]; // en-US → US

      if (countryCode && COUNTRY_TO_CURRENCY[countryCode]) {
        console.log('[Currency] Detected via Capacitor:', countryCode, '→', COUNTRY_TO_CURRENCY[countryCode]);
        return COUNTRY_TO_CURRENCY[countryCode];
      }
    }

    // Method 2: Try extracting from timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const countryCode = extractCountryFromTimezone(timezone);

    if (countryCode && COUNTRY_TO_CURRENCY[countryCode]) {
      console.log('[Currency] Detected via timezone:', countryCode, '→', COUNTRY_TO_CURRENCY[countryCode]);
      return COUNTRY_TO_CURRENCY[countryCode];
    }

    // Method 3: Try extracting from navigator.language
    const navLang = navigator.language; // en-US, es-CO, etc.
    const langCountry = navLang.split('-')[1];

    if (langCountry && COUNTRY_TO_CURRENCY[langCountry]) {
      console.log('[Currency] Detected via navigator.language:', langCountry, '→', COUNTRY_TO_CURRENCY[langCountry]);
      return COUNTRY_TO_CURRENCY[langCountry];
    }

    // Fallback
    console.log('[Currency] No detection, using default:', DEFAULT_CURRENCY);
    return DEFAULT_CURRENCY;
  } catch (error) {
    console.error('[Currency] Detection error:', error);
    return DEFAULT_CURRENCY;
  }
}

/**
 * Extract country code from timezone string
 * Examples:
 *   "America/Bogota" → "CO"
 *   "Europe/Madrid" → "ES"
 *   "Asia/Tokyo" → "JP"
 */
function extractCountryFromTimezone(timezone: string): string | null {
  // Mapeo simplificado timezone → country
  const TIMEZONE_TO_COUNTRY: Record<string, string> = {
    // América
    'America/New_York': 'US',
    'America/Los_Angeles': 'US',
    'America/Chicago': 'US',
    'America/Toronto': 'CA',
    'America/Mexico_City': 'MX',
    'America/Sao_Paulo': 'BR',
    'America/Buenos_Aires': 'AR',
    'America/Santiago': 'CL',
    'America/Bogota': 'CO',
    'America/Lima': 'PE',

    // Europa
    'Europe/Madrid': 'ES',
    'Europe/Paris': 'FR',
    'Europe/Berlin': 'DE',
    'Europe/Rome': 'IT',
    'Europe/Lisbon': 'PT',
    'Europe/Amsterdam': 'NL',
    'Europe/London': 'GB',
    'Europe/Zurich': 'CH',
    'Europe/Stockholm': 'SE',
    'Europe/Oslo': 'NO',

    // Asia
    'Asia/Shanghai': 'CN',
    'Asia/Tokyo': 'JP',
    'Asia/Seoul': 'KR',
    'Asia/Kolkata': 'IN',
    'Asia/Singapore': 'SG',
    'Asia/Hong_Kong': 'HK',
    'Asia/Bangkok': 'TH',
    'Asia/Jakarta': 'ID',

    // África & Medio Oriente
    'Asia/Riyadh': 'SA',
    'Asia/Dubai': 'AE',
    'Asia/Jerusalem': 'IL',
    'Africa/Johannesburg': 'ZA',
    'Africa/Cairo': 'EG',

    // ... agregar más según sea necesario
  };

  return TIMEZONE_TO_COUNTRY[timezone] || null;
}
```

### Currency Formatters

**src/features/currency/utils/currency.formatters.ts**:
```typescript
import { getCurrencyByCode } from './currency.constants';
import type { CurrencyFormatOptions } from '../types/currency.types';

/**
 * Format amount according to currency settings
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  options: CurrencyFormatOptions = {}
): string {
  const currency = getCurrencyByCode(currencyCode);

  if (!currency) {
    console.warn('[Currency] Unknown currency code:', currencyCode);
    return amount.toString();
  }

  const {
    showSymbol = true,
    showCode = false,
    minimumFractionDigits = currency.decimals,
    maximumFractionDigits = currency.decimals,
  } = options;

  try {
    const formatted = new Intl.NumberFormat(currency.locale, {
      style: 'decimal',
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);

    let result = formatted;

    if (showSymbol && showCode) {
      result = `${currency.symbol}${formatted} ${currency.code}`;
    } else if (showSymbol) {
      result = `${currency.symbol}${formatted}`;
    } else if (showCode) {
      result = `${formatted} ${currency.code}`;
    }

    return result;
  } catch (error) {
    console.error('[Currency] Formatting error:', error);
    return `${currency.symbol}${amount}`;
  }
}

/**
 * Parse user input string to number
 * Handles different locale formats
 */
export function parseCurrencyInput(input: string): number {
  // Remove currency symbols and letters
  let cleaned = input.replace(/[^\d.,\-]/g, '');

  // Replace comma with dot for decimal (handle both formats)
  // If there are multiple dots/commas, assume last one is decimal
  const parts = cleaned.split(/[.,]/);

  if (parts.length > 2) {
    // Multiple separators: "1.234.567,89" or "1,234,567.89"
    const lastPart = parts.pop() || '0';
    cleaned = parts.join('') + '.' + lastPart;
  } else if (parts.length === 2) {
    // One separator
    const [integer, decimal] = parts;
    if (decimal.length <= 2) {
      // Likely decimal separator
      cleaned = `${integer}.${decimal}`;
    } else {
      // Likely thousands separator
      cleaned = `${integer}${decimal}`;
    }
  }

  return parseFloat(cleaned) || 0;
}

/**
 * Format input field (live formatting as user types)
 */
export function formatInputAmount(
  value: string,
  currencyCode: string
): string {
  const number = parseCurrencyInput(value);

  if (isNaN(number)) return value;

  const currency = getCurrencyByCode(currencyCode);
  if (!currency) return value;

  return formatCurrency(number, currencyCode, {
    showSymbol: false,
    showCode: false,
  });
}
```

### Currency Provider (Context API)

**src/features/currency/components/CurrencyProvider.tsx**:
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { detectCurrency } from '../utils/currency.detector';
import { getCurrencyByCode } from '../utils/currency.constants';
import type { Currency } from '../types/currency.types';

interface CurrencyContextValue {
  currency: Currency;
  currencyCode: string;
  setCurrency: (code: string) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

const STORAGE_KEY = 'app_currency';

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencyCode, setCurrencyCode] = useState<string>('COP');
  const [currency, setCurrencyObject] = useState<Currency>(
    getCurrencyByCode('COP')!
  );

  // Initialize from localStorage or auto-detect
  useEffect(() => {
    const initializeCurrency = async () => {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const curr = getCurrencyByCode(stored);
        if (curr) {
          setCurrencyCode(stored);
          setCurrencyObject(curr);
          console.log('[Currency] Loaded from storage:', stored);
          return;
        }
      }

      // Auto-detect
      const detected = await detectCurrency();
      const curr = getCurrencyByCode(detected);

      if (curr) {
        setCurrencyCode(detected);
        setCurrencyObject(curr);
        localStorage.setItem(STORAGE_KEY, detected);
        console.log('[Currency] Auto-detected:', detected);
      }
    };

    initializeCurrency();
  }, []);

  const setCurrency = (code: string) => {
    const curr = getCurrencyByCode(code);

    if (!curr) {
      console.error('[Currency] Invalid currency code:', code);
      return;
    }

    setCurrencyCode(code);
    setCurrencyObject(curr);
    localStorage.setItem(STORAGE_KEY, code);

    console.log('[Currency] Currency changed to:', code);
  };

  return (
    <CurrencyContext.Provider value={{ currency, currencyCode, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);

  if (context === undefined) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }

  return context;
}
```

### Custom Hook

**src/features/currency/hooks/useCurrency.ts** (re-export):
```typescript
export { useCurrency } from '../components/CurrencyProvider';
export { formatCurrency, parseCurrencyInput, formatInputAmount } from '../utils/currency.formatters';
export { CURRENCIES, getCurrencyByCode, getCurrenciesByRegion } from '../utils/currency.constants';
```

### App Setup

**src/App.tsx**:
```tsx
import { ThemeProvider } from '@/features/theme/components/ThemeProvider';
import { CurrencyProvider } from '@/features/currency/components/CurrencyProvider';
import { BrowserRouter } from 'react-router-dom';
import Routes from './routes';

function App() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <BrowserRouter>
          <Routes />
        </BrowserRouter>
      </CurrencyProvider>
    </ThemeProvider>
  );
}

export default App;
```

### Uso en Componentes

**Ejemplo: Transaction Amount Display**:
```tsx
import { useCurrency, formatCurrency } from '@/features/currency/hooks/useCurrency';

export function TransactionItem({ transaction }) {
  const { currencyCode } = useCurrency();

  return (
    <div className="flex items-center justify-between">
      <span>{transaction.name}</span>
      <span className="font-semibold">
        {formatCurrency(transaction.amount, currencyCode)}
      </span>
    </div>
  );
}
```

**Ejemplo: Amount Input (Form)**:
```tsx
import { useState } from 'react';
import { useCurrency, parseCurrencyInput, formatCurrency } from '@/features/currency/hooks/useCurrency';

export function AmountInput() {
  const { currency, currencyCode } = useCurrency();
  const [amount, setAmount] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers, dots, and commas
    const value = e.target.value.replace(/[^0-9.,]/g, '');
    setAmount(value);
  };

  const displayAmount = amount || '0';

  return (
    <div className="text-center">
      <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
        Monto
      </p>
      <div className="flex items-center justify-center">
        <span className="text-5xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          {currency.symbol}
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={displayAmount}
          onChange={handleChange}
          placeholder="0"
          className="w-auto min-w-[60px] max-w-[200px] border-0 bg-transparent p-0 text-center text-5xl font-semibold tracking-tight placeholder:text-gray-300 dark:placeholder:text-gray-700 focus:outline-none focus:ring-0 text-gray-900 dark:text-gray-50"
        />
      </div>
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
        {currency.code}
      </p>
    </div>
  );
}
```

## Testing

### Unit Tests

**Currency Provider Tests**:
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { CurrencyProvider, useCurrency } from '@/features/currency/components/CurrencyProvider';

function TestComponent() {
  const { currency, currencyCode, setCurrency } = useCurrency();
  return (
    <div>
      <span data-testid="code">{currencyCode}</span>
      <span data-testid="symbol">{currency.symbol}</span>
      <button onClick={() => setCurrency('USD')}>Set USD</button>
    </div>
  );
}

describe('CurrencyProvider', () => {
  it('defaults to COP', async () => {
    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('code')).toHaveTextContent('COP');
    });
  });

  it('changes currency when setCurrency is called', async () => {
    const { user } = render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    );

    await user.click(screen.getByText('Set USD'));

    expect(screen.getByTestId('code')).toHaveTextContent('USD');
    expect(screen.getByTestId('symbol')).toHaveTextContent('$');
    expect(localStorage.getItem('app_currency')).toBe('USD');
  });
});
```

**Formatter Tests**:
```typescript
import { formatCurrency, parseCurrencyInput } from '@/features/currency/utils/currency.formatters';

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('formats EUR correctly', () => {
    expect(formatCurrency(1234.56, 'EUR')).toBe('1.234,56 €');
  });

  it('formats COP without decimals', () => {
    expect(formatCurrency(1234, 'COP')).toBe('$1.234');
  });

  it('formats JPY without decimals', () => {
    expect(formatCurrency(1234, 'JPY')).toBe('¥1,234');
  });
});

describe('parseCurrencyInput', () => {
  it('parses simple number', () => {
    expect(parseCurrencyInput('1234')).toBe(1234);
  });

  it('parses number with comma decimal', () => {
    expect(parseCurrencyInput('1234,56')).toBe(1234.56);
  });

  it('parses number with dot decimal', () => {
    expect(parseCurrencyInput('1234.56')).toBe(1234.56);
  });

  it('parses number with thousands separator', () => {
    expect(parseCurrencyInput('1,234.56')).toBe(1234.56);
    expect(parseCurrencyInput('1.234,56')).toBe(1234.56);
  });
});
```

### Integration Tests

```typescript
describe('Currency change flow', () => {
  it('changes currency from onboarding and persists', async () => {
    render(
      <CurrencyProvider>
        <OnboardingProvider>
          <Screen3_Currency />
        </OnboardingProvider>
      </CurrencyProvider>
    );

    // Search for USD
    const searchInput = screen.getByPlaceholderText('Buscar moneda...');
    await userEvent.type(searchInput, 'dólar');

    // Select USD
    const usdButton = screen.getByText('USD');
    await userEvent.click(usdButton);

    // Continue
    const continueButton = screen.getByText('Continuar');
    await userEvent.click(continueButton);

    // Verify currency persisted
    expect(localStorage.getItem('app_currency')).toBe('USD');
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('User can select currency from onboarding', async ({ page }) => {
  await page.goto('/onboarding/config/3');

  // Search for Euro
  await page.fill('input[placeholder*="Buscar"]', 'euro');

  // Click EUR option
  await page.click('text=EUR');

  // Continue
  await page.click('button:has-text("Continuar")');

  // Verify persistence
  const stored = await page.evaluate(() => localStorage.getItem('app_currency'));
  expect(stored).toBe('EUR');
});

test('Currency formatting updates across app', async ({ page }) => {
  await page.goto('/');

  // Change to USD
  await page.goto('/profile');
  await page.click('text=Moneda');
  await page.click('text=USD');
  await page.click('text=Confirmar');

  // Go to home
  await page.goto('/');

  // Verify amounts show $ symbol
  await expect(page.locator('text=/\\$\\d+/')).toBeVisible();
});
```

## Dependencias

**Nuevas Librerías** (opcional):
```json
{
  "dependencies": {
    "@capacitor/device": "^5.0.6",
    "fuse.js": "^7.0.0"
  }
}
```

**Capacitor Device**: Para detección más precisa en mobile
**Fuse.js**: Para fuzzy search en lista de monedas (opcional, puede implementarse sin librería)

## Criterios de Aceptación

### Feature Completa Cuando:

- [ ] 50+ monedas soportadas con datos completos
- [ ] CurrencyProvider implementado y funcionando
- [ ] Detección automática de moneda por región funciona
- [ ] Fallback a COP cuando detección falla
- [ ] Screen3_Currency actualizado con búsqueda y grupos
- [ ] Lista de monedas scrollable con buen performance
- [ ] Búsqueda de monedas funciona (código, nombre, país)
- [ ] Moneda detectada aparece destacada en onboarding
- [ ] Cambio de moneda en onboarding persiste
- [ ] ProfilePage tiene selector de moneda funcional
- [ ] Modal de confirmación se muestra si hay transacciones
- [ ] Formateo de cantidades según moneda seleccionada
- [ ] `Intl.NumberFormat` usado correctamente por locale
- [ ] Decimales respetados según moneda (0 para COP/JPY, 2 para USD/EUR)
- [ ] Input parsing maneja diferentes formatos (1.234,56 y 1,234.56)
- [ ] Preferencia de moneda se persiste en localStorage
- [ ] Tests unitarios para formatters y provider
- [ ] Tests E2E para cambio de moneda
- [ ] Documentación de cómo agregar nuevas monedas
- [ ] Moneda persiste después de cerrar y reabrir app

## Notas de Implementación

### Fase 1: Setup y Tipos (1 día)
- Crear estructura de archivos
- Definir TypeScript types
- Crear constantes con 50+ monedas
- Documentar tabla COUNTRY_TO_CURRENCY

### Fase 2: Detección Automática (1 día)
- Implementar currency.detector.ts
- Integrar con Capacitor Device (mobile)
- Integrar con Intl.DateTimeFormat (web)
- Fallback a COP
- Testing de detección

### Fase 3: Formatters (1 día)
- Implementar formatCurrency
- Implementar parseCurrencyInput
- Implementar formatInputAmount
- Testing exhaustivo de formatos

### Fase 4: Currency Provider (1 día)
- Implementar CurrencyProvider component
- Implementar useCurrency hook
- Integración con localStorage
- Auto-detección en primera carga

### Fase 5: Actualizar Onboarding (2 días)
- Rediseñar Screen3_Currency con búsqueda
- Implementar grupos por región
- Destacar moneda recomendada
- Integrar con OnboardingContext
- Implementar búsqueda/filtrado
- Virtual scroll si es necesario

### Fase 6: ProfilePage Selector (1 día)
- Agregar opción de moneda en Preferencias
- Implementar bottom sheet selector
- Modal de confirmación si hay transacciones
- Toast de confirmación

### Fase 7: Integrar en Componentes (2-3 días)
- HomePage (balance, transacciones)
- AddEditTransactionPage (input de monto)
- StatsPage
- BudgetPage
- Exportación de backups
- Todos los displays de cantidades

### Fase 8: Testing (2 días)
- Unit tests para formatters
- Unit tests para provider
- Integration tests
- E2E tests con Playwright

### Fase 9: Polish y Documentación (1 día)
- Verificar consistencia de formateo
- Revisar UX de búsqueda
- Documentar convenciones
- Documentar cómo agregar monedas
- Code review

**Tiempo Total Estimado**: 12-15 días de desarrollo

## Riesgos y Mitigaciones

### Riesgo: Detección de País Incorrecta
**Mitigación**:
- Usar múltiples métodos de detección (Capacitor, timezone, navigator)
- Mostrar siempre moneda detectada como "recomendada" pero permitir cambio fácil
- Fallback seguro a COP

### Riesgo: Performance con Lista Grande de Monedas
**Mitigación**:
- Implementar virtual scroll si hay lag
- Lazy load de grupos
- Optimizar búsqueda (debounce, fuzzy search eficiente)

### Riesgo: Formateo Inconsistente entre Locales
**Mitigación**:
- Tests exhaustivos para cada moneda
- Usar siempre `Intl.NumberFormat`
- Documentar edge cases (JPY sin decimales, etc.)

### Riesgo: Parsing de Input Ambiguo
**Mitigación**:
- Implementar heurísticas claras (último separador = decimal)
- Permitir solo números, puntos y comas
- Mostrar preview formateado en tiempo real

### Riesgo: Confusión al Cambiar Moneda (Transacciones Existentes)
**Mitigación**:
- Modal de advertencia claro
- Documentar que no se hace conversión automática
- En futuro: ofrecer conversión manual opcional

## Extensibilidad Futura

### Multi-Currency (Múltiples Monedas en Paralelo)

**Fase 1**: Agregar campo `currency` a cada transacción:
```typescript
interface Transaction {
  id: string;
  amount: number;
  currency: string; // "COP", "USD", etc.
  // ... rest of fields
}
```

**Fase 2**: Integrar API de tasas de cambio:
- https://exchangeratesapi.io/
- https://openexchangerates.org/
- Cachear tasas en localStorage
- Actualizar diariamente

**Fase 3**: Balance Multi-Moneda:
- Mostrar balance en cada moneda
- Mostrar equivalente en moneda principal
- Gráficos con conversión automática

### Conversión Manual de Transacciones

Permitir al usuario convertir transacciones existentes:
- Seleccionar transacciones
- Ingresar tasa de cambio manual o usar API
- Aplicar conversión en batch

### Criptomonedas

Agregar soporte para:
- BTC (Bitcoin)
- ETH (Ethereum)
- USDT (Tether)
- Integración con APIs de exchanges

### Sincronización Cloud

**Tabla Supabase**: `user_preferences`
```sql
ALTER TABLE user_preferences
ADD COLUMN currency VARCHAR(3) DEFAULT 'COP';
```

## Referencias

### Documentación Técnica
- [ISO 4217 Currency Codes](https://www.iso.org/iso-4217-currency-codes.html)
- [Intl.NumberFormat MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- [Capacitor Device API](https://capacitorjs.com/docs/apis/device)

### APIs de Tasas de Cambio
- [ExchangeRates API](https://exchangeratesapi.io/)
- [Open Exchange Rates](https://openexchangerates.org/)
- [Fixer.io](https://fixer.io/)

### Herramientas
- [Currency Symbol Reference](https://www.xe.com/symbols/)
- [Locale Explorer](https://demo.icu-project.org/icu-bin/locexp)

## Changelog

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2026-01-23 | 1.0.0 | Documento inicial |
