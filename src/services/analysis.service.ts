// src/services/analysis.service.ts

import { memoryAnalysisService } from './memoryAnalysis.service';
import type { 
  AnalysisResult,
  StoryEnhancement,
  MemoryElement,
  FollowUpQuestion 
} from '../types/analysis';

class AnalysisService {
  async analyzeContent(content: string): Promise<AnalysisResult> {
    try {
      return await memoryAnalysisService.analyzeContent(content);
    } catch (error) {
      console.error('Error in analysis service:', error);
      return {
        elements: {},
        missingContexts: [],
        verifiedDetails: []
      };
    }
  }

  private extractMemoryElements(content: string): MemoryElement[] {
    const elements: MemoryElement[] = [];
    
    // Extract only explicitly mentioned elements
    const patterns = {
      people: /\b(?:my\s+)?(?:mother|father|dad|sister|brother|sibling)\b/gi,
      locations: /\b(?:hospital|kitchen|school|home)\b/gi,
      events: /\b(?:tripped|hit|born|stitches)\b/gi,
      dates: /\b(?:\d{4}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s+\d{4})?)\b/gi,
      objects: /\b(?:briefcase|mirror|eye)\b/gi
    };

    // Only extract elements that are explicitly mentioned
    Object.entries(patterns).forEach(([category, pattern]) => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => {
        elements.push({
          type: category as ElementType,
          value: match.toLowerCase(),
          context: this.getElementContext(content, match)
        });
      });
    });

    return elements;
  }

  private getElementContext(content: string, element: string): string {
    // Get the surrounding sentence for context
    const sentencePattern = new RegExp(
      `[^.!?]*(?<=[.!?\\s])${element}(?=[\\s.!?])[^.!?]*[.!?]`,
      'i'
    );
    const match = content.match(sentencePattern);
    return match ? match[0].trim() : '';
  }

  private generateFollowUpQuestions(elements: MemoryElement[], missingContext: string[]): FollowUpQuestion[] {
    const questions: FollowUpQuestion[] = [];

    // Questions about missing context
    missingContext.forEach(context => {
      questions.push({
        type: 'context',
        text: `Do you remember ${context}?`
      });
    });

    // Questions about mentioned elements
    elements.forEach(element => {
      switch (element.type) {
        case 'people':
          questions.push({
            type: 'reaction',
            text: `How did ${element.value} react to this?`
          });
          break;
        case 'events':
          questions.push({
            type: 'detail',
            text: `What do you remember most about ${element.value}?`
          });
          break;
      }
    });

    return questions;
  }

  private identifyMissingContext(
    elements: MemoryElement[],
    content: string
  ): FollowUpQuestion[] {
    const questions: FollowUpQuestion[] = [];

    // Only add questions about naturally expected context
    if (!content.includes('time') && !content.includes('o\'clock') && !content.includes('morning') && !content.includes('afternoon')) {
      questions.push({
        type: 'timeframe',
        text: 'Do you remember what time of day this happened?',
        relevance: 'temporal_context'
      });
    }

    // Check for causal relationships
    if (content.includes('tripped') && !content.includes('because')) {
      questions.push({
        type: 'cause',
        text: 'What caused you to trip? Was there something on the floor?',
        relevance: 'cause_effect'
      });
    }

    return questions;
  }

  async generateEnhancement(content: string, analysis: AnalysisResult): Promise<StoryEnhancement> {
    const structure = this.suggestStructure(analysis.elements);
    const sensoryPrompts = this.generateSensoryPrompts(analysis.elements);
    
    return {
      structure,
      sensoryPrompts,
      suggestedOrder: this.suggestNarrativeOrder(analysis.elements)
    };
  }

  async generateGreeting(content: string, analysis: AnalysisResult): Promise<string> {
    const recentElement = analysis.elements[analysis.elements.length - 1];
    const followUp = analysis.followUpQuestions[0];

    let greeting = 'Let\'s continue with your story. ';
    
    if (recentElement) {
      greeting += `You were telling me about ${recentElement.value}. `;
    }

    if (followUp) {
      greeting += followUp.text;
    }

    return greeting;
  }
}

export const analysisService = new AnalysisService();