import { addDays, addMonths, daysBetween, monthEnd } from "./dates.ts";
import { deadlineFor, expiryAt } from "./notice.ts";
import type { Contract } from "./types.ts";

export function emptyContract(today: string): Contract {
  return {
    id: "",
    name: "",
    provider: "",
    category: "サブスク",
    amount: 0,
    payment: "monthly",
    start: today,
    initialMonths: 12,
    renewalMonths: 12,
    rule: { kind: "months", value: 1 },
    method: "Web",
    methodNote: "",
    owner: "",
    memo: "",
    state: "継続",
    decision: "未定",
    procedure: {
      methodChecked: false,
      submittedOn: "",
      confirmed: false,
      returnRequired: false,
      returned: false,
      targetExpiry: "",
    },
  };
}

// Each example is authored individually. Only calendar positioning is shared.
export function createSeed(today: string): Contract[] {
  const month = `${today.slice(0, 7)}-01`;
  const next = addMonths(month, 1);
  const currentTarget = (offset: number) => {
    const target = addDays(today, offset);
    return target <= monthEnd(today) ? target : addDays(next, offset);
  };
  const make = (
    id: string,
    name: string,
    provider: string,
    category: Contract["category"],
    amount: number,
    deadline: string,
    method: Contract["method"],
    memo: string,
  ): Contract => {
    const c = emptyContract(today);
    // Find a nearby expiry, then derive an exact day-based notice period.
    c.start = addMonths(addDays(deadline, 46), -12);
    const expiry = expiryAt(c, 0);
    return {
      ...c,
      id,
      name,
      provider,
      category,
      amount,
      method,
      memo,
      start: c.start,
      owner: "事務担当（架空）",
      rule: { kind: "days", value: daysBetween(deadline, expiry) },
      methodNote: `${method}で解約希望日を伝える。受付控えを保管。`,
    };
  };
  const accounting = make(
    "cloud-books",
    "クラウド会計 ベーシック",
    "こもれびソフト（架空）",
    "サブスク",
    2480,
    addDays(today, 2),
    "Web",
    "利用人数が減ったため見直し。データの保存を忘れずに。",
  );
  accounting.decision = "解約する";
  accounting.state = "見直し中";
  const copier = make(
    "copier",
    "複合機リース",
    "青葉リース（架空）",
    "リース・レンタル",
    13800,
    addDays(today, -5),
    "書面",
    "今回は期限超過。次の更新に向けて返却条件を確認。",
  );
  copier.procedure.returnRequired = true;
  const water = make(
    "water",
    "ウォーターサーバー",
    "しずく便（架空）",
    "リース・レンタル",
    3280,
    addDays(today, 6),
    "電話",
    "返却用の梱包材を取り寄せる。",
  );
  water.decision = "解約する";
  water.procedure.returnRequired = true;
  const video = make(
    "video",
    "動画配信 プレミアム",
    "灯りシネマ（架空）",
    "サブスク",
    1480,
    currentTarget(10),
    "Web",
    "視聴頻度を確認してから判断。",
  );
  const internet = make(
    "internet",
    "事務所の光回線",
    "つむぎ回線（架空）",
    "通信・回線",
    5280,
    currentTarget(13),
    "電話",
    "回線切替日と機器返却の時期を相談。",
  );
  const website = make(
    "website",
    "ホームページ保守契約",
    "庭のウェブ工房（架空）",
    "保守・サポート契約",
    8800,
    addDays(next, 11),
    "メール",
    "更新作業の引き継ぎを依頼する。",
  );
  const cowork = make(
    "cowork",
    "コワーキング会員",
    "余白ワークラウンジ（架空）",
    "会員・その他",
    16500,
    addDays(next, 17),
    "書面",
    "ロッカーの荷物も確認。",
  );
  const storage = make(
    "storage",
    "ファイル保管 スタンダード",
    "雲の引き出し（架空）",
    "サブスク",
    12000,
    addDays(next, 23),
    "Web",
    "年払い。必要なファイルを移行してから判断。",
  );
  storage.payment = "yearly";
  const phone = make(
    "phone",
    "業務用モバイル回線",
    "結びモバイル（架空）",
    "通信・回線",
    2200,
    addDays(today, -2),
    "Web",
    "今回の申し出期限を過ぎたため次の機会を確認。",
  );
  const design = make(
    "design",
    "デザインツール チーム",
    "いろは制作室（架空）",
    "サブスク",
    3980,
    addMonths(today, 4),
    "Web",
    "開始予定の契約。開始後は月単位で自動更新。",
  );
  design.start = addDays(addMonths(month, 2), 4);
  design.initialMonths = 1;
  design.renewalMonths = 1;
  design.rule = { kind: "renewal", value: 0 };
  const support = make(
    "support",
    "パソコン保守サポート",
    "森のサポート（架空）",
    "保守・サポート契約",
    48000,
    addMonths(today, 6),
    "メール",
    "対象機器の利用状況を確認。",
  );
  support.payment = "yearly";
  support.start = addDays(addMonths(month, -3), 14);
  support.rule = { kind: "months", value: 3 };
  const journal = make(
    "journal",
    "業務資料の定期購読",
    "紙と知恵の会（架空）",
    "会員・その他",
    18000,
    addMonths(today, 5),
    "メール",
    "満了月の前月末が申し出期限。",
  );
  journal.payment = "yearly";
  journal.start = addMonths(month, -5);
  journal.rule = { kind: "monthEnd", value: 1 };
  const submitted = make(
    "submitted",
    "オンライン学習 ライブラリー",
    "学びの小箱（架空）",
    "サブスク",
    1980,
    addDays(today, 3),
    "Web",
    "申し出済み。受付の連絡待ち。",
  );
  submitted.state = "解約申し出済み";
  submitted.decision = "解約する";
  submitted.procedure.methodChecked = true;
  submitted.procedure.submittedOn = addDays(today, -1);
  submitted.procedure.targetExpiry = expiryAt(submitted, 0);
  const ended = make(
    "ended",
    "卓上端末レンタル",
    "小道具レンタル（架空）",
    "リース・レンタル",
    1100,
    addDays(today, -60),
    "書面",
    "返却・受付確認まで完了。",
  );
  ended.state = "解約済み";
  ended.procedure = {
    methodChecked: true,
    submittedOn: addDays(today, -65),
    confirmed: true,
    returnRequired: true,
    returned: true,
    targetExpiry: expiryAt(ended, 0),
  };
  // Keep the historical submission tied to the original termination opportunity.
  if (submitted.procedure.submittedOn > deadlineFor(expiryAt(submitted, 0), submitted.rule)) {
    throw new Error("Invalid seed submission");
  }
  return [
    accounting,
    copier,
    water,
    video,
    internet,
    website,
    cowork,
    storage,
    phone,
    design,
    support,
    journal,
    submitted,
    ended,
  ];
}
