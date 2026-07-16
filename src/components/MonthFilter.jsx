// MonthFilter: A month input (<input type="month">) that drives the ?month= query param. "Clear" resets back to showing all transactions.

export default function MonthFilter({ value, onChange }) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const showClear = value && value !== currentMonth;

  return (
    <div className="flex items-center gap-3">
      <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft whitespace-nowrap">
        Filter month
      </label>
      <input
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-paper border border-hairline rounded-sm px-2.5 py-1.5 font-mono text-[11px] text-ink focus:outline-none focus:border-ink"
      />
      {showClear && (
        <button
          onClick={() => onChange(currentMonth)}
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft hover:text-expense transition-colors"
        >
          Clear ×
        </button>
      )}
    </div>
  );
}
