// src/store/useChatStore.ts

import { create } from 'zustand';
import { aiService } from '../services/ai.service';
import { chatService } from '../services/chat.service';
import type { 
  Message, 
  ChatState, 
  ChatActions, 
  StoryContext, 
  AIAssistantState,
  AnalysisContext 
} from '../types/chat';

interface InitState {
  storyId: string | null;
  initialized: boolean;
  lastAnalysis: number;
  lastMessageTime: number;
  analysisContext: AnalysisContext | null;
}

type ChatStore = ChatState & ChatActions & AIAssistantState & {
  initState: InitState;
  isInitialized: boolean;
  setInitialized: (initialized: boolean) => void;
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
  setSuggestions: (suggestions: string[]) => void;
  setAnalysisContext: (context: AnalysisContext) => void;
  pendingUpdates: {
    originalContent: string;
    updatedContent: string;
    chatContext?: string;
    timestamp: number;
  } | null;
  setPendingUpdates: (updates: { originalContent: string; updatedContent: string; chatContext?: string }) => void;
};

// Validation helper
const isValidMessage = (message: Partial<Message>): message is Message => {
  return Boolean(
    message &&
    typeof message.id === 'string' &&
    typeof message.content === 'string' &&
    (message.isGreeting || message.content.trim() !== '') &&
    (message.sender === 'ai' || message.sender === 'user') &&
    message.timestamp instanceof Date
  );
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  loading: false,
  isInitialized: false,
  error: null,
  pendingUpdates: null,
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
    lastAnalysis: 0,
    analysisContext: null
  },

  // AI Assistant Actions
  setAnalysisContext: (context: AnalysisContext) => 
    set(state => ({
      initState: {
        ...state.initState,
        analysisContext: context,
        lastAnalysis: Date.now()
      }
    })),

  setPendingUpdates: (updates: { originalContent: string; updatedContent: string; chatContext?: string }) => 
    set({ 
      pendingUpdates: updates ? { ...updates, timestamp: Date.now() } : null 
    }),

  setInitialized: (initialized: boolean) => set({ isInitialized: initialized }),

  sendMessage: async (message: Message) => {
    // Validate message format
    if (!isValidMessage(message)) {
      console.error('Invalid message format:', message);
      set({ error: 'Invalid message format' });
      return;
    }
    
    const state = get();
    const analysisContext = state.initState.analysisContext;
    const storyContext = state.storyContext;
    const messages = state.messages;

    set((state) => ({
      messages: [...state.messages, message],
      error: null,
      initState: {
        ...state.initState,
        lastMessageTime: Date.now()
      }
    }));

    // If this is a user message or greeting, get AI response with context
    if (message.sender === 'user' || message.isGreeting) {
      set({ loading: true });
      try {
        const response = await aiService.processMessage(
          message.isGreeting ? '' : message.content,
          {
            storyContent: storyContext.content || '',
            analysisContext: analysisContext,
            messageHistory: messages,
            isGreeting: message.isGreeting
          }
        );

        if (response.success) {
          const aiMessage: Message = {
            id: Date.now().toString(),
            content: response.text,
            sender: 'ai',
            timestamp: new Date()
          };
          set(state => ({
            messages: [...state.messages, aiMessage],
            loading: false
          }));
        } else {
          throw new Error(response.error || 'Failed to get AI response');
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to process message',
          loading: false 
        });
      }
    }
  },

  generateSuggestions: async () => {
    set({ loading: true, error: null });
    try {
      const { storyContext } = get();
      
      if (!storyContext.content?.trim()) {
        set({ 
          suggestions: [],
          loading: false 
        });
        return;
      }
      
      const { analysisContext } = get().initState;

      const suggestions = await aiService.generateSuggestions(
        storyContext.content,
        { analysisContext }
      );
      
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

    if (!storyId || typeof content !== 'string' || !metadata) {
      set({ error: 'Missing required parameters for chat initialization' });
      return;
    }

    if (initState.storyId === storyId && initState.initialized) {
      return;
    }

    set({ loading: true, error: null });

    try {
      // Load previous chat history
      const history = await chatService.loadChatHistory(userId);
      
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

      // Store analysis context
      get().setAnalysisContext({
        analysis: result.analysis || '',
        elements: result.elements,
        themes: result.themes || [],
        timestamp: Date.now()
      });

      // Create welcome message
      const greeting = userName 
        ? `Hey ${userName}! Based on your story, here's what I noticed:\n\n`
        : "Based on your story, here's what I noticed:\n\n";

      const welcomeMessage = {
        id: `welcome-${Date.now()}`,
        content: greeting + (result.analysis || ''),
        sender: 'ai',
        timestamp: new Date()
      };

      // Save welcome message
      await chatService.saveChatHistory(userId, welcomeMessage);

      // Update state
      set({
        messages: [...history, welcomeMessage],
        loading: false,
        error: null,
        suggestions: result.suggestions || [],
        initState: {
          storyId,
          initialized: true,
          lastAnalysis: Date.now(),
          lastMessageTime: Date.now(),
          analysisContext: {
            analysis: result.analysis || '',
            elements: result.elements,
            themes: result.themes || [],
            timestamp: Date.now()
          }
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
  clearMessages: () => set(state => ({
    messages: [],
    error: null,
    suggestions: [],
    appliedSuggestions: [],
    pendingUpdates: null,
    initState: {
      ...state.initState,
      lastMessageTime: Date.now()
    }
  }))
}));