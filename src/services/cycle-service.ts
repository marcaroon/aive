import { AUTH_ENABLED } from "@/lib/config";
import { privateCall } from "@/lib/private/client";
import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { eachDayOfInterval } from "date-fns";
import { getDb } from "@/lib/firebase/client";
import {
  cyclesCollection,
  paths,
  periodDaysCollection,
  primaryProfileDoc,
} from "@/lib/firebase/collections";
import {
  computeCycleLengths,
  groupPeriodDays,
  type PeriodSpan,
} from "@/lib/cycle/calculations";
import {
  DEFAULT_CYCLE_LENGTH,
  DEFAULT_PERIOD_DURATION,
  predictCycle,
} from "@/lib/cycle/prediction";
import { dateKeyToTimestamp, fromDateKey, toDateKey, type DateKey } from "@/lib/utils/date";
import type { CyclePrediction, PeriodDay, PeriodFlowLevel } from "@/types/cycle";
import type { PrimaryProfile } from "@/types/user";

/**
 * Period days are the single source of truth. Cycles are derived from them and
 * mirrored into users/{uid}/cycles so history is queryable without recomputing.
 */
export async function listPeriodDays(userId: string): Promise<PeriodDay[]> {
  if (!AUTH_ENABLED) return privateCall("listPeriodDays", [userId]);
  const snapshot = await getDocs(query(periodDaysCollection(userId), orderBy("date", "asc")));
  return snapshot.docs.map((entry) => entry.data());
}

export async function getPrimaryProfile(userId: string): Promise<PrimaryProfile | null> {
  if (!AUTH_ENABLED) return privateCall("getPrimaryProfile", [userId]);
  const snapshot = await getDoc(primaryProfileDoc(userId));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function savePrimaryProfile(
  userId: string,
  data: {
    averageCycleLength: number;
    averagePeriodDuration: number;
    lastPeriodStartDate?: DateKey;
    dateOfBirth?: DateKey;
  },
): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("savePrimaryProfile", [userId, data]);
  const payload: DocumentData = {
    userId,
    averageCycleLength: data.averageCycleLength,
    averagePeriodDuration: data.averagePeriodDuration,
    updatedAt: serverTimestamp(),
  };
  if (data.lastPeriodStartDate) {
    payload.lastPeriodStartDate = dateKeyToTimestamp(data.lastPeriodStartDate);
  }
  if (data.dateOfBirth) {
    payload.dateOfBirth = dateKeyToTimestamp(data.dateOfBirth);
  }

  const existing = await getDoc(primaryProfileDoc(userId));
  if (!existing.exists()) {
    payload.createdAt = serverTimestamp();
  }

  await setDoc(doc(getDb(), paths.primaryProfiles, userId), payload, { merge: true });
}

export async function setPeriodDay(
  userId: string,
  date: DateKey,
  flowLevel: PeriodFlowLevel,
  notes?: string,
): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("setPeriodDay", [userId, date, flowLevel, notes]);
  const reference = doc(getDb(), paths.periodDays(userId), date);
  const existing = await getDoc(reference);

  await setDoc(
    reference,
    {
      date,
      flowLevel,
      ...(notes ? { notes } : {}),
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await recomputeCycles(userId);
}

export async function removePeriodDay(userId: string, date: DateKey): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("removePeriodDay", [userId, date]);
  await deleteDoc(doc(getDb(), paths.periodDays(userId), date));
  await recomputeCycles(userId);
}

/** Records every day between start and end (inclusive) as a period day. */
export async function savePeriodRange(
  userId: string,
  startDate: DateKey,
  endDate: DateKey | undefined,
  flowLevel: PeriodFlowLevel,
): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("savePeriodRange", [userId, startDate, endDate, flowLevel]);
  const days = eachDayOfInterval({
    start: fromDateKey(startDate),
    end: fromDateKey(endDate || startDate),
  }).map(toDateKey);

  const batch = writeBatch(getDb());
  for (const date of days) {
    batch.set(
      doc(getDb(), paths.periodDays(userId), date),
      { date, flowLevel, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
      { merge: true },
    );
  }
  await batch.commit();

  await recomputeCycles(userId);
}

/** Deletes every period day in a recorded span — used by "remove this period". */
export async function removePeriodSpan(
  userId: string,
  startDate: DateKey,
  endDate: DateKey,
): Promise<void> {
  if (!AUTH_ENABLED) return privateCall("removePeriodSpan", [userId, startDate, endDate]);
  const days = eachDayOfInterval({
    start: fromDateKey(startDate),
    end: fromDateKey(endDate),
  }).map(toDateKey);

  const batch = writeBatch(getDb());
  for (const date of days) {
    batch.delete(doc(getDb(), paths.periodDays(userId), date));
  }
  await batch.commit();

  await recomputeCycles(userId);
}

/**
 * Rewrites the derived cycles collection and refreshes the averages on the
 * profile, so predictions stay in step with whatever was just edited.
 */
export async function recomputeCycles(userId: string): Promise<PeriodSpan[]> {
  if (!AUTH_ENABLED) return privateCall("recomputeCycles", [userId]);
  const periodDays = await listPeriodDays(userId);
  const spans = groupPeriodDays(periodDays.map((day) => day.date));

  const existing = await getDocs(cyclesCollection(userId));
  const batch = writeBatch(getDb());

  for (const entry of existing.docs) {
    batch.delete(entry.ref);
  }

  const starts = spans.map((span) => span.start);
  const lengths = computeCycleLengths(starts);

  spans.forEach((span, index) => {
    const nextStart = spans[index + 1]?.start;
    const cycleLength = nextStart ? lengths[index] : undefined;
    batch.set(doc(getDb(), paths.cycles(userId), span.start), {
      startDate: dateKeyToTimestamp(span.start),
      endDate: dateKeyToTimestamp(span.end),
      ...(cycleLength ? { cycleLength } : {}),
      periodDuration: span.duration,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();

  const lastSpan = spans.at(-1);
  if (lastSpan) {
    const profile = await getPrimaryProfile(userId);
    await savePrimaryProfile(userId, {
      averageCycleLength:
        lengths.length > 0
          ? Math.round(lengths.slice(-6).reduce((a, b) => a + b, 0) / lengths.slice(-6).length)
          : (profile?.averageCycleLength ?? DEFAULT_CYCLE_LENGTH),
      averagePeriodDuration:
        spans.length > 0
          ? Math.round(
              spans.slice(-6).reduce((sum, span) => sum + span.duration, 0) /
                spans.slice(-6).length,
            )
          : (profile?.averagePeriodDuration ?? DEFAULT_PERIOD_DURATION),
      lastPeriodStartDate: lastSpan.start,
    });
  }

  return spans;
}

export interface CycleHistory {
  periodDays: PeriodDay[];
  spans: PeriodSpan[];
  cycleLengths: number[];
  prediction: CyclePrediction | null;
}

export async function loadCycleHistory(
  userId: string,
  profile: PrimaryProfile | null,
): Promise<CycleHistory> {
  const periodDays = await listPeriodDays(userId);
  const spans = groupPeriodDays(periodDays.map((day) => day.date));
  const cycleLengths = computeCycleLengths(spans.map((span) => span.start));

  const prediction = predictCycle({
    lastPeriodStart: spans.at(-1)?.start ?? null,
    cycleLengths,
    // The final span is still in progress, so it never counts toward the average.
    periodDurations: spans.slice(0, -1).map((span) => span.duration),
    profileCycleLength: profile?.averageCycleLength ?? DEFAULT_CYCLE_LENGTH,
    profilePeriodDuration: profile?.averagePeriodDuration ?? DEFAULT_PERIOD_DURATION,
  });

  return { periodDays, spans, cycleLengths, prediction };
}
