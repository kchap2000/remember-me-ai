import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useAuth } from '../../contexts/AuthContext';
import { useChatStore } from '../../store/useChatStore';
import { aiService } from '../../services/ai.service';
import type { Message } from '../../types/chat';

interface ChatInterfaceProps {
  storyContent: string;
  storyMetadata: {
    id?: string;
    title: string;
    year: number;
    tags: string[];
    connections: string[];
  };
  onSuggestion: (type: string, content: string) => void;
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
  const welcomeShownRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Send welcome message when component mounts
  useEffect(() => {
    if (!welcomeShownRef.current) {
      welcomeShownRef.current = true;
      const userName = currentUser?.displayName?.split(' ')[0] || '';

      const welcomeMessage: Message = {
        id: Date.now().toString(),
        content: `Hey ${userName}! Let me know if you need any suggestions for your story by clicking the microphone and speaking or typing your question in the text box below.`,
        sender: 'ai',
        timestamp: new Date()
      };

      sendMessage(welcomeMessage);
    }
  }, [currentUser, sendMessage]);

  // Reset welcome message flag when story changes
  useEffect(() => {
    return () => {
      welcomeShownRef.current = false;
    };
  }, [storyMetadata.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleMessageSend = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };

    sendMessage(userMessage);

    try {
      const result = await aiService.analyzeMemory(content);
      
      if (result.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: result.text,
          sender: 'ai',
          timestamp: new Date()
        };
        sendMessage(aiMessage);
      } else {
        throw new Error(result.error || 'Failed to analyze message');
      }
    } catch (err) {
      console.error('Error processing message:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I had trouble processing that. Could you try rephrasing your question?',
        sender: 'ai',
        timestamp: new Date()
      };
      sendMessage(errorMessage);
    }
  };

  return (
    <div className="relative flex flex-col h-full transition-all duration-300">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {messages.map(message => (
            <ChatMessage
              key={message.id}
              message={message}
              onActionClick={onSuggestion}
              onUndo={onUndo}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="sticky bottom-0 left-0 right-0 bg-[#16133f]/95 
                    backdrop-blur-sm border-t border-[#2b2938]/50 rounded-b-lg
                    shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.2)]">
        <ChatInput onSend={handleMessageSend} />
      </div>
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <p className="text-gray-200 px-4 py-2">Loading...</p>
        </div>
      )}
      
      {error && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-red-500/90">
          <p className="text-white text-sm text-center">{error}</p>
        </div>
      )}
    </div>
  );
}