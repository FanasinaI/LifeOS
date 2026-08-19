import { noOpAdapter } from './no-op-adapter';
import type { LocalLLMAdapter } from './types';

let activeAdapter: LocalLLMAdapter = noOpAdapter;

export function getActiveAdapter(): LocalLLMAdapter {
  return activeAdapter;
}

/** Point d'extension pour brancher un vrai runtime (llama.rn, MLC...) plus tard. */
export function setActiveAdapter(adapter: LocalLLMAdapter): void {
  activeAdapter = adapter;
}

export * from './model-registry';
export * from './no-op-adapter';
export type { GenerateOptions, LocalLLMAdapter } from './types';
