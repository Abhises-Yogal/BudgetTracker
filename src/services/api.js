// Single Axios instance for all API calls.
// In development, Vite is configured to proxy /api/* to localhost:3001.
// In production, set VITE_API_URL at build time OR provide a runtime /runtime-config.json

import axios from "axios";

// Prefer runtime-injected value (window.__API_URL) if present, then VITE_API_URL, then relative /api
const initialBase = (typeof window !== "undefined" && window.__API_URL)
  ? window.__API_URL
  : import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: initialBase,
  headers: { "Content-Type": "application/json" },
  timeout: 8000,
  withCredentials: true, // send httpOnly cookies with every request
});

// Try to load runtime config non-blocking. If /runtime-config.json exists and contains VITE_API_URL,
// update the axios instance baseURL so the app can be re-pointed without rebuilding the bundle.
if (typeof window !== "undefined") {
  fetch("/runtime-config.json", { cache: "no-store" })
    .then((r) => r.ok ? r.json() : null)
    .then((cfg) => {
      const runtime = cfg?.VITE_API_URL;
      if (runtime && runtime !== api.defaults.baseURL) {
        api.defaults.baseURL = runtime;
        // Optional: expose for debugging
        window.__API_URL = runtime;
        console.info("Runtime API URL loaded:", runtime);
      }
    })
    .catch(() => {
      // ignore - runtime config is optional
    });
}

// Response interceptor: handle expired / invalid token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("bt_user");
      // Hard redirect: clears all React state cleanly
      window.location.replace("/login");
    }
    return Promise.reject(error);
  }
);

// Auth

export async function registerUser({ name, email, password }) {
  const { data } = await api.post("/auth/register", { name, email, password });
  return data; // { ok, user }
}

export async function loginUser({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  return data; // { ok, user }
}

export async function logoutUser() {
  await api.post("/auth/logout"); // server clears the httpOnly cookie
}

// Transactions

// fetchTransactions(month?): GET /api/transactions?month=YYYY-MM
// month is optional; omit to get all transactions.
export async function fetchTransactions(month) {
  const params = month ? { month } : {};
  const { data } = await api.get("/transactions", { params });
  return data.transactions;
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

//AI Insights

export async function fetchAiAdvice({ transactions, month }) {
  const { data } = await api.post("/ai/analyse", { transactions, month });
  return data; // { ok, advice, model }
}