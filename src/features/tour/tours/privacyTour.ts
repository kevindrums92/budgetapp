import type { TourConfig } from "../types";

export const privacyTour: TourConfig = {
  id: "privacy",
  startDelay: 600,
  steps: [
    {
      target: "home-privacy-toggle",
      titleKey: "privacy.toggle.title",
      descriptionKey: "privacy.toggle.description",
      position: "bottom",
      padding: 8,
      borderRadius: 9999,
    },
  ],
};
