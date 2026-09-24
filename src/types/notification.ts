import type { Timestamp } from "firebase/firestore";

export type ReminderType =
  | "period-approaching"
  | "daily-log"
  | "medication"
  | "vitamin"
  | "hydration"
  | "sleep"
  | "custom";

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  message: string;
  enabled: boolean;
  /** HH:mm in the user's timezone. */
  time: string;
  /** 0 = Sunday … 6 = Saturday. Empty means every day. */
  days: number[];
  /** When true the reminder body is replaced by a neutral text in notifications. */
  privateReminder: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const REMINDER_PRESETS: Array<{
  type: ReminderType;
  title: string;
  message: string;
  time: string;
}> = [
  {
    type: "period-approaching",
    title: "Period coming up",
    message: "Your period may be coming up soon.",
    time: "09:00",
  },
  {
    type: "daily-log",
    title: "Daily check-in",
    message: "Quick check-in: how was your day?",
    time: "20:00",
  },
  { type: "medication", title: "Medication", message: "Time for your medication.", time: "08:00" },
  { type: "vitamin", title: "Vitamin", message: "A little nudge for your vitamins.", time: "08:00" },
  { type: "hydration", title: "Water", message: "Time for a water break.", time: "14:00" },
  { type: "sleep", title: "Sleep", message: "Time to wind down.", time: "22:00" },
  { type: "custom", title: "Custom reminder", message: "", time: "12:00" },
];

/** Dipakai menggantikan isi asli kalau pengingatnya ditandai privat. */
export const PRIVATE_REMINDER_TEXT = "A little reminder from Aivé.";
