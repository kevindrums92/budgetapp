import type { TourConfig } from "../types";

export const historyTour: TourConfig = {
  id: "history",
  startDelay: 500,
  steps: [
    {
      target: "history-filters",
      titleKey: "history.filters.title",
      descriptionKey: "history.filters.description",
      position: "bottom",
      padding: 8,
      borderRadius: 16,
    },
    {
      target: "history-sort",
      titleKey: "history.sort.title",
      descriptionKey: "history.sort.description",
      position: "bottom",
      padding: 6,
      borderRadius: 12,
    },
  ],
};
