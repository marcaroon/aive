"use client";

import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { useDailyLog, useRecentLogs } from "@/hooks/use-daily-log";
import { DailyLogDetails } from "./daily-log-details";
import { formatFriendlyDate } from "@/lib/utils/date";
import { MOOD_LABELS } from "@/types/daily-log";

export function PartnerLogScreen({ date }: { date: string }) {
  const log = useDailyLog(date);
  return (
    <>
      <AppHeader title="Aivel's check-in" backHref="/partner/log" />
      <PageContainer>
        <h2 className="mb-4 text-sm text-[var(--color-muted)]">
          {formatFriendlyDate(date)}
        </h2>
        {log.loading ? (
          <LoadingState />
        ) : log.error ? (
          <ErrorState
            action={
              <Button onClick={() => void log.refresh()}>Try again</Button>
            }
          />
        ) : (
          <DailyLogDetails log={log.data} />
        )}
      </PageContainer>
    </>
  );
}

export function PartnerLogHistory() {
  const logs = useRecentLogs(5000);
  return (
    <>
      <AppHeader title="Aivel's check-ins" />
      <PageContainer>
        {logs.loading ? (
          <LoadingState />
        ) : logs.error ? (
          <ErrorState
            action={
              <Button onClick={() => void logs.refresh()}>Try again</Button>
            }
          />
        ) : logs.data?.length ? (
          <ul className="space-y-3">
            {logs.data.map((log) => (
              <li key={log.date}>
                <Link
                  href={`/partner/log/${log.date}`}
                  className="card block p-5 transition-colors hover:bg-[var(--color-cream)]"
                >
                  <p className="font-medium">{formatFriendlyDate(log.date)}</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {log.moods.length
                      ? log.moods.map((mood) => MOOD_LABELS[mood]).join(", ")
                      : "View check-in"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No check-ins yet"
            description="Aivel's daily check-ins will show up here."
          />
        )}
      </PageContainer>
    </>
  );
}
