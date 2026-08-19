import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { MigrationGate } from '@/database/migration-gate';
import { OnboardingGate } from '@/onboarding/onboarding-gate';
import { LockGate } from '@/security/lock-gate';
import { useAutoLock } from '@/security/use-auto-lock';

SplashScreen.preventAutoHideAsync();

// Mounted only once MigrationGate/OnboardingGate/LockGate all clear — useAutoLock reads the
// lock timeout from `settings`, which needs the migrations to have run first.
function AppShell() {
  useAutoLock();
  return (
    <>
      <AnimatedSplashOverlay />
      <AppTabs />
    </>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <MigrationGate>
        <OnboardingGate>
          <LockGate>
            <AppShell />
          </LockGate>
        </OnboardingGate>
      </MigrationGate>
    </ThemeProvider>
  );
}
