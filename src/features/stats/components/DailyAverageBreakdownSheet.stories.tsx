import type { Meta, StoryObj } from "@storybook/react-vite";
import DailyAverageBreakdownSheet from "./DailyAverageBreakdownSheet";

const meta: Meta<typeof DailyAverageBreakdownSheet> = {
  title: "BottomSheets/DailyAverageBreakdownSheet",
  component: DailyAverageBreakdownSheet,
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
type Story = StoryObj<typeof DailyAverageBreakdownSheet>;

export const CurrentMonth: Story = {
  args: {
    open: true,
    onClose: () => console.log("[DailyAverageSheet] Closed"),
    totalForAverage: 680000,
    currentDay: 10,
    isCurrentMonth: true,
    dailyAverage: 68000,
    daysInMonth: 28,
    excludedCategoriesCount: 0,
  },
};

export const PastMonth: Story = {
  args: {
    open: true,
    onClose: () => console.log("[DailyAverageSheet] Closed"),
    totalForAverage: 1500000,
    currentDay: 31,
    isCurrentMonth: false,
    dailyAverage: 48387,
    daysInMonth: 31,
    excludedCategoriesCount: 1,
  },
};
