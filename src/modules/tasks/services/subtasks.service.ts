import type { InferSelectModel } from 'drizzle-orm';

import { subtasksRepository } from '@/database/repositories';
import type { subtasks } from '@/database/schema/organisation';

export type Subtask = InferSelectModel<typeof subtasks>;

export function listSubtasks(taskId: number): Promise<Subtask[]> {
  return subtasksRepository.findByTask(taskId);
}

export function addSubtask(taskId: number, title: string): Promise<Subtask> {
  return subtasksRepository.insert({ taskId, title, isDone: false, createdAt: new Date() });
}

export async function toggleSubtask(subtaskId: number): Promise<Subtask | undefined> {
  const subtask = await subtasksRepository.findById(subtaskId);
  if (!subtask) return undefined;
  return subtasksRepository.update(subtaskId, { isDone: !subtask.isDone });
}
