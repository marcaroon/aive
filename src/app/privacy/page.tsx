import type { Metadata } from "next";
import Link from "next/link";
import { AppLogo } from "@/components/ui/app-logo";
import { MEDICAL_DISCLAIMER } from "@/lib/cycle/prediction";

export const metadata: Metadata = { title: "Privacy" };

const SECTIONS = [
  { heading: "What Aivé stores", body: "Your profile, cycle and period dates, and the details you choose to log: moods, symptoms, pain, flow, energy, sleep, water, activities, and personal notes." },
  { heading: "Who can see it", body: "Your personal link opens your space without an account login. Anyone with that link can use its access, so keep it between the two of you. Aivel's link can manage her data. Ammar's link can only read the details she shares." },
  { heading: "How sharing works", body: "Health details start private. Support requests are enabled by default. Each sharing setting controls what appears in Ammar's summary. Turning one off removes that detail. Disconnecting ends access to the shared space." },
  { heading: "Where your data lives", body: "Your data is stored in your Firebase project and accessed through the app server on Vercel. Aivé has no advertising SDKs, tracking pixels, or third-party analytics." },
  { heading: "Your data, your call", body: "You can download your logs, change sharing settings, disconnect your shared space, or permanently delete your logs from Settings." },
  { heading: "Notifications", body: "Private reminders use a neutral notification without symptoms or dates. Browser reminders work on this device while the app is open." },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-6">
      <Link href="/" aria-label="Aivé home">
        <AppLogo size="sm" />
      </Link>

      <h1 className="mt-8 text-2xl font-semibold tracking-tight">Privacy</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        A little space for two, with sharing on your terms.
      </p>

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

      <p className="mt-8 text-xs leading-relaxed text-[var(--color-muted)]">{MEDICAL_DISCLAIMER}</p>
    </main>
  );
}
