import Link from "next/link";
import type { ReactNode } from "react";
import { AppLogo } from "@/components/ui/app-logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <Link href="/" aria-label="Aivé home">
        <AppLogo size="md" showTagline />
      </Link>
      <div className="mt-10 flex-1">{children}</div>
      <p className="mt-8 text-center text-xs text-[var(--color-muted)]">
        <Link href="/terms" className="underline underline-offset-2">
          Terms
        </Link>
      </p>
    </main>
  );
}
