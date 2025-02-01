// src/types/chat.ts

import type { FirebaseFirestore } from '@firebase/firestore-types';
import type { StoryElement } from './analysis';

export interface StoryContext {
  content: string;
  metadata: {
    title: string;
    year?: number;
    tags: string[];
    characters: Array<{
      name: string;
      relation: string;
    }>;
  };
  recentAnalysis?: StoryElement[];
  lastUpdated?: number;
}
export interface AnalysisContext {
  analysis: string;
  elements: Record<string, any>;
  themes: string[];
  timestamp: number;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date | FirebaseFirestore.Timestamp;
  isGreeting?: boolean;
  quickReplies?: QuickReply[];
}

export interface QuickReply {
  label: string;
  action: string;
  icon?: string;
}

export function getMessageTimestamp(message: Message): number {
  if (message.timestamp instanceof Date) {
    return message.timestamp.getTime();
  }
  return message.timestamp.toDate().getTime();
}

export interface ConversationContext {
  recentTopics: string[];
  currentStoryDetails: {
    mainTopic?: string;
    timeframe?: string;
    locations?: string[];
    people?: string[];
    emotions?: string[];
  };
  analysisContext?: AnalysisContext;
  userPreferences: {
    detailLevel: 'brief' | 'detailed';
    tone: 'casual' | 'formal';
  };
  messageHistory: {
    lastUserMessage?: string;
    lastAiResponse?: string;
    topicStack: string[];
  };
}

export type ContextUpdateAction = 
  | { type: 'ADD_TOPIC'; payload: string }
  | { type: 'UPDATE_STORY_DETAILS'; payload: Partial<ConversationContext['currentStoryDetails']> }
  | { type: 'SET_PREFERENCE'; payload: Partial<ConversationContext['userPreferences']> }
  | { type: 'UPDATE_HISTORY'; payload: Partial<ConversationContext['messageHistory']> };

export interface ChatState {
  messages: Message[];
  initialized: boolean;
  storyContext: StoryContext;
  loading: boolean;
  error: string | null;
}

export interface ChatActions {
  sendMessage: (message: Message) => void;
  setStoryContext: (context: Partial<StoryContext>) => void;
  updateStoryContent: (content: string) => void;
  updateStoryMetadata: (metadata: Partial<StoryContext['metadata']>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  setInitialized: (initialized: boolean) => void;
}

export interface AIAssistantState {
  activeTab: 'suggestions' | 'analysis';
  suggestions: string[];
  appliedSuggestions: string[];
  setActiveTab: (tab: 'suggestions' | 'analysis') => void;
  generateSuggestions: () => Promise<void>;
}