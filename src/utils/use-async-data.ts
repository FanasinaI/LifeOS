import { useCallback, useEffect, useState } from 'react';

export interface AsyncDataState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

/** Minimal load/error/reload wrapper around a repository/service call — no data library needed yet. */
export function useAsyncData<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncDataState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loader()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken]);

  return { data, loading, error, reload };
}
