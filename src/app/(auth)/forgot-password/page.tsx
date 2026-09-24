import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AUTH } from "@/lib/copy";

export const metadata: Metadata = { title: "Lupa password" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{AUTH.resetTitle}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{AUTH.resetBody}</p>
      </div>

      <ForgotPasswordForm />

      <p className="text-center text-sm text-[var(--color-muted)]">
        <Link href="/login" className="underline underline-offset-2">
          {AUTH.backToSignIn}
        </Link>
      </p>
    </div>
  );
}
