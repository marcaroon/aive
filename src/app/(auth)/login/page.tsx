import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { FirebaseSetupNotice } from "@/components/auth/firebase-setup-notice";
import { AUTH } from "@/lib/copy";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{AUTH.welcomeBack}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{AUTH.welcomeBody}</p>
      </div>

      <FirebaseSetupNotice />
      <LoginForm />

      <p className="text-center text-sm text-[var(--color-muted)]">
        <Link href="/forgot-password" className="underline underline-offset-2">
          {AUTH.forgot}
        </Link>
      </p>
    </div>
  );
}
