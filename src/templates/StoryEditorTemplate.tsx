import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { cn } from "../styles";
import { Card } from "../components/layout/Card";
import "./styles.css";

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
    <div className={cn("min-h-screen flex flex-col bg-gradient-page")}>
      {/* Header */}
      <header
        className={cn(
          "sticky top-0 z-50",
          "px-6 py-4",
          "bg-background-primary/95 backdrop-blur-sm",
          "border-b border-border-subtle",
          "shadow-md"
        )}
      >
        {header}
      </header>

      {/* Main Content Container */}
      <main
        className={cn(
          "flex-1 flex min-h-0 w-full",
          "p-6 gap-6"
        )}
      >
        {/* Panel Group (Horizontal): Editor + Side Panels */}
        <PanelGroup direction="horizontal" className="w-full">
          {/* Left Panel: Editor */}
          <Panel defaultSize={70} minSize={50}>
            <Card
              variant="elevated"
              className={cn(
                "flex-1 relative z-10",
                "overflow-hidden",
                "transition-all duration-300",
                "h-full"
              )}
            >
              {editor}
            </Card>
          </Panel>

          {/* Resize Handle Between Editor & Side Panels */}
          <PanelResizeHandle
            className={cn(
              "ResizeHandleOuter",
              "hover:bg-accent-primary/10",
              "data-[resize-handle-active]:bg-accent-primary/20"
            )}
          >
            <div className="ResizeHandleInner" />
          </PanelResizeHandle>

          {/* Right Panel (another panel group for AI Assistant & Connections) */}
          <Panel defaultSize={30} minSize={25}>
            <PanelGroup direction="vertical" className="h-full">
              {/* AI Assistant Panel */}
              <Panel defaultSize={60} minSize={30}>
                <Card
                  variant="elevated"
                  className={cn(
                    "flex-1",
                    "h-full",
                    "overflow-hidden",
                    "transition-all duration-300"
                  )}
                >
                  <div
                    className={cn(
                      "h-full",
                      "overflow-y-auto",
                      "scrollbar-thin scrollbar-thumb-border-default scrollbar-track-transparent"
                    )}
                  >
                    {aiAssistant}
                  </div>
                </Card>
              </Panel>

              {/* Resize Handle Between AI Assistant & Connections Panel */}
              <PanelResizeHandle
                className={cn(
                  "ResizeHandleOuter horizontal",
                  "hover:bg-accent-primary/10",
                  "data-[resize-handle-active]:bg-accent-primary/20"
                )}
              >
                <div className="ResizeHandleInner" />
              </PanelResizeHandle>

              {/* Connections Panel */}
              <Panel defaultSize={40} minSize={30}>
                <Card
                  variant="elevated"
                  className={cn(
                    "h-full",
                    "min-h-[200px]",
                    "overflow-hidden",
                    "transition-all duration-300"
                  )}
                >
                  <div
                    className={cn(
                      "h-full",
                      "overflow-y-auto",
                      "scrollbar-thin scrollbar-thumb-border-default scrollbar-track-transparent"
                    )}
                  >
                    {connectionsPanel}
                  </div>
                </Card>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </main>
    </div>
  );
}
