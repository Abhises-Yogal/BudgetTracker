// Orchestrates all data fetching via the Axios service layer.
//  Two parallel fetches on mount (and on month change):
//   - fetchTransactions(month) → transaction list
//   - fetchSummary(month)      → totals + byCategory for the chart
// Loading and error states are tracked independently per-panel so a summary failure doesn't blank the transaction list.

import { useState, useEffect, useCallback } from "react";
import BalanceSummary    from "./components/BalanceSummary";
import TransactionList   from "./components/TransactionList";
import AddTransactionForm from "./components/AddTransactionForm";
import SpendingChart     from "./components/SpendingChart";
import MonthFilter       from "./components/MonthFilter";
import {
  fetchTransactions,
  fetchSummary,
  createTransaction,
  deleteTransaction,
} from "./services/api";
import { formatPlainAmount } from "./utils/formatCurrency";

function getCurrentMonthValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default function App() {
  // Data state
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary]           = useState({ totalIncome: 0, totalExpenses: 0, netBalance: 0, byCategory: [] });

  // UI state
  const [month, setMonth]               = useState(getCurrentMonthValue());
  const [loadingList, setLoadingList]   = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [listError, setListError]       = useState(null);
  const [chartError, setChartError]     = useState(null);

  // Fetch transactions list
  const loadTransactions = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const data = await fetchTransactions(month || undefined);
      setTransactions(data);
    } catch (err) {
      setListError(axiosMessage(err));
    } finally {
      setLoadingList(false);
    }
  }, [month]);

  // Fetch summary (totals + chart data)
  const loadSummary = useCallback(async () => {
    setLoadingChart(true);
    setChartError(null);
    try {
      const data = await fetchSummary(month || undefined);
      setSummary(data);
    } catch (err) {
      setChartError(axiosMessage(err));
    } finally {
      setLoadingChart(false);
    }
  }, [month]);

  // Refresh both in parallel whenever the month filter changes
  useEffect(() => {
    loadTransactions();
    loadSummary();
  }, [loadTransactions, loadSummary]);

  // Document title tracks live net balance
  useEffect(() => {
    if (loadingList || loadingChart) return;
    const net  = summary.netBalance;
    const sign = net >= 0 ? "+" : "–";
    document.title = `${sign}${formatPlainAmount(Math.abs(net))} · Budget Tracker`;
  }, [summary.netBalance, loadingList, loadingChart]);

  // Add
  async function handleAdd(fields) {
    const newTx = await createTransaction(fields);  // throws on failure
    // Optimistically prepend to list and refresh summary from server
    setTransactions((prev) => [newTx, ...prev]);
    loadSummary();
  }

  // Delete
  async function handleDelete(id) {
    // Optimistic remove
    setTransactions((prev) => prev.filter((t) => (t.id ?? t._id) !== id));
    try {
      await deleteTransaction(id);
      loadSummary(); // update totals after confirmed delete
    } catch (err) {
      setListError(axiosMessage(err));
      loadTransactions(); // rollback
    }
  }

  // Render
  return (
    <div className="min-h-svh bg-paper px-4 py-10 sm:py-16">
      <main className="max-w-xl mx-auto">

        {/* Header */}
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft mb-1">
              Statement
            </p>
            <h1 className="font-serif text-2xl text-ink">Budget tracker</h1>
          </div>
          <MonthFilter value={month} onChange={setMonth} />
        </header>

        {/* Global error banner */}
        {(listError || chartError) && (
          <div className="mb-6 border border-expense-soft bg-expense-soft rounded-sm px-5 py-3 flex items-center justify-between gap-4">
            <p className="font-mono text-[11px] text-expense">
              {listError ?? chartError}
            </p>
            <button
              onClick={() => { loadTransactions(); loadSummary(); }}
              className="font-mono text-[11px] text-expense underline hover:no-underline whitespace-nowrap"
            >
              Retry
            </button>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {/* Balance card: driven by live summary */}
          <BalanceSummary
            income={summary.totalIncome}
            expenses={summary.totalExpenses}
            loading={loadingChart}
          />

          {/* Add form */}
          <AddTransactionForm onAdd={handleAdd} disabled={loadingList} />

          {/* Recharts bar chart: live byCategory from /summary */}
          <SpendingChart byCategory={summary.byCategory} loading={loadingChart} />

          {/* Transaction list */}
          <TransactionList
            transactions={transactions}
            onDelete={handleDelete}
            loading={loadingList}
          />
        </div>
      </main>
    </div>
  );
}

// Helper: pull the most useful message out of an Axios error
function axiosMessage(err) {
  if (err.response) {
    const d = err.response.data;
    return d?.errors?.[0]?.message ?? d?.error ?? `Server error ${err.response.status}`;
  }
  if (err.request) return "No response from server — is it running?";
  return err.message;
}
