"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { displayDate } from "@/lib/dates";
import { Icon } from "./icon";
import { useLedger } from "./ledger-provider";

const navigation = [
  { href: "/", label: "今月・来月の手続き", short: "手続き", icon: "home" },
  { href: "/contracts", label: "契約一覧", short: "契約一覧", icon: "list" },
  { href: "/timeline", label: "申し出期限の年表", short: "年表", icon: "timeline" },
  { href: "/about", label: "このデモについて", short: "このデモ", icon: "info" },
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { today, ready, message, dismiss } = useLedger();
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        本文へ移動
      </a>
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-icon">
            <Icon name="book" size={25} />
          </span>
          <span>
            解約通知期限帳<small>NOTICE LEDGER</small>
          </span>
        </Link>
        <div className="workspace-label">
          わたしの契約台帳 <span>DEMO</span>
        </div>
        <nav aria-label="メインナビゲーション">
          {navigation.map((item) => {
            const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "nav-item active" : "nav-item"}
                aria-current={active ? "page" : undefined}
              >
                <Icon name={item.icon} />
                <span className="desktop-label">{item.label}</span>
                <span className="mobile-label">{item.short}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <span className="tiny-dot" /> このブラウザに保存
          <p>
            契約を見直す、小さな習慣。
            <br />
            次の更新の前に、ひと呼吸。
          </p>
          <span className="sidebar-rule" />
          <small>解約の手続きはご自身で行ってください。</small>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>暮らしと仕事の、契約を整える。</span>
          <div>
            <span className="demo-badge">架空データのデモ</span>
            <time dateTime={today || undefined}>
              {ready ? `${displayDate(today)}（日本時間）` : "読み込み中"}
            </time>
          </div>
        </header>
        <main id="main">
          {message && (
            <div className="toast" role="status">
              <span>{message}</span>
              <button onClick={dismiss} aria-label="通知を閉じる">
                ×
              </button>
            </div>
          )}
          {ready ? (
            children
          ) : (
            <div className="loading" role="status">
              契約台帳を準備しています…
            </div>
          )}
        </main>
        <footer>
          デモ用の架空データです <span>·</span> データはこのブラウザのみに保存されます
        </footer>
      </div>
    </div>
  );
}
