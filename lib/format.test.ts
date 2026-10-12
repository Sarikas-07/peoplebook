import { test } from "node:test";
import assert from "node:assert/strict";
import { maskAccountNumber } from "./format.ts";

test("only the last four digits of an account number are shown", () => {
  assert.equal(maskAccountNumber("000123456789"), "XXXXXX6789");
  assert.equal(maskAccountNumber("123456789"), "XXXXXX6789");
  assert.ok(!maskAccountNumber("000123456789").includes("0001"));
});

test("missing or too-short values show a dash", () => {
  assert.equal(maskAccountNumber(null), "—");
  assert.equal(maskAccountNumber(undefined), "—");
  assert.equal(maskAccountNumber(""), "—");
  assert.equal(maskAccountNumber("12"), "—");
});
