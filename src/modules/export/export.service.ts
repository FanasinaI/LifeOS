import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import {
  accountsRepository,
  budgetsRepository,
  goalsRepository,
  habitsRepository,
  tasksRepository,
  transactionsRepository,
} from '@/database/repositories';

import { toCsv } from './csv';

const EXPORTS_DIR = new Directory(Paths.cache, 'exports');

function ensureExportsDir(): void {
  if (!EXPORTS_DIR.exists) {
    EXPORTS_DIR.create({ intermediates: true, idempotent: true });
  }
}

function writeAndShare(fileName: string, content: string): File {
  ensureExportsDir();
  const file = new File(EXPORTS_DIR, fileName);
  file.create({ overwrite: true });
  file.write(content);
  return file;
}

export async function shareFile(file: File): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri);
  }
}

/** Export CSV des transactions (§23) — le plus demandé en pratique. */
export async function exportTransactionsCsv(): Promise<File> {
  const transactions = await transactionsRepository.findAll();
  const csv = toCsv(transactions);
  return writeAndShare(`lifeos-transactions-${Date.now()}.csv`, csv);
}

/**
 * Export JSON complet (§23) — comptes, transactions, budgets, objectifs, tâches, habitudes.
 * Portabilité/relecture humaine ; ce n'est pas le backup chiffré (§26), voir src/backup/.
 */
export async function exportAllDataJson(): Promise<File> {
  const [accounts, transactions, budgets, goals, tasks, habits] = await Promise.all([
    accountsRepository.findAll(),
    transactionsRepository.findAll(),
    budgetsRepository.findAll(),
    goalsRepository.findAll(),
    tasksRepository.findAll(),
    habitsRepository.findAll(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    accounts,
    transactions,
    budgets,
    goals,
    tasks,
    habits,
  };

  return writeAndShare(`lifeos-export-${Date.now()}.json`, JSON.stringify(payload, null, 2));
}
