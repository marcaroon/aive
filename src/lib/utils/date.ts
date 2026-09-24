import { format as formatDate, parseISO, startOfDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";

/** Display dates in English; stored date keys remain unchanged. */
function format(date: Date, pattern: string): string {
  return formatDate(date, pattern, { locale: enUS });
}

/** Canonical date key used across the app and as Firestore document ids. */
export type DateKey = string;

export function toDateKey(date: Date): DateKey {
  return format(date, "yyyy-MM-dd");
}

export function fromDateKey(key: DateKey): Date {
  return startOfDay(parseISO(key));
}

export function todayKey(): DateKey {
  return toDateKey(new Date());
}

export function timestampToDate(value: Timestamp | Date | undefined): Date | undefined {
  if (!value) return undefined;
  return value instanceof Timestamp ? value.toDate() : value;
}

export function timestampToDateKey(value: Timestamp | Date | undefined): DateKey | undefined {
  const date = timestampToDate(value);
  return date ? toDateKey(date) : undefined;
}

export function dateKeyToTimestamp(key: DateKey): Timestamp {
  return Timestamp.fromDate(fromDateKey(key));
}

/** "12–15 August" for a range inside one month, "29 July – 2 August" otherwise. */
export function formatRange(start: DateKey, end: DateKey): string {
  const startDate = fromDateKey(start);
  const endDate = fromDateKey(end);
  if (start === end) return format(startDate, "d MMMM");
  if (startDate.getMonth() === endDate.getMonth()) {
    return `${format(startDate, "d")}–${format(endDate, "d MMMM")}`;
  }
  return `${format(startDate, "d MMM")} – ${format(endDate, "d MMM")}`;
}

export function formatFriendlyDate(key: DateKey): string {
  return format(fromDateKey(key), "EEEE, d MMMM yyyy");
}

export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
