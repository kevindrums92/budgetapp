import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Target, TrendingUp, PiggyBank, CheckCircle2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

const SLIDES = [
  {
    icon: Target,
    title: "Bienvenido al Budget",
    description: "Define límites de gasto por categoría y mantén tus finanzas bajo control.",
    color: "#10B981"
  },
  {
    icon: PiggyBank,
    title: "Establece Límites",
    description: "Toca cualquier categoría para definir un límite mensual. Puedes editarlo cuando quieras.",
    color: "#3B82F6"
  },
  {
    icon: TrendingUp,
    title: "Monitorea tu Progreso",
    description: "Las barras de progreso te muestran cuánto has gastado vs. tu límite.",
    color: "#F59E0B"
  },
  {
    icon: CheckCircle2,
    title: "Balance vs Budget",
    description: "El Balance (Home) muestra tu dinero real. El Budget muestra tu plan vs. realidad para controlar gastos.",
    color: "#8B5CF6"
  }
];

export default function BudgetOnboardingWizard({ open, onClose }: Props) {
  // Embla setup
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "center" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Animation state
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sync selected slide
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  // Show/hide animation
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
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
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleNext = () => {
    if (!emblaApi) return;
    if (selectedIndex === SLIDES.length - 1) {
      onClose();
    } else {
      emblaApi.scrollNext();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isVisible) return null;

  const isLastSlide = selectedIndex === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-[85] bg-white transition-opacity duration-300"
      style={{ opacity: isAnimating ? 1 : 0 }}
    >
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6">
        {/* Skip Button */}
        {!isLastSlide && (
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              Saltar
            </button>
          </div>
        )}

        {/* Carousel Container - Centered content */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="w-full h-full overflow-hidden flex items-center" ref={emblaRef}>
            <div className="flex">
              {SLIDES.map((slide, idx) => {
                const Icon = slide.icon;
                return (
                  <div
                    key={idx}
                    className="min-w-0 shrink-0 grow-0 basis-full px-4 text-center"
                  >
                    {/* Icon */}
                    <div
                      className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl"
                      style={{ backgroundColor: `${slide.color}20` }}
                    >
                      <Icon className="h-12 w-12" style={{ color: slide.color }} />
                    </div>

                    {/* Title */}
                    <h2 className="mb-6 text-3xl font-bold text-gray-900">
                      {slide.title}
                    </h2>

                    {/* Description */}
                    <p className="text-lg leading-relaxed text-gray-600">
                      {slide.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom section with dots and button */}
        <div className="pb-12">
          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-8">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => emblaApi?.scrollTo(idx)}
                className="h-2 w-2 rounded-full transition-all"
                style={{
                  backgroundColor: idx === selectedIndex ? "#10B981" : "#D1D5DB",
                  width: idx === selectedIndex ? "32px" : "8px",
                }}
                aria-label={`Ir a slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Next/Done Button */}
          <button
            type="button"
            onClick={handleNext}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-emerald-600 active:scale-[0.98]"
          >
            {isLastSlide ? "¡Entendido!" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}
