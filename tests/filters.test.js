import test from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/lib/seed.ts";
import { filterAndSort } from "../src/lib/contracts.ts";

test("見直し中の契約状態で絞り込み", () => {
  const today = "2026-11-17";
  const result = filterAndSort(
    createSeed(today),
    today,
    { query: "", category: "", decision: "", status: "見直し中" },
    "deadline",
  );
  assert.deepEqual(
    result.map((c) => c.id),
    ["cloud-books"],
  );
});

test("申し出済みシードは解約する判断と対象満了日を保持", () => {
  const today = "2026-11-17";
  const result = filterAndSort(
    createSeed(today),
    today,
    { query: "", category: "", decision: "解約する", status: "解約申し出済み" },
    "deadline",
  );
  assert.equal(result.length, 1);
  assert.ok(result[0].procedure.targetExpiry);
});
