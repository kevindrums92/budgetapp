/**
 * Screen4_Categories
 * Pantalla final de First Config: Categorías (grid layout)
 * Usuario selecciona categorías en un grid de 2 columnas y al confirmar se completa el onboarding
 */

import { Plus, Check, ArrowRight } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DEFAULT_CATEGORIES } from '@/constants/categories/default-categories';
import { getCategoryDisplayName } from '@/utils/getCategoryDisplayName';
import * as icons from 'lucide-react';
import { useOnboarding } from '../../../OnboardingContext';
import { markOnboardingComplete } from '../../../utils/onboarding.helpers';
import { ONBOARDING_KEYS } from '../../../utils/onboarding.constants';
import { useBudgetStore } from '@/state/budget.store';
import FullscreenLayout from '@/shared/components/layout/FullscreenLayout';

function kebabToPascal(str: string): string {
  return str
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

type TabType = 'expense' | 'income';

export default function Screen4_Categories() {
  const { t } = useTranslation(['onboarding', 'common']);
  const navigate = useNavigate();
  const { state, setSelectedCategories } = useOnboarding();
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const addCategory = useBudgetStore((s) => s.addCategory);
  const [activeTab, setActiveTab] = useState<TabType>('expense');
  const isSyncingFromContext = useRef(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const allIds = DEFAULT_CATEGORIES.map((_, idx) => `default-${idx}`);
    if (state.selections.selectedCategories !== undefined) {
      return new Set(state.selections.selectedCategories);
    }
    return new Set(allIds);
  });

  // Default categories filtered by active tab
  const defaultCategoriesForTab = useMemo(
    () => DEFAULT_CATEGORIES.filter((c) => c.type === activeTab),
    [activeTab]
  );

  // Custom categories already created in store (e.g. from "Crear nueva")
  const customCategoriesForTab = useMemo(
    () => categoryDefinitions.filter((c) => c.type === activeTab),
    [categoryDefinitions, activeTab]
  );

  // Total selected count (defaults selected + customs already in store)
  const selectedCount = useMemo(() => {
    const selectedDefaults = defaultCategoriesForTab.filter((cat) => {
      const idx = DEFAULT_CATEGORIES.indexOf(cat);
      return selectedIds.has(`default-${idx}`);
    }).length;

    // Also count selected defaults from the OTHER tab
    const otherTab = activeTab === 'expense' ? 'income' : 'expense';
    const otherDefaults = DEFAULT_CATEGORIES.filter((c) => c.type === otherTab);
    const selectedOtherDefaults = otherDefaults.filter((cat) => {
      const idx = DEFAULT_CATEGORIES.indexOf(cat);
      return selectedIds.has(`default-${idx}`);
    }).length;

    return selectedDefaults + selectedOtherDefaults + categoryDefinitions.length;
  }, [selectedIds, defaultCategoriesForTab, activeTab, categoryDefinitions]);

  // Sync local state FROM context
  useEffect(() => {
    if (state.selections.selectedCategories !== undefined && !isSyncingFromContext.current) {
      const contextIds = state.selections.selectedCategories;
      const currentIds = Array.from(selectedIds);

      if (
        contextIds.length !== currentIds.length ||
        !contextIds.every((id) => selectedIds.has(id))
      ) {
        isSyncingFromContext.current = true;
        setSelectedIds(new Set(contextIds));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selections.selectedCategories]);

  // Sync local state TO context
  useEffect(() => {
    if (isSyncingFromContext.current) {
      isSyncingFromContext.current = false;
      return;
    }
    setSelectedCategories(Array.from(selectedIds));
  }, [selectedIds, setSelectedCategories]);

  const toggleCategory = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCreateNew = () => {
    navigate(`/category/new?returnTo=onboarding&type=${activeTab}`);
  };

  const handleComplete = () => {
    console.log('[Categories] Completing onboarding → App');

    const selectedCategoryIds = Array.from(selectedIds);

    if (selectedCategoryIds.length > 0) {
      console.log('[Categories] Creating selected categories:', selectedCategoryIds.length);

      selectedCategoryIds.forEach((catId) => {
        if (catId.startsWith('default-')) {
          const index = parseInt(catId.replace('default-', ''));
          const categoryDef = DEFAULT_CATEGORIES[index];

          if (categoryDef) {
            const translatedName = getCategoryDisplayName(categoryDef.name, t);
            addCategory({
              name: translatedName,
              icon: categoryDef.icon,
              color: categoryDef.color,
              type: categoryDef.type,
              groupId: categoryDef.groupId,
            });
          }
        }
      });
    } else {
      console.log('[Categories] No categories selected, creating all defaults');

      DEFAULT_CATEGORIES.forEach((categoryDef) => {
        const translatedName = getCategoryDisplayName(categoryDef.name, t);
        addCategory({
          name: translatedName,
          icon: categoryDef.icon,
          color: categoryDef.color,
          type: categoryDef.type,
          groupId: categoryDef.groupId,
        });
      });
    }

    // Onboarding es 100% local. CloudSyncGate se encarga de
    // sesión anónima + sincronización cuando el usuario llegue al Home.
    localStorage.setItem(ONBOARDING_KEYS.DEVICE_INITIALIZED, 'true');
    markOnboardingComplete();
    navigate('/', { replace: true });
  };

  return (
    <FullscreenLayout
      contentClassName="pb-8 md:pb-12 flex flex-col"
      ctaButton={
        <button
          type="button"
          data-testid="complete-onboarding-button"
          onClick={handleComplete}
          className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98]"
        >
          <span>{t('categories.continueWith', { count: selectedCount })}</span>
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
      }
    >
      {/* Header */}
      <div className="flex flex-col items-center pb-6">
        <h1 className="mb-3 text-center text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
          {t('categories.title')}
        </h1>

        <p className="max-w-md text-center text-base leading-relaxed text-gray-600 dark:text-gray-400">
          {t('categories.description')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('expense')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'expense'
              ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
              : 'bg-white text-gray-600 dark:bg-gray-900 dark:text-gray-400'
          }`}
        >
          {t('categories.expenses')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('income')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'income'
              ? 'bg-emerald-500 text-white'
              : 'bg-white text-gray-600 dark:bg-gray-900 dark:text-gray-400'
          }`}
        >
          {t('categories.income')}
        </button>
      </div>

      {/* Categories grid */}
      <div className="flex-1">
        <div className="grid grid-cols-2 gap-3">
          {/* Default categories */}
          {defaultCategoriesForTab.map((category) => {
            const catId = `default-${DEFAULT_CATEGORIES.indexOf(category)}`;
            const isSelected = selectedIds.has(catId);
            const IconComponent = icons[kebabToPascal(category.icon) as keyof typeof icons] as React.ComponentType<{ className?: string; style?: React.CSSProperties }> | undefined;
            const categoryName = getCategoryDisplayName(category.name, t);

            return (
              <button
                key={catId}
                type="button"
                onClick={() => toggleCategory(catId)}
                className={`relative flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'border-emerald-500 bg-white dark:bg-gray-900'
                    : 'border-transparent bg-white opacity-50 dark:bg-gray-900'
                }`}
              >
                {/* Check badge */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                )}

                {/* Icon */}
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: category.color + '18' }}
                >
                  {IconComponent && (
                    <IconComponent className="h-6 w-6" style={{ color: category.color }} />
                  )}
                </div>

                {/* Name */}
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-50">
                  {categoryName}
                </span>
              </button>
            );
          })}

          {/* Custom categories already in store */}
          {customCategoriesForTab.map((category) => {
            const IconComponent = icons[kebabToPascal(category.icon) as keyof typeof icons] as React.ComponentType<{ className?: string; style?: React.CSSProperties }> | undefined;

            return (
              <div
                key={category.id}
                className="relative flex flex-col items-center gap-2.5 rounded-2xl border-2 border-emerald-500 bg-white p-4 dark:bg-gray-900"
              >
                {/* Check badge (always selected) */}
                <div className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </div>

                {/* Icon */}
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: category.color + '18' }}
                >
                  {IconComponent && (
                    <IconComponent className="h-6 w-6" style={{ color: category.color }} />
                  )}
                </div>

                {/* Name */}
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-50">
                  {category.name}
                </span>
              </div>
            );
          })}

          {/* "Crear nueva" card */}
          <button
            type="button"
            onClick={handleCreateNew}
            className="flex flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed border-gray-300 p-4 transition-all active:scale-[0.98] dark:border-gray-600"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
              <Plus className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {t('categories.createNew')}
            </span>
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-200">
            {t('categories.note')}
          </p>
        </div>
      </div>
    </FullscreenLayout>
  );
}
