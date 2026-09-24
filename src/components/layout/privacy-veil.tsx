"use client";

import { useState, type ReactNode } from "react";
import { Eye } from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";

/**
 * Privacy mode: blurs cycle details until the user taps to reveal them, so a
 * glance over the shoulder shows nothing. Reveal lasts for the current view only.
 */
export function PrivacyVeil({ children }: { children: ReactNode }) {
  const { profile } = useAuthContext();
  const enabled = profile?.privacySettings?.privacyMode ?? false;
  const [revealed, setRevealed] = useState(false);

  if (!enabled || revealed) return <>{children}</>;

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none blur-md select-none">
        {children}
      </div>
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-[var(--radius-card)] bg-[var(--color-cream)]/60 text-sm font-medium"
      >
        <Eye className="h-5 w-5 text-[var(--color-primary-deep)]" aria-hidden />
        Tap to show cycle details
      </button>
    </div>
  );
}
