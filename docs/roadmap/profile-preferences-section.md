# ProfilePage - Sección de Preferencias

Este documento define la estructura completa de la sección "Preferencias" en ProfilePage que incluye las opciones de Idioma, Tema y Moneda.

## Estructura Visual

```
ProfilePage
├── User Account Card (si está logueado)
├── Login Button (si es guest)
├── Main Menu Section
│   ├── Categorías
│   ├── Programadas
│   └── Backup & Restore
├── ⭐ Preferencias Section (NUEVA)
│   ├── Idioma
│   ├── Tema
│   └── Moneda
└── Footer (Logout + Version)
```

## Código Completo

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  FolderOpen,
  ChevronRight,
  Shield,
  Repeat,
  RefreshCw,
  Languages,   // Para Idioma
  Palette,     // Para Tema
  DollarSign,  // Para Moneda
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "@/features/theme/hooks/useTheme";
import { useCurrency } from "@/features/currency/hooks/useCurrency";

// Importar modals
import LanguageSelector from "@/features/i18n/components/LanguageSelector";
import ThemeSelector from "@/features/theme/components/ThemeSelector";
import CurrencySelector from "@/features/currency/components/CurrencySelector";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'profile']);

  // Feature hooks
  const { currentLanguageData } = useLanguage();
  const { theme } = useTheme();
  const { currency } = useCurrency();

  // Modal states
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  // ... existing code (user, cloudMode, auth, etc.) ...

  // Helper: Get theme display name
  const getThemeName = () => {
    switch (theme) {
      case 'light':
        return t('profile:preferences.theme.light');
      case 'dark':
        return t('profile:preferences.theme.dark');
      case 'system':
        return t('profile:preferences.theme.system');
      default:
        return t('profile:preferences.theme.system');
    }
  };

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-28">
      {/* User Account Card - Only for logged in users */}
      {isLoggedIn && (
        <div className="px-4 pt-6 pb-4">
          {/* ... existing user card code ... */}
        </div>
      )}

      {/* Login button for guests */}
      {!isLoggedIn && (
        <div className="px-4 pt-6 pb-4">
          {/* ... existing login button code ... */}
        </div>
      )}

      {/* Main Menu Section */}
      <div className={`px-4 ${isLoggedIn ? 'pt-4' : 'pt-6'}`}>
        <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <MenuItem
            icon={<FolderOpen size={20} />}
            label={t('profile:menu.categories')}
            onClick={() => navigate("/categories")}
          />
          <MenuItem
            icon={<Repeat size={20} />}
            label={t('profile:menu.scheduled')}
            onClick={() => navigate("/scheduled")}
          />
          <MenuItem
            icon={<Shield size={20} />}
            label={t('profile:menu.backup')}
            onClick={() => navigate("/backup")}
          />
        </div>
      </div>

      {/* ⭐ Preferencias Section (NEW) */}
      <div className="px-4 pt-4">
        <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t('profile:preferences.title')}
        </h2>

        <div className="space-y-3">
          {/* Idioma */}
          <button
            type="button"
            onClick={() => setShowLanguageModal(true)}
            className="flex w-full items-center justify-between rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Languages className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                  {t('profile:preferences.language.label')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {currentLanguageData.nativeName}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600" />
          </button>

          {/* Tema */}
          <button
            type="button"
            onClick={() => setShowThemeModal(true)}
            className="flex w-full items-center justify-between rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Palette className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                  {t('profile:preferences.theme.label')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getThemeName()}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600" />
          </button>

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
                  {t('profile:preferences.currency.label')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {currency.code} - {currency.name}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600" />
          </button>
        </div>
      </div>

      {/* Footer with logout and version */}
      <div className="px-4 pt-8 pb-4">
        {/* ... existing footer code ... */}
      </div>

      {/* Modals */}
      <LanguageSelector
        open={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />

      <ThemeSelector
        open={showThemeModal}
        onClose={() => setShowThemeModal(false)}
      />

      <CurrencySelector
        open={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
      />
    </div>
  );
}

// MenuItem component remains the same
type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  showBadge?: boolean;
};

function MenuItem({ icon, label, sublabel, onClick, showBadge }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-50">{label}</span>
        {sublabel && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{sublabel}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showBadge && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            !
          </span>
        )}
        <ChevronRight size={18} className="text-gray-400 dark:text-gray-600" />
      </div>
    </button>
  );
}
```

## Traducciones Necesarias

**src/i18n/locales/es/profile.json**:
```json
{
  "menu": {
    "categories": "Categorías",
    "scheduled": "Programadas",
    "backup": "Backup & Restore"
  },
  "preferences": {
    "title": "Preferencias",
    "language": {
      "label": "Idioma",
      "changed": "Idioma actualizado"
    },
    "theme": {
      "label": "Tema",
      "light": "Claro",
      "dark": "Oscuro",
      "system": "Automático",
      "changed": "Tema actualizado"
    },
    "currency": {
      "label": "Moneda",
      "changed": "Moneda actualizada"
    }
  },
  "account": {
    "syncStatus": {
      "local": "Modo Local",
      "offline": "Sin Conexión",
      "syncing": "Sincronizando",
      "synced": "Cloud Sync Activo"
    }
  },
  "logout": "Cerrar sesión",
  "loggingOut": "Cerrando sesión...",
  "loginWithGoogle": "Continuar con Google",
  "noConnection": "Sin conexión"
}
```

**src/i18n/locales/en/profile.json**:
```json
{
  "menu": {
    "categories": "Categories",
    "scheduled": "Scheduled",
    "backup": "Backup & Restore"
  },
  "preferences": {
    "title": "Preferences",
    "language": {
      "label": "Language",
      "changed": "Language updated"
    },
    "theme": {
      "label": "Theme",
      "light": "Light",
      "dark": "Dark",
      "system": "System",
      "changed": "Theme updated"
    },
    "currency": {
      "label": "Currency",
      "changed": "Currency updated"
    }
  },
  "account": {
    "syncStatus": {
      "local": "Local Mode",
      "offline": "Offline",
      "syncing": "Syncing",
      "synced": "Cloud Sync Active"
    }
  },
  "logout": "Log Out",
  "loggingOut": "Logging out...",
  "loginWithGoogle": "Continue with Google",
  "noConnection": "No connection"
}
```

## Componentes de Selector

Cada feature debe proporcionar un componente reutilizable de selector:

### 1. LanguageSelector

**src/features/i18n/components/LanguageSelector.tsx**:
```tsx
import { useState } from "react";
import { Check, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage, SUPPORTED_LANGUAGES } from "@/hooks/useLanguage";

interface LanguageSelectorProps {
  open: boolean;
  onClose: () => void;
}

export default function LanguageSelector({ open, onClose }: LanguageSelectorProps) {
  const { t } = useTranslation(['common', 'profile']);
  const { currentLanguage, changeLanguage } = useLanguage();

  if (!open) return null;

  const handleSelect = async (code: string) => {
    await changeLanguage(code);
    onClose();

    // Show toast (opcional)
    // toast.success(t('profile:preferences.language.changed'));
  };

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl max-h-[80vh] flex flex-col">
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 flex items-center gap-3">
          <Languages className="h-6 w-6 text-[#18B7B0]" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {t('profile:preferences.language.label')}
          </h3>
        </div>

        {/* Language list */}
        <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <div className="space-y-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`flex w-full items-center justify-between rounded-xl p-4 transition-all ${
                  currentLanguage === lang.code
                    ? 'bg-[#18B7B0]/10 ring-2 ring-[#18B7B0]'
                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-50">
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
  );
}
```

### 2. ThemeSelector

**src/features/theme/components/ThemeSelector.tsx**:
```tsx
import { Sun, Moon, Smartphone, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/features/theme/hooks/useTheme";

interface ThemeSelectorProps {
  open: boolean;
  onClose: () => void;
}

type ThemeOption = 'light' | 'dark' | 'system';

const THEME_OPTIONS: Array<{
  value: ThemeOption;
  icon: typeof Sun;
}> = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Smartphone },
];

export default function ThemeSelector({ open, onClose }: ThemeSelectorProps) {
  const { t } = useTranslation(['common', 'profile', 'onboarding']);
  const { theme, setTheme } = useTheme();

  if (!open) return null;

  const handleSelect = (value: ThemeOption) => {
    setTheme(value);
    onClose();

    // Show toast (opcional)
    // toast.success(t('profile:preferences.theme.changed'));
  };

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl">
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Content */}
        <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <h3 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-gray-50">
            {t('profile:preferences.theme.label')}
          </h3>

          <div className="space-y-2">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full items-center gap-4 rounded-xl p-4 transition-all ${
                    isSelected
                      ? 'bg-[#18B7B0]/10 ring-2 ring-[#18B7B0]'
                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      isSelected ? 'bg-[#18B7B0]' : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                      }`}
                      strokeWidth={2.5}
                    />
                  </div>

                  <div className="flex-1 text-left">
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
                      {t(`onboarding:theme.${option.value}.title`)}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {t(`onboarding:theme.${option.value}.description`)}
                    </p>
                  </div>

                  {isSelected && (
                    <Check className="h-5 w-5 text-[#18B7B0]" strokeWidth={3} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 3. CurrencySelector

**src/features/currency/components/CurrencySelector.tsx**:
```tsx
import { useState, useMemo } from "react";
import { Search, Check, DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency, CURRENCIES, getCurrenciesByRegion } from "@/features/currency/hooks/useCurrency";

interface CurrencySelectorProps {
  open: boolean;
  onClose: () => void;
}

export default function CurrencySelector({ open, onClose }: CurrencySelectorProps) {
  const { t } = useTranslation(['common', 'profile', 'onboarding']);
  const { currencyCode, setCurrency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');

  if (!open) return null;

  const filteredCurrencies = useMemo(() => {
    if (!searchQuery) return CURRENCIES;

    const query = searchQuery.toLowerCase();
    return CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelect = (code: string) => {
    setCurrency(code);
    onClose();

    // Show toast (opcional)
    // toast.success(t('profile:preferences.currency.changed'));
  };

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={onClose}
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
            {t('profile:preferences.currency.label')}
          </h3>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common:search')}
              className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 pl-9 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#18B7B0]"
            />
          </div>
        </div>

        {/* Currency list */}
        <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          {filteredCurrencies.length === 0 ? (
            <div className="py-12 text-center">
              <DollarSign className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700" />
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                {t('onboarding:currency.noResults')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCurrencies.map((currency) => (
                <button
                  key={currency.code}
                  type="button"
                  onClick={() => handleSelect(currency.code)}
                  className={`flex w-full items-center justify-between rounded-xl p-3.5 shadow-sm transition-all active:scale-[0.98] ${
                    currencyCode === currency.code
                      ? 'bg-[#18B7B0]/10 ring-2 ring-[#18B7B0]'
                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                    {currencyCode === currency.code && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#18B7B0]">
                        <Check className="h-4 w-4 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Notas de Implementación

### Orden de Implementación Sugerido

1. **Idioma** (primero, porque afecta los textos de todo)
2. **Tema** (segundo, afecta apariencia visual)
3. **Moneda** (tercero, afecta formateo de números)

### Integración

- Cada selector debe ser un componente independiente y reutilizable
- Los selectores deben poder cerrarse con:
  - Click en backdrop
  - Botón de cerrar
  - Después de seleccionar opción
- Los cambios deben ser instantáneos (sin reload)
- Opcional: Agregar toast/notification de confirmación

### Testing

Probar que:
- Los 3 botones en Preferencias abren sus respectivos modals
- Los modals se cierran correctamente
- Los cambios se persisten en localStorage
- Los cambios se reflejan inmediatamente en toda la UI
- La navegación funciona correctamente después de cambios
