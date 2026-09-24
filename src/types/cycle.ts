import type { Timestamp } from "firebase/firestore";

export type FlowLevel = "none" | "spotting" | "light" | "medium" | "heavy";

/** Flow levels that can be stored on a period day (a period day is never "none"). */
export type PeriodFlowLevel = Exclude<FlowLevel, "none">;

export type CyclePhase =
  | "menstrual"
  | "follicular"
  | "fertile"
  | "ovulation"
  | "luteal"
  | "unknown";

export interface Cycle {
  id: string;
  /** ISO date string, YYYY-MM-DD. Stored alongside the Timestamp for cheap sorting. */
  startDate: Timestamp;
  endDate?: Timestamp;
  cycleLength?: number;
  periodDuration?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PeriodDay {
  id: string;
  /** YYYY-MM-DD, also used as the document id. */
  date: string;
  flowLevel: PeriodFlowLevel;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface CyclePrediction {
  /** Day number within the current cycle, 1-based. */
  cycleDay: number;
  phase: CyclePhase;
  averageCycleLength: number;
  averagePeriodDuration: number;
  predictedNextPeriod: DateRange;
  daysUntilNextPeriod: number;
  fertileWindow: DateRange;
  predictedOvulation: string;
  /** How many recorded cycles the estimate is based on. 0 means "not enough data". */
  basedOnCycles: number;
}
