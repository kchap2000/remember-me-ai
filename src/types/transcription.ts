export interface TranscriptionOptions {
  language?: string;
  prompt?: string;
  temperature?: number;
}

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
}

export interface TranscriptionProgress {
  status: 'processing' | 'completed' | 'error';
  progress?: number;
  error?: string;
}