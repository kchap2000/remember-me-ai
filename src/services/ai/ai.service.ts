import { openai, AI_MODELS, MODEL_PARAMS } from '../../config/ai.config';
import { MEMORY_PATTERNS } from './patterns';
import { PROMPT_TEMPLATES, TRANSCRIPTION_PROMPTS } from './prompts';
import type { AIEditOptions, AIEditResult, AIAnalysisResult } from './types';
import type { ElementType, MemoryElement } from '../../types/analysis';

interface TranscriptionResult {
  text: string;
  success: boolean;
  error?: string;
}

interface AIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class AIService {
  private context: Map<string, any> = new Map();
  private knowledgeCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  // Memory Analysis Methods
  private extractElements(content: string): Record<ElementType, MemoryElement[]> {
    const result: Partial<Record<ElementType, MemoryElement[]>> = {};

    Object.entries(MEMORY_PATTERNS).forEach(([category, pattern]) => {
      const matches = [...new Set(content.match(pattern) || [])];
      result[category as ElementType] = matches.map(match => ({
        type: category as ElementType,
        value: match.toLowerCase(),
        context: this.getElementContext(content, match),
        verified: true
      }));
    });

    return result as Record<ElementType, MemoryElement[]>;
  }

  private getElementContext(content: string, element: string): string {
    try {
      const sentencePattern = new RegExp(
        `[^.!?]*(?<=[.!?\\s])${element}(?=[\\s.!?])[^.!?]*[.!?]`,
        'i'
      );
      const match = content.match(sentencePattern);
      return match ? match[0].trim() : '';
    } catch (error) {
      console.warn(`Error getting context for "${element}":`, error);
      return '';
    }
  }

  private identifyMissingContext(
    elements: Record<ElementType, MemoryElement[]>,
    content: string
  ): string[] {
    const missing: string[] = [];

    if (!elements.timeframes?.length) missing.push('temporal');
    if (elements.locations?.length && !this.hasLocationContext(content)) {
      missing.push('spatial');
    }

    return missing;
  }

  private hasLocationContext(content: string): boolean {
    return /\b(?:in|at|near|by|inside|outside|around)\s+the\b/i.test(content);
  }

  async processMessage(message: string, context: {
    storyContent: string;
    year?: number;
    location?: string;
  }): Promise<AIResponse> {
    if (!message?.trim()) {
      return { success: false, error: 'Empty message' };
    }

    try {
      // Let the model classify the message type
      const response = await openai.chat.completions.create({
        model: AI_MODELS.PRIMARY,
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant helping with story writing and memory recall.
                     Analyze the user's message and determine if it's:
                     1. A request for historical/general knowledge
                     2. A story-specific question or suggestion request
                     3. A request for story analysis
                     
                     Then provide an appropriate response based on the type.`
          },
          {
            role: 'user',
            content: `Story Content: ${context.storyContent}
                     Year: ${context.year}
                     Location: ${context.location}
                     User Message: ${message}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const aiResponse = response.choices[0]?.message?.content?.trim();
      if (!aiResponse) {
        throw new Error('Empty response from AI');
      }

      return {
        success: true,
        text: aiResponse
      };

    } catch (error) {
      console.error('Error processing message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch information'
      };
    }
  }

  async analyzeCombined(content: string, context: { year?: number; location?: string }) {
    try {
      const [storyAnalysis, generalKnowledge] = await Promise.all([
        this.analyzeStory(content),
        this.getGeneralKnowledge(content, context)
      ]);

      const response = await openai.chat.completions.create({
        model: AI_MODELS.PRIMARY,
        messages: [
          {
            role: 'system',
            content: PROMPT_TEMPLATES.COMBINED_ANALYSIS.system
          },
          {
            role: 'user',
            content: `Story Analysis: ${storyAnalysis.analysis}\n\nHistorical Context: ${generalKnowledge.text}\n\nProvide a combined analysis that connects personal memory with historical context.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return {
        success: true,
        analysis: response.choices[0]?.message?.content?.trim(),
        personalAnalysis: storyAnalysis,
        historicalContext: generalKnowledge
      };
    } catch (error) {
      console.error('Error in combined analysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze'
      };
    }
  }
  
  async generateSuggestion(content: string): Promise<string> {
    if (!content?.trim()) {
      return 'Please provide some content to generate suggestions.';
    }

    try {
      const elements = this.extractElements(content);
      const missingContext = this.identifyMissingContext(elements, content);

      const response = await openai.chat.completions.create({
        model: AI_MODELS.PRIMARY,
        messages: [
          {
            role: 'system',
            content: PROMPT_TEMPLATES.SUGGESTIONS.system
          },
          {
            role: 'user',
            content: `
              Content: ${content}
              
              Missing context: ${missingContext.join(', ')}
              
              Please provide a suggestion to enhance this memory with more detail and context.
              Focus especially on: ${missingContext.length ? missingContext.join(', ') : 'adding sensory details'}
            `
          }
        ],
        temperature: MODEL_PARAMS.TEMPERATURE_HIGH,
        max_tokens: MODEL_PARAMS.MAX_TOKENS_MEDIUM
      });

      const suggestion = response.choices[0]?.message?.content?.trim();

      if (!suggestion) {
        throw new Error('No suggestion received from AI');
      }

      return suggestion;

    } catch (error) {
      console.error('Error generating suggestion:', error);
      return 'I apologize, but I encountered an error while generating suggestions. Please try again.';
    }
  }

  // Helper method to compare original and modified texts
  private compareTexts(original: string, modified: string): string[] {
    const changes: string[] = [];
    
    // Split into sentences for comparison
    const originalSentences = original.match(/[^.!?]+[.!?]+/g) || [];
    const modifiedSentences = modified.match(/[^.!?]+[.!?]+/g) || [];

    // Compare sentence counts
    if (originalSentences.length !== modifiedSentences.length) {
      changes.push(`Changed number of sentences from ${originalSentences.length} to ${modifiedSentences.length}`);
    }

    // Compare lengths
    const lengthDiff = modified.length - original.length;
    if (Math.abs(lengthDiff) > 10) { // Threshold for significant change
      changes.push(`${lengthDiff > 0 ? 'Added' : 'Removed'} ${Math.abs(lengthDiff)} characters`);
    }

    // Compare word counts
    const originalWords = original.trim().split(/\s+/).length;
    const modifiedWords = modified.trim().split(/\s+/).length;
    if (originalWords !== modifiedWords) {
      changes.push(`Changed word count from ${originalWords} to ${modifiedWords}`);
    }

    return changes;
  }
}

export const aiService = new AIService();