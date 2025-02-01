import { createStoryProcessor } from './langchain';
import { CustomChatMemory } from './langchain/memory';
import { StoryAnalysisTool } from './langchain/tools';
import type { Message } from '../types/chat';
import type { StoryAnalysis } from '../types/analysis';
import { openai, AI_MODELS } from '../config/ai.config';

interface ProcessMessageOptions {
  storyContent: string;
  analysisContext?: any;
  updateMode?: boolean;
  isGreeting?: boolean;
}

interface AIResponse {
  success: boolean;
  text?: string;
  error?: string;
}

class AIService {
  private memory: CustomChatMemory;
  private contextCache: Map<string, any> = new Map();
  private readonly REWRITE_PROMPT = `You are a skilled writing assistant helping to merge new details 
    into an existing story. Your task is to:
    1. Carefully preserve the original story's voice and style
    2. Seamlessly integrate new details from the conversation
    3. Maintain narrative flow and coherence
    4. Keep emotional resonance intact
    5. Only add information explicitly discussed
    
    Format the merged story to:
    - Maintain paragraph structure
    - Keep consistent tense and perspective
    - Preserve key details from original
    - Blend new information naturally
    - Avoid redundancy`;
  private readonly DEFAULT_INTENT = 'SHARING';

  constructor() {
    // All conversation is stored in this memory instance
    this.memory = new CustomChatMemory();
  }

  private async enrichContextualDetails(content: string): Promise<any> {
    try {
      // First extract any explicit time/location mentions
      const explicitDetails = this.extractExplicitDetails(content);
      
      if (!content?.trim()) {
        return explicitDetails;
      }
      
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        console.warn('OpenAI API key not configured, skipping context enrichment');
        return explicitDetails;
      }
      
      if (!content?.trim()) {
        return explicitDetails;
      }
      
      const response = await openai.chat.completions.create({
        model: AI_MODELS.PRIMARY,
        messages: [
          {
            role: 'system',
            content: `Extract and enrich contextual details from the given text.
              Return as JSON with:
              {
                "timePeriod": {
                  "year": string | null,
                  "season": string | null
                },
                "location": {
                  "place": string | null,
                  "details": string | null
                }
              }`
          },
          {
            role: 'user',
            content: content
          }
        ],
        response_format: { type: "json_object" }
      });

      const enrichedDetails = JSON.parse(response.choices[0]?.message?.content || '{}');
      const mergedDetails = { ...explicitDetails, ...enrichedDetails };
      return mergedDetails;
    } catch (error) {
      console.error('Error enriching context:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        content: content.substring(0, 100) // Log first 100 chars for debugging
      });
      return null;
    }
  }

  async processMessage(
    message: string,
    options: ProcessMessageOptions
  ): Promise<AIResponse> {
    // Validate OpenAI API key first
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      return {
        success: false,
        error: 'OpenAI API key is not configured'
      };
    }

    // Handle greeting message
    if (options.isGreeting) {
      return {
        success: true,
        text: "Hi! I'm Muse, your writing companion. I'm here to help you capture and develop your stories. I love how every memory has its own unique voice and emotional resonance."
      };
    }

    // If we're in update mode, use the rewrite logic
    if (options.updateMode) {
      try {
        if (!options.storyContent?.trim()) {
          return {
            success: false,
            error: 'No story content to update'
          };
        }

        const response = await openai.chat.completions.create({
          model: AI_MODELS.PRIMARY,
          messages: [
            {
              role: 'system',
              content: this.REWRITE_PROMPT
            },
            {
              role: 'user',
              content: `Original Story:\n${options.storyContent}\n\nRecent Chat Context:\n${
                options.messageHistory?.slice(-5).map(m => 
                  `${m.sender === 'user' ? 'User' : 'AI'}: ${m.content}`
                ).join('\n')
              }\n\nPlease rewrite the story incorporating relevant details from our chat while maintaining the original voice and style.`
            }
          ],
          temperature: 0.7
        });

        const rewrittenStory = response.choices[0]?.message?.content;
        if (!rewrittenStory?.trim()) {
          throw new Error('AI returned empty response for story update');
        }

        return {
          success: true,
          text: rewrittenStory
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update story';
        console.error('Error in story rewrite:', {
          error,
          message: errorMessage,
          contentLength: options.storyContent?.length || 0
        });
        return {
          success: false,
          error: errorMessage
        };
      }
    }

    try {

      // (Optional) Here you could do message intent analysis or context enrichment
      // Create the story processor with the chain memory
      const processor = await createStoryProcessor(
        {
          content: options.storyContent || '',
          metadata: {
            title: '',  // you can fill in if you have it in your store
            tags: [],
            characters: [],
            // add any other context or analysis results
          }
        },
        this.memory
      );

      // Because we rely on chain memory, we don't pass a messageHistory anymore
      const response = await processor.invoke({
        input: {
          content: message,
          isGreeting: options.isGreeting
        },
        updateMode: options.updateMode
      });

      // Save context in memory so chain can see it next time
      await this.memory.saveContext(
        { input: message },
        { response: response.content }
      );

      if (!response.content?.trim()) {
        throw new Error('AI returned empty response');
      }

      return {
        success: true,
        text: response.content
      };

    } catch (error) {
      console.error('Error processing message:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        messageLength: message.length,
        isGreeting: options.isGreeting,
        updateMode: options.updateMode
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process message'
      };
    }
  }

  async analyzeStory(content: string): Promise<StoryAnalysis> {
    if (!content?.trim()) {
      return {
        success: true,
        elements: {},
        suggestions: [],
        missingContexts: []
      };
    }

    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    try {
      const analysisTool = new StoryAnalysisTool();
      const analysisResult = await analysisTool.call(content);
      const result = JSON.parse(analysisResult);

      if (!result) {
        throw new Error('Invalid analysis result');
      }

      return {
        success: true,
        ...result
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze story';
      console.error('Error analyzing story:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        elements: {},
        suggestions: [],
        missingContexts: []
      };
    }
  }
  
  async generateSuggestions(content: string): Promise<string[]> {
    if (!content?.trim()) {
      return [];
    }

    try {
      const response = await openai.chat.completions.create({
        model: AI_MODELS.PRIMARY,
        messages: [
          {
            role: 'system',
            content: `Generate 3-4 specific suggestions to help develop this story further.`
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.7
      });

      const suggestions = response.choices[0]?.message?.content
        ?.split('\n')
        .map(line => line.trim())
        .filter(Boolean) || [];

      return suggestions;
    } catch (error) {
      console.error('Error generating suggestions:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }
}

export const aiService = new AIService();