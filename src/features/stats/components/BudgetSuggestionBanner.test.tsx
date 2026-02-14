import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BudgetSuggestionBanner from './BudgetSuggestionBanner';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'expensesByCategory.suggestion.title': `Control spending on "${params?.category}"?`,
        'expensesByCategory.suggestion.subtitle': `You spent ${params?.amount} this month`,
        'expensesByCategory.suggestion.cta': 'Create limit',
        'expensesByCategory.suggestion.dismissTitle': 'Hide suggestion',
        'expensesByCategory.suggestion.dismissMessage': 'How do you want to hide this suggestion?',
        'expensesByCategory.suggestion.dismissMonth': 'Hide this month',
        'expensesByCategory.suggestion.dismissOnce': 'Just this once',
        'expensesByCategory.suggestion.dismissCancel': 'Cancel',
      };
      return translations[key] || key;
    },
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

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('BudgetSuggestionBanner', () => {
  const defaultProps = {
    categoryId: 'cat-rest-1',
    categoryName: 'Restaurantes',
    categoryIcon: 'utensils',
    categoryColor: '#EF4444',
    amount: 450000,
    selectedMonth: '2026-02',
    onCreateBudget: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('should render the banner with category name', () => {
      render(<BudgetSuggestionBanner {...defaultProps} />, { wrapper: Wrapper });

      expect(screen.getByText(/Control spending on "Restaurantes"/)).toBeInTheDocument();
    });

    it('should render the formatted amount', () => {
      render(<BudgetSuggestionBanner {...defaultProps} />, { wrapper: Wrapper });

      expect(screen.getByText(/You spent \$ 450,000 this month/)).toBeInTheDocument();
    });

    it('should render the CTA button', () => {
      render(<BudgetSuggestionBanner {...defaultProps} />, { wrapper: Wrapper });

      expect(screen.getByText('Create limit')).toBeInTheDocument();
    });

    it('should render the dismiss button', () => {
      render(<BudgetSuggestionBanner {...defaultProps} />, { wrapper: Wrapper });

      expect(screen.getByLabelText('Dismiss')).toBeInTheDocument();
    });

    it('should not render when previously dismissed for month via localStorage', () => {
      localStorage.setItem('budget.dismissedSuggestion.cat-rest-1.2026-02', 'true');

      const { container } = render(<BudgetSuggestionBanner {...defaultProps} />, { wrapper: Wrapper });

      expect(container.innerHTML).toBe('');
    });
  });

  describe('CTA Action', () => {
    it('should call onCreateBudget when CTA is clicked', () => {
      const onCreateBudget = vi.fn();
      render(<BudgetSuggestionBanner {...defaultProps} onCreateBudget={onCreateBudget} />, { wrapper: Wrapper });

      fireEvent.click(screen.getByText('Create limit'));

      expect(onCreateBudget).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dismiss Flow', () => {
    it('should show confirmation modal when dismiss X is clicked', () => {
      render(<BudgetSuggestionBanner {...defaultProps} />, { wrapper: Wrapper });

      fireEvent.click(screen.getByLabelText('Dismiss'));

      expect(screen.getByText('Hide suggestion')).toBeInTheDocument();
      expect(screen.getByText('How do you want to hide this suggestion?')).toBeInTheDocument();
      expect(screen.getByText('Hide this month')).toBeInTheDocument();
      expect(screen.getByText('Just this once')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should hide banner and persist to localStorage when "Hide this month" is clicked', () => {
      const { container } = render(<BudgetSuggestionBanner {...defaultProps} />, { wrapper: Wrapper });

      // Open confirm modal
      fireEvent.click(screen.getByLabelText('Dismiss'));
      // Click "Hide this month"
      fireEvent.click(screen.getByText('Hide this month'));

      // Banner should be gone
      expect(container.innerHTML).toBe('');
      // localStorage should be set
      expect(localStorage.getItem('budget.dismissedSuggestion.cat-rest-1.2026-02')).toBe('true');
    });

    it('should hide banner for session only when "Just this once" is clicked', () => {
      const { container } = render(<BudgetSuggestionBanner {...defaultProps} />, { wrapper: Wrapper });

      // Open confirm modal
      fireEvent.click(screen.getByLabelText('Dismiss'));
      // Click "Just this once"
      fireEvent.click(screen.getByText('Just this once'));

      // Banner should be gone
      expect(container.innerHTML).toBe('');
      // localStorage should NOT be set
      expect(localStorage.getItem('budget.dismissedSuggestion.cat-rest-1.2026-02')).toBeNull();
    });

    it('should close the confirmation modal when "Cancel" is clicked', () => {
      render(<BudgetSuggestionBanner {...defaultProps} />, { wrapper: Wrapper });

      // Open confirm modal
      fireEvent.click(screen.getByLabelText('Dismiss'));
      expect(screen.getByText('Hide suggestion')).toBeInTheDocument();

      // Click Cancel
      fireEvent.click(screen.getByText('Cancel'));

      // Modal gone, banner still visible
      expect(screen.queryByText('Hide suggestion')).not.toBeInTheDocument();
      expect(screen.getByText(/Control spending on "Restaurantes"/)).toBeInTheDocument();
    });

    it('should close the confirmation modal when backdrop is clicked', () => {
      render(<BudgetSuggestionBanner {...defaultProps} />, { wrapper: Wrapper });

      // Open confirm modal
      fireEvent.click(screen.getByLabelText('Dismiss'));
      expect(screen.getByText('Hide suggestion')).toBeInTheDocument();

      // Click backdrop (the bg-black/50 div)
      const backdrop = screen.getByText('Hide suggestion').closest('.fixed')!.querySelector('.bg-black\\/50');
      fireEvent.click(backdrop!);

      // Modal gone, banner still visible
      expect(screen.queryByText('Hide suggestion')).not.toBeInTheDocument();
      expect(screen.getByText(/Control spending on "Restaurantes"/)).toBeInTheDocument();
    });
  });

  describe('LocalStorage key isolation', () => {
    it('should use category-specific localStorage key', () => {
      const { container: c1 } = render(
        <BudgetSuggestionBanner {...defaultProps} categoryId="cat-A" />,
        { wrapper: Wrapper }
      );

      // Dismiss cat-A for the month
      fireEvent.click(screen.getByLabelText('Dismiss'));
      fireEvent.click(screen.getByText('Hide this month'));
      expect(c1.innerHTML).toBe('');

      // cat-B should still show
      const { container: c2 } = render(
        <BudgetSuggestionBanner {...defaultProps} categoryId="cat-B" />,
        { wrapper: Wrapper }
      );
      expect(c2.innerHTML).not.toBe('');
    });

    it('should use month-specific localStorage key', () => {
      localStorage.setItem('budget.dismissedSuggestion.cat-rest-1.2026-01', 'true');

      // Different month should still show
      const { container } = render(
        <BudgetSuggestionBanner {...defaultProps} selectedMonth="2026-02" />,
        { wrapper: Wrapper }
      );
      expect(container.innerHTML).not.toBe('');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button types on all buttons', () => {
      render(<BudgetSuggestionBanner {...defaultProps} />, { wrapper: Wrapper });

      // Open confirm modal to check all buttons
      fireEvent.click(screen.getByLabelText('Dismiss'));

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should have aria-label on dismiss button', () => {
      render(<BudgetSuggestionBanner {...defaultProps} />, { wrapper: Wrapper });

      const dismissBtn = screen.getByLabelText('Dismiss');
      expect(dismissBtn).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown icon gracefully (fallback to Lightbulb)', () => {
      render(
        <BudgetSuggestionBanner {...defaultProps} categoryIcon="non-existent-icon-xyz" />,
        { wrapper: Wrapper }
      );

      // Should still render without crashing
      expect(screen.getByText(/Control spending on "Restaurantes"/)).toBeInTheDocument();
    });

    it('should handle zero amount', () => {
      render(<BudgetSuggestionBanner {...defaultProps} amount={0} />, { wrapper: Wrapper });

      expect(screen.getByText(/You spent \$ 0 this month/)).toBeInTheDocument();
    });
  });
});
