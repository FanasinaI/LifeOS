import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BootLoadingView } from '@/components/boot-loading-view';
import { PrimaryButton, TextField } from '@/components/money/form-kit';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAppStore } from '@/store';

import { authenticateWithBiometrics, isBiometricAvailable } from './biometric';
import { hasPinSet, isBiometricEnabled, verifyPin } from './secure-store';

/**
 * Verrouillage (§26). Au démarrage : si un PIN est configuré, l'app démarre verrouillée (pas
 * seulement après une mise en arrière-plan, voir useAutoLock). Sans PIN configuré, la sécurité
 * reste facultative (onboarding) et l'app démarre déverrouillée.
 */
export function LockGate({ children }: { children: ReactNode }) {
  const isLocked = useAppStore((s) => s.isLocked);
  const lock = useAppStore((s) => s.lock);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    hasPinSet().then((has) => {
      if (cancelled) return;
      if (has) lock();
      setChecked(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) return <BootLoadingView />;
  if (!isLocked) return <>{children}</>;
  return <PinEntryScreen />;
}

function PinEntryScreen() {
  const unlock = useAppStore((s) => s.unlock);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    Promise.all([isBiometricAvailable(), isBiometricEnabled()]).then(([available, enabled]) =>
      setBiometricAvailable(available && enabled)
    );
  }, []);

  async function handleSubmit() {
    setError(null);
    setChecking(true);
    try {
      const ok = await verifyPin(pin);
      if (ok) {
        unlock();
      } else {
        setError('Code incorrect.');
        setPin('');
      }
    } finally {
      setChecking(false);
    }
  }

  async function handleBiometric() {
    const ok = await authenticateWithBiometrics();
    if (ok) unlock();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">LifeOS verrouillé</ThemedText>
        <TextField
          value={pin}
          onChangeText={setPin}
          placeholder="Code PIN"
          keyboardType="number-pad"
          secureTextEntry
          onSubmitEditing={handleSubmit}
        />
        {error ? <ThemedText themeColor="danger">{error}</ThemedText> : null}
        <PrimaryButton label={checking ? 'Vérification…' : 'Déverrouiller'} onPress={handleSubmit} disabled={checking} />
        {biometricAvailable ? <PrimaryButton label="Utiliser la biométrie" onPress={handleBiometric} /> : null}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
});
