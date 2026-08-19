export interface GenerateOptions {
  systemPrompt?: string;
  maxTokens?: number;
}

/**
 * Interface pluggable pour un LLM on-device (§13, §19). Le choix d'un moteur réel (llama.rn,
 * MLC...) est une décision séparée, prise plus tard — voir CLAUDE.md / le plan de dev. Tant
 * qu'aucun adapter réel n'est enregistré, `noOpAdapter` fait tourner l'app sans IA générative,
 * comme l'exige le CDC ("l'application reste utile sans modèle IA").
 */
export interface LocalLLMAdapter {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
}
