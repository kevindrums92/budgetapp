import type { TourConfig } from "../types";

export const categoriesTour: TourConfig = {
  id: "categories",
  startDelay: 500,
  steps: [
    {
      target: "categories-tabs",
      titleKey: "categories.tabs.title",
      descriptionKey: "categories.tabs.description",
      position: "bottom",
      padding: 6,
      borderRadius: 12,
    },
    {
      target: "categories-groups-button",
      titleKey: "categories.groups.title",
      descriptionKey: "categories.groups.description",
      position: "bottom",
      padding: 6,
      borderRadius: 20,
    },
    {
      target: "categories-add-button",
      titleKey: "categories.add.title",
      descriptionKey: "categories.add.description",
      position: "bottom",
      padding: 6,
      borderRadius: 20,
    },
  ],
};
