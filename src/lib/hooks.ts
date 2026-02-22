"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Generic API Fetcher Hook ─────────────────────────────────────────────────

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(url: string | null, options?: RequestInit) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!url) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setState({ data, loading: false, error: null });
    } catch (e) {
      setState({
        data: null,
        loading: false,
        error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด",
      });
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

// ─── API Mutation Helper ──────────────────────────────────────────────────────

interface MutateOptions {
  method?: string;
  body?: unknown;
  onSuccess?: (data: unknown) => void;
  onError?: (error: string) => void;
}

export function useApiMutation(baseUrl: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (options: MutateOptions = {}) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(baseUrl, {
          method: options.method || "POST",
          headers: { "Content-Type": "application/json" },
          body: options.body ? JSON.stringify(options.body) : undefined,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        options.onSuccess?.(data);
        return data;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "เกิดข้อผิดพลาด";
        setError(msg);
        options.onError?.(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  return { mutate, loading, error };
}
