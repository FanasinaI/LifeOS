import type { LocalLLMAdapter } from './types';

export class NoModelInstalledError extends Error {
  constructor() {
    super('Aucun modèle IA installé — LifeOS reste utilisable sans IA, mais cette action en a besoin.');
    this.name = 'NoModelInstalledError';
  }
}

export const noOpAdapter: LocalLLMAdapter = {
  name: 'no-op',
  async isAvailable() {
    return false;
  },
  async generate() {
    throw new NoModelInstalledError();
  },
};
