import { AUTH_ENABLED } from "@/lib/config";
import { privateCall } from "@/lib/private/client";
import {
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { paths, remindersCollection } from "@/lib/firebase/collections";
import type { ReminderValues } from "@/lib/validation/schemas";
import type { Reminder } from "@/types/notification";
import type { NotificationPreferences, PrivacySettings } from "@/types/user";

export async function listReminders(userId: string): Promise<Reminder[]> {
  if (!AUTH_ENABLED) return privateCall("listReminders", [userId]);
  const snapshot = await getDocs(query(remindersCollection(userId), orderBy("time", "asc")));
  return snapshot.docs.map((entry) => entry.data());
}

export async function createReminder(userId: string, values: ReminderValues): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("createReminder", [userId, values]);
  await addDoc(remindersCollection(userId), {
    ...values,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as unknown as Reminder);
}

export async function updateReminder(
  userId: string,
  reminderId: string,
  values: Partial<ReminderValues>,
): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("updateReminder", [userId, reminderId, values]);
  await updateDoc(doc(getDb(), paths.reminders(userId), reminderId), {
    ...values,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteReminder(userId: string, reminderId: string): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("deleteReminder", [userId, reminderId]);
  await deleteDoc(doc(getDb(), paths.reminders(userId), reminderId));
}

/** Notification and privacy preferences live on the user document. */
export async function savePreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>,
): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("savePreferences", [userId, preferences]);
  await setDoc(
    doc(getDb(), paths.users, userId),
    {
      notificationPreferences: preferences,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function savePrivacySettings(
  userId: string,
  settings: Partial<PrivacySettings>,
): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("savePrivacySettings", [userId, settings]);
  await setDoc(
    doc(getDb(), paths.users, userId),
    {
      privacySettings: settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
