import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_REMINDER_CONFIG, getReminderStatus, readReminderConfig } from "./config.ts";
import { addDays, daysBetween, selectDueReminders, type PriorMessage, type ReminderRecord } from "./engine.ts";

const TODAY = "2026-10-10";
const NOW = new Date("2026-10-10T04:00:00Z");
const config = DEFAULT_REMINDER_CONFIG; // 3 days before, repeat overdue every 7 days

const rec = (id: string, due: string, paid = 0, extra: Partial<ReminderRecord["people"] & object> = {}): ReminderRecord => ({
  id, amount_due: 37000, due_date: due,
  payments: paid ? [{ payment_amount: paid }] : [],
  people: { id: `p-${id}`, full_name: "Rahul Patil", mobile_number: "9876543210", is_archived: false, ...extra },
});
const msg = (record_id: string, message_type: string, status: string, daysAgo: number): PriorMessage => ({
  record_id, message_type, status, created_at: new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString(),
});
const plan = (records: ReminderRecord[], messages: PriorMessage[] = []) =>
  selectDueReminders({ records, messages, today: TODAY, now: NOW, config });

test("date helpers", () => {
  assert.equal(daysBetween("2026-10-10", "2026-10-13"), 3);
  assert.equal(addDays("2026-10-30", 3), "2026-11-02");
});

test("upcoming reminder only when due within the window", () => {
  const out = plan([rec("a", "2026-10-13"), rec("b", "2026-10-14"), rec("c", "2026-10-10")]);
  assert.deepEqual(out.map((p) => [p.recordId, p.type]), [["c", "upcoming_reminder"], ["a", "upcoming_reminder"]]);
});

test("overdue reminder for past due dates; paid and archived are skipped", () => {
  const out = plan([rec("a", "2026-10-01"), rec("paid", "2026-10-01", 37000), rec("old", "2026-10-01", 0, { is_archived: true })]);
  assert.deepEqual(out.map((p) => [p.recordId, p.type]), [["a", "overdue_reminder"]]);
});

test("message text is filled from the template with the real remaining amount", () => {
  const [p] = plan([rec("a", "2026-10-01", 5000)]);
  assert.match(p.text, /Hello Rahul Patil,/);
  assert.match(p.text, /₹32,000 was due on 01 Oct 2026\./);
});

test("duplicates: sent or pending inside the window blocks, older than the window does not", () => {
  assert.equal(plan([rec("a", "2026-10-01")], [msg("a", "overdue_reminder", "sent", 2)]).length, 0);
  assert.equal(plan([rec("a", "2026-10-01")], [msg("a", "overdue_reminder", "pending", 0)]).length, 0);
  assert.equal(plan([rec("a", "2026-10-01")], [msg("a", "overdue_reminder", "sent", 8)]).length, 1);
  assert.equal(plan([rec("a", "2026-10-13")], [msg("a", "upcoming_reminder", "sent", 1)]).length, 0);
});

test("a reminder of another type or for another record does not block", () => {
  assert.equal(plan([rec("a", "2026-10-01")], [msg("a", "upcoming_reminder", "sent", 1), msg("b", "overdue_reminder", "sent", 1)]).length, 1);
});

test("failed attempts are retried, but only up to 3 times per window", () => {
  const failed = (n: number) => Array.from({ length: n }, () => msg("a", "overdue_reminder", "failed", 1));
  assert.equal(plan([rec("a", "2026-10-01")], failed(2)).length, 1);
  assert.equal(plan([rec("a", "2026-10-01")], failed(3)).length, 0);
});

test("config: defaults, valid overrides, invalid values ignored; sending is off unless exactly 'true'", () => {
  assert.deepEqual(readReminderConfig({}), DEFAULT_REMINDER_CONFIG);
  assert.equal(readReminderConfig({ REMINDER_UPCOMING_DAYS: "5" }).upcomingDaysBefore, 5);
  assert.equal(readReminderConfig({ REMINDER_UPCOMING_DAYS: "-1", REMINDER_MAX_PER_RUN: "abc" }).maxPerRun, 50);
  assert.equal(getReminderStatus({}).enabled, false);
  assert.equal(getReminderStatus({ AUTO_REMINDERS_ENABLED: "yes" }).enabled, false);
  assert.equal(getReminderStatus({ AUTO_REMINDERS_ENABLED: "true" }).enabled, true);
});
