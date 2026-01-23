/**
 * Screen4_Categories
 * Pantalla 4 de First Config: Categorías por defecto
 * Usuario puede ver y pre-seleccionar las categorías que quiere
 */

import { FolderKanban, Check } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_CATEGORIES } from '@/constants/categories/default-categories';
import * as icons from 'lucide-react';
import { useOnboarding } from '../../../OnboardingContext';
import { useBudgetStore } from '@/state/budget.store';

// Helper para convertir kebab-case a PascalCase
function kebabToPascal(str: string): string {
  return str
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

type TabType = 'expense' | 'income';

export default function Screen4_Categories() {
  const navigate = useNavigate();
  const { state, setSelectedCategories } = useOnboarding();
  const categoryGroups = useBudgetStore((s) => s.categoryGroups);
  const [activeTab, setActiveTab] = useState<TabType>('expense');
  const isSyncingFromContext = useRef(false); // Flag para evitar loop infinito
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    // Inicializar con todas las categorías seleccionadas
    const allIds = DEFAULT_CATEGORIES.map((_, idx) => `default-${idx}`);
    // Si hay categorías guardadas en el contexto, usar esas (incluso si está vacío)
    if (state.selections.selectedCategories !== undefined) {
      return new Set(state.selections.selectedCategories);
    }
    return new Set(allIds);
  });

  // Filtrar categorías por defecto según el tab activo
  const allCategories = DEFAULT_CATEGORIES.filter((c) => c.type === activeTab);

  // Agrupar categorías por grupo
  const categoriesByGroup = useMemo(() => {
    const groups = categoryGroups.filter((g) => g.type === activeTab);
    const result: Array<{ group: typeof categoryGroups[0]; categories: typeof allCategories }> = [];

    for (const group of groups) {
      const cats = allCategories.filter((c) => c.groupId === group.id);

      if (cats.length > 0) {
        result.push({ group, categories: cats });
      }
    }

    // Ordenar grupos alfabéticamente
    result.sort((a, b) => a.group.name.localeCompare(b.group.name, 'es'));

    return result;
  }, [allCategories, categoryGroups, activeTab]);

  // [1] Sincronizar el estado local DESDE el contexto cuando el contexto cambia
  useEffect(() => {
    if (state.selections.selectedCategories !== undefined && !isSyncingFromContext.current) {
      const contextIds = state.selections.selectedCategories;
      const currentIds = Array.from(selectedIds);

      // Solo actualizar si son diferentes
      if (
        contextIds.length !== currentIds.length ||
        !contextIds.every((id) => selectedIds.has(id))
      ) {
        console.log('[Categories] Syncing from context:', contextIds.length, 'categories');
        isSyncingFromContext.current = true;
        setSelectedIds(new Set(contextIds));
      }
    }
  }, [state.selections.selectedCategories]);

  // [2] Sincronizar el estado local CON el contexto cada vez que selectedIds cambie localmente
  // IMPORTANTE: Solo si el cambio NO vino del contexto (evitar loop)
  useEffect(() => {
    if (isSyncingFromContext.current) {
      // Reset flag después de sincronizar desde contexto
      isSyncingFromContext.current = false;
      return;
    }

    // Si llegamos aquí, el cambio vino del usuario (toggle)
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

  const handleContinue = () => {
    navigate('/onboarding/config/5', { replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      {/* Progress */}
      <div className="flex gap-1.5 px-6 pt-4">
        <div className="h-1 flex-1 rounded-full bg-[#18B7B0]" />
        <div className="h-1 flex-1 rounded-full bg-[#18B7B0]" />
        <div className="h-1 flex-1 rounded-full bg-[#18B7B0]" />
        <div className="h-1 flex-1 rounded-full bg-[#18B7B0]" />
        <div className="h-1 flex-1 rounded-full bg-gray-200" />
      </div>

      {/* Header */}
      <div className="flex flex-col items-center px-6 pt-12 pb-6">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#18B7B0] to-[#0F8580] shadow-lg">
          <FolderKanban size={40} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="mb-3 text-center text-3xl font-extrabold leading-tight tracking-tight text-gray-900">
          Categorías por defecto
        </h1>

        <p className="max-w-md text-center text-base leading-relaxed text-gray-600">
          Selecciona las categorías que quieres usar. Puedes deseleccionar las que no necesites.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-6 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('expense')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'expense'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-600'
          }`}
        >
          Gastos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('income')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'income'
              ? 'bg-emerald-500 text-white'
              : 'bg-white text-gray-600'
          }`}
        >
          Ingresos
        </button>
      </div>

      {/* Categories list */}
      <div className="flex-1 overflow-y-auto px-6 pb-32">
        <div className="space-y-4 pb-4">
          {categoriesByGroup.map(({ group, categories }) => (
            <div key={group.id}>
              {/* Group header */}
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {group.name}
              </h3>

              {/* Categories in this group */}
              <div className="space-y-2">
                {categories.map((category) => {
                  const catId = `default-${DEFAULT_CATEGORIES.indexOf(category)}`;
                  const isSelected = selectedIds.has(catId);
                  const IconComponent = icons[kebabToPascal(category.icon) as keyof typeof icons] as any;

                  return (
                    <button
                      key={catId}
                      type="button"
                      onClick={() => toggleCategory(catId)}
                      className={`flex w-full items-center justify-between rounded-xl bg-white p-3 shadow-sm transition-all active:scale-[0.98] ${
                        !isSelected ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: category.color + '20' }}
                        >
                          {IconComponent && (
                            <IconComponent className="h-5 w-5" style={{ color: category.color }} />
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {category.name}
                        </span>
                      </div>

                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                          isSelected
                            ? 'bg-emerald-500'
                            : 'bg-gray-200'
                        }`}
                      >
                        {isSelected && (
                          <Check className="h-5 w-5 text-white" strokeWidth={3} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl bg-blue-50 p-4 mb-4">
          <p className="text-sm text-blue-900 leading-relaxed">
            <span className="font-semibold">Nota:</span> Podrás crear categorías personalizadas más adelante desde la sección de Configuración.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-white px-6 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={handleContinue}
          className="w-full rounded-2xl bg-[#18B7B0] py-4 text-base font-semibold text-white shadow-lg shadow-[#18B7B0]/30 transition-all active:scale-[0.98]"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
