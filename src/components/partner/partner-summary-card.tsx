"use client";

import { EstimatedBadge } from "@/components/ui/badges";
import { PHASE_LABELS } from "@/lib/cycle/phases";
import { formatRange } from "@/lib/utils/date";
import {
  MOOD_LABELS,
  SYMPTOM_LABELS,
  painLabel,
  type Mood,
  type Symptom,
} from "@/types/daily-log";
import { PARTNER } from "@/lib/copy";
import type { SharedSummary } from "@/types/permission";

function Row({
  label,
  value,
  badge,
}: {
  label: string;
  value: string | null;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 py-3.5">
      <span className="text-sm text-[var(--color-muted)]">{label}</span>
      <span className="flex items-center gap-2 text-right text-sm">
        {value ?? (
          <span className="text-[var(--color-muted)] italic">
            {PARTNER.keptPrivate}
          </span>
        )}
        {value ? badge : null}
      </span>
    </div>
  );
}

export function PartnerSummaryCard({
  summary,
}: {
  summary: SharedSummary | null;
}) {
  const nothingShared =
    !summary ||
    [
      summary.cyclePhase,
      summary.predictedPeriodRange,
      summary.mood,
      summary.painLevel,
      summary.flowStatus,
      summary.symptoms,
    ].every((value) => value === undefined || value === null);

  if (nothingShared) {
    return (
      <section className="card p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">{PARTNER.homeTitle}</h2>
        </div>
        <p className="text-sm leading-relaxed text-[var(--color-muted)]">
          No cycle or check-in data yet.
        </p>
      </section>
    );
  }

  return (
    <section className="card overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-5">
        <h2 className="text-base font-semibold">{PARTNER.homeTitle}</h2>
      </div>

      <div className="divide-y divide-[var(--color-line)]">
        <Row
          label={PARTNER.cyclePhase}
          value={summary.cyclePhase ? PHASE_LABELS[summary.cyclePhase] : null}
        />
        <Row
          label={PARTNER.nextPeriod}
          value={
            summary.predictedPeriodRange
              ? formatRange(
                  summary.predictedPeriodRange.start,
                  summary.predictedPeriodRange.end,
                )
              : null
          }
          badge={<EstimatedBadge />}
        />
        <Row
          label={PARTNER.mood}
          value={
            summary.mood
              ? (MOOD_LABELS[summary.mood as Mood] ?? summary.mood)
              : null
          }
        />
        <Row
          label={PARTNER.painLevel}
          value={
            summary.painLevel !== undefined
              ? `${summary.painLevel} · ${painLabel(summary.painLevel)}`
              : null
          }
        />
        <Row
          label={PARTNER.onPeriodToday}
          value={summary.flowStatus ? "Yes" : "Not logged today"}
        />
        <Row
          label={PARTNER.symptoms}
          value={
            summary.symptoms?.length
              ? summary.symptoms
                  .map((entry) => SYMPTOM_LABELS[entry as Symptom] ?? entry)
                  .join(", ")
              : null
          }
        />
      </div>

      {summary.dailyNote ? (
        <div className="border-t border-[var(--color-line)] px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            {PARTNER.sharedNote}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed">{summary.dailyNote}</p>
        </div>
      ) : null}
    </section>
  );
}
