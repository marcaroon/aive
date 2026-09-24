"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

export interface SettingsItem {
  href?: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  onClick?: () => void;
  destructive?: boolean;
}

export function SettingsList({ items }: { items: SettingsItem[] }) {
  return (
    <ul className="card divide-y divide-[var(--color-line)] p-0">
      {items.map((item) => {
        const Icon = item.icon;
        const content = (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-cream)]">
              <Icon
                className={
                  item.destructive
                    ? "h-4 w-4 text-[var(--color-error)]"
                    : "h-4 w-4 text-[var(--color-primary-deep)]"
                }
                aria-hidden
              />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span
                className={
                  item.destructive
                    ? "block text-sm font-medium text-[var(--color-error)]"
                    : "block text-sm font-medium"
                }
              >
                {item.label}
              </span>
              {item.description ? (
                <span className="block text-xs text-[var(--color-muted)]">{item.description}</span>
              ) : null}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden />
          </>
        );

        return (
          <li key={item.label}>
            {item.href ? (
              <Link
                href={item.href}
                className="tap flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--color-cream)]"
              >
                {content}
              </Link>
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                className="tap flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[var(--color-cream)]"
              >
                {content}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
