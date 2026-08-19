import { sqliteConnection } from '@/database/client';
import { aiKnowledgeChunksRepository } from '@/database/repositories';

export type IndexableSourceType = 'note' | 'document';

/**
 * Indexe (ou réindexe) le contenu d'une note/document pour la recherche locale (§15 RAG).
 * Substitut pragmatique à des embeddings pour la V1 — recherche plein texte SQLite FTS5, pas de
 * modèle d'embedding à gérer. Le trigger sur `ai_knowledge_chunks` (client.ts) tient
 * `ai_knowledge_fts` à jour automatiquement.
 */
export async function indexContent(sourceType: IndexableSourceType, sourceId: number, content: string): Promise<void> {
  await removeFromIndex(sourceType, sourceId);
  await aiKnowledgeChunksRepository.insert({ sourceType, sourceId, content, createdAt: new Date() });
}

export async function removeFromIndex(sourceType: IndexableSourceType, sourceId: number): Promise<void> {
  const all = await aiKnowledgeChunksRepository.findAll();
  const existing = all.filter((c) => c.sourceType === sourceType && c.sourceId === sourceId);
  for (const chunk of existing) {
    await aiKnowledgeChunksRepository.remove(chunk.id);
  }
}

export interface SearchResult {
  chunkId: number;
  sourceType: string;
  sourceId: number;
  content: string;
}

/** Échappe la requête en tokens littéraux — évite qu'un mot comme "AND"/"NOT" ou des guillemets cassent la syntaxe FTS5. */
function sanitizeFtsQuery(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => `"${token.replace(/"/g, '""')}"`)
    .join(' ');
}

export async function searchLocal(query: string, limit = 10): Promise<SearchResult[]> {
  const sanitized = sanitizeFtsQuery(query);
  if (!sanitized) return [];

  return sqliteConnection.getAllAsync<SearchResult>(
    `SELECT c.id as chunkId, c.source_type as sourceType, c.source_id as sourceId, c.content as content
     FROM ai_knowledge_fts f
     JOIN ai_knowledge_chunks c ON c.id = f.rowid
     WHERE ai_knowledge_fts MATCH ?
     ORDER BY rank
     LIMIT ?`,
    [sanitized, limit]
  );
}
