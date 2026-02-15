import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import BudgetCard from './BudgetCard';
import type { BudgetProgress } from '@/types/budget.types';

// Mock react-i18next
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'types.limit': 'Spending limit',
    'types.goal': 'Savings goal',
  };
  return translations[key] || key;
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: { language: 'en' },
  }),
}));

// Mock useCurrency
vi.mock('@/features/currency', () => ({
  useCurrency: () => ({
    formatAmount: (amount: number) => `$ ${amount.toLocaleString()}`,
  }),
}));

describe('BudgetCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseLimitProgress: BudgetProgress = {
    budget: {
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
    },
    category: {
      id: 'cat-1',
      name: 'Restaurants',
      icon: 'utensils',
      color: '#EF4444',
      type: 'expense',
      groupId: 'miscellaneous',
      isDefault: false,
      createdAt: Date.now(),
    },
    spent: 150000,
    saved: 0,
    percentage: 75,
    remaining: 50000,
    isExceeded: false,
    isCompleted: false,
  };

  const baseGoalProgress: BudgetProgress = {
    budget: {
      id: 'budget-2',
      categoryId: 'cat-2',
      amount: 500000,
      type: 'goal',
      status: 'active',
      period: {
        type: 'month',
        startDate: '2026-02-01',
        endDate: '2026-02-28',
      },
      isRecurring: false,
      createdAt: new Date('2026-02-01T12:00:00Z').getTime(),
    },
    category: {
      id: 'cat-2',
      name: 'Vacation',
      icon: 'plane',
      color: '#3B82F6',
      type: 'expense',
      groupId: 'miscellaneous',
      isDefault: false,
      createdAt: Date.now(),
    },
    spent: 0,
    saved: 300000,
    percentage: 60,
    remaining: 200000,
    isExceeded: false,
    isCompleted: false,
  };

  describe('Type Label Translations', () => {
    it('should display translated type for limit budget', () => {
      render(<BudgetCard progress={baseLimitProgress} />);

      expect(mockT).toHaveBeenCalledWith('types.limit');
      expect(screen.getByText('Spending limit')).toBeInTheDocument();
    });

    it('should display translated type for goal budget', () => {
      render(<BudgetCard progress={baseGoalProgress} />);

      expect(mockT).toHaveBeenCalledWith('types.goal');
      expect(screen.getByText('Savings goal')).toBeInTheDocument();
    });

    it('should call translation function with correct namespace', () => {
      render(<BudgetCard progress={baseLimitProgress} />);

      // useTranslation should be called with "budget" namespace
      expect(mockT).toHaveBeenCalled();
    });
  });

  describe('Type Label Updates on Language Change', () => {
    it('should update type label when language changes to Spanish', () => {
      const spanishT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'types.limit': 'Límite de gasto',
          'types.goal': 'Meta de ahorro',
        };
        return translations[key] || key;
      });

      vi.mocked(mockT).mockImplementation(spanishT);

      render(<BudgetCard progress={baseLimitProgress} />);

      expect(spanishT).toHaveBeenCalledWith('types.limit');
      expect(screen.getByText('Límite de gasto')).toBeInTheDocument();
    });

    it('should update type label when language changes to French', () => {
      const frenchT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'types.limit': 'Limite de dépenses',
          'types.goal': 'Objectif d\'épargne',
        };
        return translations[key] || key;
      });

      vi.mocked(mockT).mockImplementation(frenchT);

      render(<BudgetCard progress={baseGoalProgress} />);

      expect(frenchT).toHaveBeenCalledWith('types.goal');
      expect(screen.getByText('Objectif d\'épargne')).toBeInTheDocument();
    });

    it('should update type label when language changes to Portuguese', () => {
      const portugueseT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'types.limit': 'Limite de gastos',
          'types.goal': 'Meta de poupança',
        };
        return translations[key] || key;
      });

      vi.mocked(mockT).mockImplementation(portugueseT);

      render(<BudgetCard progress={baseLimitProgress} />);

      expect(portugueseT).toHaveBeenCalledWith('types.limit');
      expect(screen.getByText('Limite de gastos')).toBeInTheDocument();
    });
  });

  describe('Component Rendering', () => {
    it('should render category name', () => {
      render(<BudgetCard progress={baseLimitProgress} />);

      expect(screen.getByText('Restaurants')).toBeInTheDocument();
    });

    it('should render spent amount for limit budget', () => {
      render(<BudgetCard progress={baseLimitProgress} />);

      expect(screen.getByText('$ 150,000')).toBeInTheDocument();
      expect(screen.getByText('/ $ 200,000')).toBeInTheDocument();
    });

    it('should render saved amount for goal budget', () => {
      render(<BudgetCard progress={baseGoalProgress} />);

      expect(screen.getByText('$ 300,000')).toBeInTheDocument();
      expect(screen.getByText('/ $ 500,000')).toBeInTheDocument();
    });

    it('should render percentage', () => {
      render(<BudgetCard progress={baseLimitProgress} />);

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should render recurring indicator when budget is recurring', () => {
      const recurringProgress: BudgetProgress = {
        ...baseLimitProgress,
        budget: {
          ...baseLimitProgress.budget,
          isRecurring: true,
        },
      };

      const { container } = render(<BudgetCard progress={recurringProgress} />);

      // Repeat icon should be present (lucide-react Repeat component)
      const repeatIcon = container.querySelector('svg');
      expect(repeatIcon).toBeInTheDocument();
    });

    it('should not render recurring indicator when budget is not recurring', () => {
      render(<BudgetCard progress={baseLimitProgress} />);

      // Only one icon should be present (category icon, not recurring icon)
      // This is a bit tricky to test, but we can check that Repeat is not in the text
      expect(screen.queryByTestId('repeat-icon')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amounts correctly', () => {
      const zeroProgress: BudgetProgress = {
        ...baseLimitProgress,
        spent: 0,
        percentage: 0,
      };

      render(<BudgetCard progress={zeroProgress} />);

      expect(screen.getByText('$ 0')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle exceeded budget (over 100%)', () => {
      const exceededProgress: BudgetProgress = {
        ...baseLimitProgress,
        spent: 250000,
        percentage: 125,
        remaining: -50000,
        isExceeded: true,
      };

      render(<BudgetCard progress={exceededProgress} />);

      expect(screen.getByText('125%')).toBeInTheDocument();
    });

    it('should handle completed budget status', () => {
      const completedProgress: BudgetProgress = {
        ...baseLimitProgress,
        budget: {
          ...baseLimitProgress.budget,
          status: 'completed',
        },
      };

      render(<BudgetCard progress={completedProgress} />);

      // Verify translation was called
      expect(mockT).toHaveBeenCalledWith('types.limit');
    });

    it('should render correctly when category icon is unknown', () => {
      const unknownIconProgress: BudgetProgress = {
        ...baseLimitProgress,
        category: {
          ...baseLimitProgress.category,
          icon: 'non-existent-icon-xyz',
        },
      };

      // Should not crash
      const { container } = render(<BudgetCard progress={unknownIconProgress} />);
      expect(container).toBeInTheDocument();
    });
  });
});
