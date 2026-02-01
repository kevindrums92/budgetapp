export type TransactionType = "income" | "expense";
export type TransactionStatus = "paid" | "pending" | "planned";

export type ScheduleFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type Schedule = {
  enabled: boolean;
  frequency: ScheduleFrequency;
  interval: number;           // every X days/weeks/months/years
  startDate: string;          // YYYY-MM-DD
  endDate?: string;           // YYYY-MM-DD (optional end)
  dayOfWeek?: number;         // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number;        // 1-31 for monthly
  lastGenerated?: string;     // YYYY-MM-DD - track last auto-created tx
};

export type Transaction = {
  id: string;
  type: TransactionType;
  name: string;
  category: string;      // Category ID (or legacy string name)
  amount: number;        // siempre positivo
  date: string;          // YYYY-MM-DD
  notes?: string;        // Optional notes
  isRecurring?: boolean; // DEPRECATED: Legacy field, use schedule instead
  schedule?: Schedule;   // Scheduled transaction configuration
  status?: TransactionStatus; // Estado de pago (default: "paid")
  sourceTemplateId?: string;  // ID of the template transaction that generated this (for scheduled)
  createdAt: number;     // epoch ms
};

// ==================== CATEGORIES ====================

export type CategoryGroup = {
  id: string;
  name: string;
  type: TransactionType;
  color: string;          // hex color for group icon
  isDefault: boolean;     // true for built-in groups
  createdAt: number;      // epoch ms
};

export type Category = {
  id: string;
  name: string;
  icon: string;           // lucide icon name (e.g., "shopping-basket")
  color: string;          // hex color (e.g., "#10B981")
  type: TransactionType;
  groupId: string;        // Reference to CategoryGroup.id
  isDefault: boolean;
  createdAt: number;
};

// ==================== BUDGETS ====================

export type BudgetPeriodType = "week" | "month" | "quarter" | "year" | "custom";

export type BudgetPeriod = {
  type: BudgetPeriodType;
  startDate: string;      // YYYY-MM-DD
  endDate: string;        // YYYY-MM-DD
};

export type BudgetStatus = "active" | "completed" | "archived";

export type BudgetType = "limit" | "goal";

export type Budget = {
  id: string;
  categoryId: string;     // Reference to Category.id
  amount: number;         // Presupuesto asignado (límite para 'limit', meta para 'goal')
  type: BudgetType;       // Tipo: límite de gasto o meta de ahorro
  period: BudgetPeriod;   // Período del presupuesto
  accountId?: string;     // Optional: Para futura feature de cuentas
  isRecurring: boolean;   // Si se renueva automáticamente
  status: BudgetStatus;   // Estado del presupuesto
  createdAt: number;      // epoch ms
};

// Helper type for budget progress calculations
export type BudgetProgress = {
  budget: Budget;
  category: Category;
  spent: number;          // Para limits: cuánto se ha gastado
  saved: number;          // Para goals: cuánto se ha ahorrado
  percentage: number;     // 0-100+ (puede superar 100 en limits)
  remaining: number;      // Para limits: cuánto queda | Para goals: cuánto falta
  isExceeded: boolean;    // Solo para limits: si se superó el límite
  isCompleted: boolean;   // Solo para goals: si se alcanzó la meta
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

// ==================== SECURITY ====================

export type SecuritySettings = {
  biometricEnabled: boolean;
  lastAuthTimestamp?: number;
};

// ==================== SUBSCRIPTION ====================

export type SubscriptionPlanStatus = 'free' | 'trialing' | 'active' | 'expired' | 'cancelled';

export type SubscriptionPlanType = 'free' | 'trial' | 'monthly' | 'annual' | 'lifetime';

export type SubscriptionState = {
  status: SubscriptionPlanStatus;
  type: SubscriptionPlanType;
  trialEndsAt: string | null;    // ISO 8601
  expiresAt: string | null;      // ISO 8601
  lastChecked: string;           // ISO 8601
};

// ==================== STATE ====================

export type BudgetState = {
  schemaVersion: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  transactions: Transaction[];
  categories: string[];              // Legacy: kept for backward compat
  categoryDefinitions: Category[];   // Full category objects
  categoryGroups: CategoryGroup[];   // Dynamic category groups
  // Budgets
  budgets: Budget[];                 // Budget tracking per category/period
  // Trips
  trips: Trip[];
  tripExpenses: TripExpense[];
  // Onboarding flags
  welcomeSeen?: boolean;             // First-time welcome onboarding completed
  budgetOnboardingSeen?: boolean;    // Budget module onboarding completed
  savingsGoalOnboardingSeen?: boolean; // Savings goal onboarding completed
  // Scheduler
  lastSchedulerRun?: string;         // YYYY-MM-DD - last time scheduler ran
  cloudSyncReady?: boolean;          // Flag: CloudSync completed initial pull
  // Stats preferences
  excludedFromStats?: string[]; // Category IDs excluded from all stats calculations
  // Security
  security?: SecuritySettings;       // Biometric authentication settings
  // NOTE: Subscription is NO LONGER part of BudgetState (as of v2.0)
  // Subscription is now stored separately in user_subscriptions table
  // and managed by RevenueCat webhooks. See subscription.service.ts
};
