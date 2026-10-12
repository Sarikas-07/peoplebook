import { test } from "node:test";
import assert from "node:assert/strict";
import { toCsv } from "./csv.ts";

test("escapes commas, quotes and newlines", () => {
  assert.equal(toCsv(["A", "B"], [["Patil, Rahul", 'say "hi"']]), 'A,B\r\n"Patil, Rahul","say ""hi"""');
});

test("neutralises spreadsheet formulas but keeps numbers", () => {
  assert.equal(toCsv(["A"], [["=SUM(A1)"], ["+91"], [5000]]), "A\r\n'=SUM(A1)\r\n'+91\r\n5000");
});
