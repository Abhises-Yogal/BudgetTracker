import { useState } from "react";

const CATEGORIES = {
  income:  ["Salary", "Freelance", "Investment", "Gift", "Other"],
  expense: ["Housing", "Food", "Transport", "Entertainment", "Health", "Utilities", "Other"],
};

const EMPTY = {
  type: "expense",
  amount: "",
  category: "Food",
  description: "",
};

// AddTransactionForm
// All inputs are controlled — every keystroke flows through React state. The category list swaps when type changes (income vs expense categories are different), and the form resets cleanly after a successful add. The panel collapses behind a toggle so the ledger list stays readable when the user isn't adding anything.

export default function AddTransactionForm({ onAdd, disabled }) {
  const [open, setOpen]   = useState(false);
  const [form, setForm]   = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setError("");
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // When type changes, reset category to the first of the new list
      if (field === "type") next.category = CATEGORIES[value][0];
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.description.trim()) { setError("Add a description."); return; }
    if (!amount || amount <= 0)    { setError("Enter a positive amount."); return; }

    setSaving(true);
    try {
      await onAdd({ ...form, amount });
      setForm(EMPTY);
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.message ?? err.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const isIncome = form.type === "income";

  return (
    <section className="bg-surface border border-hairline rounded-sm">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-7 sm:px-9 py-5 text-left group disabled:opacity-40"
        aria-expanded={open}
      >
        <h2 className="font-serif text-lg text-ink">Add transaction</h2>
        <span className={`font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${open ? "text-ink" : "text-ink-soft group-hover:text-ink"}`}>
          {open ? "Cancel" : "New ＋"}
        </span>
      </button>

      {open && (
        <div className="border-t border-hairline px-7 sm:px-9 py-6">
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Type */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft mb-1.5">Type</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value)}
                  className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm text-ink appearance-none cursor-pointer focus:outline-none focus:border-ink">
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              {/* Category */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft mb-1.5">Category</label>
                <select value={form.category} onChange={(e) => set("category", e.target.value)}
                  className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm text-ink appearance-none cursor-pointer focus:outline-none focus:border-ink">
                  {CATEGORIES[form.type].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              
              {/* Amount */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft mb-1.5">Amount (NPR)</label>
                <input type="number" min="0.01" step="0.01" placeholder="0.00"
                  value={form.amount} onChange={(e) => set("amount", e.target.value)}
                  className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm font-mono text-ink placeholder:text-ink-soft focus:outline-none focus:border-ink" />
              </div>

              {/* Description */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft mb-1.5">Description</label>
                <input type="text" placeholder={isIncome ? "e.g. June salary" : "e.g. Weekly groceries"}
                  value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={120}
                  className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:border-ink" />
              </div>
            </div>

            {error && <p className="font-mono text-[11px] text-expense mb-4">{error}</p>}

            <button type="submit" disabled={saving}
              className={`w-full py-2.5 px-4 rounded-sm font-mono text-[12px] uppercase tracking-[0.14em] text-surface transition-opacity disabled:opacity-50 hover:opacity-80 ${isIncome ? "bg-income" : "bg-expense"}`}>
              {saving ? "Saving…" : `Record ${isIncome ? "income" : "expense"}`}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
