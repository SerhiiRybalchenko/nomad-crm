import { differenceInCalendarDays, format, isToday, isTomorrow, isYesterday } from "date-fns";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number | string, compact = false): string {
  const n = typeof value === "string" ? Number(value) : value;
  return compact ? compactCurrencyFormatter.format(n) : currencyFormatter.format(n);
}

export function formatShortDate(iso: string | null): string {
  if (!iso) return "—";
  return format(new Date(iso), "MMM d");
}

export function formatRelativeDay(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isYesterday(date)) return "Yesterday";
  const days = differenceInCalendarDays(date, new Date());
  if (days > 0) return `In ${days}d`;
  return `${Math.abs(days)}d overdue`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function hueToBg(hue: number): string {
  return `hsl(${hue}, 62%, 62%)`;
}
