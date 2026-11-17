import { isDate } from "./dates.ts";
import { createSeed } from "./seed.ts";
import { categories, decisions, methods, states } from "./types.ts";
import type { Contract } from "./types.ts";

export const STORAGE_KEY = "cnl:v1";
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown, max = 3000): v is string => typeof v === "string" && v.length <= max;
const integer = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= min && v <= max;
const member = (v: unknown, options: readonly string[]) =>
  typeof v === "string" && options.includes(v);

export function isContract(v: unknown): v is Contract {
  if (!record(v) || !record(v.rule) || !record(v.procedure)) return false;
  const p = v.procedure;
  return (
    text(v.id, 100) &&
    /^[a-zA-Z0-9_-]+$/.test(v.id) &&
    text(v.name, 100) &&
    !!v.name.trim() &&
    text(v.provider, 100) &&
    !!v.provider.trim() &&
    member(v.category, categories) &&
    integer(v.amount, 0, 1_000_000_000) &&
    member(v.payment, ["monthly", "yearly"]) &&
    isDate(v.start) &&
    v.start >= "1900-01-01" &&
    v.start <= "2200-12-31" &&
    integer(v.initialMonths, 1, 120) &&
    integer(v.renewalMonths, 1, 120) &&
    member(v.rule.kind, ["months", "days", "monthEnd", "renewal"]) &&
    integer(v.rule.value, v.rule.kind === "renewal" ? 0 : 1, v.rule.kind === "days" ? 3650 : 120) &&
    (v.rule.kind !== "renewal" || v.rule.value === 0) &&
    member(v.method, methods) &&
    text(v.methodNote) &&
    text(v.owner, 100) &&
    text(v.memo) &&
    member(v.state, states) &&
    member(v.decision, decisions) &&
    typeof p.methodChecked === "boolean" &&
    typeof p.confirmed === "boolean" &&
    typeof p.returnRequired === "boolean" &&
    typeof p.returned === "boolean" &&
    (p.submittedOn === "" || isDate(p.submittedOn)) &&
    (p.targetExpiry === "" || isDate(p.targetExpiry)) &&
    (!p.submittedOn || (!!p.targetExpiry && p.methodChecked)) &&
    (v.state !== "解約申し出済み" || !!p.submittedOn) &&
    (!p.confirmed || !!p.submittedOn) &&
    (!p.returned || p.confirmed)
  );
}

export function validateData(value: unknown): value is Contract[] {
  return (
    Array.isArray(value) &&
    value.length <= 2000 &&
    value.every(isContract) &&
    new Set(value.map((c) => c.id)).size === value.length
  );
}

export function decodeStorage(raw: string | null, today: string) {
  if (raw === null) return { contracts: createSeed(today), recovered: false };
  try {
    const data: unknown = JSON.parse(raw);
    if (validateData(data)) return { contracts: data, recovered: false };
  } catch {
    /* Invalid JSON is recovered using the same validated seed. */
  }
  return { contracts: createSeed(today), recovered: true };
}
