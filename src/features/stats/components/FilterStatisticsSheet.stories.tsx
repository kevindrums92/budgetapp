import type { Meta, StoryObj } from "@storybook/react-vite";
import FilterStatisticsSheet from "./FilterStatisticsSheet";
import { useBudgetStore } from "@/state/budget.store";
import { mockCategories } from "@/stories/_mocks/data";

const categoriesWithExpenses = mockCategories
  .filter((c) => c.type === "expense")
  .map((c, i) => ({
    ...c,
    total: [350000, 120000, 85000, 110000][i] ?? 50000,
  }));

const meta: Meta<typeof FilterStatisticsSheet> = {
  title: "BottomSheets/FilterStatisticsSheet",
  component: FilterStatisticsSheet,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => {
      useBudgetStore.setState({
        excludedFromStats: [],
      });
      return (
        <div className="h-[700px] bg-gray-50 dark:bg-gray-950">
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof FilterStatisticsSheet>;

export const Open: Story = {
  args: {
    open: true,
    onClose: () => console.log("[FilterStatisticsSheet] Closed"),
    categoriesWithExpenses,
  },
};
