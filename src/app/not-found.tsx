import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>ページが見つかりません</h1>
      <Link className="button" href="/">
        手続きリストへ戻る
      </Link>
    </div>
  );
}
