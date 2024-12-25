// src/services/memoryAnalysis.service.ts
import type { AnalysisResult, MemoryElement, FollowUpQuestion } from '../types/analysis';

type ElementType = 'people' | 'locations' | 'events' | 'timeframes' | 'objects';

interface ElementPatterns {
  [key in ElementType]: RegExp;
}

class MemoryAnalysisService {
  private static readonly PATTERNS: ElementPatterns = {
    people: /\b(?:mother|father|dad|sister|brother|aunt|uncle|grandmother|grandfather|friend|teacher)\b/gi,
    locations: /\b(?:hospital|kitchen|school|home|house|room|store|park)\b/gi,
    events: /\b(?:tripped|hit|born|stitches|fell|broke|celebrated|visited|played|learned)\b/gi,
    timeframes: /\b(?:yesterday|last week|when I was|years ago|in \d{4}|[12][0-9]{3})\b/gi,
    objects: /\b(?:briefcase|mirror|eye|book|table|chair|car)\b/gi
  };

  async analyzeContent(content: string): Promise<AnalysisResult> {
    try {
      if (!content?.trim()) {
        return {
          elements: {},
          missingContexts: [],
          verifiedDetails: []
        };
      }

      const elementsByCategory = this.extractElementsByCategory(content);
      const missingContexts = this.identifyMissingContext(elementsByCategory, content);
      const verifiedDetails = this.consolidateVerifiedDetails(elementsByCategory);

      return {
        elements: elementsByCategory,
        missingContexts,
        verifiedDetails
      };
    } catch (error) {
      console.error('Error analyzing content:', error);
    }
  }

  private extractElementsByCategory(content: string): Record<ElementType, MemoryElement[]> {
    const result: Partial<Record<ElementType, MemoryElement[]>> = {};

    Object.entries(MemoryAnalysisService.PATTERNS).forEach(([category, pattern]) => {
      const matches = content.match(pattern) || [];
      result[category as ElementType] = [...new Set(matches)].map(match => ({
        value: match.toLowerCase(),
        verified: true,
        context: this.getElementContext(content, match)
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
      console.warn(`Error getting context for element "${element}":`, error);
      return '';
    }
  }

  private identifyMissingContext(
    elements: Record<ElementType, MemoryElement[]>, 
    content: string
  ): string[] {
    const missing: string[] = [];

    // Check for temporal context
    if (elements.timeframes.length === 0) {
      missing.push('temporal');
    }

    // Check for spatial context
    if (elements.locations.length > 0 && !this.hasLocationContext(content)) {
      missing.push('spatial');
    }

    // Check for personal context
    if (elements.people.length > 0 && !this.hasPersonalContext(content)) {
      missing.push('personal');
    }

    return missing;
  }

  private hasLocationContext(content: string): boolean {
    const locationPrepositions = /\b(?:in|at|near|by|inside|outside|around)\s+the\b/i;
    return locationPrepositions.test(content);
  }

  private hasPersonalContext(content: string): boolean {
    const personalIndicators = /\b(?:felt|thought|said|told|asked|responded|reacted)\b/i;
    return personalIndicators.test(content);
  }

  generateFollowUpQuestions(analysis: AnalysisResult): FollowUpQuestion[] {
    const questions: FollowUpQuestion[] = [];

    // Time-based questions
    if (analysis.missingContexts.includes('temporal')) {
      questions.push({
        type: 'timeframe',
        question: 'Do you remember what time of day this happened?',
        context: 'temporal'
      });
    }

    // Location-based questions
    analysis.elements.locations.forEach(location => {
      if (analysis.missingContexts.includes('spatial')) {
        questions.push({
          type: 'location_detail',
          question: `Can you tell me more about what the ${location.value} was like?`,
          context: 'spatial'
        });
      }
    });

    // People-based questions
    analysis.elements.people.forEach(person => {
      if (analysis.missingContexts.includes('personal')) {
        questions.push({
          type: 'person_detail',
          question: `How did ${person.value} respond to this?`,
          context: 'personal'
        });
      }
    });

    return questions;
  }

  private consolidateVerifiedDetails(elements: Record<ElementType, MemoryElement[]>): string[] {
    return Object.values(elements)
      .flat()
      .filter(element => element.verified)
      .map(element => element.value);
  }

  async generateGreeting(content: string, analysis: AnalysisResult): Promise<string> {
    try {
      const { elements, missingContexts } = analysis;
      let greeting = 'Let\'s continue with your story. ';

      // Reference verified details
      if (elements.events.length > 0 && elements.locations.length > 0) {
        const event = elements.events[0].value;
        const location = elements.locations[0].value;
        greeting += `You mentioned ${event} in the ${location}. `;
      }

      // Add a relevant follow-up question
      const followUps = this.generateFollowUpQuestions(analysis);
      if (followUps.length > 0) {
        greeting += followUps[0].question;
      }

      return greeting;
    } catch (error) {
      console.error('Error generating greeting:', error);
      return 'Let\'s continue with your story. What would you like to add?';
    }
  }
}

export const memoryAnalysisService = new MemoryAnalysisService();
export default MemoryAnalysisService;