import type { Meta, StoryObj } from "@storybook/react-vite";
import ProFeatureGate from "./ProFeatureGate";
import { useBudgetStore } from "@/state/budget.store";
import type { SubscriptionState } from "@/types/budget.types";

const mockProSubscription: SubscriptionState = {
  status: "active",
  type: "annual",
  trialEndsAt: null,
  expiresAt: "2027-01-01T00:00:00Z",
  lastChecked: new Date().toISOString(),
};

const meta: Meta<typeof ProFeatureGate> = {
  title: "UI/ProFeatureGate",
  component: ProFeatureGate,
};

export default meta;
type Story = StoryObj<typeof ProFeatureGate>;

const SampleProContent = () => (
  <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
      Contenido Premium
    </h3>
    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
      Este contenido solo es visible para usuarios Pro.
    </p>
  </div>
);

export const Unlocked: Story = {
  args: {
    feature: "stats_page",
    trigger: "stats_page",
    children: <SampleProContent />,
  },
  decorators: [
    (Story) => {
      useBudgetStore.setState({
        subscription: mockProSubscription,
      });
      return <Story />;
    },
  ],
};

export const LockedDefault: Story = {
  args: {
    feature: "stats_page",
    trigger: "stats_page",
    children: <SampleProContent />,
  },
  decorators: [
    (Story) => {
      useBudgetStore.setState({ subscription: null });
      return <Story />;
    },
  ],
};

export const LockedWithFallback: Story = {
  args: {
    feature: "stats_page",
    trigger: "stats_page",
    fallback: (
      <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 p-6 text-center">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          Necesitas Pro para ver las estadísticas avanzadas.
        </p>
      </div>
    ),
    children: <SampleProContent />,
  },
  decorators: [
    (Story) => {
      useBudgetStore.setState({ subscription: null });
      return <Story />;
    },
  ],
};
