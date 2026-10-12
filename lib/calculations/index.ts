import type { PaymentAmountRow, RecordRow, RecordStatus } from "@/types";

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Today's date (YYYY-MM-DD) in Indian Standard Time. */
export function todayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function calculateTotalPaid(payments?: PaymentAmountRow[] | null): number {
  return round2((payments ?? []).reduce((sum, p) => sum + Number(p.payment_amount), 0));
}

export function calculateRemaining(amountDue: number | string, totalPaid: number): number {
  return Math.max(0, round2(Number(amountDue) - totalPaid));
}

/** True when a payment of `amount` fits within the remaining amount (never allows a negative remaining). */
export function isPaymentWithinRemaining(amount: number, remaining: number): boolean {
  return amount > 0 && round2(amount) <= round2(remaining);
}

export function calculateStatus(remaining: number, dueDate: string, today = todayIST()): RecordStatus {
  if (remaining <= 0) return "Paid";
  return today > dueDate ? "Overdue" : "Active";
}

export function summarizeRecord(r: RecordRow) {
  const totalPaid = calculateTotalPaid(r.payments);
  const remaining = calculateRemaining(r.amount_due, totalPaid);
  return { totalPaid, remaining, status: calculateStatus(remaining, r.due_date) };
}

/** Totals across all records of one person. status is null when there are no records. */
export function summarizeRecords(records: RecordRow[]) {
  let given = 0, due = 0, paid = 0, remaining = 0;
  const statuses = new Set<RecordStatus>();
  for (const r of records) {
    const s = summarizeRecord(r);
    given += Number(r.amount_given);
    due += Number(r.amount_due);
    paid += s.totalPaid;
    remaining += s.remaining;
    statuses.add(s.status);
  }
  const status: RecordStatus | null = records.length === 0 ? null
    : statuses.has("Overdue") ? "Overdue"
    : statuses.has("Active") ? "Active" : "Paid";
  return { count: records.length, given: round2(given), due: round2(due), paid: round2(paid), remaining: round2(remaining), status };
}

/** Totals and per-status record counts across all records (used by the Dashboard and Reports). */
export function summarizePortfolio(records: RecordRow[]) {
  const totals = summarizeRecords(records);
  const counts: Record<RecordStatus, number> = { Active: 0, Overdue: 0, Paid: 0 };
  for (const r of records) counts[summarizeRecord(r).status] += 1;
  return {
    given: totals.given, due: totals.due, received: totals.paid, remaining: totals.remaining,
    activeRecords: counts.Active, overdueRecords: counts.Overdue, paidRecords: counts.Paid,
  };
}
