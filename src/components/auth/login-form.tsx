"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError, TextField } from "@/components/ui/form-field";
import { loginSchema } from "@/lib/validation/schemas";
import { friendlyAuthError, fetchUserDocument, signIn } from "@/services/auth-service";
import { AUTH } from "@/lib/copy";

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await signIn(values.email, values.password);
      const profile = await fetchUserDocument(user.uid);

      if (!profile) {
        // Auth succeeded but the profile document is missing — send them to setup.
        router.replace("/onboarding");
        return;
      }
      if (profile.role === "partner") {
        router.replace("/partner");
        return;
      }
      router.replace(profile.onboardingCompleted ? "/app" : "/onboarding");
    } catch (error) {
      setFormError(friendlyAuthError(error));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={formError} />

      <TextField
        label={AUTH.email}
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <TextField
        label={AUTH.password}
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        error={errors.password?.message}
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="tap flex items-center justify-center rounded-2xl text-[var(--color-muted)]"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        {...register("password")}
      />

      <Button type="submit" fullWidth loading={isSubmitting}>
        {AUTH.signIn}
      </Button>
    </form>
  );
}
