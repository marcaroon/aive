import type { Timestamp } from "firebase/firestore";

export type RelationshipStatus = "pending" | "active" | "revoked";

export interface Relationship {
  id: string;
  primaryUserId: string;
  partnerUserId: string | null;
  status: RelationshipStatus;
  /** The invitation this pairing came from — the Security Rules verify against it. */
  inviteCode?: string;
  pairedAt?: Timestamp;
  revokedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type InvitationStatus = "active" | "used" | "expired" | "revoked";

export interface PartnerInvitation {
  id: string;
  primaryUserId: string;
  code: string;
  expiresAt: Timestamp;
  usedAt?: Timestamp;
  usedBy?: string;
  status: InvitationStatus;
  createdAt: Timestamp;
}

export const SUPPORT_REQUEST_TYPES = [
  "I need a hug",
  "Please call me",
  "I need some rest",
  "Please give me some space",
  "Can you bring me something?",
  "I am not feeling well",
] as const;

export type SupportRequestType = (typeof SUPPORT_REQUEST_TYPES)[number] | "Custom message";

/** Nilai di atas yang disimpan; ini label buat ditampilkan. */
export const SUPPORT_REQUEST_LABELS: Record<SupportRequestType, string> = {
  "I need a hug": "I could use a hug",
  "Please call me": "Call me?",
  "I need some rest": "I need some rest",
  "Please give me some space": "I need a little space",
  "Can you bring me something?": "Could you bring me something?",
  "I am not feeling well": "I'm not feeling great",
  "Custom message": "Write your own",
};

export type SupportRequestStatus = "sent" | "seen" | "acknowledged" | "resolved";

export const SUPPORT_STATUS_LABELS: Record<SupportRequestStatus, string> = {
  sent: "New",
  seen: "Seen",
  acknowledged: "Acknowledged",
  resolved: "Done",
};

export interface SupportRequest {
  id: string;
  type: SupportRequestType;
  message?: string;
  status: SupportRequestStatus;
  /** What the partner tapped: "I'm here for you" / "On my way". */
  response?: string;
  createdAt: Timestamp;
  seenAt?: Timestamp;
  acknowledgedAt?: Timestamp;
  resolvedAt?: Timestamp;
}

export interface LoveNote {
  id: string;
  authorId: string;
  message: string;
  emoji?: string;
  reaction?: string;
  createdAt: Timestamp;
  readAt?: Timestamp;
  /** Hidden from the recipient's list without deleting the other side's copy. */
  hiddenForUserIds?: string[];
}

export const LOVE_NOTE_MAX_LENGTH = 280;
