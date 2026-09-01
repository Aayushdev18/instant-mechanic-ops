"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLive } from "@/components/live-provider";

export function useApiQuery<T>(path: string, initial?: T) {
  const { version } = useLive();
  const [data, setData] = useState<T | null>(initial ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initial);

  const reload = useCallback(() => {
    api<T>(path)
      .then((payload) => {
        setData(payload);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [path]);

  useEffect(() => {
    let cancelled = false;
    api<T>(path)
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        setError(null);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path, version]);

  return { data, error, loading, reload };
}
