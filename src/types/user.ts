import type { Timestamp } from "firebase/firestore";

export type UserRole = "primary" | "partner";

export interface UserDocument {
  id: string;
  email: string;
  fullName: string;
  preferredName: string;
  role: UserRole;
  photoURL?: string;
  timezone: string;
  onboardingCompleted: boolean;
  notificationPreferences?: NotificationPreferences;
  privacySettings?: PrivacySettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PrimaryProfile {
  userId: string;
  averageCycleLength: number;
  averagePeriodDuration: number;
  lastPeriodStartDate?: Timestamp;
  dateOfBirth?: Timestamp;
  relationshipId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NotificationPreferences {
  enabled: boolean;
  dailyLogReminder: boolean;
  periodApproaching: boolean;
  partnerActivity: boolean;
  /** When true, notification bodies stay generic and never name a symptom. */
  hideSensitiveContent: boolean;
}

export interface PrivacySettings {
  appLockEnabled: boolean;
  privacyMode: boolean;
  hideSensitiveNotifications: boolean;
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  appLockEnabled: false,
  privacyMode: false,
  hideSensitiveNotifications: true,
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: false,
  dailyLogReminder: true,
  periodApproaching: true,
  partnerActivity: true,
  hideSensitiveContent: true,
};
