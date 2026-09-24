"use client";

import { useAuthContext } from "@/contexts/auth-context";
import { useRelationship } from "@/contexts/relationship-context";
import { useAsync } from "./use-async";
import { listLoveNotes } from "@/services/love-note-service";
import { getLatestOpenRequest, listSupportRequests } from "@/services/support-request-service";
import { getSharedSummary } from "@/services/permission-service";
import type { LoveNote, SupportRequest } from "@/types/relationship";
import type { SharedSummary } from "@/types/permission";

export function useLoveNotes(count = 30) {
  const { user } = useAuthContext();
  const { relationship } = useRelationship();
  const relationshipId = relationship?.id ?? null;
  const userId = user?.uid ?? null;

  return useAsync<LoveNote[]>(
    relationshipId && userId ? () => listLoveNotes(relationshipId, userId, count) : null,
    [relationshipId, userId, count],
    15000,
  );
}

export function useLatestLoveNote() {
  const notes = useLoveNotes(5);
  const { user } = useAuthContext();

  const latest =
    notes.data?.find((note) => note.authorId !== user?.uid) ?? null;

  return { ...notes, latest };
}

export function useSupportRequests(count = 20) {
  const { relationship } = useRelationship();
  const relationshipId = relationship?.id ?? null;

  return useAsync<SupportRequest[]>(
    relationshipId ? () => listSupportRequests(relationshipId, count) : null,
    [relationshipId, count],
    15000,
  );
}

export function useOpenSupportRequest() {
  const { relationship } = useRelationship();
  const relationshipId = relationship?.id ?? null;

  return useAsync<SupportRequest | null>(
    relationshipId ? () => getLatestOpenRequest(relationshipId) : null,
    [relationshipId],
    15000,
  );
}

/** The partner's only window into Aivel's data. */
export function useSharedSummary() {
  const { relationship } = useRelationship();
  const relationshipId = relationship?.id ?? null;

  return useAsync<SharedSummary | null>(
    relationshipId ? () => getSharedSummary(relationshipId) : null,
    [relationshipId],
    15000,
  );
}
