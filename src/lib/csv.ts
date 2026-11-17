import { annualAmount } from "./money.ts";
import { calculate, statusFor } from "./notice.ts";
import type { Contract } from "./types.ts";

export function csvCell(value: string | number): string {
  let text = String(value);
  // Neutralize spreadsheet formulas in user-authored fields.
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function generateCsv(contracts: Contract[], today: string): string {
  const rows: (string | number)[][] = [
    [
      "名称",
      "提供元",
      "種類",
      "申し出期限",
      "満了日",
      "残り日数",
      "状態",
      "判断",
      "申し出方法",
      "方法メモ",
      "年額換算",
      "担当者",
      "申し出日",
      "次の機会の期限",
    ],
  ];
  for (const c of contracts) {
    const n = calculate(c, today);
    rows.push([
      c.name,
      c.provider,
      c.category,
      n.deadline,
      n.expiry,
      n.remaining,
      statusFor(c, today),
      c.decision,
      c.method,
      c.methodNote,
      annualAmount(c),
      c.owner,
      c.procedure.submittedOn,
      n.missed ? n.nextDeadline : "",
    ]);
  }
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

export function downloadCsv(contracts: Contract[], today: string, name: string) {
  const blob = new Blob([generateCsv(contracts, today)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}-${today}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
