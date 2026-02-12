type Props = {
  percentage: number;
  isPaidOff?: boolean;
};

export default function DebtProgressBar({ percentage, isPaidOff }: Props) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  const barColor = isPaidOff
    ? "bg-emerald-500"
    : clampedPercentage >= 75
      ? "bg-emerald-500"
      : clampedPercentage >= 50
        ? "bg-amber-500"
        : "bg-gray-400";

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${clampedPercentage}%` }}
      />
    </div>
  );
}
