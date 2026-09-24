"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer, SectionHeader } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { SupportRequestCard } from "./support-request-card";
import { useRelationship } from "@/contexts/relationship-context";
import { useSharedSummary, useSupportRequests } from "@/hooks/use-partner";
import { buildCareSuggestions } from "@/lib/permissions/care-suggestions";
import { HEALTHCARE_SUGGESTION } from "@/lib/cycle/prediction";
import { PARTNER } from "@/lib/copy";

export function CareScreen() {
  const { relationship, loading } = useRelationship();
  const summary = useSharedSummary();
  const requests = useSupportRequests(10);

  const suggestions = useMemo(
    () => buildCareSuggestions(summary.data ?? null),
    [summary.data],
  );

  return (
    <>
      <AppHeader title="Care" />

      <PageContainer>
        {loading ? <LoadingState lines={3} /> : null}

        {!loading && !relationship ? (
          <EmptyState
            title="Not connected yet."
            description="Care ideas will show up here once you're connected."
          />
        ) : null}

        {!loading && relationship ? (
          <div className="space-y-6">
            <section>
              <SectionHeader title={PARTNER.careTitle} description={PARTNER.careSubtitle} />
              <ul className="space-y-2">
                {suggestions.map((suggestion) => (
                  <li key={suggestion.id} className="card flex gap-3 p-4">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-butter)]">
                      <Sparkles className="h-4 w-4 text-[var(--color-primary-deep)]" aria-hidden />
                    </span>
                    <p className="text-sm leading-relaxed">{suggestion.text}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <SectionHeader title={PARTNER.requestsTitle} />
              {requests.loading ? <LoadingState lines={2} /> : null}

              {!requests.loading && (requests.data?.length ?? 0) === 0 ? (
                <EmptyState title={PARTNER.noRequests} description={PARTNER.noRequestsBody} />
              ) : null}

              <div className="space-y-3">
                {requests.data?.map((request) => (
                  <SupportRequestCard
                    key={request.id}
                    request={request}
                    onChanged={() => void requests.refresh()}
                  />
                ))}
              </div>
            </section>

            <p className="text-xs leading-relaxed text-[var(--color-muted)]">
              {HEALTHCARE_SUGGESTION}
            </p>
          </div>
        ) : null}
      </PageContainer>
    </>
  );
}
