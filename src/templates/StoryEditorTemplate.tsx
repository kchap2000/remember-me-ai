import React from 'react';
import { cn } from '../styles';
import { Card } from '../components/layout/Card';

interface StoryEditorTemplateProps {
  header: React.ReactNode;
  editor: React.ReactNode;
  aiAssistant: React.ReactNode;
  connectionsPanel: React.ReactNode;
}

export function StoryEditorTemplate({
  header,
  editor,
  aiAssistant,
  connectionsPanel,
}: StoryEditorTemplateProps) {
  return (
    <div className={cn(
      "min-h-screen flex flex-col bg-gradient-page"
    )}>
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-50",
        "px-6 py-4",
        "bg-background-primary/95 backdrop-blur-sm",
        "border-b border-border-subtle",
        "shadow-md"
      )}>
        {header}
      </header>

      {/* Main Content Container */}
      <main className={cn(
        "flex-1 flex min-h-0",
        "p-6 gap-6",
        // Use a large max width by default and reduce it at xl breakpoints:
        "max-w-[1400px] mx-auto w-full xl:max-w-[1200px]"
      )}>
        {/* Editor Section */}
        <div className={cn(
          "flex-1 min-w-[600px]",
          "flex flex-col"
        )}>
          <Card
            variant="elevated"
            className={cn(
              "flex-1 relative z-10",
              "overflow-hidden",
              "transition-all duration-300"
            )}
          >
            {editor}
          </Card>
        </div>

        {/* Right Side Panels */}
        <div className={cn(
          "w-[400px] min-w-[320px] max-w-[480px]",
          // At xl breakpoints, slightly increase the width to use more space:
          "xl:w-[480px]",
          "flex flex-col gap-4 flex-shrink-0"
        )}>
          {/* AI Assistant Panel */}
          <Card
            variant="elevated"
            className={cn(
              "flex-[0.6] min-h-[400px]",
              "overflow-hidden",
              "transition-all duration-300"
            )}
          >
            <div className={cn(
              "h-full",
              "overflow-y-auto",
              "scrollbar-thin scrollbar-thumb-border-default scrollbar-track-transparent"
            )}>
              {aiAssistant}
            </div>
          </Card>

          {/* Connections Panel */}
          <Card
            variant="elevated"
            className={cn(
              "flex-[0.4] min-h-[300px]",
              "overflow-hidden",
              "transition-all duration-300"
            )}
          >
            <div className={cn(
              "h-full",
              "overflow-y-auto",
              "scrollbar-thin scrollbar-thumb-border-default scrollbar-track-transparent"
            )}>
              {connectionsPanel}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
