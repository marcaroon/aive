"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { enUS as enLocale } from "date-fns/locale";
import { SHARING } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-field";
import { PrivacyBadge } from "@/components/ui/badges";
import { createPairingCode, PairingError } from "@/services/relationship-service";
import { useAuthContext } from "@/contexts/auth-context";
import type { PartnerInvitation } from "@/types/relationship";

export function PairingCodeCard() {
  const { user } = useAuthContext();
  const [invitation, setInvitation] = useState<PartnerInvitation | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!user) return;
    setCreating(true);
    setError(null);
    try {
      setInvitation(await createPairingCode(user.uid));
    } catch (caught) {
      if (!(caught instanceof PairingError)) {
        console.error("createPairingCode failed:", caught);
      }
      setError(
        caught instanceof PairingError
          ? caught.message
          : "Couldn't create a code. Try again.",
      );
    } finally {
      setCreating(false);
    }
  };

  const copy = async () => {
    if (!invitation) return;
    try {
      await navigator.clipboard.writeText(invitation.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy the code. You can share it manually.");
    }
  };

  return (
    <section className="card p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{SHARING.inviteTitle}</h2>
        <PrivacyBadge>One use only</PrivacyBadge>
      </div>
      <p className="text-sm text-[var(--color-muted)]">{SHARING.inviteBody}</p>

      <FormError message={error} />

      {invitation ? (
        <div className="mt-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-cream)] p-4 text-center">
          <p className="font-mono text-3xl font-semibold tracking-[0.3em]">{invitation.code}</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {SHARING.expires(
              format(invitation.expiresAt.toDate(), "d MMM 'at' HH:mm", { locale: enLocale }),
            )}
          </p>
          <button
            type="button"
            onClick={copy}
            className="tap mx-auto mt-2 flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary-deep)]"
          >
            {copied ? (
              <Check className="h-4 w-4" aria-hidden />
            ) : (
              <Copy className="h-4 w-4" aria-hidden />
            )}
            {copied ? SHARING.copied : SHARING.copyCode}
          </button>
        </div>
      ) : null}

      <Button
        className="mt-4"
        variant={invitation ? "secondary" : "primary"}
        fullWidth
        loading={creating}
        onClick={generate}
      >
        {invitation ? (
          <>
            <RefreshCw className="h-4 w-4" aria-hidden />
            {SHARING.newInvite}
          </>
        ) : (
          SHARING.createInvite
        )}
      </Button>
    </section>
  );
}
