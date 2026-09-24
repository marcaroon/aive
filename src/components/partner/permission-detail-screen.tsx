"use client";

import { format } from "date-fns";
import { enUS as enLocale } from "date-fns/locale";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer, SectionHeader } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { PermissionToggleList } from "./permission-toggle-list";
import { useRelationship } from "@/contexts/relationship-context";
import { useSharedSummary } from "@/hooks/use-partner";
import { SHARING } from "@/lib/copy";

function stamp(value: { toDate: () => Date } | undefined): string {
  return value
    ? format(value.toDate(), "d MMM yyyy, HH:mm", { locale: enLocale })
    : "—";
}

/** Menampilkan persis isi dokumen yang bisa dibaca Ammar — biar ga ada kejutan. */
export function PermissionDetailScreen() {
  const { relationship, loading } = useRelationship();
  const summary = useSharedSummary();

  const visibleFields = summary.data
    ? Object.entries(summary.data).filter(
        ([key, value]) =>
          ![
            "relationshipId",
            "primaryUserId",
            "partnerUserId",
            "updatedAt",
          ].includes(key) &&
          value !== undefined &&
          value !== null,
      )
    : [];

  return (
    <>
      <AppHeader title={SHARING.detailsLink} backHref="/app/partner" />

      <PageContainer>
        {loading ? <LoadingState lines={3} /> : null}

        {!loading && !relationship ? (
          <EmptyState
            title={SHARING.notConnected}
            description={SHARING.notConnectedBody}
          />
        ) : null}

        {!loading && relationship ? (
          <div className="space-y-6">
            <section>
              <SectionHeader title={SHARING.title} />
              <PermissionToggleList />
            </section>

            <section>
              <SectionHeader
                title={SHARING.visibleNow}
                description={SHARING.visibleNowBody}
              />
              {visibleFields.length === 0 ? (
                <p className="card p-5 text-sm text-[var(--color-muted)]">
                  {SHARING.nothingShared}
                </p>
              ) : (
                <ul className="card divide-y divide-[var(--color-line)] p-0 text-sm">
                  {visibleFields.map(([key, value]) => (
                    <li
                      key={key}
                      className="flex justify-between gap-3 px-5 py-3"
                    >
                      <span className="text-[var(--color-muted)]">{key}</span>
                      <span className="text-right">
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <SectionHeader title={SHARING.historyTitle} />
              <ul className="card divide-y divide-[var(--color-line)] p-0 text-sm">
                <li className="flex justify-between gap-3 px-5 py-3">
                  <span className="text-[var(--color-muted)]">
                    Connected since
                  </span>
                  <span>{stamp(relationship.pairedAt)}</span>
                </li>
                <li className="flex justify-between gap-3 px-5 py-3">
                  <span className="text-[var(--color-muted)]">
                    Last updated
                  </span>
                  <span>{stamp(summary.data?.updatedAt)}</span>
                </li>
                <li className="flex justify-between gap-3 px-5 py-3">
                  <span className="text-[var(--color-muted)]">
                    Disconnected
                  </span>
                  <span>{stamp(relationship.revokedAt)}</span>
                </li>
              </ul>
            </section>
          </div>
        ) : null}
      </PageContainer>
    </>
  );
}
