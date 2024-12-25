import React, { useRef, useState, useCallback } from 'react';
import { Mic, Lightbulb, UserPlus, ChevronLeft, BookOpen, Trash2, Sparkles } from 'lucide-react';
import { polishText } from '../../utils/text';
import { TextStyle } from '../../utils/types';
import { cn } from '../../styles';
import { useNavigate } from 'react-router-dom';
import { YearSelector } from './YearSelector';
import { TagInput } from './TagInput';
import { VoiceRecorder } from './VoiceRecorder';
import { ConnectionSuggestion } from './ConnectionSuggestion';

// ... [Previous interfaces remain the same]

export function EditorContent({
  className = '',
  content,
  title,
  setTitle,
  selectedYear,
  setSelectedYear,
  birthYear,
  tags,
  setTags,
  setContent,
  onTranscription,
  suggestedConnections,
  onAddConnection,
  onIgnoreConnection,
  onRequestAISuggestion,
  onShowAddConnection,
  onSave,
  onDelete,
  isSaving,
  hasUnsavedChanges,
  wordCount
}: EditorContentProps) {
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPolishing, setIsPolishing] = useState(false);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textareaRef.current?.selectionStart || 0;
      const end = textareaRef.current?.selectionEnd || 0;

      const newValue = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newValue);

      // Set cursor position after timeout to ensure state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  }, [content, setContent]);

  const handlePolishText = useCallback(async () => {
    if (!content.trim() || isPolishing) return;
    
    setIsPolishing(true);
    try {
      const result = await polishText(content, {
        fixPunctuation: true,
        capitalizeFirst: true,
        removeFillers: true,
        convertNumbers: true,
        improveGrammar: true,
        textStyle: TextStyle.Formal
      });
      
      if (result.text) {
        setContent(result.text);
      }
    } catch (error) {
      console.error('Error polishing text:', error);
      // Optionally show error to user
    } finally {
      setIsPolishing(false);
    }
  }, [content, setContent, isPolishing]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with Title and Controls */}
      <div className={cn(
        "sticky top-0 z-40 p-6 border-b border-border-subtle",
        "bg-gradient-surface"
      )}>
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg",
              "text-text-tertiary hover:text-text-primary",
              "hover:bg-bg-tertiary/50 transition-all duration-200"
            )}
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your story title..."
              className="flex-1 text-2xl font-bold bg-transparent border-none 
                     outline-none text-text-primary 
                     placeholder:text-text-tertiary"
            />
          </div>
          
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="text-sm text-text-tertiary">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
            <button
              onClick={onDelete}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                "text-red-500 hover:text-white hover:bg-red-600",
                "transition-all duration-200",
                "border border-red-500 hover:border-red-600"
              )}
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
            <button
              onClick={onSave}
              disabled={isSaving || !title}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                "bg-blue-600 text-white",
                "hover:bg-blue-700 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                hasUnsavedChanges ? "opacity-100" : "opacity-50"
              )}
            >
              {isSaving ? 'Saving...' : (hasUnsavedChanges ? 'Save' : 'Saved')}
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-48">
            <YearSelector
              selectedYear={selectedYear}
              birthYear={birthYear}
              onChange={setSelectedYear}
            />
          </div>
          <div className="flex-1">
            <TagInput tags={tags} onChange={setTags} />
          </div>
        </div>
      </div>

      {/* Story Content Area */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write your story here..."
          className="w-full h-full p-6 bg-transparent text-text-primary rounded-lg
                    text-lg leading-relaxed resize-none outline-none
                    placeholder:text-text-tertiary font-sans
                    selection:bg-blue-600/20"
          spellCheck="true"
        />

        {/* Connection Suggestions */}
        {suggestedConnections.length > 0 && (
          <div className="absolute bottom-full left-0 w-full p-4 space-y-4">
            {suggestedConnections.map(name => (
              <ConnectionSuggestion
                key={name}
                name={name}
                onAdd={onAddConnection}
                onIgnore={() => onIgnoreConnection(name)}
              />
            ))}
          </div>
        )}

        {/* Bottom Toolbar */}
        <div className="absolute bottom-0 left-0 right-0 
                    z-40 border-t border-border-subtle
                    bg-gradient-surface p-4 rounded-b-lg
                    flex items-center gap-4">
          <VoiceRecorder
            onTranscription={onTranscription}
            className="flex-shrink-0"
          />

          <div className="flex-1 flex flex-wrap items-center justify-end gap-4">
            <button
              onClick={handlePolishText}
              disabled={isPolishing || !content.trim()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                     text-text-tertiary hover:text-text-primary
                     hover:bg-bg-tertiary/50 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles size={20} className={isPolishing ? 'animate-spin' : ''} />
              <span>{isPolishing ? 'Polishing...' : 'Polish Text'}</span>
            </button>

            <button
              onClick={onRequestAISuggestion}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                     text-text-tertiary hover:text-text-primary
                     hover:bg-bg-tertiary/50 transition-all duration-200"
            >
              <Lightbulb size={20} />
              <span>Get AI suggestions</span>
            </button>

            <button
              onClick={onShowAddConnection}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                     text-text-tertiary hover:text-text-primary
                     hover:bg-bg-tertiary/50 transition-all duration-200"
            >
              <UserPlus size={20} />
              <span>Add Connection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditorContent;