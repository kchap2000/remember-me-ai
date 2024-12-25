// Common types used across the application
export enum Language {
  English = 'en',
  Spanish = 'es'
}

export enum TextStyle {
  Formal = 'formal',
  Technical = 'technical',
  Casual = 'casual'
}

// Generic interfaces that may be used outside of text processing
export interface BaseResult {
  success: boolean;
  error?: string;
}

export interface PolishOptions {
  fixPunctuation?: boolean;
  capitalizeFirst?: boolean;
  removeFillers?: boolean;
  convertNumbers?: boolean;
  improveGrammar?: boolean;
  language?: Language;
  aiAssist?: boolean;
  textStyle?: TextStyle;
  maxRetries?: number;
  customStyleGuides?: Array<[RegExp, string]>;
}

export interface PolishResult {
  text: string;
  changes: TextChange[];
  aiAssisted: boolean;
  confidence: number;
  language: Language;
}

export interface TextChange {
  original: string;
  modified: string;
  position: number;
  reason: string;
  confidence: number;
}