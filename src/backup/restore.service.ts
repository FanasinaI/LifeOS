import { File } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import { DB_NAME } from '@/database/client';
import { backupsRepository } from '@/database/repositories';

export class BackupIntegrityError extends Error {
  constructor() {
    super('Le fichier de backup est corrompu ou introuvable (checksum invalide).');
    this.name = 'BackupIntegrityError';
  }
}

/**
 * Restauration contrôlée (§24) : vérifie le checksum du backup, puis remplace le fichier de la
 * base live par son contenu via l'API de backup SQLite (source = backup, dest = nouvelle base).
 *
 * La connexion `db`/`sqliteConnection` exportée par `src/database/client.ts` est ouverte une
 * seule fois au démarrage de l'app — elle continue de pointer vers l'ancien fichier après cet
 * appel. Un redémarrage de l'app est nécessaire pour qu'elle rouvre la base restaurée ; c'est
 * volontaire (jamais de modification silencieuse d'une base en cours d'utilisation).
 */
export async function restoreBackup(backupId: number): Promise<{ requiresRestart: true }> {
  const backup = await backupsRepository.findById(backupId);
  if (!backup) throw new Error('Backup introuvable.');

  const backupFile = new File(backup.filePath);
  if (!backupFile.exists || backupFile.md5 !== backup.checksum) {
    throw new BackupIntegrityError();
  }

  const sourceDatabase = SQLite.openDatabaseSync(
    backupFile.name,
    undefined,
    backupFile.parentDirectory.uri
  );

  await SQLite.deleteDatabaseAsync(DB_NAME).catch(() => {});
  const destDatabase = SQLite.openDatabaseSync(DB_NAME);
  await SQLite.backupDatabaseAsync({ sourceDatabase, destDatabase });

  await sourceDatabase.closeAsync();
  await destDatabase.closeAsync();

  return { requiresRestart: true };
}
