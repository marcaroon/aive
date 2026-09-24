"use client";

import { useAuthContext } from "@/contexts/auth-context";

/**
 * Shown instead of a crash when .env.local has not been filled in yet — the very
 * first thing a developer sees when cloning this project.
 */
export function FirebaseSetupNotice() {
  const { configured } = useAuthContext();
  if (configured) return null;

  return (
    <div className="card border-[var(--color-warning)] bg-[var(--color-butter)]/40 p-5 text-sm">
      <p className="font-semibold">Firebase is not connected</p>
      <p className="mt-1 text-[var(--color-muted)]">
        Copy <code className="font-mono">.env.local.example</code> to{" "}
        <code className="font-mono">.env.local</code>, add your Firebase project values, then
        restart the dev server.
      </p>
    </div>
  );
}
