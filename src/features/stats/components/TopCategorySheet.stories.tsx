import type { Meta, StoryObj } from "@storybook/react-vite";
import TopCategorySheet from "./TopCategorySheet";
import { mockCategories, mockTransactions } from "@/stories/_mocks/data";

const meta: Meta<typeof TopCategorySheet> = {
  title: "BottomSheets/TopCategorySheet",
  component: TopCategorySheet,
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
type Story = StoryObj<typeof TopCategorySheet>;

export const WithTransactions: Story = {
  args: {
    open: true,
    onClose: () => console.log("[TopCategorySheet] Closed"),
    topCategory: mockCategories[0], // Alimentación
    topCategoryTransactions: mockTransactions.filter(
      (tx) => tx.category === "cat-food"
    ),
    selectedMonth: "2026-02",
    categoryDefinitions: mockCategories,
    excludedCategoriesCount: 0,
  },
};
