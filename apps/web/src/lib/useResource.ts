// src/lib/useResource.ts
// Small data-loading hook so every screen shares the same loading/error and
// retry behaviour instead of re-implementing useEffect plumbing.
import { useCallback, useEffect, useState } from 'react';
import { ApiError, errorMessage } from './api';
import { apiRequest } from './api';

// Network/connection errors (no backend reachable) — swallowed silently so
// the UI shows clean empty states instead of error banners in demo/static mode.
function isNetworkError(err: unknown): boolean {
  if (err instanceof ApiError) return false; // real HTTP error — show it
  if (err instanceof TypeError) return true;  // fetch failed (no server)
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes('failed to fetch') ||
      msg.includes('network') ||
      msg.includes('load failed') ||
      msg.includes('networkerror')
    );
  }
  return false;
}

export interface Resource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  setData: (value: T | null) => void;
}

export function useResource<T>(path: string | null): Resource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (path === null) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    apiRequest<T>(path)
      .then((value) => {
        if (!cancelled) setData(value);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isNetworkError(err)) {
          // No backend reachable — show empty state silently (demo/static mode)
          setData(null);
        } else {
          setError(errorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { data, loading, error, reload, setData };
}
