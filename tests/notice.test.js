import test from "node:test";
import assert from "node:assert/strict";
import { emptyContract } from "../src/lib/seed.ts";
import {
  calculate,
  deadlineEvents,
  deadlineFor,
  effectiveState,
  expiryAt,
  procedureComplete,
  statusFor,
  submissionOnTime,
} from "../src/lib/notice.ts";

function sample() {
  return { ...emptyContract("2025-04-01"), id: "test", name: "テスト", provider: "架空" };
}
test("開始日＋期間の前日が初回満了日", () => assert.equal(expiryAt(sample(), 0), "2026-03-31"));
test("満了日は開始日起点で計算し月末補正を累積しない", () => {
  const c = { ...sample(), start: "2025-01-31", initialMonths: 1, renewalMonths: 1 };
  assert.equal(expiryAt(c, 0), "2025-02-27");
  assert.equal(expiryAt(c, 1), "2025-03-30");
  assert.equal(expiryAt(c, 2), "2025-04-29");
});
test("満了当日は今回の満了日", () =>
  assert.equal(calculate(sample(), "2026-03-31").expiry, "2026-03-31"));
test("満了翌日は自動更新され履歴を保持", () => {
  assert.deepEqual(calculate(sample(), "2026-04-01").expiries, ["2026-03-31", "2027-03-31"]);
});
for (const [kind, value, expected] of [
  ["months", 1, "2026-02-28"],
  ["days", 30, "2026-03-01"],
  ["monthEnd", 1, "2026-02-28"],
  ["renewal", 0, "2026-03-31"],
]) {
  test(`期限ルール ${kind}`, () =>
    assert.equal(deadlineFor("2026-03-31", { kind, value }), expected));
}
test("月末ルールは満了日の日にちに依存しない", () => {
  assert.equal(deadlineFor("2024-03-10", { kind: "monthEnd", value: 1 }), "2024-02-29");
});
test("期限当日は間に合い、翌日は次の機会を表示", () => {
  const c = sample();
  assert.equal(calculate(c, "2026-02-28").missed, false);
  const late = calculate(c, "2026-03-01");
  assert.equal(late.missed, true);
  assert.equal(late.nextExpiry, "2027-03-31");
  assert.equal(late.nextDeadline, "2027-02-28");
});
test("通知期間が更新期間を超える場合も最初に間に合う機会へ進む", () => {
  const c = { ...sample(), initialMonths: 1, renewalMonths: 1, rule: { kind: "months", value: 3 } };
  const n = calculate(c, "2025-05-01");
  assert.equal(n.nextDeadline >= "2025-05-01", true);
  assert.equal(n.nextExpiry, "2025-08-31");
});
for (const [today, status] of [
  ["2026-03-01", "期限切れ"],
  ["2026-02-28", "7日以内"],
  ["2026-02-21", "7日以内"],
  ["2026-02-20", "今月中"],
  ["2026-01-31", "来月"],
  ["2025-12-31", "それ以降"],
]) {
  test(`状態境界 ${today} → ${status}`, () => assert.equal(statusFor(sample(), today), status));
}
test("申し出済み・解約済みは期限判定より優先", () => {
  assert.equal(statusFor({ ...sample(), state: "解約申し出済み" }, "2026-03-01"), "申し出済み");
  assert.equal(statusFor({ ...sample(), state: "解約済み" }, "2026-03-01"), "解約済み");
});
test("申し出日は保存した満了日と照合し更新をまたいでも変わらない", () => {
  const c = sample();
  c.procedure.submittedOn = "2026-02-28";
  c.procedure.targetExpiry = "2026-03-31";
  assert.equal(submissionOnTime(c), true);
  calculate(c, "2028-06-01");
  assert.equal(submissionOnTime(c), true);
  c.procedure.submittedOn = "2026-03-01";
  assert.equal(submissionOnTime(c), false);
});
test("未申し出は判定なし", () => assert.equal(submissionOnTime(sample()), null));
test("全手続き完了後、満了日で解約済み", () => {
  const c = sample();
  c.decision = "解約する";
  c.procedure = {
    methodChecked: true,
    submittedOn: "2026-02-27",
    confirmed: true,
    returnRequired: true,
    returned: false,
    targetExpiry: "2026-03-31",
  };
  assert.equal(procedureComplete(c), false);
  c.procedure.returned = true;
  assert.equal(procedureComplete(c), true);
  assert.equal(effectiveState(c, "2026-03-30"), "解約申し出済み");
  assert.equal(effectiveState(c, "2026-03-31"), "解約済み");
});
test("期限後の申し出を自動で解約済みにしない", () => {
  const c = sample();
  c.decision = "解約する";
  c.procedure = {
    methodChecked: true,
    submittedOn: "2026-03-01",
    confirmed: true,
    returnRequired: false,
    returned: false,
    targetExpiry: "2026-03-31",
  };
  assert.equal(effectiveState(c, "2026-04-01"), "解約申し出済み");
});
test("年表は今月から12か月、毎月更新も列挙", () => {
  const c = {
    ...sample(),
    start: "2025-01-01",
    initialMonths: 1,
    renewalMonths: 1,
    rule: { kind: "renewal", value: 0 },
  };
  const events = deadlineEvents([c], "2025-01-15");
  assert.equal(events.length, 12);
  assert.equal(events[0].deadline, "2025-01-31");
  assert.equal(events.at(-1).deadline, "2025-12-31");
  assert.equal(deadlineEvents([{ ...c, state: "解約済み" }], "2025-01-15").length, 0);
});
