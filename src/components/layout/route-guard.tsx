"use client";

import type { ReactNode } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { LoadingState } from "@/components/ui/states";
import { PageContainer } from "@/components/ui/card";
import type { UserRole } from "@/types/user";

/**
 * Holds the screen on a skeleton until the role is known, so a partner never
 * catches a frame of the primary user's dashboard while redirecting.
 */
export function RouteGuard({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const { profile, loading } = useRequireAuth(role);

  if (loading || !profile || profile.role !== role) {
    return (
      <PageContainer>
        <LoadingState lines={4} />
      </PageContainer>
    );
  }

  return <>{children}</>;
}
