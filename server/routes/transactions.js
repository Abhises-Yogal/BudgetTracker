// ROUTE layer: maps HTTP verbs + URL patterns to controller methods. No business logic or data access here; this file is purely wiring.
// GET    /api/transactions           → TransactionController.getAll
// GET    /api/transactions/summary   → TransactionController.getSummary
// POST   /api/transactions           → validateTransaction → TransactionController.create
// DELETE /api/transactions/:id       → TransactionController.remove

import { Router } from "express";
import * as TransactionController from "../controllers/TransactionController.js";
import { validateTransaction } from "../middleware/validate.js";

const router = Router();

// /summary must be declared before /:id so Express doesn't treat the literal string "summary" as a numeric id parameter.
router.get("/summary", TransactionController.getSummary);

router.get("/", TransactionController.getAll);

router.post("/", validateTransaction, TransactionController.create);

router.delete("/:id", TransactionController.remove);

export default router;
