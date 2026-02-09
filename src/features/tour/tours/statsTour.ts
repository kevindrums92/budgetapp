import type { TourConfig } from "../types";

export const statsTour: TourConfig = {
  id: "stats",
  startDelay: 600,
  steps: [
    {
      target: "stats-donut-chart",
      titleKey: "stats.donutChart.title",
      descriptionKey: "stats.donutChart.description",
      position: "bottom",
      padding: 8,
      borderRadius: 16,
    },
    {
      target: "stats-quick-cards",
      titleKey: "stats.quickCards.title",
      descriptionKey: "stats.quickCards.description",
      position: "bottom",
      padding: 8,
      borderRadius: 16,
    },
  ],
};
