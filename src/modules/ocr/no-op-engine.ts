import type { OcrEngine } from './types';

export class NoOcrEngineError extends Error {
  constructor() {
    super("Aucun moteur OCR installé — choix de librairie différé, voir CLAUDE.md.");
    this.name = 'NoOcrEngineError';
  }
}

export const noOpOcrEngine: OcrEngine = {
  name: 'no-op',
  async scan() {
    throw new NoOcrEngineError();
  },
};
