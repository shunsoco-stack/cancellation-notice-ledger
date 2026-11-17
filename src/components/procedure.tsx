"use client";

import { calculate, deadlineFor, procedureComplete, submissionOnTime } from "@/lib/notice";
import { displayDate } from "@/lib/dates";
import type { Contract } from "@/lib/types";
import { useLedger } from "./ledger-provider";

export function Procedure({ contract: c }: { contract: Contract }) {
  const { today, save } = useLedger();
  const p = c.procedure;
  const n = calculate(c, today);
  const onTime = submissionOnTime(c);
  function update(patch: Partial<Contract["procedure"]>) {
    const procedure = { ...p, ...patch };
    save({ ...c, procedure, state: procedure.submittedOn ? "解約申し出済み" : "見直し中" });
  }
  return (
    <section className="panel procedure-panel">
      <h2>手続きチェックリスト</h2>
      <p className="muted">
        {c.method}での申し出 · {c.methodNote || "方法のメモはありません"}
      </p>
      <div className="checklist">
        <label>
          <input
            type="checkbox"
            checked={p.methodChecked}
            onChange={(e) =>
              update({
                methodChecked: e.target.checked,
                submittedOn: "",
                targetExpiry: "",
                confirmed: false,
                returned: false,
              })
            }
          />
          <span>
            <strong>01 申し出方法を確認</strong>
            <small>窓口・必要書類・返却条件を確認します。</small>
          </span>
        </label>
        <div className={`checklist-step ${!p.methodChecked ? "disabled" : ""}`}>
          <span className="step-check">{p.submittedOn ? "✓" : "02"}</span>
          <div>
            <strong>申し出た（日付）</strong>
            <label className="date-label">
              申し出対象の満了日
              <select
                disabled={!p.methodChecked || !!p.submittedOn}
                value={p.targetExpiry || n.nextExpiry}
                onChange={(e) => update({ targetExpiry: e.target.value })}
              >
                {[...new Set([p.targetExpiry, n.expiry, n.nextExpiry].filter(Boolean))].map(
                  (date) => (
                    <option key={date} value={date}>
                      {displayDate(date)}（期限 {displayDate(deadlineFor(date, c.rule))}）
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="date-label">
              申し出日
              <input
                type="date"
                disabled={!p.methodChecked}
                max={today}
                min={c.start < today ? c.start : undefined}
                value={p.submittedOn}
                onChange={(e) => {
                  if (e.target.value && (e.target.value > today || e.target.value < c.start))
                    return;
                  update({
                    submittedOn: e.target.value,
                    targetExpiry: p.targetExpiry || n.nextExpiry,
                    confirmed: false,
                    returned: false,
                  });
                }}
              />
            </label>
            {onTime !== null && (
              <p className={onTime ? "text-success" : "text-danger"}>
                {onTime
                  ? "✓ 申し出日は期限内です"
                  : "期限を過ぎています。提供元に受付可否を確認してください。"}
              </p>
            )}
          </div>
        </div>
        <label>
          <input
            type="checkbox"
            disabled={!p.submittedOn}
            checked={p.confirmed}
            onChange={(e) => update({ confirmed: e.target.checked, returned: false })}
          />
          <span>
            <strong>03 受付・確認の連絡を受け取った</strong>
            <small>解約日と受付内容を確認します。</small>
          </span>
        </label>
        <label>
          <input
            type="checkbox"
            disabled={!p.confirmed || !p.returnRequired}
            checked={p.returned}
            onChange={(e) => update({ returned: e.target.checked })}
          />
          <span>
            <strong>04 返却物があれば返却</strong>
            <small>
              {p.returnRequired
                ? "機器などの返却を完了します。"
                : "返却物なし・この手順は不要です。"}
            </small>
          </span>
        </label>
      </div>
      {procedureComplete(c) && (
        <div className="success-note">
          手続き完了。{displayDate(p.targetExpiry)} の満了日で「解約済み」になります。
        </div>
      )}
      {onTime === false && (
        <p className="field-help">
          期限後の申し出は自動で解約済みになりません。受付内容を確認し、必要に応じて状態を編集してください。
        </p>
      )}
    </section>
  );
}
