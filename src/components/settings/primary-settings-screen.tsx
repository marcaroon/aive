"use client";

import { AUTH_ENABLED } from "@/lib/config";
import { useRouter } from "next/navigation";
import {
  Bell,
  Download,
  FileText,
  HeartHandshake,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer, SectionHeader } from "@/components/ui/card";
import { SettingsList } from "./settings-list";
import { useAuthContext } from "@/contexts/auth-context";
import { MEDICAL_DISCLAIMER } from "@/lib/cycle/prediction";
import { SETTINGS } from "@/lib/copy";

export function PrimarySettingsScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthContext();

  return (
    <>
      <AppHeader title={SETTINGS.title} backHref="/app" />

      <PageContainer>
        <div className="space-y-6">
          <section className="card p-5">
            <p className="text-sm font-medium">{profile?.preferredName}</p>
            <p className="text-xs text-[var(--color-muted)]">{profile?.email}</p>
          </section>

          <section>
            <SectionHeader title={SETTINGS.accountSection} />
            <SettingsList
              items={[
                {
                  href: "/app/profile",
                  label: SETTINGS.editProfile,
                  description: SETTINGS.editProfileBody,
                  icon: User,
                },
                {
                  href: "/app/reminders",
                  label: SETTINGS.reminders,
                  description: SETTINGS.remindersBody,
                  icon: Bell,
                },
                {
                  href: "/app/partner",
                  label: SETTINGS.sharing,
                  description: SETTINGS.sharingBody,
                  icon: HeartHandshake,
                },
              ]}
            />
          </section>

          <section>
            <SectionHeader title={SETTINGS.privacySection} />
            <SettingsList
              items={[
                {
                  href: "/app/settings/privacy",
                  label: SETTINGS.privacySettings,
                  description: SETTINGS.privacySettingsBody,
                  icon: Shield,
                },
                {
                  href: "/app/settings/privacy#export",
                  label: SETTINGS.exportData,
                  description: SETTINGS.exportDataBody,
                  icon: Download,
                },
                {
                  href: "/privacy",
                  label: SETTINGS.privacyPolicy,
                  icon: FileText,
                },
              ]}
            />
          </section>

          {AUTH_ENABLED && <section>
            <SettingsList
              items={[
                {
                  label: SETTINGS.signOut,
                  icon: LogOut,
                  destructive: true,
                  onClick: () => {
                    void signOut().then(() => router.replace("/login"));
                  },
                },
              ]}
            />
          </section>}

          <p className="text-xs leading-relaxed text-[var(--color-muted)]">
            {MEDICAL_DISCLAIMER}
          </p>
        </div>
      </PageContainer>
    </>
  );
}
