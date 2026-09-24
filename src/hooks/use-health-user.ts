"use client";

import { useAuthContext } from "@/contexts/auth-context";
import { useRelationship } from "@/contexts/relationship-context";

/** Both spaces read Aivel's health history; writes still use the primary identity. */
export function useHealthUser() {
  const { user, profile } = useAuthContext();
  const { relationship } = useRelationship();
  const isPartner = profile?.role === "partner";
  return {
    userId: isPartner
      ? (relationship?.primaryUserId ?? null)
      : (user?.uid ?? null),
    isPartner,
  };
}
