import type { Meta, StoryObj } from "@storybook/react-vite";
import BalanceCard from "./BalanceCard";
import { useBudgetStore } from "@/state/budget.store";
import { mockTransactions } from "@/stories/_mocks/data";

const meta: Meta<typeof BalanceCard> = {
  title: "Transactions/BalanceCard",
  component: BalanceCard,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => {
      // Inject mock transactions and selectedMonth into store
      useBudgetStore.setState({
        transactions: mockTransactions,
        selectedMonth: "2026-02",
      });
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof BalanceCard>;

export const AllFilter: Story = {
  args: {
    activeFilter: "all",
    onFilterChange: (filter) =>
      console.log("[BalanceCard] Filter changed:", filter),
  },
};

export const IncomeFilter: Story = {
  args: {
    activeFilter: "income",
    onFilterChange: (filter) =>
      console.log("[BalanceCard] Filter changed:", filter),
  },
};

export const ExpenseFilter: Story = {
  args: {
    activeFilter: "expense",
    onFilterChange: (filter) =>
      console.log("[BalanceCard] Filter changed:", filter),
  },
};

export const LongAmounts: Story = {
  decorators: [
    (Story) => {
      useBudgetStore.setState({
        selectedMonth: "2026-02",
        transactions: [
          {
            id: "tx-income-long",
            date: "2026-02-08",
            name: "Contrato Enterprise",
            type: "income",
            amount: 1976532042,
            category: "salary",
            createdAt: 1760000000010,
          },
          {
            id: "tx-expense-long",
            date: "2026-02-09",
            name: "Operación internacional",
            type: "expense",
            amount: 843602195,
            category: "services",
            createdAt: 1760000000020,
          },
        ],
      });
      return <Story />;
    },
  ],
  args: {
    activeFilter: "all",
    onFilterChange: (filter) =>
      console.log("[BalanceCard] Filter changed:", filter),
  },
};
