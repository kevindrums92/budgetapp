import { useState, useCallback } from "react";
import { useBudgetStore } from "@/state/budget.store";

type TourId = "home" | "stats" | "addTransaction" | "batchReview" | "history" | "schedule" | "scheduledBanner" | "categories" | "scheduledPage";

const STORE_KEY_MAP: Record<TourId, { seen: string; setter: string }> = {
  home: { seen: "homeTourSeen", setter: "setHomeTourSeen" },
  stats: { seen: "statsTourSeen", setter: "setStatsTourSeen" },
  addTransaction: { seen: "addTransactionTourSeen", setter: "setAddTransactionTourSeen" },
  batchReview: { seen: "batchReviewTourSeen", setter: "setBatchReviewTourSeen" },
  history: { seen: "historyTourSeen", setter: "setHistoryTourSeen" },
  schedule: { seen: "scheduleTourSeen", setter: "setScheduleTourSeen" },
  scheduledBanner: { seen: "scheduledBannerTourSeen", setter: "setScheduledBannerTourSeen" },
  categories: { seen: "categoriesTourSeen", setter: "setCategoriesTourSeen" },
  scheduledPage: { seen: "scheduledPageTourSeen", setter: "setScheduledPageTourSeen" },
};

export function useSpotlightTour(tourId: TourId) {
  const [isActive, setIsActive] = useState(false);

  const keys = STORE_KEY_MAP[tourId];
  const tourSeen = useBudgetStore((s) => (s as any)[keys.seen] as boolean);
  const setTourSeen = useBudgetStore((s) => (s as any)[keys.setter] as (v: boolean) => void);

  const startTour = useCallback(() => {
    if (!tourSeen) {
      setIsActive(true);
    }
  }, [tourSeen]);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setTourSeen(true);
  }, [setTourSeen]);

  return { isActive, tourSeen, startTour, completeTour };
}
