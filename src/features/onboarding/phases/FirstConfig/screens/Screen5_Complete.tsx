/**
 * Screen5_Complete
 * Pantalla final de First Config: Todo listo
 */

import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { markOnboardingComplete } from '../../../utils/onboarding.helpers';
import { ONBOARDING_KEYS } from '../../../utils/onboarding.constants';
import { useOnboarding } from '../../../OnboardingContext';
import { useBudgetStore } from '@/state/budget.store';
import { DEFAULT_CATEGORIES } from '@/constants/categories/default-categories';
import { getCategoryDisplayName } from '@/utils/getCategoryDisplayName';
import { upsertCloudState } from '@/services/cloudState.service';
import { supabase } from '@/lib/supabaseClient';
import FullscreenLayout from '@/shared/components/layout/FullscreenLayout';
import ProgressDots from '../../../components/ProgressDots';

export default function Screen5_Complete() {
  const { t } = useTranslation(['onboarding', 'common']);
  const navigate = useNavigate();
  const { state } = useOnboarding();
  const addCategory = useBudgetStore((s) => s.addCategory);

  const handleComplete = async () => {
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
            // Obtener el nombre traducido según el idioma seleccionado
            const translatedName = getCategoryDisplayName(categoryDef.name, t);

            addCategory({
              name: translatedName,
              icon: categoryDef.icon,
              color: categoryDef.color,
              type: categoryDef.type,
              groupId: categoryDef.groupId,
            });
            console.log('[ConfigScreen] Created category:', translatedName);
          }
        }
        // Las categorías custom (custom-XXX) ya fueron creadas en AddEditCategoryPage
      });
    } else {
      // Si no hay categorías seleccionadas (skip), crear TODAS las categorías por defecto
      console.log('[ConfigScreen] No categories selected (skipped), creating all default categories');

      DEFAULT_CATEGORIES.forEach((categoryDef) => {
        const translatedName = getCategoryDisplayName(categoryDef.name, t);

        addCategory({
          name: translatedName,
          icon: categoryDef.icon,
          color: categoryDef.color,
          type: categoryDef.type,
          groupId: categoryDef.groupId,
        });
        console.log('[ConfigScreen] Created category:', translatedName);
      });
    }

    // ✅ CRITICAL: Push categories to cloud immediately before marking onboarding complete
    // This ensures that if user logs out/clears localStorage, cloud data exists
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      try {
        console.log('[ConfigScreen] Pushing categories to cloud immediately');
        const getSnapshot = useBudgetStore.getState().getSnapshot;
        await upsertCloudState(getSnapshot());
        console.log('[ConfigScreen] Categories pushed to cloud successfully');
      } catch (err) {
        console.error('[ConfigScreen] Failed to push categories to cloud:', err);
        // Continue anyway - CloudSyncGate will retry later
      }
    }

    // Set permanent device flag (ensures Welcome is skipped on future app resets)
    localStorage.setItem(ONBOARDING_KEYS.DEVICE_INITIALIZED, 'true');
    markOnboardingComplete();
    navigate('/', { replace: true });
  };

  // Calcular el número de categorías seleccionadas
  const selectedCategoriesCount = state.selections.selectedCategories?.length || DEFAULT_CATEGORIES.length;

  return (
    <FullscreenLayout
      headerCenter={<ProgressDots total={5} current={5} />}
      contentClassName="pb-8 md:pb-12 flex flex-col"
      ctaButton={
        <div>
          <button
            type="button"
            onClick={handleComplete}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98]"
          >
            <span>{t('complete.start')}</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>

          <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            {t('complete.note')}
          </p>
        </div>
      }
    >
      {/* Header */}
      <div className="flex flex-col items-center pb-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
          <Sparkles size={40} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="mb-3 text-center text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
          {t('complete.title')}
        </h1>

        <p className="max-w-md text-center text-base leading-relaxed text-gray-600 dark:text-gray-400">
          {t('complete.subtitle')}
        </p>
      </div>

      {/* Configuration summary */}
      <div className="mb-6 rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('complete.configTitle')}
        </h2>

        <div className="space-y-3">
          {/* Language */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('complete.language')}</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {state.selections.language === 'es' ? t('complete.languageEs') : t('complete.languageEn')}
            </span>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('complete.theme')}</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {state.selections.theme === 'light'
                ? t('complete.themeLight')
                : state.selections.theme === 'dark'
                ? t('complete.themeDark')
                : t('complete.themeSystem')}
            </span>
          </div>

          {/* Currency */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('complete.currency')}</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {state.selections.currency || 'COP'}
            </span>
          </div>

          {/* Categories */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('complete.categories')}</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {selectedCategoriesCount} {t('complete.categoriesSelected')}
            </span>
          </div>
        </div>
      </div>

      {/* Features preview */}
      <div className="space-y-2 flex-1">
        <div className="rounded-xl bg-white dark:bg-gray-900 p-3.5 shadow-sm">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{t('complete.feature1')}</p>
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
            {t('complete.feature1Desc')}
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-900 p-3.5 shadow-sm">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{t('complete.feature2')}</p>
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
            {t('complete.feature2Desc')}
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-900 p-3.5 shadow-sm">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{t('complete.feature3')}</p>
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
            {t('complete.feature3Desc')}
          </p>
        </div>
      </div>
    </FullscreenLayout>
  );
}
