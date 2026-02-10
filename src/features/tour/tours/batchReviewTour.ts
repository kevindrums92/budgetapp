import type { TourConfig } from "../types";

export const batchReviewTour: TourConfig = {
  id: "batchReview",
  startDelay: 600,
  steps: [
    {
      target: "batch-review-header",
      titleKey: "batchReview.header.title",
      descriptionKey: "batchReview.header.description",
      position: "bottom",
      padding: 8,
      borderRadius: 16,
    },
    {
      target: "batch-review-cards",
      titleKey: "batchReview.cards.title",
      descriptionKey: "batchReview.cards.description",
      position: "top",
      padding: 6,
      borderRadius: 16,
    },
    {
      target: "batch-review-actions",
      titleKey: "batchReview.actions.title",
      descriptionKey: "batchReview.actions.description",
      position: "top",
      padding: 8,
      borderRadius: 16,
    },
  ],
};
