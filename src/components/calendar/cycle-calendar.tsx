"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { enUS as enLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isWithinRange } from "@/lib/cycle/prediction";
import { fromDateKey, toDateKey, todayKey, type DateKey } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { CALENDAR } from "@/lib/copy";
import type { CyclePrediction } from "@/types/cycle";

export type DayMarker =
  | "period"
  | "predicted-period"
  | "fertile"
  | "ovulation"
  | "none";

export interface CalendarDayInfo {
  marker: DayMarker;
  hasLog: boolean;
}

const MARKER_STYLES: Record<DayMarker, string> = {
  period: "bg-[var(--color-period)] text-[var(--color-ink)]",
  "predicted-period":
    "bg-[var(--color-period-predicted)] text-[var(--color-ink)] border border-dashed border-[var(--color-period)]",
  fertile: "bg-[var(--color-fertile)] text-[var(--color-ink)]",
  ovulation: "bg-[var(--color-ovulation)] text-[var(--color-ink)]",
  none: "bg-transparent text-[var(--color-ink)]",
};

/** Keterangan teks, biar artinya ga cuma bergantung sama warna. */
const MARKER_LABELS: Record<DayMarker, string> = {
  period: "period logged",
  "predicted-period": "estimated period",
  fertile: "estimated fertile window",
  ovulation: "estimated ovulation",
  none: "",
};

export function buildDayInfo(
  date: DateKey,
  periodDates: Set<DateKey>,
  loggedDates: Set<DateKey>,
  prediction: CyclePrediction | null,
): CalendarDayInfo {
  const hasLog = loggedDates.has(date);

  if (periodDates.has(date)) return { marker: "period", hasLog };

  if (prediction) {
    if (isWithinRange(date, prediction.predictedNextPeriod)) {
      return { marker: "predicted-period", hasLog };
    }
    if (date === prediction.predictedOvulation) return { marker: "ovulation", hasLog };
    if (isWithinRange(date, prediction.fertileWindow)) return { marker: "fertile", hasLog };
  }

  return { marker: "none", hasLog };
}

interface CycleCalendarProps {
  periodDates: Set<DateKey>;
  loggedDates: Set<DateKey>;
  prediction: CyclePrediction | null;
  selectedDate: DateKey;
  onSelect: (date: DateKey) => void;
}

export function CycleCalendar({
  periodDates,
  loggedDates,
  prediction,
  selectedDate,
  onSelect,
}: CycleCalendarProps) {
  const [month, setMonth] = useState(() => startOfMonth(fromDateKey(selectedDate)));
  const today = todayKey();

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const leading = start.getDay(); // 0 = Sunday
    const cells = eachDayOfInterval({ start, end });
    return { leading, cells };
  }, [month]);

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((current) => subMonths(current, 1))}
          aria-label="Previous month"
          className="tap flex items-center justify-center rounded-2xl text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <h2 className="text-base font-semibold" aria-live="polite">
          {format(month, "MMMM yyyy", { locale: enLocale })}
        </h2>
        <button
          type="button"
          onClick={() => setMonth((current) => addMonths(current, 1))}
          aria-label="Next month"
          className="tap flex items-center justify-center rounded-2xl text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[var(--color-muted)]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, index) => (
          <span key={`${label}-${index}`} aria-hidden>
            {label}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: days.leading }, (_, index) => (
          <span key={`pad-${index}`} />
        ))}

        {days.cells.map((day) => {
          const key = toDateKey(day);
          const info = buildDayInfo(key, periodDates, loggedDates, prediction);
          const isToday = key === today;
          const isSelected = key === selectedDate;
          const label = [
            format(day, "EEEE d MMMM yyyy", { locale: enLocale }),
            MARKER_LABELS[info.marker],
            info.hasLog ? "check-in logged" : "",
            isToday ? "today" : "",
          ]
            .filter(Boolean)
            .join(", ");

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-label={label}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm transition-colors",
                MARKER_STYLES[info.marker],
                !isSameMonth(day, month) && "opacity-40",
                isSelected && "ring-2 ring-[var(--color-primary-deep)]",
                isToday && !isSelected && "font-semibold underline underline-offset-4",
                info.marker === "none" && "hover:bg-[var(--color-cream)]",
              )}
            >
              {format(day, "d")}
              {info.hasLog ? (
                <span
                  aria-hidden
                  className="absolute bottom-1 h-1 w-1 rounded-full bg-[var(--color-primary-deep)]"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function CalendarLegend() {
  const items: Array<{ marker: DayMarker; label: string }> = [
    { marker: "period", label: CALENDAR.legend.period },
    { marker: "predicted-period", label: CALENDAR.legend.predicted },
    { marker: "fertile", label: CALENDAR.legend.fertile },
    { marker: "ovulation", label: CALENDAR.legend.ovulation },
  ];

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--color-muted)]">
      {items.map((item) => (
        <li key={item.marker} className="flex items-center gap-1.5">
          <span className={cn("h-3 w-3 rounded-full", MARKER_STYLES[item.marker])} aria-hidden />
          {item.label}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary-deep)]" aria-hidden />
        {CALENDAR.legend.logged}
      </li>
    </ul>
  );
}
