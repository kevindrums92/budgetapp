/**
 * Comprehensive Category Definitions for AI Transaction Parsing
 * Supports: English (en), Spanish (es), French (fr), Portuguese (pt)
 *
 * Each category includes keywords in all 4 languages to help the AI
 * correctly classify transactions regardless of input language.
 */

export type CategoryType = "expense" | "income";

export interface CategoryDefinition {
  id: string;
  type: CategoryType;
  name: {
    en: string;
    es: string;
    fr: string;
    pt: string;
  };
  keywords: {
    en: string[];
    es: string[];
    fr: string[];
    pt: string[];
  };
}

/**
 * Expense Categories
 */
export const EXPENSE_CATEGORIES: CategoryDefinition[] = [
  {
    id: "food_drink",
    type: "expense",
    name: {
      en: "Food & Drinks",
      es: "Comida y Bebida",
      fr: "Alimentation",
      pt: "Alimentação",
    },
    keywords: {
      en: [
        // Groceries
        "grocery", "groceries", "supermarket", "market", "food", "produce",
        "Walmart", "Costco", "Whole Foods", "Trader Joe's", "Kroger", "Safeway",
        // Restaurants
        "restaurant", "dining", "dinner", "lunch", "breakfast", "brunch",
        "takeout", "take-out", "dine-in", "eat out",
        // Fast food
        "fast food", "McDonald's", "Burger King", "Wendy's", "Taco Bell",
        "Subway", "Chick-fil-A", "KFC", "Pizza Hut", "Domino's",
        // Coffee & drinks
        "coffee", "Starbucks", "Dunkin", "cafe", "tea", "boba",
        // Delivery
        "DoorDash", "Uber Eats", "Grubhub", "Postmates", "delivery",
        // Alcohol
        "bar", "drinks", "beer", "wine", "liquor", "alcohol", "pub",
        // Bakery
        "bakery", "bread", "pastry", "donut", "bagel",
      ],
      es: [
        // Mercado
        "mercado", "supermercado", "tienda", "abarrotes", "víveres",
        "Éxito", "Jumbo", "Carulla", "D1", "Ara", "Oxxo", "Chedraui", "Soriana",
        // Restaurante
        "restaurante", "almuerzo", "cena", "desayuno", "comida",
        "menú", "plato", "buffet",
        // Comida rápida
        "comida rápida", "McDonald's", "Burger King", "Subway",
        "corrientazo", "ejecutivo", "menú del día",
        // Café
        "café", "cafetería", "tinto", "cappuccino", "Juan Valdez", "Starbucks",
        // Domicilio
        "domicilio", "Rappi", "iFood", "Uber Eats", "PedidosYa", "Didi Food",
        // Bebidas
        "bar", "cerveza", "trago", "licor", "guaro", "aguardiente", "ron",
        "cantina", "discoteca", "rumba",
        // Panadería
        "panadería", "pan", "pastelería", "torta", "ponqué", "empanada",
        // Slang
        "luca de almuerzo", "pa' comer", "mecato", "piquete",
      ],
      fr: [
        // Épicerie
        "épicerie", "supermarché", "marché", "alimentation", "provisions",
        "Carrefour", "Auchan", "Leclerc", "Intermarché", "Lidl", "Metro",
        // Restaurant
        "restaurant", "repas", "dîner", "déjeuner", "petit-déjeuner",
        "brasserie", "bistro", "cantine",
        // Restauration rapide
        "fast-food", "McDonald's", "Quick", "Burger King",
        // Café
        "café", "cafétéria", "thé", "expresso",
        // Livraison
        "livraison", "Uber Eats", "Deliveroo", "Just Eat",
        // Boissons
        "bar", "bière", "vin", "apéro", "alcool", "pub", "bistrot",
        // Boulangerie
        "boulangerie", "pain", "pâtisserie", "croissant", "baguette",
      ],
      pt: [
        // Mercado
        "mercado", "supermercado", "mercearia", "feira", "hortifruti",
        "Pão de Açúcar", "Carrefour", "Extra", "Atacadão", "Assaí",
        // Restaurante
        "restaurante", "almoço", "jantar", "café da manhã", "refeição",
        "self-service", "por quilo", "rodízio", "lanchonete",
        // Fast food
        "fast food", "McDonald's", "Burger King", "Bob's", "Habib's",
        // Café
        "café", "cafeteria", "padaria", "Starbucks",
        // Delivery
        "delivery", "iFood", "Rappi", "Uber Eats", "99Food",
        // Bebidas
        "bar", "cerveja", "chopp", "drink", "balada", "boteco", "happy hour",
        // Padaria
        "padaria", "pão", "confeitaria", "doce", "salgado",
        // Slang
        "rango", "boia", "ranguinho", "lanche", "marmita", "quentinha",
      ],
    },
  },
  {
    id: "home_utilities",
    type: "expense",
    name: {
      en: "Home & Utilities",
      es: "Hogar y Servicios",
      fr: "Logement",
      pt: "Moradia",
    },
    keywords: {
      en: [
        // Housing
        "rent", "mortgage", "housing", "apartment", "lease",
        // Utilities
        "utilities", "electricity", "electric bill", "power", "water bill",
        "gas bill", "heating", "AC", "air conditioning",
        // Internet/Phone
        "internet", "wifi", "cable", "phone bill", "mobile",
        "AT&T", "Verizon", "T-Mobile", "Comcast", "Spectrum",
        // Insurance
        "home insurance", "renters insurance",
        // Maintenance
        "maintenance", "repairs", "plumber", "electrician", "handyman",
        "HOA", "condo fee", "property tax",
        // Streaming (home entertainment)
        "Netflix", "Hulu", "Disney+", "HBO Max", "Amazon Prime",
        "Spotify", "Apple Music", "YouTube Premium",
      ],
      es: [
        // Vivienda
        "arriendo", "alquiler", "renta", "hipoteca", "apartamento", "casa",
        "canon", "mensualidad",
        // Servicios
        "servicios", "servicios públicos", "luz", "agua", "gas",
        "electricidad", "energía", "acueducto",
        "EPM", "Enel", "Codensa", "CFE", "Gas Natural",
        // Internet/Teléfono
        "internet", "wifi", "cable", "teléfono", "celular", "plan",
        "Claro", "Movistar", "Tigo", "ETB", "Telcel", "AT&T",
        // Seguros
        "seguro de hogar", "seguro de arrendamiento",
        // Mantenimiento
        "administración", "mantenimiento", "reparación", "plomero",
        "electricista", "arreglo",
        // Streaming
        "Netflix", "Spotify", "Disney+", "HBO Max", "Amazon Prime",
        "YouTube Premium", "Apple Music", "Deezer",
      ],
      fr: [
        // Logement
        "loyer", "hypothèque", "appartement", "maison", "bail",
        // Services
        "charges", "électricité", "eau", "gaz", "chauffage",
        "EDF", "Engie", "Veolia",
        // Internet/Téléphone
        "internet", "wifi", "téléphone", "mobile", "forfait",
        "Orange", "SFR", "Bouygues", "Free",
        // Assurance
        "assurance habitation", "assurance locataire",
        // Entretien
        "charges de copropriété", "entretien", "réparation",
        "plombier", "électricien", "syndic",
        // Streaming
        "Netflix", "Spotify", "Disney+", "Canal+", "OCS",
      ],
      pt: [
        // Moradia
        "aluguel", "hipoteca", "apartamento", "casa", "condomínio",
        // Contas
        "contas", "luz", "água", "gás", "energia", "IPTU",
        "Enel", "CPFL", "Light", "Sabesp", "Comgás",
        // Internet/Telefone
        "internet", "wifi", "telefone", "celular", "plano",
        "Vivo", "Claro", "Tim", "Oi", "NET",
        // Seguro
        "seguro residencial", "seguro do apartamento",
        // Manutenção
        "condomínio", "taxa", "manutenção", "reparo", "conserto",
        "encanador", "eletricista", "síndico",
        // Streaming
        "Netflix", "Spotify", "Disney+", "Globoplay", "Amazon Prime",
      ],
    },
  },
  {
    id: "transport",
    type: "expense",
    name: {
      en: "Transportation",
      es: "Transporte",
      fr: "Transport",
      pt: "Transporte",
    },
    keywords: {
      en: [
        // Fuel
        "gas", "gasoline", "fuel", "petrol", "gas station",
        "Shell", "Chevron", "ExxonMobil", "BP",
        // Public transit
        "bus", "subway", "metro", "train", "transit", "fare",
        // Rideshare
        "Uber", "Lyft", "taxi", "cab", "rideshare",
        // Car
        "parking", "toll", "car wash", "mechanic", "auto repair",
        "oil change", "tire", "car insurance", "registration",
        // Other
        "bicycle", "bike", "scooter", "e-bike",
      ],
      es: [
        // Combustible
        "gasolina", "tanqueo", "combustible", "tanqueada", "full",
        "Terpel", "Primax", "Texaco", "Petrobras", "Pemex",
        // Transporte público
        "bus", "metro", "transmilenio", "metrobus", "colectivo",
        "pasaje", "tarjeta", "saldo", "recarga",
        // Rideshare
        "Uber", "DiDi", "Cabify", "taxi", "InDriver", "Beat",
        // Auto
        "parqueadero", "parking", "peaje", "lavadero", "lavado",
        "mecánico", "taller", "aceite", "llanta", "SOAT",
        "seguro del carro", "revisión técnica", "tecnomecánica",
        // Otros
        "bicicleta", "cicla", "moto", "patineta",
      ],
      fr: [
        // Carburant
        "essence", "carburant", "diesel", "plein", "station-service",
        "Total", "Shell", "BP",
        // Transport public
        "bus", "métro", "tramway", "train", "RER", "ticket", "pass Navigo",
        // VTC
        "Uber", "taxi", "VTC", "Bolt", "Kapten",
        // Voiture
        "parking", "péage", "lavage", "garagiste", "mécanicien",
        "vidange", "pneu", "assurance auto", "contrôle technique",
        // Autres
        "vélo", "Vélib", "trottinette", "Lime",
      ],
      pt: [
        // Combustível
        "gasolina", "combustível", "abastecimento", "posto", "álcool", "etanol",
        "Shell", "Ipiranga", "BR", "Petrobras",
        // Transporte público
        "ônibus", "metrô", "trem", "passagem", "bilhete único", "VLT",
        // Rideshare
        "Uber", "99", "taxi", "InDriver", "Cabify",
        // Carro
        "estacionamento", "pedágio", "lava-rápido", "mecânico", "oficina",
        "troca de óleo", "pneu", "seguro do carro", "IPVA", "licenciamento",
        // Outros
        "bicicleta", "bike", "patinete", "moto",
      ],
    },
  },
  {
    id: "health",
    type: "expense",
    name: {
      en: "Health & Wellness",
      es: "Salud y Bienestar",
      fr: "Santé",
      pt: "Saúde",
    },
    keywords: {
      en: [
        // Medical
        "doctor", "physician", "clinic", "hospital", "urgent care",
        "medical", "health", "checkup", "appointment",
        // Pharmacy
        "pharmacy", "prescription", "medicine", "medication", "drug",
        "CVS", "Walgreens", "Rite Aid",
        // Dental
        "dentist", "dental", "orthodontist", "teeth", "braces",
        // Vision
        "optometrist", "eye doctor", "glasses", "contacts", "vision",
        // Mental health
        "therapy", "therapist", "psychiatrist", "counseling", "mental health",
        // Fitness
        "gym", "fitness", "workout", "personal trainer", "CrossFit",
        "Planet Fitness", "LA Fitness", "24 Hour Fitness", "Equinox",
        // Wellness
        "spa", "massage", "wellness", "vitamins", "supplements",
      ],
      es: [
        // Médico
        "médico", "doctor", "clínica", "hospital", "urgencias",
        "cita médica", "consulta", "EPS", "prepagada",
        // Farmacia
        "farmacia", "droguería", "medicina", "medicamento", "fórmula",
        "La Rebaja", "Colsubsidio", "Cruz Verde", "Farmatodo",
        // Dental
        "dentista", "odontólogo", "ortodoncia", "brackets", "dientes",
        // Óptica
        "óptica", "optómetra", "gafas", "lentes", "lentillas",
        // Salud mental
        "psicólogo", "psiquiatra", "terapia", "terapeuta",
        // Fitness
        "gym", "gimnasio", "entrenador", "CrossFit", "Bodytech", "SmartFit",
        // Bienestar
        "spa", "masaje", "vitaminas", "suplementos",
      ],
      fr: [
        // Médical
        "médecin", "docteur", "clinique", "hôpital", "urgences",
        "consultation", "rendez-vous médical", "mutuelle",
        // Pharmacie
        "pharmacie", "médicament", "ordonnance",
        // Dentaire
        "dentiste", "orthodontiste", "appareil dentaire",
        // Optique
        "opticien", "ophtalmo", "lunettes", "lentilles",
        // Santé mentale
        "psychologue", "psychiatre", "thérapie", "psy",
        // Fitness
        "gym", "salle de sport", "fitness", "coach", "Basic-Fit",
        // Bien-être
        "spa", "massage", "vitamines", "compléments",
      ],
      pt: [
        // Médico
        "médico", "doutor", "clínica", "hospital", "pronto-socorro",
        "consulta", "plano de saúde", "Unimed", "SUS",
        // Farmácia
        "farmácia", "remédio", "medicamento", "receita",
        "Drogasil", "Pacheco", "Raia", "Panvel",
        // Dentista
        "dentista", "ortodontista", "aparelho", "dente",
        // Óptica
        "ótica", "oftalmologista", "óculos", "lente",
        // Saúde mental
        "psicólogo", "psiquiatra", "terapia", "terapeuta",
        // Fitness
        "academia", "gym", "personal", "treino", "SmartFit", "BlueFit",
        // Bem-estar
        "spa", "massagem", "vitamina", "suplemento",
      ],
    },
  },
  {
    id: "shopping",
    type: "expense",
    name: {
      en: "Shopping",
      es: "Compras",
      fr: "Shopping",
      pt: "Compras",
    },
    keywords: {
      en: [
        // General retail
        "shopping", "store", "mall", "outlet",
        "Amazon", "Target", "Walmart", "Best Buy",
        // Clothing
        "clothes", "clothing", "apparel", "fashion", "shoes", "sneakers",
        "Zara", "H&M", "Nike", "Adidas", "Gap", "Old Navy",
        // Electronics
        "electronics", "gadget", "phone", "laptop", "computer", "tablet",
        "Apple Store", "Samsung",
        // Home goods
        "furniture", "home decor", "IKEA", "Bed Bath & Beyond",
        "kitchen", "appliance",
      ],
      es: [
        // Retail general
        "compras", "tienda", "centro comercial", "outlet", "mall",
        "Amazon", "Mercado Libre", "Falabella", "Liverpool",
        // Ropa
        "ropa", "vestido", "zapatos", "tenis", "zapatillas",
        "Zara", "H&M", "Nike", "Adidas", "Bershka", "Pull&Bear",
        // Electrónica
        "electrónica", "celular", "computador", "portátil", "tablet",
        "Apple", "Samsung", "Alkosto", "Éxito", "Elektra",
        // Hogar
        "muebles", "decoración", "electrodoméstico", "cocina",
        "Homecenter", "IKEA", "Easy",
      ],
      fr: [
        // Retail général
        "shopping", "magasin", "centre commercial", "boutique",
        "Amazon", "Fnac", "Darty", "Cdiscount",
        // Vêtements
        "vêtements", "habits", "chaussures", "baskets", "mode",
        "Zara", "H&M", "Nike", "Adidas", "Kiabi", "Decathlon",
        // Électronique
        "électronique", "téléphone", "ordinateur", "portable", "tablette",
        "Apple", "Samsung", "Boulanger",
        // Maison
        "meubles", "décoration", "électroménager", "cuisine",
        "IKEA", "Conforama", "But", "Maisons du Monde",
      ],
      pt: [
        // Retail geral
        "compras", "loja", "shopping", "outlet",
        "Amazon", "Mercado Livre", "Magazine Luiza", "Americanas",
        // Roupas
        "roupa", "vestido", "sapato", "tênis", "calçado",
        "Zara", "H&M", "Nike", "Adidas", "Renner", "C&A", "Riachuelo",
        // Eletrônica
        "eletrônico", "celular", "computador", "notebook", "tablet",
        "Apple", "Samsung", "Casas Bahia", "Fast Shop",
        // Casa
        "móveis", "decoração", "eletrodoméstico", "cozinha",
        "IKEA", "Tok&Stok", "Etna", "Leroy Merlin",
      ],
    },
  },
  {
    id: "entertainment",
    type: "expense",
    name: {
      en: "Entertainment",
      es: "Entretenimiento",
      fr: "Loisirs",
      pt: "Lazer",
    },
    keywords: {
      en: [
        // Movies & shows
        "movie", "cinema", "theater", "concert", "show", "ticket",
        "AMC", "Regal", "Cinemark",
        // Games
        "game", "gaming", "video game", "PlayStation", "Xbox", "Nintendo",
        "Steam", "Epic Games",
        // Events
        "event", "festival", "sports", "game tickets", "match",
        // Hobbies
        "hobby", "craft", "art supplies", "music", "instrument",
        // Nightlife
        "club", "nightclub", "party", "cover charge",
      ],
      es: [
        // Cine & espectáculos
        "cine", "película", "teatro", "concierto", "show", "boleta", "entrada",
        "Cinemark", "Cinépolis", "Cineplanet",
        // Juegos
        "videojuego", "juego", "PlayStation", "Xbox", "Nintendo",
        "Steam", "consola",
        // Eventos
        "evento", "festival", "fútbol", "partido", "estadio",
        // Hobbies
        "hobby", "arte", "música", "instrumento",
        // Vida nocturna
        "discoteca", "club", "fiesta", "rumba", "cover", "entrada",
      ],
      fr: [
        // Cinéma & spectacles
        "cinéma", "film", "théâtre", "concert", "spectacle", "billet",
        "Pathé", "Gaumont", "UGC",
        // Jeux
        "jeu vidéo", "gaming", "PlayStation", "Xbox", "Nintendo",
        // Événements
        "événement", "festival", "match", "stade", "sport",
        // Loisirs
        "loisir", "hobby", "musique", "instrument",
        // Vie nocturne
        "boîte de nuit", "club", "soirée", "fête",
      ],
      pt: [
        // Cinema & shows
        "cinema", "filme", "teatro", "show", "concerto", "ingresso",
        "Cinemark", "Cinépolis", "UCI",
        // Jogos
        "jogo", "videogame", "PlayStation", "Xbox", "Nintendo", "Steam",
        // Eventos
        "evento", "festival", "futebol", "jogo", "estádio", "partida",
        // Hobbies
        "hobby", "arte", "música", "instrumento",
        // Vida noturna
        "balada", "clube", "festa", "noitada", "entrada",
      ],
    },
  },
  {
    id: "education",
    type: "expense",
    name: {
      en: "Education",
      es: "Educación",
      fr: "Éducation",
      pt: "Educação",
    },
    keywords: {
      en: [
        "school", "university", "college", "tuition", "education",
        "course", "class", "training", "workshop", "seminar",
        "books", "textbook", "supplies", "student loan",
        "Coursera", "Udemy", "LinkedIn Learning", "Masterclass",
        "certification", "degree", "diploma",
      ],
      es: [
        "colegio", "universidad", "escuela", "matrícula", "pensión",
        "curso", "clase", "capacitación", "taller", "seminario",
        "libros", "útiles", "cuaderno", "crédito educativo",
        "Coursera", "Udemy", "Platzi", "Crehana",
        "certificación", "carrera", "diplomado", "posgrado", "maestría",
      ],
      fr: [
        "école", "université", "fac", "frais de scolarité", "inscription",
        "cours", "formation", "atelier", "séminaire",
        "livres", "manuels", "fournitures",
        "Coursera", "Udemy", "OpenClassrooms",
        "certification", "diplôme", "licence", "master",
      ],
      pt: [
        "escola", "universidade", "faculdade", "mensalidade", "matrícula",
        "curso", "aula", "treinamento", "workshop", "seminário",
        "livros", "material", "caderno", "financiamento estudantil",
        "Coursera", "Udemy", "Alura", "Descomplica",
        "certificação", "graduação", "pós-graduação", "mestrado",
      ],
    },
  },
  {
    id: "travel",
    type: "expense",
    name: {
      en: "Travel",
      es: "Viajes",
      fr: "Voyages",
      pt: "Viagens",
    },
    keywords: {
      en: [
        // Flights
        "flight", "airplane", "airline", "airport", "plane ticket",
        "Delta", "United", "American Airlines", "Southwest",
        // Accommodation
        "hotel", "Airbnb", "hostel", "resort", "motel", "lodging",
        "Booking.com", "Expedia", "Hotels.com",
        // Travel
        "vacation", "trip", "travel", "tourism", "sightseeing",
        "tour", "excursion", "cruise",
        // Car rental
        "rental car", "car rental", "Hertz", "Enterprise", "Avis",
      ],
      es: [
        // Vuelos
        "vuelo", "avión", "aerolínea", "aeropuerto", "tiquete", "pasaje",
        "Avianca", "LATAM", "Viva Air", "Copa",
        // Alojamiento
        "hotel", "Airbnb", "hostal", "resort", "hospedaje",
        "Booking", "Expedia", "Despegar",
        // Viaje
        "vacaciones", "viaje", "turismo", "tour", "excursión", "paseo",
        "crucero", "paquete turístico",
        // Alquiler de auto
        "alquiler de carro", "rent a car", "Hertz", "Avis", "Budget",
      ],
      fr: [
        // Vols
        "vol", "avion", "compagnie aérienne", "aéroport", "billet d'avion",
        "Air France", "EasyJet", "Ryanair", "Transavia",
        // Hébergement
        "hôtel", "Airbnb", "auberge", "gîte", "chambre d'hôtes",
        "Booking", "Expedia",
        // Voyage
        "vacances", "voyage", "tourisme", "excursion", "croisière",
        // Location de voiture
        "location de voiture", "Hertz", "Europcar", "Sixt",
      ],
      pt: [
        // Voos
        "voo", "avião", "companhia aérea", "aeroporto", "passagem",
        "GOL", "LATAM", "Azul", "TAP",
        // Hospedagem
        "hotel", "Airbnb", "pousada", "resort", "hospedagem",
        "Booking", "Decolar", "Hurb",
        // Viagem
        "férias", "viagem", "turismo", "passeio", "excursão", "cruzeiro",
        // Aluguel de carro
        "aluguel de carro", "rent a car", "Localiza", "Movida", "Unidas",
      ],
    },
  },
  {
    id: "financial",
    type: "expense",
    name: {
      en: "Financial",
      es: "Finanzas",
      fr: "Finance",
      pt: "Finanças",
    },
    keywords: {
      en: [
        // Crypto & investments (priority)
        "investment", "invested", "invest", "bitcoin", "btc", "crypto", "cryptocurrency",
        "ethereum", "stocks", "stock market", "trading", "brokerage",
        // Banking
        "bank fee", "service charge", "ATM fee", "overdraft",
        "interest", "loan payment", "credit card payment",
        "insurance", "life insurance", "premium", "commission",
        "tax", "taxes", "accounting", "accountant",
        "wire transfer", "money transfer", "remittance",
      ],
      es: [
        // Crypto & inversiones (prioritario)
        "inversión", "invertí", "invertir", "bitcoin", "btc", "cripto", "criptomoneda",
        "ethereum", "acciones", "bolsa", "trading",
        // Bancario
        "cuota de manejo", "comisión bancaria", "cargo", "sobregiro",
        "intereses", "cuota préstamo", "crédito", "tarjeta de crédito",
        "seguro", "seguro de vida", "prima", "póliza",
        "corretaje", "comisión",
        "impuesto", "IVA", "renta", "declaración", "contador",
        "transferencia", "giro", "remesa",
      ],
      fr: [
        // Crypto & investissements (prioritaire)
        "investissement", "investi", "investir", "bitcoin", "btc", "crypto", "cryptomonnaie",
        "ethereum", "actions", "bourse", "trading",
        // Bancaire
        "frais bancaires", "commission", "agios", "découvert",
        "intérêts", "remboursement prêt", "crédit", "carte de crédit",
        "assurance", "assurance vie", "prime", "courtage",
        "impôt", "taxes", "comptable",
        "virement", "transfert",
      ],
      pt: [
        // Crypto & investimentos (prioridade)
        "investimento", "investi", "investir", "bitcoin", "btc", "cripto", "criptomoeda",
        "ethereum", "ações", "bolsa", "trading",
        // Bancário
        "taxa bancária", "tarifa", "IOF", "cheque especial",
        "juros", "parcela", "empréstimo", "cartão de crédito",
        "seguro", "seguro de vida", "apólice", "corretagem",
        "imposto", "IR", "IPVA", "contador", "declaração",
        "transferência", "TED", "PIX", "DOC",
      ],
    },
  },
  {
    id: "family",
    type: "expense",
    name: {
      en: "Family & Kids",
      es: "Familia",
      fr: "Famille",
      pt: "Família",
    },
    keywords: {
      en: [
        "childcare", "daycare", "babysitter", "nanny",
        "kids", "children", "baby", "toddler",
        "school supplies", "school fee", "tuition",
        "toys", "diapers", "formula", "baby food",
        "kids clothes", "children's activities", "camp",
      ],
      es: [
        "guardería", "jardín", "niñera", "cuidado niños",
        "hijos", "niños", "bebé",
        "útiles escolares", "pensión colegio", "matrícula",
        "juguetes", "pañales", "leche fórmula", "papilla",
        "ropa de niños", "actividades niños", "campamento",
      ],
      fr: [
        "crèche", "garderie", "baby-sitter", "nounou",
        "enfants", "bébé",
        "fournitures scolaires", "frais de scolarité",
        "jouets", "couches", "lait maternisé",
        "vêtements enfants", "activités enfants", "colonie",
      ],
      pt: [
        "creche", "berçário", "babá",
        "filhos", "crianças", "bebê",
        "material escolar", "mensalidade escola",
        "brinquedos", "fraldas", "fórmula", "papinha",
        "roupa de criança", "atividades", "colônia de férias",
      ],
    },
  },
  {
    id: "pets",
    type: "expense",
    name: {
      en: "Pets",
      es: "Mascotas",
      fr: "Animaux",
      pt: "Pets",
    },
    keywords: {
      en: [
        "pet", "dog", "cat", "puppy", "kitten",
        "pet food", "dog food", "cat food",
        "vet", "veterinarian", "veterinary",
        "grooming", "pet supplies", "pet store",
        "PetSmart", "Petco", "Chewy",
      ],
      es: [
        "mascota", "perro", "gato", "cachorro", "gatito",
        "comida mascota", "concentrado", "cuido",
        "veterinario", "veterinaria",
        "peluquería canina", "baño", "corte",
        "tienda de mascotas", "accesorios mascota",
      ],
      fr: [
        "animal", "chien", "chat", "chiot", "chaton",
        "nourriture animal", "croquettes",
        "vétérinaire", "véto",
        "toilettage", "animalerie",
        "Jardiland", "Truffaut",
      ],
      pt: [
        "pet", "cachorro", "gato", "filhote",
        "ração", "comida de pet",
        "veterinário", "vet",
        "banho e tosa", "petshop",
        "Petz", "Cobasi",
      ],
    },
  },
  {
    id: "gifts",
    type: "expense",
    name: {
      en: "Gifts & Donations",
      es: "Regalos y Donaciones",
      fr: "Cadeaux et Dons",
      pt: "Presentes e Doações",
    },
    keywords: {
      en: [
        "gift", "present", "birthday gift", "Christmas gift",
        "donation", "charity", "tip", "gratuity",
        "wedding gift", "baby shower", "gift card",
      ],
      es: [
        "regalo", "obsequio", "cumpleaños", "navidad",
        "donación", "caridad", "propina",
        "matrimonio", "baby shower", "bono regalo",
        "detalle", "presente",
      ],
      fr: [
        "cadeau", "anniversaire", "Noël",
        "don", "donation", "charité", "pourboire",
        "mariage", "carte cadeau",
      ],
      pt: [
        "presente", "aniversário", "Natal",
        "doação", "caridade", "gorjeta",
        "casamento", "chá de bebê", "vale-presente",
      ],
    },
  },
  {
    id: "personal_care",
    type: "expense",
    name: {
      en: "Personal Care",
      es: "Cuidado Personal",
      fr: "Soins Personnels",
      pt: "Cuidado Pessoal",
    },
    keywords: {
      en: [
        "haircut", "hair salon", "barber", "barbershop",
        "beauty", "nails", "manicure", "pedicure",
        "skincare", "cosmetics", "makeup",
        "Sephora", "Ulta",
      ],
      es: [
        "peluquería", "barbería", "corte de pelo", "tinte",
        "uñas", "manicure", "pedicure", "salón de belleza",
        "maquillaje", "cosméticos", "skincare", "crema",
      ],
      fr: [
        "coiffeur", "coiffure", "barbier",
        "ongles", "manucure", "pédicure", "salon de beauté",
        "maquillage", "cosmétiques", "soins",
        "Sephora", "Nocibé",
      ],
      pt: [
        "cabeleireiro", "salão", "barbearia", "corte",
        "unha", "manicure", "pedicure",
        "maquiagem", "cosméticos", "skincare",
        "Sephora", "O Boticário",
      ],
    },
  },
  {
    id: "subscriptions",
    type: "expense",
    name: {
      en: "Subscriptions",
      es: "Suscripciones",
      fr: "Abonnements",
      pt: "Assinaturas",
    },
    keywords: {
      en: [
        "subscription", "membership", "monthly fee", "annual fee",
        "Netflix", "Spotify", "Apple Music", "YouTube Premium",
        "Disney+", "HBO Max", "Amazon Prime", "Hulu",
        "gym membership", "magazine", "newspaper",
        "software subscription", "cloud storage", "iCloud", "Dropbox",
      ],
      es: [
        "suscripción", "membresía", "mensualidad", "anualidad",
        "Netflix", "Spotify", "Apple Music", "YouTube Premium",
        "Disney+", "HBO Max", "Amazon Prime", "Star+",
        "membresía gym", "revista", "periódico",
        "software", "nube", "iCloud", "Dropbox",
      ],
      fr: [
        "abonnement", "adhésion", "mensuel", "annuel",
        "Netflix", "Spotify", "Apple Music", "YouTube Premium",
        "Disney+", "Canal+", "Amazon Prime", "OCS",
        "abonnement salle", "magazine", "journal",
        "logiciel", "cloud", "iCloud", "Dropbox",
      ],
      pt: [
        "assinatura", "mensalidade", "anuidade",
        "Netflix", "Spotify", "Apple Music", "YouTube Premium",
        "Disney+", "HBO Max", "Amazon Prime", "Globoplay",
        "mensalidade academia", "revista", "jornal",
        "software", "nuvem", "iCloud", "Dropbox",
      ],
    },
  },
  {
    id: "miscellaneous",
    type: "expense",
    name: {
      en: "Other",
      es: "Otros",
      fr: "Autres",
      pt: "Outros",
    },
    keywords: {
      en: ["other", "misc", "miscellaneous", "general", "various"],
      es: ["otro", "otros", "varios", "misceláneos", "general"],
      fr: ["autre", "autres", "divers", "général"],
      pt: ["outro", "outros", "diversos", "geral", "variados"],
    },
  },
];

/**
 * Income Categories
 */
export const INCOME_CATEGORIES: CategoryDefinition[] = [
  {
    id: "primary_income",
    type: "income",
    name: {
      en: "Primary Income",
      es: "Ingresos Principales",
      fr: "Revenu Principal",
      pt: "Renda Principal",
    },
    keywords: {
      en: [
        "salary", "wages", "paycheck", "income", "pay",
        "direct deposit", "payroll", "compensation",
        "bi-weekly", "monthly salary",
      ],
      es: [
        "salario", "sueldo", "nómina", "quincena", "pago",
        "ingreso", "mensualidad", "prima", "bonificación",
        "aguinaldo", "décimo tercero",
      ],
      fr: [
        "salaire", "paie", "rémunération", "traitement",
        "revenu", "mensuel", "prime",
      ],
      pt: [
        "salário", "pagamento", "renda", "ordenado",
        "holerite", "contracheque", "décimo terceiro", "13º",
      ],
    },
  },
  {
    id: "secondary_income",
    type: "income",
    name: {
      en: "Secondary Income",
      es: "Ingresos Secundarios",
      fr: "Revenu Secondaire",
      pt: "Renda Extra",
    },
    keywords: {
      en: [
        "freelance", "side gig", "part-time", "contract",
        "consulting", "gig", "extra income", "side hustle",
        "Fiverr", "Upwork", "commission",
      ],
      es: [
        "freelance", "trabajo extra", "medio tiempo", "contrato",
        "consultoría", "honorarios", "comisión", "extras",
        "trabajito", "rebusque", "chambita",
      ],
      fr: [
        "freelance", "travail supplémentaire", "temps partiel",
        "mission", "consultation", "commission", "extra",
      ],
      pt: [
        "freelance", "bico", "extra", "meio período",
        "consultoria", "comissão", "trabalho extra",
        "freela", "job", "trampo extra",
      ],
    },
  },
  {
    id: "investment_income",
    type: "income",
    name: {
      en: "Investments",
      es: "Inversiones",
      fr: "Investissements",
      pt: "Investimentos",
    },
    keywords: {
      en: [
        "dividend", "dividends", "interest", "investment",
        "stock", "shares", "capital gains", "return",
        "bond", "yield", "portfolio",
      ],
      es: [
        "dividendo", "dividendos", "intereses", "inversión",
        "acciones", "rendimiento", "CDT", "fiducia",
        "bonos", "utilidades", "ganancia",
      ],
      fr: [
        "dividende", "intérêts", "investissement",
        "actions", "rendement", "plus-value",
        "obligations", "portefeuille",
      ],
      pt: [
        "dividendo", "juros", "investimento",
        "ações", "rendimento", "CDB", "Tesouro Direto",
        "FII", "fundos", "ganho de capital",
      ],
    },
  },
  {
    id: "business_income",
    type: "income",
    name: {
      en: "Business",
      es: "Negocio",
      fr: "Entreprise",
      pt: "Negócio",
    },
    keywords: {
      en: [
        "business", "sales", "revenue", "profit",
        "client payment", "invoice", "service fee",
        "self-employed", "entrepreneur",
      ],
      es: [
        "negocio", "ventas", "ingresos", "ganancia",
        "factura", "servicio", "cliente",
        "emprendimiento", "empresa", "comercio",
      ],
      fr: [
        "entreprise", "ventes", "chiffre d'affaires", "bénéfice",
        "facture", "client", "prestation",
        "auto-entrepreneur",
      ],
      pt: [
        "negócio", "vendas", "faturamento", "lucro",
        "nota fiscal", "cliente", "serviço",
        "MEI", "empreendedor", "empresa",
      ],
    },
  },
  {
    id: "government",
    type: "income",
    name: {
      en: "Government",
      es: "Gobierno",
      fr: "Gouvernement",
      pt: "Governo",
    },
    keywords: {
      en: [
        "tax refund", "government", "benefit", "stimulus",
        "social security", "unemployment", "pension",
        "disability", "welfare", "subsidy",
      ],
      es: [
        "devolución impuestos", "gobierno", "subsidio", "auxilio",
        "pensión", "cesantías", "incapacidad",
        "Familias en Acción", "Ingreso Solidario",
      ],
      fr: [
        "remboursement impôts", "gouvernement", "allocation",
        "chômage", "retraite", "CAF", "RSA",
        "prime", "aide sociale",
      ],
      pt: [
        "restituição IR", "governo", "benefício", "auxílio",
        "aposentadoria", "INSS", "seguro-desemprego",
        "Bolsa Família", "auxílio emergencial",
      ],
    },
  },
  {
    id: "other_income",
    type: "income",
    name: {
      en: "Other Income",
      es: "Otros Ingresos",
      fr: "Autres Revenus",
      pt: "Outras Rendas",
    },
    keywords: {
      en: [
        "refund", "reimbursement", "gift received", "inheritance",
        "lottery", "prize", "cashback", "rebate",
        "sale", "sold", "selling",
      ],
      es: [
        "reembolso", "devolución", "regalo recibido", "herencia",
        "lotería", "premio", "cashback", "rifa",
        "venta", "vendí", "vendido",
      ],
      fr: [
        "remboursement", "cadeau reçu", "héritage",
        "loterie", "prix", "cashback",
        "vente", "vendu",
      ],
      pt: [
        "reembolso", "estorno", "presente recebido", "herança",
        "loteria", "prêmio", "cashback",
        "venda", "vendi", "vendido",
      ],
    },
  },
];

/**
 * Get all categories
 */
export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

/**
 * Get category IDs for validation
 */
export const EXPENSE_CATEGORY_IDS = EXPENSE_CATEGORIES.map((c) => c.id);
export const INCOME_CATEGORY_IDS = INCOME_CATEGORIES.map((c) => c.id);
export const ALL_CATEGORY_IDS = ALL_CATEGORIES.map((c) => c.id);

/**
 * Generate keywords section for prompt (all languages combined)
 */
export function generateCategoryKeywordsForPrompt(): string {
  let result = "";

  result += "EXPENSE CATEGORIES (type: \"expense\"):\n";
  for (const cat of EXPENSE_CATEGORIES) {
    result += `\n- ${cat.id}: ${cat.name.en}\n`;
    result += `  Keywords: ${[
      ...cat.keywords.en.slice(0, 10),
      ...cat.keywords.es.slice(0, 10),
      ...cat.keywords.fr.slice(0, 5),
      ...cat.keywords.pt.slice(0, 5),
    ].join(", ")}\n`;
  }

  result += "\nINCOME CATEGORIES (type: \"income\"):\n";
  for (const cat of INCOME_CATEGORIES) {
    result += `\n- ${cat.id}: ${cat.name.en}\n`;
    result += `  Keywords: ${[
      ...cat.keywords.en.slice(0, 10),
      ...cat.keywords.es.slice(0, 10),
      ...cat.keywords.fr.slice(0, 5),
      ...cat.keywords.pt.slice(0, 5),
    ].join(", ")}\n`;
  }

  return result;
}
