// Express entry point. Responsibilities: load env, configure app-level middleware, mount routes, handle 404s and uncaught errors. Nothing else lives here.
// Boot order: load env → connect MongoDB → middleware → routes → listen.
// Start with:
// npm run server:dev   (nodemon, auto-restarts)
// npm run server       (plain node)

import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import authRoutes        from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";

const PORT = process.env.PORT || 3001;
const allowedOrigins = ["http://localhost:5173",process.env.FRONTEND_URL,].filter(Boolean);

const app = express();

// Global middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin))
      return callback(null, true);
      return callback(new Error("Not allowed by CORS policy"));
    },
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
    credentials: true, // tells browser to send the bt_token cookie
  })
);

app.use(express.json()); // parse application/json bodies
app.use(cookieParser()); // parse cookies from incoming requests

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
  ➜  POST   /api/auth/register
  ➜  POST   /api/auth/login
  ➜  POST   /api/auth/logout
  ➜  GET    /api/transactions?month=YYYY-MM   [auth]
  ➜  GET    /api/transactions/summary          [auth]
  ➜  POST   /api/transactions                  [auth]
  ➜  DELETE /api/transactions/:id              [auth]
  ──────────────────────────────────────────────────
  ➜  Allowed origins: ${allowedOrigins.join(", ")}
      `);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();