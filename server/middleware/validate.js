// MIDDLEWARE layer - validates and sanitises incoming request bodies before they reach the controller. Body validation for POST /api/transactions.
// Returns structured 400 errors so the client always knows exactly which field failed.

const VALID_TYPES = ["income", "expense"];

const VALID_CATEGORIES = [
  // income
  "Salary", "Freelance", "Investment", "Gift",
  // expense
  "Housing", "Food", "Transport", "Entertainment",
  "Health", "Utilities", "Other",
];

export function validateTransaction(req, res, next) {
  const { type, amount, category, description } = req.body;
  const errors = [];

  if (!VALID_TYPES.includes(type)) {
    errors.push({ field: "type", message: `Must be one of: ${VALID_TYPES.join(", ")}`
    });
  }

  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed <= 0) {
    errors.push({ field: "amount", message: "Must be a positive number" });
  }

  if (!VALID_CATEGORIES.includes(category)) {
    errors.push({
      field: "category",
      message: `Must be one of: ${VALID_CATEGORIES.join(", ")}`,
    });
  }

  if (!description || typeof description !== "string" || !description.trim()) {
    errors.push({ field: "description", message: "Required, must be a non-empty string" });
  }

  if (errors.length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  // Normalise so the route handler doesn't need to clean up
  req.body.description = description.trim();
  req.body.amount = parsed;

  next();
}
