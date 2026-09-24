import type { Timestamp } from "firebase/firestore";
import type { CyclePhase, DateRange } from "./cycle";
import type { SupportRequest } from "./relationship";

export interface PartnerPermissions {
  shareCyclePhase: boolean;
  sharePredictedPeriod: boolean;
  shareMood: boolean;
  sharePainLevel: boolean;
  shareFlowStatus: boolean;
  shareSymptoms: boolean;
  shareSupportRequest: boolean;
  shareDailyNotes: boolean;
}

/** Everything is off by default; sharing is always an explicit choice by Aivel. */
export const DEFAULT_PARTNER_PERMISSIONS: PartnerPermissions = {
  shareCyclePhase: false,
  sharePredictedPeriod: false,
  shareMood: false,
  sharePainLevel: false,
  shareFlowStatus: false,
  shareSymptoms: false,
  shareSupportRequest: true,
  shareDailyNotes: false,
};

/** The personal two-person space shares every health field by design. */
export const FULL_PARTNER_PERMISSIONS: PartnerPermissions = {
  shareCyclePhase: true,
  sharePredictedPeriod: true,
  shareMood: true,
  sharePainLevel: true,
  shareFlowStatus: true,
  shareSymptoms: true,
  shareSupportRequest: true,
  shareDailyNotes: true,
};

export interface PermissionDocument extends PartnerPermissions {
  relationshipId: string;
  updatedAt: Timestamp;
}

export interface SharedSummary {
  relationshipId: string;
  primaryUserId: string;
  partnerUserId: string;
  cyclePhase?: CyclePhase;
  predictedPeriodRange?: DateRange;
  mood?: string;
  painLevel?: number;
  flowStatus?: string;
  symptoms?: string[];
  dailyNote?: string;
  supportRequest?: SupportRequest | null;
  updatedAt: Timestamp;
}

export interface PermissionAudit {
  permissionChangedAt?: Timestamp;
  partnerPairedAt?: Timestamp;
  partnerAccessRevokedAt?: Timestamp;
}

export const PERMISSION_LABELS: Record<keyof PartnerPermissions, string> = {
  shareCyclePhase: "Cycle phase",
  sharePredictedPeriod: "Next period estimate",
  shareMood: "Mood",
  sharePainLevel: "Pain level",
  shareFlowStatus: "Period status",
  shareSymptoms: "Symptoms",
  shareSupportRequest: "Support requests",
  shareDailyNotes: "Daily check-in",
};

export const PERMISSION_DESCRIPTIONS: Record<keyof PartnerPermissions, string> =
  {
    shareCyclePhase: "Your estimated cycle phase today.",
    sharePredictedPeriod: "The estimated date range for your next period.",
    shareMood: "The moods you logged today.",
    sharePainLevel: "Today's pain level and its description.",
    shareFlowStatus: "Whether you logged a period today.",
    shareSymptoms: "The symptoms you logged today.",
    shareSupportRequest: "Requests you choose to send to Ammar.",
    shareDailyNotes: "Your notes for today. Share only if you want to.",
  };
