import Constants from 'expo-constants';
import { Directory, File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import { DB_VERSION, sqliteConnection } from '@/database/client';
import { backupMetadataRepository, backupsRepository } from '@/database/repositories';

const BACKUPS_DIR = new Directory(Paths.document, 'backups');
const MAX_BACKUPS = 5;

function ensureBackupsDir(): void {
  if (!BACKUPS_DIR.exists) {
    BACKUPS_DIR.create({ intermediates: true, idempotent: true });
  }
}

/**
 * Snapshot the live database via SQLite's own online-backup API (safe against an in-progress
 * WAL write, unlike a raw file copy), checksum it, record it, then apply the rotation policy.
 */
export async function createBackup() {
  ensureBackupsDir();
  const timestamp = Date.now();
  const fileName = `lifeos-backup-${timestamp}.db`;

  const destDatabase = SQLite.openDatabaseSync(fileName, undefined, BACKUPS_DIR.uri);
  await SQLite.backupDatabaseAsync({ sourceDatabase: sqliteConnection, destDatabase });
  await destDatabase.closeAsync();

  const file = new File(BACKUPS_DIR, fileName);
  const checksum = file.md5 ?? '';

  const backup = await backupsRepository.insert({
    filePath: file.uri,
    sizeBytes: file.size,
    checksum,
    createdAt: new Date(timestamp),
  });

  await backupMetadataRepository.insert({
    backupId: backup.id,
    appVersion: Constants.expoConfig?.version ?? 'unknown',
    dbVersion: DB_VERSION,
    createdAt: new Date(),
  });

  await rotateBackups();
  return backup;
}

export async function listBackups() {
  const all = await backupsRepository.findAll();
  return [...all].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

async function rotateBackups(): Promise<void> {
  const [allBackups, allMetadata] = await Promise.all([
    backupsRepository.findAll(),
    backupMetadataRepository.findAll(),
  ]);
  const stale = [...allBackups]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(MAX_BACKUPS);

  for (const backup of stale) {
    const file = new File(backup.filePath);
    if (file.exists) file.delete();

    for (const meta of allMetadata.filter((m) => m.backupId === backup.id)) {
      await backupMetadataRepository.remove(meta.id);
    }
    await backupsRepository.remove(backup.id);
  }
}
