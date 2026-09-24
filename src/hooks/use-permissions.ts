"use client";

import { useCallback, useEffect, useState } from "react";
import { useRelationship } from "@/contexts/relationship-context";
import { savePermissions, syncSharedSummary } from "@/services/permission-service";
import type { PartnerPermissions } from "@/types/permission";

/**
 * Edits the sharing permissions and immediately rebuilds the shared summary, so
 * switching something off removes it from the partner's view straight away.
 */
export function usePermissions() {
  const { relationship, permissions, refresh } = useRelationship();
  const [draft, setDraft] = useState<PartnerPermissions>(permissions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(permissions);
  }, [permissions]);

  const toggle = useCallback(
    async (key: keyof PartnerPermissions, value: boolean) => {
      if (!relationship) return;

      const next = { ...draft, [key]: value };
      setDraft(next);
      setSaving(true);
      setError(null);

      try {
        await savePermissions(relationship.id, next);
        await syncSharedSummary(relationship, next);
        await refresh();
      } catch {
        setDraft(draft); // roll back the optimistic switch
        setError("Couldn't update that. Try again.");
      } finally {
        setSaving(false);
      }
    },
    [draft, relationship, refresh],
  );

  return { permissions: draft, toggle, saving, error, relationship };
}
