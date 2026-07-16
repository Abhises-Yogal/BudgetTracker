// Renders a horizontal Recharts BarChart using the byCategory[] array returned directly from GET /api/transactions/summary - no local aggregation. The chart height scales with the number of categories.

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

const INCOME_COLOR  = "#2F5D4F";
const EXPENSE_COLOR = "#9A3B3B";

const numFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});
const compactFmt = new Intl.NumberFormat("en-US", {
  notation: "compact", maximumFractionDigits: 1,
});

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { category, total, type } = payload[0].payload;
  const isIncome = type === "income";
  return (
    <div className="bg-surface border border-hairline px-3 py-2 rounded-sm shadow-sm">
      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft mb-0.5">{category}</p>
      <p className={`font-mono text-sm tabular-nums ${isIncome ? "text-income" : "text-expense"}`}>
        {isIncome ? "+" : "("}{numFmt.format(total)}{isIncome ? "" : ")"}
      </p>
    </div>
  );
}

export default function SpendingChart({ byCategory = [], loading }) {
  if (loading) {
    return (
      <section className="bg-surface border border-hairline rounded-sm">
        <div className="px-7 sm:px-9 py-5 border-b border-hairline">
          <div className="h-5 w-32 bg-hairline rounded animate-pulse" />
        </div>
        <div className="px-6 py-8">
          <div className="space-y-3">
            {[80, 60, 45, 30].map((w) => (
              <div key={w} className="h-6 bg-hairline rounded animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!byCategory.length) return null;

  return (
    <section className="bg-surface border border-hairline rounded-sm">
      <div className="px-7 sm:px-9 py-5 border-b border-hairline">
        <h2 className="font-serif text-lg text-ink">By category</h2>
      </div>

      <div className="px-4 sm:px-6 py-6">
        <ResponsiveContainer width="100%" height={byCategory.length * 44 + 16}>
          <BarChart data={byCategory} layout="vertical"
            margin={{ top: 0, right: 52, bottom: 0, left: 80 }} barCategoryGap="30%">
            <XAxis type="number"
              tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fill: "#6B6A66" }}
              tickFormatter={(v) => compactFmt.format(v)}
              axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="category" width={78}
              tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fill: "#1C1B19" }}
              axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F7F5F0" }} />
            <Bar dataKey="total" radius={[0, 2, 2, 0]}>
              {byCategory.map((entry) => (
                <Cell key={entry.category}
                  fill={entry.type === "income" ? INCOME_COLOR : EXPENSE_COLOR} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="flex items-center gap-5 mt-4 px-2">
          {[["Income", INCOME_COLOR], ["Expense", EXPENSE_COLOR]].map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
