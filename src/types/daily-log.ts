import type { Timestamp } from "firebase/firestore";
import type { FlowLevel } from "./cycle";

export const MOODS = [
  "happy",
  "calm",
  "loved",
  "energetic",
  "neutral",
  "tired",
  "anxious",
  "sensitive",
  "sad",
  "angry",
  "overwhelmed",
] as const;

export type Mood = (typeof MOODS)[number];

export const SYMPTOMS = [
  "cramps",
  "headache",
  "migraine",
  "back pain",
  "breast tenderness",
  "bloating",
  "acne",
  "nausea",
  "dizziness",
  "fatigue",
  "cravings",
  "increased appetite",
  "low appetite",
  "diarrhea",
  "constipation",
  "insomnia",
] as const;

export type Symptom = (typeof SYMPTOMS)[number];

export const ENERGY_LEVELS = ["very low", "low", "normal", "high", "very high"] as const;
export type EnergyLevel = (typeof ENERGY_LEVELS)[number];

export const SLEEP_QUALITIES = ["poor", "fair", "good", "great"] as const;
export type SleepQuality = (typeof SLEEP_QUALITIES)[number];

export const ACTIVITIES = [
  "none",
  "walking",
  "stretching",
  "yoga",
  "workout",
  "other",
] as const;
export type Activity = (typeof ACTIVITIES)[number];

export interface DailyLog {
  /** YYYY-MM-DD — also the document id. */
  date: string;
  moods: Mood[];
  symptoms: Symptom[];
  painLevel?: number;
  flowLevel?: FlowLevel;
  energyLevel?: EnergyLevel;
  sleepHours?: number;
  sleepQuality?: SleepQuality;
  sleepNotes?: string;
  waterGlasses?: number;
  activities?: Activity[];
  /** Never leaves the primary user's own collection unless explicitly shared. */
  privateNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type DailyLogInput = Omit<DailyLog, "createdAt" | "updatedAt">;

export type LogCompleteness = "not-logged" | "partial" | "complete";

/**
 * Nilai yang disimpan di Firestore tetap bahasa Inggris (kanonik, dipakai Zod
 * dan tes). Yang di bawah ini cuma label buat ditampilkan.
 */
export const MOOD_LABELS: Record<Mood, string> = {
  happy: "happy",
  calm: "calm",
  loved: "feeling loved",
  energetic: "energized",
  neutral: "okay",
  tired: "tired",
  anxious: "anxious",
  sensitive: "sensitive",
  sad: "sad",
  angry: "annoyed",
  overwhelmed: "overwhelmed",
};

export const SYMPTOM_LABELS: Record<Symptom, string> = {
  cramps: "cramps",
  headache: "headache",
  migraine: "migraine",
  "back pain": "back pain",
  "breast tenderness": "breast tenderness",
  bloating: "bloating",
  acne: "breakouts",
  nausea: "nausea",
  dizziness: "dizziness",
  fatigue: "low energy",
  cravings: "cravings",
  "increased appetite": "increased appetite",
  "low appetite": "low appetite",
  diarrhea: "diarrhea",
  constipation: "constipation",
  insomnia: "trouble sleeping",
};

export const ENERGY_LABELS: Record<EnergyLevel, string> = {
  "very low": "very low",
  low: "low",
  normal: "normal",
  high: "high",
  "very high": "very high",
};

export const SLEEP_QUALITY_LABELS: Record<SleepQuality, string> = {
  poor: "poor",
  fair: "fair",
  good: "good",
  great: "great",
};

export const ACTIVITY_LABELS: Record<Activity, string> = {
  none: "rest day",
  walking: "walking",
  stretching: "stretching",
  yoga: "yoga",
  workout: "workout",
  other: "other",
};

/** Label buat skala sakit 0–10. */
export function painLabel(level: number): string {
  if (level <= 0) return "no pain";
  if (level <= 3) return "mild";
  if (level <= 6) return "moderate";
  if (level <= 8) return "severe";
  return "very severe";
}
