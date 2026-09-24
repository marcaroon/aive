import { AUTH_ENABLED } from "@/lib/config";
import { privateCall } from "@/lib/private/client";
import {
  deleteField,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { dailyLogDoc, dailyLogsCollection } from "@/lib/firebase/collections";
import { sanitizeText, type DailyLogValues } from "@/lib/validation/schemas";
import type { DailyLog, LogCompleteness } from "@/types/daily-log";
import type { DateKey } from "@/lib/utils/date";

export async function getDailyLog(userId: string, date: DateKey): Promise<DailyLog | null> {
  if (!AUTH_ENABLED) return privateCall("getDailyLog", [userId, date]);
  const snapshot = await getDoc(dailyLogDoc(userId, date));
  return snapshot.exists() ? snapshot.data() : null;
}

/**
 * Saves the log for one date. Fields the user cleared are removed rather than
 * written as null, so a blank value never lingers in a shared summary.
 */
export async function saveDailyLog(
  userId: string,
  values: DailyLogValues & { date: DateKey },
): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("saveDailyLog", [userId, values]);
  const reference = dailyLogDoc(userId, values.date);
  const existing = await getDoc(reference);

  const optionalFields: Array<keyof DailyLogValues & string> = [
    "painLevel",
    "flowLevel",
    "energyLevel",
    "sleepHours",
    "sleepQuality",
    "sleepNotes",
    "waterGlasses",
    "activities",
    "privateNotes",
  ];

  const payload: DocumentData = {
    date: values.date,
    moods: values.moods,
    symptoms: values.symptoms,
    updatedAt: serverTimestamp(),
    ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
  };

  for (const field of optionalFields) {
    const value = values[field];
    const isEmpty =
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);

    if (isEmpty) {
      if (existing.exists()) payload[field] = deleteField();
      continue;
    }
    payload[field] =
      field === "privateNotes" || field === "sleepNotes"
        ? sanitizeText(String(value))
        : value;
  }

  await setDoc(reference, payload, { merge: true });
}

export async function listRecentLogs(userId: string, count = 90): Promise<DailyLog[]> {
  if (!AUTH_ENABLED) return privateCall("listRecentLogs", [userId, count]);
  const snapshot = await getDocs(
    query(dailyLogsCollection(userId), orderBy("date", "desc"), limit(count)),
  );
  return snapshot.docs.map((entry) => entry.data());
}

export async function listLogsBetween(
  userId: string,
  start: DateKey,
  end: DateKey,
): Promise<DailyLog[]> {
  if (!AUTH_ENABLED) return privateCall("listLogsBetween", [userId, start, end]);
  const snapshot = await getDocs(
    query(
      dailyLogsCollection(userId),
      where("date", ">=", start),
      where("date", "<=", end),
      orderBy("date", "asc"),
    ),
  );
  return snapshot.docs.map((entry) => entry.data());
}

/**
 * How complete today's log is. Used for a gentle status chip — never to nag or
 * penalise the user for skipping a day.
 */
export function logCompleteness(log: DailyLog | null): LogCompleteness {
  if (!log) return "not-logged";

  const signals = [
    log.moods.length > 0,
    log.symptoms.length > 0,
    log.painLevel !== undefined,
    log.flowLevel !== undefined,
    log.energyLevel !== undefined,
    log.sleepHours !== undefined,
    log.waterGlasses !== undefined,
    (log.activities?.length ?? 0) > 0,
  ];

  const filled = signals.filter(Boolean).length;
  if (filled === 0) return "not-logged";
  return filled >= 4 ? "complete" : "partial";
}

export const COMPLETENESS_LABELS: Record<LogCompleteness, string> = {
  "not-logged": "Not logged",
  partial: "Partially logged",
  complete: "Completed",
};
