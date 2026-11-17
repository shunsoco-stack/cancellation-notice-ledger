"use client";

import { useState } from "react";
import { useLedger } from "./ledger-provider";
import { PageHeading } from "./page-heading";

export function AboutView() {
  const { reset } = useLedger();
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <PageHeading
        eyebrow="ABOUT THIS DEMO"
        title="このデモについて"
        description="契約の「満了」ではなく、「申し出るタイミング」を見える形に。"
      />
      <div className="about-grid">
        <section className="panel">
          <h2>解約通知期限帳とは</h2>
          <p>
            個人や小さな事務所が持つ、自動更新の契約・サブスク・リースの台帳です。
            申し出期限を逆算し、間に合う手続きと、過ぎてしまった場合の次の機会を整理します。
          </p>
          <p>
            「解約する」と判断した契約の年額換算を節約見込みとして表示。違約金・日割り・返金は含まない参考額です。
          </p>
        </section>
        <section className="panel">
          <h2>デモデータと保存先</h2>
          <p>
            デモ用の架空データです。すべての企業・サービス・担当者は架空で、実在の企業・サービス・個人とは無関係です。
          </p>
          <p>
            14件の初期データは初めて開いた日の日本時間を基準に生成。保存先はこのブラウザのlocalStorage（cnl:v1）のみで、端末間の同期はありません。
          </p>
          <p>月末など「7日以内を除く今月中」が存在しない場合、その例は来月へ繰り越します。</p>
        </section>
        <section className="panel span-two">
          <h2>計算ルール</h2>
          <ol className="rules-list">
            <li>
              <strong>満了日は、開始日に期間を足した日の前日。</strong>
              <p>
                2025年4月1日開始・12か月 →
                2026年3月31日満了。以後は開始日に「初回期間＋更新期間×更新回数」を加算し、その前日を求めます。
              </p>
            </li>
            <li>
              <strong>同じ日がないときは、その月の末日に補正。</strong>
              <p>
                1月31日＋1か月は2月28日（うるう年は29日）。満了日はさらにその前日です。毎回開始日から計算するため補正は累積しません。
              </p>
            </li>
            <li>
              <strong>4種類の申し出期限を逆算。</strong>
              <p>
                満了のNか月前の同日 / 満了のN日前 / 満了月のNか月前の月末 /
                次回更新日（請求日）の前日。更新日は満了日の翌日です。
              </p>
            </li>
            <li>
              <strong>期限当日は、まだ間に合う日。</strong>
              <p>
                残り0〜7日は「7日以内」。以降は「今月中」「来月」「それ以降」。翌日から「今回は間に合いません」。期限が今日以降になる最初の更新機会を案内します。
              </p>
            </li>
            <li>
              <strong>土日は、前の平日の申し出を推奨。</strong>
              <p>計算上の期限自体は変更しません。祝日・営業時間は扱いません。</p>
            </li>
            <li>
              <strong>手続き完了後、満了日に解約済みへ。</strong>
              <p>
                期限内の申し出・受付確認・必要な返却がそろうと、対象の満了日で「解約済み」と判定します。期限後の申し出は提供元への確認が必要です。
              </p>
            </li>
          </ol>
          <div className="info-strip">
            <p>実際の解約条件は各契約書で確認してください。通知送信・解約代行は行いません。</p>
          </div>
        </section>
        <section className="panel">
          <h2>扱わないもの</h2>
          <p>
            版管理・承認・監査ログ・契約書PDF・取引先マスタ、法定点検・車検・資格・免許・保険の満期、請求書・入金消込は対象外です。
          </p>
          <p>メール・プッシュ通知・カレンダー書き出し・外部連携はありません。</p>
        </section>
        <section className="panel reset-panel">
          <h2>既定データに戻す</h2>
          <p>保存した契約と判断を削除して、今日を基準に14件の架空データを再生成します。</p>
          {confirm ? (
            <div role="alert">
              <p>現在の変更は失われます。既定データに戻しますか？</p>
              <div className="button-row">
                <button
                  className="button danger-button"
                  onClick={() => {
                    reset();
                    setConfirm(false);
                  }}
                >
                  データを初期化する
                </button>
                <button className="button" onClick={() => setConfirm(false)}>
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <button className="button" onClick={() => setConfirm(true)}>
              既定データに戻す
            </button>
          )}
        </section>
      </div>
    </>
  );
}
