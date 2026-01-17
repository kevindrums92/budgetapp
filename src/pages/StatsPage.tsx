import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { icons, PieChart as PieChartIcon } from "lucide-react";
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

type ChartDataItem = {
  name: string;
  value: number;
  color: string;
  icon: string;
};

export default function StatsPage() {
  const transactions = useBudgetStore((s) => s.transactions);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);

  const chartData = useMemo<ChartDataItem[]>(() => {
    // Filter only expenses for selected month
    const expenses = transactions.filter(
      (t) => t.type === "expense" && t.date.slice(0, 7) === selectedMonth
    );

    // Group by category
    const byCategory: Record<string, number> = {};
    for (const t of expenses) {
      byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
    }

    // Convert to Recharts format with category metadata
    return Object.entries(byCategory)
      .map(([categoryId, value]) => {
        const cat = categoryDefinitions.find((c) => c.id === categoryId);
        return {
          name: cat?.name ?? categoryId,
          value,
          color: cat?.color ?? "#9CA3AF",
          icon: cat?.icon ?? "tag",
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categoryDefinitions, selectedMonth]);

  const totalExpenses = useMemo(
    () => chartData.reduce((sum, d) => sum + d.value, 0),
    [chartData]
  );

  return (
    <div className="mx-auto max-w-xl px-4 pt-6 pb-28">
      {/* Header */}
      <h2 className="text-base font-semibold">Estadísticas</h2>
      <p className="text-sm text-gray-500">{monthLabelES(selectedMonth)}</p>

      {/* Chart Section */}
      <div className="mt-6">
        <h3 className="mb-4 text-sm font-medium text-gray-700">
          Gastos por Categoría
        </h3>

        {chartData.length === 0 ? (
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
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
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
            <ul className="mt-4 space-y-2">
              {chartData.map((item) => {
                const IconComponent =
                  icons[kebabToPascal(item.icon) as keyof typeof icons];

                return (
                  <li
                    key={item.name}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm"
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
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
