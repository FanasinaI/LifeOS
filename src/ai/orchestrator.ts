import { getActiveAdapter } from '@/ai/runtime';
import { searchLocal, type SearchResult } from '@/ai/rag';
import { getTool, runTool } from '@/ai/tools';
import { useAppStore } from '@/store';

/**
 * Propose une action d'écriture (create_task/create_event/create_goal) : elle est stockée dans
 * le store comme `pendingAction`, jamais exécutée directement. Seul `confirmPendingAction()`,
 * appelé depuis un geste utilisateur explicite, écrit réellement dans SQLite (§11, §13).
 */
export function proposeAction(toolName: string, args: Record<string, unknown>, description: string): void {
  const tool = getTool(toolName);
  if (!tool) throw new Error(`Tool inconnu : ${toolName}`);
  if (!tool.mutates) {
    throw new Error(`"${toolName}" ne modifie rien — appelle runTool() directement, pas besoin de confirmation.`);
  }
  useAppStore.getState().setPendingAction({ toolName, args, description });
}

export async function confirmPendingAction(): Promise<unknown> {
  const pending = useAppStore.getState().pendingAction;
  if (!pending) throw new Error('Aucune action en attente de confirmation.');
  const result = await runTool(pending.toolName, pending.args);
  useAppStore.getState().setPendingAction(null);
  return result;
}

export function cancelPendingAction(): void {
  useAppStore.getState().setPendingAction(null);
}

export interface ChatResult {
  answer: string;
  usedModel: boolean;
  sources: SearchResult[];
}

/**
 * Recherche naturelle (§16, §20). Cherche du contexte local pertinent puis, si un modèle est
 * disponible, lui demande une synthèse strictement bornée à ce contexte. Sans modèle, retombe
 * sur les résultats de recherche bruts plutôt que d'échouer — l'app reste utile sans IA (§13,
 * règle absolue : le LLM ne constitue jamais la source de vérité).
 */
export async function chatWithContext(userMessage: string): Promise<ChatResult> {
  const sources = await searchLocal(userMessage, 5);
  const adapter = getActiveAdapter();
  const modelAvailable = await adapter.isAvailable();

  if (!modelAvailable) {
    const answer =
      sources.length > 0
        ? `Aucun modèle IA installé. Voici ce que j'ai trouvé localement :\n\n${sources
            .map((s) => `• ${s.content}`)
            .join('\n')}`
        : 'Aucun modèle IA installé, et rien trouvé localement pour cette recherche.';
    return { answer, usedModel: false, sources };
  }

  const context = sources.map((s) => `- ${s.content}`).join('\n');
  const prompt = `Contexte local (notes de l'utilisateur uniquement) :\n${context || '(aucun)'}\n\nQuestion : ${userMessage}\n\nRéponds uniquement à partir de ce contexte. N'invente aucun chiffre ni fait absent du contexte.`;
  const answer = await adapter.generate(prompt);
  return { answer, usedModel: true, sources };
}
