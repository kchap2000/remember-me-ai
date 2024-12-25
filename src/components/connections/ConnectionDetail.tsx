import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Connection } from '../../types';
import { LIFE_PHASES } from '../../config/timeline.config';
import { useNavigate } from 'react-router-dom';

interface ConnectionDetailProps {
  connection: Connection;
  onBack: () => void;
}

export function ConnectionDetail({ connection, onBack }: ConnectionDetailProps) {
  const navigate = useNavigate();
  const phase = LIFE_PHASES.find(
    p => p.id === connection.firstAppearance.phaseId
  );

  return (
    <div className="flex flex-col h-full">
      <button 
        onClick={onBack}
        className="sticky top-0 z-10 flex items-center gap-1 px-4 py-3 bg-[#16133f]/95 backdrop-blur-sm text-[#a29db8] hover:text-white transition-colors border-b border-[#2b2938]"
      >
        <ChevronLeft size={20} className="mr-1" />
        Back to connections
      </button>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#2b2938] scrollbar-track-transparent">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">{connection.name}</h3>
          <span className="text-sm text-[#a29db8]">{connection.relationship}</span>
        </div>
        
        <div className="space-y-2 text-sm text-[#a29db8]">
          <p>First appeared in: {connection.firstAppearance.storyTitle}</p>
          <p style={{ color: phase?.color }}>{phase?.name}</p>
          <p>Appears in {connection.stories.length} stories</p>
        </div>

        {connection.notes && (
          <div className="p-3 bg-[#2b2938] rounded-lg text-sm text-[#a29db8] border border-[#2b2938]">
            {connection.notes}
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium text-white mb-2">Stories:</h4>
          {connection.stories.map((story) => (
            <button
              key={story.storyId}
              onClick={() => navigate(`/story/${story.storyId}`)}
              className="w-full p-3 bg-[#2b2938] rounded-lg text-left hover:bg-[#343048] transition-all duration-200 group border border-[#2b2938] hover:border-[#3b19e6]"
            >
              <span className="text-sm text-white group-hover:text-[#3b19e6] transition-colors">
                {story.title}
              </span>
              <span className="block text-xs text-[#5b5676] mt-1">
                {story.year}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}