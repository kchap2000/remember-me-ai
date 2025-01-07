import React from 'react';
import { Tag, Users, MapPin, Clock } from 'lucide-react';
import type { StoryContext } from '../../types/chat';
import { cn } from '../../utils/cn';

interface AnalysisPanelProps {
  storyContext: StoryContext;
  onSuggestionClick: (suggestion: string) => void;
}

interface AnalysisSection {
  icon: React.ElementType;
  title: string;
  items: string[];
  emptyMessage: string;
}

export function AnalysisPanel({ storyContext, onSuggestionClick }: AnalysisPanelProps) {
  const sections: AnalysisSection[] = [
    {
      icon: Tag,
      title: 'Tags',
      items: storyContext.metadata.tags,
      emptyMessage: 'No tags added yet'
    },
    {
      icon: Users,
      title: 'Characters',
      items: storyContext.metadata.characters.map(c => c.name),
      emptyMessage: 'No characters detected'
    },
    {
      icon: Clock,
      title: 'Time Period',
      items: storyContext.metadata.year ? [`${storyContext.metadata.year}`] : [],
      emptyMessage: 'No time period specified'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Story Title */}
      <div>
        <h3 className="text-lg font-medium text-text-primary mb-1">
          {storyContext.metadata.title || 'Untitled Story'}
        </h3>
        <p className="text-sm text-text-tertiary">
          {storyContext.content.length} characters
        </p>
      </div>

      {/* Analysis Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-2">
              <section.icon className="w-4 h-4 text-text-tertiary" />
              <h4 className="text-sm font-medium text-text-secondary">
                {section.title}
              </h4>
            </div>

            {section.items.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {section.items.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestionClick(`Tell me more about ${item}`)}
                    className={cn(
                      "px-2 py-1 rounded-lg text-sm transition-colors",
                      "bg-background-tertiary hover:bg-background-surfaceLight",
                      "text-text-tertiary hover:text-text-primary"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-tertiary">
                {section.emptyMessage}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Recent Analysis */}
      {storyContext.recentAnalysis && (
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-2">
            Recent Analysis
          </h4>
          <div className="space-y-2">
            {storyContext.recentAnalysis.map((element, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-background-tertiary/50 text-sm text-text-tertiary"
              >
                <span className="font-medium text-text-secondary">
                  {element.type}:
                </span>{' '}
                {element.value}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}