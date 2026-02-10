import type { TourConfig } from "../types";

export const statsTour: TourConfig = {
  id: "stats",
  startDelay: 600,
  steps: [
    {
      target: "stats-quick-cards",
      titleKey: "stats.quickCards.title",
      descriptionKey: "stats.quickCards.description",
      padding: 8,
      borderRadius: 16,
    },
    {
      target: "stats-donut-chart",
      titleKey: "stats.donutChart.title",
      descriptionKey: "stats.donutChart.description",
      position: "top",
      padding: 8,
      borderRadius: 16,
    },
  ],
};
