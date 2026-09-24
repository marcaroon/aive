import { z } from "zod";
import {
  ACTIVITIES,
  ENERGY_LEVELS,
  MOODS,
  SLEEP_QUALITIES,
  SYMPTOMS,
} from "@/types/daily-log";
import { LOVE_NOTE_MAX_LENGTH, SUPPORT_REQUEST_TYPES } from "@/types/relationship";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export const dateKeySchema = z.string().regex(DATE_KEY, "Use the YYYY-MM-DD format.");

export const emailSchema = z
  .string()
  .min(1, "Enter your email.")
  .email("That email doesn't look right.");

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128, "That password is too long.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(1, "Enter your name.").max(80),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(["primary", "partner"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords don't match.",
  });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const onboardingSchema = z.object({
  preferredName: z.string().min(1, "Enter your preferred name.").max(40),
  dateOfBirth: z.string().regex(DATE_KEY).optional().or(z.literal("")),
  averageCycleLength: z.coerce
    .number()
    .int()
    .min(15, "Enter at least 15 days.")
    .max(60, "Enter 60 days or fewer."),
  averagePeriodDuration: z.coerce
    .number()
    .int()
    .min(1, "Enter at least 1 day.")
    .max(14, "Enter 14 days or fewer."),
  lastPeriodStartDate: dateKeySchema,
  notificationsEnabled: z.boolean(),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;

export const periodDaySchema = z.object({
  date: dateKeySchema,
  flowLevel: z.enum(["spotting", "light", "medium", "heavy"]),
  notes: z.string().max(300).optional(),
});

export const periodRangeSchema = z
  .object({
    startDate: dateKeySchema,
    endDate: dateKeySchema.optional().or(z.literal("")),
    flowLevel: z.enum(["spotting", "light", "medium", "heavy"]),
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    path: ["endDate"],
    message: "The end date must be on or after the start date.",
  });

export type PeriodRangeValues = z.infer<typeof periodRangeSchema>;

export const dailyLogSchema = z.object({
  date: dateKeySchema,
  moods: z.array(z.enum(MOODS)).max(MOODS.length),
  symptoms: z.array(z.enum(SYMPTOMS)).max(SYMPTOMS.length),
  painLevel: z.number().int().min(0).max(10).optional(),
  flowLevel: z.enum(["none", "spotting", "light", "medium", "heavy"]).optional(),
  energyLevel: z.enum(ENERGY_LEVELS).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  sleepQuality: z.enum(SLEEP_QUALITIES).optional(),
  sleepNotes: z.string().max(300).optional(),
  waterGlasses: z.number().int().min(0).max(30).optional(),
  activities: z.array(z.enum(ACTIVITIES)).optional(),
  privateNotes: z.string().max(2000).optional(),
});

export type DailyLogValues = z.infer<typeof dailyLogSchema>;

export const pairingCodeSchema = z.object({
  code: z
    .string()
    .min(6, "Enter the 6-character code.")
    .max(6, "Enter the 6-character code.")
    .transform((value) => value.trim().toUpperCase()),
});

export const loveNoteSchema = z.object({
  message: z
    .string()
    .min(1, "Write a little something first.")
    .max(LOVE_NOTE_MAX_LENGTH, `Keep it under ${LOVE_NOTE_MAX_LENGTH} characters.`),
  emoji: z.string().max(4).optional(),
});

export const supportRequestSchema = z
  .object({
    type: z.enum([...SUPPORT_REQUEST_TYPES, "Custom message"]),
    message: z.string().max(200).optional(),
  })
  .refine((data) => data.type !== "Custom message" || Boolean(data.message?.trim()), {
    path: ["message"],
    message: "Write your message first.",
  });

export const reminderSchema = z.object({
  type: z.enum([
    "period-approaching",
    "daily-log",
    "medication",
    "vitamin",
    "hydration",
    "sleep",
    "custom",
  ]),
  title: z.string().min(1, "Give your reminder a name.").max(60),
  message: z.string().max(160),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 09:00."),
  days: z.array(z.number().int().min(0).max(6)),
  enabled: z.boolean(),
  privateReminder: z.boolean(),
});

export type ReminderValues = z.infer<typeof reminderSchema>;

export const profileSchema = z.object({
  fullName: z.string().min(1, "Enter your name.").max(80),
  preferredName: z.string().min(1, "Enter your preferred name.").max(40),
});

/**
 * Notes are rendered as plain text, but we still strip control characters and
 * collapse runaway whitespace before anything is written to Firestore.
 */
export function sanitizeText(value: string): string {
  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Drop control characters (tab and newline stay) without embedding any in source.
  const cleaned = Array.from(normalized)
    .filter((char) => {
      if (char === "\n" || char === "\t") return true;
      const code = char.codePointAt(0) ?? 0;
      return code >= 0x20 && code !== 0x7f;
    })
    .join("");
  return cleaned.replace(/\n{4,}/g, "\n\n\n").trim();
}
