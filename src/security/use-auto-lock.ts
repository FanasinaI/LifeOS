import { useEffect } from 'react';

import { useAppStore } from '@/store';

import { getLockTimeoutMs, watchAutoLock } from './lock.service';

/** Mount once near the app root (after the PIN is set up) to enable the background-timeout lock. */
export function useAutoLock(): void {
  const lock = useAppStore((s) => s.lock);

  useEffect(() => {
    let unwatch: (() => void) | undefined;
    let cancelled = false;

    getLockTimeoutMs().then((timeoutMs) => {
      if (cancelled) return;
      unwatch = watchAutoLock(lock, timeoutMs);
    });

    return () => {
      cancelled = true;
      unwatch?.();
    };
  }, [lock]);
}
