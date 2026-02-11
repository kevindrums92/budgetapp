import type { Meta, StoryObj } from "@storybook/react-vite";
import AddActionSheet from "./AddActionSheet";

const meta: Meta<typeof AddActionSheet> = {
  title: "BottomSheets/AddActionSheet",
  component: AddActionSheet,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="h-[600px] bg-gray-50 dark:bg-gray-950">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AddActionSheet>;

export const Open: Story = {
  args: {
    open: true,
    onClose: () => console.log("[AddActionSheet] Closed"),
  },
};

export const Closed: Story = {
  args: {
    open: false,
    onClose: () => {},
  },
};
