import type { Meta, StoryObj } from "@storybook/react-vite";
import TopHeader from "./TopHeader";
import { useBudgetStore } from "@/state/budget.store";
import type { SubscriptionState } from "@/types/budget.types";

const mockUser = {
  email: null as string | null,
  name: null as string | null,
  avatarUrl: null as string | null,
  provider: null as "google" | "apple" | "guest" | null,
};

const mockProSubscription: SubscriptionState = {
  status: "active",
  type: "annual",
  trialEndsAt: null,
  expiresAt: "2027-01-01T00:00:00Z",
  lastChecked: new Date().toISOString(),
};

const meta: Meta<typeof TopHeader> = {
  title: "Layout/TopHeader",
  component: TopHeader,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof TopHeader>;

export const GuestMode: Story = {
  args: { showMonthSelector: true },
  decorators: [
    (Story) => {
      useBudgetStore.setState({
        user: { ...mockUser },
        cloudMode: "guest",
        cloudStatus: "offline",
        subscription: null,
        selectedMonth: "2026-02",
      });
      return <Story />;
    },
  ],
};

export const CloudSynced: Story = {
  args: { showMonthSelector: true },
  decorators: [
    (Story) => {
      useBudgetStore.setState({
        user: { ...mockUser, email: "user@example.com", provider: "google" },
        cloudMode: "cloud",
        cloudStatus: "ok",
        subscription: null,
        selectedMonth: "2026-02",
      });
      return <Story />;
    },
  ],
};

export const CloudSyncing: Story = {
  args: { showMonthSelector: true },
  decorators: [
    (Story) => {
      useBudgetStore.setState({
        user: { ...mockUser, email: "user@example.com", provider: "google" },
        cloudMode: "cloud",
        cloudStatus: "syncing",
        subscription: null,
        selectedMonth: "2026-02",
      });
      return <Story />;
    },
  ],
};

export const ProUser: Story = {
  args: { showMonthSelector: true },
  decorators: [
    (Story) => {
      useBudgetStore.setState({
        user: {
          ...mockUser,
          email: "pro@example.com",
          name: "Pro User",
          avatarUrl: "https://i.pravatar.cc/150?img=3",
          provider: "google",
        },
        cloudMode: "cloud",
        cloudStatus: "ok",
        subscription: mockProSubscription,
        selectedMonth: "2026-02",
      });
      return <Story />;
    },
  ],
};

export const ProfilePage: Story = {
  args: { showMonthSelector: false, isProfilePage: true },
  decorators: [
    (Story) => {
      useBudgetStore.setState({
        user: { ...mockUser, email: "user@example.com", provider: "google" },
        cloudMode: "cloud",
        cloudStatus: "ok",
        subscription: null,
      });
      return <Story />;
    },
  ],
};
