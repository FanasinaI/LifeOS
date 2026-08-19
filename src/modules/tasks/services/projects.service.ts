import type { InferSelectModel } from 'drizzle-orm';

import { projectsRepository } from '@/database/repositories';
import type { projects } from '@/database/schema/organisation';

export type Project = InferSelectModel<typeof projects>;

export function listProjects(): Promise<Project[]> {
  return projectsRepository.findAll();
}

export function createProject(name: string, description?: string): Promise<Project> {
  const now = new Date();
  return projectsRepository.insert({
    name,
    description: description ?? null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });
}
