// Single Axios instance for all API calls.
// In development, Vite is configured to proxy /api/* to localhost:3001.
// In production, set VITE_API_URL to your backend URL (e.g. https://your-api.onrender.com).

import axios from "axios";

const TOKEN_KEY = "bt_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 8000,
  withCredentials: true, // send httpOnly cookies with every request
});

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
