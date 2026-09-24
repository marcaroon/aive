"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer, SectionHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess, TextField } from "@/components/ui/form-field";
import { LoadingState } from "@/components/ui/states";
import { useAuthContext } from "@/contexts/auth-context";
import { useCycle } from "@/hooks/use-cycle";
import { updateUserDocument } from "@/services/auth-service";
import { savePrimaryProfile } from "@/services/cycle-service";
import { profileSchema } from "@/lib/validation/schemas";
import { ONBOARDING, SETTINGS } from "@/lib/copy";

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileScreen() {
  const { user, profile } = useAuthContext();
  const cycle = useCycle();

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cycleLength, setCycleLength] = useState<number | null>(null);
  const [periodDuration, setPeriodDuration] = useState<number | null>(null);
  const [savingCycle, setSavingCycle] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: profile?.fullName ?? "",
      preferredName: profile?.preferredName ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!user) return;
    setError(null);
    try {
      await updateUserDocument(user.uid, values);
      setMessage(SETTINGS.profileSaved);
    } catch {
      setError("Couldn't save your profile. Try again.");
    }
  });

  const saveCycleSettings = async () => {
    if (!user || !cycle.data) return;
    setSavingCycle(true);
    setError(null);
    try {
      await savePrimaryProfile(user.uid, {
        averageCycleLength: cycleLength ?? cycle.data.profile?.averageCycleLength ?? 28,
        averagePeriodDuration:
          periodDuration ?? cycle.data.profile?.averagePeriodDuration ?? 5,
      });
      await cycle.refresh();
      setMessage(SETTINGS.cycleSaved);
    } catch {
      setError("Couldn't save your cycle settings. Try again.");
    } finally {
      setSavingCycle(false);
    }
  };

  return (
    <>
      <AppHeader title={SETTINGS.profileTitle} backHref="/app/settings" />

      <PageContainer>
        <div className="space-y-6">
          <FormError message={error} />
          <FormSuccess message={message} />

          <section>
            <SectionHeader title={SETTINGS.aboutYou} />
            <form onSubmit={onSubmit} className="card space-y-4 p-5" noValidate>
              <TextField
                label={SETTINGS.fullName}
                error={errors.fullName?.message}
                {...register("fullName")}
              />
              <TextField
                label={SETTINGS.preferredName}
                hint={SETTINGS.preferredNameHint}
                error={errors.preferredName?.message}
                {...register("preferredName")}
              />
              <Button type="submit" fullWidth loading={isSubmitting}>
                {SETTINGS.saveProfile}
              </Button>
            </form>
          </section>

          <section>
            <SectionHeader
              title={SETTINGS.cycleSettings}
              description={SETTINGS.cycleSettingsBody}
            />

            {cycle.loading ? (
              <LoadingState lines={1} />
            ) : (
              <div className="card space-y-4 p-5">
                <div>
                  <label htmlFor="avg-cycle" className="mb-1.5 block text-sm font-medium">
                    {ONBOARDING.cycleLengthLabel}
                  </label>
                  <input
                    id="avg-cycle"
                    type="number"
                    min={15}
                    max={60}
                    defaultValue={cycle.data?.profile?.averageCycleLength ?? 28}
                    onChange={(event) => setCycleLength(Number(event.target.value))}
                    className="tap w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-[15px] outline-none focus:border-[var(--color-primary-deep)]"
                  />
                </div>

                <div>
                  <label htmlFor="avg-period" className="mb-1.5 block text-sm font-medium">
                    {ONBOARDING.durationLabel}
                  </label>
                  <input
                    id="avg-period"
                    type="number"
                    min={1}
                    max={14}
                    defaultValue={cycle.data?.profile?.averagePeriodDuration ?? 5}
                    onChange={(event) => setPeriodDuration(Number(event.target.value))}
                    className="tap w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-[15px] outline-none focus:border-[var(--color-primary-deep)]"
                  />
                </div>

                <Button
                  fullWidth
                  loading={savingCycle}
                  onClick={() => void saveCycleSettings()}
                >
                  {SETTINGS.saveCycle}
                </Button>
              </div>
            )}
          </section>
        </div>
      </PageContainer>
    </>
  );
}
