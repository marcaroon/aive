"use client";

import { AppHeader } from "@/components/layout/app-header";
import { PageContainer, SectionHeader } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { useHealthUser } from "@/hooks/use-health-user";
import { useAsync } from "@/hooks/use-async";
import { getPrimaryProfile } from "@/services/cycle-service";
import { fetchUserDocument } from "@/services/auth-service";
import { listReminders } from "@/services/reminder-service";
import { describeSchedule } from "@/lib/utils/notifications";
import { formatFriendlyDate, timestampToDateKey } from "@/lib/utils/date";

export function AivelProfileScreen() {
  const { userId } = useHealthUser();
  const state = useAsync(
    userId
      ? async () => {
          const [profile, cycle, reminders] = await Promise.all([
            fetchUserDocument(userId),
            getPrimaryProfile(userId),
            listReminders(userId),
          ]);
          return { profile, cycle, reminders };
        }
      : null,
    [userId],
    15000,
  );
  const data = state.data;
  const birthday = timestampToDateKey(data?.cycle?.dateOfBirth);
  return (
    <>
      <AppHeader title="Aivel's profile" backHref="/partner" />
      <PageContainer>
        {state.loading ? (
          <LoadingState />
        ) : state.error ? (
          <ErrorState
            action={
              <Button onClick={() => void state.refresh()}>Try again</Button>
            }
          />
        ) : data ? (
          <div className="space-y-6">
            <section className="card p-5">
              <SectionHeader title="About Aivel" />
              <dl className="space-y-3 text-sm">
                {[
                  ["Name", data.profile?.fullName],
                  ["Preferred name", data.profile?.preferredName],
                  [
                    "Date of birth",
                    birthday ? formatFriendlyDate(birthday) : "Not added",
                  ],
                  ["Timezone", data.profile?.timezone],
                  [
                    "Average cycle",
                    `${data.cycle?.averageCycleLength ?? 28} days`,
                  ],
                  [
                    "Average period",
                    `${data.cycle?.averagePeriodDuration ?? 5} days`,
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-[var(--color-muted)]">{label}</dt>
                    <dd className="text-right">{value || "Not added"}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section>
              <SectionHeader title="Aivel's reminders" />
              {data.reminders.length ? (
                <ul className="space-y-3">
                  {data.reminders.map((reminder) => (
                    <li key={reminder.id} className="card p-5">
                      <div className="flex justify-between gap-3">
                        <h3 className="font-medium">{reminder.title}</h3>
                        <span className="text-xs text-[var(--color-muted)]">
                          {reminder.enabled ? "On" : "Off"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm">{reminder.message}</p>
                      <p className="mt-2 text-xs text-[var(--color-muted)]">
                        {describeSchedule(reminder.time, reminder.days)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No reminders yet" />
              )}
            </section>
          </div>
        ) : null}
      </PageContainer>
    </>
  );
}
