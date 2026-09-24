"use client";

import { AUTH_ENABLED } from "@/lib/config";
import { useEffect, useState, type ReactNode } from "react";
import { AppLogo } from "@/components/ui/app-logo";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/auth-context";

const SESSION_KEY = "aive_unlocked";

/**
 * A deliberate step before the app opens. It is a privacy screen, not a security
 * boundary — it stops a shoulder-glance, and the unlock lasts for this tab only.
 */
export function AppLock({ children }: { children: ReactNode }) {
  const { profile } = useAuthContext();
  const enabled = AUTH_ENABLED && (profile?.privacySettings?.appLockEnabled ?? false);
  const [unlocked, setUnlocked] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setUnlocked(true);
      return;
    }
    setUnlocked(sessionStorage.getItem(SESSION_KEY) === "1");
  }, [enabled]);

  if (!enabled || unlocked) return <>{children}</>;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-5 text-center">
      <AppLogo size="lg" showTagline />
      <p className="text-sm text-[var(--color-muted)]">
        Your space stays covered until you&apos;re ready.
      </p>
      <Button
        onClick={() => {
          sessionStorage.setItem(SESSION_KEY, "1");
          setUnlocked(true);
        }}
      >
        Open Aivé
      </Button>
    </main>
  );
}
