import type { InferSelectModel } from 'drizzle-orm';
import * as Notifications from 'expo-notifications';

import { notificationsRepository } from '@/database/repositories';
import type { notifications } from '@/database/schema/utilitaires';

export type NotificationRecord = InferSelectModel<typeof notifications>;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}

export interface NotifyInput {
  level: NotificationRecord['level'];
  title: string;
  body: string;
  domain?: string;
  refType?: string;
  refId?: number;
  groupKey?: string;
}

const ANTI_SPAM_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Notifications intelligentes (§21) : anti-spam (pas de doublon pour la même entité/niveau dans
 * les 24h) et regroupement via `groupKey`. Enregistre toujours localement ; la notification push
 * système est best-effort (si les permissions sont refusées, l'historique local reste utile).
 */
export async function notify(input: NotifyInput): Promise<NotificationRecord | null> {
  if (input.domain && input.refType && input.refId != null) {
    const all = await notificationsRepository.findAll();
    const isDuplicate = all.some(
      (n) =>
        n.domain === input.domain &&
        n.refType === input.refType &&
        n.refId === input.refId &&
        n.level === input.level &&
        Date.now() - n.createdAt.getTime() < ANTI_SPAM_WINDOW_MS
    );
    if (isDuplicate) return null;
  }

  const record = await notificationsRepository.insert({
    level: input.level,
    title: input.title,
    body: input.body,
    domain: input.domain ?? null,
    refType: input.refType ?? null,
    refId: input.refId ?? null,
    isRead: false,
    groupKey: input.groupKey ?? null,
    createdAt: new Date(),
  });

  await Notifications.scheduleNotificationAsync({
    content: { title: input.title, body: input.body },
    trigger: null,
  }).catch(() => {});

  return record;
}

export function listNotifications(limit = 100): Promise<NotificationRecord[]> {
  return notificationsRepository
    .findAll()
    .then((all) => [...all].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit));
}

export function listUnreadNotifications(): Promise<NotificationRecord[]> {
  return notificationsRepository.findAll().then((all) => all.filter((n) => !n.isRead));
}

export async function markNotificationRead(id: number): Promise<void> {
  await notificationsRepository.update(id, { isRead: true });
}
