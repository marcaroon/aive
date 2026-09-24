"use client";

import Link from "next/link";
import { HeartHandshake, Settings } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { CycleSummaryCard } from "./cycle-summary-card";
import { QuickLog } from "@/components/daily-log/quick-log";
import { PartnerNoteCard } from "@/components/partner/partner-note-card";
import { PrivacyVeil } from "@/components/layout/privacy-veil";
import { useAuthContext } from "@/contexts/auth-context";
import { useCycle } from "@/hooks/use-cycle";
import { useDailyLog } from "@/hooks/use-daily-log";
import { logCompleteness } from "@/services/daily-log-service";
import { todayKey } from "@/lib/utils/date";
import { CYCLE, GREETINGS, HOME, STATES } from "@/lib/copy";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return GREETINGS.morning;
  if (hour < 18) return GREETINGS.afternoon;
  return GREETINGS.evening;
}

export function HomeDashboard() {
  const { profile } = useAuthContext();
  const today = todayKey();

  const cycle = useCycle();
  const log = useDailyLog(today);

  const name = profile?.preferredName ?? "there";

  return (
    <>
      <AppHeader
        action={
          <Link
            href="/app/settings"
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
            {greeting()}, {name} 🌻
          </h1>
        </header>

        <div className="space-y-4">
          {cycle.loading ? <LoadingState lines={2} /> : null}

          {cycle.error ? (
            <ErrorState
              action={
                <Button variant="secondary" size="sm" onClick={() => void cycle.refresh()}>
                  {STATES.tryAgain}
                </Button>
              }
            />
          ) : null}

          {!cycle.loading && !cycle.error && cycle.data?.prediction ? (
            <PrivacyVeil>
              <CycleSummaryCard prediction={cycle.data.prediction} />
            </PrivacyVeil>
          ) : null}

          {!cycle.loading && !cycle.error && !cycle.data?.prediction ? (
            <EmptyState
              title={STATES.noCycleTitle}
              description={STATES.noCycleBody}
              action={
                <Link href="/app/calendar">
                  <Button size="sm">{CYCLE.addPeriod}</Button>
                </Link>
              }
            />
          ) : null}

          <QuickLog date={today} completeness={logCompleteness(log.data ?? null)} />

          <PartnerNoteCard />

          <Link
            href="/app/partner"
            className="card flex items-center gap-3 p-4 transition-colors hover:bg-[var(--color-cream)]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-butter)]">
              <HeartHandshake className="h-4 w-4 text-[var(--color-primary-deep)]" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-medium">{HOME.partnerCardTitle}</span>
              <span className="block text-xs text-[var(--color-muted)]">
                {HOME.partnerCardBody}
              </span>
            </span>
          </Link>
        </div>
      </PageContainer>
    </>
  );
}
