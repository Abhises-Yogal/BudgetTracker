// CONTROLLER layer - handles HTTP concerns only.
// Each method reads from req, calls a Model function, then writes to res.
// No raw data manipulation happens here; that belongs in the Model.


import * as Transaction from "../models/Transaction.js";

// GET /api/transactions
export function getAll(req, res) {
  const transactions = Transaction.findAll();
  res.status(200).json({
    ok: true,
    count: transactions.length,
    transactions,
  });
}

// GET /api/transactions/summary
export function getSummary(req, res) {
  const summary = Transaction.getSummary();
  res.status(200).json({ ok: true, ...summary });
}

// POST /api/transactions
// Body has already been validated + sanitised by validateTransaction middleware.
export function create(req, res) {
  const { type, amount, category, description } = req.body;
  const transaction = Transaction.create({ type, amount, category, description });
  res.status(201).json({ ok: true, transaction });
}

// DELETE /api/transactions/:id
export function remove(req, res) {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({
      ok: false,
      error: "Transaction id must be an integer",
    });
  }

  const deleted = Transaction.remove(id);

  if (!deleted) {
    return res.status(404).json({
      ok: false,
      error: `No transaction found with id ${id}`,
    });
  }

  res.status(200).json({ ok: true, deleted });
}
