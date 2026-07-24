// Express entry point. Responsibilities: load env, configure app-level middleware, mount routes, handle 404s and uncaught errors. Nothing else lives here.
// Boot order: load env → connect MongoDB → middleware → routes → listen.
// Start with:
// npm run server:dev   (nodemon, auto-restarts)
// npm run server       (plain node)

import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes        from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const app = express();

// Global middleware
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"], // Authorization added for JWT
  })
);

app.use(express.json()); // parse application/json bodies

// Health check 
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV
  });
});

// Routes 
app.use("/api/auth",         authRoutes);
app.use("/api/transactions", transactionRoutes);

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "Route not found" });
});

// Global error handler: Four-parameter signature tells Express this is an error handler.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[error]", err.stack);
  res.status(500).json({ ok: false, error: "Internal server error" });
});

// Start
async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`
  Budget Tracker API
  ─────────────────────────────────────
  ➜  Health    GET  http://localhost:${PORT}/api/health
  ➜  Register    POST http://localhost:${PORT}/api/auth/register
  ➜  Login     POST http://localhost:${PORT}/api/auth/login
  ➜  List      GET  http://localhost:${PORT}/api/transactions?month=YYYY-MM
  ➜  Summary   GET  http://localhost:${PORT}/api/transactions/summary?month=YYYY-MM
  ➜  Create   POST  http://localhost:${PORT}/api/transactions
  ➜  Delete DELETE  http://localhost:${PORT}/api/transactions/:id
  ─────────────────────────────────────
  ➜  CORS: ${CLIENT_ORIGIN}
      `);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();