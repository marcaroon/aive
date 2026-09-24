import type { ReactNode } from "react";
import { Info, Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

function BaseBadge({
  children,
  className,
  icon,
}: {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Marks any number that is a prediction rather than something Aivel recorded. */
export function EstimatedBadge({ className }: { className?: string }) {
  return (
    <BaseBadge
      className={cn("bg-[var(--color-butter)] text-[var(--color-ink)]", className)}
      icon={<Info className="h-3 w-3" aria-hidden />}
    >
      Estimate
    </BaseBadge>
  );
}

export function PrivacyBadge({
  children = "Private",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <BaseBadge
      className={cn("bg-[var(--color-cream)] text-[var(--color-muted)]", className)}
      icon={<Lock className="h-3 w-3" aria-hidden />}
    >
      {children}
    </BaseBadge>
  );
}

export function PermissionBadge({ shared }: { shared: boolean }) {
  return shared ? (
    <BaseBadge
      className="bg-[var(--color-success)]/40 text-[var(--color-ink)]"
      icon={<Eye className="h-3 w-3" aria-hidden />}
    >
      Shared
    </BaseBadge>
  ) : (
    <BaseBadge
      className="bg-[var(--color-line)] text-[var(--color-muted)]"
      icon={<EyeOff className="h-3 w-3" aria-hidden />}
    >
      Private
    </BaseBadge>
  );
}
