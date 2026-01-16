export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TransactionType;
  name: string;
  category: string;      // Category ID (or legacy string name)
  amount: number;        // siempre positivo
  date: string;          // YYYY-MM-DD
  createdAt: number;     // epoch ms
};

// ==================== CATEGORIES ====================

export type CategoryGroupId =
  // Expense groups
  | "food_drink"
  | "home_utilities"
  | "lifestyle"
  | "transport"
  | "miscellaneous"
  // Income groups
  | "primary_income"
  | "other_income";

export type CategoryGroup = {
  id: CategoryGroupId;
  name: string;
  type: TransactionType;
};

export type Category = {
  id: string;
  name: string;
  icon: string;           // lucide icon name (e.g., "shopping-basket")
  color: string;          // hex color (e.g., "#10B981")
  type: TransactionType;
  groupId: CategoryGroupId;
  isDefault: boolean;
  createdAt: number;
  monthlyLimit?: number;  // Monthly budget limit (undefined = no limit)
};

// ==================== TRIPS ====================

export type TripStatus = "planning" | "active" | "completed";

export type TripExpenseCategory =
  | "transport"      // Vuelos, taxis, lanchas
  | "accommodation"  // Hotel, Airbnb
  | "food"           // Restaurantes, mercado
  | "activities"     // Tours, entradas
  | "shopping"       // Souvenirs, compras
  | "other";

export type TripExpense = {
  id: string;
  tripId: string;
  category: TripExpenseCategory;
  name: string;              // "Almuerzo en Johnny Cay"
  amount: number;            // siempre positivo
  date: string;              // YYYY-MM-DD
  notes?: string;
  createdAt: number;         // epoch ms
};

export type Trip = {
  id: string;
  name: string;              // "San Andrés Islas 2026"
  destination: string;       // "San Andrés, Colombia"
  budget: number;            // Presupuesto total
  startDate: string;         // YYYY-MM-DD
  endDate: string | null;    // YYYY-MM-DD (null si aún en curso)
  status: TripStatus;
  createdAt: number;         // epoch ms
};

// ==================== STATE ====================

export type BudgetState = {
  schemaVersion: 1 | 2;
  transactions: Transaction[];
  categories: string[];              // Legacy: kept for backward compat
  categoryDefinitions: Category[];   // New: full category objects
  // Trips
  trips: Trip[];
  tripExpenses: TripExpense[];
};
