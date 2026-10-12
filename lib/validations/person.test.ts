import { test } from "node:test";
import assert from "node:assert/strict";
import { readPersonForm, validatePerson } from "./person.ts";

const form = (o: Record<string, string>) => {
  const fd = new FormData();
  Object.entries({ full_name: "Rahul Patil", mobile_number: "9876543210", ...o }).forEach(([k, v]) => fd.set(k, v));
  return readPersonForm(fd);
};

test("the three bank fields are optional", () => {
  assert.deepEqual(validatePerson(form({})), {});
  assert.equal(form({}).account_number, "");
});

test("account number stays text: leading zeros kept, spaces and dashes removed", () => {
  const v = form({ account_number: "0001 2345-6789" });
  assert.equal(v.account_number, "000123456789");
  assert.equal(typeof v.account_number, "string");
  assert.deepEqual(validatePerson(v), {});
});

test("account number must be 9 to 18 digits", () => {
  for (const bad of ["12345678", "1234567890123456789", "12ab34567890", "abcdefghijk"]) {
    assert.ok(validatePerson(form({ account_number: bad })).account_number, bad);
  }
  assert.deepEqual(validatePerson(form({ account_number: "123456789" })), {});
  assert.deepEqual(validatePerson(form({ account_number: "123456789012345678" })), {});
});

test("branch text limits", () => {
  assert.ok(validatePerson(form({ branch_name: "a".repeat(201) })).branch_name);
  assert.ok(validatePerson(form({ branch_location: "a".repeat(501) })).branch_location);
  assert.deepEqual(validatePerson(form({ branch_name: "Pune Main", branch_location: "FC Road, Pune" })), {});
});

test("error messages never contain the account number", () => {
  const errs = JSON.stringify(validatePerson(form({ account_number: "12ab34567890" })));
  assert.ok(!errs.includes("12ab34567890"));
});
