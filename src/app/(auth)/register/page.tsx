import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { FirebaseSetupNotice } from "@/components/auth/firebase-setup-notice";
import { MEDICAL_DISCLAIMER } from "@/lib/cycle/prediction";
import { REGISTRATION_ENABLED } from "@/lib/config";
import { AUTH } from "@/lib/copy";

export const metadata: Metadata = { title: "Daftar" };

export default function RegisterPage() {
  // Middleware already redirects here, but this is the safety net in case the
  // route is ever reached directly.
  if (!REGISTRATION_ENABLED) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{AUTH.closedTitle}</h1>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
            {AUTH.closedBody}
          </p>
        </div>
        <Link
          href="/login"
          className="tap inline-flex w-full items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[15px] font-medium text-[var(--color-ink)]"
        >
          {AUTH.signIn}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Your space starts private. You choose what to share.
        </p>
      </div>

      <FirebaseSetupNotice />
      <RegisterForm />

      <p className="text-xs leading-relaxed text-[var(--color-muted)]">{MEDICAL_DISCLAIMER}</p>

      <p className="text-center text-sm text-[var(--color-muted)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-[var(--color-ink)] underline underline-offset-2"
        >
          {AUTH.signIn}
        </Link>
      </p>
    </div>
  );
}
