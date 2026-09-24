import {
  average,
  countFrequency,
  cycleVariability,
  recentValues,
  type PeriodSpan,
} from "./calculations";
import {
  MOOD_LABELS,
  SYMPTOM_LABELS,
  type DailyLog,
  type Mood,
  type Symptom,
} from "@/types/daily-log";

export interface InsightSummary {
  averageCycleLength: number | null;
  averagePeriodDuration: number | null;
  variability: number;
  cycleCount: number;
  commonSymptoms: Array<{ value: string; count: number }>;
  moodFrequency: Array<{ value: string; count: number }>;
  averagePain: number | null;
  painTrend: Array<{ date: string; pain: number }>;
  cycleLengthHistory: Array<{ label: string; length: number }>;
}

/**
 * Everything the insights screen needs, computed in one pass. Descriptive only:
 * no thresholds, no warnings, nothing that reads as a diagnosis.
 */
export function buildInsights(
  spans: PeriodSpan[],
  cycleLengths: number[],
  logs: DailyLog[],
): InsightSummary {
  const recentLengths = recentValues(cycleLengths);
  // The final span may still be in progress, so it is left out of the duration average.
  const completedDurations = spans.slice(0, -1).map((span) => span.duration);

  const painEntries = logs
    .filter((log) => typeof log.painLevel === "number")
    .map((log) => ({ date: log.date, pain: log.painLevel as number }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const avgCycle = average(recentLengths);
  const avgDuration = average(recentValues(completedDurations));
  const avgPain = average(painEntries.map((entry) => entry.pain));

  return {
    averageCycleLength: avgCycle === null ? null : Math.round(avgCycle),
    averagePeriodDuration: avgDuration === null ? null : Math.round(avgDuration),
    variability: cycleVariability(cycleLengths),
    cycleCount: recentLengths.length,
    commonSymptoms: countFrequency(logs.flatMap((log) => log.symptoms)).slice(0, 6),
    moodFrequency: countFrequency(logs.flatMap((log) => log.moods)).slice(0, 6),
    averagePain: avgPain === null ? null : Math.round(avgPain * 10) / 10,
    painTrend: painEntries.slice(-30),
    cycleLengthHistory: recentLengths.map((length, index) => ({
      label: `C${index + 1}`,
      length,
    })),
  };
}

/**
 * Kalimat yang lembut dan menggantung. Cuma menggambarkan apa yang tercatat,
 * tidak pernah menyimpulkan soal kesehatan.
 */
export function buildInsightSentences(insights: InsightSummary): string[] {
  const sentences: string[] = [];

  if (insights.averageCycleLength && insights.cycleCount > 0) {
    sentences.push(
      `Cycle length averages ${insights.averageCycleLength} days across the last ${insights.cycleCount} recorded cycles.`,
    );
  }

  if (insights.variability > 0) {
    sentences.push(
      `Cycle length varies by about ${insights.variability} days from that average.`,
    );
  }

  const topSymptom = insights.commonSymptoms[0];
  if (topSymptom && topSymptom.count > 1) {
    sentences.push(
      `Most logged symptom: ${SYMPTOM_LABELS[topSymptom.value as Symptom] ?? topSymptom.value}.`,
    );
  }

  const topMood = insights.moodFrequency[0];
  if (topMood && topMood.count > 1) {
    sentences.push(
      `Most logged mood: ${MOOD_LABELS[topMood.value as Mood] ?? topMood.value}.`,
    );
  }

  if (insights.averagePain !== null) {
    sentences.push(`Logged pain averages ${insights.averagePain} out of 10.`);
  }

  return sentences;
}
