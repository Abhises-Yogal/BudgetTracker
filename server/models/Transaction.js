// MODEL layer: Mongoose schema + all data-access methods.
// Controllers call only these exports; no mongoose code lives elsewhere.
import mongoose from "mongoose";

// Transaction schema
const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["income", "expense"],
      required: [true, "Type is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: [
          "Salary", "Freelance", "Investment", "Gift",
          "Housing", "Food", "Transport", "Entertainment",
          "Health", "Utilities", "Other",
        ],
        message: "{VALUE} is not a valid category",
      },
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [120, "Description cannot exceed 120 characters"],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    // userId reserved for auth; stored as a plain string for now so the
    // schema is ready when you add JWT without a migration.
    userId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
    toJSON: {
      // Replace _id with id and drop __v in every JSON response
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index speeds up the month-filter query and the summary aggregation
transactionSchema.index({ userId: 1, date: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

// Model methods

// findAll()
// Returns transactions newest-first, optionally filtered to a YYYY-MM month.
export async function findAll({ userId, month } = {}) {
  const filter = { userId, ...buildDateFilter(month) };
  return Transaction.find(filter).sort({ date: -1 }).lean({ virtuals: true });
}

// create(fields)
// Inserts a new transaction and returns the saved document.
export async function create(fields) {
  const tx = await Transaction.create(fields);
  return tx.toJSON();
}

// remove(id, userId)
// Deletes by MongoDB_id. Returns the deleted doc or null.
export async function remove(id, userId) {
  // findOneAndDelete with userId prevents deleting another user's transaction
  return Transaction.findOneAndDelete({ _id: id, userId }).lean({ virtuals: true });
}

// getSummary({ userId, month })
// MongoDB aggregation pipeline:
// 1. Optional $match to filter by month
// 2. $facet runs two sub-pipelines in parallel:
//     - totals: one doc per type (income / expense)
//     - byCategory: one doc per category with count + total
// 3. Results are merged and rounded in JS
export async function getSummary({ userId, month } = {}) {
  const matchFilter = { userId, ...buildDateFilter(month) };

  const [result] = await Transaction.aggregate([
    { $match: matchFilter },
    {
      $facet: {
        totals: [
          { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ],
        byCategory: [
          {
            $group: {
              _id: { category: "$category", type: "$type" },
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { total: -1 } },
          {
            $project: {
              _id: 0,
              category: "$_id.category",
              type: "$_id.type",
              total: 1,
              count: 1,
            },
          },
        ],
      },
    },
  ]);

  const totalsMap = {};
  for (const t of result.totals) totalsMap[t._id] = t.total;

  const totalIncome   = round2(totalsMap.income  ?? 0);
  const totalExpenses = round2(totalsMap.expense ?? 0);

  return {
    totalIncome,
    totalExpenses,
    netBalance: round2(totalIncome - totalExpenses),
    byCategory: result.byCategory.map((c) => ({ ...c, total: round2(c.total) })),
  };
}

// Helpers

// buildDateFilter("2025-06")  →  { date: { $gte: Date, $lte: Date } } 
// buildDateFilter(undefined)  →  {}
function buildDateFilter(month) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return {};
  const [year, mon] = month.split("-").map(Number);
  return {
    date: {
      $gte: new Date(year, mon - 1, 1),
      $lte: new Date(year, mon, 0, 23, 59, 59),
    },
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

export default Transaction;
