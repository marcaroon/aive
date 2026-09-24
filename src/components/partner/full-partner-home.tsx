"use client";

import Link from "next/link";
import {
  Settings,
  CalendarDays,
  HeartHandshake,
  Mail,
  User,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer, SectionHeader } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { EstimatedBadge } from "@/components/ui/badges";
import { DailyLogDetails } from "./daily-log-details";
import { SupportRequestCard } from "./support-request-card";
import { useAuthContext } from "@/contexts/auth-context";
import { useRelationship } from "@/contexts/relationship-context";
import { useCycle } from "@/hooks/use-cycle";
import { useDailyLog } from "@/hooks/use-daily-log";
import { useOpenSupportRequest } from "@/hooks/use-partner";
import { formatFriendlyDate, formatRange, todayKey } from "@/lib/utils/date";
import { PHASE_LABELS } from "@/lib/cycle/phases";
import {
  FERTILE_DISCLAIMER,
  PREDICTION_DISCLAIMER,
} from "@/lib/cycle/prediction";
import { PARTNER } from "@/lib/copy";

export function FullPartnerHome() {
  const { profile } = useAuthContext();
  const { relationship, loading: connecting, refresh } = useRelationship();
  const cycle = useCycle();
  const today = todayKey();
  const log = useDailyLog(today);
  const request = useOpenSupportRequest();
  const prediction = cycle.data?.prediction;
  const refreshData = () => {
    void cycle.refresh();
    void log.refresh();
  };
  return (
    <>
      <AppHeader
        action={
          <Link
            href="/partner/settings"
            aria-label="Settings"
            className="tap flex items-center justify-center rounded-2xl text-[var(--color-muted)]"
          >
            <Settings className="h-5 w-5" aria-hidden />
          </Link>
        }
      />
      <PageContainer>
        <header className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight">
            Hey, {profile?.preferredName || "Ammar"} 🌻
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Here&apos;s how Aivel&apos;s day is looking.
          </p>
        </header>
        {connecting ? (
          <LoadingState />
        ) : !relationship ? (
          <ErrorState
            description="Couldn't load your shared space."
            action={<Button onClick={() => void refresh()}>Try again</Button>}
          />
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2">
              {[
                { href: "/partner/notes", label: "Our notes", icon: Mail },
                { href: "/partner/care", label: "Care", icon: HeartHandshake },
                { href: "/partner/aivel", label: "About Aivel", icon: User },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="card flex min-w-0 flex-col items-center gap-2 px-2 py-4 text-center text-sm font-medium transition-colors hover:bg-[var(--color-butter)]"
                >
                  <Icon
                    className="h-5 w-5 text-[var(--color-primary-deep)]"
                    aria-hidden
                  />
                  {label}
                </Link>
              ))}
            </div>
            {cycle.loading ? (
              <LoadingState lines={2} />
            ) : cycle.error ? (
              <ErrorState
                action={<Button onClick={refreshData}>Try again</Button>}
              />
            ) : prediction ? (
              <section className="card overflow-hidden p-0">
                <div className="bg-[var(--color-butter)]/50 p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                    {prediction.phase === "menstrual"
                      ? "Period"
                      : PHASE_LABELS[prediction.phase]}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    Day {prediction.cycleDay} of Aivel&apos;s cycle
                  </h2>
                </div>
                <div className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium">Cycle estimates</h3>
                    <EstimatedBadge />
                  </div>
                  <dl className="space-y-3 text-sm">
                    {[
                      [
                        "Next period",
                        formatRange(
                          prediction.predictedNextPeriod.start,
                          prediction.predictedNextPeriod.end,
                        ),
                      ],
                      [
                        "Fertile window",
                        formatRange(
                          prediction.fertileWindow.start,
                          prediction.fertileWindow.end,
                        ),
                      ],
                      [
                        "Ovulation",
                        formatFriendlyDate(prediction.predictedOvulation),
                      ],
                      [
                        "Average cycle",
                        `${prediction.averageCycleLength} days`,
                      ],
                      [
                        "Average period",
                        `${prediction.averagePeriodDuration} days`,
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <dt className="text-[var(--color-muted)]">{label}</dt>
                        <dd className="text-right">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="text-xs leading-relaxed text-[var(--color-muted)]">
                    {PREDICTION_DISCLAIMER} {FERTILE_DISCLAIMER}
                  </p>
                  <Link
                    href="/partner/calendar"
                    className="tap inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary-deep)]"
                  >
                    <CalendarDays className="h-4 w-4" aria-hidden />
                    Open calendar
                  </Link>
                </div>
              </section>
            ) : (
              <EmptyState
                title="No cycle data yet"
                description="Aivel's cycle will appear here once she logs a period."
              />
            )}
            <section>
              <SectionHeader
                title="Aivel's day"
                description={formatFriendlyDate(today)}
              />
              {log.loading ? (
                <LoadingState />
              ) : log.error ? (
                <ErrorState
                  action={<Button onClick={refreshData}>Try again</Button>}
                />
              ) : (
                <DailyLogDetails log={log.data} />
              )}
            </section>
            {request.data ? (
              <section>
                <SectionHeader title={PARTNER.askedSomething} />
                <SupportRequestCard
                  request={request.data}
                  onChanged={() => void request.refresh()}
                />
              </section>
            ) : null}
          </div>
        )}
      </PageContainer>
    </>
  );
}
