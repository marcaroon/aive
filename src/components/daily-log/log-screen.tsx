"use client";

import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { DailyLogForm } from "./daily-log-form";
import { useDailyLog } from "@/hooks/use-daily-log";
import { formatFriendlyDate, todayKey } from "@/lib/utils/date";
import { LOG, STATES } from "@/lib/copy";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function LogScreen({ date }: { date: string }) {
  const valid = DATE_KEY.test(date);
  const safeDate = valid ? date : todayKey();
  const log = useDailyLog(safeDate);

  const isToday = safeDate === todayKey();

  return (
    <>
      <AppHeader title={isToday ? LOG.title : "Daily check-in"} backHref="/app" />

      <PageContainer>
        <p className="mb-4 text-sm text-[var(--color-muted)]">{formatFriendlyDate(safeDate)}</p>

        {log.loading ? <LoadingState lines={4} /> : null}

        {log.error ? (
          <ErrorState
            action={
              <Button variant="secondary" size="sm" onClick={() => void log.refresh()}>
                {STATES.tryAgain}
              </Button>
            }
          />
        ) : null}

        {!log.loading && !log.error ? (
          <DailyLogForm date={safeDate} log={log.data ?? null} onSaved={() => void log.refresh()} />
        ) : null}
      </PageContainer>
    </>
  );
}
