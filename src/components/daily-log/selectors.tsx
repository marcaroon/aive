"use client";

import { cn } from "@/lib/utils/cn";
import { painLabel } from "@/types/daily-log";
import { LOG } from "@/lib/copy";

/** Shared chip used by the mood, symptom and activity pickers. */
function Chip({
  label,
  selected,
  onClick,
  emoji,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  emoji?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "tap rounded-2xl border px-3.5 text-sm font-medium capitalize transition-colors",
        selected
          ? "border-[var(--color-primary-deep)] bg-[var(--color-butter)]"
          : "border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-cream)]",
      )}
    >
      {emoji ? (
        <span aria-hidden className="mr-1.5">
          {emoji}
        </span>
      ) : null}
      {label}
    </button>
  );
}

export function MultiSelect<T extends string>({
  legend,
  options,
  values,
  onChange,
  emojis,
  labels,
}: {
  legend: string;
  options: readonly T[];
  values: T[];
  onChange: (values: T[]) => void;
  emojis?: Partial<Record<T, string>>;
  /** Stored values stay canonical; these are what the user actually reads. */
  labels?: Record<T, string>;
}) {
  const toggle = (option: T) => {
    onChange(
      values.includes(option) ? values.filter((value) => value !== option) : [...values, option],
    );
  };

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option}
            label={labels?.[option] ?? option}
            emoji={emojis?.[option]}
            selected={values.includes(option)}
            onClick={() => toggle(option)}
          />
        ))}
      </div>
    </fieldset>
  );
}

export function SingleSelect<T extends string>({
  legend,
  options,
  value,
  onChange,
  allowClear = true,
  labels,
}: {
  legend: string;
  options: readonly T[];
  value?: T;
  onChange: (value: T | undefined) => void;
  allowClear?: boolean;
  labels?: Record<T, string>;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option}
            label={labels?.[option] ?? option}
            selected={value === option}
            onClick={() => onChange(allowClear && value === option ? undefined : option)}
          />
        ))}
      </div>
    </fieldset>
  );
}

/** 0–10 pain scale with an always-visible text label, never colour alone. */
export function PainScale({
  value,
  onChange,
}: {
  value?: number;
  onChange: (value: number | undefined) => void;
}) {
  const current = value ?? 0;

  return (
    <fieldset>
      <div className="mb-2 flex items-baseline justify-between">
        <legend className="text-sm font-medium">{LOG.painLegend}</legend>
        <span className="text-sm text-[var(--color-muted)]">
          {value === undefined ? "Not logged yet" : `${value} · ${painLabel(value)}`}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={current}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Pain level from 0 to 10"
        aria-valuetext={`${current}, ${painLabel(current)}`}
        className="h-11 w-full accent-[var(--color-pain)]"
      />

      <div className="flex justify-between text-[11px] text-[var(--color-muted)]" aria-hidden>
        <span>0 no pain</span>
        <span>4–6 moderate</span>
        <span>9–10 severe</span>
      </div>

      {value !== undefined ? (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="mt-1 text-xs text-[var(--color-muted)] underline underline-offset-2"
        >
          Clear pain level
        </button>
      ) : null}
    </fieldset>
  );
}

export function WaterTracker({
  value,
  onChange,
  target = 8,
}: {
  value?: number;
  onChange: (value: number | undefined) => void;
  target?: number;
}) {
  const glasses = value ?? 0;

  return (
    <fieldset>
      <div className="mb-2 flex items-baseline justify-between">
        <legend className="text-sm font-medium">{LOG.waterLegend}</legend>
        <span className="text-sm text-[var(--color-muted)]">
          {glasses} of {target} glasses
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: target }, (_, index) => {
          const filled = index < glasses;
          return (
            <button
              key={index}
              type="button"
              aria-label={`${index + 1} ${index === 0 ? "glass" : "glasses"}`}
              aria-pressed={filled}
              onClick={() => onChange(glasses === index + 1 ? undefined : index + 1)}
              className={cn(
                "h-11 w-9 rounded-xl border transition-colors",
                filled
                  ? "border-[var(--color-primary-deep)] bg-[var(--color-butter)]"
                  : "border-[var(--color-line)] bg-[var(--color-surface)]",
              )}
            >
              <span aria-hidden>{filled ? "💧" : ""}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export const MOOD_EMOJIS: Record<string, string> = {
  happy: "😊",
  calm: "😌",
  loved: "🥰",
  energetic: "✨",
  neutral: "🙂",
  tired: "😴",
  anxious: "😟",
  sensitive: "🥺",
  sad: "😢",
  angry: "😠",
  overwhelmed: "😵‍💫",
};
