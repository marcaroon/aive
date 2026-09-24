import { addDays } from "date-fns";
import { fromDateKey, toDateKey, type DateKey } from "@/lib/utils/date";
import type { CyclePrediction } from "@/types/cycle";
import {
  daysBetween,
  MIN_PLAUSIBLE_CYCLE_LENGTH,
  MAX_PLAUSIBLE_CYCLE_LENGTH,
} from "./calculations";
import { DEFAULT_CYCLE_LENGTH, predictCycle } from "./prediction";

export interface HistoricalCycleEstimate {
  cycleStart: DateKey;
  cycleEnd: DateKey;
  predictedOvulation: DateKey;
  fertileWindow: CyclePrediction["fertileWindow"];
}

/**
 * Reconstruct estimates for recorded cycles using the same day convention as
 * the current prediction. A known next period supplies that cycle's length.
 * Missing/implausible gaps use the configured average, without inventing extra
 * periods or cycles before the first record. These are estimates, not observations.
 */
export function buildHistoricalEstimates(
  periodStarts: DateKey[],
  fallbackCycleLength = DEFAULT_CYCLE_LENGTH,
): HistoricalCycleEstimate[] {
  const starts = [...new Set(periodStarts)].sort();
  return starts.slice(0, -1).flatMap((start, index) => {
    const nextStart = starts[index + 1];
    const gap = daysBetween(start, nextStart);
    const length =
      gap >= MIN_PLAUSIBLE_CYCLE_LENGTH && gap <= MAX_PLAUSIBLE_CYCLE_LENGTH
        ? gap
        : fallbackCycleLength;
    const prediction = predictCycle({
      lastPeriodStart: start,
      cycleLengths: [length],
      periodDurations: [],
      today: start,
    });
    if (!prediction || prediction.predictedOvulation >= nextStart) return [];
    const cycleEnd = toDateKey(addDays(fromDateKey(nextStart), -1));
    return [
      {
        cycleStart: start,
        cycleEnd,
        predictedOvulation: prediction.predictedOvulation,
        fertileWindow: {
          start:
            prediction.fertileWindow.start < start
              ? start
              : prediction.fertileWindow.start,
          end:
            prediction.fertileWindow.end > cycleEnd
              ? cycleEnd
              : prediction.fertileWindow.end,
        },
      },
    ];
  });
}
