import { describe, expect, it } from "vitest";
import { isWithinRange, predictCycle } from "./prediction";

const BASE = {
  lastPeriodStart: "2026-01-01",
  cycleLengths: [28, 28, 28],
  periodDurations: [5, 5, 5],
  today: "2026-01-01",
};

describe("predictCycle", () => {
  it("returns null without a recorded period start", () => {
    expect(predictCycle({ ...BASE, lastPeriodStart: null })).toBeNull();
  });

  it("predicts the next period one average cycle after the last start", () => {
    const result = predictCycle(BASE);
    // 28-day average from 1 January lands on 29 January, ± the regularity margin.
    expect(result?.predictedNextPeriod.start).toBe("2026-01-28");
    expect(result?.predictedNextPeriod.end).toBe("2026-01-30");
  });

  it("always returns a range, never a single certain date", () => {
    const result = predictCycle(BASE);
    expect(result?.predictedNextPeriod.start).not.toBe(result?.predictedNextPeriod.end);
  });

  it("widens the range when cycles are irregular", () => {
    const regular = predictCycle(BASE);
    const irregular = predictCycle({ ...BASE, cycleLengths: [24, 28, 32, 36] });

    const width = (result: NonNullable<ReturnType<typeof predictCycle>>) =>
      new Date(result.predictedNextPeriod.end).getTime() -
      new Date(result.predictedNextPeriod.start).getTime();

    expect(width(irregular!)).toBeGreaterThan(width(regular!));
  });

  it("caps the range so it never becomes uselessly wide", () => {
    const wild = predictCycle({ ...BASE, cycleLengths: [16, 28, 40, 55, 20, 50] });
    const days =
      (new Date(wild!.predictedNextPeriod.end).getTime() -
        new Date(wild!.predictedNextPeriod.start).getTime()) /
      86_400_000;
    expect(days).toBeLessThanOrEqual(8);
  });

  it("falls back to the onboarding numbers when there is no history", () => {
    const result = predictCycle({
      lastPeriodStart: "2026-01-01",
      cycleLengths: [],
      periodDurations: [],
      profileCycleLength: 30,
      profilePeriodDuration: 4,
      today: "2026-01-01",
    });
    expect(result?.averageCycleLength).toBe(30);
    expect(result?.averagePeriodDuration).toBe(4);
    expect(result?.basedOnCycles).toBe(0);
  });

  it("uses at most the last six cycles", () => {
    const result = predictCycle({
      ...BASE,
      // The leading 40s are outside the six-cycle window and must be ignored.
      cycleLengths: [40, 40, 28, 28, 28, 28, 28, 28],
    });
    expect(result?.averageCycleLength).toBe(28);
    expect(result?.basedOnCycles).toBe(6);
  });

  it("counts cycle day from the period start, 1-based", () => {
    expect(predictCycle({ ...BASE, today: "2026-01-01" })?.cycleDay).toBe(1);
    expect(predictCycle({ ...BASE, today: "2026-01-18" })?.cycleDay).toBe(18);
  });

  it("reports the days remaining until the expected start", () => {
    expect(predictCycle({ ...BASE, today: "2026-01-19" })?.daysUntilNextPeriod).toBe(10);
  });

  it("places ovulation two weeks before the next expected period", () => {
    // 28-day cycle from 1 January: ovulation on cycle day 14, i.e. 14 January.
    expect(predictCycle(BASE)?.predictedOvulation).toBe("2026-01-14");
  });

  it("puts the fertile window around the ovulation estimate", () => {
    const result = predictCycle(BASE)!;
    expect(result.fertileWindow.start < result.predictedOvulation).toBe(true);
    expect(result.fertileWindow.end > result.predictedOvulation).toBe(true);
  });
});

describe("cycle phases", () => {
  it("reports menstrual days at the start of the cycle", () => {
    expect(predictCycle({ ...BASE, today: "2026-01-02" })?.phase).toBe("menstrual");
  });

  it("reports follicular after the period, before the fertile estimate", () => {
    expect(predictCycle({ ...BASE, today: "2026-01-07" })?.phase).toBe("follicular");
  });

  it("reports ovulation on the estimated day", () => {
    expect(predictCycle({ ...BASE, today: "2026-01-14" })?.phase).toBe("ovulation");
  });

  it("reports fertile in the days around ovulation", () => {
    expect(predictCycle({ ...BASE, today: "2026-01-11" })?.phase).toBe("fertile");
  });

  it("reports luteal after the fertile window", () => {
    expect(predictCycle({ ...BASE, today: "2026-01-22" })?.phase).toBe("luteal");
  });

  it("gives up rather than guessing when the data is far out of range", () => {
    expect(predictCycle({ ...BASE, today: "2026-06-01" })?.phase).toBe("unknown");
  });
});

describe("isWithinRange", () => {
  const range = { start: "2026-01-10", end: "2026-01-15" };

  it("includes both endpoints", () => {
    expect(isWithinRange("2026-01-10", range)).toBe(true);
    expect(isWithinRange("2026-01-15", range)).toBe(true);
  });

  it("excludes dates outside the range", () => {
    expect(isWithinRange("2026-01-09", range)).toBe(false);
    expect(isWithinRange("2026-01-16", range)).toBe(false);
  });
});
