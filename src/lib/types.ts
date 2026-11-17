export const categories = [
  "サブスク",
  "リース・レンタル",
  "保守・サポート契約",
  "通信・回線",
  "会員・その他",
] as const;
export const states = ["継続", "見直し中", "解約申し出済み", "解約済み"] as const;
export const decisions = ["未定", "解約する", "継続する"] as const;
export const methods = ["Web", "電話", "書面", "メール"] as const;
export type RuleKind = "months" | "days" | "monthEnd" | "renewal";
export type NoticeRule = { kind: RuleKind; value: number };
export type Contract = {
  id: string;
  name: string;
  provider: string;
  category: (typeof categories)[number];
  amount: number;
  payment: "monthly" | "yearly";
  start: string;
  initialMonths: number;
  renewalMonths: number;
  rule: NoticeRule;
  method: (typeof methods)[number];
  methodNote: string;
  owner: string;
  memo: string;
  state: (typeof states)[number];
  decision: (typeof decisions)[number];
  procedure: {
    methodChecked: boolean;
    submittedOn: string;
    confirmed: boolean;
    returnRequired: boolean;
    returned: boolean;
    targetExpiry: string;
  };
};
export const statuses = [
  "期限切れ",
  "7日以内",
  "今月中",
  "来月",
  "それ以降",
  "申し出済み",
  "解約済み",
] as const;
export type Status = (typeof statuses)[number];
