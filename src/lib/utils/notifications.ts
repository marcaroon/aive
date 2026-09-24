import { PRIVATE_REMINDER_TEXT, type Reminder } from "@/types/notification";
import { REMINDERS } from "@/lib/copy";

export type NotificationPermissionState = "unsupported" | "default" | "granted" | "denied";

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as NotificationPermissionState;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  const result = await Notification.requestPermission();
  return result as NotificationPermissionState;
}

/**
 * Builds the text that actually reaches the lock screen.
 *
 * A reminder marked private, or a user who asked to hide sensitive content,
 * gets a neutral message — a notification must never reveal a symptom, a mood,
 * or a period date to whoever happens to glance at the phone.
 */
export function buildNotificationText(
  reminder: Pick<Reminder, "title" | "message" | "privateReminder">,
  hideSensitiveContent: boolean,
): { title: string; body: string } {
  if (reminder.privateReminder || hideSensitiveContent) {
    return { title: "Aivé", body: PRIVATE_REMINDER_TEXT };
  }
  return { title: reminder.title, body: reminder.message };
}

/** Fires a local notification now. Aivé never sends reminder text to a server. */
export function showLocalNotification(title: string, body: string): void {
  if (getNotificationPermission() !== "granted") return;
  new Notification(title, { body, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png" });
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function describeSchedule(time: string, days: number[]): string {
  if (days.length === 0 || days.length === 7) return REMINDERS.everyDay(time);
  return REMINDERS.onDays(days.map((day) => DAY_LABELS[day]).join(", "), time);
}

export { DAY_LABELS };
