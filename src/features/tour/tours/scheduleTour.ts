import type { TourConfig } from "../types";

export const scheduleTour: TourConfig = {
  id: "schedule",
  startDelay: 500,
  steps: [
    {
      target: "schedule-frequency",
      titleKey: "schedule.frequency.title",
      descriptionKey: "schedule.frequency.description",
      position: "bottom",
      padding: 8,
      borderRadius: 16,
    },
    {
      target: "schedule-info",
      titleKey: "schedule.info.title",
      descriptionKey: "schedule.info.description",
      position: "top",
      padding: 8,
      borderRadius: 16,
    },
  ],
};
