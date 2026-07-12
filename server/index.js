// Express entry point. Responsibilities: load env, configure app-level middleware, mount routes, handle 404s and uncaught errors. Nothing else lives here.
// Start with:
// npm run server:dev   (nodemon, auto-restarts)
// npm run server       (plain node)

import "dotenv/config";
import express from "express";
import cors from "cors";
import transactionRoutes from "./routes/transactions.js";

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const app = express();

// Global middleware
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json()); // parse application/json bodies

// Health check 
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || "development",
  });
});

// Routes 
app.use("/api/transactions", transactionRoutes);

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "Route not found" });
});

// Global error handler: Four-parameter signature tells Express this is an error handler.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ ok: false, error: "Internal server error" });
});

// Start
app.listen(PORT, () => {
  console.log(`
  Budget Tracker API
  ➜  Health      GET  http://localhost:${PORT}/api/health
  ➜  List        GET  http://localhost:${PORT}/api/transactions
  ➜  Summary     GET  http://localhost:${PORT}/api/transactions/summary
  ➜  Create      POST http://localhost:${PORT}/api/transactions
  ➜  Delete   DELETE  http://localhost:${PORT}/api/transactions/:id
  ➜  CORS origin: ${CLIENT_ORIGIN}
  `);
});
