import React, { useState, KeyboardEvent } from 'react';
import { Tag as TagIcon, X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = input.trim();
      if (newTag && !tags.includes(newTag)) {
        onChange([...tags, newTag]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="relative">
      <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a29db8]" size={16} />
      <div className="flex flex-wrap items-center gap-2 w-full pl-10 pr-4 py-2 min-h-[42px] 
                    bg-[#1e1c26] border border-[#403c53] rounded-lg text-white 
                    focus-within:border-[#3b19e6]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-1 bg-[#2b2938] rounded-md
                     text-sm text-[#a29db8] group"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="opacity-50 group-hover:opacity-100 hover:text-white 
                       transition-opacity"
            >
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? "Add tags..." : ""}
          className="flex-1 min-w-[100px] bg-transparent outline-none 
                   placeholder:text-[#5b5676]"
        />
      </div>
    </div>
  );
}