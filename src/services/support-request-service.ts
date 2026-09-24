import { AUTH_ENABLED } from "@/lib/config";
import { privateCall } from "@/lib/private/client";
import {
  addDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { paths, supportRequestsCollection } from "@/lib/firebase/collections";
import { sanitizeText } from "@/lib/validation/schemas";
import type {
  SupportRequest,
  SupportRequestStatus,
  SupportRequestType,
} from "@/types/relationship";

export const PARTNER_RESPONSES = ["I'm here for you", "On my way"] as const;

export async function listSupportRequests(
  relationshipId: string,
  count = 20,
): Promise<SupportRequest[]> {
  if (!AUTH_ENABLED) return privateCall("listSupportRequests", [relationshipId, count]);
  const snapshot = await getDocs(
    query(supportRequestsCollection(relationshipId), orderBy("createdAt", "desc"), limit(count)),
  );
  return snapshot.docs.map((entry) => entry.data());
}

export async function getLatestOpenRequest(
  relationshipId: string,
): Promise<SupportRequest | null> {
  const requests = await listSupportRequests(relationshipId, 5);
  return requests.find((request) => request.status !== "resolved") ?? null;
}

export async function sendSupportRequest(
  relationshipId: string,
  type: SupportRequestType,
  message?: string,
): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("sendSupportRequest", [relationshipId, type, message]);
  const clean = message ? sanitizeText(message).slice(0, 200) : undefined;

  await addDoc(supportRequestsCollection(relationshipId), {
    type,
    ...(clean ? { message: clean } : {}),
    status: "sent",
    createdAt: serverTimestamp(),
  } as never);
}

const STATUS_TIMESTAMP: Record<SupportRequestStatus, string | null> = {
  sent: null,
  seen: "seenAt",
  acknowledged: "acknowledgedAt",
  resolved: "resolvedAt",
};

export async function updateRequestStatus(
  relationshipId: string,
  requestId: string,
  status: SupportRequestStatus,
  response?: string,
): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("updateRequestStatus", [relationshipId, requestId, status, response]);
  const timestampField = STATUS_TIMESTAMP[status];

  await updateDoc(doc(getDb(), paths.supportRequests(relationshipId), requestId), {
    status,
    ...(timestampField ? { [timestampField]: serverTimestamp() } : {}),
    ...(response ? { response } : {}),
  });
}
