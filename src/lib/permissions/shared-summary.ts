import type { DailyLog } from "@/types/daily-log";
import type { CyclePrediction } from "@/types/cycle";
import type { PartnerPermissions, SharedSummary } from "@/types/permission";

export type SharedSummaryFields = Omit<
  SharedSummary,
  "relationshipId" | "primaryUserId" | "partnerUserId" | "updatedAt" | "supportRequest"
>;

/**
 * The single place that decides what a partner may see.
 *
 * Every field is opt-in: if the matching permission is off, the key is simply
 * absent from the result, and the caller deletes it from the stored document.
 * The partner never reads the raw daily log — only what this function returns.
 */
export function buildSharedSummary(
  permissions: PartnerPermissions,
  input: {
    prediction: CyclePrediction | null;
    todayLog: DailyLog | null;
    isOnPeriodToday: boolean;
  },
): SharedSummaryFields {
  const { prediction, todayLog, isOnPeriodToday } = input;
  const summary: SharedSummaryFields = {};

  if (permissions.shareCyclePhase && prediction) {
    summary.cyclePhase = prediction.phase;
  }

  if (permissions.sharePredictedPeriod && prediction) {
    summary.predictedPeriodRange = prediction.predictedNextPeriod;
  }

  if (permissions.shareMood && todayLog?.moods.length) {
    // Only the first mood: enough to be useful, not a full emotional record.
    summary.mood = todayLog.moods[0];
  }

  if (permissions.sharePainLevel && todayLog?.painLevel !== undefined) {
    summary.painLevel = todayLog.painLevel;
  }

  if (permissions.shareFlowStatus) {
    const flow = todayLog?.flowLevel;
    if (flow && flow !== "none") {
      summary.flowStatus = flow;
    } else if (isOnPeriodToday) {
      summary.flowStatus = "recorded";
    }
  }

  if (permissions.shareSymptoms && todayLog?.symptoms.length) {
    summary.symptoms = todayLog.symptoms;
  }

  if (permissions.shareDailyNotes && todayLog?.privateNotes) {
    summary.dailyNote = todayLog.privateNotes;
  }

  return summary;
}

/** Fields that must be cleared from the stored summary when a permission is off. */
export const SUMMARY_FIELDS: Array<keyof SharedSummaryFields> = [
  "cyclePhase",
  "predictedPeriodRange",
  "mood",
  "painLevel",
  "flowStatus",
  "symptoms",
  "dailyNote",
];
