import type { InferSelectModel } from 'drizzle-orm';

import { tasksRepository } from '@/database/repositories';
import type { tasks } from '@/database/schema/organisation';
import { addDays } from '@/utils/date';

export type Task = InferSelectModel<typeof tasks>;
/** Motifs de répétition simples pris en charge — pas un moteur RRULE complet. */
export type RecurrenceRule = 'daily' | 'weekly' | 'monthly';

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  projectId?: number | null;
  goalId?: number | null;
  priority?: Task['priority'];
  dueDate?: Date | null;
  isRecurring?: boolean;
  recurrenceRule?: RecurrenceRule | null;
  estimatedMinutes?: number | null;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const now = new Date();
  return tasksRepository.insert({
    title: input.title,
    description: input.description ?? null,
    projectId: input.projectId ?? null,
    goalId: input.goalId ?? null,
    priority: input.priority ?? 'medium',
    dueDate: input.dueDate ?? null,
    isRecurring: input.isRecurring ?? false,
    recurrenceRule: input.recurrenceRule ?? null,
    estimatedMinutes: input.estimatedMinutes ?? null,
    status: 'todo',
    createdAt: now,
    updatedAt: now,
  });
}

export function listPendingTasks(): Promise<Task[]> {
  return tasksRepository.findPending();
}

export function listAllTasks(): Promise<Task[]> {
  return tasksRepository.findAll();
}

/**
 * Termine une tâche. Si elle est récurrente, la marque terminée ET crée la prochaine occurrence
 * (échéance avancée selon `recurrenceRule`) plutôt que de simplement la clore.
 */
export async function completeTask(taskId: number): Promise<Task | undefined> {
  const task = await tasksRepository.findById(taskId);
  if (!task) return undefined;

  const completed = await tasksRepository.update(taskId, { status: 'done', updatedAt: new Date() });

  if (task.isRecurring && task.recurrenceRule && task.dueDate) {
    await createTask({
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      goalId: task.goalId,
      priority: task.priority,
      dueDate: advanceDueDate(task.dueDate, task.recurrenceRule as RecurrenceRule),
      isRecurring: true,
      recurrenceRule: task.recurrenceRule as RecurrenceRule,
      estimatedMinutes: task.estimatedMinutes,
    });
  }

  return completed;
}

export async function cancelTask(taskId: number): Promise<Task | undefined> {
  return tasksRepository.update(taskId, { status: 'cancelled', updatedAt: new Date() });
}

function advanceDueDate(current: Date, rule: RecurrenceRule): Date {
  switch (rule) {
    case 'daily':
      return addDays(current, 1);
    case 'weekly':
      return addDays(current, 7);
    case 'monthly': {
      const d = new Date(current);
      d.setMonth(d.getMonth() + 1);
      return d;
    }
  }
}
