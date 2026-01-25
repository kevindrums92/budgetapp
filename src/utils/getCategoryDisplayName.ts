import type { TFunction } from 'i18next';
import { getCategoryTranslationKey } from '@/constants/categories/category-translation-keys';

/**
 * Gets the display name for a category, translating default categories and keeping custom ones as-is
 * @param categoryName - The category name
 * @param t - The translation function from useTranslation
 * @returns The translated category name if it's a default category, or the original name otherwise
 */
export function getCategoryDisplayName(categoryName: string, t: TFunction): string {
  const translationKey = getCategoryTranslationKey(categoryName);
  if (translationKey) {
    return t(translationKey, { ns: 'common' });
  }
  return categoryName;
}
