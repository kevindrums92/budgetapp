export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TransactionType;
  name: string;
  category: string;
  amount: number;    // siempre positivo
  date: string;      // YYYY-MM-DD
  createdAt: number; // epoch ms
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
  schemaVersion: 1;
  transactions: Transaction[];
  categories: string[];
  // Trips
  trips: Trip[];
  tripExpenses: TripExpense[];
};
