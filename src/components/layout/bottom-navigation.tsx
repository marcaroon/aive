"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/app" || href === "/partner") return pathname === href;
  return pathname.startsWith(href);
}

/** Bottom bar on mobile — the primary navigation, reachable one-handed. */
export function MobileBottomNavigation({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-surface)]/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-1 pt-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "tap flex flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[11px] font-medium transition-colors",
                  active
                    ? "text-[var(--color-primary-deep)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-ink)]",
                )}
              >
                <Icon
                  className={cn("h-5 w-5", active && "stroke-[2.4]")}
                  aria-hidden
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Sidebar replaces the bottom bar from the md breakpoint upward. */
export function DesktopSidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 hidden h-dvh w-56 shrink-0 border-r border-[var(--color-line)] bg-[var(--color-surface)] p-4 md:block"
    >
      <ul className="mt-16 space-y-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "tap flex items-center gap-3 rounded-2xl px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--color-butter)] text-[var(--color-ink)]"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)]",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
