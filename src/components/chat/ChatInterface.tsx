import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, MessageCircle, ArrowUpCircle, Trash2 } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useAuth } from '../../contexts/AuthContext';
import { useChatStore } from '../../store/useChatStore';
import { StoryReviewModal } from '../story/StoryReviewModal';
import { aiService } from '../../services/ai.service';
import { cn } from '../../utils/cn';
import type { Message } from '../../types/chat';

interface StoryMetadata {
  id?: string;
  title: string;
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
  const [isUpdating, setIsUpdating] = useState(false);
  const { currentUser } = useAuth();
  const { 
    messages, 
    clearMessages,
    storyContext,
    isInitialized,
    setStoryContext,
    sendMessage, 
    loading, 
    error,
    setError,
    pendingUpdates,
    setPendingUpdates,
    setInitialized
  } = useChatStore(state => ({
    loading: state.loading,
    error: state.error,
    setError: state.setError,
    messages: state.messages,
    isInitialized: state.isInitialized,
    storyContext: state.storyContext,
    setStoryContext: state.setStoryContext,
    sendMessage: state.sendMessage,
    pendingUpdates: state.pendingUpdates,
    setPendingUpdates: state.setPendingUpdates,
    setInitialized: state.setInitialized
  }));

  // Send initial greeting when component mounts
  useEffect(() => {
    if (!isInitialized && storyContext.content) {
      sendMessage({
        id: Date.now().toString(),
        content: '',
        sender: 'user',
        timestamp: new Date(), 
        isGreeting: true
      });
      setInitialized(true);
    }
  }, [isInitialized, storyContext.content, sendMessage, setInitialized]);

  // Update story context when props change
  useEffect(() => {
    setStoryContext({
      content: storyContent,
      metadata: {
        title: storyMetadata.title,
        tags: storyMetadata.tags || [],
        characters: []
      }
    });
  }, [storyContent, storyMetadata, setStoryContext]);

  const handleMessageSubmit = useCallback(async (content: string) => {
    if (!content.trim()) return;
    // Add user message to chat
    sendMessage({
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date()
    });
  }, [sendMessage]);

  /**
   * Uses LangChain memory (not manual slicing of messages).
   * We still capture the entire chat for the modal's display only.
   */
  const handleUpdateStory = useCallback(async () => {
    if (messages.length === 0) return;
    setIsUpdating(true);
    setError(null);

    // Get the last 5 messages for context
    const recentMessages = messages.slice(-5);
    const chatContext = recentMessages
      .map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.content}`)
      .join('\n');

    try {
      const response = await aiService.processMessage('', {
        storyContent,
        messageHistory: recentMessages,
        updateMode: true
      });

      if (response.success && response.text) {
        setPendingUpdates({
          originalContent: storyContent,
          updatedContent: response.text,
          chatContext
        });
      } else {
        throw new Error(response.error || 'Failed to generate story update');
      }
    } catch (error) {
      console.error('Error updating story:', error);
      setError('Failed to update story. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  }, [messages, storyContent, setPendingUpdates, setError]);

  return (
    <div className="relative flex flex-col h-full transition-all duration-300">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 p-4 
        bg-background-secondary/95 backdrop-blur-sm border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-semibold text-text-primary">AI Writing Assistant</h2>
          {messages.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear the chat history?')) {
                  clearMessages();
                }
              }}
              className={cn(
                "ml-4 p-1.5 rounded-lg transition-colors",
                "text-text-tertiary hover:text-accent-error",
                "hover:bg-accent-error/10"
              )}
              title="Clear chat history"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleUpdateStory}
            disabled={isUpdating}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg",
              "bg-accent-primary text-white",
              "hover:bg-accent-primary/90 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isUpdating ? (
              <>
                <ArrowUpCircle size={16} className="animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <ArrowUpCircle size={16} />
                <span>Update Story</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map(message => (
            <ChatMessage
              key={message.id}
              message={message}
            />
          ))}
        </div>
      </div>

      {/* Chat Input */}
      <div className="sticky bottom-0 left-0 right-0 p-4 
        bg-background-secondary/95 backdrop-blur-sm 
        border-t border-border-subtle">
        <ChatInput 
          onSend={handleMessageSubmit}
          disabled={loading}
          placeholder="Ask me about your story or request suggestions..."
        />
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <p className="text-gray-200 px-4 py-2">Thinking...</p>
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