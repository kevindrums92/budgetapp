/**
 * Screen4_Complete
 * Pantalla final de First Config: Todo listo
 */

import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { markOnboardingComplete } from '../../../utils/onboarding.helpers';
import { useOnboarding } from '../../../OnboardingContext';
import { useBudgetStore } from '@/state/budget.store';
import { DEFAULT_CATEGORIES } from '@/constants/categories/default-categories';

export default function Screen4_Complete() {
  const navigate = useNavigate();
  const { state } = useOnboarding();
  const addCategory = useBudgetStore((s) => s.addCategory);

  const handleComplete = () => {
    console.log('[ConfigScreen] Completing onboarding → App');

    // Crear las categorías seleccionadas
    const selectedCategoryIds = state.selections.selectedCategories || [];

    if (selectedCategoryIds.length > 0) {
      console.log('[ConfigScreen] Creating selected categories:', selectedCategoryIds.length);

      selectedCategoryIds.forEach((catId) => {
        // Solo crear categorías por defecto (las custom ya están creadas)
        if (catId.startsWith('default-')) {
          // catId es "default-X" donde X es el índice en DEFAULT_CATEGORIES
          const index = parseInt(catId.replace('default-', ''));
          const categoryDef = DEFAULT_CATEGORIES[index];

          if (categoryDef) {
            addCategory({
              name: categoryDef.name,
              icon: categoryDef.icon,
              color: categoryDef.color,
              type: categoryDef.type,
              groupId: categoryDef.groupId,
            });
            console.log('[ConfigScreen] Created category:', categoryDef.name);
          }
        }
        // Las categorías custom (custom-XXX) ya fueron creadas en AddEditCategoryPage
      });
    }

    markOnboardingComplete();
    navigate('/', { replace: true });
  };

  // Calcular el número de categorías seleccionadas
  const selectedCategoriesCount = state.selections.selectedCategories?.length || DEFAULT_CATEGORIES.length;

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      {/* Progress - All complete */}
      <div className="flex gap-1.5 px-6 pt-4">
        <div className="h-1 flex-1 rounded-full bg-[#18B7B0]" />
        <div className="h-1 flex-1 rounded-full bg-[#18B7B0]" />
        <div className="h-1 flex-1 rounded-full bg-[#18B7B0]" />
        <div className="h-1 flex-1 rounded-full bg-[#18B7B0]" />
        <div className="h-1 flex-1 rounded-full bg-[#18B7B0]" />
      </div>

      {/* Header */}
      <div className="flex flex-col items-center px-6 pt-12 pb-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
          <Sparkles size={40} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="mb-3 text-center text-3xl font-extrabold leading-tight tracking-tight text-gray-900">
          ¡Todo listo para
          <br />
          comenzar!
        </h1>

        <p className="max-w-md text-center text-base leading-relaxed text-gray-600">
          Ya puedes empezar a gestionar tus finanzas de forma inteligente.
        </p>
      </div>

      {/* Configuration summary */}
      <div className="flex-1 px-6">
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Tu configuración
          </h2>

          <div className="space-y-3">
            {/* Language */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                  <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
                </div>
                <span className="text-sm text-gray-600">Idioma</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {state.selections.language === 'es' ? 'Español' : 'English'}
              </span>
            </div>

            {/* Theme */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                  <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
                </div>
                <span className="text-sm text-gray-600">Tema</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {state.selections.theme === 'light'
                  ? 'Claro'
                  : state.selections.theme === 'dark'
                  ? 'Oscuro'
                  : 'Automático'}
              </span>
            </div>

            {/* Currency */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                  <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
                </div>
                <span className="text-sm text-gray-600">Moneda</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {state.selections.currency || 'COP'}
              </span>
            </div>

            {/* Categories */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                  <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
                </div>
                <span className="text-sm text-gray-600">Categorías</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {selectedCategoriesCount} seleccionadas
              </span>
            </div>
          </div>
        </div>

        {/* Features preview */}
        <div className="space-y-2">
          <div className="rounded-xl bg-white p-3.5 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">📊 Registra tus movimientos</p>
            <p className="mt-0.5 text-xs text-gray-600">
              Agrega ingresos y gastos fácilmente
            </p>
          </div>

          <div className="rounded-xl bg-white p-3.5 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">💰 Crea presupuestos</p>
            <p className="mt-0.5 text-xs text-gray-600">
              Controla tus gastos por categorías
            </p>
          </div>

          <div className="rounded-xl bg-white p-3.5 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">📈 Analiza tus datos</p>
            <p className="mt-0.5 text-xs text-gray-600">
              Visualiza tus patrones de gasto
            </p>
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="px-6 pb-8">
        <button
          type="button"
          onClick={handleComplete}
          className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98]"
        >
          <span>Comenzar a usar SmartSpend</span>
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>

        <p className="mt-4 text-center text-xs text-gray-500">
          Podrás modificar estas opciones desde tu perfil en cualquier momento
        </p>
      </div>
    </div>
  );
}
