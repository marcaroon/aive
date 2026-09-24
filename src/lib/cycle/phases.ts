import type { CyclePhase } from "@/types/cycle";

export const PHASE_LABELS: Record<CyclePhase, string> = {
  menstrual: "On your period",
  follicular: "Follicular phase",
  fertile: "Fertile window",
  ovulation: "Estimated ovulation",
  luteal: "Luteal phase",
  unknown: "Not enough data yet",
};

export const PHASE_DESCRIPTIONS: Record<CyclePhase, string> = {
  menstrual: "Your period days. Take it easy if you need to.",
  follicular: "The days after your period, before the estimated fertile window.",
  fertile: "An estimated fertile window based on your average cycle.",
  ovulation: "The estimated ovulation day for this cycle.",
  luteal: "The time between your fertile window and your next period.",
  unknown: "Log a period start date to see your estimated phase.",
};

/** Soft, non-clinical colour per phase, taken from the supporting palette. */
export const PHASE_COLORS: Record<CyclePhase, string> = {
  menstrual: "var(--color-period)",
  follicular: "var(--color-butter)",
  fertile: "var(--color-fertile)",
  ovulation: "var(--color-ovulation)",
  luteal: "var(--color-mood)",
  unknown: "var(--color-line)",
};

interface PhaseInput {
  cycleDay: number;
  cycleLength: number;
  periodDuration: number;
  fertileStartDay: number;
  fertileEndDay: number;
  ovulationDay: number;
}

export function resolvePhase({
  cycleDay,
  cycleLength,
  periodDuration,
  fertileStartDay,
  fertileEndDay,
  ovulationDay,
}: PhaseInput): CyclePhase {
  if (cycleDay < 1 || cycleDay > cycleLength + 14) return "unknown";
  if (cycleDay <= periodDuration) return "menstrual";
  if (cycleDay === ovulationDay) return "ovulation";
  if (cycleDay >= fertileStartDay && cycleDay <= fertileEndDay) return "fertile";
  if (cycleDay < fertileStartDay) return "follicular";
  return "luteal";
}
