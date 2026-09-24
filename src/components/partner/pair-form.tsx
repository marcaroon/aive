"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess, TextField } from "@/components/ui/form-field";
import { pairingCodeSchema } from "@/lib/validation/schemas";
import { PairingError, redeemPairingCode } from "@/services/relationship-service";
import { useAuthContext } from "@/contexts/auth-context";
import { AUTH, PAIR } from "@/lib/copy";
import { AUTH_ENABLED } from "@/lib/config";
import { LoadingState } from "@/components/ui/states";

type Values = z.infer<typeof pairingCodeSchema>;

export function PairForm() {
  const router = useRouter();
  const { user, profile } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(pairingCodeSchema),
    defaultValues: { code: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!user) {
      setError("Sign in first, then enter your code.");
      return;
    }
    setError(null);
    try {
      await redeemPairingCode(values.code, user.uid);
      setDone(true);
      router.replace("/partner");
    } catch (caught) {
      setError(
        caught instanceof PairingError
          ? caught.message
          : "Couldn't connect with that code. Try again.",
      );
    }
  });

  // Sign-up is closed, so the only route forward here is signing in.
  if (!user) {
    if (!AUTH_ENABLED) return <LoadingState lines={2} />;
    return (
      <div className="space-y-4">
        <FormError message={PAIR.needAccount} />
        <Link href="/login">
          <Button fullWidth>{AUTH.signIn}</Button>
        </Link>
      </div>
    );
  }

  if (profile && profile.role !== "partner") {
    return <FormError message={PAIR.wrongRole} />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={error} />
      <FormSuccess message={done ? PAIR.connected : null} />

      <TextField
        label={PAIR.codeLabel}
        autoCapitalize="characters"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="ABC123"
        className="text-center font-mono text-xl tracking-[0.3em] uppercase"
        error={errors.code?.message}
        {...register("code")}
      />

      <Button type="submit" fullWidth loading={isSubmitting}>
        {PAIR.connect}
      </Button>
    </form>
  );
}
