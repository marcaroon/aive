import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { SunflowerIcon } from "./sunflower-icon";
import { STATES } from "@/lib/copy";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card flex flex-col items-center px-6 py-10 text-center", className)}>
      <SunflowerIcon className="mb-3 h-10 w-10 opacity-70" />
      <p className="font-medium text-[var(--color-ink)]">{title}</p>
      {description ? (
        <p className="mt-1 max-w-xs text-sm text-[var(--color-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)} role="status" aria-label={STATES.loading}>
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className="skeleton h-20 w-full" />
      ))}
      <span className="sr-only">{STATES.loading}</span>
    </div>
  );
}

export function ErrorState({
  title = STATES.errorTitle,
  description = STATES.errorBody,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card border-[var(--color-error)]/40 bg-[var(--color-error)]/5 px-5 py-6 text-center">
      <p className="font-medium text-[var(--color-ink)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
