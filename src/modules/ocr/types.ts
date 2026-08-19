export interface OcrResult {
  rawText: string;
  detectedAmount: number | null;
  detectedCategory: string | null;
}

/** Interface pluggable pour un moteur OCR on-device (§19). Choix de librairie différé. */
export interface OcrEngine {
  readonly name: string;
  scan(imageUri: string): Promise<OcrResult>;
}
