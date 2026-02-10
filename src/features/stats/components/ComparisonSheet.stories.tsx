import type { Meta, StoryObj } from "@storybook/react-vite";
import ComparisonSheet from "./ComparisonSheet";

const meta: Meta<typeof ComparisonSheet> = {
  title: "BottomSheets/ComparisonSheet",
  component: ComparisonSheet,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="h-[700px] bg-gray-50 dark:bg-gray-950">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ComparisonSheet>;

export const SpendingLess: Story = {
  args: {
    open: true,
    onClose: () => console.log("[ComparisonSheet] Closed"),
    isCurrentMonth: true,
    comparisonDay: 10,
    prevMonth: "2026-01",
    prevMonthExpenses: 850000,
    currentMonthExpensesFiltered: 620000,
    selectedMonth: "2026-02",
    monthDiff: -230000,
    monthDiffPercent: -27,
    excludedCategoriesCount: 0,
  },
};

export const SpendingMore: Story = {
  args: {
    open: true,
    onClose: () => console.log("[ComparisonSheet] Closed"),
    isCurrentMonth: true,
    comparisonDay: 10,
    prevMonth: "2026-01",
    prevMonthExpenses: 450000,
    currentMonthExpensesFiltered: 680000,
    selectedMonth: "2026-02",
    monthDiff: 230000,
    monthDiffPercent: 51,
    excludedCategoriesCount: 2,
  },
};
