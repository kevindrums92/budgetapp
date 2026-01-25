import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CategoryPickerDrawer from './CategoryPickerDrawer';
import { useBudgetStore } from '@/state/budget.store';
import type { Category, CategoryGroup } from '@/types/budget.types';

// Mock the budget store
vi.mock('@/state/budget.store');

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('CategoryPickerDrawer', () => {
  const mockCategoryGroups: CategoryGroup[] = [
    {
      id: 'group-expense-1',
      name: 'Gastos Esenciales',
      type: 'expense',
      color: '#EF4444',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'group-expense-2',
      name: 'Entretenimiento',
      type: 'expense',
      color: '#3B82F6',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'group-income-1',
      name: 'Ingresos',
      type: 'income',
      color: '#10B981',
      isDefault: true,
      createdAt: Date.now(),
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat-exp-1',
      name: 'Restaurantes',
      icon: 'utensils',
      color: '#EF4444',
      type: 'expense',
      groupId: 'group-expense-1',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'cat-exp-2',
      name: 'Transporte',
      icon: 'car',
      color: '#F59E0B',
      type: 'expense',
      groupId: 'group-expense-1',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'cat-exp-3',
      name: 'Streaming',
      icon: 'tv',
      color: '#3B82F6',
      type: 'expense',
      groupId: 'group-expense-2',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'cat-inc-1',
      name: 'Salario',
      icon: 'wallet',
      color: '#10B981',
      type: 'income',
      groupId: 'group-income-1',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'cat-inc-2',
      name: 'Freelance',
      icon: 'briefcase',
      color: '#059669',
      type: 'income',
      groupId: 'group-income-1',
      isDefault: true,
      createdAt: Date.now(),
    },
  ];

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    transactionType: 'expense' as const,
    value: null,
    onSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const state = {
        categoryDefinitions: mockCategories,
        categoryGroups: mockCategoryGroups,
      };
      return selector(state);
    });
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('should not render when open is false', () => {
      render(<CategoryPickerDrawer {...defaultProps} open={false} />, { wrapper: Wrapper });

      expect(screen.queryByText('Categoría')).not.toBeInTheDocument();
    });

    it('should render when open is true', () => {
      render(<CategoryPickerDrawer {...defaultProps} />, { wrapper: Wrapper });

      expect(screen.getByText('Categoría')).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<CategoryPickerDrawer {...defaultProps} />, { wrapper: Wrapper });

      expect(screen.getByPlaceholderText('Buscar')).toBeInTheDocument();
    });

    it('should render drag handle', () => {
      const { container } = render(<CategoryPickerDrawer {...defaultProps} />, { wrapper: Wrapper });

      const dragHandle = container.querySelector('.bg-gray-300');
      expect(dragHandle).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<CategoryPickerDrawer {...defaultProps} />, { wrapper: Wrapper });

      const closeButton = screen.getByRole('button', { name: /cerrar/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should render New Category button', () => {
      render(<CategoryPickerDrawer {...defaultProps} />, { wrapper: Wrapper });

      expect(screen.getByText('Nueva Categoría')).toBeInTheDocument();
    });
  });

  describe('Category Filtering by Type', () => {
    it('should show only expense categories when type is expense', () => {
      render(<CategoryPickerDrawer {...defaultProps} transactionType="expense" />, { wrapper: Wrapper });

      expect(screen.getByText('Restaurantes')).toBeInTheDocument();
      expect(screen.getByText('Transporte')).toBeInTheDocument();
      expect(screen.getByText('Streaming')).toBeInTheDocument();
      expect(screen.queryByText('Salario')).not.toBeInTheDocument();
      expect(screen.queryByText('Freelance')).not.toBeInTheDocument();
    });

    it('should show only income categories when type is income', () => {
      render(<CategoryPickerDrawer {...defaultProps} transactionType="income" />, { wrapper: Wrapper });

      expect(screen.queryByText('Restaurantes')).not.toBeInTheDocument();
      expect(screen.queryByText('Transporte')).not.toBeInTheDocument();
      expect(screen.getByText('Salario')).toBeInTheDocument();
      expect(screen.getByText('Freelance')).toBeInTheDocument();
    });

    it('should show correct groups for expense type', () => {
      render(<CategoryPickerDrawer {...defaultProps} transactionType="expense" />, { wrapper: Wrapper });

      expect(screen.getByText(/gastos esenciales/i)).toBeInTheDocument();
      expect(screen.getByText(/entretenimiento/i)).toBeInTheDocument();
      expect(screen.queryByText(/ingresos/i)).not.toBeInTheDocument();
    });

    it('should show correct groups for income type', () => {
      render(<CategoryPickerDrawer {...defaultProps} transactionType="income" />, { wrapper: Wrapper });

      expect(screen.queryByText(/gastos esenciales/i)).not.toBeInTheDocument();
      expect(screen.getByText(/ingresos/i)).toBeInTheDocument();
    });

    it('should not show empty groups', () => {
      const emptyGroup: CategoryGroup = {
        id: 'group-empty',
        name: 'Empty Group',
        type: 'expense',
        color: '#000000',
        isDefault: false,
        createdAt: Date.now(),
      };

      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          categoryDefinitions: mockCategories,
          categoryGroups: [...mockCategoryGroups, emptyGroup],
        };
        return selector(state);
      });

      render(<CategoryPickerDrawer {...defaultProps} transactionType="expense" />, { wrapper: Wrapper });

      expect(screen.queryByText('EMPTY GROUP')).not.toBeInTheDocument();
    });
  });

  describe('Search Filtering', () => {
    it('should filter categories by name', () => {
      render(<CategoryPickerDrawer {...defaultProps} transactionType="expense" />, { wrapper: Wrapper });

      const searchInput = screen.getByPlaceholderText('Buscar');
      fireEvent.change(searchInput, { target: { value: 'Restaurantes' } });

      expect(screen.getByText('Restaurantes')).toBeInTheDocument();
      expect(screen.queryByText('Transporte')).not.toBeInTheDocument();
      expect(screen.queryByText('Streaming')).not.toBeInTheDocument();
    });

    it('should be case insensitive', () => {
      render(<CategoryPickerDrawer {...defaultProps} transactionType="expense" />, { wrapper: Wrapper });

      const searchInput = screen.getByPlaceholderText('Buscar');
      fireEvent.change(searchInput, { target: { value: 'RESTAURANTES' } });

      expect(screen.getByText('Restaurantes')).toBeInTheDocument();
    });

    it('should filter with partial matches', () => {
      render(<CategoryPickerDrawer {...defaultProps} transactionType="expense" />, { wrapper: Wrapper });

      const searchInput = screen.getByPlaceholderText('Buscar');
      fireEvent.change(searchInput, { target: { value: 'Trans' } });

      expect(screen.getByText('Transporte')).toBeInTheDocument();
      expect(screen.queryByText('Restaurantes')).not.toBeInTheDocument();
    });

    it('should show empty state when no results', () => {
      render(<CategoryPickerDrawer {...defaultProps} transactionType="expense" />, { wrapper: Wrapper });

      const searchInput = screen.getByPlaceholderText('Buscar');
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

      expect(screen.getByText('No se encontraron categorías')).toBeInTheDocument();
    });

    it('should clear search when reopened', () => {
      const { rerender } = render(<CategoryPickerDrawer {...defaultProps} />, { wrapper: Wrapper });

      const searchInput = screen.getByPlaceholderText('Buscar');
      fireEvent.change(searchInput, { target: { value: 'Restaurantes' } });

      // Close
      rerender(<CategoryPickerDrawer {...defaultProps} open={false} />);

      // Reopen
      rerender(<CategoryPickerDrawer {...defaultProps} open={true} />);

      const newSearchInput = screen.getByPlaceholderText('Buscar');
      expect(newSearchInput).toHaveValue('');
    });
  });

  describe('Category Selection', () => {
    it('should call onSelect when category is clicked', () => {
      const onSelect = vi.fn();
      render(<CategoryPickerDrawer {...defaultProps} onSelect={onSelect} />, { wrapper: Wrapper });

      const restaurantButton = screen.getByText('Restaurantes');
      fireEvent.click(restaurantButton);

      expect(onSelect).toHaveBeenCalledWith('cat-exp-1');
    });

    it('should highlight selected category', () => {
      render(<CategoryPickerDrawer {...defaultProps} value="cat-exp-1" />, { wrapper: Wrapper });

      const restaurantButton = screen.getByText('Restaurantes').closest('button');
      expect(restaurantButton).toHaveClass('bg-emerald-50');
    });

    it('should not highlight other categories when one is selected', () => {
      render(<CategoryPickerDrawer {...defaultProps} value="cat-exp-1" />, { wrapper: Wrapper });

      const transportButton = screen.getByText('Transporte').closest('button');
      expect(transportButton).not.toHaveClass('bg-emerald-50');
    });

    it('should handle selection of different categories', () => {
      const onSelect = vi.fn();
      render(<CategoryPickerDrawer {...defaultProps} onSelect={onSelect} />, { wrapper: Wrapper });

      fireEvent.click(screen.getByText('Restaurantes'));
      expect(onSelect).toHaveBeenCalledWith('cat-exp-1');

      fireEvent.click(screen.getByText('Transporte'));
      expect(onSelect).toHaveBeenCalledWith('cat-exp-2');
    });
  });

  describe('Drag to Dismiss', () => {
    it('should close when dragged down beyond threshold on header', async () => {
      const onClose = vi.fn();
      const { container } = render(<CategoryPickerDrawer {...defaultProps} onClose={onClose} />, { wrapper: Wrapper });

      // Drag events are only on the header (flex-none), not the entire sheet
      const dragHandle = container.querySelector('.cursor-grab');
      expect(dragHandle).toBeInTheDocument();

      // Simulate touch drag on header area
      fireEvent.touchStart(dragHandle!, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(dragHandle!, { touches: [{ clientY: 400 }] }); // Drag 300px down
      fireEvent.touchEnd(dragHandle!);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('should not close when dragged down below threshold', () => {
      const onClose = vi.fn();
      const { container } = render(<CategoryPickerDrawer {...defaultProps} onClose={onClose} />, { wrapper: Wrapper });

      const dragHandle = container.querySelector('.cursor-grab');

      // Simulate small drag on header
      fireEvent.touchStart(dragHandle!, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(dragHandle!, { touches: [{ clientY: 150 }] }); // Drag 50px down
      fireEvent.touchEnd(dragHandle!);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should handle drag on handle element', () => {
      const onClose = vi.fn();
      const { container } = render(<CategoryPickerDrawer {...defaultProps} onClose={onClose} />, { wrapper: Wrapper });

      const dragHandle = container.querySelector('.cursor-grab');
      expect(dragHandle).toBeInTheDocument();

      // Simulate mouse drag on handle
      fireEvent.mouseDown(dragHandle!, { clientY: 100 });

      // dragMove and dragEnd are handled by window events
      expect(dragHandle).toHaveClass('cursor-grab');
    });

    it('should not close when dragged up', () => {
      const onClose = vi.fn();
      const { container } = render(<CategoryPickerDrawer {...defaultProps} onClose={onClose} />, { wrapper: Wrapper });

      const sheet = container.querySelector('.rounded-t-3xl');

      // Simulate drag up
      fireEvent.touchStart(sheet!, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(sheet!, { touches: [{ clientY: 50 }] }); // Drag up
      fireEvent.touchEnd(sheet!);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('New Category Navigation', () => {
    it('should navigate to new category page when button clicked', () => {
      render(<CategoryPickerDrawer {...defaultProps} transactionType="expense" />, { wrapper: Wrapper });

      const newCategoryButton = screen.getByText('Nueva Categoría');
      fireEvent.click(newCategoryButton);

      expect(mockNavigate).toHaveBeenCalledWith('/category/new?type=expense&returnTo=transaction');
    });

    it('should close drawer when navigating to new category', () => {
      const onClose = vi.fn();
      render(<CategoryPickerDrawer {...defaultProps} onClose={onClose} transactionType="expense" />, { wrapper: Wrapper });

      const newCategoryButton = screen.getByText('Nueva Categoría');
      fireEvent.click(newCategoryButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onNavigateToNewCategory callback if provided', () => {
      const onNavigateToNewCategory = vi.fn();
      render(
        <CategoryPickerDrawer
          {...defaultProps}
          onNavigateToNewCategory={onNavigateToNewCategory}
          transactionType="expense"
        />,
        { wrapper: Wrapper }
      );

      const newCategoryButton = screen.getByText('Nueva Categoría');
      fireEvent.click(newCategoryButton);

      expect(onNavigateToNewCategory).toHaveBeenCalled();
    });

    it('should include correct transaction type in navigation URL', () => {
      render(<CategoryPickerDrawer {...defaultProps} transactionType="income" />, { wrapper: Wrapper });

      const newCategoryButton = screen.getByText('Nueva Categoría');
      fireEvent.click(newCategoryButton);

      expect(mockNavigate).toHaveBeenCalledWith('/category/new?type=income&returnTo=transaction');
    });
  });

  describe('Close Actions', () => {
    it('should close when close button is clicked', () => {
      const onClose = vi.fn();
      render(<CategoryPickerDrawer {...defaultProps} onClose={onClose} />, { wrapper: Wrapper });

      const closeButton = screen.getByRole('button', { name: /cerrar/i });
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should close when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<CategoryPickerDrawer {...defaultProps} onClose={onClose} />, { wrapper: Wrapper });

      const backdrop = screen.getByLabelText('Cerrar');
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Body Scroll Locking', () => {
    it('should lock body scroll when open', () => {
      render(<CategoryPickerDrawer {...defaultProps} open={true} />, { wrapper: Wrapper });

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should unlock body scroll when closed', () => {
      const { rerender } = render(<CategoryPickerDrawer {...defaultProps} open={true} />, { wrapper: Wrapper });
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<CategoryPickerDrawer {...defaultProps} open={false} />);

      waitFor(() => {
        expect(document.body.style.overflow).toBe('');
      });
    });

    it('should restore body scroll on unmount', () => {
      const { unmount } = render(<CategoryPickerDrawer {...defaultProps} open={true} />, { wrapper: Wrapper });
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty category list', () => {
      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          categoryDefinitions: [],
          categoryGroups: mockCategoryGroups,
        };
        return selector(state);
      });

      render(<CategoryPickerDrawer {...defaultProps} transactionType="expense" />, { wrapper: Wrapper });

      expect(screen.getByText('Nueva Categoría')).toBeInTheDocument();
      expect(screen.queryByText('Restaurantes')).not.toBeInTheDocument();
    });

    it('should handle category with missing icon', () => {
      const noIconCategory: Category = {
        id: 'cat-no-icon',
        name: 'No Icon',
        icon: 'non-existent-icon',
        color: '#000000',
        type: 'expense',
        groupId: 'group-expense-1',
        isDefault: false,
        createdAt: Date.now(),
      };

      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          categoryDefinitions: [noIconCategory],
          categoryGroups: mockCategoryGroups,
        };
        return selector(state);
      });

      render(<CategoryPickerDrawer {...defaultProps} transactionType="expense" />, { wrapper: Wrapper });

      expect(screen.getByText('No Icon')).toBeInTheDocument();
    });

    it('should handle category with special characters in name', () => {
      const specialCategory: Category = {
        id: 'cat-special',
        name: 'Café & Té',
        icon: 'coffee',
        color: '#000000',
        type: 'expense',
        groupId: 'group-expense-1',
        isDefault: false,
        createdAt: Date.now(),
      };

      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          categoryDefinitions: [specialCategory],
          categoryGroups: mockCategoryGroups,
        };
        return selector(state);
      });

      render(<CategoryPickerDrawer {...defaultProps} transactionType="expense" />, { wrapper: Wrapper });

      expect(screen.getByText('Café & Té')).toBeInTheDocument();
    });

    it('should handle very long category names', () => {
      const longNameCategory: Category = {
        id: 'cat-long',
        name: 'This is a very long category name that should still display properly',
        icon: 'circle',
        color: '#000000',
        type: 'expense',
        groupId: 'group-expense-1',
        isDefault: false,
        createdAt: Date.now(),
      };

      (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const state = {
          categoryDefinitions: [longNameCategory],
          categoryGroups: mockCategoryGroups,
        };
        return selector(state);
      });

      render(<CategoryPickerDrawer {...defaultProps} transactionType="expense" />, { wrapper: Wrapper });

      expect(
        screen.getByText('This is a very long category name that should still display properly')
      ).toBeInTheDocument();
    });

    it('should maintain scroll position during search', () => {
      render(<CategoryPickerDrawer {...defaultProps} transactionType="expense" />, { wrapper: Wrapper });

      const searchInput = screen.getByPlaceholderText('Buscar');

      // Perform search
      fireEvent.change(searchInput, { target: { value: 'Rest' } });

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });

      // All categories should be visible again
      expect(screen.getByText('Restaurantes')).toBeInTheDocument();
      expect(screen.getByText('Transporte')).toBeInTheDocument();
      expect(screen.getByText('Streaming')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button types', () => {
      render(<CategoryPickerDrawer {...defaultProps} />, { wrapper: Wrapper });

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should have aria-label on backdrop', () => {
      render(<CategoryPickerDrawer {...defaultProps} />, { wrapper: Wrapper });

      const backdrop = screen.getByLabelText('Cerrar');
      expect(backdrop).toBeInTheDocument();
    });

    it('should have proper z-index for overlay', () => {
      const { container } = render(<CategoryPickerDrawer {...defaultProps} />, { wrapper: Wrapper });

      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('z-[70]');
    });

    it('should have proper input type for search', () => {
      render(<CategoryPickerDrawer {...defaultProps} />, { wrapper: Wrapper });

      const searchInput = screen.getByPlaceholderText('Buscar');
      expect(searchInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Animation States', () => {
    it('should apply animation classes when opening', async () => {
      const { container } = render(<CategoryPickerDrawer {...defaultProps} open={true} />, { wrapper: Wrapper });

      const sheet = container.querySelector('.rounded-t-3xl');
      expect(sheet).toBeInTheDocument();

      // Animation state is applied after mount
      await waitFor(() => {
        expect(sheet).toHaveStyle({ transform: 'translateY(0px)' });
      });
    });

    it('should clean up drag offset when closed', async () => {
      const { container, rerender } = render(<CategoryPickerDrawer {...defaultProps} open={true} />, { wrapper: Wrapper });

      const sheet = container.querySelector('.rounded-t-3xl');

      // Simulate drag
      fireEvent.touchStart(sheet!, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(sheet!, { touches: [{ clientY: 150 }] });
      fireEvent.touchEnd(sheet!);

      // Close
      rerender(<CategoryPickerDrawer {...defaultProps} open={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Categoría')).not.toBeInTheDocument();
      });
    });
  });
});
