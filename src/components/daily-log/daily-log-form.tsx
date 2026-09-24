"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/ui/form-field";
import { PrivacyBadge } from "@/components/ui/badges";
import { FlowSelector } from "@/components/cycle/flow-selector";
import { MOOD_EMOJIS, MultiSelect, PainScale, SingleSelect, WaterTracker } from "./selectors";
import { useAuthContext } from "@/contexts/auth-context";
import { useRelationship } from "@/contexts/relationship-context";
import { saveDailyLog } from "@/services/daily-log-service";
import { syncSharedSummary } from "@/services/permission-service";
import { dailyLogSchema, type DailyLogValues } from "@/lib/validation/schemas";
import { type DateKey } from "@/lib/utils/date";
import { LOG } from "@/lib/copy";
import {
  ACTIVITIES,
  ACTIVITY_LABELS,
  ENERGY_LABELS,
  ENERGY_LEVELS,
  MOODS,
  MOOD_LABELS,
  SLEEP_QUALITIES,
  SLEEP_QUALITY_LABELS,
  SYMPTOMS,
  SYMPTOM_LABELS,
  type Activity,
  type DailyLog,
  type EnergyLevel,
  type Mood,
  type SleepQuality,
  type Symptom,
} from "@/types/daily-log";
import type { FlowLevel } from "@/types/cycle";

function toValues(date: DateKey, log: DailyLog | null): DailyLogValues {
  return {
    date,
    moods: log?.moods ?? [],
    symptoms: log?.symptoms ?? [],
    painLevel: log?.painLevel,
    flowLevel: log?.flowLevel,
    energyLevel: log?.energyLevel,
    sleepHours: log?.sleepHours,
    sleepQuality: log?.sleepQuality,
    sleepNotes: log?.sleepNotes,
    waterGlasses: log?.waterGlasses,
    activities: log?.activities ?? [],
    privateNotes: log?.privateNotes,
  };
}

export function DailyLogForm({
  date,
  log,
  onSaved,
}: {
  date: DateKey;
  log: DailyLog | null;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const { user } = useAuthContext();
  const { relationship, permissions } = useRelationship();

  const [values, setValues] = useState<DailyLogValues>(() => toValues(date, log));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValues(toValues(date, log));
  }, [date, log]);

  const update = <K extends keyof DailyLogValues>(key: K, value: DailyLogValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    const parsed = dailyLogSchema.safeParse(values);
    if (!parsed.success) {
      setError("Some fields need a second look before saving.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await saveDailyLog(user.uid, parsed.data);
      // Rangkuman buat Ammar ikut diperbarui sesuai izin yang lagi nyala.
      if (relationship) await syncSharedSummary(relationship);
      setSaved(true);
      onSaved?.();
      router.refresh();
    } catch {
      setError("Couldn't save your check-in. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormError message={error} />
      <FormSuccess message={saved ? LOG.saved : null} />

      <section id="mood" className="card space-y-4 p-5">
        <MultiSelect<Mood>
          legend={LOG.moodLegend}
          options={MOODS}
          values={values.moods}
          onChange={(moods) => update("moods", moods)}
          emojis={MOOD_EMOJIS}
          labels={MOOD_LABELS}
        />
      </section>

      <section id="symptoms" className="card space-y-4 p-5">
        <MultiSelect<Symptom>
          legend={LOG.symptomLegend}
          options={SYMPTOMS}
          values={values.symptoms}
          onChange={(symptoms) => update("symptoms", symptoms)}
          labels={SYMPTOM_LABELS}
        />
      </section>

      <section id="pain" className="card space-y-4 p-5">
        <PainScale value={values.painLevel} onChange={(value) => update("painLevel", value)} />
      </section>

      <section id="flow" className="card space-y-4 p-5">
        <FlowSelector
          value={values.flowLevel as FlowLevel | undefined}
          onChange={(value) => update("flowLevel", value)}
        />
      </section>

      <section id="energy" className="card space-y-4 p-5">
        <SingleSelect<EnergyLevel>
          legend={LOG.energyLegend}
          options={ENERGY_LEVELS}
          value={values.energyLevel}
          onChange={(value) => update("energyLevel", value)}
          labels={ENERGY_LABELS}
        />
      </section>

      <section id="sleep" className="card space-y-4 p-5">
        <div>
          <label htmlFor="sleep-hours" className="mb-2 block text-sm font-medium">
            {LOG.sleepDuration}
          </label>
          <input
            id="sleep-hours"
            type="number"
            inputMode="decimal"
            min={0}
            max={24}
            step={0.5}
            value={values.sleepHours ?? ""}
            onChange={(event) =>
              update(
                "sleepHours",
                event.target.value === "" ? undefined : Number(event.target.value),
              )
            }
            placeholder="Hours"
            className="tap w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-[15px] outline-none focus:border-[var(--color-primary-deep)]"
          />
        </div>

        <SingleSelect<SleepQuality>
          legend={LOG.sleepQuality}
          options={SLEEP_QUALITIES}
          value={values.sleepQuality}
          onChange={(value) => update("sleepQuality", value)}
          labels={SLEEP_QUALITY_LABELS}
        />
      </section>

      <section id="water" className="card space-y-4 p-5">
        <WaterTracker
          value={values.waterGlasses}
          onChange={(value) => update("waterGlasses", value)}
        />
      </section>

      <section id="activity" className="card space-y-4 p-5">
        <MultiSelect<Activity>
          legend={LOG.activityLegend}
          options={ACTIVITIES}
          values={(values.activities ?? []) as Activity[]}
          onChange={(activities) => update("activities", activities)}
          labels={ACTIVITY_LABELS}
        />
      </section>

      <section id="notes" className="card space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="private-notes" className="text-sm font-medium">
            {LOG.notesLabel}
          </label>
          <PrivacyBadge>{permissions.shareDailyNotes ? "Shared with Ammar" : "Just you"}</PrivacyBadge>
        </div>
        <textarea
          id="private-notes"
          rows={4}
          maxLength={2000}
          value={values.privateNotes ?? ""}
          onChange={(event) => update("privateNotes", event.target.value || undefined)}
          placeholder={LOG.notesPlaceholder}
          className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-[15px] leading-relaxed outline-none focus:border-[var(--color-primary-deep)]"
        />
        <p className="text-xs text-[var(--color-muted)]">{LOG.notesPrivate}</p>
      </section>

      <div className="sticky bottom-24 z-10 md:bottom-6">
        <Button type="submit" fullWidth size="lg" loading={saving}>
          {saved ? <Check className="h-4 w-4" aria-hidden /> : null}
          {LOG.saveButton}
        </Button>
      </div>
    </form>
  );
}
