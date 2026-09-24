import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
} from "firebase/firestore";
import { getDb } from "./client";
import { createConverter, createPlainConverter } from "./converters";
import type { PrimaryProfile, UserDocument } from "@/types/user";
import type { Cycle, PeriodDay } from "@/types/cycle";
import type { DailyLog } from "@/types/daily-log";
import type { LoveNote, PartnerInvitation, Relationship, SupportRequest } from "@/types/relationship";
import type { PermissionDocument, SharedSummary } from "@/types/permission";
import type { Reminder } from "@/types/notification";

/**
 * Single source of truth for collection paths. Keeping them here means the
 * Firestore Security Rules and the client can be reviewed side by side.
 */
export const paths = {
  users: "users",
  primaryProfiles: "primaryProfiles",
  relationships: "relationships",
  partnerInvitations: "partnerInvitations",
  sharedSummaries: "sharedSummaries",
  cycles: (userId: string) => `users/${userId}/cycles`,
  periodDays: (userId: string) => `users/${userId}/periodDays`,
  dailyLogs: (userId: string) => `users/${userId}/dailyLogs`,
  reminders: (userId: string) => `users/${userId}/reminders`,
  supportRequests: (relationshipId: string) =>
    `relationships/${relationshipId}/supportRequests`,
  loveNotes: (relationshipId: string) => `relationships/${relationshipId}/loveNotes`,
  permissions: (relationshipId: string) => `relationships/${relationshipId}/permissions`,
} as const;

export function userDoc(userId: string): DocumentReference<UserDocument> {
  return doc(getDb(), paths.users, userId).withConverter(createConverter<UserDocument>());
}

export function primaryProfileDoc(userId: string): DocumentReference<PrimaryProfile> {
  return doc(getDb(), paths.primaryProfiles, userId).withConverter(
    createPlainConverter<PrimaryProfile>(),
  );
}

export function cyclesCollection(userId: string): CollectionReference<Cycle> {
  return collection(getDb(), paths.cycles(userId)).withConverter(createConverter<Cycle>());
}

export function periodDaysCollection(userId: string): CollectionReference<PeriodDay> {
  return collection(getDb(), paths.periodDays(userId)).withConverter(
    createConverter<PeriodDay>(),
  );
}

export function dailyLogsCollection(userId: string): CollectionReference<DailyLog> {
  return collection(getDb(), paths.dailyLogs(userId)).withConverter(
    createPlainConverter<DailyLog>(),
  );
}

export function dailyLogDoc(userId: string, date: string): DocumentReference<DailyLog> {
  return doc(getDb(), paths.dailyLogs(userId), date).withConverter(
    createPlainConverter<DailyLog>(),
  );
}

export function remindersCollection(userId: string): CollectionReference<Reminder> {
  return collection(getDb(), paths.reminders(userId)).withConverter(
    createConverter<Reminder>(),
  );
}

export function relationshipsCollection(): CollectionReference<Relationship> {
  return collection(getDb(), paths.relationships).withConverter(
    createConverter<Relationship>(),
  );
}

export function relationshipDoc(relationshipId: string): DocumentReference<Relationship> {
  return doc(getDb(), paths.relationships, relationshipId).withConverter(
    createConverter<Relationship>(),
  );
}

export function invitationsCollection(): CollectionReference<PartnerInvitation> {
  return collection(getDb(), paths.partnerInvitations).withConverter(
    createConverter<PartnerInvitation>(),
  );
}

export function permissionsDoc(relationshipId: string): DocumentReference<PermissionDocument> {
  return doc(getDb(), paths.permissions(relationshipId), "current").withConverter(
    createPlainConverter<PermissionDocument>(),
  );
}

export function sharedSummaryDoc(relationshipId: string): DocumentReference<SharedSummary> {
  return doc(getDb(), paths.sharedSummaries, relationshipId).withConverter(
    createPlainConverter<SharedSummary>(),
  );
}

export function supportRequestsCollection(
  relationshipId: string,
): CollectionReference<SupportRequest> {
  return collection(getDb(), paths.supportRequests(relationshipId)).withConverter(
    createConverter<SupportRequest>(),
  );
}

export function loveNotesCollection(relationshipId: string): CollectionReference<LoveNote> {
  return collection(getDb(), paths.loveNotes(relationshipId)).withConverter(
    createConverter<LoveNote>(),
  );
}
