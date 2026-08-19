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
  return <AppTabs />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/*
        Mounted immediately, as a sibling of the gates below — NOT nested inside them. Its
        onLayout callback is what calls SplashScreen.hideAsync(). If it were nested inside
        MigrationGate/OnboardingGate/LockGate (as it originally was), a hang or a silent error
        in any of those would leave the native splash frozen forever with no visible error,
        instead of revealing whatever loading/error state those gates render underneath.
      */}
      <AnimatedSplashOverlay />
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
