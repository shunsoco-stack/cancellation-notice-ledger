"use client";

import { useEffect, useRef, useState } from "react";
import { categories, methods, states } from "@/lib/types";
import type { Contract, RuleKind } from "@/lib/types";
import { emptyContract } from "@/lib/seed";
import { isContract } from "@/lib/storage";
import { calculate } from "@/lib/notice";
import { displayDate, previousWeekday } from "@/lib/dates";
import { useLedger } from "./ledger-provider";

export function ContractForm({ contract, onClose }: { contract?: Contract; onClose: () => void }) {
  const { today, save } = useLedger();
  const [draft, setDraft] = useState<Contract>(() => contract ?? emptyContract(today));
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  function update<K extends keyof Contract>(key: K, value: Contract[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }
  const previewValid = isContract({
    ...draft,
    id: draft.id || "preview",
    name: draft.name || "仮",
    provider: draft.provider || "仮",
  });
  const preview = previewValid ? calculate(draft, today) : null;
  const recommended = preview ? previousWeekday(preview.deadline) : null;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next = {
      ...draft,
      id: draft.id || crypto.randomUUID(),
      name: draft.name.trim(),
      provider: draft.provider.trim(),
    };
    if (!isContract(next)) {
      setError("入力内容を確認してください。名称・提供元は必須、料金は0以上の整数です。");
      return;
    }
    if (next.state === "解約申し出済み" && !next.procedure.submittedOn) {
      setError("先に詳細画面のチェックリストで申し出日を記録してください。");
      return;
    }
    save(next);
    onClose();
  }

  return (
    <dialog ref={dialog} className="form-dialog" onCancel={onClose} aria-labelledby="form-title">
      <form onSubmit={submit}>
        <div className="dialog-heading">
          <div>
            <div className="eyebrow">CONTRACT DETAILS</div>
            <h2 id="form-title">{contract ? "契約を編集" : "契約を追加"}</h2>
          </div>
          <button
            className="close-button"
            type="button"
            onClick={onClose}
            aria-label="フォームを閉じる"
          >
            ×
          </button>
        </div>
        <p className="form-intro">
          契約書の条件を確認しながら入力してください。<span>＊ 必須</span>
        </p>
        <fieldset>
          <legend>01 基本情報</legend>
          <div className="form-grid">
            <label className="span-two">
              名称 ＊
              <input
                autoFocus
                required
                maxLength={100}
                value={draft.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="例：クラウド会計 ベーシック"
              />
            </label>
            <label>
              提供元（架空）＊
              <input
                required
                maxLength={100}
                value={draft.provider}
                onChange={(e) => update("provider", e.target.value)}
                placeholder="例：こもれびソフト（架空）"
              />
            </label>
            <label>
              種類
              <select
                value={draft.category}
                onChange={(e) => update("category", e.target.value as Contract["category"])}
              >
                {categories.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              料金（円）＊
              <input
                type="number"
                min={0}
                max={1_000_000_000}
                step={1}
                required
                value={Number.isFinite(draft.amount) ? draft.amount : ""}
                onChange={(e) => update("amount", e.target.valueAsNumber)}
              />
            </label>
            <label>
              支払周期
              <select
                value={draft.payment}
                onChange={(e) => update("payment", e.target.value as Contract["payment"])}
              >
                <option value="monthly">月額</option>
                <option value="yearly">年額</option>
              </select>
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>02 契約期間と申し出期限</legend>
          <div className="form-grid">
            <label>
              契約開始日 ＊
              <input
                type="date"
                min="1900-01-01"
                max="2200-12-31"
                required
                value={draft.start}
                onChange={(e) => update("start", e.target.value)}
              />
            </label>
            <label>
              初回契約期間（月）＊
              <input
                type="number"
                min={1}
                max={120}
                required
                value={Number.isFinite(draft.initialMonths) ? draft.initialMonths : ""}
                onChange={(e) => update("initialMonths", e.target.valueAsNumber)}
              />
            </label>
            <label>
              自動更新の期間（月）＊
              <input
                type="number"
                min={1}
                max={120}
                required
                value={Number.isFinite(draft.renewalMonths) ? draft.renewalMonths : ""}
                onChange={(e) => update("renewalMonths", e.target.valueAsNumber)}
              />
            </label>
            <label>
              申し出期限のルール
              <select
                value={draft.rule.kind}
                onChange={(e) =>
                  update("rule", {
                    kind: e.target.value as RuleKind,
                    value: e.target.value === "renewal" ? 0 : 1,
                  })
                }
              >
                <option value="months">満了のNか月前の同日まで</option>
                <option value="days">満了のN日前まで</option>
                <option value="monthEnd">満了月のNか月前の月末まで</option>
                <option value="renewal">次回更新日（請求日）の前日まで</option>
              </select>
            </label>
            {draft.rule.kind !== "renewal" && (
              <label>
                N（{draft.rule.kind === "days" ? "日" : "か月"}）＊
                <input
                  type="number"
                  min={1}
                  max={draft.rule.kind === "days" ? 3650 : 120}
                  required
                  value={Number.isFinite(draft.rule.value) ? draft.rule.value : ""}
                  onChange={(e) => update("rule", { ...draft.rule, value: e.target.valueAsNumber })}
                />
              </label>
            )}
          </div>
          <p className="field-help">
            満了日＝開始日に契約期間を足した日の前日。更新日（請求日）＝満了日の翌日。
          </p>
          <div className="calculation-preview" aria-live="polite">
            <div className="eyebrow">入力内容から自動計算</div>
            {preview ? (
              <>
                <div className="preview-grid">
                  <div>
                    <span>次回満了日</span>
                    <strong>{displayDate(preview.expiry)}</strong>
                  </div>
                  <div>
                    <span>申し出期限</span>
                    <strong>{displayDate(preview.deadline)}</strong>
                  </div>
                  <div>
                    <span>{preview.missed ? "期限超過" : "残り日数"}</span>
                    <strong>{Math.abs(preview.remaining)}日</strong>
                  </div>
                </div>
                {preview.missed && (
                  <p className="text-danger">
                    今回は間に合いません。次の期限：{displayDate(preview.nextDeadline)}
                  </p>
                )}
                {recommended && (
                  <p>
                    土日のため、前の平日 {displayDate(recommended)}{" "}
                    までの申し出を推奨。祝日は扱いません。
                  </p>
                )}
              </>
            ) : (
              <p>日付・期間・ルールを正しく入力するとプレビューされます。</p>
            )}
          </div>
        </fieldset>
        <fieldset>
          <legend>03 手続きとメモ</legend>
          <div className="form-grid">
            <label>
              申し出方法
              <select
                value={draft.method}
                onChange={(e) => update("method", e.target.value as Contract["method"])}
              >
                {methods.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              担当者
              <input
                maxLength={100}
                value={draft.owner}
                onChange={(e) => update("owner", e.target.value)}
              />
            </label>
            <label className="span-two">
              申し出方法のメモ
              <textarea
                maxLength={3000}
                rows={2}
                value={draft.methodNote}
                onChange={(e) => update("methodNote", e.target.value)}
                placeholder="窓口や必要な書類など"
              />
            </label>
            <label>
              状態
              <select
                value={draft.state}
                onChange={(e) => update("state", e.target.value as Contract["state"])}
              >
                {states.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={draft.procedure.returnRequired}
                onChange={(e) =>
                  update("procedure", { ...draft.procedure, returnRequired: e.target.checked })
                }
              />
              返却物がある
            </label>
            <label className="span-two">
              メモ
              <textarea
                maxLength={3000}
                rows={3}
                value={draft.memo}
                onChange={(e) => update("memo", e.target.value)}
              />
            </label>
          </div>
        </fieldset>
        {contract?.procedure.submittedOn && (
          <p className="field-help">
            申し出済みの対象満了日は保持されます。条件を編集すると期限内判定を再計算します。
          </p>
        )}
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button" onClick={onClose}>
            キャンセル
          </button>
          <button className="button primary" type="submit">
            {contract ? "変更を保存" : "契約を登録"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
