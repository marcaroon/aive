"use client";

import Link from "next/link";
import { Activity, Droplets, Frown, Moon, NotebookPen, Smile } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { HOME, LOG } from "@/lib/copy";
import type { LogCompleteness } from "@/types/daily-log";
import { cn } from "@/lib/utils/cn";

const QUICK_ACTIONS: Array<{ label: string; icon: LucideIcon; section: string }> = [
  { label: LOG.quickActions.mood, icon: Smile, section: "mood" },
  { label: LOG.quickActions.symptoms, icon: Frown, section: "symptoms" },
  { label: LOG.quickActions.flow, icon: Droplets, section: "flow" },
  { label: LOG.quickActions.pain, icon: Activity, section: "pain" },
  { label: LOG.quickActions.sleep, icon: Moon, section: "sleep" },
  { label: LOG.quickActions.notes, icon: NotebookPen, section: "notes" },
];

const STATUS_STYLES: Record<LogCompleteness, string> = {
  "not-logged": "bg-[var(--color-line)] text-[var(--color-muted)]",
  partial: "bg-[var(--color-butter)] text-[var(--color-ink)]",
  complete: "bg-[var(--color-success)]/50 text-[var(--color-ink)]",
};

export function QuickLog({
  date,
  completeness,
}: {
  date: string;
  completeness: LogCompleteness;
}) {
  return (
    <section className="card p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{HOME.question}</h2>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
            STATUS_STYLES[completeness],
          )}
        >
          {LOG.status[completeness]}
        </span>
      </div>
      <p className="mb-3 text-xs text-[var(--color-muted)]">{HOME.quickLogHint}</p>

      <div className="grid grid-cols-3 gap-2">
        {QUICK_ACTIONS.map(({ label, icon: Icon, section }) => (
          <Link
            key={label}
            href={`/app/log/${date}#${section}`}
            className="tap flex flex-col items-center justify-center gap-1 rounded-2xl border border-[var(--color-line)] bg-[var(--color-cream)] py-3 text-xs font-medium transition-colors hover:bg-[var(--color-butter)]/50"
          >
            <Icon className="h-5 w-5 text-[var(--color-primary-deep)]" aria-hidden />
            {label}
          </Link>
        ))}
      </div>

      <Link
        href={`/app/log/${date}`}
        className="tap mt-3 flex items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[15px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-primary-deep)] hover:text-white"
      >
        {HOME.logToday}
      </Link>
    </section>
  );
}
