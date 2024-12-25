import { Language, TextStyle } from '../types';

export interface AIResult {
  success: boolean;
  text: string;
  confidence: number;
  error?: string;
}

export interface AIService {
  improveText(text: string, prompt: string): Promise<AIResult>;
}

export interface TextProcessingRules {
  fillerWords: RegExp;
  commonReplacements: Record<string, string>;
  punctuationRules: Array<[RegExp, string]>;
  grammarRules: Array<[RegExp, string]>;
  styleGuides: Record<TextStyle, Array<[RegExp, string]>>;
  confidenceMetrics: {
    baseScore: number;
    penaltyPerError: number;
  };
}