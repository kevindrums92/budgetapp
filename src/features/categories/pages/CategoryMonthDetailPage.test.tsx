import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CategoryMonthDetailPage from './CategoryMonthDetailPage';
import { useBudgetStore } from '@/state/budget.store';
import type { Budget, Category, Transaction } from '@/types/budget.types';

// Mock window.scrollTo (not implemented in jsdom)
window.scrollTo = vi.fn();

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockParams = { categoryId: 'cat-1', month: '2026-02' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'monthDetail.transaction': 'transaction',
        'monthDetail.transactions': 'transactions',
        'monthDetail.empty': 'No transactions in this category this month',
        'monthDetail.error': 'Category not found',
        'monthDetail.budgetBanner.title': 'CONTROL YOUR SPENDING',
        'monthDetail.budgetBanner.description': 'Set a spending limit for this category and receive alerts when you approach the limit',
        'monthDetail.budgetBanner.action': 'Create spending limit →',
      };
      return translations[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock useCurrency
vi.mock('@/features/currency', () => ({
  useCurrency: () => ({
    formatAmount: (amount: number) => `$ ${amount.toLocaleString()}`,
    currencyInfo: { symbol: '$', code: 'USD' },
  }),
}));

describe('CategoryMonthDetailPage', () => {
  const mockCategory: Category = {
    id: 'cat-1',
    name: 'Restaurants',
    icon: 'utensils',
    color: '#EF4444',
    type: 'expense',
    groupId: 'miscellaneous',
    isDefault: false,
    createdAt: Date.now(),
  };

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      name: 'Lunch',
      amount: 50000,
      category: 'cat-1',
      date: '2026-02-10',
      type: 'expense',
      isRecurring: false,
      createdAt: new Date('2026-02-10T12:00:00Z').getTime(),
    },
    {
      id: 'tx-2',
      name: 'Dinner',
      amount: 75000,
      category: 'cat-1',
      date: '2026-02-12',
      type: 'expense',
      isRecurring: false,
      createdAt: new Date('2026-02-12T12:00:00Z').getTime(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mockParams to default
    mockParams.categoryId = 'cat-1';
    mockParams.month = '2026-02';

    // Reset store state
    useBudgetStore.setState({
      categoryDefinitions: [mockCategory],
      transactions: mockTransactions,
      budgets: [],
    });
  });

  describe('Budget Banner Visibility', () => {
    it('should show budget banner when no active budget exists', () => {
      render(
        <BrowserRouter>
          <CategoryMonthDetailPage />
        </BrowserRouter>
      );

      expect(screen.getByText('CONTROL YOUR SPENDING')).toBeInTheDocument();
      expect(screen.getByText('Set a spending limit for this category and receive alerts when you approach the limit')).toBeInTheDocument();
      expect(screen.getByText('Create spending limit →')).toBeInTheDocument();
    });

    it('should NOT show budget banner when active budget exists', () => {
      const activeBudget: Budget = {
        id: 'budget-1',
        categoryId: 'cat-1',
        amount: 200000,
        type: 'limit',
        status: 'active',
        period: {
          type: 'month',
          startDate: '2026-02-01',
          endDate: '2026-02-28',
        },
        isRecurring: false,
        createdAt: new Date('2026-02-01T12:00:00Z').getTime(),
      };

      useBudgetStore.setState({ budgets: [activeBudget] });

      render(
        <BrowserRouter>
          <CategoryMonthDetailPage />
        </BrowserRouter>
      );

      expect(screen.queryByText('CONTROL YOUR SPENDING')).not.toBeInTheDocument();
    });

    it('should hide banner when close button is clicked', () => {
      render(
        <BrowserRouter>
          <CategoryMonthDetailPage />
        </BrowserRouter>
      );

      // Banner is visible
      expect(screen.getByText('CONTROL YOUR SPENDING')).toBeInTheDocument();

      // Click close button (X icon) - find by className pattern
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => btn.querySelector('svg.lucide-x'));

      expect(closeButton).toBeDefined();
      fireEvent.click(closeButton!);

      // Banner should disappear
      expect(screen.queryByText('CONTROL YOUR SPENDING')).not.toBeInTheDocument();
    });
  });

  describe('Budget Banner Actions', () => {
    it('should navigate to /plan with categoryId in sessionStorage when action clicked', () => {
      render(
        <BrowserRouter>
          <CategoryMonthDetailPage />
        </BrowserRouter>
      );

      const actionButton = screen.getByText('Create spending limit →');
      fireEvent.click(actionButton);

      // Check sessionStorage
      expect(sessionStorage.getItem('newCategoryId')).toBe('cat-1');

      // Check navigation
      expect(mockNavigate).toHaveBeenCalledWith('/plan');
    });
  });

  describe('Active Budget Detection - Edge Cases', () => {
    it('should detect active budget even if period starts mid-month', () => {
      const midMonthBudget: Budget = {
        id: 'budget-2',
        categoryId: 'cat-1',
        amount: 200000,
        type: 'limit',
        status: 'active',
        period: {
          type: 'custom',
          startDate: '2026-02-15',
          endDate: '2026-03-15',
        },
        isRecurring: false,
        createdAt: new Date('2026-02-15T12:00:00Z').getTime(),
      };

      useBudgetStore.setState({ budgets: [midMonthBudget] });

      render(
        <BrowserRouter>
          <CategoryMonthDetailPage />
        </BrowserRouter>
      );

      expect(screen.queryByText('CONTROL YOUR SPENDING')).not.toBeInTheDocument();
    });

    it('should detect active budget even if period ends mid-month', () => {
      const endsMidMonthBudget: Budget = {
        id: 'budget-3',
        categoryId: 'cat-1',
        amount: 200000,
        type: 'limit',
        status: 'active',
        period: {
          type: 'custom',
          startDate: '2026-01-15',
          endDate: '2026-02-15',
        },
        isRecurring: false,
        createdAt: new Date('2026-01-15T12:00:00Z').getTime(),
      };

      useBudgetStore.setState({ budgets: [endsMidMonthBudget] });

      render(
        <BrowserRouter>
          <CategoryMonthDetailPage />
        </BrowserRouter>
      );

      expect(screen.queryByText('CONTROL YOUR SPENDING')).not.toBeInTheDocument();
    });

    it('should show banner when budget period does not overlap month', () => {
      const noOverlapBudget: Budget = {
        id: 'budget-4',
        categoryId: 'cat-1',
        amount: 200000,
        type: 'limit',
        status: 'active',
        period: {
          type: 'month',
          startDate: '2026-01-01',
          endDate: '2026-01-31',
        },
        isRecurring: false,
        createdAt: new Date('2026-01-01T12:00:00Z').getTime(),
      };

      useBudgetStore.setState({ budgets: [noOverlapBudget] });

      render(
        <BrowserRouter>
          <CategoryMonthDetailPage />
        </BrowserRouter>
      );

      expect(screen.getByText('CONTROL YOUR SPENDING')).toBeInTheDocument();
    });

    it('should show banner when budget is for different category', () => {
      const differentCategoryBudget: Budget = {
        id: 'budget-5',
        categoryId: 'cat-2',
        amount: 200000,
        type: 'limit',
        status: 'active',
        period: {
          type: 'month',
          startDate: '2026-02-01',
          endDate: '2026-02-28',
        },
        isRecurring: false,
        createdAt: new Date('2026-02-01T12:00:00Z').getTime(),
      };

      useBudgetStore.setState({ budgets: [differentCategoryBudget] });

      render(
        <BrowserRouter>
          <CategoryMonthDetailPage />
        </BrowserRouter>
      );

      expect(screen.getByText('CONTROL YOUR SPENDING')).toBeInTheDocument();
    });

    it('should show banner when budget status is not active', () => {
      const completedBudget: Budget = {
        id: 'budget-6',
        categoryId: 'cat-1',
        amount: 200000,
        type: 'limit',
        status: 'completed',
        period: {
          type: 'month',
          startDate: '2026-02-01',
          endDate: '2026-02-28',
        },
        isRecurring: false,
        createdAt: new Date('2026-02-01T12:00:00Z').getTime(),
      };

      useBudgetStore.setState({ budgets: [completedBudget] });

      render(
        <BrowserRouter>
          <CategoryMonthDetailPage />
        </BrowserRouter>
      );

      expect(screen.getByText('CONTROL YOUR SPENDING')).toBeInTheDocument();
    });
  });

  describe('Transactions Display', () => {
    it('should display total spent amount', () => {
      render(
        <BrowserRouter>
          <CategoryMonthDetailPage />
        </BrowserRouter>
      );

      // Total: 50000 + 75000 = 125000
      expect(screen.getByText('$ 125,000')).toBeInTheDocument();
    });

    it('should display transaction count', () => {
      render(
        <BrowserRouter>
          <CategoryMonthDetailPage />
        </BrowserRouter>
      );

      expect(screen.getByText('2 transactions')).toBeInTheDocument();
    });

    it('should show empty state when no transactions', () => {
      useBudgetStore.setState({ transactions: [] });

      render(
        <BrowserRouter>
          <CategoryMonthDetailPage />
        </BrowserRouter>
      );

      expect(screen.getByText('No transactions in this category this month')).toBeInTheDocument();
    });
  });
});
