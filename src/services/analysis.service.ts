// src/services/analysis.service.ts

import { memoryAnalysisService } from './memoryAnalysis.service';
import type { 
  AnalysisResult,
  FollowUpQuestion,
  MemoryElement,
  StoryEnhancement
} from '../types/analysis';

/**
 * The AnalysisService is responsible for:
 * 1. High-level story analysis (identifying elements, missing context).
 * 2. Generating follow-up questions about the story.
 * 3. Providing suggestions for story enhancement or structure.
 * 
 * It does NOT handle direct AI calls (e.g., OpenAI prompts).
 * That responsibility goes to ai.service.ts.
 */
class AnalysisService {
  /**
   * analyzeContent
   * ------------------
   * Main entry point for analyzing story text. 
   * This method relies on `memoryAnalysisService` (which might contain
   * specialized logic or calls to external endpoints).
   * 
   * We also merge in additional local logic for identifying 
   * missing contexts, extracting elements, etc.
   */
  public async analyzeContent(content: string): Promise<AnalysisResult> {
    try {
      // 1. Perform base analysis from memoryAnalysisService
      const baseAnalysis = await memoryAnalysisService.analyzeContent(content);

      // 2. Locally extract memory elements again (if needed) for deeper logic
      //    or unify with what memoryAnalysisService returns:
      const localElements = this.extractMemoryElements(content);

      // 3. Identify missing contexts (time of day, cause/effect, etc.)
      const missingContextQuestions = this.identifyMissingContext(localElements, content);

      // 4. Generate follow-up questions about mentioned elements (people, events, etc.)
      //    We can pass an empty array or some placeholder if you want to merge logic.
      const elementQuestions = this.generateFollowUpQuestions(localElements, []);

      // 5. Combine all follow-up questions
      const allQuestions: FollowUpQuestion[] = [
        ...missingContextQuestions,
        ...elementQuestions
      ];

      // 6. Merge everything into a final AnalysisResult object
      return {
        // If memoryAnalysisService already returns an object with .elements, .missingContexts, etc.
        // you can unify them here. Example:
        elements: localElements,
        missingContexts: baseAnalysis.missingContexts || [],
        verifiedDetails: baseAnalysis.verifiedDetails || [],
        followUpQuestions: allQuestions
      };
    } catch (error) {
      console.error('Error in analysis service:', error);
      return {
        elements: [],
        missingContexts: [],
        verifiedDetails: [],
        followUpQuestions: []
      };
    }
  }

  /**
   * generateQuestions
   * ------------------
   * If you want a simpler method that JUST returns
   * the questions (without the entire AnalysisResult),
   * you can expose this.  Internally, it calls `analyzeContent`.
   */
  public async generateQuestions(content: string): Promise<FollowUpQuestion[]> {
    const analysis = await this.analyzeContent(content);
    return analysis.followUpQuestions || [];
  }

  /**
   * extractMemoryElements
   * ------------------
   * Uses regex or other logic to extract certain types of elements
   * from the story text (people, locations, dates, etc.).
   */
  private extractMemoryElements(content: string): MemoryElement[] {
    const elements: MemoryElement[] = [];

    // Example patterns:
    const patterns = {
      people: /\b(?:my\s+)?(?:mother|father|dad|sister|brother|sibling)\b/gi,
      locations: /\b(?:hospital|kitchen|school|home)\b/gi,
      events: /\b(?:tripped|hit|born|stitches)\b/gi,
      dates: /\b(?:\d{4}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s+\d{4})?)\b/gi,
      objects: /\b(?:briefcase|mirror|eye)\b/gi
    };

    Object.entries(patterns).forEach(([category, pattern]) => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => {
        elements.push({
          type: category as MemoryElement['type'],
          value: match.toLowerCase(),
          context: this.getElementContext(content, match)
        });
      });
    });

    return elements;
  }

  /**
   * getElementContext
   * ------------------
   * Grabs the sentence or surrounding text for a matched element.
   */
  private getElementContext(content: string, element: string): string {
    const sentencePattern = new RegExp(
      `[^.!?]*(?<=[.!?\\s])${element}(?=[\\s.!?])[^.!?]*[.!?]`,
      'i'
    );
    const match = content.match(sentencePattern);
    return match ? match[0].trim() : '';
  }

  /**
   * generateFollowUpQuestions
   * ------------------
   * Creates questions based on discovered elements (people, events, etc.).
   * 
   * The second param `missingContexts` might be used if you want to pass in
   * strings representing missing pieces, though it's empty in this example.
   */
  private generateFollowUpQuestions(
    elements: MemoryElement[],
    missingContexts: string[]
  ): FollowUpQuestion[] {
    const questions: FollowUpQuestion[] = [];

    // Temporal Questions
    if (!elements.some(el => el.type === 'timeframes')) {
      questions.push({
        type: 'timeframe',
        text: 'When did this happen?',
        context: 'temporal',
        priority: 'high',
        category: 'time'
      });
      
      questions.push({
        type: 'timeframe',
        text: 'What time of day was it?',
        context: 'temporal',
        priority: 'medium',
        category: 'time'
      });
    }

    // Location Questions
    if (!elements.some(el => el.type === 'locations')) {
      questions.push({
        type: 'location_detail',
        text: 'Where did this take place?',
        context: 'spatial',
        priority: 'high',
        category: 'location'
      });
    }

    // Emotional Context
    questions.push({
      type: 'emotion_detail',
      text: 'How did you feel during this moment?',
      context: 'emotional',
      priority: 'medium',
      category: 'emotion'
    });

    // Sensory Details
    questions.push({
      type: 'sensory_detail',
      text: 'What do you remember seeing or hearing?',
      context: 'physical',
      priority: 'medium',
      category: 'sensory'
    });

    // If you did want to handle missing context strings, do it here.
    missingContexts.forEach(contextStr => {
      questions.push({
        type: 'context',
        text: `Do you remember ${contextStr}?`
      });
    });

    // Additional questions about discovered elements
    elements.forEach(element => {
      switch (element.type) {
        case 'people':
          questions.push({
            type: 'reaction',
            text: `How did ${element.value} react to this?`,
            context: 'personal',
            priority: 'high',
            category: 'people',
            relatedElements: [element.value]
          });
          
          questions.push({
            type: 'emotion_detail',
            text: `What was ${element.value}'s mood like?`,
            context: 'emotional',
            priority: 'medium',
            category: 'people',
            relatedElements: [element.value]
          });
          break;
          
        case 'events':
          questions.push({
            type: 'cause_effect',
            text: `What led to ${element.value}?`,
            context: 'temporal',
            priority: 'high',
            category: 'events',
            relatedElements: [element.value]
          });
          
          questions.push({
            type: 'detail',
            text: `What happened immediately after ${element.value}?`,
            context: 'temporal',
            priority: 'medium',
            category: 'events',
            relatedElements: [element.value]
          });
          break;
          
        case 'objects':
          questions.push({
            type: 'detail',
            text: `Can you describe the ${element.value} in more detail?`,
            context: 'physical',
            priority: 'low',
            category: 'objects',
            relatedElements: [element.value]
          });
          break;
        default:
          // Optionally ask something else for other categories
          break;
      }
    });

    // Sort questions by priority
    return questions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low'];
    });
  }

  /**
   * getNextQuestion
   * ------------------
   * Returns the next most relevant unanswered question
   */
  public getNextQuestion(questions: FollowUpQuestion[]): FollowUpQuestion | null {
    return questions.find(q => !q.answered) || null;
  }

  /**
   * markQuestionAnswered
   * ------------------
   * Marks a question as answered and returns updated questions array
   */
  public markQuestionAnswered(
    questions: FollowUpQuestion[],
    answeredQuestion: FollowUpQuestion
  ): FollowUpQuestion[] {
    return questions.map(q => 
      q === answeredQuestion ? { ...q, answered: true } : q
    );
    return questions;
  }

  /**
   * identifyMissingContext
   * ------------------
   * Returns an array of FollowUpQuestion about context we expect but didn't find
   * in the user’s content (like time of day, cause/effect).
   */
  private identifyMissingContext(
    elements: MemoryElement[],
    content: string
  ): FollowUpQuestion[] {
    const questions: FollowUpQuestion[] = [];

    // Example: If 'time of day' isn't detected
    if (
      !content.includes('time') &&
      !content.includes("o'clock") &&
      !content.includes('morning') &&
      !content.includes('afternoon') &&
      !content.includes('evening')
    ) {
      questions.push({
        type: 'timeframe',
        text: 'Do you remember what time of day this happened?',
        relevance: 'temporal_context'
      });
    }

    // Example: If user mentions 'tripped' but not 'because'
    if (content.includes('tripped') && !content.includes('because')) {
      questions.push({
        type: 'cause',
        text: 'What caused you to trip? Was there something on the floor?',
        relevance: 'cause_effect'
      });
    }

    return questions;
  }

  /**
   * generateEnhancement
   * ------------------
   * Provide suggestions for how to enhance or structure the story
   * based on the analysis. This can include narrative order, sensory prompts, etc.
   */
  public async generateEnhancement(
    content: string,
    analysis: AnalysisResult
  ): Promise<StoryEnhancement> {
    // You can implement these helper methods or inline them:
    const structure = this.suggestStructure(analysis.elements);
    const sensoryPrompts = this.generateSensoryPrompts(analysis.elements);

    return {
      structure,
      sensoryPrompts,
      suggestedOrder: this.suggestNarrativeOrder(analysis.elements)
    };
  }

  /**
   * generateGreeting
   * ------------------
   * A simple demonstration of how you might generate a short greeting
   * or transition text based on the most recent element or question.
   */
  public async generateGreeting(
    content: string,
    analysis: AnalysisResult
  ): Promise<string> {
    // If analysis.elements is an array, find the last element
    const recentElement = Array.isArray(analysis.elements)
      ? analysis.elements[analysis.elements.length - 1]
      : undefined;
    // If followUpQuestions is an array
    const followUp = analysis.followUpQuestions?.[0];

    let greeting = 'Let’s continue with your story. ';

    if (recentElement) {
      greeting += `You were telling me about ${recentElement.value}. `;
    }

    if (followUp) {
      greeting += followUp.text;
    }

    return greeting;
  }

  // ----------------------------------------------------------------------
  // Below are optional stubs for the enhancement features. 
  // They’re placeholders—adapt as you like:
  // ----------------------------------------------------------------------

  private suggestStructure(elements: MemoryElement[]): string {
    // e.g., Intro / Body / Conclusion
    return 'Try a beginning that sets the scene, a middle that builds tension, and an end that resolves it.';
  }

  private generateSensoryPrompts(elements: MemoryElement[]): string[] {
    // e.g., prompts for sight, smell, sound, taste, touch
    return ['What did you see?', 'Were there any distinctive smells?'];
  }

  private suggestNarrativeOrder(elements: MemoryElement[]): string {
    // e.g., chronological or thematic
    return 'Chronological order might make it easier for readers to follow.';
  }
}

export const analysisService = new AnalysisService();
