"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess, TextField } from "@/components/ui/form-field";
import { forgotPasswordSchema } from "@/lib/validation/schemas";
import { friendlyAuthError, requestPasswordReset } from "@/services/auth-service";
import { AUTH } from "@/lib/copy";

type Values = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await requestPasswordReset(values.email);
      setSent(true);
    } catch (error) {
      setFormError(friendlyAuthError(error));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={formError} />
      <FormSuccess message={sent ? AUTH.resetSent : null} />

      <TextField
        label={AUTH.email}
        type="email"
        inputMode="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />

      <Button type="submit" fullWidth loading={isSubmitting}>
        {AUTH.resetSend}
      </Button>
    </form>
  );
}
