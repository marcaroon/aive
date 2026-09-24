import Link from "next/link";
import { AppLogo } from "@/components/ui/app-logo";
import { MEDICAL_DISCLAIMER } from "@/lib/cycle/prediction";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 py-8 sm:px-6">
      <AppLogo size="md" showTagline />

      <section className="mt-12 flex-1">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          A little space to
          <br />
          check in with yourself.
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--color-muted)]">
          Made for the two of us. A little space that feels like yours.
        </p>

        <div className="mt-8">
          <Link
            href="/login"
            className="tap inline-flex items-center justify-center rounded-2xl bg-[var(--color-primary)] px-8 text-[15px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-primary-deep)] hover:text-white"
          >
            Sign in
          </Link>
        </div>
      </section>

      <footer className="mt-12 border-t border-[var(--color-line)] pt-5">
        <p className="text-xs leading-relaxed text-[var(--color-muted)]">
          {MEDICAL_DISCLAIMER}
        </p>
        <nav className="mt-3 flex gap-4 text-xs text-[var(--color-muted)]">
          <Link href="/terms" className="underline underline-offset-2">
            Terms
          </Link>
        </nav>
      </footer>
    </main>
  );
}
