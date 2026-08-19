import type { InferSelectModel } from 'drizzle-orm';

import { ocrItemsRepository } from '@/database/repositories';
import type { ocrItems } from '@/database/schema/utilitaires';

import { noOpOcrEngine } from './no-op-engine';
import type { OcrEngine } from './types';

export type OcrItem = InferSelectModel<typeof ocrItems>;

let activeEngine: OcrEngine = noOpOcrEngine;

/** Point d'extension pour brancher un vrai moteur OCR plus tard (§19). */
export function setOcrEngine(engine: OcrEngine): void {
  activeEngine = engine;
}

/** Scanner ticket/facture (§19) : le résultat entre toujours en PENDING, jamais confirmé automatiquement. */
export async function scanReceipt(imageUri: string, documentId?: number): Promise<OcrItem> {
  const result = await activeEngine.scan(imageUri);
  return ocrItemsRepository.insert({
    documentId: documentId ?? null,
    rawText: result.rawText,
    detectedAmount: result.detectedAmount,
    detectedCategory: result.detectedCategory,
    transactionId: null,
    status: 'pending',
    createdAt: new Date(),
  });
}

export function listPendingOcrItems(): Promise<OcrItem[]> {
  return ocrItemsRepository.findAll().then((all) => all.filter((item) => item.status === 'pending'));
}

export async function confirmOcrItem(ocrItemId: number, transactionId: number): Promise<OcrItem | undefined> {
  return ocrItemsRepository.update(ocrItemId, { status: 'confirmed', transactionId });
}

export async function rejectOcrItem(ocrItemId: number): Promise<OcrItem | undefined> {
  return ocrItemsRepository.update(ocrItemId, { status: 'rejected' });
}
