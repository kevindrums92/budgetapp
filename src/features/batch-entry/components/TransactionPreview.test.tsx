/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TransactionPreview from "./TransactionPreview";
import type { TransactionDraft } from "../types/batch-entry.types";

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (key === "review.reviewInstructions") {
        return params?.count === 1
          ? `Revisa y completa la información de ${params.count} transacción`
          : `Revisa y completa la información de ${params.count} transacciones`;
      }
      if (key === "review.noTransactionsFound")
        return "No se encontraron transacciones en el input";
      if (key === "review.tryAgain") return "Intentar de nuevo";
      if (key === "review.saveAll") return "Guardar todas";
      if (key === "review.save") return "Guardar";
      if (key === "review.saving") return "Guardando...";
      if (key === "common.cancel") return "Cancelar";
      if (key === "review.fixCategory") {
        return params?.count === 1
          ? `${params.count} transacción sin categoría. Asigna una categoría o elimínala.`
          : `${params.count} transacciones sin categoría. Asigna una categoría o elimínalas.`;
      }
      if (key === "review.fixAmount") {
        return params?.count === 1
          ? `${params.count} transacción sin monto. Agrega el monto o elimínala.`
          : `${params.count} transacciones sin monto. Agrega el monto o elimínalas.`;
      }
      if (key === "review.needsReviewWarning")
        return "Algunas transacciones necesitan revisión (marcadas con !)";
      return key;
    },
    i18n: {
      language: "es",
    },
  }),
}));

// Mock useCurrency hook
vi.mock("@/features/currency", () => ({
  useCurrency: () => ({
    formatAmount: (amount: number) => `$ ${amount.toLocaleString("es-CO")}`,
    currencyInfo: {
      symbol: "$",
      code: "COP",
      locale: "es-CO",
      decimals: 0,
    },
    currency: "COP",
    setCurrency: vi.fn(),
  }),
}));

describe("TransactionPreview", () => {
  const mockDrafts: TransactionDraft[] = [
    {
      id: "draft-1",
      type: "expense",
      name: "Almuerzo",
      category: "cat-food",
      amount: 50000,
      date: "2024-01-15",
      needsReview: false,
      confidence: 0.95,
    },
    {
      id: "draft-2",
      type: "income",
      name: "Salario",
      category: "cat-salary",
      amount: 2000000,
      date: "2024-01-15",
      needsReview: false,
      confidence: 0.98,
    },
  ];

  const mockHandlers = {
    onUpdateDraft: vi.fn(),
    onDeleteDraft: vi.fn(),
    onSaveAll: vi.fn(),
    onCancel: vi.fn(),
  };

  it("should render empty state when no drafts", () => {
    render(
      <TransactionPreview
        drafts={[]}
        onUpdateDraft={mockHandlers.onUpdateDraft}
        onDeleteDraft={mockHandlers.onDeleteDraft}
        onSaveAll={mockHandlers.onSaveAll}
        onCancel={mockHandlers.onCancel}
        isSaving={false}
      />
    );

    expect(
      screen.getByText("No se encontraron transacciones en el input")
    ).toBeInTheDocument();
    expect(screen.getByText("Intentar de nuevo")).toBeInTheDocument();
  });

  it("should call onCancel when try again button is clicked", () => {
    render(
      <TransactionPreview
        drafts={[]}
        onUpdateDraft={mockHandlers.onUpdateDraft}
        onDeleteDraft={mockHandlers.onDeleteDraft}
        onSaveAll={mockHandlers.onSaveAll}
        onCancel={mockHandlers.onCancel}
        isSaving={false}
      />
    );

    fireEvent.click(screen.getByText("Intentar de nuevo"));

    expect(mockHandlers.onCancel).toHaveBeenCalled();
  });

  it("should render smart card header with title and total", () => {
    render(
      <TransactionPreview
        drafts={mockDrafts}
        onUpdateDraft={mockHandlers.onUpdateDraft}
        onDeleteDraft={mockHandlers.onDeleteDraft}
        onSaveAll={mockHandlers.onSaveAll}
        onCancel={mockHandlers.onCancel}
        isSaving={false}
      />
    );

    // Check for title and total batch label
    expect(screen.getByText("review.title")).toBeInTheDocument();
    expect(screen.getByText("review.totalBatch")).toBeInTheDocument();
    // Net total: 2,000,000 - 50,000 = 1,950,000
    expect(screen.getByText("$ 1.950.000")).toBeInTheDocument();
  });

  it("should display total income and expense correctly", () => {
    render(
      <TransactionPreview
        drafts={mockDrafts}
        onUpdateDraft={mockHandlers.onUpdateDraft}
        onDeleteDraft={mockHandlers.onDeleteDraft}
        onSaveAll={mockHandlers.onSaveAll}
        onCancel={mockHandlers.onCancel}
        isSaving={false}
      />
    );

    // Income: 2,000,000 (appears in summary and in transaction card)
    const incomeElements = screen.getAllByText(/2\.000\.000/);
    expect(incomeElements.length).toBeGreaterThan(0);
    // Expense: 50,000 (appears in summary and in transaction card)
    const expenseElements = screen.getAllByText(/50\.000/);
    expect(expenseElements.length).toBeGreaterThan(0);
  });

  it("should show warning when drafts need review", () => {
    const draftsWithReview: TransactionDraft[] = [
      { ...mockDrafts[0], needsReview: true },
    ];

    render(
      <TransactionPreview
        drafts={draftsWithReview}
        onUpdateDraft={mockHandlers.onUpdateDraft}
        onDeleteDraft={mockHandlers.onDeleteDraft}
        onSaveAll={mockHandlers.onSaveAll}
        onCancel={mockHandlers.onCancel}
        isSaving={false}
      />
    );

    expect(
      screen.getByText("Algunas transacciones necesitan revisión (marcadas con !)")
    ).toBeInTheDocument();
  });

  it("should show warning when drafts have no category", () => {
    const draftsWithoutCategory: TransactionDraft[] = [
      { ...mockDrafts[0], category: "" },
    ];

    render(
      <TransactionPreview
        drafts={draftsWithoutCategory}
        onUpdateDraft={mockHandlers.onUpdateDraft}
        onDeleteDraft={mockHandlers.onDeleteDraft}
        onSaveAll={mockHandlers.onSaveAll}
        onCancel={mockHandlers.onCancel}
        isSaving={false}
      />
    );

    expect(
      screen.getByText(
        /1 transacción sin categoría\. Asigna una categoría o elimínala\./
      )
    ).toBeInTheDocument();
  });

  it("should show warning when drafts have zero amount", () => {
    const draftsWithZeroAmount: TransactionDraft[] = [
      { ...mockDrafts[0], amount: 0 },
    ];

    render(
      <TransactionPreview
        drafts={draftsWithZeroAmount}
        onUpdateDraft={mockHandlers.onUpdateDraft}
        onDeleteDraft={mockHandlers.onDeleteDraft}
        onSaveAll={mockHandlers.onSaveAll}
        onCancel={mockHandlers.onCancel}
        isSaving={false}
      />
    );

    expect(
      screen.getByText(/1 transacción sin monto\. Agrega el monto o elimínala\./)
    ).toBeInTheDocument();
  });

  it("should disable save button when drafts are invalid", () => {
    const invalidDrafts: TransactionDraft[] = [
      { ...mockDrafts[0], category: "" },
    ];

    render(
      <TransactionPreview
        drafts={invalidDrafts}
        onUpdateDraft={mockHandlers.onUpdateDraft}
        onDeleteDraft={mockHandlers.onDeleteDraft}
        onSaveAll={mockHandlers.onSaveAll}
        onCancel={mockHandlers.onCancel}
        isSaving={false}
      />
    );

    // Only 1 draft, so button shows "Guardar" (singular) not "Guardar todas"
    const saveButton = screen.getByText("Guardar");
    expect(saveButton).toBeDisabled();
  });

  it("should enable save button when all drafts are valid", () => {
    render(
      <TransactionPreview
        drafts={mockDrafts}
        onUpdateDraft={mockHandlers.onUpdateDraft}
        onDeleteDraft={mockHandlers.onDeleteDraft}
        onSaveAll={mockHandlers.onSaveAll}
        onCancel={mockHandlers.onCancel}
        isSaving={false}
      />
    );

    const saveButton = screen.getByText("Guardar todas");
    expect(saveButton).not.toBeDisabled();
  });

  it("should call onSaveAll when save button is clicked", () => {
    render(
      <TransactionPreview
        drafts={mockDrafts}
        onUpdateDraft={mockHandlers.onUpdateDraft}
        onDeleteDraft={mockHandlers.onDeleteDraft}
        onSaveAll={mockHandlers.onSaveAll}
        onCancel={mockHandlers.onCancel}
        isSaving={false}
      />
    );

    fireEvent.click(screen.getByText("Guardar todas"));

    expect(mockHandlers.onSaveAll).toHaveBeenCalled();
  });

  it("should call onCancel when cancel button is clicked", () => {
    render(
      <TransactionPreview
        drafts={mockDrafts}
        onUpdateDraft={mockHandlers.onUpdateDraft}
        onDeleteDraft={mockHandlers.onDeleteDraft}
        onSaveAll={mockHandlers.onSaveAll}
        onCancel={mockHandlers.onCancel}
        isSaving={false}
      />
    );

    fireEvent.click(screen.getByText("Cancelar"));

    expect(mockHandlers.onCancel).toHaveBeenCalled();
  });

  it('should show "Guardar" for single draft', () => {
    render(
      <TransactionPreview
        drafts={[mockDrafts[0]]}
        onUpdateDraft={mockHandlers.onUpdateDraft}
        onDeleteDraft={mockHandlers.onDeleteDraft}
        onSaveAll={mockHandlers.onSaveAll}
        onCancel={mockHandlers.onCancel}
        isSaving={false}
      />
    );

    expect(screen.getByText("Guardar")).toBeInTheDocument();
  });

  it('should show "Guardando..." when saving', () => {
    render(
      <TransactionPreview
        drafts={mockDrafts}
        onUpdateDraft={mockHandlers.onUpdateDraft}
        onDeleteDraft={mockHandlers.onDeleteDraft}
        onSaveAll={mockHandlers.onSaveAll}
        onCancel={mockHandlers.onCancel}
        isSaving={true}
      />
    );

    expect(screen.getByText("Guardando...")).toBeInTheDocument();
  });

  it("should disable buttons when saving", () => {
    render(
      <TransactionPreview
        drafts={mockDrafts}
        onUpdateDraft={mockHandlers.onUpdateDraft}
        onDeleteDraft={mockHandlers.onDeleteDraft}
        onSaveAll={mockHandlers.onSaveAll}
        onCancel={mockHandlers.onCancel}
        isSaving={true}
      />
    );

    const saveButton = screen.getByText("Guardando...");
    const cancelButton = screen.getByText("Cancelar");

    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it("should render in fullscreen mode", () => {
    render(
      <TransactionPreview
        drafts={mockDrafts}
        onUpdateDraft={mockHandlers.onUpdateDraft}
        onDeleteDraft={mockHandlers.onDeleteDraft}
        onSaveAll={mockHandlers.onSaveAll}
        onCancel={mockHandlers.onCancel}
        isSaving={false}
        isFullScreen={true}
      />
    );

    // In fullscreen mode, buttons should be in different layout
    const saveButton = screen.getByText("Guardar todas");
    expect(saveButton.className).toContain("w-full");
  });

  it("should not show income total if no income transactions", () => {
    const expenseOnlyDrafts = [mockDrafts[0]];

    render(
      <TransactionPreview
        drafts={expenseOnlyDrafts}
        onUpdateDraft={mockHandlers.onUpdateDraft}
        onDeleteDraft={mockHandlers.onDeleteDraft}
        onSaveAll={mockHandlers.onSaveAll}
        onCancel={mockHandlers.onCancel}
        isSaving={false}
      />
    );

    // Should not show income (2,000,000)
    expect(screen.queryByText(/2\.000\.000/)).not.toBeInTheDocument();
    // Should show expense (50,000) - appears in summary and in transaction card
    const expenseElements = screen.getAllByText(/50\.000/);
    expect(expenseElements.length).toBeGreaterThan(0);
  });

  it("should not show expense total if no expense transactions", () => {
    const incomeOnlyDrafts = [mockDrafts[1]];

    render(
      <TransactionPreview
        drafts={incomeOnlyDrafts}
        onUpdateDraft={mockHandlers.onUpdateDraft}
        onDeleteDraft={mockHandlers.onDeleteDraft}
        onSaveAll={mockHandlers.onSaveAll}
        onCancel={mockHandlers.onCancel}
        isSaving={false}
      />
    );

    // Should show income (2,000,000) - appears in summary and in transaction card
    const incomeElements = screen.getAllByText(/2\.000\.000/);
    expect(incomeElements.length).toBeGreaterThan(0);
    // Should not show expense
    expect(screen.queryByText(/50\.000/)).not.toBeInTheDocument();
  });
});
