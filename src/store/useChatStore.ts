// src/store/useChatStore.ts

import { create } from 'zustand';
import { aiService } from '../services/ai.service';
import type { Message, ChatState, ChatActions, StoryContext, AIAssistantState } from '../types/chat';

interface InitState {
  storyId: string | null;
  initialized: boolean;
  lastAnalysis: number;
  lastMessageTime: number;
}

type ChatStore = ChatState & ChatActions & AIAssistantState & {
  initState: InitState;
  initializeChat: (params: {
    storyId: string;
    content: string;
    metadata: {
      title: string;
      year: number;
      tags: string[];
      connections: string[];
    };
    userName?: string;
  }) => Promise<void>;
};

// Validation helper
const isValidMessage = (message: Partial<Message>): message is Message => {
  return Boolean(
    message &&
    typeof message.id === 'string' &&
    typeof message.content === 'string' &&
    message.content.trim() !== '' &&
    (message.sender === 'ai' || message.sender === 'user') &&
    message.timestamp instanceof Date
  );
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  loading: false,
  error: null,
  activeTab: 'suggestions',
  suggestions: [],
  appliedSuggestions: [],
  storyContext: {
    content: '',
    metadata: {
      title: '',
      tags: [],
      characters: []
    }
  },
  initState: {
    storyId: null,
    initialized: false,
    lastMessageTime: 0,
    lastAnalysis: 0
  },

  // AI Assistant Actions
  setActiveTab: (tab: 'suggestions' | 'analysis') => 
    set({ activeTab: tab }),

  sendMessage: (message: Message) => {
    // Validate message format
    if (!isValidMessage(message)) {
      console.error('Invalid message format:', message);
      set({ error: 'Invalid message format' });
      return;
    }
    
    set((state) => ({
      messages: [...state.messages, message],
      error: null, // Clear any previous errors
      initState: {
        ...state.initState,
        lastMessageTime: Date.now()
      }
    }));
  },

  generateSuggestions: async () => {
    set({ loading: true, error: null });
    try {
      const { storyContext } = get();
      const suggestions = await aiService.generateSuggestions(storyContext.content);
      
      if (!Array.isArray(suggestions)) {
        throw new Error('Invalid suggestions format received');
      }
      
      set({ suggestions, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to generate suggestions',
        loading: false 
      });
    }
  },

  setStoryContext: (context: Partial<StoryContext>) => {
    if (!context || typeof context !== 'object') {
      console.error('Invalid context format:', context);
      return;
    }
    
    set(state => ({
      storyContext: {
        ...state.storyContext,
        ...context,
        lastUpdated: Date.now()
      }
    }));
  },

  updateStoryContent: (content: string) => {
    if (typeof content !== 'string') {
      console.error('Invalid content format:', content);
      return;
    }

    set(state => ({
      storyContext: {
        ...state.storyContext,
        content,
        lastUpdated: Date.now()
      }
    }));
  },

  updateStoryMetadata: (metadata: Partial<StoryContext['metadata']>) => {
    if (!metadata || typeof metadata !== 'object') {
      console.error('Invalid metadata format:', metadata);
      return;
    }

    set(state => ({
      storyContext: {
        ...state.storyContext,
        metadata: {
          ...state.storyContext.metadata,
          ...metadata
        },
        lastUpdated: Date.now()
      }
    }));
  },

  initializeChat: async (params) => {
    const { storyId, content, metadata, userName } = params;
    const { initState } = get();

    // Validate required parameters
    if (!storyId || typeof content !== 'string' || !metadata) {
      set({ error: 'Missing required parameters for chat initialization' });
      return;
    }

    // Skip if already initialized and content hasn't changed significantly
    if (initState.storyId === storyId && initState.initialized) {
      return;
    }

    set({ loading: true, error: null });

    try {
      // Update story context
      get().setStoryContext({
        content,
        metadata: {
          title: metadata.title,
          year: metadata.year,
          tags: metadata.tags,
          characters: []
        }
      });
      
      // Analyze content
      const result = await aiService.analyzeStory(content, {
        temperature: 0.7
      });

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to analyze content');
      }

      // Create welcome message
      const greeting = userName 
        ? `Hey ${userName}! Based on your story, here's what I noticed:\n\n`
        : "Based on your story, here's what I noticed:\n\n";

      const welcomeMessage: Message = {
        id: `welcome-${Date.now()}`,
        content: greeting + (result.analysis || ''),
        sender: 'ai',
        timestamp: new Date()
      };

      // Update state
      set({
        messages: [welcomeMessage],
        loading: false,
        error: null,
        suggestions: result.suggestions || [],
        initState: {
          storyId,
          initialized: true,
          lastAnalysis: Date.now(),
          lastMessageTime: Date.now()
        }
      });

    } catch (error) {
      console.error('Error initializing chat:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize chat',
        initState: {
          ...initState,
          initialized: false
        }
      });
    }
  },

  applySuggestion: (suggestion: string) => {
    if (typeof suggestion !== 'string' || !suggestion.trim()) {
      console.error('Invalid suggestion format:', suggestion);
      return;
    }

    set(state => ({
      storyContext: {
        ...state.storyContext,
        content: state.storyContext.content + '\n' + suggestion,
        lastUpdated: Date.now()
      },
      appliedSuggestions: [...state.appliedSuggestions, suggestion],
      messages: [
        ...state.messages,
        {
          id: `suggestion-${Date.now()}`,
          content: suggestion,
          sender: 'ai',
          timestamp: new Date()
        }
      ]
    }));
  },

  undoSuggestion: () =>
    set(state => {
      const lastSuggestion = state.appliedSuggestions[state.appliedSuggestions.length - 1];
      if (!lastSuggestion) return state;

      return {
        storyContext: {
          ...state.storyContext,
          content: state.storyContext.content.replace(`\n${lastSuggestion}`, ''),
          lastUpdated: Date.now()
        },
        appliedSuggestions: state.appliedSuggestions.slice(0, -1),
        messages: state.messages.filter(msg => msg.content !== lastSuggestion)
      };
    }),
  
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearMessages: () => set({ messages: [], error: null })
}));