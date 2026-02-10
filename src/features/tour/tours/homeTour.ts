import type { TourConfig } from "../types";

export const homeTour: TourConfig = {
  id: "home",
  startDelay: 800,
  steps: [
    {
      target: "home-fab",
      titleKey: "home.fab.title",
      descriptionKey: "home.fab.description",
      position: "top",
      padding: 10,
      borderRadius: 9999,
    },
    {
      target: "home-batch-entry",
      titleKey: "home.batchEntry.title",
      descriptionKey: "home.batchEntry.description",
      position: "bottom",
      padding: 12,
      borderRadius: 24,
    },
    {
      target: "home-month-selector",
      titleKey: "home.monthSelector.title",
      descriptionKey: "home.monthSelector.description",
      position: "bottom",
      padding: 6,
      borderRadius: 12,
    },
    {
      target: "home-balance-card",
      titleKey: "home.balanceCard.title",
      descriptionKey: "home.balanceCard.description",
      position: "bottom",
      padding: 4,
      borderRadius: 32,
    },
    {
      target: "home-bottom-bar",
      titleKey: "home.bottomBar.title",
      descriptionKey: "home.bottomBar.description",
      position: "top",
      padding: 0,
      borderRadius: 0,
    },
  ],
};
