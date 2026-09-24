"use client";

import { useHealthUser } from "./use-health-user";
import { useAsync } from "./use-async";
import { getDailyLog, listRecentLogs } from "@/services/daily-log-service";
import type { DailyLog } from "@/types/daily-log";
import type { DateKey } from "@/lib/utils/date";

export function useDailyLog(date: DateKey) {
  const { userId, isPartner } = useHealthUser();

  return useAsync<DailyLog | null>(
    userId ? () => getDailyLog(userId, date) : null,
    [userId, date],
    isPartner ? 15000 : 0,
  );
}

export function useRecentLogs(count = 90) {
  const { userId, isPartner } = useHealthUser();

  return useAsync<DailyLog[]>(
    userId ? () => listRecentLogs(userId, count) : null,
    [userId, count],
    isPartner ? 15000 : 0,
  );
}
