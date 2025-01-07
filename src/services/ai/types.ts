import type { ElementType, MemoryElement } from '../../types/analysis';

export interface AIContext {
  topic?: string;
  style?: 'formal' | 'casual' | 'technical';
  tone?: 'friendly' | 'professional' | 'academic';
}

export interface AIEditOptions {
  temperature?: number;
  maxTokens?: number;
  prompt?: string;
}

export interface AIEditResult {
  text: string;
  success: boolean;
  error?: string;
}

export interface AIAnalysisResult {
  success: boolean;
  error?: string;
  analysis?: string;
  elements: Record<ElementType, MemoryElement[]>;
  suggestions: string[];
  missingContexts: string[];
}