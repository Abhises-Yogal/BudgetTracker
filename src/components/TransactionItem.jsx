import { formatLedgerAmount } from "../utils/formatCurrency";

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export default function TransactionItem({ transaction, onDelete }) {
  const { id, _id, description, category, date, type, amount } = transaction;
  const txId     = id ?? _id; // Mongoose returns _id; toJSON virtual maps it to id
  const isIncome = type === "income";

  return (
    <li className="group flex items-center justify-between gap-4 py-4 px-7 sm:px-9">
      <div className="min-w-0">
        <p className="text-[15px] text-ink truncate">{description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`font-mono text-[10px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-sm ${
            isIncome ? "bg-income-soft text-income" : "bg-expense-soft text-expense"}`}>
            {category}
          </span>
          <span className="font-mono text-[11px] text-ink-soft">
            {dateFmt.format(new Date(date))}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <p className={`font-mono text-base sm:text-lg tabular-nums whitespace-nowrap ${
          isIncome ? "text-income" : "text-expense"}`}>
          {formatLedgerAmount(amount, type)}
        </p>
        <button
          onClick={() => onDelete(txId)}
          aria-label={`Delete "${description}"`}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity font-mono text-[15px] text-ink-soft hover:text-expense leading-none">
          ×
        </button>
      </div>
    </li>
  );
}
