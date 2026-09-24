"use client";

import { AUTH_ENABLED } from "@/lib/config";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthContext } from "@/contexts/auth-context";
import type { UserRole } from "@/types/user";

export function useAuth() {
  return useAuthContext();
}

/**
 * Client-side route guard. Redirects are a UX nicety; the actual protection of
 * health data lives in the Firestore Security Rules.
 */
export function useRequireAuth(expectedRole?: UserRole) {
  const { user, profile, loading, configured } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!configured || loading) return;

    if (!user && AUTH_ENABLED) {
      router.replace("/login");
      return;
    }
    if (!profile) return;

    if (expectedRole && profile.role !== expectedRole) {
      router.replace(profile.role === "primary" ? "/app" : "/partner");
      return;
    }
    if (AUTH_ENABLED && profile.role === "primary" && !profile.onboardingCompleted) {
      router.replace("/onboarding");
    }
  }, [configured, loading, user, profile, expectedRole, router]);

  return { user, profile, loading: loading || (Boolean(user) && !profile) };
}
