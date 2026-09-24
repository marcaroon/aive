import { differenceInCalendarDays } from "date-fns";
import { fromDateKey, type DateKey } from "@/lib/utils/date";

export const MAX_CYCLES_FOR_AVERAGE = 6;

/** Guard rails so a typo cannot poison every future prediction. */
export const MIN_PLAUSIBLE_CYCLE_LENGTH = 15;
export const MAX_PLAUSIBLE_CYCLE_LENGTH = 60;

export function daysBetween(from: DateKey, to: DateKey): number {
  return differenceInCalendarDays(fromDateKey(to), fromDateKey(from));
}

/**
 * Cycle length is the gap between consecutive period start dates.
 * Input may be in any order; implausible gaps are dropped rather than averaged in.
 */
export function computeCycleLengths(periodStartDates: DateKey[]): number[] {
  const sorted = [...new Set(periodStartDates)].sort();
  const lengths: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const length = daysBetween(sorted[i - 1], sorted[i]);
    if (length >= MIN_PLAUSIBLE_CYCLE_LENGTH && length <= MAX_PLAUSIBLE_CYCLE_LENGTH) {
      lengths.push(length);
    }
  }
  return lengths;
}

/** The most recent `count` values, oldest first. */
export function recentValues(values: number[], count = MAX_CYCLES_FOR_AVERAGE): number[] {
  return values.slice(-count);
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

export function averageCycleLength(lengths: number[], fallback: number): number {
  const mean = average(recentValues(lengths));
  return mean === null ? fallback : Math.round(mean);
}

export function averagePeriodDuration(durations: number[], fallback: number): number {
  const mean = average(recentValues(durations));
  return mean === null ? fallback : Math.round(mean);
}

/**
 * Spread of the recent cycles, expressed as ± days around the average.
 * Uses the population standard deviation, rounded up, so the predicted range
 * is honest about how regular the recorded cycles actually are.
 */
export function cycleVariability(lengths: number[]): number {
  const recent = recentValues(lengths);
  if (recent.length < 2) return 0;
  const mean = average(recent) as number;
  const variance =
    recent.reduce((sum, value) => sum + (value - mean) ** 2, 0) / recent.length;
  return Math.round(Math.sqrt(variance));
}

export interface PeriodSpan {
  start: DateKey;
  end: DateKey;
  duration: number;
}

/**
 * Group logged period days into contiguous spans. A gap of more than one day
 * starts a new period, so spotting-then-pause is not merged into one long period.
 */
export function groupPeriodDays(dates: DateKey[]): PeriodSpan[] {
  const sorted = [...new Set(dates)].sort();
  const spans: PeriodSpan[] = [];
  let start: DateKey | null = null;
  let previous: DateKey | null = null;

  for (const date of sorted) {
    if (start === null || previous === null) {
      start = date;
      previous = date;
      continue;
    }
    if (daysBetween(previous, date) <= 1) {
      previous = date;
      continue;
    }
    spans.push({ start, end: previous, duration: daysBetween(start, previous) + 1 });
    start = date;
    previous = date;
  }

  if (start !== null && previous !== null) {
    spans.push({ start, end: previous, duration: daysBetween(start, previous) + 1 });
  }
  return spans;
}

/** Frequency map sorted by count, most frequent first. */
export function countFrequency(values: string[]): Array<{ value: string; count: number }> {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}
