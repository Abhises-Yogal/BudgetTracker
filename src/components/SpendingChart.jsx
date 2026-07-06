import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Colours assigned per category for visual consistency across renders.
// Expense bars use muted brick tones; income bars use forest green.
const INCOME_FILL = "#2F5D4F";
const EXPENSE_FILL = "#9A3B3B";
const EXPENSE_MUTED = "#C4837F"; // lighter for secondary bars

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, type } = payload[0].payload;
  return (
    <div className="bg-surface border border-hairline px-3 py-2 rounded-sm shadow-sm">
      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft mb-0.5">
        {name}
      </p>
      <p
        className={`font-mono text-sm tabular-nums ${
          type === "income" ? "text-income" : "text-expense"
        }`}
      >
        {type === "income" ? "+" : "("}
        {new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value)}
        {type === "expense" ? ")" : ""}
      </p>
    </div>
  );
}

// SpendingChart
// Aggregates transactions by category and renders a horizontal bar chart. Only expense categories are shown by default - income bars appear too in a muted green so the chart tells the full story without clutter. useMemo keeps the aggregation from re-running on every render.

export default function SpendingChart({ transactions }) {
  const data = useMemo(() => {
    const map = {};
    for (const t of transactions) {
      if (!map[t.category]) {
        map[t.category] = { name: t.category, value: 0, type: t.type };
      }
      map[t.category].value += t.amount;
    }
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (data.length === 0) return null;

  return (
    <section className="bg-surface border border-hairline rounded-sm">
      <div className="px-7 sm:px-9 py-5 border-b border-hairline">
        <h2 className="font-serif text-lg text-ink">By category</h2>
      </div>

      <div className="px-4 sm:px-6 py-6">
        <ResponsiveContainer width="100%" height={data.length * 44 + 16}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 48, bottom: 0, left: 72 }}
            barCategoryGap="30%"
          >
            <XAxis
              type="number"
              tick={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                fill: "#6B6A66",
              }}
              tickFormatter={(v) =>
                new Intl.NumberFormat("en-US", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(v)
              }
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={70}
              tick={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                fill: "#1C1B19",
              }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "#F7F5F0" }}
            />
            <Bar dataKey="value" radius={[0, 2, 2, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.type === "income" ? INCOME_FILL : EXPENSE_FILL}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-4 px-2">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: INCOME_FILL }}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
              Income
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: EXPENSE_FILL }}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
              Expense
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
