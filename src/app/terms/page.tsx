import type { Metadata } from "next";
import Link from "next/link";
import { AppLogo } from "@/components/ui/app-logo";
import { HEALTHCARE_SUGGESTION, MEDICAL_DISCLAIMER } from "@/lib/cycle/prediction";

export const metadata: Metadata = { title: "Terms" };

const SECTIONS = [
  { heading: "About Aivé", body: "Aivé is a personal tool for recording and reviewing your menstrual cycle. It is not a public service, a medical product, or a replacement for professional care." },
  { heading: "Estimates, not guarantees", body: "Period, fertile window, and ovulation estimates use the dates you log. Cycles can change, so treat these dates as a rough guide." },
  { heading: "Not contraception", body: "Do not use the fertile window estimate as contraception or to plan or avoid pregnancy." },
  { heading: "Your choices", body: "You choose what to record and share. Keep your private access link safe and review sharing settings when your needs change." },
];

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-6">
      <Link href="/" aria-label="Aivé home">
        <AppLogo size="sm" />
      </Link>

      <h1 className="mt-8 text-2xl font-semibold tracking-tight">Terms</h1>

      <div className="mt-8 space-y-5">
        {SECTIONS.map((section) => (
          <section key={section.heading} className="card p-5">
            <h2 className="text-base font-semibold">{section.heading}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)]">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <div className="mt-8 space-y-2 text-xs leading-relaxed text-[var(--color-muted)]">
        <p>{MEDICAL_DISCLAIMER}</p>
        <p>{HEALTHCARE_SUGGESTION}</p>
      </div>
    </main>
  );
}
