"use client";

import { AUTH_ENABLED } from "@/lib/config";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer, SectionHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/bottom-sheet";
import { FormError, FormSuccess } from "@/components/ui/form-field";
import { useAuthContext } from "@/contexts/auth-context";
import { savePrivacySettings, savePreferences } from "@/services/reminder-service";
import {
  deleteAccount,
  deleteHealthData,
  downloadJson,
  exportPersonalData,
} from "@/services/data-service";
import { DEFAULT_PRIVACY_SETTINGS } from "@/types/user";
import { todayKey } from "@/lib/utils/date";
import { PRIVACY_SETTINGS } from "@/lib/copy";
import { cn } from "@/lib/utils/cn";

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <li className="flex items-start gap-3 px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted)]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-[var(--color-primary-deep)]" : "bg-[var(--color-line)]",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </li>
  );
}

export function PrivacySettingsScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuthContext();

  const settings = profile?.privacySettings ?? DEFAULT_PRIVACY_SETTINGS;
  const hideSensitive = profile?.notificationPreferences?.hideSensitiveContent ?? true;

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteData, setConfirmDeleteData] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);

  const update = async (key: "privacyMode" | "appLockEnabled", value: boolean) => {
    if (!user) return;
    setError(null);
    try {
      await savePrivacySettings(user.uid, { ...settings, [key]: value });
    } catch {
      setError("Couldn't save your settings. Try again.");
    }
  };

  const updateHideSensitive = async (value: boolean) => {
    if (!user) return;
    setError(null);
    try {
      await savePreferences(user.uid, {
        ...profile?.notificationPreferences,
        hideSensitiveContent: value,
      });
    } catch {
      setError("Couldn't save your settings. Try again.");
    }
  };

  const exportData = async () => {
    if (!user || !profile) return;
    setBusy(true);
    setError(null);
    try {
      const contents = await exportPersonalData(user.uid, profile);
      downloadJson(contents, `aive-export-${todayKey()}.json`);
      setMessage(PRIVACY_SETTINGS.exported);
    } catch {
      setError("Couldn't prepare your download. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const removeData = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await deleteHealthData(user.uid);
      setConfirmDeleteData(false);
      setMessage(PRIVACY_SETTINGS.deletedData);
      router.refresh();
    } catch {
      setError("Couldn't delete your data. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const removeAccount = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAccount(user.uid);
      await signOut();
      router.replace("/");
    } catch {
      setError(
        "Please sign out and sign in again before deleting your account.",
      );
      setConfirmDeleteAccount(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AppHeader title={PRIVACY_SETTINGS.title} backHref="/app/settings" />

      <PageContainer>
        <div className="space-y-6">
          <FormError message={error} />
          <FormSuccess message={message} />

          <section>
            <SectionHeader title={PRIVACY_SETTINGS.deviceSection} />
            <ul className="card divide-y divide-[var(--color-line)] p-0">
              <Toggle
                label={PRIVACY_SETTINGS.privacyMode}
                description={PRIVACY_SETTINGS.privacyModeBody}
                checked={settings.privacyMode}
                onChange={(value) => void update("privacyMode", value)}
              />
              {AUTH_ENABLED && <Toggle
                label={PRIVACY_SETTINGS.appLock}
                description={PRIVACY_SETTINGS.appLockBody}
                checked={settings.appLockEnabled}
                onChange={(value) => void update("appLockEnabled", value)}
              />}
              <Toggle
                label={PRIVACY_SETTINGS.hideSensitive}
                description={PRIVACY_SETTINGS.hideSensitiveBody}
                checked={hideSensitive}
                onChange={(value) => void updateHideSensitive(value)}
              />
            </ul>
          </section>

          <section id="export">
            <SectionHeader
              title={PRIVACY_SETTINGS.dataSection}
              description={PRIVACY_SETTINGS.dataBody}
            />
            <div className="space-y-3">
              <Button
                variant="secondary"
                fullWidth
                loading={busy}
                onClick={() => void exportData()}
              >
                <Download className="h-4 w-4" aria-hidden />
                {PRIVACY_SETTINGS.exportButton}
              </Button>

              <Button variant="secondary" fullWidth onClick={() => setConfirmDeleteData(true)}>
                <Trash2 className="h-4 w-4" aria-hidden />
                {PRIVACY_SETTINGS.deleteData}
              </Button>

              {AUTH_ENABLED && <Button variant="danger" fullWidth onClick={() => setConfirmDeleteAccount(true)}>
                {PRIVACY_SETTINGS.deleteAccount}
              </Button>}
            </div>
          </section>

          <p className="text-xs leading-relaxed text-[var(--color-muted)]">
            {PRIVACY_SETTINGS.noTracking}
          </p>
        </div>
      </PageContainer>

      <ConfirmationDialog
        open={confirmDeleteData}
        title={PRIVACY_SETTINGS.confirmDeleteDataTitle}
        description={PRIVACY_SETTINGS.confirmDeleteDataBody}
        confirmLabel={busy ? "Deleting…" : "Delete"}
        destructive
        onConfirm={() => void removeData()}
        onCancel={() => setConfirmDeleteData(false)}
      />

      <ConfirmationDialog
        open={confirmDeleteAccount}
        title={PRIVACY_SETTINGS.confirmDeleteAccountTitle}
        description={PRIVACY_SETTINGS.confirmDeleteAccountBody}
        confirmLabel={busy ? "Deleting…" : "Delete account"}
        destructive
        onConfirm={() => void removeAccount()}
        onCancel={() => setConfirmDeleteAccount(false)}
      />
    </>
  );
}
