import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import { icons, PieChart as PieChartIcon, BarChart3, TrendingUp } from "lucide-react";
import { useBudgetStore } from "@/state/budget.store";
import { monthLabelES } from "@/services/dates.service";
import { formatCOP } from "@/features/transactions/transactions.utils";

// Convert kebab-case to PascalCase for lucide-react icons
function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

// Get last N months as YYYY-MM strings
function getLastMonths(count: number): string[] {
  const months: string[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${yyyy}-${mm}`);
  }

  return months;
}

// Short month label (e.g., "Ene", "Feb")
function shortMonthLabel(monthKey: string): string {
  const [yStr, mStr] = monthKey.split("-");
  const date = new Date(Number(yStr), Number(mStr) - 1, 1);
  return new Intl.DateTimeFormat("es-CO", { month: "short" })
    .format(date)
    .replace(".", "")
    .replace(/^\w/, (c) => c.toUpperCase());
}

type CategoryChartItem = {
  id: string;
  name: string;
  value: number;
  color: string;
  icon: string;
};

type MonthlyData = {
  month: string;
  label: string;
  income: number;
  expense: number;
};

type TrendData = {
  month: string;
  label: string;
  expense: number;
};

export default function StatsPage() {
  const navigate = useNavigate();
  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);

  // Donut chart data (expenses by category for selected month)
  const categoryChartData = useMemo<CategoryChartItem[]>(() => {
    const expenses = transactions.filter(
      (t) => t.type === "expense" && t.date.slice(0, 7) === selectedMonth
    );

    const byCategory: Record<string, number> = {};
    for (const t of expenses) {
      byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
    }

    return Object.entries(byCategory)
      .map(([categoryId, value]) => {
        const cat = categoryDefinitions.find((c) => c.id === categoryId);
        return {
          id: categoryId,
          name: cat?.name ?? categoryId,
          value,
          color: cat?.color ?? "#9CA3AF",
          icon: cat?.icon ?? "tag",
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categoryDefinitions, selectedMonth]);

  const totalExpenses = useMemo(
    () => categoryChartData.reduce((sum, d) => sum + d.value, 0),
    [categoryChartData]
  );

  // Bar chart data (income vs expenses for last 6 months)
  const monthlyData = useMemo<MonthlyData[]>(() => {
    const months = getLastMonths(6);

    return months.map((monthKey) => {
      let income = 0;
      let expense = 0;

      for (const t of transactions) {
        if (t.date.slice(0, 7) !== monthKey) continue;
        if (t.type === "income") income += t.amount;
        else expense += t.amount;
      }

      return {
        month: monthKey,
        label: shortMonthLabel(monthKey),
        income,
        expense,
      };
    });
  }, [transactions]);

  const hasMonthlyData = monthlyData.some((d) => d.income > 0 || d.expense > 0);

  // Trend chart data (expenses for last 12 months)
  const trendData = useMemo<TrendData[]>(() => {
    const months = getLastMonths(12);

    return months.map((monthKey) => {
      let expense = 0;

      for (const t of transactions) {
        if (t.date.slice(0, 7) !== monthKey) continue;
        if (t.type === "expense") expense += t.amount;
      }

      return {
        month: monthKey,
        label: shortMonthLabel(monthKey),
        expense,
      };
    });
  }, [transactions]);

  const hasTrendData = trendData.some((d) => d.expense > 0);

  // Quick stats for selected month
  const quickStats = useMemo(() => {
    const currentMonthExpenses = transactions.filter(
      (t) => t.type === "expense" && t.date.slice(0, 7) === selectedMonth
    );

    // Total expenses this month
    const totalExpensesCurrent = currentMonthExpenses.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    // Days in current month
    const [year, month] = selectedMonth.split("-");
    const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

    // Daily average (total spent / days in month)
    const dailyAverage = totalExpensesCurrent / daysInMonth;

    // Total monthly budget (sum of all category limits)
    const totalBudget = categoryDefinitions
      .filter((c) => c.type === "expense" && c.monthlyLimit)
      .reduce((sum, c) => sum + (c.monthlyLimit ?? 0), 0);

    // Days remaining in month
    const today = new Date();
    const isCurrentMonth = selectedMonth === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const currentDay = isCurrentMonth ? today.getDate() : daysInMonth;
    const daysRemaining = daysInMonth - currentDay;

    // Budget remaining
    const budgetRemaining = totalBudget - totalExpensesCurrent;
    const dailyBudget = daysRemaining > 0 ? budgetRemaining / daysRemaining : 0;

    // Top category
    const byCategory: Record<string, number> = {};
    for (const t of currentMonthExpenses) {
      byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
    }
    const topCategoryId = Object.entries(byCategory).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];
    const topCategory = categoryDefinitions.find((c) => c.id === topCategoryId);

    // Day of week with most expenses
    const byDayOfWeek: Record<number, number> = {};
    for (const t of currentMonthExpenses) {
      const date = new Date(t.date);
      const dayOfWeek = date.getDay();
      byDayOfWeek[dayOfWeek] = (byDayOfWeek[dayOfWeek] ?? 0) + t.amount;
    }
    const topDayOfWeek = Object.entries(byDayOfWeek).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];
    const dayNames = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const topDayName = topDayOfWeek !== undefined ? dayNames[Number(topDayOfWeek)] : null;

    // Previous month comparison
    const [yearNum, monthNum] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(yearNum, monthNum - 2, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(
      prevDate.getMonth() + 1
    ).padStart(2, "0")}`;

    const prevMonthExpenses = transactions
      .filter((t) => t.type === "expense" && t.date.slice(0, 7) === prevMonth)
      .reduce((sum, t) => sum + t.amount, 0);

    const monthDiff = totalExpensesCurrent - prevMonthExpenses;
    const monthDiffPercent =
      prevMonthExpenses > 0 ? (monthDiff / prevMonthExpenses) * 100 : 0;

    return {
      dailyAverage,
      topCategory,
      topDayName,
      monthDiff,
      monthDiffPercent,
      hasData: currentMonthExpenses.length > 0,
      totalBudget,
      budgetRemaining,
      dailyBudget,
      daysRemaining,
      isCurrentMonth,
    };
  }, [transactions, selectedMonth, categoryDefinitions]);

  return (
    <div className="mx-auto max-w-xl px-4 pt-6 pb-28">
      {/* Header */}
      <h2 className="text-base font-semibold">Estadísticas</h2>
      <p className="text-sm text-gray-500">{monthLabelES(selectedMonth)}</p>

      {/* Daily Budget Banner - Only for current month with budget */}
      {quickStats.isCurrentMonth &&
        quickStats.totalBudget > 0 &&
        quickStats.daysRemaining > 0 && (
          <div className="mt-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white shadow-lg">
            <p className="text-sm">
              Tu presupuesto para los próximos{" "}
              <span className="font-bold">{quickStats.daysRemaining} días</span> es{" "}
              <span className="text-lg font-bold">
                {formatCOP(quickStats.dailyBudget)}
              </span>{" "}
              por día. ¡Gasta sabiamente!
            </p>
          </div>
        )}

      {/* Quick Stats */}
      {quickStats.hasData && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* Daily Average */}
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">Promedio de Gasto Diario</p>
            <p className="mt-1 text-lg font-semibold">
              {formatCOP(quickStats.dailyAverage)}
            </p>
          </div>

          {/* Top Category */}
          {quickStats.topCategory && (
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Categoría Top</p>
              <div className="mt-1 flex items-center gap-2">
                {(() => {
                  const IconComponent =
                    icons[
                      kebabToPascal(quickStats.topCategory.icon) as keyof typeof icons
                    ];
                  return (
                    IconComponent && (
                      <IconComponent
                        className="h-4 w-4"
                        style={{ color: quickStats.topCategory.color }}
                      />
                    )
                  );
                })()}
                <span className="text-sm font-medium">
                  {quickStats.topCategory.name}
                </span>
              </div>
            </div>
          )}

          {/* Top Day of Week */}
          {quickStats.topDayName && (
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Día que más gastas</p>
              <p className="mt-1 text-sm font-medium">{quickStats.topDayName}</p>
            </div>
          )}

          {/* Month Comparison */}
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">vs Mes Anterior</p>
            <div className="mt-1 flex items-center gap-1">
              {quickStats.monthDiff > 0 ? (
                <icons.TrendingUp className="h-4 w-4 text-red-500" />
              ) : quickStats.monthDiff < 0 ? (
                <icons.TrendingDown className="h-4 w-4 text-emerald-500" />
              ) : (
                <icons.Minus className="h-4 w-4 text-gray-400" />
              )}
              <span
                className={`text-sm font-medium ${
                  quickStats.monthDiff > 0
                    ? "text-red-600"
                    : quickStats.monthDiff < 0
                    ? "text-emerald-600"
                    : "text-gray-600"
                }`}
              >
                {quickStats.monthDiff > 0 ? "+" : ""}
                {quickStats.monthDiffPercent.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Donut Chart Section */}
      <div className="mt-6">
        <h3 className="mb-4 text-sm font-medium text-gray-700">
          Gastos por Categoría
        </h3>

        {categoryChartData.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <PieChartIcon className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>No hay gastos este mes</p>
          </div>
        ) : (
          <>
            {/* Donut Chart */}
            <div className="relative">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center label */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">
                  {formatCOP(totalExpenses)}
                </span>
                <span className="text-sm text-gray-500">gastado</span>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 space-y-2">
              {categoryChartData.map((item) => {
                const IconComponent =
                  icons[kebabToPascal(item.icon) as keyof typeof icons];

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(`/category/${item.id}/month/${selectedMonth}`)}
                    className="w-full flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {IconComponent && (
                        <IconComponent
                          className="h-4 w-4"
                          style={{ color: item.color }}
                        />
                      )}
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCOP(item.value)}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Bar Chart Section */}
      <div className="mt-8">
        <h3 className="mb-4 text-sm font-medium text-gray-700">
          Ingresos vs Gastos
        </h3>

        {!hasMonthlyData ? (
          <div className="py-12 text-center text-gray-500">
            <BarChart3 className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>No hay datos en los últimos 6 meses</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barGap={2}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => formatCOP(Number(value))}
                  labelFormatter={(label) => String(label)}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="income"
                  name="Ingresos"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  name="Gastos"
                  fill="#EF4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-4 flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-gray-600">Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600">Gastos</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Trend Chart Section */}
      <div className="mt-8">
        <h3 className="mb-4 text-sm font-medium text-gray-700">
          Tendencia de Gastos
        </h3>

        {!hasTrendData ? (
          <div className="py-12 text-center text-gray-500">
            <TrendingUp className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>No hay datos de gastos</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#6B7280" }}
                interval={1}
              />
              <YAxis hide />
              <Tooltip
                formatter={(value) => formatCOP(Number(value))}
                labelFormatter={(label) => String(label)}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="Gastos"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: "#EF4444", strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: "#EF4444" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
