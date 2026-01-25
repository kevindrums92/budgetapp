# Feature: Internacionalización (i18n)

## Resumen

Implementar soporte multi-idioma completo en la aplicación para soportar Español, Inglés, Portugués y Francés. El sistema detectará automáticamente el idioma del dispositivo del usuario y permitirá cambios manuales desde el onboarding y la configuración de perfil.

## Objetivos

- Soportar 4 idiomas: Español (es), Inglés (en), Portugués (pt), Francés (fr)
- Detectar automáticamente el idioma del dispositivo al primer uso
- Integrar con la pantalla de selección de idioma en el onboarding existente
- Permitir cambio de idioma desde ProfilePage
- Formatear fechas, números y moneda según el locale seleccionado
- Persistir preferencia de idioma del usuario
- Mantener fallback a español si el idioma del dispositivo no está soportado
- Preparar estructura escalable para agregar más idiomas en el futuro

## Idiomas Soportados

| Código | Idioma | Locale | Bandera | Nombre Nativo |
|--------|--------|--------|---------|---------------|
| es | Español | es-CO | 🇨🇴 | Español |
| en | Inglés | en-US | 🇺🇸 | English |
| pt | Portugués | pt-BR | 🇧🇷 | Português |
| fr | Francés | fr-FR | 🇫🇷 | Français |

**Idioma por Defecto**: Español (es)

**Detección Automática**:
- Usar `navigator.language` o `Capacitor.Device.getLanguageCode()`
- Si el código detectado empieza con `es`, `en`, `pt`, o `fr`, usar ese idioma
- Si no está soportado, usar español como fallback

## Casos de Uso

### 1. Primera Instalación - Detección Automática

**Actor**: Usuario nuevo

**Flujo Principal**:
1. Usuario abre la app por primera vez
2. Sistema detecta idioma del dispositivo mediante `navigator.language`
3. Sistema mapea código de idioma a uno de los 4 soportados:
   - `es`, `es-*` → Español
   - `en`, `en-*` → Inglés
   - `pt`, `pt-*` → Portugués
   - `fr`, `fr-*` → Francés
   - Otros → Español (fallback)
4. Sistema carga traducciones del idioma detectado
5. Sistema muestra onboarding en el idioma detectado
6. En pantalla "Elige tu idioma" (Screen1_Language), el idioma detectado aparece pre-seleccionado
7. Usuario puede confirmar o cambiar a otro idioma
8. Sistema persiste la selección en localStorage: `app_language`
9. Onboarding continúa en el idioma seleccionado

**Flujos Alternativos**:

**A1: Detección Falla**
- Sistema usa español como fallback
- Usuario puede cambiar manualmente en onboarding

**A2: Usuario Omite Configuración**
- Sistema mantiene idioma detectado automáticamente
- Usuario puede cambiar después desde ProfilePage

### 2. Cambio de Idioma Desde Onboarding

**Actor**: Usuario en proceso de onboarding

**Flujo Principal**:
1. Usuario está en pantalla "Elige tu idioma" (paso 1/5 de FirstConfig)
2. Sistema muestra 4 opciones de idioma con:
   - Bandera del país
   - Nombre del idioma en su propio idioma (nativeName)
   - Nombre traducido al idioma actual
3. Usuario selecciona un idioma diferente al actual
4. Sistema cambia inmediatamente la UI al nuevo idioma (cambio en vivo)
5. Usuario ve el cambio reflejado en:
   - Título de la pantalla
   - Descripción
   - Botones "Continuar" y "Omitir configuración"
6. Usuario presiona "Continuar"
7. Sistema persiste la selección en localStorage
8. Resto del onboarding se muestra en el nuevo idioma

**Notas**:
- El cambio de idioma es instantáneo (no requiere reload)
- La navegación a siguiente paso debe mantener el idioma seleccionado

### 3. Cambio de Idioma Desde ProfilePage

**Actor**: Usuario autenticado

**Flujo Principal**:
1. Usuario navega a ProfilePage
2. Usuario ve sección "Preferencias" con opción "Idioma"
3. Sistema muestra idioma actual (ej: "Español")
4. Usuario toca la opción "Idioma"
5. Sistema abre modal o drawer con lista de 4 idiomas
6. Usuario selecciona nuevo idioma
7. Sistema cambia inmediatamente toda la UI al nuevo idioma
8. Sistema persiste la selección
9. Sistema muestra toast de confirmación: "Idioma actualizado"
10. Usuario regresa a ProfilePage (ahora en nuevo idioma)

**Flujos Alternativos**:

**C1: Usuario Cancela Cambio**
- Usuario cierra modal sin seleccionar
- Sistema mantiene idioma actual

### 4. Usuario Regresa a la App

**Actor**: Usuario existente

**Flujo Principal**:
1. Usuario abre la app
2. Sistema lee preferencia de idioma de localStorage: `app_language`
3. Sistema carga traducciones del idioma guardado
4. App se muestra en el idioma preferido del usuario
5. Formateo de fechas/números usa el locale correspondiente

**Flujos Alternativos**:

**D1: Preferencia No Existe (Usuario Legacy)**
- Sistema detecta idioma del dispositivo
- Sistema aplica detección automática (Caso de Uso 1)
- Sistema persiste la detección como preferencia

### 5. Sincronización Cloud (Futuro)

**Actor**: Usuario con cuenta cloud

**Flujo Principal**:
1. Usuario cambia idioma en dispositivo A
2. Sistema sincroniza preferencia a Supabase (`user_preferences` table)
3. Usuario abre app en dispositivo B
4. Sistema carga preferencia de idioma desde cloud
5. App usa idioma sincronizado en lugar de detección local

**Nota**: Este caso de uso es futuro (post-launch) pero la estructura debe prepararse para ello.

## Especificaciones UI/UX

### Pantalla: Screen1_Language (Onboarding)

**Modificaciones**:

**Lista de Idiomas** (actualizar constante `LANGUAGES`):
```tsx
const LANGUAGES = [
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    locale: 'es-CO',
    flag: '🇨🇴'
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    locale: 'en-US',
    flag: '🇺🇸'
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    locale: 'pt-BR',
    flag: '🇧🇷'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    locale: 'fr-FR',
    flag: '🇫🇷'
  },
];
```

**Cambios en el Componente**:
1. Importar `useTranslation` de `react-i18next`
2. Reemplazar textos hardcodeados con `t('key')`
3. Al cambiar idioma, llamar `i18n.changeLanguage(code)` inmediatamente
4. Eliminar nota "Más idiomas estarán disponibles próximamente"

**Textos Traducibles**:
```typescript
{
  "onboarding.language.title": "Elige tu idioma",
  "onboarding.language.description": "Selecciona el idioma en el que prefieres usar SmartSpend. Podrás cambiarlo después desde tu perfil.",
  "onboarding.language.continue": "Continuar",
  "onboarding.language.skip": "Omitir configuración"
}
```

**Behavior**:
- Al montar componente, detectar idioma del dispositivo y pre-seleccionar
- Cambio de idioma es instantáneo (sin esperar a "Continuar")
- Al presionar "Continuar", persistir selección y navegar

### Pantalla: ProfilePage - Selector de Idioma

**IMPORTANTE**: Ver [profile-preferences-section.md](profile-preferences-section.md) para el diseño completo de la sección **Preferencias** que incluye Idioma, Tema y Moneda juntos.

**Estructura**: Agregar nueva sección "Preferencias" después de "Main Menu" con 3 opciones:
1. **Idioma** (esta feature)
2. Tema (feature separada)
3. Moneda (feature separada)

**Opción de Idioma en Preferencias**:

```tsx
{/* Preferencias */}
<div className="space-y-4">
  <h2 className="text-sm font-semibold text-gray-700">
    {t('profile.preferences.title')}
  </h2>

  {/* Idioma */}
  <button
    type="button"
    onClick={() => setShowLanguageModal(true)}
    className="flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm hover:bg-gray-50 transition-colors"
  >
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
        <Languages className="h-5 w-5 text-gray-500" />
      </div>
      <div className="text-left">
        <p className="text-sm font-medium text-gray-900">
          {t('profile.preferences.language.label')}
        </p>
        <p className="text-xs text-gray-500">
          {getCurrentLanguageName()}
        </p>
      </div>
    </div>
    <ChevronRight className="h-5 w-5 text-gray-300" />
  </button>
</div>
```

**Modal de Selección de Idioma** (Bottom Sheet):

```tsx
{showLanguageModal && (
  <div className="fixed inset-0 z-[70]">
    {/* Backdrop */}
    <button
      type="button"
      className="absolute inset-0 bg-black/50"
      onClick={() => setShowLanguageModal(false)}
    />

    {/* Sheet */}
    <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white shadow-2xl">
      {/* Drag handle */}
      <div className="flex justify-center py-3">
        <div className="h-1 w-10 rounded-full bg-gray-300" />
      </div>

      {/* Content */}
      <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <h3 className="mb-4 text-center text-lg font-semibold text-gray-900">
          {t('profile.preferences.language.modal.title')}
        </h3>

        <div className="space-y-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex w-full items-center justify-between rounded-xl p-4 transition-all ${
                currentLanguage === lang.code
                  ? 'bg-[#18B7B0]/10 ring-2 ring-[#18B7B0]'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lang.flag}</span>
                <span className="font-medium text-gray-900">
                  {lang.nativeName}
                </span>
              </div>
              {currentLanguage === lang.code && (
                <Check className="h-5 w-5 text-[#18B7B0]" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
)}
```

**Textos Traducibles**:
```typescript
{
  "profile.preferences.title": "Preferencias",
  "profile.preferences.language.label": "Idioma",
  "profile.preferences.language.modal.title": "Selecciona tu idioma",
  "profile.preferences.language.changed": "Idioma actualizado"
}
```

### Formateo de Fechas y Números

**Fechas**:
- Usar `date.toLocaleDateString(locale)` en lugar de hardcoded `'es-CO'`
- Ejemplo:
  ```typescript
  const { i18n } = useTranslation();
  const locale = i18n.language === 'es' ? 'es-CO' :
                 i18n.language === 'en' ? 'en-US' :
                 i18n.language === 'pt' ? 'pt-BR' :
                 'fr-FR';

  date.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
  ```

**Números y Moneda**:
- Continuar usando formato colombiano para moneda (punto como separador de miles)
- Opcionalmente, usar `Intl.NumberFormat(locale)` para otros números

**Días Relativos** ("hoy", "ayer"):
- Traducir con i18next: `t('date.today')`, `t('date.yesterday')`

## Especificaciones Técnicas

### Stack Tecnológico

- **i18n Library**: `react-i18next` (estándar de facto para React)
- **Core**: `i18next`
- **Detección**: `i18next-browser-languagedetector`
- **Backend**: `i18next-http-backend` (para cargar traducciones async)
- **Persistencia**: localStorage (`app_language`)
- **Capacitor**: `@capacitor/device` para detección nativa en mobile

### Estructura de Archivos

```
src/
├── i18n/
│   ├── config.ts                    # Configuración de i18next
│   ├── locales/
│   │   ├── es/
│   │   │   ├── common.json          # Textos comunes (botones, etc.)
│   │   │   ├── onboarding.json      # Textos de onboarding
│   │   │   ├── home.json            # Textos de HomePage
│   │   │   ├── transactions.json    # Textos de transacciones
│   │   │   ├── categories.json      # Textos de categorías
│   │   │   ├── budget.json          # Textos de presupuestos
│   │   │   ├── stats.json           # Textos de estadísticas
│   │   │   ├── profile.json         # Textos de perfil
│   │   │   ├── backup.json          # Textos de backup
│   │   │   └── errors.json          # Mensajes de error
│   │   ├── en/
│   │   │   ├── common.json
│   │   │   ├── onboarding.json
│   │   │   ├── home.json
│   │   │   └── ... (mismos archivos)
│   │   ├── pt/
│   │   │   └── ... (mismos archivos)
│   │   └── fr/
│   │       └── ... (mismos archivos)
│   ├── types.ts                     # TypeScript types para traducciones
│   └── utils/
│       ├── detectLanguage.ts        # Detección de idioma del dispositivo
│       ├── formatters.ts            # Helpers para formateo de fecha/número
│       └── constants.ts             # Constantes (LANGUAGES, etc.)
├── hooks/
│   └── useLanguage.ts               # Custom hook para cambio de idioma
└── components/
    └── LanguageSelector.tsx         # Componente reutilizable de selector
```

### Configuración de i18next

**src/i18n/config.ts**:
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translations
import esCommon from './locales/es/common.json';
import esOnboarding from './locales/es/onboarding.json';
import esHome from './locales/es/home.json';
// ... rest of es imports

import enCommon from './locales/en/common.json';
import enOnboarding from './locales/en/onboarding.json';
import enHome from './locales/en/home.json';
// ... rest of en imports

import ptCommon from './locales/pt/common.json';
// ... rest of pt imports

import frCommon from './locales/fr/common.json';
// ... rest of fr imports

const resources = {
  es: {
    common: esCommon,
    onboarding: esOnboarding,
    home: esHome,
    transactions: esTransactions,
    categories: esCategories,
    budget: esBudget,
    stats: esStats,
    profile: esProfile,
    backup: esBackup,
    errors: esErrors,
  },
  en: {
    common: enCommon,
    onboarding: enOnboarding,
    home: enHome,
    transactions: enTransactions,
    categories: enCategories,
    budget: enBudget,
    stats: enStats,
    profile: enProfile,
    backup: enBackup,
    errors: enErrors,
  },
  pt: {
    common: ptCommon,
    onboarding: ptOnboarding,
    home: ptHome,
    transactions: ptTransactions,
    categories: ptCategories,
    budget: ptBudget,
    stats: ptStats,
    profile: ptProfile,
    backup: ptBackup,
    errors: ptErrors,
  },
  fr: {
    common: frCommon,
    onboarding: frOnboarding,
    home: frHome,
    transactions: frTransactions,
    categories: frCategories,
    budget: frBudget,
    stats: frStats,
    profile: frProfile,
    backup: frBackup,
    errors: frErrors,
  },
};

// Custom language detector con fallback manual
const customDetector = {
  name: 'customDetector',
  lookup() {
    // 1. Check localStorage first
    const stored = localStorage.getItem('app_language');
    if (stored && ['es', 'en', 'pt', 'fr'].includes(stored)) {
      return stored;
    }

    // 2. Check navigator.language
    const browserLang = navigator.language.split('-')[0];
    if (['es', 'en', 'pt', 'fr'].includes(browserLang)) {
      return browserLang;
    }

    // 3. Fallback to Spanish
    return 'es';
  },
  cacheUserLanguage(lng: string) {
    localStorage.setItem('app_language', lng);
  },
};

i18n
  .use({
    type: 'languageDetector',
    detect: customDetector.lookup,
    cacheUserLanguage: customDetector.cacheUserLanguage,
  })
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    defaultNS: 'common',
    ns: [
      'common',
      'onboarding',
      'home',
      'transactions',
      'categories',
      'budget',
      'stats',
      'profile',
      'backup',
      'errors',
    ],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false, // Disable suspense to avoid flicker
    },
    detection: {
      order: ['customDetector'],
      caches: ['localStorage'],
    },
  });

export default i18n;
```

**main.tsx** (importar config):
```typescript
import './i18n/config'; // IMPORTANT: Import before React
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
```

### Custom Hook: useLanguage

**src/hooks/useLanguage.ts**:
```typescript
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  locale: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    locale: 'es-CO',
    flag: '🇨🇴'
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    locale: 'en-US',
    flag: '🇺🇸'
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    locale: 'pt-BR',
    flag: '🇧🇷'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    locale: 'fr-FR',
    flag: '🇫🇷'
  },
];

export function useLanguage() {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language || 'es';

  const currentLanguageData = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === currentLanguage
  ) || SUPPORTED_LANGUAGES[0];

  const changeLanguage = useCallback(
    async (langCode: string) => {
      try {
        await i18n.changeLanguage(langCode);
        localStorage.setItem('app_language', langCode);
        console.log('[i18n] Language changed to:', langCode);
      } catch (error) {
        console.error('[i18n] Error changing language:', error);
      }
    },
    [i18n]
  );

  const getLocale = useCallback(() => {
    return currentLanguageData.locale;
  }, [currentLanguageData]);

  return {
    currentLanguage,
    currentLanguageData,
    languages: SUPPORTED_LANGUAGES,
    changeLanguage,
    getLocale,
  };
}
```

### Helper: Formateo de Fechas

**src/i18n/utils/formatters.ts**:
```typescript
import { SUPPORTED_LANGUAGES } from '@/hooks/useLanguage';

export function getLocaleFromLanguage(lang: string): string {
  const language = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
  return language?.locale || 'es-CO';
}

export function formatDate(
  date: Date | string,
  language: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const locale = getLocaleFromLanguage(language);
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return dateObj.toLocaleDateString(locale, options);
}

export function formatDateTime(
  date: Date | string,
  language: string
): string {
  const locale = getLocaleFromLanguage(language);
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return dateObj.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(
  num: number,
  language: string,
  options?: Intl.NumberFormatOptions
): string {
  const locale = getLocaleFromLanguage(language);
  return new Intl.NumberFormat(locale, options).format(num);
}

// Mantener formato colombiano para moneda (independiente del idioma)
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
```

### Estructura de Archivos de Traducción

**Ejemplo: src/i18n/locales/es/common.json**:
```json
{
  "buttons": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "continue": "Continuar",
    "back": "Volver",
    "confirm": "Confirmar",
    "close": "Cerrar",
    "ok": "OK",
    "yes": "Sí",
    "no": "No",
    "add": "Agregar",
    "create": "Crear",
    "update": "Actualizar",
    "restore": "Restaurar",
    "download": "Descargar",
    "upload": "Subir",
    "export": "Exportar",
    "import": "Importar"
  },
  "date": {
    "today": "Hoy",
    "yesterday": "Ayer",
    "tomorrow": "Mañana",
    "thisWeek": "Esta semana",
    "thisMonth": "Este mes",
    "lastMonth": "Mes pasado"
  },
  "errors": {
    "generic": "Ocurrió un error inesperado",
    "networkError": "Error de conexión",
    "notFound": "No encontrado",
    "unauthorized": "No autorizado",
    "forbidden": "Acceso denegado"
  },
  "loading": "Cargando...",
  "noData": "No hay datos disponibles",
  "search": "Buscar...",
  "filter": "Filtrar"
}
```

**Ejemplo: src/i18n/locales/es/onboarding.json**:
```json
{
  "language": {
    "title": "Elige tu idioma",
    "description": "Selecciona el idioma en el que prefieres usar SmartSpend. Podrás cambiarlo después desde tu perfil.",
    "continue": "Continuar",
    "skip": "Omitir configuración"
  },
  "theme": {
    "title": "Tema de la app",
    "description": "Elige el tema visual de la aplicación",
    "light": "Claro",
    "dark": "Oscuro",
    "system": "Sistema"
  },
  "currency": {
    "title": "Moneda principal",
    "description": "Selecciona la moneda que usarás principalmente"
  },
  "categories": {
    "title": "Categorías iniciales",
    "description": "Selecciona las categorías que más utilizas"
  },
  "complete": {
    "title": "¡Todo listo!",
    "description": "Tu app está configurada y lista para usar",
    "start": "Comenzar"
  }
}
```

**Ejemplo: src/i18n/locales/es/home.json**:
```json
{
  "header": {
    "greeting": "Hola",
    "subtitle": "Gestiona tus finanzas"
  },
  "balance": {
    "title": "Balance Total",
    "income": "Ingresos",
    "expenses": "Gastos",
    "net": "Neto"
  },
  "filters": {
    "all": "Todo",
    "today": "Hoy",
    "week": "Semana",
    "month": "Mes",
    "year": "Año"
  },
  "transactions": {
    "title": "Movimientos Recientes",
    "empty": "No hay movimientos recientes",
    "add": "Agregar movimiento"
  },
  "scheduled": {
    "title": "Transacciones Programadas",
    "nextDue": "Próximo vencimiento"
  }
}
```

**Ejemplo: src/i18n/locales/en/common.json**:
```json
{
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "continue": "Continue",
    "back": "Back",
    "confirm": "Confirm",
    "close": "Close",
    "ok": "OK",
    "yes": "Yes",
    "no": "No",
    "add": "Add",
    "create": "Create",
    "update": "Update",
    "restore": "Restore",
    "download": "Download",
    "upload": "Upload",
    "export": "Export",
    "import": "Import"
  },
  "date": {
    "today": "Today",
    "yesterday": "Yesterday",
    "tomorrow": "Tomorrow",
    "thisWeek": "This week",
    "thisMonth": "This month",
    "lastMonth": "Last month"
  },
  "errors": {
    "generic": "An unexpected error occurred",
    "networkError": "Connection error",
    "notFound": "Not found",
    "unauthorized": "Unauthorized",
    "forbidden": "Access denied"
  },
  "loading": "Loading...",
  "noData": "No data available",
  "search": "Search...",
  "filter": "Filter"
}
```

### TypeScript Types

**src/i18n/types.ts**:
```typescript
import 'react-i18next';

// Import types from translation files
import type common from './locales/es/common.json';
import type onboarding from './locales/es/onboarding.json';
import type home from './locales/es/home.json';
import type transactions from './locales/es/transactions.json';
import type categories from './locales/es/categories.json';
import type budget from './locales/es/budget.json';
import type stats from './locales/es/stats.json';
import type profile from './locales/es/profile.json';
import type backup from './locales/es/backup.json';
import type errors from './locales/es/errors.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      onboarding: typeof onboarding;
      home: typeof home;
      transactions: typeof transactions;
      categories: typeof categories;
      budget: typeof budget;
      stats: typeof stats;
      profile: typeof profile;
      backup: typeof backup;
      errors: typeof errors;
    };
  }
}
```

### Integración con OnboardingContext

**Modificar: src/features/onboarding/OnboardingContext.tsx**:

```typescript
const setLanguage = useCallback((language: string) => {
  setState((prev) => ({
    ...prev,
    selections: {
      ...prev.selections,
      language,
    },
  }));

  // Aplicar el cambio de idioma inmediatamente en i18next
  i18n.changeLanguage(language);

  console.log('[Onboarding] Language selected:', language);
}, []);
```

### Uso en Componentes

**Ejemplo en Screen1_Language.tsx**:
```tsx
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';

export default function Screen1_Language() {
  const { t } = useTranslation('onboarding');
  const { languages, currentLanguage, changeLanguage } = useLanguage();
  const { state, setLanguage } = useOnboarding();
  const [selected, setSelected] = useState(
    state.selections.language || currentLanguage
  );

  const handleLanguageSelect = async (code: string) => {
    setSelected(code);
    await changeLanguage(code); // Cambio inmediato en UI
  };

  const handleContinue = () => {
    setLanguage(selected); // Guardar en contexto de onboarding
    navigate('/onboarding/config/2', { replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      {/* ... progress bar ... */}

      <div className="flex flex-col items-center px-6 pt-12 pb-8">
        {/* ... icon ... */}

        <h1 className="mb-3 text-center text-3xl font-extrabold leading-tight tracking-tight text-gray-900">
          {t('language.title')}
        </h1>

        <p className="max-w-md text-center text-base leading-relaxed text-gray-600">
          {t('language.description')}
        </p>
      </div>

      {/* Language options */}
      <div className="flex-1 px-6">
        <div className="space-y-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleLanguageSelect(lang.code)}
              className={`flex w-full items-center justify-between rounded-2xl bg-white p-4 shadow-sm transition-all active:scale-[0.98] ${
                selected === lang.code
                  ? 'ring-2 ring-[#18B7B0]'
                  : 'ring-1 ring-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{lang.flag}</div>
                <div className="text-left">
                  <p className="text-base font-semibold text-gray-900">
                    {lang.nativeName}
                  </p>
                  <p className="text-sm text-gray-500">{lang.name}</p>
                </div>
              </div>

              {selected === lang.code && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18B7B0]">
                  <Check className="h-5 w-5 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-8">
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-2xl bg-[#18B7B0] py-4 text-base font-semibold text-white shadow-lg shadow-[#18B7B0]/30 transition-all active:scale-[0.98]"
          >
            {t('language.continue')}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="flex w-full items-center justify-center py-3 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            {t('language.skip')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Ejemplo en HomePage**:
```tsx
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const { t } = useTranslation('home');

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="pb-28 pt-4">
        <div className="px-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('header.greeting')}
          </h1>
          <p className="text-sm text-gray-600">
            {t('header.subtitle')}
          </p>
        </div>

        {/* Balance Card */}
        <div className="mt-6 px-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              {t('balance.title')}
            </p>
            {/* ... rest of balance card ... */}
          </div>
        </div>
      </main>
    </div>
  );
}
```

**Ejemplo con formateo de fechas**:
```tsx
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/i18n/utils/formatters';

export default function TransactionItem({ transaction }) {
  const { i18n } = useTranslation();

  const formattedDate = formatDate(
    transaction.date,
    i18n.language,
    { weekday: 'short', day: 'numeric', month: 'short' }
  );

  return (
    <div>
      <p>{transaction.name}</p>
      <p className="text-xs text-gray-500">{formattedDate}</p>
    </div>
  );
}
```

## Testing

### Unit Tests

**Componentes con Traducciones**:
```typescript
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import Screen1_Language from './Screen1_Language';

describe('Screen1_Language', () => {
  it('renders language selection screen in Spanish', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Screen1_Language />
      </I18nextProvider>
    );

    expect(screen.getByText('Elige tu idioma')).toBeInTheDocument();
  });

  it('changes language when option is selected', async () => {
    const { user } = render(
      <I18nextProvider i18n={i18n}>
        <Screen1_Language />
      </I18nextProvider>
    );

    const englishButton = screen.getByText('English');
    await user.click(englishButton);

    // Verify language changed
    expect(i18n.language).toBe('en');
  });
});
```

**Custom Hook Tests**:
```typescript
import { renderHook, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { useLanguage } from '@/hooks/useLanguage';

describe('useLanguage', () => {
  it('returns current language', () => {
    const wrapper = ({ children }) => (
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    );

    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.currentLanguage).toBe('es');
  });

  it('changes language', async () => {
    const wrapper = ({ children }) => (
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    );

    const { result } = renderHook(() => useLanguage(), { wrapper });

    await act(async () => {
      await result.current.changeLanguage('en');
    });

    expect(result.current.currentLanguage).toBe('en');
    expect(localStorage.getItem('app_language')).toBe('en');
  });
});
```

**Formatters Tests**:
```typescript
import { formatDate, formatNumber, getLocaleFromLanguage } from '@/i18n/utils/formatters';

describe('formatters', () => {
  it('returns correct locale for language', () => {
    expect(getLocaleFromLanguage('es')).toBe('es-CO');
    expect(getLocaleFromLanguage('en')).toBe('en-US');
    expect(getLocaleFromLanguage('pt')).toBe('pt-BR');
    expect(getLocaleFromLanguage('fr')).toBe('fr-FR');
  });

  it('formats date in Spanish', () => {
    const date = new Date('2026-01-23');
    const formatted = formatDate(date, 'es', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    expect(formatted).toContain('ene'); // enero abbreviated
  });

  it('formats date in English', () => {
    const date = new Date('2026-01-23');
    const formatted = formatDate(date, 'en', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    expect(formatted).toContain('Jan'); // January abbreviated
  });
});
```

### Integration Tests

```typescript
describe('Language change flow', () => {
  it('changes language from onboarding and persists', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <OnboardingProvider>
          <Screen1_Language />
        </OnboardingProvider>
      </I18nextProvider>
    );

    // Select English
    const englishButton = screen.getByText('English');
    await userEvent.click(englishButton);

    // Verify UI changed to English
    expect(screen.getByText('Choose your language')).toBeInTheDocument();

    // Continue to next screen
    const continueButton = screen.getByText('Continue');
    await userEvent.click(continueButton);

    // Verify language persisted
    expect(localStorage.getItem('app_language')).toBe('en');
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('User can change language from onboarding', async ({ page }) => {
  await page.goto('/onboarding/config/1');

  // Verify default is Spanish
  await expect(page.locator('h1')).toContainText('Elige tu idioma');

  // Click English option
  await page.click('text=English');

  // Verify UI changed to English
  await expect(page.locator('h1')).toContainText('Choose your language');

  // Continue
  await page.click('button:has-text("Continue")');

  // Verify next screen is in English
  await expect(page).toHaveURL('/onboarding/config/2');
});

test('User can change language from profile', async ({ page }) => {
  await page.goto('/profile');

  // Open language selector
  await page.click('text=Idioma');

  // Modal opens
  await expect(page.locator('text=Selecciona tu idioma')).toBeVisible();

  // Select Portuguese
  await page.click('text=Português');

  // Verify UI changed
  await expect(page.locator('text=Idioma')).not.toBeVisible();
  await expect(page.locator('text=Idioma')).toBeVisible(); // Portuguese version
});

test('Language persists after page reload', async ({ page }) => {
  await page.goto('/onboarding/config/1');

  // Change to French
  await page.click('text=Français');
  await page.click('button:has-text("Continuer")');

  // Reload page
  await page.reload();

  // Verify still in French
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
});
```

## Dependencias

**Nuevas Librerías**:
```json
{
  "dependencies": {
    "i18next": "^23.7.7",
    "react-i18next": "^13.5.0",
    "i18next-browser-languagedetector": "^7.2.0"
  }
}
```

**Opcional (para carga lazy de traducciones)**:
```json
{
  "dependencies": {
    "i18next-http-backend": "^2.4.2"
  }
}
```

## Migración de Textos Existentes

### Estrategia de Migración

**Fase 1: Crear Estructura de Archivos**
- Crear carpeta `src/i18n/` con subcarpetas
- Crear archivos JSON para cada namespace (common, home, etc.)
- Configurar i18next

**Fase 2: Extraer Textos Hardcodeados**
- Script automatizado para encontrar todos los strings hardcodeados
- Crear archivo temporal con todos los textos encontrados
- Agrupar por componente/feature

**Fase 3: Crear Traducciones en Español (Base)**
- Mover todos los textos a archivos JSON de español
- Usar estructura jerárquica (nested keys)
- Definir naming convention: `feature.component.element`

**Fase 4: Traducir a Inglés**
- Traducir manualmente o usar servicio de traducción
- Revisión de traducciones por nativo

**Fase 5: Traducir a Portugués y Francés**
- Traducción profesional recomendada
- Revisión de terminología técnica

**Fase 6: Reemplazar en Componentes**
- Reemplazar strings hardcodeados con `t('key')`
- Agregar namespace cuando sea necesario: `t('home:balance.title')`
- Actualizar tests

### Script de Extracción (Helper)

**scripts/extract-strings.js**:
```javascript
// Script para encontrar strings hardcodeados en JSX
// Usar como punto de partida para migración manual
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const pattern = /["']([A-ZÁÉÍÓÚÑ][^"']{2,}?)["']/g;

function extractStrings(dir) {
  const files = fs.readdirSync(dir);
  const strings = [];

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      strings.push(...extractStrings(filePath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const matches = content.match(pattern);

      if (matches) {
        strings.push({
          file: filePath.replace(srcDir, ''),
          strings: matches.map((m) => m.slice(1, -1)),
        });
      }
    }
  });

  return strings;
}

const extracted = extractStrings(srcDir);
console.log(JSON.stringify(extracted, null, 2));
```

### Ejemplo de Migración

**Antes**:
```tsx
<button className="...">
  Guardar
</button>

<h1>Balance Total</h1>

<p className="text-sm text-gray-500">
  No hay movimientos recientes
</p>
```

**Después**:
```tsx
import { useTranslation } from 'react-i18next';

function Component() {
  const { t } = useTranslation(['common', 'home']);

  return (
    <>
      <button className="...">
        {t('common:buttons.save')}
      </button>

      <h1>{t('home:balance.title')}</h1>

      <p className="text-sm text-gray-500">
        {t('home:transactions.empty')}
      </p>
    </>
  );
}
```

## Criterios de Aceptación

### Feature Completa Cuando:

- [ ] i18next configurado correctamente con 4 idiomas
- [ ] Archivos JSON de traducción creados para todos los namespaces
- [ ] Español: 100% de textos traducidos (base)
- [ ] Inglés: 100% de textos traducidos
- [ ] Portugués: 100% de textos traducidos
- [ ] Francés: 100% de textos traducidos
- [ ] Detección automática de idioma del dispositivo funciona
- [ ] Onboarding Screen1_Language actualizado con 4 idiomas
- [ ] Cambio de idioma en onboarding es instantáneo (sin reload)
- [ ] ProfilePage tiene selector de idioma funcional
- [ ] Cambio de idioma desde ProfilePage es instantáneo
- [ ] Preferencia de idioma se persiste en localStorage
- [ ] Formateo de fechas usa locale correcto según idioma
- [ ] Formateo de números usa locale correcto (donde aplique)
- [ ] Moneda mantiene formato colombiano (independiente del idioma)
- [ ] No hay textos hardcodeados en español en componentes
- [ ] TypeScript types configurados para autocompletado de keys
- [ ] Hook `useLanguage` funciona correctamente
- [ ] Tests unitarios para componentes traducidos
- [ ] Tests de integración para cambio de idioma
- [ ] Tests E2E para flujo completo de cambio de idioma
- [ ] Documentación de cómo agregar nuevas traducciones
- [ ] Idioma persiste después de cerrar y reabrir app
- [ ] No hay flicker al cargar idioma

## Notas de Implementación

### Fase 1: Setup y Configuración (2 días)
- Instalar dependencias (i18next, react-i18next)
- Crear estructura de carpetas `src/i18n/`
- Configurar i18next en `config.ts`
- Crear custom detector con fallback
- Configurar TypeScript types
- Importar en `main.tsx`

### Fase 2: Crear Archivos de Traducción (3-4 días)
- Crear 40 archivos JSON (10 namespaces × 4 idiomas)
- Extraer todos los textos en español (script + manual)
- Organizar en estructura jerárquica
- Traducir a inglés (manual o servicio)
- Traducir a portugués (servicio recomendado)
- Traducir a francés (servicio recomendado)
- Revisión de traducciones

### Fase 3: Custom Hook y Utilities (1 día)
- Crear `useLanguage` hook
- Crear helpers de formateo (formatters.ts)
- Crear constantes (SUPPORTED_LANGUAGES)
- Exportar desde barrel file

### Fase 4: Actualizar Onboarding (1 día)
- Actualizar Screen1_Language con 4 idiomas
- Integrar con i18next
- Implementar cambio instantáneo
- Traducir resto de pantallas de onboarding
- Actualizar OnboardingContext

### Fase 5: Migrar Componentes Core (3-4 días)
- HomePage
- AddEditTransactionPage
- CategoriesPage
- ProfilePage (+ agregar selector de idioma)
- BudgetPage
- StatsPage
- BackupPage
- Modals y componentes compartidos

### Fase 6: Formateo y Locales (1 día)
- Actualizar todos los usos de `toLocaleDateString`
- Reemplazar `'es-CO'` hardcoded con locale dinámico
- Actualizar date utils
- Verificar formateo de moneda

### Fase 7: Testing (2-3 días)
- Unit tests para componentes
- Tests para useLanguage hook
- Tests para formatters
- Integration tests
- E2E tests con Playwright

### Fase 8: Polish y Documentación (1 día)
- Verificar que no queden textos hardcodeados
- Revisar calidad de traducciones
- Documentar cómo agregar nuevas traducciones
- Documentar convenciones de naming de keys
- Code review

**Tiempo Total Estimado**: 14-18 días de desarrollo

## Riesgos y Mitigaciones

### Riesgo: Traducciones de Baja Calidad
**Mitigación**:
- Usar servicio profesional de traducción (no Google Translate)
- Revisión por hablantes nativos de cada idioma
- Considerar contexto financiero específico
- Iterar basado en feedback de usuarios

### Riesgo: Textos Hardcodeados Olvidados
**Mitigación**:
- Script de detección de strings hardcodeados
- Code review exhaustivo
- Lint rule para detectar strings sin `t()`
- Tests E2E en cada idioma

### Riesgo: Keys Duplicadas o Inconsistentes
**Mitigación**:
- Convención clara de naming: `namespace:feature.component.element`
- Barrel files para constantes
- TypeScript types para autocompletado
- Documentación de estructura

### Riesgo: Flicker al Cambiar Idioma
**Mitigación**:
- `useSuspense: false` en config
- Pre-cargar todos los namespaces
- Usar traducciones inline (no lazy load)

### Riesgo: Formateo Inconsistente
**Mitigación**:
- Centralizar formateo en `formatters.ts`
- No usar `toLocaleDateString` directamente en componentes
- Tests para cada locale

## Extensibilidad Futura

### Agregar Nuevos Idiomas

1. Agregar entrada en `SUPPORTED_LANGUAGES`:
```typescript
{
  code: 'de',
  name: 'German',
  nativeName: 'Deutsch',
  locale: 'de-DE',
  flag: '🇩🇪'
}
```

2. Crear carpeta `src/i18n/locales/de/` con todos los archivos JSON

3. Importar en `config.ts`:
```typescript
import deCommon from './locales/de/common.json';
// ... rest of imports

resources: {
  // ... existing languages
  de: {
    common: deCommon,
    // ... rest of namespaces
  }
}
```

4. Actualizar TypeScript types si es necesario

5. Agregar tests para el nuevo idioma

### Sincronización Cloud (Futuro)

**Tabla Supabase**: `user_preferences`
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  language VARCHAR(5) DEFAULT 'es',
  theme VARCHAR(10) DEFAULT 'light',
  currency VARCHAR(3) DEFAULT 'COP',
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Flujo**:
- Al cambiar idioma, sincronizar a Supabase
- Al login, cargar preferencia de cloud
- Prioridad: Cloud > LocalStorage > Detección automática

### Translation Management Tools (Futuro)

- Integrar con **Lokalise** o **Crowdin** para gestión de traducciones
- Permitir contribuciones de comunidad
- Versionado de traducciones
- A/B testing de textos

## Referencias

### Documentación Técnica
- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)

### Servicios de Traducción
- [DeepL API](https://www.deepl.com/pro-api) (recomendado para calidad)
- [Google Cloud Translation](https://cloud.google.com/translate)
- [Lokalise](https://lokalise.com/) (translation management)

### Herramientas
- [i18n Ally VSCode Extension](https://marketplace.visualstudio.com/items?itemName=Lokalise.i18n-ally)
- [BabelEdit](https://www.codeandweb.com/babeledit) (translation editor)

## Changelog

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2026-01-23 | 1.0.0 | Documento inicial |
