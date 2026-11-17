import { addDays, addMonths, daysBetween, monthEnd } from "./dates.ts";
import type { Contract, NoticeRule, Status } from "./types.ts";

export function expiryAt(contract: Contract, index: number): string {
  return addDays(
    addMonths(contract.start, contract.initialMonths + index * contract.renewalMonths),
    -1,
  );
}

export function deadlineFor(expiry: string, rule: NoticeRule): string {
  switch (rule.kind) {
    case "months":
      return addMonths(expiry, -rule.value);
    case "days":
      return addDays(expiry, -rule.value);
    case "monthEnd":
      return monthEnd(addMonths(`${expiry.slice(0, 7)}-01`, -rule.value));
    case "renewal":
      return expiry;
  }
}

export function ruleLabel(rule: NoticeRule): string {
  switch (rule.kind) {
    case "months":
      return `満了の${rule.value}か月前の同日まで`;
    case "days":
      return `満了の${rule.value}日前まで`;
    case "monthEnd":
      return `満了月の${rule.value}か月前の月末まで`;
    case "renewal":
      return "次回更新日（請求日）の前日まで";
  }
}

export function calculate(contract: Contract, today: string) {
  const expiries: string[] = [];
  let index = 0;
  while (expiryAt(contract, index) < today) {
    expiries.push(expiryAt(contract, index));
    index++;
  }
  const expiry = expiryAt(contract, index);
  expiries.push(expiry);
  const deadline = deadlineFor(expiry, contract.rule);
  let opportunityIndex = index;
  while (deadlineFor(expiryAt(contract, opportunityIndex), contract.rule) < today) {
    opportunityIndex++;
  }
  const nextExpiry = expiryAt(contract, opportunityIndex);
  return {
    expiry,
    deadline,
    expiries,
    index,
    remaining: daysBetween(today, deadline),
    missed: deadline < today,
    nextExpiry,
    nextDeadline: deadlineFor(nextExpiry, contract.rule),
  };
}

export function submissionOnTime(contract: Contract): boolean | null {
  const { submittedOn, targetExpiry } = contract.procedure;
  if (!submittedOn || !targetExpiry) return null;
  return submittedOn <= deadlineFor(targetExpiry, contract.rule);
}

export function procedureComplete(contract: Contract): boolean {
  const p = contract.procedure;
  return (
    p.methodChecked &&
    !!p.submittedOn &&
    p.confirmed &&
    (!p.returnRequired || p.returned) &&
    submissionOnTime(contract) === true
  );
}

export function effectiveState(contract: Contract, today: string): Contract["state"] {
  if (contract.state === "解約済み") return "解約済み";
  if (
    contract.decision === "解約する" &&
    procedureComplete(contract) &&
    contract.procedure.targetExpiry <= today
  )
    return "解約済み";
  if (contract.procedure.submittedOn) return "解約申し出済み";
  return contract.state;
}

export function statusFor(contract: Contract, today: string): Status {
  const state = effectiveState(contract, today);
  if (state === "解約済み") return "解約済み";
  if (state === "解約申し出済み") return "申し出済み";
  const { deadline, remaining } = calculate(contract, today);
  if (remaining < 0) return "期限切れ";
  if (remaining <= 7) return "7日以内";
  if (deadline.slice(0, 7) === today.slice(0, 7)) return "今月中";
  if (deadline.slice(0, 7) === addMonths(today, 1).slice(0, 7)) return "来月";
  return "それ以降";
}

export function deadlineEvents(contracts: Contract[], today: string) {
  const start = `${today.slice(0, 7)}-01`;
  const end = addMonths(start, 12);
  return contracts
    .flatMap((contract) => {
      const state = effectiveState(contract, today);
      if (state === "解約済み" || state === "解約申し出済み") return [];
      const events: { contract: Contract; expiry: string; deadline: string }[] = [];
      let index = calculate(contract, start).index;
      while (true) {
        const expiry = expiryAt(contract, index++);
        const deadline = deadlineFor(expiry, contract.rule);
        if (deadline >= end) break;
        if (deadline >= start) events.push({ contract, expiry, deadline });
      }
      return events;
    })
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
}
