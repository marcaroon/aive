"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuthContext } from "./auth-context";
import { getRelationshipForUser } from "@/services/relationship-service";
import { getPermissions } from "@/services/permission-service";
import {
  DEFAULT_PARTNER_PERMISSIONS,
  type PartnerPermissions,
} from "@/types/permission";
import type { Relationship } from "@/types/relationship";

interface RelationshipContextValue {
  relationship: Relationship | null;
  permissions: PartnerPermissions;
  loading: boolean;
  refresh: () => Promise<void>;
}

const RelationshipContext = createContext<RelationshipContextValue | null>(
  null,
);

export function RelationshipProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuthContext();
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [permissions, setPermissions] = useState<PartnerPermissions>(
    DEFAULT_PARTNER_PERMISSIONS,
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (background = false) => {
      if (!user || !profile) {
        setRelationship(null);
        setPermissions(DEFAULT_PARTNER_PERMISSIONS);
        setLoading(false);
        return;
      }

      if (!background) setLoading(true);
      try {
        const found = await getRelationshipForUser(user.uid, profile.role);
        setRelationship((previous) =>
          JSON.stringify(previous) === JSON.stringify(found) ? previous : found,
        );
        const nextPermissions = found
          ? await getPermissions(found.id)
          : DEFAULT_PARTNER_PERMISSIONS;
        setPermissions((previous) =>
          JSON.stringify(previous) === JSON.stringify(nextPermissions)
            ? previous
            : nextPermissions,
        );
      } catch {
        // A failed read must fall back to "nothing is shared", never to open access.
        setRelationship(null);
        setPermissions(DEFAULT_PARTNER_PERMISSIONS);
      } finally {
        setLoading(false);
      }
    },
    [user, profile],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [load]);

  const value = useMemo<RelationshipContextValue>(
    () => ({ relationship, permissions, loading, refresh: load }),
    [relationship, permissions, loading, load],
  );

  return (
    <RelationshipContext.Provider value={value}>
      {children}
    </RelationshipContext.Provider>
  );
}

export function useRelationship(): RelationshipContextValue {
  const context = useContext(RelationshipContext);
  if (!context) {
    throw new Error("useRelationship must be used inside RelationshipProvider");
  }
  return context;
}
