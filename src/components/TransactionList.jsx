import TransactionItem from "./TransactionItem";

/**
 * TransactionList
 * A bordered card matching BalanceSummary's surface, with rows divided
 * by hairlines rather than separate cards — so the list reads as one
 * continuous statement rather than a stack of tiles.
 */
export default function TransactionList({ transactions }) {
  return (
    <section className="bg-surface border border-hairline rounded-sm">
      <div className="px-7 sm:px-9 py-5 border-b border-hairline">
        <h2 className="font-serif text-lg text-ink">Recent transactions</h2>
      </div>

      {transactions.length === 0 ? (
        <p className="px-7 sm:px-9 py-8 text-sm text-ink-soft">
          No transactions yet. Anything you add will show up here.
        </p>
      ) : (
        <ul className="divide-y divide-hairline">
          {transactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))}
        </ul>
      )}
    </section>
  );
}
