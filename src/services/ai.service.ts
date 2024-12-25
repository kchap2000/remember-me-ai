import { openai, AI_MODELS, MODEL_PARAMS, PROMPT_TEMPLATES, TRANSCRIPTION_PROMPTS } from '../config/ai.config';
import type { AIEditOptions, AIEditResult } from '../types/ai';

const DEFAULT_ERROR_MESSAGES = {
  API_KEY_MISSING: 'OpenAI API key is not configured',
  RATE_LIMIT: 'Too many requests. Please try again later',
  SERVER_ERROR: 'Service temporarily unavailable',
  NETWORK_ERROR: 'Network connection error',
  DEFAULT: 'Failed to process request'
};

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

class AIService {
  async cleanTranscription(text: string): Promise<AIEditResult> {
    try {
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        return {
          text,
          success: false,
          error: DEFAULT_ERROR_MESSAGES.API_KEY_MISSING
        };
      }

      const response = await openai.chat.completions.create({
        model: AI_MODELS.PRIMARY,
        messages: [
          {
            role: 'system',
            content: TRANSCRIPTION_PROMPTS.CLEAN.system
          },
          {
            role: 'user',
            content: `${TRANSCRIPTION_PROMPTS.CLEAN.user}${text}`
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent cleaning
        max_tokens: 1000
      });

      const cleanedText = response.choices[0]?.message?.content?.trim() || text;

      return {
        text: cleanedText,
        success: true
      };
    } catch (error: any) {
      console.error('OpenAI API Error:', error);
      return {
        text,
        success: false,
        error: error.message || DEFAULT_ERROR_MESSAGES.DEFAULT
      };
    }
  }

  async editText(text: string, options: AIEditOptions = {}): Promise<AIEditResult> {
    try {
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        return {
          text,
          success: false,
          error: DEFAULT_ERROR_MESSAGES.API_KEY_MISSING
        };
      }

      // First, get sensory details and suggestions
      const response = await openai.chat.completions.create({
        model: AI_MODELS.PRIMARY,
        messages: [
          {
            role: 'system',
            content: PROMPT_TEMPLATES.SENSORY.system
          },
          {
            role: 'user',
            content: `${PROMPT_TEMPLATES.SENSORY.user}${text}`
          }
        ],
        ...MODEL_PARAMS[AI_MODELS.PRIMARY],
        temperature: options.temperature || MODEL_PARAMS[AI_MODELS.PRIMARY].temperature
      });

      let editedText = response.choices[0]?.message?.content?.trim() || text;

      // Then, get follow-up questions and prompts
      const promptResponse = await openai.chat.completions.create({
        model: AI_MODELS.PRIMARY,
        messages: [
          {
            role: 'system',
            content: PROMPT_TEMPLATES.RECALL.system
          },
          {
            role: 'user',
            content: `${PROMPT_TEMPLATES.RECALL.user}${editedText}`
          }
        ],
        ...MODEL_PARAMS[AI_MODELS.PRIMARY],
        temperature: 0.7
      });

      const prompts = promptResponse.choices[0]?.message?.content?.trim();
      if (prompts) {
        editedText = `${editedText}\n\nSome questions to consider:\n${prompts}`;
      }

      return {
        text: editedText,
        success: true
      };
    } catch (error: any) {
      const errorMessage = this.handleError(error);
      console.error('AI Service Error:', errorMessage);
      return {
        text: text, // Return original text on error
        success: false,
        error: errorMessage
      };
    }
  }

  private handleError(error: any): string {
    if (!navigator.onLine) {
      return DEFAULT_ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      return DEFAULT_ERROR_MESSAGES.API_KEY_MISSING;
    }
    if (error?.response?.status === 429) {
      return DEFAULT_ERROR_MESSAGES.RATE_LIMIT;
    }
    if (error?.response?.status >= 500) {
      return DEFAULT_ERROR_MESSAGES.SERVER_ERROR;
    }

    return error?.message || DEFAULT_ERROR_MESSAGES.DEFAULT;
  }

  async analyzeMemory(content: string, options: AIEditOptions = {}): Promise<AIEditResult> {
    try {
      // Validate API key first
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        return {
          text: '',
          success: false,
          error: DEFAULT_ERROR_MESSAGES.API_KEY_MISSING
        };
      }

      if (!content?.trim()) {
        return { text: '', success: false, error: 'No content to analyze' };
      }

      // Use the RECALL template for initial analysis
      const response = await openai.chat.completions.create({
        model: AI_MODELS.PRIMARY,
        messages: [
          {
            role: 'system',
            content: `${PROMPT_TEMPLATES.RECALL.system}\n\nProvide a brief analysis and 2-3 follow-up questions.`
          },
          {
            role: 'user',
            content: `${PROMPT_TEMPLATES.RECALL.user}${content}`
          }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: 500,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      });

      const analysis = response.choices[0]?.message?.content?.trim();
      if (!analysis) {
        return { text: '', success: false, error: 'Failed to generate analysis' };
      }

      return {
        text: analysis,
        success: true
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      const errorMessage = error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGES.DEFAULT;
      return {
        text: '',
        success: false,
        error: errorMessage
      };
    }
  }
}

export const aiService = new AIService();