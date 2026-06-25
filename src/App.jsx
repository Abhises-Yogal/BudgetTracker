import BalanceSummary from "./components/BalanceSummary";
import TransactionList from "./components/TransactionList";
import { transactions, summary } from "./data/transactions";

function App() {
  return (
    <div className="min-h-svh bg-paper px-4 py-10 sm:py-16">
      <main className="max-w-xl mx-auto">
        <header className="mb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft mb-1">
            Statement
          </p>
          <h1 className="font-serif text-2xl text-ink">Budget tracker</h1>
        </header>

        <div className="flex flex-col gap-6">
          <BalanceSummary income={summary.income} expenses={summary.expenses} />
          <TransactionList transactions={transactions} />
        </div>
      </main>
    </div>
  );
}

export default App;
