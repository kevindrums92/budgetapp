import type { Meta, StoryObj } from "@storybook/react-vite";
import CategoryPickerDrawer from "./CategoryPickerDrawer";
import { useBudgetStore } from "@/state/budget.store";
import { mockCategories, mockCategoryGroups } from "@/stories/_mocks/data";

const meta: Meta<typeof CategoryPickerDrawer> = {
  title: "Categories/CategoryPickerDrawer",
  component: CategoryPickerDrawer,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => {
      useBudgetStore.setState({
        categoryDefinitions: mockCategories,
        categoryGroups: mockCategoryGroups,
      });
      return (
        <div className="h-[600px] bg-gray-50 dark:bg-gray-950">
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof CategoryPickerDrawer>;

export const ExpenseCategories: Story = {
  args: {
    open: true,
    transactionType: "expense",
    value: null,
    onClose: () => console.log("[CategoryPickerDrawer] Closed"),
    onSelect: (id) => console.log("[CategoryPickerDrawer] Selected:", id),
    showNewCategoryButton: true,
  },
};

export const IncomeCategories: Story = {
  args: {
    open: true,
    transactionType: "income",
    value: null,
    onClose: () => console.log("[CategoryPickerDrawer] Closed"),
    onSelect: (id) => console.log("[CategoryPickerDrawer] Selected:", id),
    showNewCategoryButton: true,
  },
};

export const WithSelection: Story = {
  args: {
    open: true,
    transactionType: "expense",
    value: "cat-food",
    onClose: () => console.log("[CategoryPickerDrawer] Closed"),
    onSelect: (id) => console.log("[CategoryPickerDrawer] Selected:", id),
  },
};
