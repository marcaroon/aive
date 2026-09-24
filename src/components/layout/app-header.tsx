"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { AppLogo } from "@/components/ui/app-logo";

interface AppHeaderProps {
  title?: string;
  backHref?: string;
  action?: ReactNode;
}

export function AppHeader({ title, backHref, action }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-cream)]/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4 sm:px-6">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Back"
            className="tap -ml-2 flex items-center justify-center rounded-2xl text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Link>
        ) : null}

        {title ? (
          <h1 className="text-base font-semibold text-[var(--color-ink)]">{title}</h1>
        ) : (
          <AppLogo size="sm" />
        )}

        <div className="ml-auto flex items-center gap-1">{action}</div>
      </div>
    </header>
  );
}
