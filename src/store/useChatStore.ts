import { create } from 'zustand';
import { aiService } from '../services/ai.service';
import type { Message, ChatState, ChatActions } from '../types/chat';

interface InitState {
  storyId: string | null;
  initialized: boolean;
  lastAnalysis: number;
  lastMessageTime: number;
  contentHash: string;
}

type ChatStore = ChatState & ChatActions & {
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

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  loading: false,
  error: null,
  initState: {
    storyId: null,
    initialized: false,
    lastMessageTime: 0,
    contentHash: ''
  },
  
  initializeChat: async (params) => {
    const { storyId, content, metadata, userName } = params;
    const { initState } = get();

    // Skip if already initialized and content hasn't changed significantly
    if (initState.storyId === storyId && 
        initState.initialized && 
        Math.abs(content.length - initState.contentHash.length) < 100) {
      return;
    }

    set({ loading: true, error: null });

    try {
      console.log('Initializing chat with content:', content.slice(0, 100) + '...');
      
      // Step 1: Clean and analyze the content
      const analysis = await aiService.analyzeMemory(content, {
        temperature: 0.7
      }).catch(err => {
        console.error('AI service error:', err);
        throw new Error('Failed to analyze content: ' + (err.message || 'Unknown error'));
      });

      if (!analysis) {
        throw new Error('Analysis returned no results');
      }

      if (!analysis.success) {
        console.error('Analysis failed:', analysis);
        throw new Error(analysis.error || 'Failed to analyze content');
      }

      console.log('Analysis completed successfully:', analysis);

      // Step 2: Generate welcome message
      const greeting = userName 
        ? `Hey ${userName}! Based on your story, here's what I noticed:\n\n`
        : "Based on your story, here's what I noticed:\n\n";

      // Step 3: Create welcome message
      const welcomeMessage: Message = {
        id: `welcome-${Date.now()}`,
        content: greeting + analysis.text,
        sender: 'ai',
        timestamp: new Date()
      };

      // Step 4: Update state with all required fields
      set({
        messages: [welcomeMessage],
        loading: false,
        error: null,
        initState: {
          storyId,
          initialized: true,
          lastAnalysis: Date.now(),
          lastMessageTime: Date.now(),
          contentHash: content.slice(0, 100)
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
  
  sendMessage: (message: Message) => {
    if (!message.id || !message.content || !message.sender) {
      console.error('Invalid message format:', message);
      return;
    }
    
    set((state) => ({
      messages: [...state.messages, message],
      initState: {
        ...state.initState,
        lastMessageTime: Date.now()
      }
    }));
  },
  
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearMessages: () => set({ messages: [] })
}));