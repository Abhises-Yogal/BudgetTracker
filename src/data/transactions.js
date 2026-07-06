// Hardcoded sample data for the budget tracker UI.
// Replace with real data from an API or local store later.

export const transactions = [
  {
    id: 1,
    description: "Monthly salary",
    category: "Salary",
    date: "2026-06-01",
    type: "income",
    amount: 42000.0,
  },
  {
    id: 2,
    description: "Rent - June",
    category: "Housing",
    date: "2026-06-02",
    type: "expense",
    amount: 14500.0,
  },
  {
    id: 3,
    description: "Freelance design work",
    category: "Freelance",
    date: "2026-06-05",
    type: "income",
    amount: 6200.0,
  },
  {
    id: 4,
    description: "Groceries - BBSM",
    category: "Food",
    date: "2026-06-08",
    type: "expense",
    amount: 960.42,
  },
  {
    id: 5,
    description: "Spotify subscription",
    category: "Entertainment",
    date: "2026-06-10",
    type: "expense",
    amount: 149.99,
  },
];

// Totals shown in the BalanceSummary card. Hardcoded per the brief - in a real app these would be derived from the transaction list.
export const summary = {
  income: 48200.0,
  expenses: 15610.41,
};
