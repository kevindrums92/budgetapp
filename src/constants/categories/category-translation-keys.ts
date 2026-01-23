/**
 * Maps default category names to their translation keys
 * This allows default categories to be translated while keeping user-created categories as-is
 */
export const CATEGORY_TRANSLATION_KEYS: Record<string, string> = {
  // Food & Drink
  "Mercado": "defaultCategories.mercado",
  "Restaurantes": "defaultCategories.restaurantes",

  // Home & Utilities
  "Servicios": "defaultCategories.servicios",
  "Arriendo": "defaultCategories.arriendo",
  "Suscripciones": "defaultCategories.suscripciones",

  // Lifestyle
  "Ropa": "defaultCategories.ropa",
  "Educación": "defaultCategories.educacion",
  "Entretenimiento": "defaultCategories.entretenimiento",
  "Hijos": "defaultCategories.hijos",
  "Salud": "defaultCategories.salud",

  // Transport
  "Transporte": "defaultCategories.transporte",
  "Gasolina": "defaultCategories.gasolina",

  // Miscellaneous
  "Otros Gastos": "defaultCategories.otrosGastos",

  // Primary Income
  "Salario": "defaultCategories.salario",
  "Bonos": "defaultCategories.bonos",
  "Freelance": "defaultCategories.freelance",

  // Other Income
  "Beneficios": "defaultCategories.beneficios",
  "Inversiones": "defaultCategories.inversiones",
  "Arriendo Recibido": "defaultCategories.arriendoRecibido",
  "Propinas": "defaultCategories.propinas",
  "Otros Ingresos": "defaultCategories.otrosIngresos",
};

/**
 * Gets the translation key for a category name, if it's a default category
 * @param categoryName - The category name
 * @returns Translation key if it's a default category, undefined otherwise
 */
export function getCategoryTranslationKey(categoryName: string): string | undefined {
  return CATEGORY_TRANSLATION_KEYS[categoryName];
}

/**
 * Checks if a category name is a default category (has a translation key)
 * @param categoryName - The category name
 * @returns true if it's a default category
 */
export function isDefaultCategory(categoryName: string): boolean {
  return categoryName in CATEGORY_TRANSLATION_KEYS;
}
