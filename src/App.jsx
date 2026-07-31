// Orchestrates all data fetching via the Axios service layer.
//  Two parallel fetches on mount (and on month change):
//   - fetchTransactions(month) → transaction list
//   - fetchSummary(month)      → totals + byCategory for the chart
// Loading and error states are tracked independently per-panel so a summary failure doesn't blank the transaction list.

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import BalanceSummary     from "./components/BalanceSummary";
import TransactionList    from "./components/TransactionList";
import AddTransactionForm from "./components/AddTransactionForm";
import SpendingChart      from "./components/SpendingChart";
import MonthFilter        from "./components/MonthFilter";
import {
  fetchTransactions,
  fetchSummary,
  createTransaction,
  deleteTransaction,
  logoutUser,
} from "./services/api";
import { formatPlainAmount } from "./utils/formatCurrency";

export default function App() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary]           = useState({ totalIncome: 0, totalExpenses: 0, netBalance: 0, byCategory: [] });
  const [month, setMonth]               = useState("");
  const [loadingList, setLoadingList]   = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [listError, setListError]       = useState(null);
  const [chartError, setChartError]     = useState(null);

  const loadTransactions = useCallback(async () => {
    setLoadingList(true); setListError(null);
    try {
      setTransactions(await fetchTransactions(month || undefined));
    } catch (err) { setListError(axiosMessage(err)); }
    finally { setLoadingList(false); }
  }, [month]);

  const loadSummary = useCallback(async () => {
    setLoadingChart(true); setChartError(null);
    try {
      setSummary(await fetchSummary(month || undefined));
    } catch (err) { setChartError(axiosMessage(err)); }
    finally { setLoadingChart(false); }
  }, [month]);

  useEffect(() => {
    loadTransactions();
    loadSummary();
  }, [loadTransactions, loadSummary]);

  useEffect(() => {
    if (loadingList || loadingChart) return;
    const net  = summary.netBalance;
    const sign = net >= 0 ? "+" : "–";
    document.title = `${sign}${formatPlainAmount(Math.abs(net))} · DimeTime`;
  }, [summary.netBalance, loadingList, loadingChart]);

  async function handleAdd(fields) {
    const newTx = await createTransaction(fields);
    setTransactions((prev) => [newTx, ...prev]);
    loadSummary();
  }

  async function handleDelete(id) {
    setTransactions((prev) => prev.filter((t) => (t.id ?? t._id) !== id));
    try {
      await deleteTransaction(id);
      loadSummary();
    } catch (err) {
      setListError(axiosMessage(err));
      loadTransactions();
    }
  }

  async function handleLogout() {
    try { await logoutUser(); } catch (_) { /* cookie cleared server-side */ }
    logout();              // clears user from context and localStorage
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-svh bg-paper px-4 py-10 sm:py-16">
      <main className="max-w-xl mx-auto">

        {/* ── Header ── */}
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft mb-1">
                Statement
              </p>
              <h1 className="font-serif text-2xl text-ink">DimeTime</h1>
            </div>
            <div className="text-right">
              <p className="font-mono text-[11px] text-ink-soft mb-1 truncate max-w-[160px]">
                {user?.name ?? user?.email}
              </p>
              <button onClick={handleLogout}
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft hover:text-expense transition-colors">
                Log out
              </button>
            </div>
          </div>
          <MonthFilter value={month} onChange={setMonth} />
        </header>

        {/* ── Error banner ── */}
        {(listError || chartError) && (
          <div className="mb-6 border border-expense-soft bg-expense-soft rounded-sm px-5 py-3 flex items-center justify-between gap-4">
            <p className="font-mono text-[11px] text-expense">{listError ?? chartError}</p>
            <button onClick={() => { loadTransactions(); loadSummary(); }}
              className="font-mono text-[11px] text-expense underline hover:no-underline whitespace-nowrap">
              Retry
            </button>
          </div>
        )}

        <div className="flex flex-col gap-6">
          <BalanceSummary income={summary.totalIncome} expenses={summary.totalExpenses} loading={loadingChart} />
          <AddTransactionForm onAdd={handleAdd} disabled={loadingList} />
          <SpendingChart byCategory={summary.byCategory} loading={loadingChart} />
          <TransactionList transactions={transactions} onDelete={handleDelete} loading={loadingList} />
        </div>
      </main>
    </div>
  );
}

function axiosMessage(err) {
  if (err.response) {
    const d = err.response.data;
    return d?.errors?.[0]?.message ?? d?.error ?? `Server error ${err.response.status}`;
  }
  if (err.request) return "No response from server — is it running?";
  return err.message;
}
