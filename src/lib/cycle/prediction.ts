import { addDays } from "date-fns";
import { fromDateKey, toDateKey, todayKey, type DateKey } from "@/lib/utils/date";
import {
  averageCycleLength,
  averagePeriodDuration,
  cycleVariability,
  daysBetween,
  recentValues,
} from "./calculations";
import { resolvePhase } from "./phases";
import type { CyclePrediction } from "@/types/cycle";

export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_DURATION = 5;

/** Luteal phase is the most stable part of the cycle, so ovulation is counted back from the next period. */
const LUTEAL_PHASE_DAYS = 14;
/** Sperm survival window before ovulation, plus the day after. */
const FERTILE_DAYS_BEFORE_OVULATION = 5;
const FERTILE_DAYS_AFTER_OVULATION = 1;

const MIN_RANGE_MARGIN = 1;
const MAX_RANGE_MARGIN = 4;

export interface PredictionInput {
  /** Start date of the most recent recorded period. */
  lastPeriodStart: DateKey | null;
  /** Historical cycle lengths, oldest first. */
  cycleLengths: number[];
  /** Historical period durations, oldest first. */
  periodDurations: number[];
  /** Fallbacks from onboarding when there is no history yet. */
  profileCycleLength?: number;
  profilePeriodDuration?: number;
  today?: DateKey;
}

function shiftKey(key: DateKey, days: number): DateKey {
  return toDateKey(addDays(fromDateKey(key), days));
}

/**
 * Transparent prediction: next period = last period start + average cycle length,
 * widened into a range by how variable the recorded cycles are. Never presented
 * as a certain single date.
 */
export function predictCycle(input: PredictionInput): CyclePrediction | null {
  const {
    lastPeriodStart,
    cycleLengths,
    periodDurations,
    profileCycleLength = DEFAULT_CYCLE_LENGTH,
    profilePeriodDuration = DEFAULT_PERIOD_DURATION,
    today = todayKey(),
  } = input;

  if (!lastPeriodStart) return null;

  const avgCycle = averageCycleLength(cycleLengths, profileCycleLength);
  const avgPeriod = averagePeriodDuration(periodDurations, profilePeriodDuration);
  const basedOnCycles = recentValues(cycleLengths).length;

  const margin = Math.min(
    MAX_RANGE_MARGIN,
    Math.max(MIN_RANGE_MARGIN, cycleVariability(cycleLengths)),
  );

  const expectedStart = shiftKey(lastPeriodStart, avgCycle);
  const predictedNextPeriod = {
    start: shiftKey(expectedStart, -margin),
    end: shiftKey(expectedStart, margin),
  };

  const ovulationDay = avgCycle - LUTEAL_PHASE_DAYS;
  const predictedOvulation = shiftKey(lastPeriodStart, ovulationDay - 1);
  const fertileStartDay = ovulationDay - FERTILE_DAYS_BEFORE_OVULATION;
  const fertileEndDay = ovulationDay + FERTILE_DAYS_AFTER_OVULATION;

  const cycleDay = daysBetween(lastPeriodStart, today) + 1;

  return {
    cycleDay,
    phase: resolvePhase({
      cycleDay,
      cycleLength: avgCycle,
      periodDuration: avgPeriod,
      fertileStartDay,
      fertileEndDay,
      ovulationDay,
    }),
    averageCycleLength: avgCycle,
    averagePeriodDuration: avgPeriod,
    predictedNextPeriod,
    daysUntilNextPeriod: daysBetween(today, expectedStart),
    fertileWindow: {
      start: shiftKey(lastPeriodStart, fertileStartDay - 1),
      end: shiftKey(lastPeriodStart, fertileEndDay - 1),
    },
    predictedOvulation,
    basedOnCycles,
  };
}

/** True when `date` falls inside the inclusive range. */
export function isWithinRange(date: DateKey, range: { start: DateKey; end: DateKey }): boolean {
  return date >= range.start && date <= range.end;
}

// Teks di bawah ini sengaja ditulis jelas dan tidak disingkat: ini bagian yang
// paling penting untuk tidak disalahpahami.

export const PREDICTION_DISCLAIMER =
  "All dates are estimates based on previous cycle logs.";

export const FERTILE_DISCLAIMER =
  "Do not use this fertile window estimate as contraception.";

export const MEDICAL_DISCLAIMER =
  "Aivé estimates cycle dates from recorded information. It is not a medical device and does not provide diagnosis, treatment, or contraceptive advice.";

export const HEALTHCARE_SUGGESTION =
  "If symptoms are severe, unusual, or persistent, speak with a qualified healthcare professional.";
