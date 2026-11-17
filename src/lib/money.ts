import { effectiveState } from "./notice.ts";
import type { Contract } from "./types.ts";

export function annualAmount(contract: Pick<Contract, "amount" | "payment">): number {
  return contract.amount * (contract.payment === "monthly" ? 12 : 1);
}

export function yen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export function totals(contracts: Contract[], today: string) {
  const active = contracts.filter((c) => effectiveState(c, today) !== "解約済み");
  return {
    active: active.reduce((sum, c) => sum + annualAmount(c), 0),
    savings: active
      .filter((c) => c.decision === "解約する")
      .reduce((sum, c) => sum + annualAmount(c), 0),
    count: active.filter((c) => c.decision === "解約する").length,
  };
}
