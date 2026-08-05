// "Get AI Insights" button → calls POST /api/ai/analyse with the current month's transactions → displays Groq's structured advice in a styled card.
// States: idle → loading → result | error
// The component manages its own async state so App.jsx stays clean.

import { useState } from "react";
import { fetchAiAdvice } from "../services/api";

// Rating bar
function RatingBar({ rating }) {
  if (!rating) return null;
  const pct   = (rating / 10) * 100;
  const color =
    rating >= 8 ? "bg-income" :
    rating >= 5 ? "bg-yellow-400" :
                  "bg-expense";

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
          Financial health score
        </span>
        <span className={`font-mono text-sm font-semibold tabular-nums ${
          rating >= 8 ? "text-income" : rating >= 5 ? "text-yellow-600" : "text-expense"
        }`}>
          {rating} / 10
        </span>
      </div>
      <div className="h-1.5 bg-hairline rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// Loading shimmer
function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-5">
        {/* Spinning brain / sparkle icon */}
        <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft animate-pulse">
          Analysing your spending…
        </span>
      </div>
      {/* Skeleton lines */}
      {[90, 75, 85, 60].map((w, i) => (
        <div
          key={i}
          className="h-2.5 bg-hairline rounded animate-pulse"
          style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

// Main component
export default function AiInsights({ transactions, month }) {
  const [state, setState]   = useState("idle");   // idle | loading | done | error
  const [advice, setAdvice] = useState(null);
  const [model,  setModel]  = useState(null);
  const [error,  setError]  = useState(null);

  async function handleAnalyse() {
    setState("loading");
    setError(null);
    try {
      const data = await fetchAiAdvice({ transactions, month });
      setAdvice(data.advice);
      setModel(data.model);
      setState("done");
    } catch (err) {
      setError(
        err.response?.data?.error ??
        err.message ??
        "AI analysis failed — try again."
      );
      setState("error");
    }
  }

  function handleReset() {
    setState("idle");
    setAdvice(null);
    setError(null);
  }

  // Idle - just the button
  if (state === "idle") {
    return (
      <section className="bg-surface border border-hairline rounded-sm px-7 sm:px-9 py-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg text-ink">AI spending analyst</h2>
          <p className="font-mono text-[11px] text-ink-soft mt-0.5">
            Powered by Groq · {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
            {month ? ` in ${month}` : " (all time)"}
          </p>
        </div>
        <button
          onClick={handleAnalyse}
          disabled={!transactions.length}
          className="shrink-0 px-4 py-2 bg-ink text-surface rounded-sm font-mono text-[11px] uppercase tracking-[0.14em] hover:opacity-80 disabled:opacity-30 transition-opacity whitespace-nowrap"
        >
          Get insights ✦
        </button>
      </section>
    );
  }

  // Loading
  if (state === "loading") {
    return (
      <section className="bg-surface border border-hairline rounded-sm px-7 sm:px-9 py-6">
        <LoadingState />
      </section>
    );
  }

  // Error
  if (state === "error") {
    return (
      <section className="bg-surface border border-expense-soft rounded-sm px-7 sm:px-9 py-6">
        <p className="font-mono text-[11px] text-expense mb-3">{error}</p>
        <button
          onClick={handleReset}
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft underline hover:no-underline"
        >
          Try again
        </button>
      </section>
    );
  }

  // Done - full advice card
  return (
    <section className="bg-surface border border-hairline rounded-sm">
      {/* Card header */}
      <div className="px-7 sm:px-9 py-5 border-b border-hairline flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg text-ink">AI spending analyst</h2>
          <p className="font-mono text-[10px] text-ink-soft mt-0.5 uppercase tracking-[0.12em]">
            {model} · Groq
          </p>
        </div>
        <button
          onClick={handleReset}
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft hover:text-ink transition-colors whitespace-nowrap"
        >
          Refresh ↺
        </button>
      </div>

      <div className="px-7 sm:px-9 py-6 space-y-6">
        {/* Health score */}
        <RatingBar rating={advice.rating} />

        {/* Summary paragraph */}
        {advice.summary && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft mb-2">
              Overview
            </p>
            <p className="text-[14px] text-ink leading-relaxed">{advice.summary}</p>
          </div>
        )}

        {/* Positive highlights */}
        {advice.highlights?.length > 0 && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-income mb-2">
              What you're doing well
            </p>
            <ul className="space-y-1.5">
              {advice.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-ink">
                  <span className="text-income mt-0.5 shrink-0">✓</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actionable bullets */}
        {advice.bullets?.length > 0 && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft mb-2">
              Recommendations
            </p>
            <ul className="space-y-2.5">
              {advice.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="font-mono text-[11px] text-ink-soft mt-0.5 shrink-0 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[13px] text-ink leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Savings tip */}
        {advice.savingsTip && (
          <div className="bg-income-soft border border-income/20 rounded-sm px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-income mb-1">
              Savings tip
            </p>
            <p className="text-[13px] text-ink leading-relaxed">{advice.savingsTip}</p>
          </div>
        )}
      </div>
    </section>
  );
}
