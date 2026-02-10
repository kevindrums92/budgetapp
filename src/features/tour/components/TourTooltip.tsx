import { useTranslation } from "react-i18next";

type ArrowDirection = "up" | "down";

type Props = {
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  isLast: boolean;
  style: React.CSSProperties;
  arrowDirection: ArrowDirection;
  arrowLeftOffset: number;
};

export default function TourTooltip({
  title,
  description,
  currentStep,
  totalSteps,
  onNext,
  onSkip,
  isLast,
  style,
  arrowDirection,
  arrowLeftOffset,
}: Props) {
  const { t } = useTranslation("tour");

  return (
    <div
      className="absolute z-[96] w-[300px] max-w-[calc(100vw-32px)]"
      style={style}
    >
      {/* Arrow pointing up (tooltip is below target) */}
      {arrowDirection === "up" && (
        <div
          className="absolute -top-2 h-0 w-0 border-x-8 border-b-8 border-x-transparent border-b-white dark:border-b-gray-900"
          style={{ left: `${arrowLeftOffset}px` }}
        />
      )}

      {/* Card */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-2xl">
        {/* Progress dots */}
        <div className="mb-3 flex items-center gap-1.5">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep
                  ? "w-4 bg-[#18B7B0]"
                  : i < currentStep
                    ? "w-1.5 bg-[#18B7B0]/40"
                    : "w-1.5 bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {description}
        </p>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-medium text-gray-400 dark:text-gray-500 active:scale-95 transition-all"
          >
            {t("buttons.skip")}
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-xl bg-[#18B7B0] px-5 py-2.5 text-sm font-medium text-white active:scale-95 transition-all hover:bg-[#159d97]"
          >
            {isLast ? t("buttons.done") : t("buttons.next")}
          </button>
        </div>
      </div>

      {/* Arrow pointing down (tooltip is above target) */}
      {arrowDirection === "down" && (
        <div
          className="absolute -bottom-2 h-0 w-0 border-x-8 border-t-8 border-x-transparent border-t-white dark:border-t-gray-900"
          style={{ left: `${arrowLeftOffset}px` }}
        />
      )}
    </div>
  );
}
