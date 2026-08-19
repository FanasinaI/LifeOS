import type { InferSelectModel } from 'drizzle-orm';

import { eventsRepository } from '@/database/repositories';
import type { events } from '@/database/schema/organisation';
import { addDays } from '@/utils/date';

export type CalendarEvent = InferSelectModel<typeof events>;

export interface CreateEventInput {
  title: string;
  startAt: Date;
  endAt: Date;
  location?: string | null;
  note?: string | null;
  isAllDay?: boolean;
}

export async function createEvent(input: CreateEventInput): Promise<CalendarEvent> {
  const now = new Date();
  return eventsRepository.insert({
    title: input.title,
    startAt: input.startAt,
    endAt: input.endAt,
    location: input.location ?? null,
    note: input.note ?? null,
    isAllDay: input.isAllDay ?? false,
    createdAt: now,
    updatedAt: now,
  });
}

export function listEventsBetween(start: Date, end: Date): Promise<CalendarEvent[]> {
  return eventsRepository.findBetween(start, end);
}

export function listUpcoming(withinDays = 14, asOf: Date = new Date()): Promise<CalendarEvent[]> {
  return eventsRepository.findBetween(asOf, addDays(asOf, withinDays));
}
