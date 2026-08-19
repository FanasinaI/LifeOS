import type { z } from 'zod';

/**
 * Un tool structuré (§13) : entrée validée par Zod, exécution qui n'appelle que des
 * repositories/services existants — jamais de SQL direct depuis l'IA. `mutates: true` marque
 * les tools qui écrivent des données réelles (create_task/create_event/create_goal) ; ceux-là
 * ne s'exécutent jamais directement, voir `orchestrator.proposeAction()`.
 */
export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  mutates: boolean;
  execute: (input: TInput) => Promise<TOutput>;
}
