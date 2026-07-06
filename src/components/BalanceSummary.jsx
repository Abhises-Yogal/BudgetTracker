import { formatPlainAmount } from "../utils/formatCurrency";

// BalanceSummary
// Reads like the header of a bank statement: a net balance set in serif, with income/expense totals beneath as two ledger columns separated by a hairline. The double rule under the net figure is the one ornament this component spends — everything else stays quiet.

export default function BalanceSummary({ income, expenses }) {
  const net = income - expenses;

  return (
    <section className="bg-surface border border-hairline rounded-sm px-7 py-6 sm:px-9 sm:py-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft mb-2">
        Current balance
      </p>

      <p className="font-serif text-4xl sm:text-5xl text-ink tabular-nums">
        {formatPlainAmount(net)}
        <span className="text-lg text-ink-soft ml-1 align-top">NPR</span>
      </p>

      {/* Signature double rule, ledger-style */}
      <div className="mt-5 mb-6 h-px bg-hairline relative">
        <div className="absolute left-0 right-0 top-[3px] h-px bg-hairline" />
      </div>

      <div className="grid grid-cols-2 divide-x divide-hairline">
        <div className="pr-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-income mb-1.5">
            Income
          </p>
          <p className="font-mono text-xl sm:text-2xl text-ink tabular-nums">
            +{formatPlainAmount(income)}
          </p>
        </div>
        <div className="pl-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-expense mb-1.5">
            Expenses
          </p>
          <p className="font-mono text-xl sm:text-2xl text-ink tabular-nums">
            ({formatPlainAmount(expenses)})
          </p>
        </div>
      </div>
    </section>
  );
}
