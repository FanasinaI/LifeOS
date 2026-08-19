import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { BootLoadingView } from '@/components/boot-loading-view';
import { isOnboardingComplete } from '@/modules/onboarding';

import { OnboardingFlow } from './onboarding-flow';

/** Montré une seule fois au premier lancement (§28) ; `settings.onboarding.completed` en garde la trace. */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'needed' | 'done'>('checking');

  useEffect(() => {
    let cancelled = false;
    isOnboardingComplete().then((complete) => {
      if (!cancelled) setStatus(complete ? 'done' : 'needed');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'checking') return <BootLoadingView />;
  if (status === 'needed') return <OnboardingFlow onDone={() => setStatus('done')} />;
  return <>{children}</>;
}
