import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { TrendingUp, Info, Wallet, BarChart3, CalendarClock, LineChart, Palette } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { useCurrency } from "@/features/currency";
import {
  projectFutureBalance,
  calculateWeightedAverage,
  getBalanceZone,
  getHistoryMonths,
} from "../services/forecasting.service";

type Props = {
  days?: number;
};

export default function FutureBalanceChart({ days = 90 }: Props) {
  const { t } = useTranslation("forecasting");
  const { formatAmount } = useCurrency();
  const transactions = useBudgetStore((s) => s.transactions);
  const [showInfo, setShowInfo] = useState(false);

  const historyMonths = useMemo(
    () => getHistoryMonths(transactions),
    [transactions]
  );

  const projections = useMemo(
    () => projectFutureBalance(transactions, days),
    [transactions, days]
  );

  const avgIncome = useMemo(
    () => calculateWeightedAverage(transactions, "income", 3),
    [transactions]
  );

  const chartData = useMemo(() => {
    return projections.map((p) => ({
      ...p,
      label:
        p.dayOffset === 0
          ? t("futureBalance.today")
          : `${p.dayOffset}d`,
      zone: getBalanceZone(p.balance, avgIncome),
    }));
  }, [projections, avgIncome, t]);

  // Not enough data
  if (historyMonths < 1) {
    return (
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-sm">
        <div className="text-center">
          <TrendingUp
            size={48}
            className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("futureBalance.notEnoughData")}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {t("futureBalance.needsMonths")}
          </p>
        </div>
      </div>
    );
  }

  const lastProjection = projections[projections.length - 1];
  const lastZone = lastProjection
    ? getBalanceZone(lastProjection.balance, avgIncome)
    : "green";

  const gradientColor =
    lastZone === "red"
      ? "#EF4444"
      : lastZone === "yellow"
        ? "#EAB308"
        : "#10B981";

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            {t("futureBalance.title")}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t("futureBalance.subtitle", { days })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowInfo(true)}
          className="rounded-full p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95"
          aria-label={t("futureBalance.info.title")}
        >
          <Info size={18} className="text-gray-400 dark:text-gray-500" />
        </button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={gradientColor} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => {
              if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
              if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
              return String(v);
            }}
            width={45}
          />
          <Tooltip
            formatter={(value) => [formatAmount(Number(value)), t("futureBalance.projected", { days: "" })]}
            labelStyle={{ fontSize: 12, color: "#6B7280" }}
            contentStyle={{
              borderRadius: 12,
              border: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              fontSize: 13,
            }}
          />
          <ReferenceLine
            y={0}
            stroke="#EF4444"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke={gradientColor}
            strokeWidth={2.5}
            fill="url(#balanceGradient)"
            dot={{
              r: 4,
              fill: "#fff",
              stroke: gradientColor,
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              fill: gradientColor,
              stroke: "#fff",
              strokeWidth: 2,
            }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Projected value */}
      {lastProjection && (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {t("futureBalance.projected", { days })}
            </span>
            <span
              className={`text-sm font-semibold ${
                lastProjection.balance >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatAmount(lastProjection.balance)}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
            {t("futureBalance.disclaimer")}
          </p>
        </div>
      )}

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowInfo(false)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t("futureBalance.info.title")}
            </h3>

            <div className="space-y-4">
              {/* Current Balance */}
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Wallet size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    {t("futureBalance.info.currentBalance")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("futureBalance.info.currentBalanceDesc")}
                  </p>
                </div>
              </div>

              {/* Weighted Averages */}
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <BarChart3 size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    {t("futureBalance.info.weightedAverage")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("futureBalance.info.weightedAverageDesc")}
                  </p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 italic">
                    {t("futureBalance.info.weights")}
                  </p>
                </div>
              </div>

              {/* Scheduled Transactions */}
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <CalendarClock size={16} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    {t("futureBalance.info.scheduled")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("futureBalance.info.scheduledDesc")}
                  </p>
                </div>
              </div>

              {/* Projection */}
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <LineChart size={16} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    {t("futureBalance.info.projection")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("futureBalance.info.projectionDesc")}
                  </p>
                </div>
              </div>

              {/* Colors */}
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Palette size={16} className="text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    {t("futureBalance.info.colors")}
                  </p>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("futureBalance.info.colorGreen")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("futureBalance.info.colorYellow")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("futureBalance.info.colorRed")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInfo(false)}
              className="mt-6 w-full rounded-xl bg-gray-900 dark:bg-gray-100 py-3 text-sm font-medium text-white dark:text-gray-900 transition-colors hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-[0.98]"
            >
              {t("futureBalance.info.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
