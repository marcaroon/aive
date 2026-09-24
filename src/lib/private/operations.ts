import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { groupPeriodDays, computeCycleLengths } from "@/lib/cycle/calculations";
import { predictCycle } from "@/lib/cycle/prediction";
import { buildSharedSummary } from "@/lib/permissions/shared-summary";
import {
  dailyLogSchema,
  periodRangeSchema,
  profileSchema,
  reminderSchema,
  sanitizeText,
} from "@/lib/validation/schemas";
import { DEFAULT_PARTNER_PERMISSIONS } from "@/types/permission";
import { SUPPORT_REQUEST_TYPES } from "@/types/relationship";
import type { UserRole } from "@/types/user";
import type { DailyLog } from "@/types/daily-log";
import { eachDayOfInterval, format, parseISO } from "date-fns";

const id = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[^/]+$/);
const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = parseISO(value);
    return (
      !Number.isNaN(parsed.getTime()) && format(parsed, "yyyy-MM-dd") === value
    );
  });
const count = z.number().int().min(1).max(5000);
const permissionsSchema = z.object({
  shareCyclePhase: z.boolean(),
  sharePredictedPeriod: z.boolean(),
  shareMood: z.boolean(),
  sharePainLevel: z.boolean(),
  shareFlowStatus: z.boolean(),
  shareSymptoms: z.boolean(),
  shareSupportRequest: z.boolean(),
  shareDailyNotes: z.boolean(),
});
const preferencesSchema = z
  .object({
    enabled: z.boolean(),
    dailyLogReminder: z.boolean(),
    periodApproaching: z.boolean(),
    partnerActivity: z.boolean(),
    hideSensitiveContent: z.boolean(),
  })
  .partial();
const privacySchema = z
  .object({
    appLockEnabled: z.boolean(),
    privacyMode: z.boolean(),
    hideSensitiveNotifications: z.boolean(),
  })
  .partial();

export class PrivateAccessError extends Error {}
function ensure(condition: unknown): asserts condition {
  if (!condition) throw new PrivateAccessError("Access unavailable.");
}
function operation<T extends z.ZodTuple>(
  schema: T,
  handler: (...args: z.infer<T>) => Promise<unknown>,
) {
  return async (args: unknown) => handler(...schema.parse(args));
}
const stamp = () => FieldValue.serverTimestamp();
const dateStamp = (date: string) =>
  Timestamp.fromDate(parseISO(day.parse(date)));

/** Reuse existing account IDs, so switching modes never creates a second health history. */
export async function resolveUserId(role: UserRole): Promise<string> {
  const configured =
    role === "primary"
      ? process.env.AIVE_PRIMARY_USER_ID
      : process.env.AIVE_PARTNER_USER_ID;
  if (configured) return id.parse(configured);
  const users = await getAdminDb()
    .collection("users")
    .where("role", "==", role)
    .limit(2)
    .get();
  if (users.size > 1)
    throw new Error("Set the AIVE user IDs to select the intended profiles.");
  return (
    users.docs[0]?.id ?? (role === "primary" ? "aive-aivel" : "aive-ammar")
  );
}

export async function privateProfile(role: UserRole) {
  const userId = await resolveUserId(role);
  const ref = getAdminDb().doc(`users/${userId}`);
  await getAdminDb().runTransaction(async (transaction) => {
    const existing = await transaction.get(ref);
    if (!existing.exists)
      transaction.create(ref, {
        fullName: role === "primary" ? "Aivel" : "Ammar",
        preferredName: role === "primary" ? "Aivel" : "Ammar",
        email: "",
        role,
        timezone: "Asia/Jakarta",
        onboardingCompleted: true,
        createdAt: stamp(),
        updatedAt: stamp(),
      });
  });
  const snapshot = await ref.get();
  ensure(snapshot.data()?.role === role);
  return { ...snapshot.data(), id: userId, role };
}

export async function privateOperations(role: UserRole) {
  const db = getAdminDb();
  const ownId = await resolveUserId(role);
  const primaryId = role === "primary" ? ownId : await resolveUserId("primary");
  const partnerId = role === "partner" ? ownId : await resolveUserId("partner");
  const own = (userId: string) => ensure(userId === ownId);
  const primary = (userId: string) => {
    own(userId);
    ensure(role === "primary");
  };
  const read = async (path: string) => {
    const snapshot = await db.doc(path).get();
    return snapshot.exists ? { ...snapshot.data(), id: snapshot.id } : null;
  };
  const rows = async (
    path: string,
    field: string,
    direction: "asc" | "desc",
    max = 5000,
  ) => {
    const snapshot = await db
      .collection(path)
      .orderBy(field, direction)
      .limit(max)
      .get();
    return snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id }));
  };
  const relationship = async (relationshipId: string, active = true) => {
    const snapshot = await db.doc(`relationships/${relationshipId}`).get();
    const data = snapshot.data();
    ensure(
      data &&
        data.primaryUserId === primaryId &&
        data.partnerUserId === partnerId &&
        (!active || data.status === "active"),
    );
    return { ...data, id: snapshot.id };
  };
  const getPermissions = async (relationshipId: string) => {
    await relationship(relationshipId);
    const data = (
      await db.doc(`relationships/${relationshipId}/permissions/current`).get()
    ).data();
    return permissionsSchema.parse({ ...DEFAULT_PARTNER_PERMISSIONS, ...data });
  };
  const listPeriods = async () => {
    const snapshot = await db
      .collection(`users/${primaryId}/periodDays`)
      .orderBy("date", "asc")
      .get();
    return snapshot.docs.map((entry) => ({
      ...entry.data(),
      id: entry.id,
      date: entry.id,
    }));
  };
  const recompute = async () => {
    const spans = groupPeriodDays(
      (await listPeriods()).map((entry) => entry.date),
    );
    const lengths = computeCycleLengths(spans.map((span) => span.start));
    const old = await db.collection(`users/${primaryId}/cycles`).get();
    const writer = db.bulkWriter();
    const writes = old.docs.map((entry) => writer.delete(entry.ref));
    spans.forEach((span, index) => {
      writes.push(
        writer.set(db.doc(`users/${primaryId}/cycles/${span.start}`), {
          startDate: dateStamp(span.start),
          endDate: dateStamp(span.end),
          periodDuration: span.duration,
          ...(lengths[index] ? { cycleLength: lengths[index] } : {}),
          createdAt: stamp(),
          updatedAt: stamp(),
        }),
      );
    });
    await Promise.all([...writes, writer.close()]);
    const last = spans.at(-1);
    const ref = db.doc(`primaryProfiles/${primaryId}`);
    if (last) {
      const current = (await ref.get()).data();
      const average = (values: number[]) =>
        Math.round(
          values.reduce((sum, value) => sum + value, 0) / values.length,
        );
      await ref.set(
        {
          userId: primaryId,
          averageCycleLength: lengths.length
            ? average(lengths.slice(-6))
            : (current?.averageCycleLength ?? 28),
          averagePeriodDuration: average(
            spans.slice(-6).map((span) => span.duration),
          ),
          lastPeriodStartDate: dateStamp(last.start),
          updatedAt: stamp(),
          ...(current ? {} : { createdAt: stamp() }),
        },
        { merge: true },
      );
    }
    return spans;
  };
  const syncSummary = async (relationshipId: string) => {
    await relationship(relationshipId);
    const permissions = await getPermissions(relationshipId);
    const profile = (await db.doc(`primaryProfiles/${primaryId}`).get()).data();
    const timezone =
      (await db.doc(`users/${primaryId}`).get()).data()?.timezone ||
      "Asia/Jakarta";
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const part = (name: string) =>
      parts.find((entry) => entry.type === name)?.value;
    const today = `${part("year")}-${part("month")}-${part("day")}`;
    const periods = await listPeriods();
    const spans = groupPeriodDays(periods.map((entry) => entry.date));
    const prediction = predictCycle({
      today,
      lastPeriodStart: spans.at(-1)?.start ?? null,
      cycleLengths: computeCycleLengths(spans.map((span) => span.start)),
      periodDurations: spans.slice(0, -1).map((span) => span.duration),
      profileCycleLength: profile?.averageCycleLength ?? 28,
      profilePeriodDuration: profile?.averagePeriodDuration ?? 5,
    });
    const log = (
      await db.doc(`users/${primaryId}/dailyLogs/${today}`).get()
    ).data();
    const fields = buildSharedSummary(permissions, {
      prediction,
      todayLog: (log ?? null) as DailyLog | null,
      isOnPeriodToday: periods.some((entry) => entry.date === today),
    });
    await db
      .doc(`sharedSummaries/${relationshipId}`)
      .set({
        relationshipId,
        primaryUserId: primaryId,
        partnerUserId: partnerId,
        ...fields,
        updatedAt: stamp(),
      });
  };
  const refreshSummary = async () => {
    const links = await db
      .collection("relationships")
      .where("primaryUserId", "==", primaryId)
      .get();
    for (const link of links.docs) {
      if (
        link.data().partnerUserId === partnerId &&
        link.data().status === "active"
      )
        await syncSummary(link.id);
    }
  };
  const changePeriod = async (
    start: string,
    end: string | undefined,
    flow?: string,
  ) => {
    const dates = eachDayOfInterval({
      start: parseISO(start),
      end: parseISO(end || start),
    });
    ensure(dates.length <= 366);
    const batch = db.batch();
    for (const date of dates) {
      const key = format(date, "yyyy-MM-dd");
      const ref = db.doc(`users/${primaryId}/periodDays/${key}`);
      if (flow)
        batch.set(
          ref,
          {
            date: key,
            flowLevel: flow,
            createdAt: stamp(),
            updatedAt: stamp(),
          },
          { merge: true },
        );
      else batch.delete(ref);
    }
    await batch.commit();
    await recompute();
    await refreshSummary();
  };

  return {
    fetchUserDocument: operation(z.tuple([id]), async (uid) => {
      own(uid);
      return read(`users/${uid}`);
    }),
    updateUserDocument: operation(
      z.tuple([
        id,
        profileSchema.partial().extend({
          timezone: z
            .string()
            .max(100)
            .refine((value) => {
              try {
                new Intl.DateTimeFormat("en", { timeZone: value });
                return true;
              } catch {
                return false;
              }
            })
            .optional(),
          photoURL: z.string().url().optional(),
        }),
      ]),
      async (uid, data) => {
        own(uid);
        await db.doc(`users/${uid}`).update({ ...data, updatedAt: stamp() });
      },
    ),
    markOnboardingCompleted: operation(z.tuple([id]), async (uid) => {
      primary(uid);
      await db
        .doc(`users/${uid}`)
        .update({ onboardingCompleted: true, updatedAt: stamp() });
    }),
    getPrimaryProfile: operation(z.tuple([id]), async (uid) => {
      primary(uid);
      return read(`primaryProfiles/${uid}`);
    }),
    savePrimaryProfile: operation(
      z.tuple([
        id,
        z.object({
          averageCycleLength: z.number().int().min(15).max(60),
          averagePeriodDuration: z.number().int().min(1).max(14),
          lastPeriodStartDate: day.optional(),
          dateOfBirth: day.optional(),
        }),
      ]),
      async (uid, data) => {
        primary(uid);
        const ref = db.doc(`primaryProfiles/${uid}`);
        const old = await ref.get();
        await ref.set(
          {
            ...data,
            userId: uid,
            ...(data.lastPeriodStartDate
              ? { lastPeriodStartDate: dateStamp(data.lastPeriodStartDate) }
              : {}),
            ...(data.dateOfBirth
              ? { dateOfBirth: dateStamp(data.dateOfBirth) }
              : {}),
            updatedAt: stamp(),
            ...(old.exists ? {} : { createdAt: stamp() }),
          },
          { merge: true },
        );
      },
    ),
    listPeriodDays: operation(z.tuple([id]), async (uid) => {
      primary(uid);
      return listPeriods();
    }),
    setPeriodDay: operation(
      z.tuple([
        id,
        day,
        z.enum(["spotting", "light", "medium", "heavy"]),
        z.string().max(300).nullish(),
      ]),
      async (uid, date, flow, notes) => {
        primary(uid);
        await changePeriod(date, date, flow);
        if (notes)
          await db
            .doc(`users/${uid}/periodDays/${date}`)
            .update({ notes: sanitizeText(notes) });
      },
    ),
    removePeriodDay: operation(z.tuple([id, day]), async (uid, date) => {
      primary(uid);
      await changePeriod(date, date);
    }),
    savePeriodRange: operation(
      z.tuple([
        id,
        day,
        day.nullish(),
        z.enum(["spotting", "light", "medium", "heavy"]),
      ]),
      async (uid, start, end, flow) => {
        primary(uid);
        periodRangeSchema.parse({
          startDate: start,
          endDate: end || undefined,
          flowLevel: flow,
        });
        await changePeriod(start, end || undefined, flow);
      },
    ),
    removePeriodSpan: operation(
      z.tuple([id, day, day]),
      async (uid, start, end) => {
        primary(uid);
        ensure(end >= start);
        await changePeriod(start, end);
      },
    ),
    recomputeCycles: operation(z.tuple([id]), async (uid) => {
      primary(uid);
      return recompute();
    }),
    getDailyLog: operation(z.tuple([id, day]), async (uid, date) => {
      primary(uid);
      return read(`users/${uid}/dailyLogs/${date}`);
    }),
    saveDailyLog: operation(
      z.tuple([id, dailyLogSchema.extend({ date: day })]),
      async (uid, data) => {
        primary(uid);
        const ref = db.doc(`users/${uid}/dailyLogs/${data.date}`);
        const old = await ref.get();
        const clean = Object.fromEntries(
          Object.entries(data)
            .filter(([, value]) => value !== undefined && value !== "")
            .map(([key, value]) => [
              key,
              key === "privateNotes" || key === "sleepNotes"
                ? sanitizeText(String(value))
                : value,
            ]),
        );
        await ref.set({
          ...clean,
          createdAt: old.data()?.createdAt ?? stamp(),
          updatedAt: stamp(),
        });
        await refreshSummary();
      },
    ),
    listRecentLogs: operation(z.tuple([id, count]), async (uid, max) => {
      primary(uid);
      return rows(`users/${uid}/dailyLogs`, "date", "desc", max);
    }),
    listLogsBetween: operation(
      z.tuple([id, day, day]),
      async (uid, start, end) => {
        primary(uid);
        const snapshot = await db
          .collection(`users/${uid}/dailyLogs`)
          .where("date", ">=", start)
          .where("date", "<=", end)
          .orderBy("date", "asc")
          .get();
        return snapshot.docs.map((entry) => entry.data());
      },
    ),
    getRelationshipForUser: operation(
      z.tuple([id, z.enum(["primary", "partner"])]),
      async (uid, requestedRole) => {
        own(uid);
        ensure(requestedRole === role);
        const all = await db
          .collection("relationships")
          .where("primaryUserId", "==", primaryId)
          .get();
        const pair = all.docs.find(
          (entry) =>
            entry.data().partnerUserId === partnerId &&
            entry.data().status === "active",
        );
        if (pair) return { ...pair.data(), id: pair.id };
        // Once disconnected, only an explicit new invitation can reconnect the pair.
        if (!all.empty) return null;
        const ref = db.doc("relationships/aive-private-pair");
        await db.runTransaction(async (transaction) => {
          const existing = await transaction.get(ref);
          if (!existing.exists)
            transaction.create(ref, {
              primaryUserId: primaryId,
              partnerUserId: partnerId,
              status: "active",
              pairedAt: stamp(),
              createdAt: stamp(),
              updatedAt: stamp(),
            });
        });
        await relationship(ref.id);
        return read(ref.path);
      },
    ),
    getPermissions: operation(z.tuple([id]), getPermissions),
    savePermissions: operation(
      z.tuple([id, permissionsSchema]),
      async (rid, data) => {
        primary(primaryId);
        await relationship(rid);
        await db
          .doc(`relationships/${rid}/permissions/current`)
          .set({ relationshipId: rid, ...data, updatedAt: stamp() });
        await syncSummary(rid);
      },
    ),
    getSharedSummary: operation(z.tuple([id]), async (rid) => {
      await relationship(rid);
      await syncSummary(rid);
      return read(`sharedSummaries/${rid}`);
    }),
    syncSharedSummary: operation(
      z.tuple([z.object({ id }), permissionsSchema.nullish()]),
      async (link) => {
        primary(primaryId);
        await syncSummary(link.id);
      },
    ),
    clearSharedSummary: operation(z.tuple([id]), async (rid) => {
      primary(primaryId);
      await relationship(rid, false);
      await db.doc(`sharedSummaries/${rid}`).delete();
    }),
    revokePartnerAccess: operation(z.tuple([id, id]), async (rid, uid) => {
      primary(uid);
      await relationship(rid);
      const batch = db.batch();
      batch.delete(db.doc(`sharedSummaries/${rid}`));
      batch.update(db.doc(`relationships/${rid}`), {
        status: "revoked",
        revokedAt: stamp(),
        updatedAt: stamp(),
      });
      await batch.commit();
    }),
    listActiveInvitations: operation(z.tuple([id]), async (uid) => {
      primary(uid);
      const snapshot = await db
        .collection("partnerInvitations")
        .where("primaryUserId", "==", uid)
        .get();
      return snapshot.docs
        .filter(
          (entry) =>
            entry.data().status === "active" &&
            entry.data().expiresAt.toMillis() > Date.now(),
        )
        .map((entry) => ({ ...entry.data(), id: entry.id }));
    }),
    createPairingCode: operation(z.tuple([id]), async (uid) => {
      primary(uid);
      const code = Array.from(
        crypto.getRandomValues(new Uint8Array(6)),
        (n) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[n % 31],
      ).join("");
      const ref = db.doc(`partnerInvitations/${code}`);
      await ref.create({
        primaryUserId: uid,
        code,
        status: "active",
        expiresAt: Timestamp.fromMillis(Date.now() + 86400000),
        createdAt: stamp(),
      });
      return read(ref.path);
    }),
    cancelInvitation: operation(z.tuple([id]), async (code) => {
      primary(primaryId);
      const ref = db.doc(`partnerInvitations/${code}`);
      ensure((await ref.get()).data()?.primaryUserId === primaryId);
      await ref.update({ status: "revoked" });
    }),
    redeemPairingCode: operation(
      z.tuple([z.string().regex(/^[A-Z2-9]{6}$/), id]),
      async (code, uid) => {
        own(uid);
        ensure(role === "partner");
        const invitation = db.doc(`partnerInvitations/${code}`);
        const ref = db.collection("relationships").doc();
        await db.runTransaction(async (transaction) => {
          const snapshot = await transaction.get(invitation);
          const data = snapshot.data();
          const existing = await transaction.get(
            db
              .collection("relationships")
              .where("primaryUserId", "==", primaryId),
          );
          ensure(
            !existing.docs.some((entry) => entry.data().status === "active"),
          );
          ensure(
            data &&
              data.primaryUserId === primaryId &&
              data.status === "active" &&
              data.expiresAt.toMillis() > Date.now(),
          );
          transaction.create(ref, {
            primaryUserId: primaryId,
            partnerUserId: partnerId,
            status: "active",
            inviteCode: code,
            pairedAt: stamp(),
            createdAt: stamp(),
            updatedAt: stamp(),
          });
          transaction.update(invitation, {
            status: "used",
            usedAt: stamp(),
            usedBy: uid,
          });
        });
        return read(ref.path);
      },
    ),
    initialisePairedRelationship: operation(
      z.tuple([id, id]),
      async (rid, uid) => {
        primary(uid);
        await relationship(rid);
        await db
          .doc(`relationships/${rid}/permissions/current`)
          .set({
            relationshipId: rid,
            ...DEFAULT_PARTNER_PERMISSIONS,
            updatedAt: stamp(),
          });
      },
    ),
    listLoveNotes: operation(
      z.tuple([id, id, count]),
      async (rid, uid, max) => {
        own(uid);
        await relationship(rid);
        const snapshot = await db
          .collection(`relationships/${rid}/loveNotes`)
          .orderBy("createdAt", "desc")
          .limit(max)
          .get();
        return snapshot.docs
          .filter((entry) => !entry.data().hiddenForUserIds?.includes(uid))
          .map((entry) => ({ ...entry.data(), id: entry.id }));
      },
    ),
    sendLoveNote: operation(
      z.tuple([
        id,
        id,
        z.string().min(1).max(280),
        z.string().max(4).nullish(),
      ]),
      async (rid, uid, message, emoji) => {
        own(uid);
        await relationship(rid);
        await db
          .collection(`relationships/${rid}/loveNotes`)
          .add({
            authorId: uid,
            message: sanitizeText(message),
            ...(emoji ? { emoji } : {}),
            createdAt: stamp(),
          });
      },
    ),
    markNoteRead: operation(z.tuple([id, id]), async (rid, noteId) => {
      await relationship(rid);
      const ref = db.doc(`relationships/${rid}/loveNotes/${noteId}`);
      const note = await ref.get();
      ensure(note.exists && note.data()?.authorId !== ownId);
      if (!note.data()?.readAt) await ref.update({ readAt: stamp() });
    }),
    reactToNote: operation(
      z.tuple([id, id, z.enum(["🌻", "💛", "🤗", "😊", "🥺"])]),
      async (rid, noteId, reaction) => {
        await relationship(rid);
        const ref = db.doc(`relationships/${rid}/loveNotes/${noteId}`);
        ensure((await ref.get()).data()?.authorId !== ownId);
        await ref.update({ reaction });
      },
    ),
    hideNoteForUser: operation(
      z.tuple([id, id, id]),
      async (rid, noteId, uid) => {
        own(uid);
        await relationship(rid);
        await db
          .doc(`relationships/${rid}/loveNotes/${noteId}`)
          .update({ hiddenForUserIds: FieldValue.arrayUnion(uid) });
      },
    ),
    listSupportRequests: operation(z.tuple([id, count]), async (rid, max) => {
      const permissions = await getPermissions(rid);
      if (!permissions.shareSupportRequest && role === "partner") return [];
      return rows(
        `relationships/${rid}/supportRequests`,
        "createdAt",
        "desc",
        max,
      );
    }),
    sendSupportRequest: operation(
      z.tuple([
        id,
        z.enum([...SUPPORT_REQUEST_TYPES, "Custom message"]),
        z.string().max(200).nullish(),
      ]),
      async (rid, type, message) => {
        primary(primaryId);
        ensure((await getPermissions(rid)).shareSupportRequest);
        ensure(type !== "Custom message" || message?.trim());
        await db
          .collection(`relationships/${rid}/supportRequests`)
          .add({
            type,
            ...(message ? { message: sanitizeText(message) } : {}),
            status: "sent",
            createdAt: stamp(),
          });
      },
    ),
    updateRequestStatus: operation(
      z.tuple([
        id,
        id,
        z.enum(["sent", "seen", "acknowledged", "resolved"]),
        z.enum(["I'm here for you", "On my way"]).nullish(),
      ]),
      async (rid, requestId, status, response) => {
        ensure((await getPermissions(rid)).shareSupportRequest);
        ensure(role === "partner" || status === "resolved");
        const field = {
          sent: null,
          seen: "seenAt",
          acknowledged: "acknowledgedAt",
          resolved: "resolvedAt",
        }[status];
        await db
          .doc(`relationships/${rid}/supportRequests/${requestId}`)
          .update({
            status,
            ...(field ? { [field]: stamp() } : {}),
            ...(response ? { response } : {}),
          });
      },
    ),
    listReminders: operation(z.tuple([id]), async (uid) => {
      own(uid);
      return rows(`users/${uid}/reminders`, "time", "asc");
    }),
    createReminder: operation(
      z.tuple([id, reminderSchema]),
      async (uid, data) => {
        own(uid);
        await db
          .collection(`users/${uid}/reminders`)
          .add({ ...data, createdAt: stamp(), updatedAt: stamp() });
      },
    ),
    updateReminder: operation(
      z.tuple([id, id, reminderSchema.partial()]),
      async (uid, reminderId, data) => {
        own(uid);
        await db
          .doc(`users/${uid}/reminders/${reminderId}`)
          .update({ ...data, updatedAt: stamp() });
      },
    ),
    deleteReminder: operation(z.tuple([id, id]), async (uid, reminderId) => {
      own(uid);
      await db.doc(`users/${uid}/reminders/${reminderId}`).delete();
    }),
    savePreferences: operation(
      z.tuple([id, preferencesSchema]),
      async (uid, data) => {
        own(uid);
        await db
          .doc(`users/${uid}`)
          .set(
            { notificationPreferences: data, updatedAt: stamp() },
            { merge: true },
          );
      },
    ),
    savePrivacySettings: operation(
      z.tuple([id, privacySchema]),
      async (uid, data) => {
        own(uid);
        await db
          .doc(`users/${uid}`)
          .set({ privacySettings: data, updatedAt: stamp() }, { merge: true });
      },
    ),
    deleteHealthData: operation(z.tuple([id]), async (uid) => {
      primary(uid);
      const links = await db
        .collection("relationships")
        .where("primaryUserId", "==", uid)
        .get();
      for (const link of links.docs)
        await db.doc(`sharedSummaries/${link.id}`).delete();
      for (const collection of [
        "dailyLogs",
        "periodDays",
        "cycles",
        "reminders",
      ])
        await db.recursiveDelete(db.collection(`users/${uid}/${collection}`));
      await db.doc(`primaryProfiles/${uid}`).delete();
    }),
  };
}
