import { AUTH_ENABLED } from "@/lib/config";
import { privateCall } from "@/lib/private/client";
import {
  Timestamp,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { addHours } from "date-fns";
import { getDb } from "@/lib/firebase/client";
import {
  invitationsCollection,
  paths,
  permissionsDoc,
  relationshipDoc,
  relationshipsCollection,
  sharedSummaryDoc,
} from "@/lib/firebase/collections";
import { DEFAULT_PARTNER_PERMISSIONS } from "@/types/permission";
import type { PartnerInvitation, Relationship } from "@/types/relationship";
import type { UserRole } from "@/types/user";

/** Ambiguous characters (O/0, I/1) are left out so a code is easy to read aloud. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const INVITE_TTL_HOURS = 24;
/** Cheap abuse guard: no more than this many live invites at once. */
const MAX_ACTIVE_INVITES = 3;

export class PairingError extends Error {}

function randomCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

export function isInvitationUsable(invitation: PartnerInvitation): boolean {
  return invitation.status === "active" && invitation.expiresAt.toMillis() > Date.now();
}

export async function listActiveInvitations(
  primaryUserId: string,
): Promise<PartnerInvitation[]> {
  if (!AUTH_ENABLED) return privateCall("listActiveInvitations", [primaryUserId]);
  const snapshot = await getDocs(
    query(
      invitationsCollection(),
      where("primaryUserId", "==", primaryUserId),
      where("status", "==", "active"),
    ),
  );
  return snapshot.docs.map((entry) => entry.data()).filter(isInvitationUsable);
}

/**
 * Creates a single-use pairing code. The document id is the code itself so the
 * partner can look it up with a direct read — no collection listing required,
 * which keeps the Security Rules tight.
 */
export async function createPairingCode(primaryUserId: string): Promise<PartnerInvitation> {
  if (!AUTH_ENABLED) return privateCall("createPairingCode", [primaryUserId]);
  const active = await listActiveInvitations(primaryUserId);
  if (active.length >= MAX_ACTIVE_INVITES) {
    throw new PairingError(
      "You already have a few active codes. Cancel one before making another.",
    );
  }

  const code = randomCode();
  const expiresAt = Timestamp.fromDate(addHours(new Date(), INVITE_TTL_HOURS));

  await setDoc(doc(getDb(), paths.partnerInvitations, code), {
    primaryUserId,
    code,
    expiresAt,
    status: "active",
    createdAt: serverTimestamp(),
  });

  const created = await getDoc(doc(getDb(), paths.partnerInvitations, code));
  return { id: code, ...created.data() } as PartnerInvitation;
}

export async function cancelInvitation(code: string): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("cancelInvitation", [code]);
  await updateDoc(doc(getDb(), paths.partnerInvitations, code), { status: "revoked" });
}

async function findRelationship(
  field: "primaryUserId" | "partnerUserId",
  userId: string,
): Promise<Relationship | null> {
  const snapshot = await getDocs(
    query(
      relationshipsCollection(),
      where(field, "==", userId),
      where("status", "==", "active"),
      limit(1),
    ),
  );
  return snapshot.empty ? null : snapshot.docs[0].data();
}

export async function getRelationshipForUser(
  userId: string,
  role: UserRole,
): Promise<Relationship | null> {
  if (!AUTH_ENABLED) return privateCall("getRelationshipForUser", [userId, role]);
  return findRelationship(role === "primary" ? "primaryUserId" : "partnerUserId", userId);
}

/**
 * Redeems a pairing code. Every guard here is mirrored in the Firestore Security
 * Rules — the client checks exist only to produce a readable error message.
 */
export async function redeemPairingCode(
  code: string,
  partnerUserId: string,
): Promise<Relationship> {
  if (!AUTH_ENABLED) return privateCall("redeemPairingCode", [code, partnerUserId]);
  const inviteRef = doc(getDb(), paths.partnerInvitations, code);
  const inviteSnapshot = await getDoc(inviteRef);

  if (!inviteSnapshot.exists()) {
    throw new PairingError("That code wasn't found.");
  }

  const invitation = { id: code, ...inviteSnapshot.data() } as PartnerInvitation;

  if (invitation.status === "used") {
    throw new PairingError("That code has already been used.");
  }
  if (invitation.status === "revoked") {
    throw new PairingError("This invite has been cancelled.");
  }
  if (!isInvitationUsable(invitation)) {
    throw new PairingError("This code has expired. Ask for a new one.");
  }
  if (invitation.primaryUserId === partnerUserId) {
    throw new PairingError("You can't use your own invite code.");
  }

  const existing = await getRelationshipForUser(partnerUserId, "partner");
  if (existing) {
    throw new PairingError("You're already connected.");
  }

  const relationshipRef = await addDoc(relationshipsCollection(), {
    primaryUserId: invitation.primaryUserId,
    partnerUserId,
    status: "active",
    inviteCode: code,
    pairedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as never);

  await updateDoc(inviteRef, {
    status: "used",
    usedAt: serverTimestamp(),
    usedBy: partnerUserId,
  });

  const snapshot = await getDoc(relationshipDoc(relationshipRef.id));
  return snapshot.data() as Relationship;
}

/**
 * Called by the primary user right after pairing: writes the default (all-off)
 * permissions and links the relationship to the profile.
 */
export async function initialisePairedRelationship(
  relationshipId: string,
  primaryUserId: string,
): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("initialisePairedRelationship", [relationshipId, primaryUserId]);
  await setDoc(permissionsDoc(relationshipId), {
    relationshipId,
    ...DEFAULT_PARTNER_PERMISSIONS,
    updatedAt: serverTimestamp(),
  } as never);

  await setDoc(
    doc(getDb(), paths.primaryProfiles, primaryUserId),
    { relationshipId, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/**
 * Revokes partner access. The shared summary is deleted outright so nothing
 * remains readable, and the relationship is marked revoked rather than removed
 * so the audit trail survives.
 */
export async function revokePartnerAccess(
  relationshipId: string,
  primaryUserId: string,
): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("revokePartnerAccess", [relationshipId, primaryUserId]);
  await deleteDoc(sharedSummaryDoc(relationshipId));

  await updateDoc(relationshipDoc(relationshipId), {
    status: "revoked",
    revokedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(
    doc(getDb(), paths.primaryProfiles, primaryUserId),
    { relationshipId: null, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
