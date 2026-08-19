import type { InferSelectModel } from 'drizzle-orm';

import { indexContent, removeFromIndex } from '@/ai/rag';
import { notesRepository } from '@/database/repositories';
import type { notes } from '@/database/schema/utilitaires';

export type Note = InferSelectModel<typeof notes>;

export interface CreateNoteInput {
  title: string;
  content: string;
  tags?: string[];
  category?: string | null;
}

/**
 * Notes minimales pour alimenter le RAG (§18/§15) — un écran de gestion complet (recherche
 * full-text UI, tags, catégories) arrive avec les Utilitaires (étape 8). Chaque écriture
 * réindexe le contenu pour la recherche locale.
 */
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
  await indexContent('note', note.id, `${note.title}\n${note.content}`);
  return note;
}

export async function listNotes(limit = 50): Promise<Note[]> {
  const all = await notesRepository.findAll();
  return [...all].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, limit);
}

export async function updateNote(noteId: number, content: string): Promise<Note | undefined> {
  const note = await notesRepository.update(noteId, { content, updatedAt: new Date() });
  if (note) await indexContent('note', note.id, `${note.title}\n${note.content}`);
  return note;
}

export async function deleteNote(noteId: number): Promise<void> {
  await removeFromIndex('note', noteId);
  await notesRepository.remove(noteId);
}
