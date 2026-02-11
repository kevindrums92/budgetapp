import { Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/hooks/useSubscription";

type Props = {
  remaining: number | null;
};

export default function RateLimitBanner({ remaining }: Props) {
  const { isPro } = useSubscription();
  const { t } = useTranslation("assistant");

  if (isPro) {
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 px-4 py-2 dark:from-yellow-900/20 dark:to-yellow-800/20">
        <div className="flex items-center gap-2">
          <Crown size={16} className="text-yellow-600 dark:text-yellow-400" />
          <span className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
            {t("banner.pro")}
          </span>
        </div>
      </div>
    );
  }

  if (remaining === null) return null;

  const isLow = remaining <= 3;

  return (
    <div
      className={`px-4 py-2 ${isLow ? "bg-red-50 dark:bg-red-900/20" : "bg-gray-100 dark:bg-gray-800"}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-medium ${isLow ? "text-red-700 dark:text-red-400" : "text-gray-600 dark:text-gray-400"}`}
        >
          {t("banner.remaining", { count: remaining })}
        </span>
        {remaining === 0 && (
          <span className="text-xs font-medium text-[#18B7B0] underline">
            {t("banner.upgrade")}
          </span>
        )}
      </div>
    </div>
  );
}
