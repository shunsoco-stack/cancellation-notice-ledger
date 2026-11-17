const DAY = 86_400_000;

// UTC is used only as a calendar arithmetic engine, never as the user's time zone.
export function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parseDate(value);
  return Number.isFinite(date.getTime()) && iso(date) === value;
}

export function todayJapan(now = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(value: string, days: number): string {
  return iso(new Date(parseDate(value).getTime() + days * DAY));
}

export function addMonths(value: string, months: number): string {
  const date = parseDate(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  date.setUTCDate(Math.min(day, end.getUTCDate()));
  return iso(date);
}

export function monthEnd(value: string): string {
  return addDays(addMonths(`${value.slice(0, 7)}-01`, 1), -1);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / DAY);
}

export function previousWeekday(value: string): string | null {
  const day = parseDate(value).getUTCDay();
  return day === 0 ? addDays(value, -2) : day === 6 ? addDays(value, -1) : null;
}

export function displayDate(value: string): string {
  return value ? value.replaceAll("-", "/") : "未設定";
}
