"use client";

import { AUTH_ENABLED } from "@/lib/config";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { format } from "date-fns";
import { enUS as enLocale } from "date-fns/locale";
import { Bell, FileText, LogOut } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer, SectionHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess, TextField } from "@/components/ui/form-field";
import { SettingsList } from "./settings-list";
import { useAuthContext } from "@/contexts/auth-context";
import { useRelationship } from "@/contexts/relationship-context";
import { updateUserDocument } from "@/services/auth-service";
import { savePreferences } from "@/services/reminder-service";
import { profileSchema } from "@/lib/validation/schemas";
import {
  getNotificationPermission,
  requestNotificationPermission,
} from "@/lib/utils/notifications";
import { REMINDERS, SETTINGS, SHARING } from "@/lib/copy";

type ProfileValues = z.infer<typeof profileSchema>;

export function PartnerSettingsScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuthContext();
  const { relationship, loading } = useRelationship();

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const enableNotifications = async () => {
    if (!user) return;
    const result = await requestNotificationPermission();
    if (result === "granted") {
      await savePreferences(user.uid, { enabled: true, partnerActivity: true });
      setMessage(REMINDERS.allowed);
    } else {
      setError("Notifications aren't allowed. You can change this in your browser settings.");
    }
  };

  return (
    <>
      <AppHeader title={SETTINGS.profileTitle} backHref="/partner" />

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
                error={errors.preferredName?.message}
                {...register("preferredName")}
              />
              <Button type="submit" fullWidth loading={isSubmitting}>
                {SETTINGS.saveProfile}
              </Button>
            </form>
          </section>

          <section>
            <SectionHeader title={SETTINGS.connection} />
            <div className="card p-5 text-sm">
              {loading ? (
                <p className="text-[var(--color-muted)]">One sec…</p>
              ) : relationship ? (
                <>
                  <p className="font-medium">{SHARING.connected}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                    {relationship.pairedAt
                      ? SHARING.pairedOn(
                          format(relationship.pairedAt.toDate(), "d MMMM yyyy", {
                            locale: enLocale,
                          }),
                        )
                      : ""}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
                    {SETTINGS.partnerNote}
                  </p>
                </>
              ) : (
                <p className="text-[var(--color-muted)]">
                  Not connected yet. Ask Aivel for a code.
                </p>
              )}
            </div>
          </section>

          <section>
            <SettingsList
              items={[
                {
                  label: REMINDERS.allowButton,
                  description:
                    getNotificationPermission() === "granted"
                      ? "Enabled on this device"
                      : "For notes and support requests",
                  icon: Bell,
                  onClick: () => void enableNotifications(),
                },
                { href: "/privacy", label: SETTINGS.privacyPolicy, icon: FileText },
                ...(AUTH_ENABLED ? [{
                  label: SETTINGS.signOut,
                  icon: LogOut,
                  destructive: true,
                  onClick: () => {
                    void signOut().then(() => router.replace("/login"));
                  },
                }] : []),
              ]}
            />
          </section>
        </div>
      </PageContainer>
    </>
  );
}
