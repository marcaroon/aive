"use client";

import { cn } from "@/lib/utils/cn";
import { LOG } from "@/lib/copy";
import type { FlowLevel } from "@/types/cycle";

const ALL_LEVELS: Array<{ value: FlowLevel; label: string; drops: number }> = [
  { value: "none", label: "None", drops: 0 },
  { value: "spotting", label: "Spotting", drops: 1 },
  { value: "light", label: "Light", drops: 2 },
  { value: "medium", label: "Medium", drops: 3 },
  { value: "heavy", label: "Heavy", drops: 4 },
];

interface FlowSelectorProps {
  value?: FlowLevel;
  onChange: (value: FlowLevel) => void;
  excludeNone?: boolean;
  label?: string;
}

export function FlowSelector({
  value,
  onChange,
  excludeNone = false,
  label = LOG.flowLegend,
}: FlowSelectorProps) {
  const levels = excludeNone ? ALL_LEVELS.filter((level) => level.value !== "none") : ALL_LEVELS;

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {levels.map((level) => {
          const selected = value === level.value;
          return (
            <button
              key={level.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(level.value)}
              className={cn(
                "tap flex items-center gap-1.5 rounded-2xl border px-4 text-sm font-medium transition-colors",
                selected
                  ? "border-[var(--color-period)] bg-[var(--color-period)]/35"
                  : "border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-cream)]",
              )}
            >
              <span aria-hidden className="text-xs">
                {level.drops === 0 ? "—" : "•".repeat(level.drops)}
              </span>
              {level.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
