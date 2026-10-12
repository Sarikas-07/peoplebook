import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanSearchTerm } from "./search.ts";

test("removes characters that could change a filter", () => {
  assert.equal(cleanSearchTerm("a),mobile_number.ilike.%"), "a mobile_number.ilike.");
  assert.equal(cleanSearchTerm('x" or "1'), "x or 1");
});
test("keeps normal names and numbers, trims and limits length", () => {
  assert.equal(cleanSearchTerm("  Rahul   Patil "), "Rahul Patil");
  assert.equal(cleanSearchTerm("98765 43210"), "98765 43210");
  assert.equal(cleanSearchTerm(undefined), "");
  assert.equal(cleanSearchTerm("a".repeat(500)).length, 100);
});
