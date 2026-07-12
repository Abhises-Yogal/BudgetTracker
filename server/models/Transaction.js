// MODEL layer: owns the data and every operation on it.
// No HTTP knowledge lives here: no req, no res, no status codes.
// Swap the in-memory array for a DB client (pg, mongoose, etc.) by changing only this file.

// Seed data
let transactions = [
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

let nextId = transactions.length + 1;

// Model methods

// findAll()
// Returns all transactions sorted newest-first by id.
export function findAll() {
  return [...transactions].sort((a, b) => b.id - a.id);
}

// findById(id)
// Returns a single transaction or null if not found.
export function findById(id) {
  return transactions.find((t) => t.id === id) ?? null;
}

// create({ type, amount, category, description })
// Inserts a new transaction and returns it with its generated id and date.
export function create({ type, amount, category, description }) {
  const transaction = {
    id: nextId++,
    type,
    amount: parseFloat(amount),
    category,
    description: description.trim(),
    date: new Date().toISOString().slice(0, 10),
  };
  transactions.push(transaction);
  return transaction;
}

// remove(id)
// Deletes by id. Returns the deleted object or null if not found.
export function remove(id) {
  const index = transactions.findIndex((t) => t.id === id);
  if (index === -1) return null;
  const [deleted] = transactions.splice(index, 1);
  return deleted;
}

// getSummary()
//Computes global totals and a per-category breakdown sorted by total desc. Pure calculation - no side effects.
export function getSummary() {
  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryMap = {};

  for (const t of transactions) {
    if (t.type === "income") {
      totalIncome += t.amount;
    } else {
      totalExpenses += t.amount;
    }

    if (!categoryMap[t.category]) {
      categoryMap[t.category] = {
        category: t.category,
        type: t.type,
        total: 0,
        count: 0,
      };
    }
    categoryMap[t.category].total += t.amount;
    categoryMap[t.category].count += 1;
  }

  // Round to avoid floating-point drift (e.g. 1557.4099999...)
  const round2 = (n) => Math.round(n * 100) / 100;

  return {
    totalIncome: round2(totalIncome),
    totalExpenses: round2(totalExpenses),
    netBalance: round2(totalIncome - totalExpenses),
    transactionCount: transactions.length,
    byCategory: Object.values(categoryMap)
      .map((c) => ({ ...c, total: round2(c.total) }))
      .sort((a, b) => b.total - a.total),
  };
}
