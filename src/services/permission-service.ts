import { AUTH_ENABLED } from "@/lib/config";
import { privateCall } from "@/lib/private/client";
import {
  deleteDoc,
  deleteField,
  getDoc,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { permissionsDoc, sharedSummaryDoc } from "@/lib/firebase/collections";
import { buildSharedSummary, SUMMARY_FIELDS } from "@/lib/permissions/shared-summary";
import { getPrimaryProfile, loadCycleHistory } from "./cycle-service";
import { getDailyLog } from "./daily-log-service";
import { todayKey } from "@/lib/utils/date";
import { DEFAULT_PARTNER_PERMISSIONS } from "@/types/permission";
import type { PartnerPermissions, PermissionDocument, SharedSummary } from "@/types/permission";
import type { Relationship } from "@/types/relationship";

export async function getPermissions(relationshipId: string): Promise<PartnerPermissions> {
  if (!AUTH_ENABLED) return privateCall("getPermissions", [relationshipId]);
  const snapshot = await getDoc(permissionsDoc(relationshipId));
  if (!snapshot.exists()) return { ...DEFAULT_PARTNER_PERMISSIONS };

  const data = snapshot.data() as PermissionDocument;
  // Read each key explicitly so a missing field defaults to "not shared".
  return {
    shareCyclePhase: data.shareCyclePhase ?? false,
    sharePredictedPeriod: data.sharePredictedPeriod ?? false,
    shareMood: data.shareMood ?? false,
    sharePainLevel: data.sharePainLevel ?? false,
    shareFlowStatus: data.shareFlowStatus ?? false,
    shareSymptoms: data.shareSymptoms ?? false,
    shareSupportRequest: data.shareSupportRequest ?? false,
    shareDailyNotes: data.shareDailyNotes ?? false,
  };
}

export async function savePermissions(
  relationshipId: string,
  permissions: PartnerPermissions,
): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("savePermissions", [relationshipId, permissions]);
  await setDoc(
    permissionsDoc(relationshipId),
    { relationshipId, ...permissions, updatedAt: serverTimestamp() } as never,
    { merge: true },
  );
}

export async function getSharedSummary(relationshipId: string): Promise<SharedSummary | null> {
  if (!AUTH_ENABLED) return privateCall("getSharedSummary", [relationshipId]);
  const snapshot = await getDoc(sharedSummaryDoc(relationshipId));
  return snapshot.exists() ? snapshot.data() : null;
}

/**
 * Rebuilds the partner-visible summary from scratch.
 *
 * Call this whenever a daily log, a period, or a permission changes. Fields the
 * current permissions do not allow are deleted from the document, so switching a
 * permission off removes the data immediately rather than leaving it stale.
 */
export async function syncSharedSummary(
  relationship: Relationship,
  permissionsOverride?: PartnerPermissions,
): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("syncSharedSummary", [relationship, permissionsOverride]);
  if (relationship.status !== "active" || !relationship.partnerUserId) return;

  const permissions = permissionsOverride ?? (await getPermissions(relationship.id));
  const primaryUserId = relationship.primaryUserId;
  const today = todayKey();

  const profile = await getPrimaryProfile(primaryUserId);
  const history = await loadCycleHistory(primaryUserId, profile);
  const todayLog = await getDailyLog(primaryUserId, today);

  const fields = buildSharedSummary(permissions, {
    prediction: history.prediction,
    todayLog,
    isOnPeriodToday: history.periodDays.some((day) => day.date === today),
  });

  const payload: DocumentData = {
    relationshipId: relationship.id,
    primaryUserId,
    partnerUserId: relationship.partnerUserId,
    updatedAt: serverTimestamp(),
  };

  for (const field of SUMMARY_FIELDS) {
    payload[field] = field in fields ? fields[field] : deleteField();
  }

  await setDoc(sharedSummaryDoc(relationship.id), payload as never, { merge: true });
}

/** Removes the shared summary entirely — used when access is revoked. */
export async function clearSharedSummary(relationshipId: string): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("clearSharedSummary", [relationshipId]);
  await deleteDoc(sharedSummaryDoc(relationshipId));
}
