// Formats a number as a currency string using accounting notation: income gets a leading "+", expenses are wrapped in parentheses. This mirrors how amounts read on an actual bank or ledger statement.

const currency = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatLedgerAmount(amount, type) {
  const value = currency.format(Math.abs(amount));
  return type === "income" ? `+${value}` : `(${value})`;
}

export function formatPlainAmount(amount) {
  return currency.format(Math.abs(amount));
}
