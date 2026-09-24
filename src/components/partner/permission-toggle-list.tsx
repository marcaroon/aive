"use client";

import { PermissionBadge } from "@/components/ui/badges";
import { FormError } from "@/components/ui/form-field";
import { usePermissions } from "@/hooks/use-permissions";
import {
  PERMISSION_DESCRIPTIONS,
  PERMISSION_LABELS,
  type PartnerPermissions,
} from "@/types/permission";
import { cn } from "@/lib/utils/cn";
import { SHARING } from "@/lib/copy";

const ORDER: Array<keyof PartnerPermissions> = [
  "shareSupportRequest",
  "shareCyclePhase",
  "sharePredictedPeriod",
  "shareMood",
  "sharePainLevel",
  "shareFlowStatus",
  "shareSymptoms",
  "shareDailyNotes",
];

export function PermissionToggleList() {
  const { permissions, toggle, saving, error } = usePermissions();

  return (
    <div className="space-y-3">
      <FormError message={error} />

      <ul className="card divide-y divide-[var(--color-line)] p-0">
        {ORDER.map((key) => {
          const enabled = permissions[key];
          return (
            <li key={key} className="flex items-start gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">
                    {PERMISSION_LABELS[key]}
                  </span>
                  <PermissionBadge shared={enabled} />
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted)]">
                  {PERMISSION_DESCRIPTIONS[key]}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={`Share ${PERMISSION_LABELS[key].toLowerCase()}`}
                disabled={saving}
                onClick={() => void toggle(key, !enabled)}
                className={cn(
                  "relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60",
                  enabled
                    ? "bg-[var(--color-primary-deep)]"
                    : "bg-[var(--color-line)]",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-1 h-5 w-5 rounded-full bg-white transition-transform",
                    enabled ? "translate-x-6" : "translate-x-1",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>

      <p className="text-xs leading-relaxed text-[var(--color-muted)]">
        {SHARING.toggleNote}
      </p>
    </div>
  );
}
