// Manual Jest mock for expo-sqlite (auto-applied for any node_modules import — Jest convention).
//
// Unit tests for pure logic (intelligence/analytics, intelligence/rules, intelligence/simulations)
// import service/repository modules that transitively import `src/database/client.ts`, which
// opens a real SQLite connection as a side effect of module load. That native call has no
// equivalent outside a device/simulator, so it crashes under plain Jest. None of the currently
// unit-tested pure functions actually execute a query — this stub only needs to stop the import
// chain from throwing, not behave like a real database. Tests that exercise real reads/writes
// belong in an on-device/E2E suite (see CLAUDE.md), not here.

function notImplemented(name: string) {
  return () => {
    throw new Error(`expo-sqlite mock: "${name}" was actually called — this test needs a real device, not a plain Jest mock.`);
  };
}

class FakeSQLiteDatabase {
  databasePath = ':memory:';
  execAsync = notImplemented('execAsync');
  runAsync = notImplemented('runAsync');
  getAllAsync = notImplemented('getAllAsync');
  getFirstAsync = notImplemented('getFirstAsync');
  prepareAsync = notImplemented('prepareAsync');
  closeAsync = async () => {};
  isInTransactionAsync = async () => false;
}

export function openDatabaseSync() {
  return new FakeSQLiteDatabase();
}

export async function openDatabaseAsync() {
  return new FakeSQLiteDatabase();
}

export async function deleteDatabaseAsync() {}
export function deleteDatabaseSync() {}
export async function backupDatabaseAsync() {}
export function backupDatabaseSync() {}

export const defaultDatabaseDirectory = 'file:///mock-sqlite/';

export default {
  openDatabaseSync,
  openDatabaseAsync,
  deleteDatabaseAsync,
  deleteDatabaseSync,
  backupDatabaseAsync,
  backupDatabaseSync,
  defaultDatabaseDirectory,
};
