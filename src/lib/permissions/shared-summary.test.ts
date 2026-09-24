import { describe, expect, it } from "vitest";
import { buildSharedSummary, SUMMARY_FIELDS } from "./shared-summary";
import { DEFAULT_PARTNER_PERMISSIONS, type PartnerPermissions } from "@/types/permission";
import type { CyclePrediction } from "@/types/cycle";
import type { DailyLog } from "@/types/daily-log";

const prediction: CyclePrediction = {
  cycleDay: 18,
  phase: "luteal",
  averageCycleLength: 28,
  averagePeriodDuration: 5,
  predictedNextPeriod: { start: "2026-01-28", end: "2026-01-30" },
  daysUntilNextPeriod: 10,
  fertileWindow: { start: "2026-01-09", end: "2026-01-15" },
  predictedOvulation: "2026-01-14",
  basedOnCycles: 3,
};

const todayLog = {
  date: "2026-01-18",
  moods: ["tired", "sensitive"],
  symptoms: ["cramps", "headache"],
  painLevel: 7,
  flowLevel: "medium",
  privateNotes: "Something I only want for myself.",
} as unknown as DailyLog;

const allOn: PartnerPermissions = {
  shareCyclePhase: true,
  sharePredictedPeriod: true,
  shareMood: true,
  sharePainLevel: true,
  shareFlowStatus: true,
  shareSymptoms: true,
  shareSupportRequest: true,
  shareDailyNotes: true,
};

const input = { prediction, todayLog, isOnPeriodToday: true };

describe("buildSharedSummary", () => {
  it("shares nothing at all under the default permissions", () => {
    const summary = buildSharedSummary(DEFAULT_PARTNER_PERMISSIONS, input);
    expect(Object.keys(summary)).toHaveLength(0);
  });

  it("omits every field when all permissions are off", () => {
    const allOff = Object.fromEntries(
      Object.keys(allOn).map((key) => [key, false]),
    ) as unknown as PartnerPermissions;

    const summary = buildSharedSummary(allOff, input);
    for (const field of SUMMARY_FIELDS) {
      expect(summary).not.toHaveProperty(field);
    }
  });

  it("never leaks private notes unless notes are explicitly shared", () => {
    const summary = buildSharedSummary({ ...allOn, shareDailyNotes: false }, input);
    expect(summary.dailyNote).toBeUndefined();
    expect(JSON.stringify(summary)).not.toContain("only want for myself");
  });

  it("shares the note only when that specific permission is on", () => {
    const summary = buildSharedSummary(allOn, input);
    expect(summary.dailyNote).toBe("Something I only want for myself.");
  });

  it("shares only the first mood, not the full emotional record", () => {
    const summary = buildSharedSummary(allOn, input);
    expect(summary.mood).toBe("tired");
  });

  it("turns each permission on independently", () => {
    const onlyPhase = buildSharedSummary(
      { ...DEFAULT_PARTNER_PERMISSIONS, shareCyclePhase: true },
      input,
    );
    expect(onlyPhase.cyclePhase).toBe("luteal");
    expect(onlyPhase.painLevel).toBeUndefined();
    expect(onlyPhase.symptoms).toBeUndefined();
  });

  it("reports flow from the recorded period even without a logged flow level", () => {
    const summary = buildSharedSummary(allOn, {
      prediction,
      todayLog: null,
      isOnPeriodToday: true,
    });
    expect(summary.flowStatus).toBe("recorded");
  });

  it("omits flow when there is no period and nothing logged", () => {
    const summary = buildSharedSummary(allOn, {
      prediction,
      todayLog: null,
      isOnPeriodToday: false,
    });
    expect(summary.flowStatus).toBeUndefined();
  });

  it("copes with a missing prediction", () => {
    const summary = buildSharedSummary(allOn, {
      prediction: null,
      todayLog,
      isOnPeriodToday: false,
    });
    expect(summary.cyclePhase).toBeUndefined();
    expect(summary.predictedPeriodRange).toBeUndefined();
    expect(summary.mood).toBe("tired");
  });

  it("never returns a field that is not in the documented summary shape", () => {
    const summary = buildSharedSummary(allOn, input);
    for (const key of Object.keys(summary)) {
      expect(SUMMARY_FIELDS).toContain(key);
    }
  });
});
