import { formatAmount } from "../format.ts";

export type MessageType = "payment_confirmation" | "upcoming_reminder" | "overdue_reminder" | "custom";

export const MESSAGE_TYPES: { value: MessageType; label: string }[] = [
  { value: "payment_confirmation", label: "Payment Confirmation" },
  { value: "upcoming_reminder", label: "Upcoming Due Reminder" },
  { value: "overdue_reminder", label: "Overdue Reminder" },
  { value: "custom", label: "Custom Message" },
];

export const MESSAGE_TYPE_LABEL = Object.fromEntries(MESSAGE_TYPES.map((t) => [t.value, t.label])) as Record<MessageType, string>;

export const DEFAULT_TEMPLATES: Record<MessageType, string> = {
  payment_confirmation:
    "Hello {person_name},\n\nWe have received your payment of ₹{payment_amount}.\n\nTotal amount paid: ₹{total_paid}.\n\nRemaining amount: ₹{remaining_amount}.\n\nThank you.",
  upcoming_reminder:
    "Hello {person_name},\n\nThis is a reminder that your remaining amount of ₹{remaining_amount} is due on {due_date}.\n\nThank you.",
  overdue_reminder:
    "Hello {person_name},\n\nYour remaining amount of ₹{remaining_amount} was due on {due_date}.\n\nPlease contact us regarding the pending amount.\n\nThank you.",
  custom: "",
};

export type TemplateContext = {
  person_name: string;
  payment_amount?: number | null;
  total_paid?: number;
  remaining_amount?: number;
  due_date?: string; // already formatted, e.g. "15 Oct 2026"
};

const AMOUNT_KEYS = new Set(["payment_amount", "total_paid", "remaining_amount"]);

/** Replaces {placeholders}. Unknown or missing values are left as-is so they are easy to spot. */
export function renderTemplate(template: string, ctx: TemplateContext): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = (ctx as Record<string, string | number | null | undefined>)[key];
    if (value === undefined || value === null) return match;
    return AMOUNT_KEYS.has(key) ? formatAmount(value) : String(value);
  });
}
