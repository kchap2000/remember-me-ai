import React, { useState, useEffect, useCallback } from 'react';
import { X, Check, RotateCcw, Edit3, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Section {
  original: string;
  updated: string;
  changes?: {
    added: string[];
    removed: string[];
  };
}

interface StoryReviewModalProps {
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  originalContent: string;
  updatedContent: string;
  chatContext?: string;
  onAccept: (content: string) => void;
  onReject: () => void;
}

export function StoryReviewModal({
  title = "Review AI Updates",
  isOpen,
  onClose,
  originalContent,
  updatedContent,
  chatContext,
  onAccept,
  onReject
}: StoryReviewModalProps) {
  const [editedContent, setEditedContent] = useState(updatedContent);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSection, setSelectedSection] = useState<number>(0);
  const [sections, setSections] = useState<Section[]>([]);

  // Process content into sections
  const processContentIntoSections = useCallback((original: string, updated: string): Section[] => {
    const originalParagraphs = original.split('\n\n').filter(Boolean);
    const updatedParagraphs = updated.split('\n\n').filter(Boolean);
    
    return originalParagraphs.map((original, i) => {
      const updated = updatedParagraphs[i] || original;
      
      // Find only new additions
      const originalWords = original.split(/\s+/);
      const updatedWords = updated.split(/\s+/);
      
      const added = updatedWords.filter(word => !originalWords.includes(word));
      
      return {
        original,
        updated,
        changes: {
          added,
          removed: [] // Never remove content
        }
      };
    });
  }, []);

  // Highlight changes in text
  const highlightChanges = useCallback((section: Section): string => {
    let enrichedText = section.updated;
    
    // Process additions
    section.changes?.added.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      enrichedText = enrichedText.replace(
        regex,
        `<span class="bg-emerald-500/20 text-emerald-400 px-1 rounded">${word}</span>`
      );
    });
    
    return enrichedText;
  }, []);

  // Initialize sections when content changes
  useEffect(() => {
    const processedSections = processContentIntoSections(originalContent, updatedContent);
    setSections(processedSections);
  }, [originalContent, updatedContent, processContentIntoSections]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && selectedSection < sections.length - 1) {
        setSelectedSection(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && selectedSection > 0) {
        setSelectedSection(prev => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sections.length, selectedSection]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#1A1A1E] to-[#15151A] rounded-2xl w-full max-w-7xl h-[90vh] 
                    flex flex-col animate-fade-in-up shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 bg-black/20 backdrop-blur supports-[backdrop-filter]:bg-black/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                {title}
              </h2>
              {chatContext && (
                <div className="flex items-center gap-2 mt-1 text-sm text-white/40">
                  <span className="inline-block w-1 h-1 rounded-full bg-purple-500/50" />
                  Based on your recent conversation
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-white/40 hover:text-white hover:bg-white/5 
                       transition-all duration-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-[1fr,auto,1fr] h-full">
            {/* Original Version */}
            <div className="p-6 border-r border-white/5 space-y-4 overflow-y-auto">
              <div className="sticky top-0 pb-4 bg-[#1A1A1E]">
                <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider">Current Version</h3>
              </div>
              {sections.map((section, index) => (
                <div key={index} 
                     className={cn(
                       "p-4 rounded-lg transition-all duration-200 cursor-pointer",
                       selectedSection === index ? "bg-white/10" : "hover:bg-white/5",
                       "border border-transparent hover:border-white/10"
                     )}
                     onClick={() => setSelectedSection(index)}>
                  <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{section.original}</p>
                </div>
              ))}
            </div>

            {/* Center Navigation */}
            <div className="w-12 flex flex-col items-center py-6 bg-white/5">
              {sections.map((_, index) => (
                <div key={index} 
                     className={cn(
                       "w-3 h-3 rounded-full my-2 transition-all duration-200 cursor-pointer",
                       selectedSection === index 
                         ? "bg-purple-500 shadow-lg shadow-purple-500/20" 
                         : "bg-white/20 hover:bg-white/30"
                     )}
                     onClick={() => setSelectedSection(index)} />
              ))}
            </div>

            {/* Updated Version */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="sticky top-0 pb-4 bg-[#1A1A1E]">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider">
                    {isEditing ? 'Edit Additions' : 'Version with New Details'}
                  </h3>
                  <button onClick={() => setIsEditing(!isEditing)}
                          className="text-xs text-white/60 hover:text-white flex items-center gap-1
                                   px-2 py-1 rounded border border-white/10 hover:border-white/20
                                   transition-all duration-200">
                    <Edit3 size={12} />
                    {isEditing ? 'Preview' : 'Edit'}
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500/20" />
                    <span className="text-xs text-white/40">New Details</span>
                  </div>
                </div>
              </div>
              
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-[calc(100%-4rem)] bg-white/5 rounded-lg p-4
                           text-white/80 resize-none border border-white/10
                           focus:border-purple-500/50 outline-none leading-relaxed
                           focus:ring-2 focus:ring-purple-500/10 transition-all duration-200
                           scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                />
              ) : (
                sections.map((section, index) => (
                  <div key={index}
                       className={cn(
                         "p-4 rounded-lg transition-all duration-200",
                         selectedSection === index ? "bg-white/10" : "hover:bg-white/5",
                         "border border-transparent hover:border-white/10"
                       )}>
                    <div dangerouslySetInnerHTML={{
                      __html: highlightChanges(section)
                    }} className="text-white/80 leading-relaxed whitespace-pre-wrap" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-white/5 bg-black/20 backdrop-blur supports-[backdrop-filter]:bg-black/10">
          <div className="flex justify-between items-center">
            <div className="text-sm text-white/40">
              {sections.length > 1 && (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedSection(prev => Math.max(0, prev - 1))}
                    disabled={selectedSection === 0}
                    className={cn(
                      "p-1 rounded transition-all duration-200",
                      selectedSection === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-white/5"
                    )}>
                    <ChevronLeft size={16} />
                  </button>
                  <span>Section {selectedSection + 1} of {sections.length}</span>
                  <button 
                    onClick={() => setSelectedSection(prev => Math.min(sections.length - 1, prev + 1))}
                    disabled={selectedSection === sections.length - 1}
                    className={cn(
                      "p-1 rounded transition-all duration-200",
                      selectedSection === sections.length - 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-white/5"
                    )}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onReject}
                      className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white
                               border border-white/10 hover:border-white/20 
                               transition-all duration-200 flex items-center gap-2">
                <RotateCcw size={16} />
                Skip New Details
              </button>
              <button onClick={() => onAccept(isEditing ? editedContent : updatedContent)}
                      className="px-4 py-2 rounded-lg text-sm text-white
                               bg-gradient-to-r from-purple-600 to-purple-500
                               hover:from-purple-500 hover:to-purple-400
                               transition-all duration-200 flex items-center gap-2
                               shadow-lg shadow-purple-500/20">
                <Check size={16} />
                Add New Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}