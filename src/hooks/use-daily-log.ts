"use client";

import { useAuthContext } from "@/contexts/auth-context";
import { useAsync } from "./use-async";
import { getDailyLog, listRecentLogs } from "@/services/daily-log-service";
import type { DailyLog } from "@/types/daily-log";
import type { DateKey } from "@/lib/utils/date";

export function useDailyLog(date: DateKey) {
  const { user } = useAuthContext();
  const userId = user?.uid ?? null;

  return useAsync<DailyLog | null>(
    userId ? () => getDailyLog(userId, date) : null,
    [userId, date],
  );
}

export function useRecentLogs(count = 90) {
  const { user } = useAuthContext();
  const userId = user?.uid ?? null;

  return useAsync<DailyLog[]>(
    userId ? () => listRecentLogs(userId, count) : null,
    [userId, count],
  );
}
