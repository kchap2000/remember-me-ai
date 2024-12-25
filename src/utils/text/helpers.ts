import { Language } from '../types';
import type { PolishResult, TextChange } from '../types';

export function createEmptyResult(text: string = '', language: Language = Language.English): PolishResult {
  return {
    text,
    changes: [],
    aiAssisted: false,
    confidence: 1.0,
    language
  };
}

export function recordChange(
  changes: TextChange[],
  original: string,
  modified: string,
  reason: string,
  confidence: number
): void {
  if (original !== modified) {
    changes.push({
      original,
      modified,
      position: 0,
      reason,
      confidence
    });
  }
}

export function splitIntoSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
}