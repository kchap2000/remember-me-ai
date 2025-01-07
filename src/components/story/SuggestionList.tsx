import React from 'react';
import { RotateCcw } from 'lucide-react';
import type { StoryContext } from '../../types/chat';
import { cn } from '../../utils/cn';

interface SuggestionListProps {
  storyContext: StoryContext;
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  canUndo: boolean;
  onUndo: () => void;
}

const SUGGESTION_TYPES = [
  {
    type: 'continue',
    label: 'Continue the story',
    description: 'Get suggestions for what happens next'
  },
  {
    type: 'develop',
    label: 'Develop characters',
    description: 'Add more detail about the people in your story'
  },
  {
    type: 'enhance',
    label: 'Add sensory details',
    description: 'Describe sights, sounds, and feelings'
  }
] as const;

export function SuggestionList({ 
  storyContext, 
  suggestions,
  onSuggestionClick, 
  canUndo, 
  onUndo 
}: SuggestionListProps) {
  return (
    <div className="space-y-4">
      {/* Undo Button */}
      {canUndo && (
        <button
          onClick={onUndo}
          className={cn(
            "w-full flex items-center justify-center gap-2",
            "p-3 rounded-lg transition-colors",
            "bg-background-tertiary hover:bg-background-surfaceLight",
            "text-text-tertiary hover:text-text-primary"
          )}
        >
          <RotateCcw size={16} />
          <span>Undo Last Suggestion</span>
        </button>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-text-secondary mb-2">
            Suggestions
          </h3>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion)}
              className={cn(
                "w-full text-left p-3 rounded-lg transition-all",
                "bg-background-tertiary hover:bg-background-surfaceLight",
                "group border border-border-subtle hover:border-accent-primary"
              )}
            >
              <p className="text-sm text-text-tertiary group-hover:text-text-primary">
                {suggestion}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Suggestion Types */}
      <div className="space-y-2">
        {SUGGESTION_TYPES.map((type) => (
          <button
            key={type.type}
            onClick={() => onSuggestionClick(type.type)}
            className={cn(
              "w-full text-left p-3 rounded-lg transition-all",
              "bg-background-tertiary hover:bg-background-surfaceLight",
              "group border border-border-subtle hover:border-accent-primary"
            )}
          >
            <h3 className="font-medium text-text-primary group-hover:text-accent-primary">
              {type.label}
            </h3>
            <p className="text-sm text-text-tertiary mt-1">
              {type.description}
            </p>
          </button>
        ))}
      </div>

      {/* Recent Story Elements */}
      {storyContext.recentAnalysis && storyContext.recentAnalysis.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-text-secondary mb-2">
            Recently Mentioned
          </h3>
          <div className="space-y-2">
            {storyContext.recentAnalysis.map((element, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(`Tell me more about ${element.value}`)}
                className={cn(
                  "w-full text-left p-2 rounded-lg transition-colors",
                  "bg-background-tertiary/50 hover:bg-background-surfaceLight",
                  "text-sm text-text-tertiary hover:text-text-primary"
                )}
              >
                {element.value}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}