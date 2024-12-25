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

export interface AIContext {
  topic?: string;
  style?: 'formal' | 'casual' | 'technical';
  tone?: 'friendly' | 'professional' | 'academic';
}