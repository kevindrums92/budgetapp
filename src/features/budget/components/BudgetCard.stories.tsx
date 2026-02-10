import type { Meta, StoryObj } from "@storybook/react-vite";
import BudgetCard from "./BudgetCard";
import {
  mockBudgetProgressUnderLimit,
  mockBudgetProgressExceeded,
  mockBudgetProgressGoal,
  mockBudgetProgressGoalAchieved,
} from "@/stories/_mocks/data";

const meta: Meta<typeof BudgetCard> = {
  title: "Budget/BudgetCard",
  component: BudgetCard,
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-md bg-gray-50 dark:bg-gray-950 p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BudgetCard>;

export const UnderBudget: Story = {
  args: {
    progress: mockBudgetProgressUnderLimit,
    onClick: () => console.log("[BudgetCard] Clicked"),
  },
};

export const Exceeded: Story = {
  args: {
    progress: mockBudgetProgressExceeded,
    onClick: () => console.log("[BudgetCard] Clicked"),
  },
};

export const SavingsGoal: Story = {
  args: {
    progress: mockBudgetProgressGoal,
    onClick: () => console.log("[BudgetCard] Clicked"),
  },
};

export const GoalAchieved: Story = {
  args: {
    progress: mockBudgetProgressGoalAchieved,
    onClick: () => console.log("[BudgetCard] Clicked"),
  },
};

// All variants together
export const AllVariants: StoryObj = {
  render: () => (
    <div className="mx-auto max-w-md space-y-4 bg-gray-50 dark:bg-gray-950 p-4">
      <BudgetCard progress={mockBudgetProgressUnderLimit} />
      <BudgetCard progress={mockBudgetProgressExceeded} />
      <BudgetCard progress={mockBudgetProgressGoal} />
      <BudgetCard progress={mockBudgetProgressGoalAchieved} />
    </div>
  ),
};
