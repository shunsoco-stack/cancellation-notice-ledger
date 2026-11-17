import test from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/lib/seed.ts";
import { addDays, monthEnd } from "../src/lib/dates.ts";
import { calculate, statusFor } from "../src/lib/notice.ts";
import { annualAmount, totals } from "../src/lib/money.ts";
import { csvCell, generateCsv } from "../src/lib/csv.ts";
import { decodeStorage, isContract, validateData } from "../src/lib/storage.ts";
import { filterAndSort, homeGroups } from "../src/lib/contracts.ts";

const today = "2026-11-17";
const seed = createSeed(today);
const filters = { query: "", category: "", status: "", decision: "" };
for (const date of [
  "2026-11-17",
  "2026-01-31",
  "2024-02-29",
  "2025-12-31",
  "2026-04-01",
  "2025-02-28",
  "2026-11-23",
]) {
  test(`シードの件数・分布・検証 ${date}`, () => {
    const data = createSeed(date);
    assert.equal(data.length, 14);
    assert.equal(validateData(data), true);
    assert.equal(data.filter((c) => c.decision === "解約する").length, 3);
    const count = (status) => data.filter((c) => statusFor(c, date) === status).length;
    const inMonth = [10, 13].filter((offset) => addDays(date, offset) <= monthEnd(date)).length;
    assert.equal(count("期限切れ"), 2);
    assert.equal(count("7日以内"), 2);
    assert.equal(count("今月中"), inMonth);
    assert.equal(count("来月"), 3 + 2 - inMonth);
    assert.equal(count("それ以降"), 3);
    assert.equal(count("申し出済み"), 1);
    assert.equal(count("解約済み"), 1);
    assert.equal(new Set(data.map((c) => c.rule.kind)).size, 4);
  });
}
test("年額換算は月額の12倍・年額はそのまま", () => {
  assert.equal(annualAmount({ amount: 1000, payment: "monthly" }), 12000);
  assert.equal(annualAmount({ amount: 1000, payment: "yearly" }), 1000);
});
test("節約見込みと継続コストは解約済みを除外", () => {
  const money = totals(seed, today);
  assert.equal(money.count, 3);
  assert.equal(money.savings, (2480 + 3280 + 1980) * 12);
  assert.equal(
    money.active,
    seed.filter((c) => c.state !== "解約済み").reduce((s, c) => s + annualAmount(c), 0),
  );
});
test("CSVはBOM・CRLF付きで引用符と改行を保持", () => {
  const csv = generateCsv([{ ...seed[0], name: '架空,"台帳"\n改行' }], today);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.endsWith("\r\n"));
  assert.ok(csv.includes('"架空,""台帳""\n改行"'));
});
test("CSVの数式開始文字を無効化", () => {
  assert.equal(csvCell("=1+1"), '"\'=1+1"');
  assert.equal(csvCell("\t@sum(1)"), '"\'\t@sum(1)"');
});
test("種類・状態・判断・検索で絞り込み", () => {
  assert.equal(
    filterAndSort(
      seed,
      today,
      { ...filters, category: "サブスク", decision: "解約する", status: "7日以内", query: "会計" },
      "deadline",
    ).length,
    1,
  );
  assert.equal(
    filterAndSort(seed, today, { ...filters, query: "存在しない" }, "deadline").length,
    0,
  );
});
test("期限順・金額順・名称順の並べ替え", () => {
  const byDate = filterAndSort(seed, today, filters, "deadline");
  assert.deepEqual(
    byDate.map((c) => calculate(c, today).deadline),
    byDate.map((c) => calculate(c, today).deadline).toSorted(),
  );
  const byMoney = filterAndSort(seed, today, filters, "amount");
  assert.deepEqual(
    byMoney.map(annualAmount),
    byMoney.map(annualAmount).toSorted((a, b) => b - a),
  );
  const byName = filterAndSort(seed, today, filters, "name");
  assert.deepEqual(
    byName.map((c) => c.name),
    seed.map((c) => c.name).sort((a, b) => a.localeCompare(b, "ja")),
  );
});
test("ホームの3区分は重複せず申し出済みを含まない", () => {
  const groups = homeGroups(seed, today);
  const all = [...groups.current, ...groups.next, ...groups.missed];
  assert.equal(new Set(all.map((c) => c.id)).size, all.length);
  assert.equal(groups.missed.length, 2);
  assert.ok(!all.some((c) => c.state === "解約申し出済み"));
});
test("正常な保存データを復元・空配列も保存可能", () => {
  assert.deepEqual(decodeStorage(JSON.stringify(seed), today).contracts, seed);
  assert.deepEqual(decodeStorage("[]", today), { contracts: [], recovered: false });
});
for (const raw of ["{broken", "null", "{}", '[{"id":"bad"}]']) {
  test(`壊れた保存データを復旧 ${raw}`, () => {
    const loaded = decodeStorage(raw, today);
    assert.equal(loaded.recovered, true);
    assert.equal(loaded.contracts.length, 14);
  });
}
test("初回読み込みは復旧通知なし", () => assert.equal(decodeStorage(null, today).recovered, false));
test("不正な型・金額・周期・日付・ルール・重複IDを拒否", () => {
  for (const patch of [
    { amount: -1 },
    { amount: Infinity },
    { amount: 0.5 },
    { start: "2025-02-30" },
    { renewalMonths: 0 },
    { initialMonths: 121 },
    { rule: { kind: "days", value: -2 } },
    { rule: { kind: "renewal", value: 1 } },
    { id: "../bad" },
    { category: "保険" },
    { name: " " },
    { procedure: {} },
  ]) {
    assert.equal(isContract({ ...seed[0], ...patch }), false);
  }
  assert.equal(validateData([seed[0], seed[0]]), false);
});
test("不整合なチェックリストを拒否", () => {
  assert.equal(
    isContract({ ...seed[0], procedure: { ...seed[0].procedure, confirmed: true } }),
    false,
  );
});
