import React, { useState } from 'react';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { Connection } from '../../types';
import { LIFE_PHASES } from '../../config/timeline.config';
import { useNavigate } from 'react-router-dom';
import { useConnectionsStore } from '../../store/useConnectionsStore';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

interface ConnectionDetailProps {
  connection: Connection;
  onBack: () => void;
  storyId?: string;
}

export function ConnectionDetail({ connection, onBack, storyId }: ConnectionDetailProps) {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteConnection, removeConnectionFromStory } = useConnectionsStore();
  const phase = LIFE_PHASES.find(
    p => p.id === connection.firstAppearance.phaseId
  );
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (storyId) {
        // Only remove from current story
        await removeConnectionFromStory(storyId, connection.id);
      } else {
        // Delete entirely
        await deleteConnection(connection.id);
      }
      onBack();
    } catch (error) {
      console.error('Error deleting connection:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <button 
        onClick={onBack}
        className="sticky top-0 z-10 flex items-center gap-1 px-4 py-3 bg-[#16133f]/95 backdrop-blur-sm text-[#a29db8] hover:text-white transition-colors border-b border-[#2b2938]"
      >
        <ChevronLeft size={20} className="mr-1" />
        Back to connections
      </button>
      
      <div className="flex items-center justify-between p-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{connection.name}</h3>
          <span className="text-sm text-[#a29db8]">{connection.relationship}</span>
        </div>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#2b2938] scrollbar-track-transparent">
        
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
      
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title={storyId ? "Remove Connection" : "Delete Connection"}
        message={storyId 
          ? "Are you sure you want to remove this connection from this story?" 
          : "Are you sure you want to delete this connection? This will remove it from all stories."}
      />
    </div>
  );
}