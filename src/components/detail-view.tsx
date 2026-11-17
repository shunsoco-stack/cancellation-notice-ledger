"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { calculate, deadlineFor, effectiveState, ruleLabel, statusFor } from "@/lib/notice";
import { addDays, displayDate, previousWeekday } from "@/lib/dates";
import { annualAmount, yen } from "@/lib/money";
import { decisions } from "@/lib/types";
import { useLedger } from "./ledger-provider";
import { CategoryBadge, StatusBadge } from "./contract-row";
import { ContractForm } from "./contract-form";
import { Procedure } from "./procedure";
import { PageHeading } from "./page-heading";

export function DetailView({ id }: { id: string }) {
  const { contracts, today, save, remove } = useLedger();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const c = contracts.find((item) => item.id === id);
  if (!c)
    return (
      <div className="empty-state">
        <h1>契約が見つかりません</h1>
        <p>削除済みか、このブラウザに保存されていない契約です。</p>
        <Link className="button" href="/contracts">
          契約一覧に戻る
        </Link>
      </div>
    );
  const n = calculate(c, today);
  const state = effectiveState(c, today);
  const historical = state === "解約申し出済み" || state === "解約済み";
  const expiry = historical && c.procedure.targetExpiry ? c.procedure.targetExpiry : n.expiry;
  const deadline = deadlineFor(expiry, c.rule);
  const recommended = previousWeekday(deadline);
  return (
    <>
      <Link className="back-link" href="/contracts">
        ← 契約一覧に戻る
      </Link>
      <PageHeading eyebrow="CONTRACT / DETAIL" title={c.name} description={c.provider}>
        <button className="button" onClick={() => setEditing(true)}>
          契約を編集
        </button>
      </PageHeading>
      <div className="detail-badges">
        <CategoryBadge category={c.category} />
        <StatusBadge status={statusFor(c, today)} />
        <span>{state}</span>
      </div>
      {n.missed && !historical && (
        <section className="missed-notice">
          <h2>今回は間に合いません</h2>
          <p>今回の期限は {displayDate(n.deadline)} でした。次に間に合う機会を確認してください。</p>
          <div>
            <span>
              次の満了日 <strong>{displayDate(n.nextExpiry)}</strong>
            </span>
            <span>
              次の申し出期限 <strong>{displayDate(n.nextDeadline)}</strong>
            </span>
          </div>
        </section>
      )}
      <div className="detail-metrics">
        <div>
          <span>{historical ? "申し出対象の期限" : "申し出期限"}</span>
          <strong>{displayDate(deadline)}</strong>
          <small>
            {historical
              ? state
              : n.missed
                ? `${Math.abs(n.remaining)}日超過`
                : `あと ${n.remaining} 日`}
          </small>
        </div>
        <div>
          <span>{historical ? "申し出対象の満了日" : "今回の満了日"}</span>
          <strong>{displayDate(expiry)}</strong>
          <small>更新日 {displayDate(addDays(expiry, 1))}</small>
        </div>
        <div>
          <span>年額換算</span>
          <strong>
            {yen(annualAmount(c))}
            <small>／年</small>
          </strong>
          <small>
            {yen(c.amount)}／{c.payment === "monthly" ? "月" : "年"}払い
          </small>
        </div>
      </div>
      {recommended && (
        <p className="weekend-note">
          期限が土日のため、前の平日 {displayDate(recommended)}{" "}
          までの申し出を推奨します。祝日は扱いません。
        </p>
      )}
      <div className="detail-columns">
        <div>
          <section className="panel">
            <h2>この契約、どうしますか？</h2>
            <p className="muted">判断を記録して、必要な手続きを進めましょう。</p>
            <div className="decision-options">
              {decisions.map((decision) => (
                <button
                  key={decision}
                  aria-pressed={c.decision === decision}
                  disabled={!!c.procedure.submittedOn || state === "解約済み"}
                  className={`button ${c.decision === decision ? "selected" : ""}`}
                  onClick={() => save({ ...c, decision })}
                >
                  {decision}
                </button>
              ))}
            </div>
            {!!c.procedure.submittedOn && (
              <p className="field-help">
                申し出済みの判断を変更するには、チェックリストの申し出日を解除してください。
              </p>
            )}
          </section>
          {(c.decision === "解約する" || !!c.procedure.submittedOn) && state !== "解約済み" && (
            <Procedure contract={c} />
          )}
          <section className="panel">
            <h2>契約の情報</h2>
            <dl className="info-list">
              <div>
                <dt>申し出方法</dt>
                <dd>
                  {c.method} · {c.methodNote || "メモなし"}
                </dd>
              </div>
              <div>
                <dt>担当者</dt>
                <dd>{c.owner || "未設定"}</dd>
              </div>
              <div>
                <dt>状態</dt>
                <dd>{state}</dd>
              </div>
              <div>
                <dt>契約期間</dt>
                <dd>
                  初回 {c.initialMonths}か月 / 自動更新 {c.renewalMonths}か月
                </dd>
              </div>
              <div>
                <dt>メモ</dt>
                <dd className="preserve-lines">{c.memo || "メモなし"}</dd>
              </div>
            </dl>
          </section>
        </div>
        <section className="panel calculation-panel">
          <div className="eyebrow">HOW IT IS CALCULATED</div>
          <h2>計算の内訳</h2>
          <ol className="calculation-timeline">
            <li>
              <span>契約開始日</span>
              <strong>{displayDate(c.start)}</strong>
              <small>初回期間 {c.initialMonths}か月</small>
            </li>
            <li>
              <span>満了日の列</span>
              <div className="expiry-history">
                {n.expiries.map((date, index) => (
                  <div key={date}>
                    {index === 0 ? "初回" : `更新 ${index}`}：{displayDate(date)}
                  </div>
                ))}
              </div>
              <small>開始日に合計期間を加算 → その前日</small>
            </li>
            <li>
              <span>今日以降で最初の満了日</span>
              <strong>{displayDate(n.expiry)}</strong>
            </li>
            <li>
              <span>申し出期限のルール</span>
              <strong>{ruleLabel(c.rule)}</strong>
            </li>
            <li className="timeline-result">
              <span>今回の申し出期限</span>
              <strong>{displayDate(n.deadline)}</strong>
            </li>
          </ol>
          <p className="field-help">
            月末に同じ日がない場合は、その月の末日に補正します。祝日・提供元の営業時間は計算に含めません。
          </p>
          {historical && (
            <p className="field-help">
              上の計算は現在の更新周期です。記録した申し出対象の満了日：{displayDate(expiry)}
            </p>
          )}
        </section>
      </div>
      <div className="delete-area">
        {deleting ? (
          <>
            <p>「{c.name}」を削除します。この操作は元に戻せません。</p>
            <button
              className="button danger-button"
              onClick={() => {
                remove(c.id);
                router.push("/contracts");
              }}
            >
              削除する
            </button>
            <button className="button" onClick={() => setDeleting(false)}>
              キャンセル
            </button>
          </>
        ) : (
          <button className="button subtle text-danger" onClick={() => setDeleting(true)}>
            この契約を削除
          </button>
        )}
      </div>
      {editing && <ContractForm contract={c} onClose={() => setEditing(false)} />}
    </>
  );
}
