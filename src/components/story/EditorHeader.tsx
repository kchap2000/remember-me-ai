import React from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { YearSelector } from './YearSelector';
import { TagInput } from './TagInput';
import { BookOpen, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EditorHeaderProps {
  title: string;
  setTitle: (title: string) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  birthYear: number | null;
  tags: string[];
  setTags: (tags: string[]) => void;
  isSaving: boolean;
  showTitlePrompt: boolean;
  onSave: () => void;
  hasUnsavedChanges: boolean;
  wordCount: number;
}

export function EditorHeader({
  title,
  setTitle,
  selectedYear,
  setSelectedYear,
  birthYear,
  tags,
  setTags,
  isSaving,
  showTitlePrompt,
  onSave,
  hasUnsavedChanges,
  wordCount
}: EditorHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-10 bg-[#111a22]/95 backdrop-blur-sm border-b border-[#403c53] pb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg 
                     text-[#a29db8] hover:text-white hover:bg-[#2b2938]/50 
                     transition-all duration-200"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>

          <BookOpen className="w-8 h-8 text-[#3b19e6]" />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={showTitlePrompt ? "Please add a title to save your story..." : "Enter your story title..."}
            className={`text-3xl font-bold bg-transparent border-none outline-none 
                     text-white placeholder:text-[#5b5676] w-[600px] transition-all
                     ${showTitlePrompt ? 'animate-pulse text-red-500' : ''}`}
          />
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#a29db8]">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
          <button
            onClick={onSave}
            disabled={isSaving || !title}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg 
                     transition-all ${hasUnsavedChanges 
                       ? 'bg-[#3b19e6] text-white' 
                       : 'bg-[#2b2938] text-[#a29db8]'}`}
          >
            {isSaving && <LoadingSpinner size={16} className="text-white" />}
            <span>{isSaving ? 'Saving...' : (hasUnsavedChanges ? 'Save' : 'Saved')}</span>
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-[#a29db8] text-sm mb-2">Year</label>
          <YearSelector
            selectedYear={selectedYear}
            birthYear={birthYear}
            onChange={setSelectedYear}
          />
        </div>
        <div className="flex-[2]">
          <label className="block text-[#a29db8] text-sm mb-2">Tags</label>
          <TagInput tags={tags} onChange={setTags} />
        </div>
      </div>
    </div>
  );
}
