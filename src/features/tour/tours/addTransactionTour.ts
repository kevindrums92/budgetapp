import type { TourConfig } from "../types";

export const addTransactionTour: TourConfig = {
  id: "addTransaction",
  startDelay: 500,
  steps: [
    {
      target: "add-amount-input",
      titleKey: "addTransaction.amountInput.title",
      descriptionKey: "addTransaction.amountInput.description",
      position: "bottom",
      padding: 8,
      borderRadius: 16,
    },
    {
      target: "add-category-picker",
      titleKey: "addTransaction.categoryPicker.title",
      descriptionKey: "addTransaction.categoryPicker.description",
      position: "bottom",
      padding: 6,
      borderRadius: 16,
    },
    {
      target: "add-schedule",
      titleKey: "addTransaction.schedule.title",
      descriptionKey: "addTransaction.schedule.description",
      position: "top",
      padding: 6,
      borderRadius: 12,
    },
  ],
};
