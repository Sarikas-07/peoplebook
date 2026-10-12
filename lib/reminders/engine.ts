// Pure reminder logic: decides WHO should get a reminder. No database, no SMS, easy to test.
import { calculateRemaining, calculateStatus, calculateTotalPaid } from "../calculations/index.ts";
import { DEFAULT_TEMPLATES, renderTemplate } from "../sms/templates.ts";
import { formatDate } from "../format.ts";
import type { ReminderConfig } from "./config.ts";

export type ReminderType = "upcoming_reminder" | "overdue_reminder";

export type ReminderRecord = {
  id: string;
  amount_due: number | string;
  due_date: string;
  payments: { payment_amount: number | string }[] | null;
  people: { id: string; full_name: string; mobile_number: string; is_archived: boolean } | null;
};

export type PriorMessage = { record_id: string | null; message_type: string; status: string; created_at: string };

export type PlannedReminder = {
  recordId: string; personId: string; mobile: string; type: ReminderType; text: string; dueDate: string;
};

const DAY_MS = 86_400_000;
export const MAX_FAILED_ATTEMPTS = 3;

const toUtc = (d: string) => Date.parse(`${d}T00:00:00Z`);
export const daysBetween = (from: string, to: string) => Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
export const addDays = (d: string, n: number) => new Date(toUtc(d) + n * DAY_MS).toISOString().slice(0, 10);

/**
 * Duplicate protection: a reminder of this type for this record is skipped when one was already
 * sent (or is still pending) inside the window, or when it has already failed too many times.
 */
function alreadyHandled(messages: PriorMessage[], recordId: string, type: ReminderType, windowDays: number, now: Date) {
  const since = now.getTime() - windowDays * DAY_MS;
  const recent = messages.filter(
    (m) => m.record_id === recordId && m.message_type === type && Date.parse(m.created_at) >= since,
  );
  if (recent.some((m) => m.status === "sent" || m.status === "pending")) return true;
  return recent.filter((m) => m.status === "failed").length >= MAX_FAILED_ATTEMPTS;
}

export function selectDueReminders(input: {
  records: ReminderRecord[]; messages: PriorMessage[]; today: string; now: Date; config: ReminderConfig;
}): PlannedReminder[] {
  const { records, messages, today, now, config } = input;
  const planned: PlannedReminder[] = [];

  for (const r of records) {
    const person = r.people;
    if (!person || person.is_archived) continue;

    const remaining = calculateRemaining(r.amount_due, calculateTotalPaid(r.payments));
    const status = calculateStatus(remaining, r.due_date, today);
    if (status === "Paid") continue;

    const type: ReminderType | null =
      status === "Overdue" ? "overdue_reminder"
      : daysBetween(today, r.due_date) <= config.upcomingDaysBefore ? "upcoming_reminder"
      : null;
    if (!type) continue;

    const windowDays = type === "overdue_reminder" ? config.overdueRepeatEveryDays : config.upcomingDaysBefore + 1;
    if (alreadyHandled(messages, r.id, type, windowDays, now)) continue;

    planned.push({
      recordId: r.id, personId: person.id, mobile: person.mobile_number, type, dueDate: r.due_date,
      text: renderTemplate(DEFAULT_TEMPLATES[type], {
        person_name: person.full_name, remaining_amount: remaining, due_date: formatDate(r.due_date),
      }),
    });
  }
  return planned.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
