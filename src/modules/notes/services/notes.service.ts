import type { InferSelectModel } from 'drizzle-orm';

import { indexContent, removeFromIndex, searchLocal } from '@/ai/rag';
import { notesRepository } from '@/database/repositories';
import type { notes } from '@/database/schema/utilitaires';

export type Note = InferSelectModel<typeof notes>;

export interface CreateNoteInput {
  title: string;
  content: string;
  tags?: string[];
  category?: string | null;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
  category?: string | null;
}

/** Notes/Knowledge Base (§18) — chaque écriture réindexe le contenu pour la recherche locale (§15). */
export async function createNote(input: CreateNoteInput): Promise<Note> {
  const now = new Date();
  const note = await notesRepository.insert({
    title: input.title,
    content: input.content,
    tags: input.tags ? JSON.stringify(input.tags) : null,
    category: input.category ?? null,
    createdAt: now,
    updatedAt: now,
  });
  await reindex(note.id, note.title, note.content);
  return note;
}

export function getNote(noteId: number): Promise<Note | undefined> {
  return notesRepository.findById(noteId);
}

export async function listNotes(limit = 200): Promise<Note[]> {
  const all = await notesRepository.findAll();
  return [...all].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, limit);
}

export async function updateNote(noteId: number, input: UpdateNoteInput): Promise<Note | undefined> {
  const note = await notesRepository.update(noteId, {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.content !== undefined ? { content: input.content } : {}),
    ...(input.tags !== undefined ? { tags: JSON.stringify(input.tags) } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    updatedAt: new Date(),
  });
  if (note) await reindex(note.id, note.title, note.content);
  return note;
}

export async function deleteNote(noteId: number): Promise<void> {
  await removeFromIndex('note', noteId);
  await notesRepository.remove(noteId);
}

/** Recherche full-text (§18) via l'index RAG déjà en place — pas de requête SQL LIKE dupliquée. */
export async function searchNotes(query: string): Promise<Note[]> {
  const results = await searchLocal(query, 50);
  const noteIds = [...new Set(results.filter((r) => r.sourceType === 'note').map((r) => r.sourceId))];
  const found = await Promise.all(noteIds.map((id) => notesRepository.findById(id)));
  return found.filter((n): n is Note => n != null);
}

export function parseTags(note: Note): string[] {
  if (!note.tags) return [];
  try {
    return JSON.parse(note.tags) as string[];
  } catch {
    return [];
  }
}

function reindex(noteId: number, title: string, content: string): Promise<void> {
  return indexContent('note', noteId, `${title}\n${content}`);
}
