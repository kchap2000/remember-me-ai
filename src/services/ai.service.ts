import { openai, AI_MODELS, MODEL_PARAMS, PROMPT_TEMPLATES } from '../config/ai.config';
import type { AIEditOptions, AIEditResult } from '../types/ai';
import type { AnalysisResult, MemoryElement, ElementType, StoryAnalysis } from '../types/analysis';

export interface PolishTextResult {
  text: string;
  success: boolean;
  error?: string;
}

const MEMORY_PATTERNS: Record<ElementType, RegExp> = {
  people: /\b(?:mother|father|dad|sister|brother|aunt|uncle|grandmother|grandfather|friend|teacher)\b/gi,
  locations: /\b(?:hospital|kitchen|school|home|house|room|store|park)\b/gi,
  events: /\b(?:tripped|hit|born|stitches|fell|broke|celebrated|visited|played|learned)\b/gi,
  timeframes: /\b(?:yesterday|last week|when I was|years ago|in \d{4}|[12][0-9]{3})\b/gi,
  objects: /\b(?:briefcase|mirror|eye|book|table|chair|car)\b/gi
};

async function polishTextWithAI(content: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: AI_MODELS.PRIMARY,
      messages: [
        {
          role: 'system',
          content: `You are a text editor tasked with polishing the provided text.
            Your goal is to:
            - Remove filler words like "um," "uh," "like," "you know"
            - Eliminate repeated words/phrases and clean up rambling sentences
            - Maintain the original meaning and tone
            - Break text into coherent paragraphs by grouping related ideas
            - Ensure proper punctuation, capitalization, and spacing
            - Add blank lines between paragraphs for readability
            
            Return ONLY the polished text without any additional comments.`
        },
        {
          role: 'user',
          content: content
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    return response.choices[0]?.message?.content?.trim() || content;
  } catch (error) {
    console.error('Error polishing text with AI:', error);
    throw error;
  }
}

class AIService {
  private context: Map<string, any> = new Map();
  
  async polishText(content: string): Promise<PolishTextResult> {
    try {
      const response = await openai.chat.completions.create({
        model: AI_MODELS.PRIMARY,
        messages: [
          {
            role: 'system',
            content: `You are a text editor tasked with polishing the provided text.
              Your goal is to:
              - Remove filler words like "um," "uh," "like," "you know"
              - Eliminate repeated words/phrases and clean up rambling sentences
              - Maintain the original meaning and tone
              - Break text into coherent paragraphs by grouping related ideas
              - Ensure proper punctuation, capitalization, and spacing
              - Add blank lines between paragraphs for readability
              
              Return ONLY the polished text without any additional comments.`
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const polishedText = response.choices[0]?.message?.content?.trim();
      if (!polishedText) {
        throw new Error('No response from AI');
      }

      return {
        text: polishedText,
        success: true
      };
    } catch (error) {
      console.error('Error polishing text with AI:', error);
      return {
        text: content,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to polish text'
      };
    }
  }

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

  // Main Analysis Methods
  async analyzeStory(content: string, options: AIEditOptions = {}): Promise<StoryAnalysis> {
    try {
      if (!content?.trim()) {
        return { 
          success: false, 
          error: 'No content to analyze',
          elements: {},
          suggestions: [],
          missingContexts: []
        };
      }

      // Local analysis
      const elements = this.extractElements(content);
      const missingContexts = this.identifyMissingContext(elements, content);

      // Generate initial suggestions
      const [analysisResponse, suggestionsResponse] = await Promise.all([
        openai.chat.completions.create({
        model: AI_MODELS.PRIMARY,
        messages: [
          {
            role: 'system',
            content: PROMPT_TEMPLATES.RECALL.system
          },
          {
            role: 'user',
            content: `${PROMPT_TEMPLATES.RECALL.user}${content}`
          }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: 300
      }),
        openai.chat.completions.create({
          model: AI_MODELS.PRIMARY,
          messages: [
            {
              role: 'system',
              content: PROMPT_TEMPLATES.ENHANCE.system
            },
            {
              role: 'user',
              content: `${PROMPT_TEMPLATES.ENHANCE.user}${content}`
            }
          ],
          temperature: 0.7,
          max_tokens: 200,
          n: 3 // Generate 3 suggestions
        })
      ]);

      const analysis = analysisResponse.choices[0]?.message?.content?.trim();
      const suggestions = suggestionsResponse.choices.map(choice => 
        choice.message?.content?.trim() || ''
      ).filter(Boolean);

      if (!analysis) {
        throw new Error('Failed to generate analysis');
      }

      return {
        success: true,
        analysis,
        elements,
        missingContexts,
        suggestions
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze story',
        elements: {},
        suggestions: [],
        missingContexts: []
      };
    }
  }

  // Existing methods...
  async cleanTranscription(text: string): Promise<AIEditResult> {
    // ... (keep existing implementation)
  }

  async editText(text: string, options: AIEditOptions = {}): Promise<AIEditResult> {
    // ... (keep existing implementation)
  }

  async generateSuggestion(content: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: AI_MODELS.PRIMARY,
        messages: [
          {
            role: 'system',
            content: PROMPT_TEMPLATES.ENHANCE.system
          },
          {
            role: 'user',
            content: `${PROMPT_TEMPLATES.ENHANCE.user}${content}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('Error generating suggestion:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();