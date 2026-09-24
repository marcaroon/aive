"use client";

import Link from "next/link";
import { EstimatedBadge } from "@/components/ui/badges";
import { PHASE_COLORS, PHASE_DESCRIPTIONS, PHASE_LABELS } from "@/lib/cycle/phases";
import { PREDICTION_DISCLAIMER } from "@/lib/cycle/prediction";
import { formatRange } from "@/lib/utils/date";
import { CYCLE } from "@/lib/copy";
import type { CyclePrediction } from "@/types/cycle";

export function CycleSummaryCard({ prediction }: { prediction: CyclePrediction }) {
  return (
    <section className="card overflow-hidden p-0">
      <div
        className="px-5 py-4"
        style={{ background: `color-mix(in srgb, ${PHASE_COLORS[prediction.phase]} 30%, white)` }}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          {PHASE_LABELS[prediction.phase]}
        </p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">
          {CYCLE.dayOfCycle(prediction.cycleDay)}
        </p>
        <p className="mt-0.5 text-sm text-[var(--color-muted)]">
          {PHASE_DESCRIPTIONS[prediction.phase]}
        </p>
      </div>

      <div className="space-y-3 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">
              {CYCLE.nextPeriodIn(prediction.daysUntilNextPeriod)}
            </p>
            <p className="mt-0.5 text-sm text-[var(--color-muted)]">
              {formatRange(
                prediction.predictedNextPeriod.start,
                prediction.predictedNextPeriod.end,
              )}
            </p>
          </div>
          <EstimatedBadge />
        </div>

        <p className="text-xs leading-relaxed text-[var(--color-muted)]">
          {PREDICTION_DISCLAIMER}
          {CYCLE.basedOn(prediction.basedOnCycles)}
        </p>

        <Link
          href="/app/calendar"
          className="tap inline-flex items-center text-sm font-medium text-[var(--color-primary-deep)] underline underline-offset-4"
        >
          {CYCLE.openCalendar}
        </Link>
      </div>
    </section>
  );
}
