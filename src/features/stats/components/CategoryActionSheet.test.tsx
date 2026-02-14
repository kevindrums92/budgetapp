import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CategoryActionSheet from './CategoryActionSheet';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'expensesByCategory.actions.createBudget': 'Create budget',
        'expensesByCategory.actions.viewBudget': 'View budget',
        'expensesByCategory.actions.viewRecords': 'View records',
        'expensesByCategory.actions.cancel': 'Cancel',
      };
      return translations[key] || key;
    },
    i18n: { language: 'es' },
  }),
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('CategoryActionSheet', () => {
  const mockCategory = {
    id: 'cat-rest-1',
    name: 'Restaurantes',
    icon: 'utensils',
    color: '#EF4444',
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    category: mockCategory,
    hasBudget: false,
    onCreateBudget: vi.fn(),
    onViewRecords: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('should not render when open is false', () => {
      render(<CategoryActionSheet {...defaultProps} open={false} />, { wrapper: Wrapper });

      expect(screen.queryByText('Restaurantes')).not.toBeInTheDocument();
    });

    it('should render when open is true', async () => {
      render(<CategoryActionSheet {...defaultProps} />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Restaurantes')).toBeInTheDocument();
      });
    });

    it('should not render when category is null', () => {
      render(<CategoryActionSheet {...defaultProps} category={null} />, { wrapper: Wrapper });

      expect(screen.queryByText('Create budget')).not.toBeInTheDocument();
    });

    it('should render category name in header', async () => {
      render(<CategoryActionSheet {...defaultProps} />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Restaurantes')).toBeInTheDocument();
      });
    });

    it('should render drag handle', async () => {
      const { container } = render(<CategoryActionSheet {...defaultProps} />, { wrapper: Wrapper });

      await waitFor(() => {
        const dragHandle = container.querySelector('.bg-gray-300');
        expect(dragHandle).toBeInTheDocument();
      });
    });
  });

  describe('Action Buttons - No Budget', () => {
    it('should show "Create budget" when hasBudget is false', async () => {
      render(<CategoryActionSheet {...defaultProps} hasBudget={false} />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Create budget')).toBeInTheDocument();
      });
    });

    it('should show "View records" button', async () => {
      render(<CategoryActionSheet {...defaultProps} />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('View records')).toBeInTheDocument();
      });
    });

    it('should show "Cancel" button', async () => {
      render(<CategoryActionSheet {...defaultProps} />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });

    it('should call onCreateBudget when "Create budget" is clicked', async () => {
      const onCreateBudget = vi.fn();
      render(<CategoryActionSheet {...defaultProps} onCreateBudget={onCreateBudget} />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Create budget')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create budget'));
      expect(onCreateBudget).toHaveBeenCalledTimes(1);
    });
  });

  describe('Action Buttons - Has Budget', () => {
    it('should show "View budget" when hasBudget is true', async () => {
      render(<CategoryActionSheet {...defaultProps} hasBudget={true} />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('View budget')).toBeInTheDocument();
      });
      expect(screen.queryByText('Create budget')).not.toBeInTheDocument();
    });

    it('should call onViewRecords when "View budget" is clicked (has budget)', async () => {
      const onViewRecords = vi.fn();
      render(<CategoryActionSheet {...defaultProps} hasBudget={true} onViewRecords={onViewRecords} />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('View budget')).toBeInTheDocument();
      });

      // When hasBudget, the first button calls onViewRecords
      fireEvent.click(screen.getByText('View budget'));
      expect(onViewRecords).toHaveBeenCalledTimes(1);
    });
  });

  describe('View Records', () => {
    it('should call onViewRecords when "View records" is clicked', async () => {
      const onViewRecords = vi.fn();
      render(<CategoryActionSheet {...defaultProps} onViewRecords={onViewRecords} />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('View records')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('View records'));
      expect(onViewRecords).toHaveBeenCalledTimes(1);
    });
  });

  describe('Close Actions', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const onClose = vi.fn();
      render(<CategoryActionSheet {...defaultProps} onClose={onClose} />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', async () => {
      const onClose = vi.fn();
      render(<CategoryActionSheet {...defaultProps} onClose={onClose} />, { wrapper: Wrapper });

      await waitFor(() => {
        const backdrop = screen.getByLabelText('Close');
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Body Scroll Locking', () => {
    it('should lock body scroll when open', () => {
      render(<CategoryActionSheet {...defaultProps} open={true} />, { wrapper: Wrapper });

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should unlock body scroll when closed', () => {
      const { rerender } = render(<CategoryActionSheet {...defaultProps} open={true} />, { wrapper: Wrapper });
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<CategoryActionSheet {...defaultProps} open={false} />);

      waitFor(() => {
        expect(document.body.style.overflow).toBe('');
      });
    });

    it('should restore body scroll on unmount', () => {
      const { unmount } = render(<CategoryActionSheet {...defaultProps} open={true} />, { wrapper: Wrapper });
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button types on all buttons', async () => {
      render(<CategoryActionSheet {...defaultProps} />, { wrapper: Wrapper });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach((button) => {
          expect(button).toHaveAttribute('type', 'button');
        });
      });
    });

    it('should have aria-label on backdrop', async () => {
      render(<CategoryActionSheet {...defaultProps} />, { wrapper: Wrapper });

      await waitFor(() => {
        const backdrop = screen.getByLabelText('Close');
        expect(backdrop).toBeInTheDocument();
      });
    });

    it('should have proper z-index for overlay', async () => {
      const { container } = render(<CategoryActionSheet {...defaultProps} />, { wrapper: Wrapper });

      await waitFor(() => {
        const overlay = container.firstChild as HTMLElement;
        expect(overlay).toHaveClass('z-[70]');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle category with unknown icon gracefully', async () => {
      const categoryWithBadIcon = {
        ...mockCategory,
        icon: 'non-existent-icon-xyz',
      };

      render(
        <CategoryActionSheet {...defaultProps} category={categoryWithBadIcon} />,
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(screen.getByText('Restaurantes')).toBeInTheDocument();
      });
    });

    it('should handle category with special characters in name', async () => {
      const specialCategory = {
        ...mockCategory,
        name: 'Cafe & Te "Special"',
      };

      render(
        <CategoryActionSheet {...defaultProps} category={specialCategory} />,
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(screen.getByText('Cafe & Te "Special"')).toBeInTheDocument();
      });
    });
  });
});
