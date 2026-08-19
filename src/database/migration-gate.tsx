import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import migrations from '../../drizzle/migrations';
import { db, ensureSearchIndex } from './client';

/**
 * Runs the drizzle-kit migrations + FTS5 search index bootstrap before rendering the app.
 * SQLite is the source of truth for LifeOS, so nothing should mount until it's ready.
 */
export function MigrationGate({ children }: { children: ReactNode }) {
  const { success, error } = useMigrations(db, migrations);
  const [indexReady, setIndexReady] = useState(false);
  const [indexError, setIndexError] = useState<Error | null>(null);

  useEffect(() => {
    if (!success) return;
    ensureSearchIndex()
      .then(() => setIndexReady(true))
      .catch((e: unknown) => setIndexError(e instanceof Error ? e : new Error(String(e))));
  }, [success]);

  const failure = error ?? indexError;

  if (failure) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Erreur d&apos;initialisation de la base de données</Text>
        <Text>{failure.message}</Text>
      </View>
    );
  }

  if (!success || !indexReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
