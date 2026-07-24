// Single Axios instance for all API calls.
// In development, Vite is configured to proxy /api/* to localhost:3001.
// In production, the app can use the same origin as the API backend.

import axios from "axios";

const TOKEN_KEY = "bt_token";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 8000,
});

// Request interceptor: inject token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle expired / invalid token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
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
  return data; // { ok, token, user }
}

export async function loginUser({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  return data; // { ok, token, user }
}

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
