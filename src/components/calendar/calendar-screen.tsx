"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer, SectionHeader } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { EstimatedBadge } from "@/components/ui/badges";
import { CalendarLegend, CycleCalendar } from "./cycle-calendar";
import { PeriodLogForm } from "@/components/cycle/period-log-form";
import { useAuthContext } from "@/contexts/auth-context";
import { useRelationship } from "@/contexts/relationship-context";
import { useCycle } from "@/hooks/use-cycle";
import { useRecentLogs } from "@/hooks/use-daily-log";
import { removePeriodSpan, savePeriodRange } from "@/services/cycle-service";
import { syncSharedSummary } from "@/services/permission-service";
import {
  FERTILE_DISCLAIMER,
  PREDICTION_DISCLAIMER,
} from "@/lib/cycle/prediction";
import { formatFriendlyDate, formatRange, todayKey } from "@/lib/utils/date";
import { CALENDAR, CYCLE, STATES } from "@/lib/copy";

export function CalendarScreen({ readOnly = false }: { readOnly?: boolean }) {
  const { user } = useAuthContext();
  const { relationship } = useRelationship();
  const cycle = useCycle();
  const logs = useRecentLogs(readOnly ? 5000 : 180);

  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [sheetOpen, setSheetOpen] = useState(false);

  const periodDates = useMemo(
    () => new Set(cycle.data?.periodDays.map((day) => day.date) ?? []),
    [cycle.data],
  );
  const loggedDates = useMemo(
    () => new Set(logs.data?.map((log) => log.date) ?? []),
    [logs.data],
  );

  const selectedSpan = cycle.data?.spans.find(
    (span) => selectedDate >= span.start && selectedDate <= span.end,
  );
  const selectedLog = logs.data?.find((log) => log.date === selectedDate);

  const refreshAll = async () => {
    await cycle.refresh();
    await logs.refresh();
    if (relationship) await syncSharedSummary(relationship);
  };

  return (
    <>
      <AppHeader title={CALENDAR.title} />

      <PageContainer>
        {cycle.loading ? <LoadingState lines={3} /> : null}

        {cycle.error ? (
          <ErrorState
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void cycle.refresh()}
              >
                {STATES.tryAgain}
              </Button>
            }
          />
        ) : null}

        {!cycle.loading && !cycle.error ? (
          <div className="space-y-4">
            <CycleCalendar
              periodDates={periodDates}
              loggedDates={loggedDates}
              prediction={cycle.data?.prediction ?? null}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />

            <CalendarLegend />

            <section className="card p-5">
              <SectionHeader title={formatFriendlyDate(selectedDate)} />

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--color-muted)]">
                    {CALENDAR.periodRow}
                  </dt>
                  <dd className="text-right">
                    {selectedSpan
                      ? CALENDAR.periodRecorded(
                          formatRange(selectedSpan.start, selectedSpan.end),
                        )
                      : CALENDAR.periodNotRecorded}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--color-muted)]">
                    {CALENDAR.logRow}
                  </dt>
                  <dd className="text-right">
                    {selectedLog ? CALENDAR.logRecorded : CALENDAR.logMissing}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                {!readOnly && (
                  <Button size="sm" onClick={() => setSheetOpen(true)}>
                    <Plus className="h-4 w-4" aria-hidden />
                    {selectedSpan ? CYCLE.editPeriod : CYCLE.addPeriod}
                  </Button>
                )}
                <Link
                  href={`${readOnly ? "/partner" : "/app"}/log/${selectedDate}`}
                >
                  <Button size="sm" variant="secondary">
                    {readOnly
                      ? "View check-in"
                      : selectedLog
                        ? CALENDAR.editLog
                        : CALENDAR.addLog}
                  </Button>
                </Link>
              </div>
            </section>

            {cycle.data?.prediction ? (
              <section className="card p-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold">
                    {CYCLE.estimatesTitle}
                  </h2>
                  <EstimatedBadge />
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--color-muted)]">
                      {CYCLE.nextPeriodLabel}
                    </dt>
                    <dd>
                      {formatRange(
                        cycle.data.prediction.predictedNextPeriod.start,
                        cycle.data.prediction.predictedNextPeriod.end,
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--color-muted)]">
                      {CYCLE.fertileLabel}
                    </dt>
                    <dd>
                      {formatRange(
                        cycle.data.prediction.fertileWindow.start,
                        cycle.data.prediction.fertileWindow.end,
                      )}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
                  {PREDICTION_DISCLAIMER} {FERTILE_DISCLAIMER}
                </p>
              </section>
            ) : null}
          </div>
        ) : null}
      </PageContainer>

      {!readOnly && (
        <BottomSheet
          open={sheetOpen}
          title={selectedSpan ? CYCLE.editPeriod : CYCLE.addPeriod}
          onClose={() => setSheetOpen(false)}
        >
          <PeriodLogForm
            defaultStartDate={selectedSpan?.start ?? selectedDate}
            defaultEndDate={selectedSpan?.end}
            onSave={async (values) => {
              if (!user) return;
              await savePeriodRange(
                user.uid,
                values.startDate,
                values.endDate || undefined,
                values.flowLevel,
              );
              await refreshAll();
              setSheetOpen(false);
            }}
            onRemove={
              selectedSpan
                ? async () => {
                    if (!user) return;
                    await removePeriodSpan(
                      user.uid,
                      selectedSpan.start,
                      selectedSpan.end,
                    );
                    await refreshAll();
                    setSheetOpen(false);
                  }
                : undefined
            }
          />
        </BottomSheet>
      )}
    </>
  );
}
