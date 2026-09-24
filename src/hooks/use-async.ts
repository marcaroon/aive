"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STATES } from "@/lib/copy";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setData: (value: T | null) => void;
}

/**
 * Small loader for one-shot Firestore reads. Keeps the loading / empty / error
 * triad consistent across screens without pulling in a data-fetching library.
 */
export function useAsync<T>(
  loader: (() => Promise<T>) | null,
  deps: React.DependencyList,
  pollInterval = 0,
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(loader));
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (background = false) => {
    if (!loader) {
      setLoading(false);
      return;
    }
    if (!background) setLoading(true);
    setError(null);
    try {
      const result = await loader();
      if (mounted.current)
        setData((previous) =>
          JSON.stringify(previous) === JSON.stringify(result)
            ? previous
            : result,
        );
    } catch {
      // Pesannya sengaja umum: teks error tidak boleh memantulkan data kesehatan.
      if (mounted.current) setError(STATES.genericLoadError);
    } finally {
      if (mounted.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void run();
  }, [run]);

  useEffect(() => {
    if (!pollInterval) return;
    const refresh = () => {
      if (document.visibilityState === "visible") void run(true);
    };
    const timer = window.setInterval(refresh, pollInterval);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [run, pollInterval]);

  return { data, loading, error, refresh: run, setData };
}
