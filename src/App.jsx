import React from "react";
import { useState, useMemo, useEffect } from "react";
import BalanceSummary from "./components/BalanceSummary";
import TransactionList from "./components/TransactionList";
import AddTransactionForm from "./components/AddTransactionForm";
import SpendingChart from "./components/SpendingChart";
import { transactions as seedData } from "./data/transactions";
import { formatPlainAmount } from "./utils/formatCurrency";

let nextId = seedData.length + 1;

function App() {
  const [transactions, setTransactions] = useState(seedData);

  // Derived totals only recomputed when transactions change
  const { income, expenses } = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        if (t.type === "income") acc.income += t.amount;
        else acc.expenses += t.amount;
        return acc;
      },
      { income: 0, expenses: 0 }
    );
  }, [transactions]);

  const net = income - expenses;

  // Keep the browser tab title in sync with the live balance
  useEffect(() => {
    const sign = net >= 0 ? "+" : "–";
    document.title = `${sign}${formatPlainAmount(Math.abs(net))} · Budget Tracker`;
  }, [net]);

  function addTransaction(newTx) {
    setTransactions((prev) => [
      { ...newTx, id: nextId++ },
      ...prev,
    ]);
  }

  function deleteTransaction(id) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

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
          <BalanceSummary income={income} expenses={expenses} />
          <AddTransactionForm onAdd={addTransaction} />
          <SpendingChart transactions={transactions} />
          <TransactionList
            transactions={transactions}
            onDelete={deleteTransaction}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
