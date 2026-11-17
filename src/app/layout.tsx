import type { Metadata } from "next";
import { LedgerProvider } from "@/components/ledger-provider";
import { Shell } from "@/components/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "解約通知期限帳",
  description:
    "自動更新の契約・サブスクの申し出期限を逆算。間に合う手続きと次の機会、節約見込みを整理する契約台帳。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <LedgerProvider>
          <Shell>{children}</Shell>
        </LedgerProvider>
      </body>
    </html>
  );
}
