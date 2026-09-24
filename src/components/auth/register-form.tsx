"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Flower2, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError, TextField } from "@/components/ui/form-field";
import { registerSchema } from "@/lib/validation/schemas";
import { friendlyAuthError, registerUser } from "@/services/auth-service";
import { cn } from "@/lib/utils/cn";
import type { UserRole } from "@/types/user";

type RegisterValues = z.infer<typeof registerSchema>;

const ROLE_OPTIONS: Array<{
  value: UserRole;
  label: string;
  description: string;
  icon: typeof Flower2;
}> = [
  {
    value: "primary",
    label: "I track my cycle",
    description: "You record periods, moods and symptoms.",
    icon: Flower2,
  },
  {
    value: "partner",
    label: "I am the partner",
    description: "You will connect with a pairing code.",
    icon: HeartHandshake,
  },
];

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "primary",
    },
  });

  const role = watch("role");

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await registerUser({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        role: values.role,
      });
      router.replace(values.role === "primary" ? "/onboarding" : "/pair");
    } catch (error) {
      console.error("registerUser failed:", error);
      setFormError(friendlyAuthError(error));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormError message={formError} />

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Who are you here as?</legend>
        <div className="grid gap-2">
          {ROLE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = role === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue("role", option.value, { shouldValidate: true })}
                aria-pressed={selected}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                  selected
                    ? "border-[var(--color-primary-deep)] bg-[var(--color-butter)]/50"
                    : "border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-cream)]",
                )}
              >
                <Icon className="mt-0.5 h-5 w-5 text-[var(--color-primary-deep)]" aria-hidden />
                <span>
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-xs text-[var(--color-muted)]">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <TextField
        label="Your name"
        autoComplete="name"
        error={errors.fullName?.message}
        {...register("fullName")}
      />
      <TextField
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters."
        error={errors.password?.message}
        {...register("password")}
      />
      <TextField
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button type="submit" fullWidth loading={isSubmitting}>
        Create account
      </Button>
    </form>
  );
}
