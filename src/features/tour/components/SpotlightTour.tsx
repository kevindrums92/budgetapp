import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { TourConfig } from "../types";
import TourTooltip from "./TourTooltip";

type Props = {
  config: TourConfig;
  isActive: boolean;
  onComplete: () => void;
};

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const DEFAULT_PADDING = 8;
const DEFAULT_BORDER_RADIUS = 16;
const DEFAULT_START_DELAY = 800;
const TOOLTIP_GAP = 16;
const TOOLTIP_WIDTH = 300;

export default function SpotlightTour({ config, isActive, onComplete }: Props) {
  const { t } = useTranslation("tour");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [fadeIn, setFadeIn] = useState(false);
  const animFrameRef = useRef<number>(0);

  const step = config.steps[currentStepIndex];
  const isLast = currentStepIndex === config.steps.length - 1;

  // Calculate spotlight rect for current step target
  const calculateRect = useCallback(() => {
    if (!step) return null;

    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) return null;

    const rect = el.getBoundingClientRect();
    const padding = step.padding ?? DEFAULT_PADDING;

    return {
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    };
  }, [step]);

  // Scroll target into view and update rect
  const focusTarget = useCallback(() => {
    if (!step) return;

    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) {
      // Element not found, skip to next step
      if (currentStepIndex < config.steps.length - 1) {
        setCurrentStepIndex((i) => i + 1);
      } else {
        onComplete();
      }
      return;
    }

    // Scroll into view if needed
    const rect = el.getBoundingClientRect();
    const isVisible =
      rect.top >= 0 &&
      rect.bottom <= window.innerHeight;

    if (!isVisible) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Wait for scroll to finish before calculating rect
      setTimeout(() => {
        setSpotlightRect(calculateRect());
      }, 400);
    } else {
      setSpotlightRect(calculateRect());
    }
  }, [step, currentStepIndex, config.steps.length, onComplete, calculateRect]);

  // Start tour with delay
  useEffect(() => {
    if (!isActive) {
      setReady(false);
      setFadeIn(false);
      setCurrentStepIndex(0);
      setSpotlightRect(null);
      return;
    }

    const delay = config.startDelay ?? DEFAULT_START_DELAY;
    const timer = setTimeout(() => {
      setReady(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isActive, config.startDelay]);

  // Focus target when ready or step changes
  useEffect(() => {
    if (ready) {
      focusTarget();
      // Small delay then fade in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFadeIn(true);
        });
      });
    }
  }, [ready, currentStepIndex, focusTarget]);

  // Recalculate on resize
  useEffect(() => {
    if (!ready) return;

    const handleResize = () => {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(() => {
        setSpotlightRect(calculateRect());
      });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [ready, calculateRect]);

  // Lock body scroll
  useEffect(() => {
    if (isActive && ready) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isActive, ready]);

  const handleNext = useCallback(() => {
    if (isLast) {
      setFadeIn(false);
      setTimeout(() => onComplete(), 200);
    } else {
      setFadeIn(false);
      setTimeout(() => {
        setSpotlightRect(null); // Clear to prevent flash at wrong position
        setCurrentStepIndex((i) => i + 1);
        // fadeIn will be set again in the focusTarget effect
      }, 150);
    }
  }, [isLast, onComplete]);

  const handleSkip = useCallback(() => {
    setFadeIn(false);
    setTimeout(() => onComplete(), 200);
  }, [onComplete]);

  if (!isActive || !ready) return null;

  // Calculate tooltip position only when spotlightRect is available
  let tooltipPosition: "top" | "bottom" = "bottom";
  let tooltipStyle: React.CSSProperties = {};
  let arrowLeftOffset = TOOLTIP_WIDTH / 2;
  let borderRadius = DEFAULT_BORDER_RADIUS;

  if (spotlightRect && step) {
    borderRadius = step.borderRadius ?? DEFAULT_BORDER_RADIUS;
    const spaceBelow = window.innerHeight - (spotlightRect.top + spotlightRect.height);
    const spaceAbove = spotlightRect.top;
    const preferredPosition = step.position ?? "auto";

    // Estimated tooltip height (dots + title + desc + buttons + padding)
    const EST_TOOLTIP_H = 180;
    const MIN_TOP = 16;

    if (preferredPosition === "auto") {
      if (spaceBelow >= 220) {
        tooltipPosition = "bottom";
      } else if (spaceAbove >= EST_TOOLTIP_H + TOOLTIP_GAP + MIN_TOP) {
        tooltipPosition = "top";
      } else {
        tooltipPosition = spaceBelow >= spaceAbove ? "bottom" : "top";
      }
    } else {
      tooltipPosition = preferredPosition;
    }

    // Tooltip left: centered on spotlight, clamped to viewport
    const spotlightCenterX = spotlightRect.left + spotlightRect.width / 2;
    let tooltipLeft = spotlightCenterX - TOOLTIP_WIDTH / 2;
    tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - TOOLTIP_WIDTH - 16));

    // Tooltip vertical position
    let tooltipTop: number;
    if (tooltipPosition === "bottom") {
      tooltipTop = spotlightRect.top + spotlightRect.height + TOOLTIP_GAP;
    } else {
      tooltipTop = spotlightRect.top - TOOLTIP_GAP - EST_TOOLTIP_H;
      tooltipTop = Math.max(MIN_TOP, tooltipTop);
    }

    arrowLeftOffset = Math.max(20, Math.min(spotlightCenterX - tooltipLeft, TOOLTIP_WIDTH - 20));
    tooltipStyle = { top: `${tooltipTop}px`, left: `${tooltipLeft}px` };
  }

  return (
    <div
      className={`fixed inset-0 z-[95] transition-opacity duration-200 ${
        fadeIn ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Clickable backdrop (outside spotlight) to skip */}
      <div
        className="absolute inset-0"
        onClick={handleSkip}
        aria-hidden="true"
      />

      {/* Spotlight + Tooltip only render when rect is calculated (prevents position flash) */}
      {spotlightRect && step && (
        <>
          {/* Spotlight hole via box-shadow */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: `${spotlightRect.top}px`,
              left: `${spotlightRect.left}px`,
              width: `${spotlightRect.width}px`,
              height: `${spotlightRect.height}px`,
              borderRadius: `${borderRadius}px`,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75)",
              transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />

          {/* Tooltip */}
          <TourTooltip
            title={t(step.titleKey)}
            description={t(step.descriptionKey)}
            currentStep={currentStepIndex}
            totalSteps={config.steps.length}
            onNext={handleNext}
            onSkip={handleSkip}
            isLast={isLast}
            style={tooltipStyle}
            arrowDirection={tooltipPosition === "bottom" ? "up" : "down"}
            arrowLeftOffset={arrowLeftOffset}
          />
        </>
      )}
    </div>
  );
}
