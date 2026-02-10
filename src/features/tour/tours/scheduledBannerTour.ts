import type { TourConfig } from "../types";

export const scheduledBannerTour: TourConfig = {
  id: "scheduledBanner",
  startDelay: 600,
  steps: [
    {
      target: "home-scheduled-banner",
      titleKey: "scheduledBanner.banner.title",
      descriptionKey: "scheduledBanner.banner.description",
      position: "bottom",
      padding: 6,
      borderRadius: 16,
    },
    {
      target: "home-projection-toggle",
      titleKey: "scheduledBanner.projection.title",
      descriptionKey: "scheduledBanner.projection.description",
      position: "bottom",
      padding: 6,
      borderRadius: 12,
    },
  ],
};
