"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, BellOff } from "lucide-react";
import { AppLogo } from "@/components/ui/app-logo";
import { Button } from "@/components/ui/button";
import { FormError, TextField } from "@/components/ui/form-field";
import { onboardingSchema, type OnboardingValues } from "@/lib/validation/schemas";
import {
  DEFAULT_PREFERRED_NAME,
  markOnboardingCompleted,
  updateUserDocument,
} from "@/services/auth-service";
import { savePeriodRange, savePrimaryProfile } from "@/services/cycle-service";
import { savePreferences } from "@/services/reminder-service";
import { useAuthContext } from "@/contexts/auth-context";
import { getBrowserTimezone, todayKey } from "@/lib/utils/date";
import { MEDICAL_DISCLAIMER } from "@/lib/cycle/prediction";
import { ONBOARDING } from "@/lib/copy";
import { cn } from "@/lib/utils/cn";

const STEPS = ONBOARDING.steps;

const FIELDS_PER_STEP: Array<Array<keyof OnboardingValues>> = [
  ["preferredName", "dateOfBirth"],
  ["averageCycleLength", "averagePeriodDuration"],
  ["lastPeriodStartDate"],
  ["notificationsEnabled"],
];

export function OnboardingFlow() {
  const router = useRouter();
  const { user, profile } = useAuthContext();
  const [step, setStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      preferredName: profile?.preferredName || DEFAULT_PREFERRED_NAME,
      dateOfBirth: "",
      averageCycleLength: 28,
      averagePeriodDuration: 5,
      lastPeriodStartDate: todayKey(),
      notificationsEnabled: true,
    },
  });

  const notificationsEnabled = watch("notificationsEnabled");
  const isLastStep = step === STEPS.length - 1;

  const goNext = async () => {
    const valid = await trigger(FIELDS_PER_STEP[step]);
    if (valid) setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!user) return;
    setFormError(null);

    try {
      await updateUserDocument(user.uid, {
        preferredName: values.preferredName,
        timezone: getBrowserTimezone(),
      });

      await savePrimaryProfile(user.uid, {
        averageCycleLength: values.averageCycleLength,
        averagePeriodDuration: values.averagePeriodDuration,
        lastPeriodStartDate: values.lastPeriodStartDate,
        dateOfBirth: values.dateOfBirth || undefined,
      });

      // Siklus pertama langsung dibuat biar perkiraannya jalan dari hari pertama.
      await savePeriodRange(user.uid, values.lastPeriodStartDate, undefined, "medium");

      await savePreferences(user.uid, { enabled: values.notificationsEnabled });
      await markOnboardingCompleted(user.uid);

      router.replace("/app");
    } catch {
      setFormError(ONBOARDING.failed);
    }
  });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <AppLogo size="md" />

      <div className="mt-8" aria-label={ONBOARDING.step(step + 1, STEPS.length)}>
        <div className="flex gap-1.5">
          {STEPS.map((label, index) => (
            <span
              key={label}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                index <= step ? "bg-[var(--color-primary)]" : "bg-[var(--color-line)]",
              )}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          {ONBOARDING.step(step + 1, STEPS.length)} · {STEPS[step]}
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 flex-1 space-y-5" noValidate>
        <FormError message={formError} />

        {step === 0 ? (
          <section className="animate-rise space-y-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{ONBOARDING.nameTitle}</h1>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{ONBOARDING.nameBody}</p>
            </div>
            <TextField
              label={ONBOARDING.nameLabel}
              autoComplete="nickname"
              error={errors.preferredName?.message}
              {...register("preferredName")}
            />
            <TextField
              label={ONBOARDING.birthLabel}
              type="date"
              hint={ONBOARDING.birthHint}
              error={errors.dateOfBirth?.message}
              {...register("dateOfBirth")}
            />
          </section>
        ) : null}

        {step === 1 ? (
          <section className="animate-rise space-y-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{ONBOARDING.cycleTitle}</h1>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{ONBOARDING.cycleBody}</p>
            </div>
            <TextField
              label={ONBOARDING.cycleLengthLabel}
              type="number"
              inputMode="numeric"
              min={15}
              max={60}
              hint={ONBOARDING.cycleLengthHint}
              error={errors.averageCycleLength?.message}
              {...register("averageCycleLength")}
            />
            <TextField
              label={ONBOARDING.durationLabel}
              type="number"
              inputMode="numeric"
              min={1}
              max={14}
              hint={ONBOARDING.durationHint}
              error={errors.averagePeriodDuration?.message}
              {...register("averagePeriodDuration")}
            />
          </section>
        ) : null}

        {step === 2 ? (
          <section className="animate-rise space-y-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {ONBOARDING.lastPeriodTitle}
              </h1>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{ONBOARDING.lastPeriodBody}</p>
            </div>
            <TextField
              label={ONBOARDING.lastPeriodLabel}
              type="date"
              max={todayKey()}
              error={errors.lastPeriodStartDate?.message}
              {...register("lastPeriodStartDate")}
            />
          </section>
        ) : null}

        {step === 3 ? (
          <section className="animate-rise space-y-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{ONBOARDING.remindersTitle}</h1>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{ONBOARDING.remindersBody}</p>
            </div>

            <div className="grid gap-2">
              {[
                { value: true, label: ONBOARDING.remindYes, icon: Bell },
                { value: false, label: ONBOARDING.remindNo, icon: BellOff },
              ].map((option) => {
                const Icon = option.icon;
                const selected = notificationsEnabled === option.value;
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setValue("notificationsEnabled", option.value)}
                    className={cn(
                      "tap flex items-center gap-3 rounded-2xl border px-4 text-left text-sm font-medium transition-colors",
                      selected
                        ? "border-[var(--color-primary-deep)] bg-[var(--color-butter)]/50"
                        : "border-[var(--color-line)] bg-[var(--color-surface)]",
                    )}
                  >
                    <Icon className="h-5 w-5 text-[var(--color-primary-deep)]" aria-hidden />
                    {option.label}
                  </button>
                );
              })}
            </div>

            <p className="text-xs leading-relaxed text-[var(--color-muted)]">
              {MEDICAL_DISCLAIMER}
            </p>
          </section>
        ) : null}

        <div className="flex gap-3 pt-2">
          {step > 0 ? (
            <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)}>
              {ONBOARDING.back}
            </Button>
          ) : null}

          {isLastStep ? (
            <Button type="submit" fullWidth loading={isSubmitting}>
              {ONBOARDING.finish}
            </Button>
          ) : (
            <Button type="button" fullWidth onClick={goNext}>
              {ONBOARDING.next}
            </Button>
          )}
        </div>
      </form>
    </main>
  );
}
