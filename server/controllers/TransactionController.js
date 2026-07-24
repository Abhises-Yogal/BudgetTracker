// server/controllers/TransactionController.js
// CONTROLLER layer — async HTTP handlers only.
// Each method: read req → call Model → write res (or next(err)).
// No mongoose, no data logic here.

import * as Transaction from "../models/Transaction.js";

// GET /api/transactions?month=YYYY-MM
export async function getAll(req, res, next) {
  try {
    const { month } = req.query;
    const transactions = await Transaction.findAll({ userId: req.user.id, month });
    res.status(200).json({ ok: true, count: transactions.length, transactions });
  } catch (err) { next(err); }
}

// GET /api/transactions/summary?month=YYYY-MM
export async function getSummary(req, res, next) {
  try {
    const { month } = req.query;
    const summary = await Transaction.getSummary({ userId: req.user.id, month });
    res.status(200).json({ ok: true, ...summary });
  } catch (err) { next(err); }
}

// POST /api/transactions
export async function create(req, res, next) {
  try {
    const { type, amount, category, description } = req.body;
    const transaction = await Transaction.create({
      type, amount, category, description,
      userId: req.user.id, // bind to the authenticated user
    });
    res.status(201).json({ ok: true, transaction });
  } catch (err) {
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
      return res.status(400).json({ ok: false, errors });
    }
    next(err);
  }
}

// DELETE /api/transactions/:id
export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    // Pass userId so a user can't delete someone else's transaction
    const deleted = await Transaction.remove(id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ ok: false, error: `No transaction found with id ${id}` });
    }
    res.status(200).json({ ok: true, deleted });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ ok: false, error: `"${req.params.id}" is not a valid id` });
    }
    next(err);
  }
}
