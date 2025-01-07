// src/types/analysis.ts

// Element Types
export type ElementType = 'people' | 'locations' | 'events' | 'timeframes' | 'objects';

// Question Types with specific contexts
export type QuestionType = 
  | 'context' 
  | 'reaction' 
  | 'detail' 
  | 'sensory' 
  | 'emotion' 
  | 'timeframe' 
  | 'location_detail' 
  | 'person_detail';

// Context Types
export type ContextType = 'temporal' | 'spatial' | 'personal' | 'emotional' | 'physical';

// Base Memory Element
export interface MemoryElement {
  type: ElementType;
  value: string;
  context: string;
  verified: boolean;
  confidence?: number;
  metadata?: {
    originalText: string;
    position: number;
  };
}

// Follow-up Question with enhanced context
export interface FollowUpQuestion {
  type: QuestionType;
  text: string;
  context: ContextType;
  priority?: number;
  relatedElements?: string[];
}

// Complete Analysis Result
export interface StoryAnalysis {
  success: boolean;
  error?: string;
  analysis?: string;
  elements: Record<ElementType, MemoryElement[]>;
  suggestions: string[];
  missingContexts: string[];
}

export interface AnalysisResult {
  elements: {
    [K in ElementType]: MemoryElement[];
  };
  missingContexts: ContextType[];
  verifiedDetails: string[];
  timestamp: number;
  metadata?: {
    totalElements: number;
    processingTime: number;
    confidence: number;
  };
}

// Enhancement Suggestions
export interface Enhancement {
  sensoryPrompts: string[];
  structurePrompts: string[];
  emotionalPrompts: string[];
  priority: number;
}

// Memory Context
export interface MemoryContext {
  elements: MemoryElement[];
  timeframe?: string;
  location?: string;
  people?: string[];
  emotions?: string[];
  verified: boolean;
}