import { AUTH_ENABLED } from "@/lib/config";
import { privateCall } from "@/lib/private/client";
import { deleteDoc, doc, getDocs, writeBatch } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { getDb, getFirebaseAuth } from "@/lib/firebase/client";
import {
  cyclesCollection,
  dailyLogsCollection,
  paths,
  periodDaysCollection,
  remindersCollection,
  sharedSummaryDoc,
} from "@/lib/firebase/collections";
import { getPrimaryProfile, listPeriodDays } from "./cycle-service";
import { listRecentLogs } from "./daily-log-service";
import { getRelationshipForUser } from "./relationship-service";
import { timestampToDateKey } from "@/lib/utils/date";
import type { UserDocument } from "@/types/user";

/**
 * Builds a complete, human-readable export of everything the user recorded.
 * Runs entirely in the browser — the file is never uploaded anywhere.
 */
export async function exportPersonalData(
  userId: string,
  profile: UserDocument,
): Promise<string> {
  const [primaryProfile, periodDays, logs] = await Promise.all([
    getPrimaryProfile(userId),
    listPeriodDays(userId),
    listRecentLogs(userId, 2000),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    account: {
      email: profile.email,
      fullName: profile.fullName,
      preferredName: profile.preferredName,
      role: profile.role,
      timezone: profile.timezone,
    },
    cycleSettings: primaryProfile
      ? {
          averageCycleLength: primaryProfile.averageCycleLength,
          averagePeriodDuration: primaryProfile.averagePeriodDuration,
          lastPeriodStartDate: timestampToDateKey(primaryProfile.lastPeriodStartDate),
        }
      : null,
    periodDays: periodDays.map((day) => ({
      date: day.date,
      flowLevel: day.flowLevel,
      notes: day.notes ?? null,
    })),
    dailyLogs: logs.map((log) => ({
      date: log.date,
      moods: log.moods,
      symptoms: log.symptoms,
      painLevel: log.painLevel ?? null,
      flowLevel: log.flowLevel ?? null,
      energyLevel: log.energyLevel ?? null,
      sleepHours: log.sleepHours ?? null,
      sleepQuality: log.sleepQuality ?? null,
      waterGlasses: log.waterGlasses ?? null,
      activities: log.activities ?? [],
      privateNotes: log.privateNotes ?? null,
    })),
  };

  return JSON.stringify(payload, null, 2);
}

export function downloadJson(contents: string, filename: string): void {
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function deleteCollection(
  reference: ReturnType<typeof dailyLogsCollection>,
): Promise<void> {
  const snapshot = await getDocs(reference);
  if (snapshot.empty) return;
  const batch = writeBatch(getDb());
  for (const entry of snapshot.docs) batch.delete(entry.ref);
  await batch.commit();
}

/**
 * Removes every health record while leaving the account itself intact.
 * The shared summary goes first so the partner loses visibility immediately.
 */
export async function deleteHealthData(userId: string): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("deleteHealthData", [userId]);
  const relationship = await getRelationshipForUser(userId, "primary");
  if (relationship) {
    await deleteDoc(sharedSummaryDoc(relationship.id));
  }

  await deleteCollection(dailyLogsCollection(userId));
  await deleteCollection(periodDaysCollection(userId) as never);
  await deleteCollection(cyclesCollection(userId) as never);
  await deleteCollection(remindersCollection(userId) as never);

  await deleteDoc(doc(getDb(), paths.primaryProfiles, userId));
}

/**
 * Full account removal. Firebase requires a recent sign-in for this, so the
 * caller surfaces a "please sign in again" message when it refuses.
 */
export async function deleteAccount(userId: string): Promise<void> {
  await deleteHealthData(userId);
  await deleteDoc(doc(getDb(), paths.users, userId));

  const current = getFirebaseAuth().currentUser;
  if (current) await deleteUser(current);
}
