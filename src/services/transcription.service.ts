import { openai, AI_MODELS } from '../config/ai.config';
import type { TranscriptionOptions, TranscriptionResult, TranscriptionProgress } from '../types';

interface OpenAIError {
  response?: {
    status?: number;
    data?: {
      error?: {
        message?: string;
        code?: string;
        type?: string;
      }
    }
  };
  message?: string;
}

class TranscriptionService {
  private readonly MAX_CHUNK_SIZE = 25 * 1024 * 1024; // 25MB - Whisper's limit
  private readonly SUPPORTED_FORMATS = ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/mpeg'];
  private readonly ERROR_MESSAGES = {
    API_KEY_MISSING: 'OpenAI API key is not configured. Please check your environment variables.',
    UNSUPPORTED_FORMAT: (format: string) => 
      `Unsupported audio format: ${format || 'unknown'}. Please use WebM, MP4, WAV, or MP3.`,
    FILE_TOO_LARGE: (size: number) => 
      `Audio file too large (${(size / 1024 / 1024).toFixed(1)}MB). Maximum size is 25MB.`,
    NO_SPEECH_DETECTED: 'No speech was detected in the audio. Please try recording again.',
    NETWORK_ERROR: 'Network error occurred. Please check your internet connection.',
    RATE_LIMIT: 'Rate limit exceeded. Please try again in a few moments.',
    SERVER_ERROR: 'OpenAI server error. Please try again later.',
    INVALID_API_KEY: 'Invalid API key. Please check your configuration.',
    PERMISSION_DENIED: 'Microphone access denied. Please allow microphone access in your browser settings.',
    NO_AUDIO_DEVICE: 'No microphone found. Please ensure you have a working microphone connected.',
    ENCODING_ERROR: 'Error encoding audio. Please try recording again.',
    DEFAULT: 'Failed to transcribe audio. Please try again.'
  };

  private validateApiKey() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey?.trim()) {
      console.error('OpenAI API key is missing');
      throw new Error('Voice recording is not available - missing API key');
    }
  }

  private validateAudioFormat(blob: Blob): void {
    if (!blob) {
      throw new Error('No audio recorded. Please try again.');
    }

    if (!this.SUPPORTED_FORMATS.includes(blob.type)) {
      throw new Error(this.ERROR_MESSAGES.UNSUPPORTED_FORMAT(blob.type));
    }

    if (blob.size > this.MAX_CHUNK_SIZE) {
      throw new Error(this.ERROR_MESSAGES.FILE_TOO_LARGE(blob.size));
    }

    if (blob.size === 0) {
      throw new Error('No audio detected. Please try speaking and record again.');
    }
  }

  private handleOpenAIError(error: OpenAIError): string {
    console.error('OpenAI API Error:', error);

    // Check for network connectivity first

    if (!navigator.onLine) {
      return this.ERROR_MESSAGES.NETWORK_ERROR;
    }

    // Handle API-specific errors
    const status = error.response?.status;
    const errorType = error.response?.data?.error?.type;
    const errorMessage = error.response?.data?.error?.message;

    // Check for API key issues first
    if (errorMessage?.toLowerCase().includes('api key') || status === 401) {
      return this.ERROR_MESSAGES.INVALID_API_KEY;
    }

    switch (status) {
      case 429:
        return this.ERROR_MESSAGES.RATE_LIMIT;
      case 500:
      case 502:
      case 503:
      case 504:
        return this.ERROR_MESSAGES.SERVER_ERROR;
    }

    if (errorType === 'invalid_request_error' && 
        errorMessage?.includes('no speech found')) {
      return this.ERROR_MESSAGES.NO_SPEECH_DETECTED;
    }

    if (errorType === 'invalid_request_error' && 
        errorMessage?.includes('api key')) {
      return this.ERROR_MESSAGES.INVALID_API_KEY;
    }

    return errorMessage || this.ERROR_MESSAGES.DEFAULT;
  }

  async transcribeAudio(
    audioBlob: Blob,
    options: TranscriptionOptions = {},
    onProgress?: (progress: TranscriptionProgress) => void
  ): Promise<TranscriptionResult> {
    try {
      this.validateApiKey();
      this.validateAudioFormat(audioBlob);

      if (onProgress) {
        onProgress({ status: 'processing', progress: 0 });
      }

      const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
      
      if (!audioFile.size) {
        throw new Error('Empty audio recording. Please try again.');
      }

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: AI_MODELS.transcription,
        response_format: 'text',
        language: options.language || 'en'
      });

      if (onProgress) {
        onProgress({ status: 'completed', progress: 100 });
      }

      const text = typeof transcription === 'string' ? 
        transcription : 
        transcription.text;
      return {
        text,
        language: options.language || 'en',
        confidence: 1.0 // Whisper doesn't provide confidence scores
      };
    } catch (error) {
      const errorMessage = this.handleOpenAIError(error as OpenAIError);
      throw new Error(errorMessage);
    }
  }

  async transcribeChunk(
    chunk: Blob,
    options: TranscriptionOptions = {}
  ): Promise<string> {
    try {
      if (chunk.size > this.MAX_CHUNK_SIZE) {
        throw new Error('Audio chunk too large. Maximum size is 25MB.');
      }

      const result = await this.transcribeAudio(chunk, options);
      return result.text;
    } catch (error) {
      console.error('Error transcribing audio chunk:', error);
      throw error;
    }
  }

  async transcribeLongAudio(
    audioBlob: Blob,
    options: TranscriptionOptions = {},
    onProgress?: (progress: TranscriptionProgress) => void
  ): Promise<string> {
    try {
      if (audioBlob.size <= this.MAX_CHUNK_SIZE) {
        const result = await this.transcribeAudio(audioBlob, options, onProgress);
        return result.text;
      }

      let textResult = '';
      let start = 0;

      while (start < audioBlob.size) {
        const chunk = audioBlob.slice(start, start + this.MAX_CHUNK_SIZE);
        const chunkText = await this.transcribeChunk(chunk, options);
        textResult += chunkText;
        start += this.MAX_CHUNK_SIZE;
        if (onProgress) {
          onProgress({ status: 'processing', progress: Math.min((start / audioBlob.size) * 100, 100) });
        }
      }

      if (onProgress) {
        onProgress({ status: 'completed', progress: 100 });
      }

      return textResult;
    } catch (error) {
      console.error('Error transcribing long audio:', error);
      if (error instanceof Error) {
        if (error.message.includes('NotAllowedError')) {
          throw new Error(this.ERROR_MESSAGES.PERMISSION_DENIED);
        }
        if (error.message.includes('NotFoundError')) {
          throw new Error(this.ERROR_MESSAGES.NO_AUDIO_DEVICE);
        }
      }
      throw error;
    }
  }
}

export const transcriptionService = new TranscriptionService();
