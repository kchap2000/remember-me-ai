import React from 'react';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ConnectionsPanel } from '../connections/ConnectionsPanel';
import { useLocalStorage } from '../../hooks/useLocalStorage';

type SidePanelsProps = {
  className?: string;
  chatInterface: React.ReactNode;
  storyId?: string | null;
  onAddConnection: (data: { name: string; relationship: string }) => void;
};

export function SidePanels({
  className = '',
  chatInterface,
  storyId,
  onAddConnection
}: SidePanelsProps) {
  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidePanelsCollapsed', false);
  const [width, setWidth] = useLocalStorage('sidePanelsWidth', 320);
  const minWidth = 280;
  const maxWidth = 480;

  const handleResize = (e: React.MouseEvent) => {
    const startX = e.pageX;
    const startWidth = width;
    e.preventDefault();

    const doDrag = (e: MouseEvent) => {
      const newWidth = startWidth - (e.pageX - startX);
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-[#1e1c26] border-l 
                  border-[#403c53] p-2 rounded-l-lg text-[#a29db8] 
                  hover:text-white transition-colors"
        aria-label="Expand side panel"
      >
        <ChevronLeft size={20} />
      </button>
    );
  }

  return (
    <div 
      className={`relative flex flex-col gap-4 h-full transition-all duration-200 
                ease-in-out border-l border-[#403c53] ${className}`}
      style={{ width: `${width}px` }}
      data-testid="side-panels"
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10
                  hover:bg-[#3b19e6] transition-colors"
        onMouseDown={handleResize}
        data-testid="resize-handle"
      />
      
      <button
        onClick={() => setIsCollapsed(true)}
        className="absolute -left-3 top-1/2 -translate-y-1/2 bg-[#1e1c26]
                  border border-[#403c53] rounded-full p-1 z-10
                  text-[#a29db8] hover:text-white transition-colors"
        aria-label="Collapse side panel"
      >
        <ChevronRight size={16} />
      </button>

      <div className="flex-1 overflow-auto">
        {chatInterface}
      </div>

      {storyId && (
        <ConnectionsPanel
          storyId={storyId}
          onAddConnection={onAddConnection}
        />
      )}
    </div>
  );
}
