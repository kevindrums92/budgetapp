import type { TourConfig } from "../types";

export const scheduledPageTour: TourConfig = {
  id: "scheduledPage",
  startDelay: 500,
  steps: [
    {
      target: "scheduled-info-banner",
      titleKey: "scheduledPage.info.title",
      descriptionKey: "scheduledPage.info.description",
      position: "bottom",
      padding: 6,
      borderRadius: 12,
    },
    {
      target: "scheduled-fab",
      titleKey: "scheduledPage.fab.title",
      descriptionKey: "scheduledPage.fab.description",
      position: "top",
      padding: 6,
      borderRadius: 28,
    },
  ],
};
