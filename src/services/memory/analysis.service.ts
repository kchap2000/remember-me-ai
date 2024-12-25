import { MEMORY_PATTERNS } from './patterns.service';
import type { 
  AnalysisResult, 
  MemoryElement,
  ElementType,
  FollowUpQuestion 
} from '../../types/analysis';

class MemoryAnalysisService {
  async analyzeContent(content: string): Promise<AnalysisResult> {
    const startTime = Date.now();
    if (!content?.trim()) {
      return this.createEmptyAnalysis();
    }

    try {
      const elements = this.extractElements(content);
      const missingContexts = this.identifyMissingContext(elements, content);
      const verifiedDetails = this.consolidateVerifiedDetails(elements);

      const processingTime = Date.now() - startTime;
      const confidence = this.calculateConfidence(elements);
      return {
        elements,
        missingContexts,
        verifiedDetails,
        timestamp: Date.now(),
        metadata: {
          totalElements: Object.values(elements).flat().length,
          processingTime,
          confidence
        }
      };
    } catch (error) {
      console.error('Error analyzing content:', error);
      return this.createEmptyAnalysis();
    }
  }

  private calculateConfidence(elements: Record<ElementType, MemoryElement[]>): number {
    const totalElements = Object.values(elements).flat().length;
    const verifiedElements = Object.values(elements)
      .flat()
      .filter(el => el.verified)
      .length;
    
    return totalElements > 0 ? verifiedElements / totalElements : 0;
  }
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

  generateFollowUpQuestions(analysis: AnalysisResult): FollowUpQuestion[] {
    const questions: FollowUpQuestion[] = [];

    // Add questions based on missing context
    analysis.missingContexts.forEach(context => {
      const question = this.generateContextQuestion(context, analysis.elements);
      if (question) questions.push(question);
    });

    return questions;
  }

  private generateContextQuestion(
    context: string, 
    elements: Record<ElementType, MemoryElement[]>
  ): FollowUpQuestion | null {
    switch (context) {
      case 'temporal':
        return {
          type: 'timeframe',
          text: 'When did this happen?',
          context: 'temporal'
        };
      case 'spatial':
        const location = elements.locations[0]?.value;
        return location ? {
          type: 'location_detail',
          text: `What was the ${location} like?`,
          context: 'spatial'
        } : null;
      default:
        return null;
    }
  }

  private createEmptyAnalysis(): AnalysisResult {
    return {
      elements: {} as Record<ElementType, MemoryElement[]>,
      missingContexts: [],
      verifiedDetails: [],
      timestamp: Date.now()
    };
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

  private consolidateVerifiedDetails(
    elements: Record<ElementType, MemoryElement[]>
  ): string[] {
    return Object.values(elements)
      .flat()
      .filter(element => element.verified)
      .map(element => element.value);
  }
}

export const memoryAnalysis = new MemoryAnalysisService();