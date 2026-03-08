import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import AutoConfirmedModal from "./AutoConfirmedModal";
import type { Transaction, Category } from "@/types/budget.types";
import { useBudgetStore } from "@/state/budget.store";

// Mock dependencies
vi.mock("@/features/currency", () => ({
  useCurrency: () => ({
    formatAmount: (val: number) => val.toLocaleString("es-CO"),
    currencyInfo: { symbol: "$", code: "COP" },
    currency: "COP",
    setCurrency: vi.fn(),
  }),
}));

vi.mock("@/state/budget.store");

const mockCategories: Category[] = [
  { id: "cat-food", name: "Alimentación", icon: "utensils", color: "#ef4444", type: "expense", groupId: "g1", isDefault: true, createdAt: 0 },
  { id: "cat-transport", name: "Transporte", icon: "car", color: "#3b82f6", type: "expense", groupId: "g1", isDefault: true, createdAt: 0 },
  { id: "cat-salary", name: "Salario", icon: "wallet", color: "#10b981", type: "income", groupId: "g2", isDefault: true, createdAt: 0 },
];

function makeTx(overrides: Partial<Transaction> & { id: string; name: string }): Transaction {
  return {
    type: "expense",
    category: "cat-food",
    amount: 50000,
    date: "2026-03-06",
    status: "pending",
    createdAt: Date.now(),
    ...overrides,
  };
}

const sampleTransactions: Transaction[] = [
  makeTx({ id: "tx-1", name: "Almuerzo", category: "cat-food", amount: 25000 }),
  makeTx({ id: "tx-2", name: "Taxi", category: "cat-transport", amount: 15000 }),
  makeTx({ id: "tx-3", name: "Salario", category: "cat-salary", amount: 3000000, type: "income" }),
];

describe("AutoConfirmedModal", () => {
  const defaultProps = {
    open: true,
    transactions: sampleTransactions,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = "";

    (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: Record<string, unknown>) => unknown) => {
        const state = { categoryDefinitions: mockCategories };
        return selector(state);
      }
    );
  });

  afterEach(() => {
    document.body.style.overflow = "";
  });

  describe("Rendering", () => {
    it("should not render when open is false", () => {
      render(<AutoConfirmedModal {...defaultProps} open={false} />);
      expect(screen.queryByText("Registros automáticos")).not.toBeInTheDocument();
    });

    it("should render when open is true", () => {
      render(<AutoConfirmedModal {...defaultProps} />);
      expect(screen.getByText("Registros automáticos")).toBeInTheDocument();
    });

    it("should render modal title", () => {
      render(<AutoConfirmedModal {...defaultProps} />);
      const title = screen.getByRole("heading", { level: 3 });
      expect(title).toHaveTextContent("Registros automáticos");
    });

    it("should render subtitle with transaction count", () => {
      render(<AutoConfirmedModal {...defaultProps} />);
      expect(screen.getByText(/registraron 3 movimientos programados/i)).toBeInTheDocument();
    });

    it("should render dismiss button", () => {
      render(<AutoConfirmedModal {...defaultProps} />);
      expect(screen.getByRole("button", { name: "Ok" })).toBeInTheDocument();
    });
  });

  describe("Transaction list", () => {
    it("should render all transactions when <= 5", () => {
      render(<AutoConfirmedModal {...defaultProps} />);
      expect(screen.getByText("Almuerzo")).toBeInTheDocument();
      expect(screen.getByText("Taxi")).toBeInTheDocument();
      // "Salario" appears as both tx name and category name, so use getAllByText
      expect(screen.getAllByText("Salario").length).toBeGreaterThanOrEqual(1);
    });

    it("should show category names", () => {
      render(<AutoConfirmedModal {...defaultProps} />);
      expect(screen.getAllByText("Alimentación").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Transporte").length).toBeGreaterThan(0);
    });

    it("should show formatted amounts", () => {
      render(<AutoConfirmedModal {...defaultProps} />);
      // formatAmount mock returns toLocaleString('es-CO')
      expect(screen.getByText(/25.000/)).toBeInTheDocument();
      expect(screen.getByText(/15.000/)).toBeInTheDocument();
    });

    it("should show + prefix for income transactions", () => {
      render(<AutoConfirmedModal {...defaultProps} />);
      // The income transaction (Salario) should have "+" prefix
      const salarioAmount = screen.getByText(/\+/);
      expect(salarioAmount).toBeInTheDocument();
    });

    it("should show - prefix for expense transactions", () => {
      render(<AutoConfirmedModal {...defaultProps} />);
      const amounts = screen.getAllByText(/-/);
      expect(amounts.length).toBeGreaterThanOrEqual(2); // At least 2 expense transactions
    });

    it("should limit display to 5 transactions and show 'more' indicator", () => {
      const manyTransactions = Array.from({ length: 7 }, (_, i) =>
        makeTx({ id: `tx-${i}`, name: `Transaction ${i}`, amount: 10000 * (i + 1) })
      );

      render(
        <AutoConfirmedModal
          {...defaultProps}
          transactions={manyTransactions}
        />
      );

      // Should render exactly 5 transaction cards
      expect(screen.getByText("Transaction 0")).toBeInTheDocument();
      expect(screen.getByText("Transaction 4")).toBeInTheDocument();
      expect(screen.queryByText("Transaction 5")).not.toBeInTheDocument();

      // Should show "y 2 más..."
      expect(screen.getByText(/2 más/)).toBeInTheDocument();
    });

    it("should not show 'more' indicator when <= 5 transactions", () => {
      render(<AutoConfirmedModal {...defaultProps} />);
      expect(screen.queryByText(/más\.\.\./)).not.toBeInTheDocument();
    });

    it("should handle transactions without matching category", () => {
      const txUnknownCategory = [
        makeTx({ id: "tx-unknown", name: "Unknown", category: "nonexistent-cat" }),
      ];

      render(
        <AutoConfirmedModal
          {...defaultProps}
          transactions={txUnknownCategory}
        />
      );

      expect(screen.getByText("Unknown")).toBeInTheDocument();
    });
  });

  describe("User interactions", () => {
    it("should call onClose when dismiss button is clicked", () => {
      const onClose = vi.fn();
      render(<AutoConfirmedModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole("button", { name: "Ok" }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when backdrop is clicked", () => {
      const onClose = vi.fn();
      render(<AutoConfirmedModal {...defaultProps} onClose={onClose} />);

      // Backdrop is the first child div with bg-black/50
      const heading = screen.getByRole("heading", { level: 3 });
      const modalCard = heading.closest(".relative");
      const backdrop = modalCard?.previousElementSibling;

      expect(backdrop).toBeInTheDocument();
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe("Body scroll lock", () => {
    it("should lock body scroll when open", () => {
      render(<AutoConfirmedModal {...defaultProps} open={true} />);
      expect(document.body.style.overflow).toBe("hidden");
    });

    it("should unlock body scroll when closed", () => {
      const { rerender } = render(
        <AutoConfirmedModal {...defaultProps} open={true} />
      );

      rerender(<AutoConfirmedModal {...defaultProps} open={false} />);
      expect(document.body.style.overflow).toBe("");
    });

    it("should clean up body scroll on unmount", () => {
      const { unmount } = render(
        <AutoConfirmedModal {...defaultProps} open={true} />
      );

      unmount();
      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("Accessibility", () => {
    it("should have proper button type", () => {
      render(<AutoConfirmedModal {...defaultProps} />);
      const button = screen.getByRole("button", { name: "Ok" });
      expect(button).toHaveAttribute("type", "button");
    });

    it("should have proper z-index layer", () => {
      const { container } = render(<AutoConfirmedModal {...defaultProps} />);
      const fixedContainer = container.firstChild as HTMLElement;
      expect(fixedContainer).toHaveClass("z-50");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty transactions array gracefully", () => {
      render(
        <AutoConfirmedModal {...defaultProps} open={true} transactions={[]} />
      );
      // With open=true but empty array, modal still renders but with 0 count
      expect(screen.queryByText("Registros automáticos")).toBeInTheDocument();
    });

    it("should handle single transaction with correct singular text", () => {
      const singleTx = [makeTx({ id: "tx-1", name: "Almuerzo" })];
      render(
        <AutoConfirmedModal {...defaultProps} transactions={singleTx} />
      );
      expect(screen.getByText(/registró 1 movimiento programado/i)).toBeInTheDocument();
    });
  });
});
