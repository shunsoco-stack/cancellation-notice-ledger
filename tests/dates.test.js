import test from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  addMonths,
  daysBetween,
  isDate,
  monthEnd,
  previousWeekday,
  todayJapan,
} from "../src/lib/dates.ts";

for (const [start, months, expected] of [
  ["2025-01-31", 1, "2025-02-28"],
  ["2024-01-31", 1, "2024-02-29"],
  ["2024-02-29", 12, "2025-02-28"],
  ["2025-03-31", -1, "2025-02-28"],
  ["2025-12-31", 1, "2026-01-31"],
]) {
  test(`月加算 ${start} + ${months}`, () => assert.equal(addMonths(start, months), expected));
}
test("日加算は年をまたぐ", () => assert.equal(addDays("2025-12-31", 1), "2026-01-01"));
test("暦日差はうるう日を含む", () => assert.equal(daysBetween("2024-02-28", "2024-03-01"), 2));
test("月末を取得", () => assert.equal(monthEnd("2024-02-01"), "2024-02-29"));
test("日本時間の午前0時を境界とする", () => {
  assert.equal(todayJapan(new Date("2025-12-31T14:59:59Z")), "2025-12-31");
  assert.equal(todayJapan(new Date("2025-12-31T15:00:00Z")), "2026-01-01");
});
test("実在しない日付・形式を拒否", () => {
  for (const invalid of ["2025-02-29", "2025-04-31", "2025-1-1", "abc", null]) {
    assert.equal(isDate(invalid), false);
  }
  assert.equal(isDate("2024-02-29"), true);
});
test("土曜は金曜を推奨", () => assert.equal(previousWeekday("2025-03-01"), "2025-02-28"));
test("日曜は金曜を推奨", () => assert.equal(previousWeekday("2025-03-02"), "2025-02-28"));
test("平日は補正なし", () => assert.equal(previousWeekday("2025-03-03"), null));
