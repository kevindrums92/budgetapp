/**
 * Merchant Matcher Service
 * Matches merchant/store names from deep links (iOS Shortcuts, Apple Pay)
 * to the user's existing categories using transaction history patterns.
 *
 * Uses the same similarity algorithm as historyMatcher.service.ts
 */

import type { Transaction, Category } from "@/types/budget.types";
import {
  extractPatterns,
  findBestMatch,
} from "@/features/batch-entry/services/historyMatcher.service";

/** Merchant keywords → category group ID mapping (for when there's no history match) */
const MERCHANT_CATEGORY_HINTS: Record<string, string[]> = {
  food_drink: [
    "restaurante", "restaurant", "café", "cafe", "pizza", "burger",
    "sushi", "panadería", "bakery", "bar", "grill", "comida",
    "mcdonald", "subway", "starbucks", "dominos", "rappi", "ifood",
    "uber eats", "didi food",
  ],
  transport: [
    "uber", "didi", "taxi", "cabify", "beat", "gasolina", "gas station",
    "peaje", "toll", "parking", "estacionamiento", "metro", "transmilenio",
    "bus", "bolt",
  ],
  shopping: [
    "amazon", "mercado libre", "mercadolibre", "falabella", "éxito", "exito",
    "jumbo", "alkosto", "homecenter", "tienda", "store", "shop", "mall",
    "centro comercial", "zara", "h&m",
  ],
  entertainment: [
    "netflix", "spotify", "disney", "hbo", "cine", "cinema", "teatro",
    "concierto", "concert", "steam", "playstation", "xbox", "youtube",
  ],
  home_utilities: [
    "epm", "codensa", "vanti", "claro", "movistar", "tigo", "wom",
    "internet", "luz", "agua", "gas natural", "arriendo", "rent",
  ],
  health: [
    "farmacia", "pharmacy", "droguería", "hospital", "clínica", "clinic",
    "doctor", "médico", "gym", "gimnasio", "eps", "salud",
  ],
  subscriptions: [
    "apple", "google", "icloud", "microsoft", "adobe", "notion",
    "chatgpt", "openai",
  ],
  education: [
    "universidad", "university", "colegio", "school", "curso", "course",
    "udemy", "coursera", "platzi",
  ],
};

/** Category group fallback map (same as batch entry) */
const CATEGORY_FALLBACK_MAP: Record<string, string> = {
  health: "lifestyle",
  shopping: "lifestyle",
  entertainment: "lifestyle",
  personal_care: "lifestyle",
  education: "miscellaneous",
  travel: "miscellaneous",
  financial: "miscellaneous",
  family: "miscellaneous",
  pets: "miscellaneous",
  gifts: "miscellaneous",
  subscriptions: "home_utilities",
};

export type MerchantMatchResult = {
  /** Matched category ID from the user's store */
  categoryId: string;
  /** Match source for debugging */
  source: "history" | "keywords" | "fallback";
};

/**
 * Match a merchant name to a category from the user's store.
 *
 * Strategy (in order of priority):
 * 1. History match: Find similar transaction names in user's history
 * 2. Keyword match: Match merchant against known keyword lists
 * 3. Returns null if no match found
 */
export function matchMerchantToCategory(
  merchantName: string,
  transactions: Transaction[],
  categoryDefinitions: Category[],
  transactionType: "income" | "expense" = "expense"
): MerchantMatchResult | null {
  if (!merchantName.trim()) return null;

  const categoriesOfType = categoryDefinitions.filter(
    (cat) => cat.type === transactionType
  );

  // 1. Try history-based matching (most reliable)
  const patterns = extractPatterns(transactions);
  const historyMatch = findBestMatch(merchantName, patterns);

  if (historyMatch) {
    // Verify the matched category still exists in the store
    const categoryExists = categoriesOfType.find(
      (cat) => cat.id === historyMatch.category
    );
    if (categoryExists) {
      return { categoryId: historyMatch.category, source: "history" };
    }
  }

  // 2. Try keyword-based matching
  const normalizedMerchant = merchantName.toLowerCase().trim();

  for (const [groupId, keywords] of Object.entries(MERCHANT_CATEGORY_HINTS)) {
    const matched = keywords.some((keyword) =>
      normalizedMerchant.includes(keyword.toLowerCase())
    );

    if (matched) {
      // Find category by group ID
      const category = categoriesOfType.find((cat) => cat.groupId === groupId);
      if (category) {
        return { categoryId: category.id, source: "keywords" };
      }

      // Try fallback group
      const fallbackGroupId = CATEGORY_FALLBACK_MAP[groupId];
      if (fallbackGroupId) {
        const fallbackCategory = categoriesOfType.find(
          (cat) => cat.groupId === fallbackGroupId
        );
        if (fallbackCategory) {
          return { categoryId: fallbackCategory.id, source: "fallback" };
        }
      }
    }
  }

  return null;
}
