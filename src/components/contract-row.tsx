import Link from "next/link";
import { categories } from "@/lib/types";
import type { Contract, Status } from "@/lib/types";
import { calculate, statusFor } from "@/lib/notice";
import { displayDate } from "@/lib/dates";
import { annualAmount, yen } from "@/lib/money";
import { Icon } from "./icon";

export function StatusBadge({ status }: { status: Status }) {
  const tone =
    status === "期限切れ"
      ? "danger"
      : status === "7日以内"
        ? "warning"
        : status === "申し出済み" || status === "解約済み"
          ? "neutral"
          : "calm";
  return (
    <span className={`badge ${tone}`}>
      <span className="tiny-dot" />
      {status}
    </span>
  );
}

export function CategoryBadge({ category }: { category: Contract["category"] }) {
  return <span className={`category category-${categories.indexOf(category)}`}>{category}</span>;
}

export function ContractRow({ contract: c, today }: { contract: Contract; today: string }) {
  const n = calculate(c, today);
  const status = statusFor(c, today);
  const inactive = status === "申し出済み" || status === "解約済み";
  return (
    <Link href={`/contracts/${c.id}`} className="contract-row">
      <div className={`contract-symbol category-${categories.indexOf(c.category)}`}>
        <Icon name={c.category === "サブスク" ? "list" : "book"} size={22} />
      </div>
      <div className="contract-title">
        <div className="row-title">{c.name}</div>
        <div className="row-subtitle">
          <CategoryBadge category={c.category} />
          <span>{c.decision === "未定" ? c.provider : c.decision}</span>
        </div>
      </div>
      <div className="row-deadline">
        <span className="meta-label">申し出期限</span>
        <strong>{displayDate(n.deadline)}</strong>
        <StatusBadge status={status} />
      </div>
      <div className={`remaining ${n.missed && !inactive ? "overdue" : ""}`}>
        {inactive ? (
          <span className="finished-label">{status}</span>
        ) : (
          <>
            <small>{n.missed ? "期限から" : "あと"}</small>
            <strong>{Math.abs(n.remaining)}</strong>
            <small>日{n.missed ? "超過" : ""}</small>
          </>
        )}
      </div>
      <div className="row-cost">
        <strong>
          {yen(annualAmount(c))}
          <small>／年</small>
        </strong>
        <span>{c.method}で申し出</span>
      </div>
      <Icon name="arrow" size={17} />
    </Link>
  );
}
