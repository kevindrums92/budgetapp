import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PlanDetailPage from './PlanDetailPage';
import { useBudgetStore } from '@/state/budget.store';
import type { Transaction, Budget, Category, BudgetProgress } from '@/types/budget.types';

// Mock the budget store
vi.mock('@/state/budget.store');

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'es' },
  }),
}));

// Mock useCurrency
vi.mock('@/features/currency', () => ({
  useCurrency: () => ({
    formatAmount: (amount: number) => `$ ${amount.toLocaleString()}`,
    currencyInfo: { symbol: '$', code: 'COP' },
    currency: 'COP',
  }),
}));

// Mock AddEditBudgetModal
vi.mock('@/features/budget/components/AddEditBudgetModal', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="edit-modal">Edit Modal</div> : null,
}));

const mockCategory: Category = {
  id: 'cat-hijos',
  name: 'Hijos',
  icon: 'baby',
  color: '#8B5CF6',
  type: 'expense',
  groupId: 'group-1',
  isDefault: false,
  createdAt: Date.now(),
};

const mockAnnualBudget: Budget = {
  id: 'budget-hijos-annual',
  categoryId: 'cat-hijos',
  type: 'limit',
  amount: 5000000,
  period: {
    type: 'year',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  },
  status: 'active',
  isRecurring: false,
  createdAt: Date.now(),
};

// Transactions spread across the whole year
const makeTransaction = (id: string, date: string, amount: number, name: string): Transaction => ({
  id,
  name,
  amount,
  type: 'expense',
  category: 'cat-hijos',
  date,
  createdAt: Date.now(),
});

const yearTransactions: Transaction[] = [
  makeTransaction('tx-jan-01', '2026-01-01', 100000, 'Cuota colegio enero'),
  makeTransaction('tx-jan-15', '2026-01-15', 50000, 'Utiles escolares'),
  makeTransaction('tx-jan-31', '2026-01-31', 80000, 'Ropa hijos'),
  makeTransaction('tx-feb-10', '2026-02-10', 120000, 'Cuota colegio febrero'),
  makeTransaction('tx-feb-28', '2026-02-28', 30000, 'Materiales febrero'),
  makeTransaction('tx-mar-05', '2026-03-05', 90000, 'Cuota colegio marzo'),
  makeTransaction('tx-jun-15', '2026-06-15', 200000, 'Vacaciones hijos'),
  makeTransaction('tx-sep-01', '2026-09-01', 150000, 'Cuota septiembre'),
  makeTransaction('tx-dec-20', '2026-12-20', 300000, 'Regalos navidad'),
  makeTransaction('tx-dec-31', '2026-12-31', 50000, 'Fin de ano'),
];

// Transaction outside the budget period
const outsideTransaction = makeTransaction('tx-prev-year', '2025-12-31', 75000, 'Gasto ano anterior');

// Income transaction (should be excluded from limit budgets)
const incomeTransaction: Transaction = {
  id: 'tx-income',
  name: 'Reembolso',
  amount: 20000,
  type: 'income',
  category: 'cat-hijos',
  date: '2026-03-10',
  createdAt: Date.now(),
};

// Transaction from a different category
const otherCategoryTx = makeTransaction('tx-other-cat', '2026-02-15', 60000, 'Almuerzo');
otherCategoryTx.category = 'cat-food';

function renderPlanDetail(budgetId: string) {
  return render(
    <MemoryRouter initialEntries={[`/plan/${budgetId}`]}>
      <Routes>
        <Route path="/plan/:id" element={<PlanDetailPage />} />
        <Route path="/plan" element={<div>Budget List</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PlanDetailPage - Transaction Date Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Annual Budget - All months should be included', () => {
    it('should show all transactions within annual period (Jan 1 - Dec 31)', () => {
      const allTransactions = [...yearTransactions, outsideTransaction, incomeTransaction, otherCategoryTx];

      const mockProgress: BudgetProgress = {
        budget: mockAnnualBudget,
        category: mockCategory,
        spent: yearTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        saved: 0,
        percentage: 0,
        remaining: 0,
        isExceeded: false,
        isCompleted: false,
      };

      const state = {
          transactions: allTransactions,
          budgets: [mockAnnualBudget],
          getBudgetProgress: (id: string) => id === 'budget-hijos-annual' ? mockProgress : null,
          deleteBudget: vi.fn(),
        };
      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector?: (s: unknown) => unknown) => {
        return selector ? selector(state) : state;
      });

      renderPlanDetail('budget-hijos-annual');

      // All year transactions should be visible
      expect(screen.getByText('Cuota colegio enero')).toBeInTheDocument();
      expect(screen.getByText('Utiles escolares')).toBeInTheDocument();
      expect(screen.getByText('Ropa hijos')).toBeInTheDocument();
      expect(screen.getByText('Cuota colegio febrero')).toBeInTheDocument();
      expect(screen.getByText('Materiales febrero')).toBeInTheDocument();
      expect(screen.getByText('Cuota colegio marzo')).toBeInTheDocument();
      expect(screen.getByText('Vacaciones hijos')).toBeInTheDocument();
      expect(screen.getByText('Cuota septiembre')).toBeInTheDocument();
      expect(screen.getByText('Regalos navidad')).toBeInTheDocument();
      expect(screen.getByText('Fin de ano')).toBeInTheDocument();
    });

    it('should exclude transactions outside the annual period', () => {
      const allTransactions = [...yearTransactions, outsideTransaction];

      const mockProgress: BudgetProgress = {
        budget: mockAnnualBudget,
        category: mockCategory,
        spent: 0,
        saved: 0,
        percentage: 0,
        remaining: 0,
        isExceeded: false,
        isCompleted: false,
      };

      const state = {
          transactions: allTransactions,
          budgets: [mockAnnualBudget],
          getBudgetProgress: (id: string) => id === 'budget-hijos-annual' ? mockProgress : null,
          deleteBudget: vi.fn(),
        };
      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector?: (s: unknown) => unknown) => {
        return selector ? selector(state) : state;
      });

      renderPlanDetail('budget-hijos-annual');

      // Transaction from 2025-12-31 should NOT be visible
      expect(screen.queryByText('Gasto ano anterior')).not.toBeInTheDocument();
    });

    it('should exclude income transactions from limit budgets', () => {
      const allTransactions = [...yearTransactions, incomeTransaction];

      const mockProgress: BudgetProgress = {
        budget: mockAnnualBudget,
        category: mockCategory,
        spent: 0,
        saved: 0,
        percentage: 0,
        remaining: 0,
        isExceeded: false,
        isCompleted: false,
      };

      const state = {
          transactions: allTransactions,
          budgets: [mockAnnualBudget],
          getBudgetProgress: (id: string) => id === 'budget-hijos-annual' ? mockProgress : null,
          deleteBudget: vi.fn(),
        };
      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector?: (s: unknown) => unknown) => {
        return selector ? selector(state) : state;
      });

      renderPlanDetail('budget-hijos-annual');

      // Income transaction should NOT be visible for a limit budget
      expect(screen.queryByText('Reembolso')).not.toBeInTheDocument();
    });

    it('should exclude transactions from other categories', () => {
      const allTransactions = [...yearTransactions, otherCategoryTx];

      const mockProgress: BudgetProgress = {
        budget: mockAnnualBudget,
        category: mockCategory,
        spent: 0,
        saved: 0,
        percentage: 0,
        remaining: 0,
        isExceeded: false,
        isCompleted: false,
      };

      const state = {
          transactions: allTransactions,
          budgets: [mockAnnualBudget],
          getBudgetProgress: (id: string) => id === 'budget-hijos-annual' ? mockProgress : null,
          deleteBudget: vi.fn(),
        };
      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector?: (s: unknown) => unknown) => {
        return selector ? selector(state) : state;
      });

      renderPlanDetail('budget-hijos-annual');

      // Transaction from different category should NOT be visible
      expect(screen.queryByText('Almuerzo')).not.toBeInTheDocument();
    });
  });

  describe('Date Boundary Precision', () => {
    it('should include transactions on the first day of the period (Jan 1)', () => {
      const txOnFirstDay = [makeTransaction('tx-first', '2026-01-01', 100000, 'First Day TX')];

      const mockProgress: BudgetProgress = {
        budget: mockAnnualBudget,
        category: mockCategory,
        spent: 100000,
        saved: 0,
        percentage: 2,
        remaining: 4900000,
        isExceeded: false,
        isCompleted: false,
      };

      const state = {
          transactions: txOnFirstDay,
          budgets: [mockAnnualBudget],
          getBudgetProgress: (id: string) => id === 'budget-hijos-annual' ? mockProgress : null,
          deleteBudget: vi.fn(),
        };
      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector?: (s: unknown) => unknown) => {
        return selector ? selector(state) : state;
      });

      renderPlanDetail('budget-hijos-annual');

      expect(screen.getByText('First Day TX')).toBeInTheDocument();
    });

    it('should include transactions on the last day of the period (Dec 31)', () => {
      const txOnLastDay = [makeTransaction('tx-last', '2026-12-31', 100000, 'Last Day TX')];

      const mockProgress: BudgetProgress = {
        budget: mockAnnualBudget,
        category: mockCategory,
        spent: 100000,
        saved: 0,
        percentage: 2,
        remaining: 4900000,
        isExceeded: false,
        isCompleted: false,
      };

      const state = {
          transactions: txOnLastDay,
          budgets: [mockAnnualBudget],
          getBudgetProgress: (id: string) => id === 'budget-hijos-annual' ? mockProgress : null,
          deleteBudget: vi.fn(),
        };
      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector?: (s: unknown) => unknown) => {
        return selector ? selector(state) : state;
      });

      renderPlanDetail('budget-hijos-annual');

      expect(screen.getByText('Last Day TX')).toBeInTheDocument();
    });

    it('should exclude transaction one day before the period starts', () => {
      const txBeforePeriod = [makeTransaction('tx-before', '2025-12-31', 100000, 'Before Period TX')];

      const mockProgress: BudgetProgress = {
        budget: mockAnnualBudget,
        category: mockCategory,
        spent: 0,
        saved: 0,
        percentage: 0,
        remaining: 5000000,
        isExceeded: false,
        isCompleted: false,
      };

      const state = {
          transactions: txBeforePeriod,
          budgets: [mockAnnualBudget],
          getBudgetProgress: (id: string) => id === 'budget-hijos-annual' ? mockProgress : null,
          deleteBudget: vi.fn(),
        };
      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector?: (s: unknown) => unknown) => {
        return selector ? selector(state) : state;
      });

      renderPlanDetail('budget-hijos-annual');

      expect(screen.queryByText('Before Period TX')).not.toBeInTheDocument();
    });

    it('should exclude transaction one day after the period ends', () => {
      const txAfterPeriod = [makeTransaction('tx-after', '2027-01-01', 100000, 'After Period TX')];

      const mockProgress: BudgetProgress = {
        budget: mockAnnualBudget,
        category: mockCategory,
        spent: 0,
        saved: 0,
        percentage: 0,
        remaining: 5000000,
        isExceeded: false,
        isCompleted: false,
      };

      const state = {
          transactions: txAfterPeriod,
          budgets: [mockAnnualBudget],
          getBudgetProgress: (id: string) => id === 'budget-hijos-annual' ? mockProgress : null,
          deleteBudget: vi.fn(),
        };
      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector?: (s: unknown) => unknown) => {
        return selector ? selector(state) : state;
      });

      renderPlanDetail('budget-hijos-annual');

      expect(screen.queryByText('After Period TX')).not.toBeInTheDocument();
    });
  });

  describe('String-based date comparison (no UTC issues)', () => {
    it('should correctly filter dates using string comparison not Date objects', () => {
      // This test ensures the fix works: string comparison "2026-01-15" >= "2026-01-01" is true
      // whereas new Date("2026-01-15") in UTC-5 could cause issues
      const earlyJanTx = [
        makeTransaction('tx-jan-02', '2026-01-02', 50000, 'Jan 2 TX'),
        makeTransaction('tx-jan-05', '2026-01-05', 50000, 'Jan 5 TX'),
        makeTransaction('tx-jan-10', '2026-01-10', 50000, 'Jan 10 TX'),
      ];

      const mockProgress: BudgetProgress = {
        budget: mockAnnualBudget,
        category: mockCategory,
        spent: 150000,
        saved: 0,
        percentage: 3,
        remaining: 4850000,
        isExceeded: false,
        isCompleted: false,
      };

      const state = {
          transactions: earlyJanTx,
          budgets: [mockAnnualBudget],
          getBudgetProgress: (id: string) => id === 'budget-hijos-annual' ? mockProgress : null,
          deleteBudget: vi.fn(),
        };
      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector?: (s: unknown) => unknown) => {
        return selector ? selector(state) : state;
      });

      renderPlanDetail('budget-hijos-annual');

      // All early January transactions should be visible (no UTC off-by-one)
      expect(screen.getByText('Jan 2 TX')).toBeInTheDocument();
      expect(screen.getByText('Jan 5 TX')).toBeInTheDocument();
      expect(screen.getByText('Jan 10 TX')).toBeInTheDocument();
    });
  });

  describe('Transaction Sorting', () => {
    it('should sort transactions by date descending (newest first)', () => {
      const sortTestTxs = [
        makeTransaction('tx-old', '2026-01-01', 100000, 'Oldest TX'),
        makeTransaction('tx-mid', '2026-06-15', 200000, 'Middle TX'),
        makeTransaction('tx-new', '2026-12-31', 300000, 'Newest TX'),
      ];

      const mockProgress: BudgetProgress = {
        budget: mockAnnualBudget,
        category: mockCategory,
        spent: 600000,
        saved: 0,
        percentage: 12,
        remaining: 4400000,
        isExceeded: false,
        isCompleted: false,
      };

      const state = {
          transactions: sortTestTxs,
          budgets: [mockAnnualBudget],
          getBudgetProgress: (id: string) => id === 'budget-hijos-annual' ? mockProgress : null,
          deleteBudget: vi.fn(),
        };
      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector?: (s: unknown) => unknown) => {
        return selector ? selector(state) : state;
      });

      renderPlanDetail('budget-hijos-annual');

      const allButtons = screen.getAllByRole('button');
      const txButtons = allButtons.filter((btn) =>
        btn.textContent?.includes('Newest TX') ||
        btn.textContent?.includes('Middle TX') ||
        btn.textContent?.includes('Oldest TX')
      );

      // Newest should be first
      expect(txButtons[0]).toHaveTextContent('Newest TX');
      expect(txButtons[1]).toHaveTextContent('Middle TX');
      expect(txButtons[2]).toHaveTextContent('Oldest TX');
    });
  });
});
