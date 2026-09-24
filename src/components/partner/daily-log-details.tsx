"use client";

import type { ReactNode } from "react";
import {
  ACTIVITY_LABELS,
  ENERGY_LABELS,
  MOOD_LABELS,
  SLEEP_QUALITY_LABELS,
  SYMPTOM_LABELS,
  painLabel,
  type DailyLog,
} from "@/types/daily-log";
import type { FlowLevel } from "@/types/cycle";

const FLOW: Record<FlowLevel, string> = {
  none: "None",
  spotting: "Spotting",
  light: "Light",
  medium: "Medium",
  heavy: "Heavy",
};
function Detail({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-4 px-5 py-3.5">
      <dt className="text-sm text-[var(--color-muted)]">{label}</dt>
      <dd className="break-words text-right text-sm">
        {children ?? (
          <span className="text-[var(--color-muted)]">Not logged yet</span>
        )}
      </dd>
    </div>
  );
}

/** A complete day, using the same stored fields as the primary check-in form. */
export function DailyLogDetails({ log }: { log: DailyLog | null }) {
  if (!log)
    return (
      <section className="card p-5">
        <h2 className="font-semibold">No check-in yet</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Aivel&apos;s check-in will appear here once she adds it.
        </p>
      </section>
    );
  return (
    <section className="card overflow-hidden p-0">
      <h2 className="px-5 pb-2 pt-5 text-base font-semibold">Daily check-in</h2>
      <dl className="divide-y divide-[var(--color-line)]">
        <Detail label="Mood">
          {log.moods.length
            ? log.moods.map((value) => MOOD_LABELS[value]).join(", ")
            : undefined}
        </Detail>
        <Detail label="Symptoms">
          {log.symptoms.length
            ? log.symptoms.map((value) => SYMPTOM_LABELS[value]).join(", ")
            : undefined}
        </Detail>
        <Detail label="Pain">
          {log.painLevel !== undefined
            ? `${log.painLevel} / 10 · ${painLabel(log.painLevel)}`
            : undefined}
        </Detail>
        <Detail label="Flow">
          {log.flowLevel ? FLOW[log.flowLevel] : undefined}
        </Detail>
        <Detail label="Energy">
          {log.energyLevel ? ENERGY_LABELS[log.energyLevel] : undefined}
        </Detail>
        <Detail label="Sleep">
          {log.sleepHours !== undefined ? `${log.sleepHours} hours` : undefined}
        </Detail>
        <Detail label="Sleep quality">
          {log.sleepQuality
            ? SLEEP_QUALITY_LABELS[log.sleepQuality]
            : undefined}
        </Detail>
        <Detail label="Water">
          {log.waterGlasses !== undefined
            ? `${log.waterGlasses} ${log.waterGlasses === 1 ? "glass" : "glasses"}`
            : undefined}
        </Detail>
        <Detail label="Activities">
          {log.activities?.length
            ? log.activities.map((value) => ACTIVITY_LABELS[value]).join(", ")
            : undefined}
        </Detail>
      </dl>
      {log.sleepNotes ? (
        <div className="border-t border-[var(--color-line)] p-5">
          <h3 className="text-sm font-medium">Sleep notes</h3>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
            {log.sleepNotes}
          </p>
        </div>
      ) : null}
      <div className="border-t border-[var(--color-line)] p-5">
        <h3 className="text-sm font-medium">Notes</h3>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
          {log.privateNotes || "No notes for this day."}
        </p>
      </div>
    </section>
  );
}
