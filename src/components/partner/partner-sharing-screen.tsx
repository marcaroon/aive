"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { enUS as enLocale } from "date-fns/locale";
import { Link2Off } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer, SectionHeader } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/bottom-sheet";
import { FormError } from "@/components/ui/form-field";
import { PairingCodeCard } from "./pairing-code-card";
import { PermissionToggleList } from "./permission-toggle-list";
import { SupportRequestComposer } from "./support-request-composer";
import { useAuthContext } from "@/contexts/auth-context";
import { useRelationship } from "@/contexts/relationship-context";
import { revokePartnerAccess } from "@/services/relationship-service";
import { PRIVACY_SETTINGS, SHARING, SUPPORT } from "@/lib/copy";

export function PartnerSharingScreen() {
  const { user } = useAuthContext();
  const { relationship, loading, refresh } = useRelationship();
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  const revoke = async () => {
    if (!relationship || !user) return;
    setRevoking(true);
    setError(null);
    try {
      await revokePartnerAccess(relationship.id, user.uid);
      await refresh();
      setConfirmRevoke(false);
    } catch {
      setError("Couldn't disconnect right now. Try again.");
    } finally {
      setRevoking(false);
    }
  };

  return (
    <>
      <AppHeader title={SHARING.title} backHref="/app" />

      <PageContainer>
        {loading ? <LoadingState lines={3} /> : null}

        {!loading && !relationship ? (
          <div className="space-y-4">
            <PairingCodeCard />
            <p className="text-xs leading-relaxed text-[var(--color-muted)]">
              {SHARING.notConnected} {SHARING.notConnectedBody}
            </p>
          </div>
        ) : null}

        {!loading && relationship ? (
          <div className="space-y-6">
            <FormError message={error} />

            <section className="card p-5">
              <SectionHeader
                title={SHARING.connected}
                description={
                  relationship.pairedAt
                    ? SHARING.pairedOn(
                        format(relationship.pairedAt.toDate(), "d MMMM yyyy", {
                          locale: enLocale,
                        }),
                      )
                    : undefined
                }
              />
              <Button variant="secondary" size="sm" onClick={() => setConfirmRevoke(true)}>
                <Link2Off className="h-4 w-4" aria-hidden />
                {SHARING.disconnect}
              </Button>
            </section>

            <section>
              <SectionHeader title={SHARING.title} description={SHARING.subtitle} />
              <PermissionToggleList />
            </section>

            <section>
              <SectionHeader title={SUPPORT.title} description={SUPPORT.subtitle} />
              <SupportRequestComposer />
            </section>

            <Link
              href="/app/partner/permissions"
              className="tap flex items-center text-sm font-medium text-[var(--color-primary-deep)] underline underline-offset-4"
            >
              {SHARING.detailsLink}
            </Link>
          </div>
        ) : null}
      </PageContainer>

      <ConfirmationDialog
        open={confirmRevoke}
        title={PRIVACY_SETTINGS.confirmRevokeTitle}
        description={PRIVACY_SETTINGS.confirmRevokeBody}
        confirmLabel={revoking ? "One sec…" : SHARING.disconnect}
        destructive
        onConfirm={() => void revoke()}
        onCancel={() => setConfirmRevoke(false)}
      />
    </>
  );
}
