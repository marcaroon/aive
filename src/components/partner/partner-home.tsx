"use client";

import Link from "next/link";
import { AUTH_ENABLED } from "@/lib/config";
import { FullPartnerHome } from "./full-partner-home";
import { Settings } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer, SectionHeader } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { PartnerSummaryCard } from "./partner-summary-card";
import { SupportRequestCard } from "./support-request-card";
import { LoveNoteComposer } from "./love-note-composer";
import { useAuthContext } from "@/contexts/auth-context";
import { useRelationship } from "@/contexts/relationship-context";
import { useOpenSupportRequest, useSharedSummary } from "@/hooks/use-partner";
import { PAIR, PARTNER, STATES } from "@/lib/copy";

export function PartnerHome() {
  return AUTH_ENABLED ? <LegacyPartnerHome /> : <FullPartnerHome />;
}

function LegacyPartnerHome() {
  const { profile } = useAuthContext();
  const { relationship, loading: relationshipLoading } = useRelationship();
  const summary = useSharedSummary();
  const request = useOpenSupportRequest();

  const name = profile?.preferredName ?? "there";

  return (
    <>
      <AppHeader
        action={
          <Link
            href="/partner/settings"
            aria-label="Settings"
            className="tap flex items-center justify-center rounded-2xl text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            <Settings className="h-5 w-5" aria-hidden />
          </Link>
        }
      />

      <PageContainer>
        <header className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight">
            Hey, {name} 🌻
          </h1>
        </header>

        {relationshipLoading ? <LoadingState lines={3} /> : null}

        {!relationshipLoading && !relationship ? (
          <EmptyState
            title="Not connected yet."
            description="Ask Aivel for a code, then enter it here."
            action={
              <Link href="/pair">
                <Button size="sm">{PAIR.title}</Button>
              </Link>
            }
          />
        ) : null}

        {!relationshipLoading && relationship ? (
          <div className="space-y-4">
            {summary.error ? (
              <ErrorState
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void summary.refresh()}
                  >
                    {STATES.tryAgain}
                  </Button>
                }
              />
            ) : null}

            {summary.loading ? <LoadingState lines={2} /> : null}

            {!summary.loading && !summary.error ? (
              <PartnerSummaryCard summary={summary.data ?? null} />
            ) : null}

            {request.data ? (
              <section>
                <SectionHeader title={PARTNER.askedSomething} />
                <SupportRequestCard
                  request={request.data}
                  onChanged={() => void request.refresh()}
                />
              </section>
            ) : null}

            <section>
              <SectionHeader
                title={PARTNER.sendNote}
                description="Little things can mean a lot."
              />
              <LoveNoteComposer />
            </section>

            <Link
              href="/partner/care"
              className="tap flex items-center text-sm font-medium text-[var(--color-primary-deep)] underline underline-offset-4"
            >
              {PARTNER.careTitle}
            </Link>
          </div>
        ) : null}
      </PageContainer>
    </>
  );
}
