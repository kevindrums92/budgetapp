import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@/test/test-utils";
import HomePage from "./HomePage";
import { useBudgetStore } from "@/state/budget.store";
import * as schedulerService from "@/shared/services/scheduler.service";
import * as datesService from "@/services/dates.service";
import type { Transaction } from "@/types/budget.types";

// Mock state module
vi.mock("@/state/budget.store");

// Mock heavy child components to isolate scheduler logic
vi.mock("@/features/transactions/components/BalanceCard", () => ({
  default: () => <div data-testid="balance-card" />,
}));
vi.mock("@/features/transactions/components/TransactionList", () => ({
  default: () => <div data-testid="transaction-list" />,
}));
vi.mock("@/features/transactions/components/AddActionSheet", () => ({
  default: () => null,
}));
vi.mock("@/features/transactions/components/ScheduledBanner", () => ({
  default: () => null,
}));
vi.mock("@/features/forecasting/components/SafeToSpendCard", () => ({
  default: () => null,
}));
vi.mock("@/features/tour/components/SpotlightTour", () => ({
  default: () => null,
}));
vi.mock("@/features/tour/hooks/useSpotlightTour", () => ({
  useSpotlightTour: () => ({
    isActive: false,
    startTour: vi.fn(),
    completeTour: vi.fn(),
  }),
}));
vi.mock("@/services/pushNotification.service", () => ({
  requestPermissions: vi.fn().mockResolvedValue(false),
  checkPermissionStatus: vi.fn().mockResolvedValue("denied"),
}));
vi.mock("@/services/pushBannerTracking.service", () => ({
  shouldShowBanner: () => false,
  recordDismiss: vi.fn(),
  markAsEnabled: vi.fn(),
}));

// Spy on scheduler service
vi.mock("@/shared/services/scheduler.service", async () => {
  const actual = await vi.importActual("@/shared/services/scheduler.service");
  return {
    ...actual,
    generatePastDueTransactions: vi.fn().mockReturnValue([]),
    generateVirtualTransactions: vi.fn().mockReturnValue([]),
  };
});

// Mock dates service
vi.mock("@/services/dates.service", async () => {
  const actual = await vi.importActual("@/services/dates.service");
  return {
    ...actual,
    todayISO: vi.fn().mockReturnValue("2026-03-06"),
  };
});

// Mock the AutoConfirmedModal to simplify testing
vi.mock("@/features/transactions/components/AutoConfirmedModal", () => ({
  default: ({
    open,
    transactions,
    onClose,
  }: {
    open: boolean;
    transactions: Transaction[];
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid="auto-confirmed-modal">
        <span data-testid="confirmed-count">{transactions.length}</span>
        <button type="button" onClick={onClose} data-testid="modal-close">
          Ok
        </button>
      </div>
    ) : null,
}));

const mockAddTransaction = vi.fn();

const templateTransaction: Transaction = {
  id: "template-rent",
  type: "expense",
  name: "Rent",
  category: "cat-housing",
  amount: 1500000,
  date: "2026-01-15",
  status: "paid",
  createdAt: Date.now(),
  schedule: {
    enabled: true,
    frequency: "monthly",
    interval: 1,
    startDate: "2026-01-15",
    dayOfMonth: 15,
  },
};

const pastDueTx: Transaction = {
  id: "generated-1",
  type: "expense",
  name: "Rent",
  category: "cat-housing",
  amount: 1500000,
  date: "2026-03-06",
  status: "pending",
  sourceTemplateId: "template-rent",
  createdAt: Date.now(),
};

function setupStore(overrides: Record<string, unknown> = {}) {
  const state = {
    selectedMonth: "2026-03",
    transactions: [templateTransaction],
    addTransaction: mockAddTransaction,
    user: { email: null },
    cloudSyncReady: true,
    cloudMode: "cloud",
    categoryDefinitions: [],
    ...overrides,
  };

  (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    (selector: (s: typeof state) => unknown) => selector(state)
  );
}

describe("HomePage — Scheduler Race Condition Fix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddTransaction.mockClear();
    localStorage.clear();

    // Reset date mock
    vi.mocked(datesService.todayISO).mockReturnValue("2026-03-06");

    // Reset scheduler mocks
    vi.mocked(schedulerService.generatePastDueTransactions).mockReturnValue([]);
    vi.mocked(schedulerService.generateVirtualTransactions).mockReturnValue([]);

    // Reset visibilityState
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      writable: true,
      configurable: true,
    });
  });

  describe("cloudSyncReady gate", () => {
    it("should NOT run scheduler when cloudMode=cloud and cloudSyncReady=false", () => {
      setupStore({ cloudMode: "cloud", cloudSyncReady: false });

      render(<HomePage />);

      expect(schedulerService.generatePastDueTransactions).not.toHaveBeenCalled();
    });

    it("should run scheduler when cloudMode=cloud and cloudSyncReady=true", () => {
      setupStore({ cloudMode: "cloud", cloudSyncReady: true });

      render(<HomePage />);

      expect(schedulerService.generatePastDueTransactions).toHaveBeenCalledWith(
        [templateTransaction],
        "2026-03-06"
      );
    });

    it("should run scheduler immediately when cloudMode=guest (no need to wait)", () => {
      setupStore({ cloudMode: "guest", cloudSyncReady: false });

      render(<HomePage />);

      expect(schedulerService.generatePastDueTransactions).toHaveBeenCalledWith(
        [templateTransaction],
        "2026-03-06"
      );
    });
  });

  describe("Auto-confirm and modal feedback", () => {
    it("should call addTransaction for each past-due transaction", () => {
      const pastDueList = [
        pastDueTx,
        { ...pastDueTx, id: "generated-2", date: "2026-02-15" },
      ];
      vi.mocked(schedulerService.generatePastDueTransactions).mockReturnValue(pastDueList);
      setupStore({ cloudMode: "cloud", cloudSyncReady: true });

      render(<HomePage />);

      expect(mockAddTransaction).toHaveBeenCalledTimes(2);
    });

    it("should show AutoConfirmedModal when past-due transactions are found", () => {
      vi.mocked(schedulerService.generatePastDueTransactions).mockReturnValue([pastDueTx]);
      setupStore({ cloudMode: "cloud", cloudSyncReady: true });

      render(<HomePage />);

      expect(screen.getByTestId("auto-confirmed-modal")).toBeInTheDocument();
      expect(screen.getByTestId("confirmed-count")).toHaveTextContent("1");
    });

    it("should NOT show modal when no past-due transactions exist", () => {
      vi.mocked(schedulerService.generatePastDueTransactions).mockReturnValue([]);
      setupStore({ cloudMode: "cloud", cloudSyncReady: true });

      render(<HomePage />);

      expect(screen.queryByTestId("auto-confirmed-modal")).not.toBeInTheDocument();
    });
  });

  describe("visibilitychange — today reactivity", () => {
    it("should re-run scheduler when date changes after visibility change", async () => {
      vi.mocked(schedulerService.generatePastDueTransactions).mockReturnValue([]);
      setupStore({ cloudMode: "guest", cloudSyncReady: false });

      render(<HomePage />);

      // First run
      expect(schedulerService.generatePastDueTransactions).toHaveBeenCalledTimes(1);

      // Simulate day change
      vi.mocked(datesService.todayISO).mockReturnValue("2026-03-07");

      await act(async () => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      // Scheduler should have been called again with new date
      expect(schedulerService.generatePastDueTransactions).toHaveBeenCalledTimes(2);
    });

    it("should NOT re-run scheduler if date hasn't changed", async () => {
      vi.mocked(schedulerService.generatePastDueTransactions).mockReturnValue([]);
      setupStore({ cloudMode: "guest", cloudSyncReady: false });

      render(<HomePage />);

      expect(schedulerService.generatePastDueTransactions).toHaveBeenCalledTimes(1);

      // Simulate visibility change but same date (todayISO still returns "2026-03-06")
      await act(async () => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      // No re-run since date didn't change
      expect(schedulerService.generatePastDueTransactions).toHaveBeenCalledTimes(1);
    });
  });
});
