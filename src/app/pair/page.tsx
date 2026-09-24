import type { Metadata } from "next";
import Link from "next/link";
import { AppLogo } from "@/components/ui/app-logo";
import { PairForm } from "@/components/partner/pair-form";
import { PAIR } from "@/lib/copy";

export const metadata: Metadata = { title: "Connect" };

export default function PairPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <Link href="/" aria-label="Aivé home">
        <AppLogo size="md" />
      </Link>

      <div className="mt-10 flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{PAIR.title}</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{PAIR.body}</p>
        </div>

        <PairForm />

        <p className="text-xs leading-relaxed text-[var(--color-muted)]">{PAIR.note}</p>
      </div>
    </main>
  );
}
