import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, MessageSquare, AlertCircle, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import _ from 'lodash';

// Enhanced TypeScript interfaces
interface StoryDetails {
  title: string;
  year?: number;
  tags: string[];
  characters: Array<{
    name: string;
    relation: string;
  }>;
}

interface StoryElement {
  type: 'event' | 'person' | 'place' | 'emotion' | 'time';
  value: string;
  context: string;
  confidence: number; // Added confidence score for better filtering
}

interface StorySuggestion {
  type: 'addition' | 'enhancement' | 'continuation';
  content: string;
  insertAfter?: string;
  replacementFor?: string;
  confidence: number; // Added for suggestion ranking
}

interface Prompt {
  type: 'continue' | 'develop' | 'improve';
  label: string;
  description: string;
  relevance: number; // Added for better prompt prioritization
}

interface AIAssistantProps {
  content: string;
  storyDetails: StoryDetails;
  onSuggestion: (suggestion: string) => void;
  onUndo: () => void;
  canUndo: boolean;
}

type AssistantState = 'idle' | 'suggesting' | 'feedback' | 'error';

export function AIAssistant({
  content,
  storyDetails,
  onSuggestion,
  onUndo,
  canUndo
}: AIAssistantProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [storyElements, setStoryElements] = useState<StoryElement[]>([]);
  const [suggestions, setSuggestions] = useState<StorySuggestion[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>>([]);

  // Enhanced story analysis with better pattern matching
  const analyzeStoryContent = useCallback(_.debounce((content: string) => {
    const elements: StoryElement[] = [];
    const sentences = content.split(/[.!?]+/).filter(Boolean);

    sentences.forEach(sentence => {
      const trimmedSentence = sentence.trim().toLowerCase();

      // Enhanced character detection
      storyDetails.characters.forEach(char => {
        const nameMatch = trimmedSentence.includes(char.name.toLowerCase());
        const relationMatch = trimmedSentence.includes(char.relation.toLowerCase());
        
        if (nameMatch || relationMatch) {
          elements.push({
            type: 'person',
            value: char.name,
            context: sentence,
            confidence: nameMatch ? 0.9 : 0.7
          });
        }
      });

      // Enhanced event detection with more action verbs
      const actionVerbs = /\b(went|came|saw|did|made|took|got|had|was|were|walked|ran|jumped|spoke|looked|felt)\b/i;
      if (actionVerbs.test(trimmedSentence)) {
        elements.push({
          type: 'event',
          value: sentence,
          context: sentence,
          confidence: 0.8
        });
      }

      // Enhanced place detection
      const placeIndicators = /\b(at|in|on|near|by|inside|outside|around)\s+([A-Z][a-z]+|\w+\s+\w+)/;
      const placeMatch = trimmedSentence.match(placeIndicators);
      if (placeMatch) {
        elements.push({
          type: 'place',
          value: placeMatch[2],
          context: sentence,
          confidence: 0.75
        });
      }

      // Enhanced emotion detection
      const emotions = /\b(felt|feel|happy|sad|angry|excited|worried|scared|nervous|proud|loved|confused|surprised)\b/i;
      if (emotions.test(trimmedSentence)) {
        elements.push({
          type: 'emotion',
          value: sentence,
          context: sentence,
          confidence: 0.85
        });
      }
    });

    setStoryElements(elements);
  }, 500), [storyDetails]);

  useEffect(() => {
    if (content) {
      analyzeStoryContent(content);
    }
  }, [content, analyzeStoryContent]);

  // Generate contextual prompts based on story analysis
  const generateContextualPrompts = useCallback((): Prompt[] => {
    const prompts: Prompt[] = [];
    const recentElements = storyElements
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    // Event development prompts
    const events = recentElements.filter(e => e.type === 'event');
    if (events.length > 0) {
      prompts.push({
        type: 'continue',
        label: 'Tell me what happened next',
        description: 'Let\'s explore what followed this moment',
        relevance: events[0].confidence
      });
    }

    // Character development prompts
    const people = recentElements.filter(e => e.type === 'person');
    if (people.length > 0) {
      prompts.push({
        type: 'develop',
        label: `Tell me more about ${people[0].value}`,
        description: 'Let\'s explore this person\'s role in your story',
        relevance: people[0].confidence
      });
    }

    // Setting and emotional prompts
    const places = recentElements.filter(e => e.type === 'place');
    const emotions = recentElements.filter(e => e.type === 'emotion');

    if (places.length > 0) {
      prompts.push({
        type: 'improve',
        label: 'Expand on this setting',
        description: 'Help me visualize where this took place',
        relevance: places[0].confidence
      });
    }

    if (emotions.length > 0) {
      prompts.push({
        type: 'develop',
        label: 'Explore these feelings',
        description: 'Let\'s delve deeper into the emotions of this moment',
        relevance: emotions[0].confidence
      });
    }

    // Sort prompts by relevance
    return prompts.sort((a, b) => b.relevance - a.relevance);
  }, [storyElements]);

  // Handle suggestion application with undo history
  const handleSuggestionApply = useCallback((suggestion: StorySuggestion) => {
    try {
      let newContent = content;
      
      switch (suggestion.type) {
        case 'addition':
          if (suggestion.insertAfter) {
            const insertIndex = content.indexOf(suggestion.insertAfter) + suggestion.insertAfter.length;
            newContent = `${content.slice(0, insertIndex)}\n\n${suggestion.content}\n\n${content.slice(insertIndex)}`;
          } else {
            newContent = `${content}\n\n${suggestion.content}`;
          }
          break;
          
        case 'enhancement':
          if (suggestion.replacementFor) {
            newContent = content.replace(suggestion.replacementFor, suggestion.content);
          }
          break;
          
        case 'continuation':
          newContent = `${content}\n\n${suggestion.content}`;
          break;
      }
      
      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Applied suggestion: ${suggestion.type}`,
          timestamp: Date.now()
        }
      ]);
      
      onSuggestion(newContent);
      setAssistantState('idle');
    } catch (err) {
      setError('Failed to apply suggestion. Please try again.');
      setAssistantState('error');
    }
  }, [content, onSuggestion]);

  // Render the AI Assistant interface
  return (
    <div className="bg-[#1e1c26] p-6 rounded-xl border border-[#403c53]">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-[#3b19e6]" />
        <h2 className="text-lg font-semibold text-white">AI Writing Assistant</h2>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-4">
        {/* Undo button */}
        {canUndo && assistantState !== 'suggesting' && (
          <button
            onClick={onUndo}
            className="w-full flex items-center justify-center gap-2 p-3 
                     bg-[#2b2938] hover:bg-[#343048] rounded-lg
                     text-[#a29db8] hover:text-white transition-colors"
          >
            <RotateCcw size={14} />
            <span>Undo Previous Suggestion</span>
          </button>
        )}

        {/* Main content area */}
        {assistantState === 'idle' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-[#3b19e6] mt-1" />
              <p className="text-[#a29db8] flex-1">
                How would you like to develop your story?
              </p>
            </div>

            {/* Prompt buttons */}
            <div className="space-y-2">
              {generateContextualPrompts().map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handlePromptSelect(prompt)}
                  className="w-full text-left p-3 rounded-lg bg-[#2b2938] 
                           hover:bg-[#343048] transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{prompt.label}</span>
                    <Sparkles 
                      size={14}
                      className="text-[#3b19e6] opacity-0 group-hover:opacity-100 
                               transition-opacity" 
                    />
                  </div>
                  <p className="text-sm text-[#a29db8] mt-1">
                    {prompt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {assistantState === 'suggesting' && (
          <div className="flex items-center justify-center gap-2 py-8 text-[#a29db8]">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#3b19e6]" />
            <span>Analyzing your story...</span>
          </div>
        )}

        {/* Suggestions display */}
        {assistantState === 'suggestions' && suggestions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-white font-medium mb-3">Suggested Improvements</h3>
            {suggestions
              .sort((a, b) => b.confidence - a.confidence)
              .map((suggestion, index) => (
                <div 
                  key={index}
                  className="bg-[#2b2938] rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[#a29db8] text-sm">
                      {suggestion.type === 'addition' && 'Add New Detail'}
                      {suggestion.type === 'enhancement' && 'Enhance Description'}
                      {suggestion.type === 'continuation' && 'Continue Story'}
                    </span>
                    <button
                      onClick={() => handleSuggestionApply(suggestion)}
                      className="px-3 py-1 bg-[#3b19e6] hover:bg-[#2f14b8] 
                               rounded-md text-white text-sm transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  
                  <div className="text-white text-sm leading-relaxed">
                    {suggestion.content}
                  </div>
                </div>
              ))}
            
            <button
              onClick={() => setAssistantState('idle')}
              className="w-full p-3 mt-4 bg-[#2b2938] hover:bg-[#343048] 
                       rounded-lg text-[#a29db8] transition-colors"
            >
              Try Different Suggestions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}