import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_TEMPLATES, renderTemplate } from "./templates.ts";

test("payment confirmation fills every placeholder with Indian-formatted amounts", () => {
  const text = renderTemplate(DEFAULT_TEMPLATES.payment_confirmation, {
    person_name: "Rahul Patil", payment_amount: 5000, total_paid: 150000, remaining_amount: 32000,
  });
  assert.match(text, /^Hello Rahul Patil,/);
  assert.match(text, /payment of ₹5,000\./);
  assert.match(text, /Total amount paid: ₹1,50,000\./);
  assert.match(text, /Remaining amount: ₹32,000\./);
  assert.doesNotMatch(text, /\{/);
});

test("reminders use the formatted due date; missing values stay visible", () => {
  const up = renderTemplate(DEFAULT_TEMPLATES.upcoming_reminder, { person_name: "A", remaining_amount: 32000, due_date: "15 Oct 2026" });
  assert.match(up, /₹32,000 is due on 15 Oct 2026\./);
  assert.match(renderTemplate(DEFAULT_TEMPLATES.overdue_reminder, { person_name: "A" }), /\{remaining_amount\}/);
});
