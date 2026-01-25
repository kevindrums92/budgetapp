// Extended list of lucide icons with searchable keywords
// Using kebab-case names that match lucide-react exports

export type IconWithKeywords = {
  icon: string;
  keywords: string[]; // Spanish and English keywords
};

export const CATEGORY_ICONS_WITH_KEYWORDS: IconWithKeywords[] = [
  // Food & Drink
  { icon: "shopping-basket", keywords: ["compras", "canasta", "mercado", "shopping", "basket", "groceries"] },
  { icon: "utensils-crossed", keywords: ["comida", "restaurante", "cubiertos", "food", "restaurant", "utensils"] },
  { icon: "coffee", keywords: ["café", "cafetería", "bebida", "coffee", "drink"] },
  { icon: "pizza", keywords: ["pizza", "comida rápida", "fast food"] },
  { icon: "wine", keywords: ["vino", "alcohol", "bebida", "wine", "drink", "alcohol"] },
  { icon: "beer", keywords: ["cerveza", "alcohol", "bebida", "beer", "drink", "alcohol"] },
  { icon: "cookie", keywords: ["galleta", "dulce", "postre", "cookie", "sweet", "dessert"] },
  { icon: "ice-cream-cone", keywords: ["helado", "postre", "dulce", "ice cream", "dessert", "sweet"] },
  { icon: "apple", keywords: ["manzana", "fruta", "saludable", "apple", "fruit", "healthy"] },
  { icon: "salad", keywords: ["ensalada", "saludable", "vegetales", "salad", "healthy", "vegetables"] },
  { icon: "cake", keywords: ["pastel", "torta", "postre", "dulce", "cake", "dessert", "sweet"] },
  { icon: "candy", keywords: ["dulce", "caramelo", "golosina", "candy", "sweet"] },
  { icon: "egg-fried", keywords: ["huevo", "desayuno", "comida", "egg", "breakfast", "food"] },
  { icon: "popcorn", keywords: ["palomitas", "cine", "snack", "popcorn", "cinema", "snack"] },
  { icon: "milk", keywords: ["leche", "lácteo", "bebida", "milk", "dairy", "drink"] },

  // Home & Utilities
  { icon: "home", keywords: ["casa", "hogar", "vivienda", "home", "house"] },
  { icon: "lightbulb", keywords: ["luz", "electricidad", "bombilla", "light", "electricity", "bulb"] },
  { icon: "wifi", keywords: ["wifi", "internet", "conexión", "connection"] },
  { icon: "droplet", keywords: ["agua", "gota", "hidratación", "water", "drop", "hydration"] },
  { icon: "flame", keywords: ["fuego", "gas", "calefacción", "fire", "gas", "heating"] },
  { icon: "key", keywords: ["llave", "seguridad", "casa", "key", "security", "home"] },
  { icon: "sofa", keywords: ["sofá", "mueble", "sala", "sofa", "furniture", "living room"] },
  { icon: "wrench", keywords: ["herramienta", "reparación", "mantenimiento", "tool", "repair", "maintenance"] },
  { icon: "plug", keywords: ["enchufe", "electricidad", "energía", "plug", "electricity", "energy"] },
  { icon: "thermometer", keywords: ["temperatura", "clima", "termómetro", "temperature", "climate", "thermometer"] },
  { icon: "bed", keywords: ["cama", "dormir", "habitación", "bed", "sleep", "bedroom"] },
  { icon: "armchair", keywords: ["sillón", "mueble", "sala", "armchair", "furniture", "living room"] },
  { icon: "refrigerator", keywords: ["refrigerador", "nevera", "cocina", "refrigerator", "fridge", "kitchen"] },
  { icon: "washing-machine", keywords: ["lavadora", "ropa", "limpieza", "washing machine", "laundry", "cleaning"] },
  { icon: "lamp", keywords: ["lámpara", "luz", "iluminación", "lamp", "light", "lighting"] },
  { icon: "door-open", keywords: ["puerta", "entrada", "casa", "door", "entrance", "home"] },

  // Transport
  { icon: "car", keywords: ["auto", "carro", "vehículo", "transporte", "car", "vehicle", "transport"] },
  { icon: "bus", keywords: ["bus", "autobús", "transporte público", "public transport"] },
  { icon: "plane", keywords: ["avión", "vuelo", "viaje", "plane", "flight", "travel"] },
  { icon: "train-front", keywords: ["tren", "transporte", "viaje", "train", "transport", "travel"] },
  { icon: "bike", keywords: ["bicicleta", "ciclismo", "transporte", "bike", "bicycle", "cycling", "transport"] },
  { icon: "fuel", keywords: ["gasolina", "combustible", "tanque", "fuel", "gas", "tank"] },
  { icon: "ship", keywords: ["barco", "crucero", "viaje", "ship", "cruise", "travel"] },
  { icon: "map-pin", keywords: ["ubicación", "lugar", "mapa", "location", "place", "map"] },
  { icon: "taxi", keywords: ["taxi", "transporte", "viaje", "transport", "travel"] },
  { icon: "truck", keywords: ["camión", "mudanza", "transporte", "truck", "moving", "transport"] },
  { icon: "subway", keywords: ["metro", "subterráneo", "transporte", "subway", "underground", "transport"] },
  { icon: "parking-circle", keywords: ["estacionamiento", "parqueo", "parking"] },

  // Shopping & Lifestyle
  { icon: "shopping-bag", keywords: ["compras", "bolsa", "tienda", "shopping", "bag", "store"] },
  { icon: "shirt", keywords: ["camisa", "ropa", "vestimenta", "shirt", "clothes", "clothing"] },
  { icon: "scissors", keywords: ["tijeras", "corte", "cortar", "peluquería", "herramienta", "scissors", "cut", "hairdresser", "tool"] },
  { icon: "gift", keywords: ["regalo", "presente", "celebración", "gift", "present", "celebration"] },
  { icon: "heart", keywords: ["corazón", "amor", "favorito", "heart", "love", "favorite"] },
  { icon: "gem", keywords: ["joya", "diamante", "lujo", "gem", "diamond", "luxury"] },
  { icon: "watch", keywords: ["reloj", "tiempo", "accesorio", "watch", "time", "accessory"] },
  { icon: "glasses", keywords: ["gafas", "lentes", "vista", "glasses", "vision"] },
  { icon: "crown", keywords: ["corona", "premium", "lujo", "crown", "premium", "luxury"] },
  { icon: "flower", keywords: ["flor", "planta", "jardín", "flower", "plant", "garden"] },
  { icon: "shopping-cart", keywords: ["carrito", "compras", "supermercado", "cart", "shopping", "supermarket"] },
  { icon: "sparkles", keywords: ["brillo", "limpieza", "especial", "sparkles", "cleaning", "special"] },

  // Entertainment
  { icon: "tv", keywords: ["televisión", "entretenimiento", "streaming", "tv", "entertainment", "streaming"] },
  { icon: "gamepad-2", keywords: ["videojuegos", "consola", "gaming", "videogames", "console"] },
  { icon: "music", keywords: ["música", "canción", "audio", "music", "song", "audio"] },
  { icon: "film", keywords: ["película", "cine", "video", "film", "movie", "cinema", "video"] },
  { icon: "book-open", keywords: ["libro", "lectura", "educación", "book", "reading", "education"] },
  { icon: "ticket", keywords: ["boleto", "entrada", "evento", "ticket", "entry", "event"] },
  { icon: "camera", keywords: ["cámara", "foto", "fotografía", "camera", "photo", "photography"] },
  { icon: "headphones", keywords: ["audífonos", "música", "audio", "headphones", "music", "audio"] },
  { icon: "palette", keywords: ["arte", "pintura", "creatividad", "art", "painting", "creativity"] },
  { icon: "party-popper", keywords: ["fiesta", "celebración", "evento", "party", "celebration", "event"] },
  { icon: "guitar", keywords: ["guitarra", "música", "instrumento", "guitar", "music", "instrument"] },
  { icon: "clapperboard", keywords: ["cine", "película", "producción", "cinema", "movie", "production"] },

  // Health & Education
  { icon: "stethoscope", keywords: ["médico", "salud", "doctor", "stethoscope", "health", "doctor"] },
  { icon: "pill", keywords: ["medicina", "pastilla", "salud", "medicine", "pill", "health"] },
  { icon: "graduation-cap", keywords: ["educación", "universidad", "estudio", "education", "university", "study"] },
  { icon: "dumbbell", keywords: ["gimnasio", "ejercicio", "fitness", "gym", "exercise"] },
  { icon: "baby", keywords: ["bebé", "niño", "pañales", "baby", "child", "diapers"] },
  { icon: "heart-pulse", keywords: ["salud", "corazón", "pulso", "health", "heart", "pulse"] },
  { icon: "syringe", keywords: ["vacuna", "inyección", "médico", "vaccine", "injection", "medical"] },
  { icon: "bandage", keywords: ["curita", "vendaje", "primeros auxilios", "bandage", "first aid"] },
  { icon: "brain", keywords: ["cerebro", "mental", "psicología", "brain", "mental", "psychology"] },
  { icon: "activity", keywords: ["actividad", "salud", "ejercicio", "activity", "health", "exercise"] },

  // Finance & Work
  { icon: "briefcase", keywords: ["trabajo", "oficina", "profesional", "work", "office", "professional"] },
  { icon: "building-2", keywords: ["edificio", "empresa", "oficina", "building", "company", "office"] },
  { icon: "banknote", keywords: ["dinero", "efectivo", "billete", "money", "cash", "bill"] },
  { icon: "credit-card", keywords: ["tarjeta", "crédito", "pago", "card", "credit", "payment"] },
  { icon: "piggy-bank", keywords: ["ahorro", "alcancía", "dinero", "savings", "piggy bank", "money"] },
  { icon: "trending-up", keywords: ["inversión", "crecimiento", "finanzas", "investment", "growth", "finance"] },
  { icon: "wallet", keywords: ["billetera", "cartera", "dinero", "wallet", "money"] },
  { icon: "laptop", keywords: ["computadora", "trabajo", "tecnología", "computer", "work", "technology"] },
  { icon: "smartphone", keywords: ["teléfono", "celular", "móvil", "phone", "mobile"] },
  { icon: "calculator", keywords: ["calculadora", "números", "finanzas", "calculator", "numbers", "finance"] },
  { icon: "chart-line", keywords: ["gráfica", "estadísticas", "finanzas", "chart", "statistics", "finance"] },
  { icon: "coins", keywords: ["monedas", "dinero", "cambio", "coins", "money", "change"] },

  // Pets & Animals
  { icon: "dog", keywords: ["perro", "mascota", "animal", "dog", "pet", "animal"] },
  { icon: "cat", keywords: ["gato", "mascota", "animal", "cat", "pet", "animal"] },
  { icon: "paw-print", keywords: ["mascota", "huella", "animal", "pet", "paw", "animal"] },
  { icon: "rabbit", keywords: ["conejo", "mascota", "animal", "rabbit", "pet", "animal"] },
  { icon: "fish", keywords: ["pez", "acuario", "mascota", "fish", "aquarium", "pet"] },
  { icon: "bird", keywords: ["pájaro", "ave", "mascota", "bird", "pet"] },
  { icon: "squirrel", keywords: ["ardilla", "animal", "naturaleza", "squirrel", "animal", "nature"] },
  { icon: "turtle", keywords: ["tortuga", "mascota", "animal", "turtle", "pet", "animal"] },
  { icon: "bug", keywords: ["insecto", "bicho", "plaga", "bug", "insect", "pest"] },

  // Nature & Outdoors
  { icon: "tree-deciduous", keywords: ["árbol", "naturaleza", "jardín", "tree", "nature", "garden"] },
  { icon: "leaf", keywords: ["hoja", "planta", "naturaleza", "leaf", "plant", "nature"] },
  { icon: "sprout", keywords: ["planta", "jardín", "crecimiento", "sprout", "plant", "garden", "growth"] },
  { icon: "sun", keywords: ["sol", "clima", "verano", "sun", "weather", "summer"] },
  { icon: "moon", keywords: ["luna", "noche", "clima", "moon", "night", "weather"] },
  { icon: "cloud", keywords: ["nube", "clima", "lluvia", "cloud", "weather", "rain"] },
  { icon: "umbrella", keywords: ["paraguas", "lluvia", "clima", "umbrella", "rain", "weather"] },
  { icon: "snowflake", keywords: ["nieve", "invierno", "frío", "snow", "winter", "cold"] },

  // Communication & Social
  { icon: "phone", keywords: ["teléfono", "llamada", "comunicación", "phone", "call", "communication"] },
  { icon: "mail", keywords: ["correo", "email", "mensaje", "mail", "email", "message"] },
  { icon: "message-circle", keywords: ["mensaje", "chat", "conversación", "message", "chat", "conversation"] },
  { icon: "send", keywords: ["enviar", "mensaje", "correo", "send", "message", "mail"] },
  { icon: "at-sign", keywords: ["arroba", "email", "mención", "at", "email", "mention"] },
  { icon: "user", keywords: ["usuario", "persona", "perfil", "user", "person", "profile"] },
  { icon: "users", keywords: ["usuarios", "grupo", "personas", "users", "group", "people"] },

  // Services & Subscriptions
  { icon: "newspaper", keywords: ["periódico", "noticias", "suscripción", "newspaper", "news", "subscription"] },
  { icon: "shield", keywords: ["seguro", "protección", "seguridad", "insurance", "protection", "security"] },
  { icon: "megaphone", keywords: ["publicidad", "marketing", "anuncio", "advertising", "marketing", "announcement"] },
  { icon: "bell", keywords: ["notificación", "alerta", "recordatorio", "notification", "alert", "reminder"] },
  { icon: "calendar", keywords: ["calendario", "fecha", "evento", "calendar", "date", "event"] },
  { icon: "clock", keywords: ["reloj", "tiempo", "hora", "clock", "time", "hour"] },

  // Tools & Maintenance
  { icon: "hammer", keywords: ["martillo", "herramienta", "construcción", "hammer", "tool", "construction"] },
  { icon: "screwdriver", keywords: ["destornillador", "herramienta", "reparación", "screwdriver", "tool", "repair"] },
  { icon: "paintbrush", keywords: ["pincel", "pintura", "arte", "paintbrush", "paint", "art"] },
  { icon: "ruler", keywords: ["regla", "medida", "herramienta", "ruler", "measure", "tool"] },

  // Other
  { icon: "help-circle", keywords: ["ayuda", "pregunta", "información", "help", "question", "information"] },
  { icon: "more-horizontal", keywords: ["más", "opciones", "menú", "more", "options", "menu"] },
  { icon: "star", keywords: ["estrella", "favorito", "destacado", "star", "favorite", "featured"] },
  { icon: "tag", keywords: ["etiqueta", "categoría", "general", "tag", "category", "general"] },
  { icon: "folder", keywords: ["carpeta", "archivo", "organización", "folder", "file", "organization"] },
  { icon: "archive", keywords: ["archivo", "almacenamiento", "guardar", "archive", "storage", "save"] },
  { icon: "package", keywords: ["paquete", "envío", "caja", "package", "shipping", "box"] },
  { icon: "zap", keywords: ["rayo", "energía", "rápido", "lightning", "energy", "fast"] },
  { icon: "target", keywords: ["objetivo", "meta", "blanco", "target", "goal"] },
  { icon: "trophy", keywords: ["trofeo", "premio", "logro", "trophy", "award", "achievement"] },
  { icon: "flag", keywords: ["bandera", "marca", "importante", "flag", "mark", "important"] },
  { icon: "bookmark", keywords: ["marcador", "favorito", "guardar", "bookmark", "favorite", "save"] },
  { icon: "pencil", keywords: ["lápiz", "escribir", "editar", "pencil", "write", "edit"] },
  { icon: "scan", keywords: ["escanear", "qr", "código", "scan", "qr", "code"] },
  { icon: "fingerprint", keywords: ["huella", "seguridad", "biométrico", "fingerprint", "security", "biometric"] },
  { icon: "lock", keywords: ["candado", "seguridad", "privado", "lock", "security", "private"] },
  { icon: "unlock", keywords: ["desbloquear", "abierto", "acceso", "unlock", "open", "access"] },
];

// Export just the icon names for compatibility
export const CATEGORY_ICONS = CATEGORY_ICONS_WITH_KEYWORDS.map(item => item.icon);

// Default icon for new/migrated categories
export const DEFAULT_CATEGORY_ICON = "tag";

// Search function
export function searchIcons(query: string): string[] {
  if (!query.trim()) {
    return CATEGORY_ICONS;
  }

  const searchTerm = query.toLowerCase().trim();

  return CATEGORY_ICONS_WITH_KEYWORDS
    .filter(item =>
      item.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
    )
    .map(item => item.icon);
}
