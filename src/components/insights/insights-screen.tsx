"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer, SectionHeader } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { EstimatedBadge } from "@/components/ui/badges";
import { CycleLengthChart, FrequencyChart, PainTrendChart } from "./charts";
import { useCycle } from "@/hooks/use-cycle";
import { useRecentLogs } from "@/hooks/use-daily-log";
import { buildInsights, buildInsightSentences } from "@/lib/cycle/insights";
import {
  HEALTHCARE_SUGGESTION,
  MEDICAL_DISCLAIMER,
  PREDICTION_DISCLAIMER,
} from "@/lib/cycle/prediction";
import { formatRange } from "@/lib/utils/date";
import { CYCLE, INSIGHTS, STATES } from "@/lib/copy";
import {
  MOOD_LABELS,
  SYMPTOM_LABELS,
  type Mood,
  type Symptom,
} from "@/types/daily-log";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export function InsightsScreen({ basePath = "/app" }: { basePath?: string }) {
  const cycle = useCycle();
  const logs = useRecentLogs(180);

  const insights = useMemo(() => {
    if (!cycle.data || !logs.data) return null;
    return buildInsights(cycle.data.spans, cycle.data.cycleLengths, logs.data);
  }, [cycle.data, logs.data]);

  const sentences = insights ? buildInsightSentences(insights) : [];
  const loading = cycle.loading || logs.loading;
  const error = cycle.error || logs.error;
  const hasData = Boolean(
    insights && cycle.data && cycle.data.spans.length > 0,
  );

  return (
    <>
      <AppHeader title={INSIGHTS.title} />

      <PageContainer>
        {loading ? <LoadingState lines={4} /> : null}

        {error ? (
          <ErrorState
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void cycle.refresh();
                  void logs.refresh();
                }}
              >
                {STATES.tryAgain}
              </Button>
            }
          />
        ) : null}

        {!loading && !error && !hasData ? (
          <EmptyState
            title={STATES.noInsightsTitle}
            description={STATES.noInsightsBody}
            action={
              <Link href={`${basePath}/calendar`}>
                <Button size="sm">{CYCLE.openCalendar}</Button>
              </Link>
            }
          />
        ) : null}

        {!loading && !error && hasData && insights ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label={INSIGHTS.avgCycle}
                value={
                  insights.averageCycleLength
                    ? INSIGHTS.days(insights.averageCycleLength)
                    : "—"
                }
              />
              <StatCard
                label={INSIGHTS.avgPeriod}
                value={
                  insights.averagePeriodDuration
                    ? INSIGHTS.days(insights.averagePeriodDuration)
                    : "—"
                }
              />
              <StatCard
                label={INSIGHTS.variability}
                value={
                  insights.variability > 0
                    ? `± ${INSIGHTS.days(insights.variability)}`
                    : INSIGHTS.steady
                }
              />
              <StatCard
                label={INSIGHTS.avgPain}
                value={
                  insights.averagePain !== null
                    ? `${insights.averagePain} / 10`
                    : "—"
                }
              />
            </div>

            {cycle.data?.prediction ? (
              <section className="card p-5">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold">
                    {INSIGHTS.predictedTitle}
                  </h2>
                  <EstimatedBadge />
                </div>
                <p className="text-lg font-medium">
                  {formatRange(
                    cycle.data.prediction.predictedNextPeriod.start,
                    cycle.data.prediction.predictedNextPeriod.end,
                  )}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
                  {PREDICTION_DISCLAIMER}
                </p>
              </section>
            ) : null}

            {sentences.length > 0 ? (
              <section>
                <SectionHeader title={INSIGHTS.noticeTitle} />
                <ul className="space-y-2">
                  {sentences.map((sentence) => (
                    <li
                      key={sentence}
                      className="card p-4 text-sm leading-relaxed"
                    >
                      {sentence}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {insights.cycleLengthHistory.length > 1 ? (
              <CycleLengthChart data={insights.cycleLengthHistory} />
            ) : null}

            {insights.painTrend.length > 1 ? (
              <PainTrendChart data={insights.painTrend} />
            ) : null}

            {insights.commonSymptoms.length > 0 ? (
              <FrequencyChart
                title="Most logged symptoms"
                data={insights.commonSymptoms.map((entry) => ({
                  ...entry,
                  value: SYMPTOM_LABELS[entry.value as Symptom] ?? entry.value,
                }))}
                color="var(--color-primary)"
              />
            ) : null}

            {insights.moodFrequency.length > 0 ? (
              <FrequencyChart
                title="Most logged moods"
                data={insights.moodFrequency.map((entry) => ({
                  ...entry,
                  value: MOOD_LABELS[entry.value as Mood] ?? entry.value,
                }))}
                color="var(--color-mood)"
              />
            ) : null}

            {cycle.data && cycle.data.spans.length > 0 ? (
              <section>
                <SectionHeader title={INSIGHTS.historyTitle} />
                <ul className="card divide-y divide-[var(--color-line)] p-0">
                  {[...cycle.data.spans].reverse().map((span) => (
                    <li
                      key={span.start}
                      className="flex justify-between gap-3 px-5 py-3 text-sm"
                    >
                      <span>{formatRange(span.start, span.end)}</span>
                      <span className="text-[var(--color-muted)]">
                        {INSIGHTS.days(span.duration)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="space-y-2 text-xs leading-relaxed text-[var(--color-muted)]">
              <p>{MEDICAL_DISCLAIMER}</p>
              <p>{HEALTHCARE_SUGGESTION}</p>
            </div>
          </div>
        ) : null}
      </PageContainer>
    </>
  );
}
