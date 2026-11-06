export interface UzumApprovedQuote { month: number; deposit: number; first_payment_date: string }

/** Never turn absent payment terms into an invented zero or an empty schedule. */
export function parseUzumQuote(value: unknown): UzumApprovedQuote | null {
  if (!value || typeof value !== "object") return null;
  const quote = value as Record<string, unknown>;
  const money = (v: unknown) => {
    if (typeof v !== "number" && (typeof v !== "string" || !v.trim())) return NaN;
    return Number(v);
  };
  const month = money(quote.month), deposit = money(quote.deposit);
  if (!Number.isFinite(month) || month <= 0 || !Number.isFinite(deposit) || deposit < 0 || typeof quote.first_payment_date !== "string") return null;
  const day = quote.first_payment_date.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const parsed = new Date(`${day}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== day) return null;
  return { month, deposit, first_payment_date: day };
}
