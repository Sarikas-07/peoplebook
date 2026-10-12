import { isValidDate } from "@/lib/validations/record";

export const PAYMENT_METHODS = ["Cash", "UPI", "Bank Transfer", "Other"] as const;
export const OVER_PAYMENT_MESSAGE = "Payment cannot be greater than the remaining amount.";

export type PaymentFields = {
  record_id: string;
  payment_amount: string;
  payment_date: string;
  payment_method: string;
  notes: string;
};
export type PaymentFieldErrors = Partial<Record<keyof PaymentFields, string>>;

const clean = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

export function readPaymentForm(fd: FormData): PaymentFields {
  return {
    record_id: clean(fd.get("record_id")),
    payment_amount: clean(fd.get("payment_amount")).replace(/,/g, ""),
    payment_date: clean(fd.get("payment_date")),
    payment_method: clean(fd.get("payment_method")),
    notes: clean(fd.get("notes")),
  };
}

/** Field-level checks. The "exceeds remaining" rule is checked separately against live data. */
export function validatePayment(v: PaymentFields): PaymentFieldErrors {
  const e: PaymentFieldErrors = {};
  if (!v.record_id) e.record_id = "Please select a record.";
  const n = Number(v.payment_amount);
  if (!v.payment_amount) e.payment_amount = "Payment amount is required.";
  else if (!Number.isFinite(n) || n <= 0) e.payment_amount = "Payment amount must be greater than 0.";
  else if (!/^\d+(\.\d{1,2})?$/.test(v.payment_amount)) e.payment_amount = "Payment amount can have at most 2 decimal places.";
  if (!isValidDate(v.payment_date)) e.payment_date = "Enter a valid date.";
  if (!(PAYMENT_METHODS as readonly string[]).includes(v.payment_method)) e.payment_method = "Select a payment method.";
  if (v.notes.length > 1000) e.notes = "Notes must be 1000 characters or fewer.";
  return e;
}
