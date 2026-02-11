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
