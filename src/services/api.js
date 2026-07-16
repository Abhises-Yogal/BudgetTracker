// Single Axios instance for all API calls.
// In development, Vite is configured to proxy /api/* to localhost:3001.
// In production, the app can use the same origin as the API backend.

import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 8000,
});

// Transactions

// fetchTransactions(month?): GET /api/transactions?month=YYYY-MM
// month is optional; omit to get all transactions.
export async function fetchTransactions(month) {
  const params = month ? { month } : {};
  const { data } = await api.get("/transactions", { params });
  return data.transactions; // array
}

// fetchSummary(month?): GET /api/transactions/summary?month=YYYY-MM
// Returns { totalIncome, totalExpenses, netBalance, byCategory[] }
export async function fetchSummary(month) {
  const params = month ? { month } : {};
  const { data } = await api.get("/transactions/summary", { params });
  return data; // spread the whole envelope
}

// createTransaction(body): POST /api/transactions
// body: { type, amount, category, description }
export async function createTransaction(body) {
  const { data } = await api.post("/transactions", body);
  return data.transaction;
}

// deleteTransaction(id): DELETE /api/transactions/:id
export async function deleteTransaction(id) {
  const { data } = await api.delete(`/transactions/${id}`);
  return data.deleted;
}
