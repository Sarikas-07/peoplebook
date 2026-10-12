import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateRemaining, calculateStatus, calculateTotalPaid,
  isPaymentWithinRemaining, summarizePortfolio, summarizeRecord, summarizeRecords,
} from "./index.ts";

const rec = (due: number, dueDate: string, paid: number[], given = 30000) => ({
  id: "r", person_id: "p", amount_given: given, date_given: "2026-09-01",
  amount_due: due, due_date: dueDate, notes: null,
  payments: paid.map((payment_amount) => ({ payment_amount })),
});

test("total paid sums all payments", () => {
  assert.equal(calculateTotalPaid([{ payment_amount: 5000 }, { payment_amount: "10000" }, { payment_amount: 2000 }]), 17000);
  assert.equal(calculateTotalPaid([]), 0);
  assert.equal(calculateTotalPaid(null), 0);
});

test("remaining = due - paid and never negative", () => {
  assert.equal(calculateRemaining(37000, 17000), 20000);
  assert.equal(calculateRemaining(37000, 40000), 0);
  assert.equal(calculateRemaining(100.1, 0.2), 99.9);
});

test("TEST 4: Rs 37,000 due with Rs 5,000 paid is Active with Rs 32,000 remaining", () => {
  const s = summarizeRecord(rec(37000, "2999-01-01", [5000]));
  assert.deepEqual(s, { totalPaid: 5000, remaining: 32000, status: "Active" });
});

test("TEST 5: paying the rest makes the record Paid with Rs 0 remaining", () => {
  const s = summarizeRecord(rec(37000, "2999-01-01", [5000, 32000]));
  assert.deepEqual(s, { totalPaid: 37000, remaining: 0, status: "Paid" });
});

test("TEST 6: past due date with remaining amount is Overdue", () => {
  assert.equal(summarizeRecord(rec(37000, "2000-01-01", [5000])).status, "Overdue");
});

test("status boundaries", () => {
  assert.equal(calculateStatus(100, "2026-10-15", "2026-10-15"), "Active"); // due today is not overdue
  assert.equal(calculateStatus(100, "2026-10-15", "2026-10-16"), "Overdue");
  assert.equal(calculateStatus(0, "2000-01-01", "2026-10-16"), "Paid");     // paid wins over past due date
});

test("payment cannot exceed remaining", () => {
  assert.equal(isPaymentWithinRemaining(8000, 7000), false);
  assert.equal(isPaymentWithinRemaining(7000, 7000), true);
  assert.equal(isPaymentWithinRemaining(0, 7000), false);
  assert.equal(isPaymentWithinRemaining(-5, 7000), false);
  assert.equal(isPaymentWithinRemaining(100, 0), false);
});

test("person summary aggregates records and picks the most urgent status", () => {
  const s = summarizeRecords([rec(37000, "2999-01-01", [5000]), rec(10000, "2000-01-01", []), rec(5000, "2000-01-01", [5000])]);
  assert.equal(s.count, 3);
  assert.equal(s.due, 52000);
  assert.equal(s.paid, 10000);
  assert.equal(s.remaining, 42000);
  assert.equal(s.status, "Overdue");
  assert.equal(summarizeRecords([]).status, null);
  assert.equal(summarizeRecords([rec(5000, "2000-01-01", [5000])]).status, "Paid");
});

test("portfolio totals and status counts", () => {
  const p = summarizePortfolio([rec(37000, "2999-01-01", [5000]), rec(10000, "2000-01-01", []), rec(5000, "2000-01-01", [5000])]);
  assert.deepEqual(p, {
    given: 90000, due: 52000, received: 10000, remaining: 42000,
    activeRecords: 1, overdueRecords: 1, paidRecords: 1,
  });
});
