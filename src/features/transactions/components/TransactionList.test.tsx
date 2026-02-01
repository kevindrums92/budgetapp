import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import TransactionList from './TransactionList';
import { useBudgetStore } from '@/state/budget.store';
import type { Transaction, Category } from '@/types/budget.types';

// Mock the budget store
vi.mock('@/state/budget.store');

// Mock TransactionItem component
vi.mock('@/features/transactions/components/TransactionItem', () => ({
  default: ({ transaction, category }: { transaction: Transaction; category?: Category }) => (
    <div data-testid={`transaction-${transaction.id}`}>
      {transaction.name} - {category?.name || 'Unknown'}
    </div>
  ),
}));

// Mock dates service
vi.mock('@/services/dates.service', async () => {
  const actual = await vi.importActual('@/services/dates.service');
  return {
    ...actual,
    formatDateGroupHeader: (date: string) => {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayISO = yesterday.toISOString().slice(0, 10);

      if (date === today) return 'Hoy';
      if (date === yesterdayISO) return 'Ayer';
      return `Viernes, 15 Mar`;
    },
  };
});

// Mock currency utils
vi.mock('@/shared/utils/currency.utils', () => ({
  formatCOP: (value: number) => `$${value.toLocaleString('es-CO')}`,
}));

// Mock useCurrency hook
vi.mock('@/features/currency', () => ({
  useCurrency: () => ({
    currency: 'COP',
    currencyInfo: { code: 'COP', symbol: '$', name: 'Peso Colombiano', flag: '🇨🇴', locale: 'es-CO', decimals: 0, region: 'america' },
    setCurrency: vi.fn(),
    formatAmount: (value: number) => `$${value.toLocaleString('es-CO')}`,
  }),
}));

describe('TransactionList', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Restaurantes',
      icon: 'utensils',
      color: '#10B981',
      type: 'expense',
      groupId: 'group-1',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'cat-2',
      name: 'Salario',
      icon: 'wallet',
      color: '#3B82F6',
      type: 'income',
      groupId: 'group-2',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'cat-3',
      name: 'Transporte',
      icon: 'car',
      color: '#EF4444',
      type: 'expense',
      groupId: 'group-1',
      isDefault: true,
      createdAt: Date.now(),
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'expense',
      name: 'Almuerzo',
      category: 'cat-1',
      amount: 25000,
      date: '2024-03-15',
      createdAt: 1710500000000,
      status: 'paid',
    },
    {
      id: 'tx-2',
      type: 'income',
      name: 'Pago mensual',
      category: 'cat-2',
      amount: 1000000,
      date: '2024-03-15',
      createdAt: 1710500100000,
      status: 'paid',
    },
    {
      id: 'tx-3',
      type: 'expense',
      name: 'Taxi',
      category: 'cat-3',
      amount: 15000,
      date: '2024-03-14',
      createdAt: 1710400000000,
      status: 'paid',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const state = {
        selectedMonth: '2024-03',
        transactions: mockTransactions,
        categoryDefinitions: mockCategories,
      };
      return selector(state);
    });
  });

  describe('Rendering', () => {
    it('should render transaction list with grouped dates', () => {
      render(<TransactionList />);

      expect(screen.getByTestId('transaction-tx-1')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-tx-2')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-tx-3')).toBeInTheDocument();
    });

    it('should display date headers for each day', () => {
      render(<TransactionList />);

      // Should have date headers (mocked as "Viernes, 15 Mar")
      const dateHeaders = screen.getAllByText(/Viernes|Mar/);
      expect(dateHeaders.length).toBeGreaterThan(0);
    });

    it('should render empty state when no transactions', () => {
      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
        selectedMonth: '2024-03',
        transactions: [],
        categoryDefinitions: mockCategories,
        };
        return selector(state);
      });

      render(<TransactionList />);

      expect(screen.getByText('Aún no tienes movimientos este mes.')).toBeInTheDocument();
    });

    it('should show empty search results message', () => {
      render(<TransactionList searchQuery="Nonexistent" />);

      expect(screen.getByText(/No se encontraron resultados para "Nonexistent"/)).toBeInTheDocument();
    });

    it('should render transactions with correct category names', () => {
      render(<TransactionList />);

      expect(screen.getByText(/Almuerzo - Restaurantes/)).toBeInTheDocument();
      expect(screen.getByText(/Pago mensual - Salario/)).toBeInTheDocument();
      expect(screen.getByText(/Taxi - Transporte/)).toBeInTheDocument();
    });
  });

  describe('Grouping by Date', () => {
    it('should group transactions by date in descending order', () => {
      render(<TransactionList />);

      const transactions = screen.getAllByTestId(/transaction-/);
      // First should be from 2024-03-15 (tx-1 or tx-2)
      // Last should be from 2024-03-14 (tx-3)
      expect(transactions[transactions.length - 1]).toHaveAttribute('data-testid', 'transaction-tx-3');
    });

    it('should sort transactions within same day by createdAt descending', () => {
      const sameDay: Transaction[] = [
        {
          id: 'tx-a',
          type: 'expense',
          name: 'First',
          category: 'cat-1',
          amount: 10000,
          date: '2024-03-15',
          createdAt: 1710500000000,
          status: 'paid',
        },
        {
          id: 'tx-b',
          type: 'expense',
          name: 'Second',
          category: 'cat-1',
          amount: 20000,
          date: '2024-03-15',
          createdAt: 1710500100000,
          status: 'paid',
        },
      ];

      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
        selectedMonth: '2024-03',
        transactions: sameDay,
        categoryDefinitions: mockCategories,
        };
        return selector(state);
      });

      render(<TransactionList />);

      const transactions = screen.getAllByTestId(/transaction-/);
      expect(transactions[0]).toHaveAttribute('data-testid', 'transaction-tx-b');
      expect(transactions[1]).toHaveAttribute('data-testid', 'transaction-tx-a');
    });

    it('should calculate daily totals correctly', () => {
      render(<TransactionList />);

      // March 15 has: income 1,000,000 and expense 25,000 = balance +975,000
      expect(screen.getByText(/\+\$975\.000/)).toBeInTheDocument();

      // March 14 has: expense 15,000 only = -15,000
      expect(screen.getByText(/-\$15\.000/)).toBeInTheDocument();
    });

    it('should show balance when day has both income and expense', () => {
      render(<TransactionList />);

      // March 15 has both types, should show balance
      expect(screen.getByText(/\+\$975\.000/)).toBeInTheDocument();
    });

    it('should show only expense total when day has only expenses', () => {
      render(<TransactionList />);

      // March 14 has only expense
      expect(screen.getByText(/-\$15\.000/)).toBeInTheDocument();
    });

    it('should show only income total when day has only income', () => {
      const incomeOnly: Transaction[] = [
        {
          id: 'tx-income',
          type: 'income',
          name: 'Bonus',
          category: 'cat-2',
          amount: 500000,
          date: '2024-03-16',
          createdAt: Date.now(),
          status: 'paid',
        },
      ];

      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
        selectedMonth: '2024-03',
        transactions: incomeOnly,
        categoryDefinitions: mockCategories,
        };
        return selector(state);
      });

      render(<TransactionList />);

      expect(screen.getByText(/\+\$500\.000/)).toBeInTheDocument();
    });
  });

  describe('Filtering by Search Query', () => {
    it('should filter by transaction name', () => {
      render(<TransactionList searchQuery="Almuerzo" />);

      expect(screen.getByTestId('transaction-tx-1')).toBeInTheDocument();
      expect(screen.queryByTestId('transaction-tx-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('transaction-tx-3')).not.toBeInTheDocument();
    });

    it('should filter by category name', () => {
      render(<TransactionList searchQuery="Restaurantes" />);

      expect(screen.getByTestId('transaction-tx-1')).toBeInTheDocument();
      expect(screen.queryByTestId('transaction-tx-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('transaction-tx-3')).not.toBeInTheDocument();
    });

    it('should filter by notes', () => {
      const withNotes: Transaction[] = [
        {
          ...mockTransactions[0],
          notes: 'Con cliente importante',
        },
      ];

      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
        selectedMonth: '2024-03',
        transactions: withNotes,
        categoryDefinitions: mockCategories,
        };
        return selector(state);
      });

      render(<TransactionList searchQuery="cliente" />);

      expect(screen.getByTestId('transaction-tx-1')).toBeInTheDocument();
    });

    it('should be case insensitive', () => {
      render(<TransactionList searchQuery="ALMUERZO" />);

      expect(screen.getByTestId('transaction-tx-1')).toBeInTheDocument();
    });

    it('should handle empty search query', () => {
      render(<TransactionList searchQuery="" />);

      expect(screen.getByTestId('transaction-tx-1')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-tx-2')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-tx-3')).toBeInTheDocument();
    });

    it('should handle whitespace in search query', () => {
      render(<TransactionList searchQuery="  Almuerzo  " />);

      expect(screen.getByTestId('transaction-tx-1')).toBeInTheDocument();
      expect(screen.queryByTestId('transaction-tx-2')).not.toBeInTheDocument();
    });
  });

  describe('Filtering by Type', () => {
    it('should show all transactions by default', () => {
      render(<TransactionList filterType="all" />);

      expect(screen.getByTestId('transaction-tx-1')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-tx-2')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-tx-3')).toBeInTheDocument();
    });

    it('should filter only expenses', () => {
      render(<TransactionList filterType="expense" />);

      expect(screen.getByTestId('transaction-tx-1')).toBeInTheDocument();
      expect(screen.queryByTestId('transaction-tx-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('transaction-tx-3')).toBeInTheDocument();
    });

    it('should filter only income', () => {
      render(<TransactionList filterType="income" />);

      expect(screen.queryByTestId('transaction-tx-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('transaction-tx-2')).toBeInTheDocument();
      expect(screen.queryByTestId('transaction-tx-3')).not.toBeInTheDocument();
    });

    it('should filter only pending transactions', () => {
      const pendingTx: Transaction[] = [
        { ...mockTransactions[0], status: 'pending' },
        { ...mockTransactions[1], status: 'paid' },
        {
          id: 'tx-planned',
          type: 'expense',
          name: 'Planned expense',
          category: 'cat-1',
          amount: 50000,
          date: '2024-03-20',
          createdAt: Date.now(),
          status: 'planned',
        },
      ];

      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
        selectedMonth: '2024-03',
        transactions: pendingTx,
        categoryDefinitions: mockCategories,
        };
        return selector(state);
      });

      render(<TransactionList filterType="pending" />);

      expect(screen.getByTestId('transaction-tx-1')).toBeInTheDocument();
      expect(screen.queryByTestId('transaction-tx-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('transaction-tx-planned')).toBeInTheDocument();
    });

    it('should combine type and search filters', () => {
      render(<TransactionList filterType="expense" searchQuery="Taxi" />);

      expect(screen.queryByTestId('transaction-tx-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('transaction-tx-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('transaction-tx-3')).toBeInTheDocument();
    });
  });

  describe('Month Warning Banner', () => {
    it('should not show banner when viewing current month', () => {
      // Use local timezone (not UTC) to match currentMonthKey() behavior
      const d = new Date();
      const currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
        selectedMonth: currentMonth,
        transactions: mockTransactions,
        categoryDefinitions: mockCategories,
        };
        return selector(state);
      });

      render(<TransactionList />);

      expect(
        screen.queryByText(/Estás viendo un mes diferente al actual/)
      ).not.toBeInTheDocument();
    });

    it('should show banner when viewing past month', () => {
      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
        selectedMonth: '2024-01',
        transactions: mockTransactions,
        categoryDefinitions: mockCategories,
        };
        return selector(state);
      });

      render(<TransactionList />);

      expect(
        screen.getByText(/Estás viendo un mes diferente al actual/)
      ).toBeInTheDocument();
    });

    it('should show banner when viewing future month', () => {
      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
        selectedMonth: '2025-12',
        transactions: mockTransactions,
        categoryDefinitions: mockCategories,
        };
        return selector(state);
      });

      render(<TransactionList />);

      expect(
        screen.getByText(/Estás viendo un mes diferente al actual/)
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle transaction with undefined category', () => {
      const noCategory: Transaction[] = [
        {
          id: 'tx-no-cat',
          type: 'expense',
          name: 'No category transaction',
          category: 'non-existent-id',
          amount: 10000,
          date: '2024-03-15',
          createdAt: Date.now(),
          status: 'paid',
        },
      ];

      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
        selectedMonth: '2024-03',
        transactions: noCategory,
        categoryDefinitions: mockCategories,
        };
        return selector(state);
      });

      render(<TransactionList />);

      expect(screen.getByText(/No category transaction - Unknown/)).toBeInTheDocument();
    });

    it('should handle mixed types in same day', () => {
      const mixed: Transaction[] = [
        {
          id: 'tx-exp-1',
          type: 'expense',
          name: 'Expense 1',
          category: 'cat-1',
          amount: 10000,
          date: '2024-03-15',
          createdAt: 1710500000000,
          status: 'paid',
        },
        {
          id: 'tx-inc-1',
          type: 'income',
          name: 'Income 1',
          category: 'cat-2',
          amount: 50000,
          date: '2024-03-15',
          createdAt: 1710500100000,
          status: 'paid',
        },
        {
          id: 'tx-exp-2',
          type: 'expense',
          name: 'Expense 2',
          category: 'cat-1',
          amount: 5000,
          date: '2024-03-15',
          createdAt: 1710500200000,
          status: 'paid',
        },
      ];

      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
        selectedMonth: '2024-03',
        transactions: mixed,
        categoryDefinitions: mockCategories,
        };
        return selector(state);
      });

      render(<TransactionList />);

      // Balance should be +35,000 (50,000 - 10,000 - 5,000)
      expect(screen.getByText(/\+\$35\.000/)).toBeInTheDocument();
    });

    it('should handle transactions from different months', () => {
      const multiMonth: Transaction[] = [
        ...mockTransactions,
        {
          id: 'tx-feb',
          type: 'expense',
          name: 'February transaction',
          category: 'cat-1',
          amount: 10000,
          date: '2024-02-15',
          createdAt: Date.now(),
          status: 'paid',
        },
      ];

      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
        selectedMonth: '2024-03',
        transactions: multiMonth,
        categoryDefinitions: mockCategories,
        };
        return selector(state);
      });

      render(<TransactionList />);

      // Should only show March transactions
      expect(screen.queryByText(/February transaction/)).not.toBeInTheDocument();
      expect(screen.getByTestId('transaction-tx-1')).toBeInTheDocument();
    });

    it('should handle zero amount transactions', () => {
      const zeroAmount: Transaction[] = [
        {
          id: 'tx-zero',
          type: 'expense',
          name: 'Zero amount',
          category: 'cat-1',
          amount: 0,
          date: '2024-03-15',
          createdAt: Date.now(),
          status: 'paid',
        },
      ];

      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
        selectedMonth: '2024-03',
        transactions: zeroAmount,
        categoryDefinitions: mockCategories,
        };
        return selector(state);
      });

      render(<TransactionList />);

      expect(screen.getByTestId('transaction-tx-zero')).toBeInTheDocument();
      // Zero amount (both income and expense are 0, so hasIncome and hasExpenses are false)
      // Falls into third case showing income: +$0
      expect(screen.getByText(/\$0/)).toBeInTheDocument();
    });

    it('should handle empty category definitions', () => {
      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          selectedMonth: '2024-03',
          transactions: mockTransactions,
          categoryDefinitions: [],
        };
        return selector(state);
      });

      render(<TransactionList />);

      // Should still render transactions with "Unknown" categories
      expect(screen.getByText(/Almuerzo - Unknown/)).toBeInTheDocument();
    });
  });
});
