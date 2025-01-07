import React, { useState, useCallback } from 'react';
import { Sparkles, MessageCircle, Send } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useGeneralKnowledge } from '../../hooks/ai/useGeneralKnowledge';
import { SuggestionList } from './SuggestionList';
import { AnalysisPanel } from './AnalysisPanel';
import { cn } from '../../utils/cn';

interface AIAssistantProps {
  storyContext: StoryContext;
  onSuggestion: (suggestion: string) => void;
  onUndo: () => void;
  canUndo: boolean;
}

export function AIAssistant({ storyContext, onSuggestion, onUndo, canUndo }: AIAssistantProps) {
  const { 
    loading, 
    error, 
    sendMessage,
    activeTab,
    setActiveTab,
    suggestions,
    generateSuggestions
  } = useChatStore(state => ({
    loading: state.loading,
    error: state.error,
    sendMessage: state.sendMessage,
    activeTab: state.activeTab,
    setActiveTab: state.setActiveTab,
    suggestions: state.suggestions,
    generateSuggestions: state.generateSuggestions
  }));
  const [userMessage, setUserMessage] = useState('');
  const { getKnowledge, loading: knowledgeLoading } = useGeneralKnowledge({
    onResponse: (response) => {
      sendMessage({
        id: Date.now().toString(),
        content: response,
        sender: 'ai',
        timestamp: new Date()
      });
    }
  });

  // Generate suggestions when content changes
  useEffect(() => {
    if (activeTab === 'suggestions') {
      generateSuggestions();
    }
  }, [storyContext.content, activeTab, generateSuggestions]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    console.log('AIAssistant handleSuggestionClick:', suggestion);
    onSuggestion(suggestion);
  }, [onSuggestion]);

  const handleMessageSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim()) return;
    
    // Check if the message is a general knowledge query
    const isGeneralQuery = /what|when|where|how|why|tell me about/i.test(userMessage);
    
    sendMessage({
      id: Date.now().toString(),
      content: userMessage,
      sender: 'user',
      timestamp: new Date()
    });

    if (isGeneralQuery) {
      await getKnowledge(userMessage, {
        year: storyContext.metadata.year,
        location: storyContext.metadata.location
      });
    } else {
      // Handle as story-specific query
      const aiResponse = await aiService.generateSuggestion(userMessage);
      sendMessage({
        id: Date.now().toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      });
    }

    setUserMessage('');
  }, [userMessage, sendMessage]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-semibold text-text-primary">AI Writing Assistant</h2>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-colors",
              activeTab === 'suggestions'
                ? "bg-accent-primary text-white"
                : "text-text-tertiary hover:text-text-primary"
            )}
          >
            Suggestions
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-colors",
              activeTab === 'analysis'
                ? "bg-accent-primary text-white"
                : "text-text-tertiary hover:text-text-primary"
            )}
          >
            Analysis
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 m-4 bg-accent-error/10 text-accent-error rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-full text-text-tertiary">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
          </div>
        ) : (
          <div className="p-4">
            {activeTab === 'suggestions' ? (
              <SuggestionList
                storyContext={storyContext}
                suggestions={suggestions}
                onSuggestionClick={handleSuggestionClick}
                canUndo={canUndo}
                onUndo={onUndo}
              />
            ) : (
              <AnalysisPanel
                storyContext={storyContext}
                onSuggestionClick={handleSuggestionClick}
              />
            )}
          </div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleMessageSubmit} className="p-4 border-t border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Ask me anything about your story..."
              className="w-full px-4 py-3 pr-12 bg-background-tertiary rounded-lg
                       text-text-primary placeholder:text-text-tertiary
                       border border-border-subtle focus:border-accent-primary
                       outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!userMessage.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2
                       p-2 rounded-lg transition-colors
                       text-text-tertiary hover:text-text-primary
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
          <MessageCircle size={16} />
        </div>
      </form>
    </div>
  );
}