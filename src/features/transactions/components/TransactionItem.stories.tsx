import type { Meta, StoryObj } from "@storybook/react-vite";
import TransactionItem from "./TransactionItem";
import {
  mockTransactions,
  getCategoryById,
} from "@/stories/_mocks/data";

const meta: Meta<typeof TransactionItem> = {
  title: "Transactions/TransactionItem",
  component: TransactionItem,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-md bg-white dark:bg-gray-900">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TransactionItem>;

// tx-1: Almuerzo en restaurante (expense, paid)
export const Expense: Story = {
  args: {
    transaction: mockTransactions[0],
    category: getCategoryById(mockTransactions[0].category),
  },
};

// tx-3: Salario febrero (income, paid)
export const Income: Story = {
  args: {
    transaction: mockTransactions[2],
    category: getCategoryById(mockTransactions[2].category),
  },
};

// tx-5: Netflix mensual (recurring expense)
export const Recurring: Story = {
  args: {
    transaction: mockTransactions[4],
    category: getCategoryById(mockTransactions[4].category),
  },
};

// tx-4: Cita ortopedia (pending expense)
export const Pending: Story = {
  args: {
    transaction: mockTransactions[3],
    category: getCategoryById(mockTransactions[3].category),
  },
};

// Without category
export const NoCategory: Story = {
  args: {
    transaction: mockTransactions[0],
    category: undefined,
  },
};

// List of multiple items
export const TransactionList: StoryObj = {
  render: () => (
    <div className="mx-auto max-w-md divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
      {mockTransactions.map((tx) => (
        <TransactionItem
          key={tx.id}
          transaction={tx}
          category={getCategoryById(tx.category)}
        />
      ))}
    </div>
  ),
};
