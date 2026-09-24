"use client";

import { useAuthContext } from "@/contexts/auth-context";
import { useAsync } from "./use-async";
import { getPrimaryProfile, loadCycleHistory, type CycleHistory } from "@/services/cycle-service";
import type { PrimaryProfile } from "@/types/user";

export interface CycleData extends CycleHistory {
  profile: PrimaryProfile | null;
}

/** Loads the profile and everything derived from the recorded period days. */
export function useCycle() {
  const { user } = useAuthContext();
  const userId = user?.uid ?? null;

  return useAsync<CycleData>(
    userId
      ? async () => {
          const profile = await getPrimaryProfile(userId);
          const history = await loadCycleHistory(userId, profile);
          return { profile, ...history };
        }
      : null,
    [userId],
  );
}
