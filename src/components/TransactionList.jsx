import TransactionItem from "./TransactionItem";

function SkeletonRow() {
  return (
    <li className="flex items-center justify-between gap-4 py-4 px-7 sm:px-9 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-3/5 bg-hairline rounded" />
        <div className="h-2.5 w-1/4 bg-hairline rounded" />
      </div>
      <div className="h-4 w-16 bg-hairline rounded" />
    </li>
  );
}

export default function TransactionList({ transactions, onDelete, loading }) {
  return (
    <section className="bg-surface border border-hairline rounded-sm">
      <div className="px-7 sm:px-9 py-5 border-b border-hairline">
        <h2 className="font-serif text-lg text-ink">Recent transactions</h2>
      </div>

      {loading ? (
        <ul className="divide-y divide-hairline">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </ul>
      ) : transactions.length === 0 ? (
        <p className="px-7 sm:px-9 py-8 text-sm text-ink-soft">
          No transactions found add one above or clear the month filter.
        </p>
      ) : (
        <ul className="divide-y divide-hairline">
          {transactions.map((t) => (
            <TransactionItem key={t.id ?? t._id} transaction={t} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </section>
  );
}
