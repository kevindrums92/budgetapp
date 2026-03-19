/**
 * Merchant Matcher Service
 * Matches merchant/store names from deep links (iOS Shortcuts, Apple Pay)
 * to the user's existing categories using multiple strategies.
 *
 * Strategy (in priority order):
 * 1. Exact name match in recent history (1 occurrence is enough)
 * 2. Fuzzy similarity match (Levenshtein-based, ≥0.6 threshold)
 * 3. Token overlap: significant words from merchant match transaction history
 * 4. Keyword hints: known merchant keywords → category group
 * 5. Fallback: user's most frequently used category for this type
 */

import type { Transaction, Category } from "@/types/budget.types";

/** How far back to look for merchant matching (6 months) */
const HISTORY_DAYS = 180;

/** Minimum Levenshtein similarity score to consider a fuzzy match */
const MIN_SIMILARITY = 0.6;

/**
 * Common stop words (es/en/pt/fr) + business suffixes.
 * These carry no semantic value for matching.
 */
const STOP_WORDS = new Set([
  // Spanish
  "el", "la", "los", "las", "un", "una", "de", "del", "en", "con", "por",
  "para", "a", "al", "y", "e", "o",
  // English
  "the", "an", "of", "in", "at", "to", "for", "with", "and", "or",
  // Portuguese
  "os", "as", "do", "da", "dos", "das", "no", "na", "em", "com",
  // French
  "le", "les", "du", "des", "au", "aux", "dans", "avec", "pour", "et",
  // Business suffixes
  "sa", "s.a", "sas", "s.a.s", "ltda", "inc", "llc", "co", "corp",
]);

/**
 * Keyword hints map to REAL groupIds from the app's category system:
 *   food_drink, home_utilities, lifestyle, transport, family, miscellaneous
 *
 * For the "lifestyle" group (which contains very different categories:
 * Ropa, Entretenimiento, Salud, Educación, Cuidado Personal) we use a
 * second-level map (LIFESTYLE_SUBCATEGORY_HINTS) to pick the right one.
 */
const MERCHANT_CATEGORY_HINTS: Record<string, string[]> = {
  /* ── food_drink (Mercado, Restaurantes) ── */
  food_drink: [
    // Generic food words
    "restaurante", "restaurant", "café", "cafe", "pizza", "burger",
    "sushi", "panadería", "bakery", "bar", "grill", "comida", "food",
    "cocina", "kitchen", "asadero", "pasteleria", "cafeteria",
    "heladeria", "helado", "ice cream", "fruteria", "comedor",
    "pollo", "chicken", "taco", "burrito", "crepes", "waffles",
    // Global fast food chains
    "mcdonald", "subway", "starbucks", "dominos", "kfc", "wendys",
    "burger king", "papa john", "pizza hut", "taco bell", "little caesars",
    "chick", "chipotle", "panda express", "five guys", "dunkin",
    // LatAm chains
    "frisby", "presto", "el corral", "jeno", "archie", "wok",
    "crepes & waffles", "juan valdez", "oma", "cali mio", "kokoriko",
    "la brasa roja",
    // Delivery / grocery
    "rappi", "ifood", "uber eats", "didi food", "pedidos ya", "glovo",
    "cornershop", "merqueo",
    // Supermarkets & grocery stores
    "supermercado", "super", "minimarket", "minimercado", "carniceria",
    "verduleria", "mercadona", "carrefour", "lidl", "aldi",
    // Drinks
    "cerveceria", "licoreria", "licorera", "cerveza", "pub", "discoteca",
  ],

  /* ── transport (Transporte, Gasolina) ── */
  transport: [
    // Rideshare
    "uber", "didi", "taxi", "cabify", "beat", "bolt", "indriver", "lyft",
    // Fuel & gas stations
    "gasolina", "gasolinera", "gas station", "combustible", "fuel",
    "shell", "terpel", "primax", "texaco", "mobil", "petrobras",
    "esso", "bp", "chevron", "puma energy", "biomax", "brio",
    "gulf", "cepsa", "repsol", "total energies", "ecopetrol",
    // Auto services
    "autocentro", "auto centro", "autolavado", "car wash", "lavadero",
    "lavado", "taller", "mecanico", "mecánico", "repuesto", "llantas",
    "neumaticos", "frenos", "aceite", "revision tecnica", "soat",
    // Tolls & parking
    "peaje", "toll", "parking", "estacionamiento", "parqueadero",
    // Public transit
    "metro", "transmilenio", "sitp", "mio", "megabus", "transmetro", "bus",
    "autopista",
    // Airlines / travel
    "avianca", "latam", "copa airlines", "viva air", "wingo", "jetblue",
    "american airlines", "united airlines", "delta", "spirit",
    "aeropuerto", "airport",
  ],

  /* ── home_utilities (Arriendo, Servicios, Suscripciones) ── */
  home_utilities: [
    // Utilities
    "epm", "codensa", "enel", "vanti", "electricidad", "acueducto",
    "luz", "agua", "gas natural", "gas domiciliario", "aseo", "basura",
    "alcantarillado", "propano",
    // Telecom
    "claro", "movistar", "tigo", "wom", "etb", "une", "virgin",
    "internet", "wifi", "fibra",
    // Housing
    "arriendo", "rent", "hipoteca", "mortgage", "administracion",
    "condominio", "propiedad horizontal",
    // Insurance
    "seguro", "insurance", "seguros bolivar", "sura", "liberty",
    "mapfre", "allianz", "previsora", "mundial de seguros",
    // Subscriptions / digital services
    "apple", "google", "icloud", "microsoft", "adobe", "notion",
    "chatgpt", "openai", "canva", "dropbox", "onedrive", "slack",
    "zoom", "figma", "github", "copilot", "midjourney", "claude",
    "perplexity", "nordvpn", "1password", "bitwarden",
    "netflix", "spotify", "disney", "hbo", "prime video", "deezer",
    "apple tv", "paramount", "crunchyroll", "youtube premium",
    "apple music", "tidal",
  ],

  /* ── lifestyle (Ropa, Entretenimiento, Salud, Educación, Cuidado Personal) ── */
  lifestyle: [
    // Shopping / Clothing
    "amazon", "mercado libre", "mercadolibre", "falabella", "éxito",
    "exito", "jumbo", "alkosto", "homecenter", "tienda", "store",
    "shop", "mall", "centro comercial", "zara", "h&m", "nike", "adidas",
    "walmart", "costco", "target", "olímpica", "olimpica",
    "d1", "ara", "justo bueno", "shein", "forever 21", "pull&bear",
    "bershka", "stradivarius", "uniqlo", "gap", "levi", "primark",
    "ikea", "tugo", "panamericana", "flamingo",
    "aliexpress", "temu", "shopee",
    // Entertainment
    "cine", "cinema", "teatro", "concierto", "concert",
    "steam", "playstation", "xbox", "nintendo", "epic games",
    "ticketmaster", "tuboleta", "parque", "amusement",
    "bowling", "boliche", "billar", "karaoke", "zoo", "museo", "museum",
    // Health & Medical
    "farmacia", "pharmacy", "droguería", "hospital", "clínica", "clinic",
    "doctor", "médico", "gym", "gimnasio", "eps", "salud", "dentista",
    "óptica", "optica", "laboratorio", "locatel", "farmatodo",
    "cruz verde", "colsubsidio", "compensar", "cafam", "colsanitas",
    "nueva eps", "sanitas", "bodytech", "smart fit", "crossfit", "yoga",
    "spa", "fisioterapia", "psicólogo", "nutricionista",
    // Education
    "universidad", "university", "colegio", "school", "curso", "course",
    "udemy", "coursera", "platzi", "skillshare", "masterclass",
    "duolingo", "khan academy", "linkedin learning", "edx",
    "instituto", "academia", "libreria", "bookstore", "kindle", "audible",
    // Personal care
    "peluqueria", "salon", "barberia", "barber", "uñas", "nails",
    "maquillaje", "makeup", "cosmetico", "sephora", "perfumeria",
    "perfume", "dermato",
  ],

  /* ── family (Hijos, Mascotas, Regalos) ── */
  family: [
    // Kids
    "jugueteria", "toys", "pañales", "diapers", "baby", "bebe",
    "colegiatura", "uniforme", "guarderia", "daycare", "preescolar",
    "jardin infantil", "kindergarten", "materno",
    // Pets
    "veterinaria", "vet", "pet shop", "petland", "mascota", "laika",
    "gabrica", "purina", "concentrado", "pet food", "peluqueria canina",
    // Gifts
    "regalo", "gift", "floristeria", "flores", "flowers",
    "joyeria", "jewelry", "hallmark",
  ],
};

/**
 * Within the "lifestyle" group, try to match to a specific default category
 * by checking keywords associated with each subcategory name.
 * Keys are normalized default category names.
 */
const LIFESTYLE_SUBCATEGORY_HINTS: Record<string, string[]> = {
  // Ropa (Clothing / Shopping)
  ropa: [
    "zara", "h&m", "nike", "adidas", "shein", "forever 21", "pull&bear",
    "bershka", "stradivarius", "uniqlo", "gap", "levi", "primark",
    "falabella", "flamingo", "tienda", "store", "shop", "mall",
    "centro comercial", "ropa", "vestido", "zapato", "calzado",
  ],
  // Entretenimiento (Entertainment)
  entretenimiento: [
    "cine", "cinema", "teatro", "concierto", "concert",
    "steam", "playstation", "xbox", "nintendo", "epic games",
    "ticketmaster", "tuboleta", "parque", "amusement",
    "bowling", "boliche", "billar", "karaoke", "zoo", "museo", "museum",
  ],
  // Salud (Health)
  salud: [
    "farmacia", "pharmacy", "droguería", "hospital", "clínica", "clinic",
    "doctor", "médico", "gym", "gimnasio", "eps", "salud", "dentista",
    "óptica", "optica", "laboratorio", "locatel", "farmatodo",
    "cruz verde", "colsubsidio", "compensar", "cafam", "colsanitas",
    "nueva eps", "sanitas", "bodytech", "smart fit", "crossfit", "yoga",
    "spa", "fisioterapia", "psicólogo", "nutricionista",
  ],
  // Educación (Education)
  educacion: [
    "universidad", "university", "colegio", "school", "curso", "course",
    "udemy", "coursera", "platzi", "skillshare", "masterclass",
    "duolingo", "khan academy", "linkedin learning", "edx",
    "instituto", "academia", "libreria", "bookstore", "kindle", "audible",
  ],
  // Cuidado Personal (Personal Care)
  "cuidado personal": [
    "peluqueria", "salon", "barberia", "barber", "uñas", "nails",
    "maquillaje", "makeup", "cosmetico", "sephora", "perfumeria",
    "perfume", "dermato",
  ],
};

/** Fallback: when a group doesn't exist in user's categories, try these */
const CATEGORY_FALLBACK_MAP: Record<string, string> = {
  lifestyle: "miscellaneous",
  transport: "miscellaneous",
  family: "miscellaneous",
};

export type MerchantMatchResult = {
  /** Matched category ID from the user's store */
  categoryId: string;
  /** Match source for debugging */
  source: "exact" | "history" | "tokens" | "keywords" | "fallback";
};

/* ── Helpers ─────────────────────────────────────────────────────── */

/** Remove accents/diacritics: "café" → "cafe" */
function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Normalize a name for comparison */
function normalize(name: string): string {
  return removeAccents(name.toLowerCase().trim()).replace(/\s+/g, " ");
}

/** Extract significant tokens from a name (no stop words, no pure numbers) */
function extractTokens(name: string): string[] {
  return normalize(name)
    .split(" ")
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
}

/** Levenshtein similarity (0 = completely different, 1 = identical) */
function similarity(a: string, b: string): number {
  const s1 = normalize(a);
  const s2 = normalize(b);
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;

  // Substring containment bonus
  if (s1.includes(s2) || s2.includes(s1)) {
    return (Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length)) * 0.9;
  }

  // Full Levenshtein distance
  const matrix: number[][] = [];
  for (let i = 0; i <= s1.length; i++) matrix[i] = [i];
  for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return 1 - matrix[s1.length][s2.length] / Math.max(s1.length, s2.length);
}

/**
 * Within the "lifestyle" group, pick the best subcategory by matching
 * the merchant name against LIFESTYLE_SUBCATEGORY_HINTS keywords.
 * Falls back to null if no specific subcategory matches.
 */
function findLifestyleSubcategory(
  normalizedMerchant: string,
  groupCategories: Category[],
): Category | null {
  for (const cat of groupCategories) {
    const normalizedCatName = normalize(cat.name);
    const hints = LIFESTYLE_SUBCATEGORY_HINTS[normalizedCatName];
    if (!hints) continue;
    const matched = hints.some((kw) => normalizedMerchant.includes(kw.toLowerCase()));
    if (matched) return cat;
  }
  return null;
}

/** Filter to recent, non-planned, non-template transactions */
function getRecentTransactions(transactions: Transaction[]): Transaction[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - HISTORY_DAYS);
  const cutoffISO = cutoff.toISOString().split("T")[0];
  return transactions.filter(
    (tx) => tx.date >= cutoffISO && tx.status !== "planned" && !tx.sourceTemplateId,
  );
}

/* ── Main entry point ────────────────────────────────────────────── */

/**
 * Match a merchant name to a category from the user's store.
 * Always returns a result when possible — uses most-used category as final fallback.
 */
export function matchMerchantToCategory(
  merchantName: string,
  transactions: Transaction[],
  categoryDefinitions: Category[],
  transactionType: "income" | "expense" = "expense",
): MerchantMatchResult | null {
  if (!merchantName.trim()) return null;

  const categoriesOfType = categoryDefinitions.filter(
    (cat) => cat.type === transactionType,
  );
  if (categoriesOfType.length === 0) return null;

  const categoryIds = new Set(categoriesOfType.map((c) => c.id));
  const recent = getRecentTransactions(transactions);
  const normalizedMerchant = normalize(merchantName);

  /* ── 1. Exact name match (single occurrence is enough) ── */
  for (const tx of recent) {
    if (normalize(tx.name) === normalizedMerchant && categoryIds.has(tx.category)) {
      return { categoryId: tx.category, source: "exact" };
    }
  }

  /* ── 2. Fuzzy similarity match (scan all recent transactions) ── */
  let bestScore = 0;
  let bestCategoryId = "";
  for (const tx of recent) {
    if (!categoryIds.has(tx.category)) continue;
    const score = similarity(merchantName, tx.name);
    if (score > bestScore && score >= MIN_SIMILARITY) {
      bestScore = score;
      bestCategoryId = tx.category;
    }
  }
  if (bestCategoryId) {
    return { categoryId: bestCategoryId, source: "history" };
  }

  /* ── 3. Token overlap: match significant words against history ── */
  const merchantTokens = extractTokens(merchantName);
  if (merchantTokens.length > 0) {
    // Score each category by how many tokens overlap with its transactions
    const categoryScores = new Map<string, number>();

    for (const tx of recent) {
      if (!categoryIds.has(tx.category)) continue;
      const txTokens = extractTokens(tx.name);
      let overlap = 0;
      for (const mt of merchantTokens) {
        for (const tt of txTokens) {
          // Match exact token or substring (e.g., "autocentro" contains "auto")
          if (mt === tt || (mt.length >= 4 && tt.length >= 4 && (mt.includes(tt) || tt.includes(mt)))) {
            overlap++;
            break;
          }
        }
      }
      if (overlap > 0) {
        categoryScores.set(
          tx.category,
          (categoryScores.get(tx.category) || 0) + overlap,
        );
      }
    }

    if (categoryScores.size > 0) {
      let topCat = "";
      let topScore = 0;
      for (const [cat, score] of categoryScores) {
        if (score > topScore) {
          topScore = score;
          topCat = cat;
        }
      }
      if (topCat) {
        return { categoryId: topCat, source: "tokens" };
      }
    }
  }

  /* ── 4. Keyword hints → category group ── */
  for (const [groupId, keywords] of Object.entries(MERCHANT_CATEGORY_HINTS)) {
    const matched = keywords.some((kw) =>
      normalizedMerchant.includes(kw.toLowerCase()),
    );
    if (!matched) continue;

    const groupCategories = categoriesOfType.filter((cat) => cat.groupId === groupId);

    if (groupCategories.length > 0) {
      // For groups with many subcategories (lifestyle), try to pick the best one
      if (groupId === "lifestyle" && groupCategories.length > 1) {
        const subcatMatch = findLifestyleSubcategory(
          normalizedMerchant,
          groupCategories,
        );
        if (subcatMatch) {
          return { categoryId: subcatMatch.id, source: "keywords" };
        }
      }
      // Default: first category in the group
      return { categoryId: groupCategories[0].id, source: "keywords" };
    }

    // Try fallback group
    const fallbackGroupId = CATEGORY_FALLBACK_MAP[groupId];
    if (fallbackGroupId) {
      const fallback = categoriesOfType.find(
        (cat) => cat.groupId === fallbackGroupId,
      );
      if (fallback) {
        return { categoryId: fallback.id, source: "keywords" };
      }
    }
  }

  /* ── 5. Fallback: most used category in recent history ── */
  const categoryCounts = new Map<string, number>();
  for (const tx of recent) {
    if (tx.type !== transactionType) continue;
    if (!categoryIds.has(tx.category)) continue;
    categoryCounts.set(tx.category, (categoryCounts.get(tx.category) || 0) + 1);
  }
  if (categoryCounts.size > 0) {
    let topCat = "";
    let topCount = 0;
    for (const [cat, count] of categoryCounts) {
      if (count > topCount) {
        topCount = count;
        topCat = cat;
      }
    }
    if (topCat) {
      return { categoryId: topCat, source: "fallback" };
    }
  }

  // Last resort: first category of the matching type
  return { categoryId: categoriesOfType[0].id, source: "fallback" };
}
