"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/form-field";
import { reminderSchema, type ReminderValues } from "@/lib/validation/schemas";
import { REMINDER_PRESETS, type Reminder, type ReminderType } from "@/types/notification";
import { DAY_LABELS } from "@/lib/utils/notifications";
import { REMINDERS } from "@/lib/copy";
import { cn } from "@/lib/utils/cn";

export function ReminderForm({
  reminder,
  onSave,
}: {
  reminder: Reminder | null;
  onSave: (values: ReminderValues) => Promise<void>;
}) {
  const [days, setDays] = useState<number[]>(reminder?.days ?? []);
  const [privateReminder, setPrivateReminder] = useState(reminder?.privateReminder ?? true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReminderValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      type: reminder?.type ?? "daily-log",
      title: reminder?.title ?? "Daily check-in",
      message: reminder?.message ?? "Quick check-in: how was your day?",
      time: reminder?.time ?? "20:00",
      days: reminder?.days ?? [],
      enabled: reminder?.enabled ?? true,
      privateReminder: reminder?.privateReminder ?? true,
    },
  });

  const applyPreset = (type: ReminderType) => {
    const preset = REMINDER_PRESETS.find((entry) => entry.type === type);
    if (!preset) return;
    setValue("type", preset.type);
    setValue("title", preset.title);
    setValue("message", preset.message);
    setValue("time", preset.time);
  };

  const toggleDay = (day: number) => {
    const next = days.includes(day) ? days.filter((value) => value !== day) : [...days, day].sort();
    setDays(next);
    setValue("days", next);
  };

  const onSubmit = handleSubmit(async (values) => {
    await onSave({ ...values, days, privateReminder });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{REMINDERS.typeLegend}</legend>
        <div className="flex flex-wrap gap-2">
          {REMINDER_PRESETS.map((preset) => (
            <button
              key={preset.type}
              type="button"
              onClick={() => applyPreset(preset.type)}
              className="tap rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 text-sm font-medium hover:bg-[var(--color-cream)]"
            >
              {preset.title}
            </button>
          ))}
        </div>
      </fieldset>

      <TextField label={REMINDERS.titleLabel} error={errors.title?.message} {...register("title")} />
      <TextField
        label={REMINDERS.messageLabel}
        hint={REMINDERS.messageHint}
        error={errors.message?.message}
        {...register("message")}
      />
      <TextField
        label={REMINDERS.timeLabel}
        type="time"
        error={errors.time?.message}
        {...register("time")}
      />

      <fieldset>
        <legend className="mb-2 text-sm font-medium">{REMINDERS.daysLegend}</legend>
        <div className="flex flex-wrap gap-1.5">
          {DAY_LABELS.map((label, index) => (
            <button
              key={label}
              type="button"
              aria-pressed={days.includes(index)}
              onClick={() => toggleDay(index)}
              className={cn(
                "tap w-11 rounded-2xl border text-xs font-medium transition-colors",
                days.includes(index)
                  ? "border-[var(--color-primary-deep)] bg-[var(--color-butter)]"
                  : "border-[var(--color-line)] bg-[var(--color-surface)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-[var(--color-muted)]">{REMINDERS.daysHint}</p>
      </fieldset>

      <label className="flex items-start gap-3 rounded-2xl border border-[var(--color-line)] p-4">
        <input
          type="checkbox"
          checked={privateReminder}
          onChange={(event) => setPrivateReminder(event.target.checked)}
          className="mt-0.5 h-5 w-5 accent-[var(--color-primary-deep)]"
        />
        <span>
          <span className="block text-sm font-medium">{REMINDERS.privateLabel}</span>
          <span className="block text-xs text-[var(--color-muted)]">{REMINDERS.privateBody}</span>
        </span>
      </label>

      <Button type="submit" fullWidth loading={isSubmitting}>
        {REMINDERS.save}
      </Button>
    </form>
  );
}
