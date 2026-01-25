/**
 * BudgetOnboardingWizard
 * Wizard de bienvenida para el módulo de presupuestos
 * Usa el patrón moderno del onboarding general
 */

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Screen1_Welcome from "./onboarding/Screen1_Welcome";
import Screen2_FlexiblePeriods from "./onboarding/Screen2_FlexiblePeriods";
import Screen3_RecurringBudgets from "./onboarding/Screen3_RecurringBudgets";
import Screen4_VisualTracking from "./onboarding/Screen4_VisualTracking";

type Props = {
  open: boolean;
  onClose: () => void;
};

const SCREENS = [
  Screen1_Welcome,
  Screen2_FlexiblePeriods,
  Screen3_RecurringBudgets,
  Screen4_VisualTracking,
];

export default function BudgetOnboardingWizard({ open, onClose }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Sync selected slide
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Show/hide animation
  useEffect(() => {
    if (open) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!isVisible) return null;

  const handleNext = () => {
    if (!emblaApi) return;
    if (selectedIndex === SCREENS.length - 1) {
      onClose();
    } else {
      emblaApi.scrollNext();
    }
  };

  const handleBack = () => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
  };

  const handleSkip = () => {
    onClose();
  };

  const isFirstSlide = selectedIndex === 0;
  const isLastSlide = selectedIndex === SCREENS.length - 1;

  return (
    <div className="fixed inset-0 z-[85] bg-gray-50 dark:bg-gray-950">
      <div className="flex min-h-dvh flex-col overflow-hidden" ref={emblaRef}>
        <div className="flex h-full touch-pan-y">
          {SCREENS.map((ScreenComponent, idx) => (
            <div
              key={idx}
              className="min-w-0 shrink-0 grow-0 basis-full h-full"
              style={{ flex: "0 0 100%" }}
            >
              <ScreenComponent
                onNext={handleNext}
                onBack={handleBack}
                onSkip={handleSkip}
                showBack={!isFirstSlide}
                showSkip={!isLastSlide}
                isLast={isLastSlide}
                currentStep={idx + 1}
                totalSteps={SCREENS.length}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
