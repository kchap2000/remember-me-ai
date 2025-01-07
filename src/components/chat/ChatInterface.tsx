import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useAuth } from '../../contexts/AuthContext';
import { useChatStore } from '../../store/useChatStore';
import { aiService } from '../../services/ai';
import type { Message } from '../../types/chat';

interface StoryMetadata {
  id?: string;
  title: string;
  year: number;
  tags: string[];
  connections: string[];
}

interface ChatInterfaceProps {
  storyContent: string;
  storyMetadata: StoryMetadata;
  onSuggestion: (suggestion: string) => void;
  onUndo: () => void;
}

export function ChatInterface({ 
  storyContent, 
  storyMetadata,
  onSuggestion,
  onUndo
}: ChatInterfaceProps) {
  const { currentUser } = useAuth();
  const { messages, sendMessage, loading, error } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef<boolean>(false);

  // Memoize story analysis to prevent unnecessary recalculations
  const storyAnalysis = useMemo(() => {
    const wordCount = storyContent.trim().split(/\s+/).length;
    const summary = storyContent.length > 500 
      ? `${storyContent.slice(0, 500)}...` 
      : storyContent;
    
    return {
      wordCount,
      summary,
      formattedAnalysis: `Your story is ${wordCount} words long. Here's a brief analysis:\n\n` +
        `Title: ${storyMetadata.title}\n` +
        `Year: ${storyMetadata.year}\n` +
        `Tags: ${storyMetadata.tags.join(', ')}\n\n` +
        `Current content: ${summary}`
    };
  }, [storyContent, storyMetadata]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Initialize chat with welcome message
  useEffect(() => {
    if (!initializedRef.current && currentUser) {
      initializedRef.current = true;
      const userName = currentUser.displayName?.split(' ')[0] || 'there';

      const welcomeMessage: Message = {
        id: Date.now().toString(),
        content: `Hey ${userName}! Let me know if you need any help with your story.`,
        sender: 'ai',
        timestamp: new Date()
      };

      sendMessage(welcomeMessage);
    }
  }, [currentUser, sendMessage]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Extract location from story content using regex
  const extractLocation = useCallback((content: string): string | undefined => {
    const locationMatch = content.match(/\b(?:in|at)\s+([A-Za-z\s,]+)/i);
    return locationMatch?.[1];
  }, []);

  const generateAIResponse = useCallback(async (
    userContent: string,
    isGeneralQuery: boolean
  ): Promise<string> => {
    try {
      if (isGeneralQuery) {
        const result = await aiService.getGeneralKnowledge(userContent, {
          year: storyMetadata.year,
          location: extractLocation(storyContent)
        });
        return result.text;
      } 
      
      return await aiService.generateSuggestion(userContent);
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error('Failed to generate response');
    }
  }, [storyMetadata.year, storyContent, extractLocation]);

  const handleMessageSend = useCallback(async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;
    
    // Create and send user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: trimmedContent,
      sender: 'user',
      timestamp: new Date()
    };
    sendMessage(userMessage);

    try {
      // Process message through unified AI service
      const response = await aiService.processMessage(trimmedContent, {
        storyContent,
        year: storyMetadata.year,
        location: extractLocation(storyContent)
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to process message');
      }

      // Send AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.text,
        sender: 'ai',
        timestamp: new Date()
      };
      sendMessage(aiMessage);

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error analyzing your story. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      };
      sendMessage(errorMessage);
    }
  }, [sendMessage, storyAnalysis, generateAIResponse]);

  return (
    <div className="relative flex flex-col h-full transition-all duration-300">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {messages.map(message => (
            <ChatMessage
              key={message.id}
              message={message}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Chat Input Area */}
      <div className="sticky bottom-0 left-0 right-0 bg-[#16133f]/95 
                    backdrop-blur-sm border-t border-[#2b2938]/50 rounded-b-lg
                    shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.2)]">
        <ChatInput 
          onSend={handleMessageSend}
          disabled={loading}
        />
      </div>
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <p className="text-gray-200 px-4 py-2">Loading...</p>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-red-500/90">
          <p className="text-white text-sm text-center">{error}</p>
        </div>
      )}
    </div>
  );
}