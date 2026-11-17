"use client";

import Link from "next/link";
import { addMonths, displayDate } from "@/lib/dates";
import { deadlineEvents } from "@/lib/notice";
import { annualAmount, yen } from "@/lib/money";
import { useLedger } from "./ledger-provider";
import { PageHeading } from "./page-heading";
import { CategoryBadge } from "./contract-row";

export function TimelineView() {
  const { contracts, today } = useLedger();
  const events = deadlineEvents(contracts, today);
  const months = Array.from({ length: 12 }, (_, i) => addMonths(`${today.slice(0, 7)}-01`, i));
  return (
    <>
      <PageHeading
        eyebrow="LOOK AHEAD / 12 MONTHS"
        title="申し出期限の年表"
        description="今月から12か月先まで。更新のたびに訪れる、契約を見直す機会。"
      />
      <div className="info-strip">
        <p>
          申し出済み・解約済みを除いて、各更新の期限を表示します。月単位の更新は複数回登場します。
        </p>
      </div>
      <div className="annual-timeline">
        {months.map((month, index) => {
          const items = events.filter((e) => e.deadline.slice(0, 7) === month.slice(0, 7));
          return (
            <section className="month-section" key={month}>
              <div className="month-label">
                <span>{month.slice(0, 4)}</span>
                <h2>
                  {Number(month.slice(5, 7))}
                  <small>月</small>
                </h2>
                {index === 0 && <span className="badge calm">今月</span>}
              </div>
              <div className="month-content">
                {items.length ? (
                  items.map(({ contract: c, deadline, expiry }) => (
                    <Link
                      href={`/contracts/${c.id}`}
                      className="timeline-event"
                      key={`${c.id}-${expiry}`}
                    >
                      <div className={`event-day ${deadline < today ? "text-danger" : ""}`}>
                        <strong>{Number(deadline.slice(8))}</strong>
                        <span>日まで</span>
                      </div>
                      <div>
                        <h3>{c.name}</h3>
                        <CategoryBadge category={c.category} />
                        <p>
                          満了 {displayDate(expiry)} · {c.method}で申し出
                          {deadline < today ? " · 期限超過" : ""}
                        </p>
                      </div>
                      <strong className="event-cost">
                        {yen(annualAmount(c))}
                        <small>／年</small>
                      </strong>
                      <span aria-hidden="true">↗</span>
                    </Link>
                  ))
                ) : (
                  <div className="month-empty">申し出期限はありません</div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
