"use client";

import Link from "next/link";
import { useState } from "react";
import { homeGroups } from "@/lib/contracts";
import { totals, yen } from "@/lib/money";
import { downloadCsv } from "@/lib/csv";
import { ContractRow } from "./contract-row";
import { ContractForm } from "./contract-form";
import { Icon } from "./icon";
import { PageHeading } from "./page-heading";
import { useLedger } from "./ledger-provider";

export function HomeView() {
  const { contracts, today } = useLedger();
  const [adding, setAdding] = useState(false);
  const groups = homeGroups(contracts, today);
  const money = totals(contracts, today);
  const sections = [
    {
      title: "今月申し出期限",
      subtitle: "今月のうちに、次の更新を見直しましょう。",
      items: groups.current,
      tone: "green",
      number: "01",
    },
    {
      title: "来月申し出期限",
      subtitle: "少し先の手続きも、早めに準備。",
      items: groups.next,
      tone: "blue",
      number: "02",
    },
    {
      title: "今回は間に合わないもの",
      subtitle: "次の機会を確認して、次回の更新に備えましょう。",
      items: groups.missed,
      tone: "red",
      number: "03",
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="YOUR NEXT STEP"
        title="今月・来月の手続き"
        description="更新される前に、続けるか、手放すか。申し出期限から考える契約台帳。"
      >
        <button className="button primary" onClick={() => setAdding(true)}>
          <Icon name="plus" />
          契約を追加
        </button>
      </PageHeading>
      <div className="summary-grid">
        <section className="summary-card savings">
          <div className="card-caption">
            <span>解約した場合の節約見込み</span>
            <Icon name="arrow" />
          </div>
          <div className="big-money">
            {yen(money.savings)}
            <span>／年</span>
          </div>
          <p>
            <span className="light-chip">{money.count}件を見直し</span>
            「解約する」にした契約の年額換算
          </p>
        </section>
        <section className="summary-card">
          <div className="card-caption">
            継続中の契約コスト
            <Icon name="book" />
          </div>
          <div className="big-money">
            {yen(money.active)}
            <span>／年</span>
          </div>
          <p>解約予定を含む・解約済みを除く</p>
        </section>
        <section className="summary-card action-summary">
          <div className="card-caption">
            今月の申し出期限
            <Icon name="clock" />
          </div>
          <div className="big-money">
            {groups.current.length}
            <span>件</span>
          </div>
          <p>
            <span className="tiny-dot" /> 期限内の契約を表示しています
          </p>
        </section>
      </div>
      <div className="info-strip">
        <Icon name="info" />
        <p>
          見ているのは<strong>「解約の申し出期限」</strong>です。
          契約の満了日より前に、手続きが必要な場合があります。
        </p>
        <Link href="/about">
          計算ルール <span>↗</span>
        </Link>
      </div>
      <div className="list-toolbar">
        <span>
          手続きリスト <small>期限が近い順</small>
        </span>
        <button
          className="button subtle"
          onClick={() =>
            downloadCsv(
              [...groups.current, ...groups.next, ...groups.missed],
              today,
              "手続きリスト",
            )
          }
        >
          <Icon name="download" size={17} />
          CSVダウンロード
        </button>
      </div>
      {sections.map((section) => (
        <section className={`deadline-section ${section.tone}`} key={section.number}>
          <div className="section-heading">
            <div className="section-number">{section.number}</div>
            <div>
              <h2>
                {section.title}
                <span className="count">{section.items.length}</span>
              </h2>
              <p>{section.subtitle}</p>
            </div>
          </div>
          <div className="contract-list">
            {section.items.length ? (
              section.items.map((c) => <ContractRow key={c.id} contract={c} today={today} />)
            ) : (
              <div className="empty-state">この期間に対象の契約はありません。</div>
            )}
          </div>
        </section>
      ))}
      <div className="end-note">
        先の予定も、ひと目で。
        <Link href="/timeline">
          12か月の年表を見る <Icon name="arrow" size={16} />
        </Link>
      </div>
      {adding && <ContractForm onClose={() => setAdding(false)} />}
    </>
  );
}
