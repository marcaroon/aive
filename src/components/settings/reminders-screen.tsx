"use client";

import { useCallback, useState } from "react";
import { Bell, Plus, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer, SectionHeader } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { FormError, FormSuccess } from "@/components/ui/form-field";
import { ReminderForm } from "./reminder-form";
import { useAuthContext } from "@/contexts/auth-context";
import { useAsync } from "@/hooks/use-async";
import {
  createReminder,
  deleteReminder,
  listReminders,
  updateReminder,
} from "@/services/reminder-service";
import {
  describeSchedule,
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermissionState,
} from "@/lib/utils/notifications";
import { PRIVATE_REMINDER_TEXT } from "@/types/notification";
import type { Reminder } from "@/types/notification";
import type { ReminderValues } from "@/lib/validation/schemas";
import { REMINDERS, STATES } from "@/lib/copy";
import { cn } from "@/lib/utils/cn";

export function RemindersScreen() {
  const { user } = useAuthContext();
  const userId = user?.uid ?? null;

  const reminders = useAsync<Reminder[]>(
    userId ? () => listReminders(userId) : null,
    [userId],
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [permission, setPermission] = useState<NotificationPermissionState>(() =>
    getNotificationPermission(),
  );
  const [error, setError] = useState<string | null>(null);

  const askPermission = useCallback(async () => {
    setPermission(await requestNotificationPermission());
  }, []);

  const save = async (values: ReminderValues) => {
    if (!userId) return;
    setError(null);
    try {
      if (editing) {
        await updateReminder(userId, editing.id, values);
      } else {
        await createReminder(userId, values);
      }
      await reminders.refresh();
      setSheetOpen(false);
      setEditing(null);
    } catch {
      setError("Couldn't save your reminder. Try again.");
    }
  };

  const remove = async (reminderId: string) => {
    if (!userId) return;
    try {
      await deleteReminder(userId, reminderId);
      await reminders.refresh();
    } catch {
      setError("Couldn't delete your reminder. Try again.");
    }
  };

  const toggle = async (reminder: Reminder) => {
    if (!userId) return;
    try {
      await updateReminder(userId, reminder.id, { enabled: !reminder.enabled });
      await reminders.refresh();
    } catch {
      setError("Couldn't update your reminder. Try again.");
    }
  };

  return (
    <>
      <AppHeader title={REMINDERS.title} backHref="/app/settings" />

      <PageContainer>
        <div className="space-y-5">
          <FormError message={error} />

          {permission !== "granted" ? (
            <section className="card p-5">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[var(--color-primary-deep)]" aria-hidden />
                <h2 className="text-base font-semibold">{REMINDERS.allowTitle}</h2>
              </div>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {permission === "denied" ? REMINDERS.blocked : REMINDERS.allowBody}
              </p>
              {permission === "default" ? (
                <Button className="mt-3" size="sm" onClick={() => void askPermission()}>
                  {REMINDERS.allowButton}
                </Button>
              ) : null}
            </section>
          ) : (
            <FormSuccess message={REMINDERS.allowed} />
          )}

          <section>
            <SectionHeader
              title={REMINDERS.yourReminders}
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setSheetOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  {REMINDERS.newReminder}
                </Button>
              }
            />

            {reminders.loading ? <LoadingState lines={2} /> : null}

            {reminders.error ? (
              <ErrorState
                action={
                  <Button variant="secondary" size="sm" onClick={() => void reminders.refresh()}>
                    {STATES.tryAgain}
                  </Button>
                }
              />
            ) : null}

            {!reminders.loading && !reminders.error && (reminders.data?.length ?? 0) === 0 ? (
              <EmptyState
                title={REMINDERS.noReminders}
                description={REMINDERS.noRemindersBody}
              />
            ) : null}

            <ul className="space-y-3">
              {reminders.data?.map((reminder) => (
                <li key={reminder.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => {
                        setEditing(reminder);
                        setSheetOpen(true);
                      }}
                    >
                      <p className="text-sm font-medium">{reminder.title}</p>
                      <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                        {reminder.privateReminder ? PRIVATE_REMINDER_TEXT : reminder.message}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {describeSchedule(reminder.time, reminder.days)}
                      </p>
                    </button>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={reminder.enabled}
                      aria-label={`Nyalain ${reminder.title}`}
                      onClick={() => void toggle(reminder)}
                      className={cn(
                        "relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors",
                        reminder.enabled
                          ? "bg-[var(--color-primary-deep)]"
                          : "bg-[var(--color-line)]",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "absolute top-1 h-5 w-5 rounded-full bg-white transition-transform",
                          reminder.enabled ? "translate-x-6" : "translate-x-1",
                        )}
                      />
                    </button>

                    <button
                      type="button"
                      aria-label={`Delete ${reminder.title}`}
                      onClick={() => void remove(reminder.id)}
                      className="tap flex items-center justify-center rounded-2xl px-1 text-[var(--color-muted)] hover:text-[var(--color-error)]"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </PageContainer>

      <BottomSheet
        open={sheetOpen}
        title={editing ? "Edit reminder" : "New reminder"}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
      >
        <ReminderForm reminder={editing} onSave={save} />
      </BottomSheet>
    </>
  );
}
