import { calculate, effectiveState, statusFor } from "./notice.ts";
import { annualAmount } from "./money.ts";
import type { Contract } from "./types.ts";

export type Filters = { query: string; category: string; status: string; decision: string };
export function filterAndSort(
  contracts: Contract[],
  today: string,
  filters: Filters,
  sort: string,
) {
  return contracts
    .filter(
      (c) =>
        (!filters.query || `${c.name} ${c.provider} ${c.owner}`.includes(filters.query)) &&
        (!filters.category || c.category === filters.category) &&
        (!filters.status ||
          statusFor(c, today) === filters.status ||
          effectiveState(c, today) === filters.status) &&
        (!filters.decision || c.decision === filters.decision),
    )
    .sort((a, b) => {
      if (sort === "amount") return annualAmount(b) - annualAmount(a);
      if (sort === "name") return a.name.localeCompare(b.name, "ja");
      return calculate(a, today).deadline.localeCompare(calculate(b, today).deadline);
    });
}

export function homeGroups(contracts: Contract[], today: string) {
  const active = filterAndSort(
    contracts,
    today,
    { query: "", category: "", status: "", decision: "" },
    "deadline",
  ).filter((c) => !["申し出済み", "解約済み"].includes(statusFor(c, today)));
  const currentMonth = today.slice(0, 7);
  const nextMonth = new Date(`${currentMonth}-01T00:00:00Z`);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  return {
    current: active.filter((c) => {
      const calc = calculate(c, today);
      return !calc.missed && calc.deadline.slice(0, 7) === currentMonth;
    }),
    next: active.filter((c) => {
      const calc = calculate(c, today);
      return !calc.missed && calc.deadline.slice(0, 7) === nextMonth.toISOString().slice(0, 7);
    }),
    missed: active.filter((c) => calculate(c, today).missed),
  };
}
