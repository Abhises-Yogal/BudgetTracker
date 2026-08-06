// POST /api/ai/analyse
// Receives the current month's transactions from the client, builds a structured financial prompt, calls Groq, and returns parsed advice.
// The controller stays thin and prompt construction lives in buildPrompt() so it can be unit-tested or swapped independently.

import groq from "../config/groq.js";

const MODEL   = "llama-3.3-70b-versatile";
const TIMEOUT = 25_000; // 25 s — Groq is fast but give breathing room

// POST /api/ai/analyse
export async function analyse(req, res, next) {
  // groq.available is false only on the safe stub (missing API key)
  if (groq.available === false) {
    return res.status(503).json({ ok: false, error: "AI service unavailable: GROQ_API_KEY not configured." });
  }

  try {
    const { transactions = [], month } = req.body;

    if (!transactions.length) {
      return res.status(400).json({
        ok: false,
        error: "No transactions provided — add some transactions first.",
      });
    }

    const prompt = buildPrompt(transactions, month);

    const completion = await groq.chat.completions.create(
      {
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a friendly, practical financial advisor. " +
              "Give clear, actionable advice. " +
              "Always respond with valid JSON exactly matching the schema the user specifies — nothing else.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,       // low temp = consistent, factual output
        max_tokens:  1024,
        response_format: { type: "json_object" },
      },
      { timeout: TIMEOUT }
    );

    const raw     = completion.choices[0]?.message?.content ?? "{}";
    const parsed  = JSON.parse(raw);

    // Normalise - guarantee the shape the frontend expects
    const advice = {
      summary:       parsed.summary       ?? "No summary available.",
      bullets:       Array.isArray(parsed.bullets)    ? parsed.bullets    : [],
      highlights:    Array.isArray(parsed.highlights) ? parsed.highlights : [],
      savingsTip:    parsed.savingsTip    ?? null,
      rating:        typeof parsed.rating === "number"
                       ? Math.min(10, Math.max(1, parsed.rating))
                       : null,
    };

    res.json({ ok: true, advice, model: MODEL });
  } catch (err) {
    // Surface Groq-specific errors clearly
    if (err?.status === 401) {
      return res.status(500).json({ ok: false, error: "Invalid Groq API key — check GROQ_API_KEY in server/.env" });
    }
    if (err?.status === 429) {
      return res.status(429).json({ ok: false, error: "Groq rate limit reached — try again in a moment." });
    }
    next(err);
  }
}

// Prompt builder
function buildPrompt(transactions, month) {
  // Aggregate by category for a compact summary
  const byCategory = {};
  let totalIncome   = 0;
  let totalExpenses = 0;

  for (const t of transactions) {
    if (!byCategory[t.category]) {
      byCategory[t.category] = { type: t.type, total: 0, count: 0 };
    }
    byCategory[t.category].total  += t.amount;
    byCategory[t.category].count  += 1;
    if (t.type === "income")  totalIncome   += t.amount;
    if (t.type === "expense") totalExpenses += t.amount;
  }

  const netBalance  = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0
    ? ((netBalance / totalIncome) * 100).toFixed(1)
    : "0.0";

  const categoryLines = Object.entries(byCategory)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([cat, d]) =>
      `  - ${cat} (${d.type}): $${d.total.toFixed(2)} across ${d.count} transaction${d.count > 1 ? "s" : ""}`
    )
    .join("\n");

  const period = month ? `for ${month}` : "across all recorded transactions";

  return `
Analyse the following personal finance data ${period}:

SUMMARY
  Total income:   $${totalIncome.toFixed(2)}
  Total expenses: $${totalExpenses.toFixed(2)}
  Net balance:    $${netBalance.toFixed(2)}
  Savings rate:   ${savingsRate}%
  Transactions:   ${transactions.length}

BREAKDOWN BY CATEGORY
${categoryLines}

Respond with a JSON object matching this EXACT schema (no extra keys):
{
  "summary":    "2-3 sentence overall assessment of this person's finances",
  "bullets":    ["actionable advice point 1", "actionable advice point 2", "actionable advice point 3", "actionable advice point 4"],
  "highlights": ["one positive observation about their spending"],
  "savingsTip": "one specific, concrete tip to improve savings rate",
  "rating":     <integer 1-10 reflecting overall financial health>
}
`.trim();
}
