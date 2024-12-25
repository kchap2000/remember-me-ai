import React, { useState } from 'react';
import { X, UserPlus, Clock, ChevronRight } from 'lucide-react';
import { useConnectionsStore } from '../../store/useConnectionsStore';
import { Connection } from '../../types';

interface AddConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (connection: { name: string; relationship: string }) => void;
  userId?: string;
}

export function AddConnectionModal({ isOpen, onClose, onAdd, userId }: AddConnectionModalProps) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [showAllRecent, setShowAllRecent] = useState(false);
  const { connections: recentConnections } = useConnectionsStore();
  
  const commonRelationships = [
    'Mother', 'Father', 'Sister', 'Brother', 'Friend', 
    'Teacher', 'Boss', 'Colleague', 'Aunt', 'Uncle'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name?.trim();
    const trimmedRelationship = relationship?.trim();
    
    if (!trimmedName || !trimmedRelationship) {
      return;
    }
    
    onAdd({ 
      name: trimmedName,
      relationship: trimmedRelationship
    });
    setName('');
    setRelationship('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1e1c26] rounded-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#a29db8] hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <UserPlus className="text-[#3b19e6]" size={24} />
          <h2 className="text-xl font-bold text-white">Add Connection</h2>
        </div>
        
        {recentConnections.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-[#a29db8]">
                <Clock size={16} />
                <span className="text-sm">Recent Connections</span>
              </div>
              {recentConnections.length > 3 && (
                <button
                  onClick={() => setShowAllRecent(!showAllRecent)}
                  className="text-[#3b19e6] text-sm hover:underline flex items-center gap-1"
                >
                  {showAllRecent ? 'Show Less' : 'See All'}
                  <ChevronRight size={16} className={`transform transition-transform 
                    ${showAllRecent ? 'rotate-90' : ''}`} />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {(showAllRecent ? recentConnections : recentConnections.slice(0, 3)).map((connection) => (
                <button
                  key={connection.id}
                  onClick={() => {
                    onAdd({
                      name: connection.name,
                      relationship: connection.relationship
                    });
                    onClose();
                  }}
                  className="w-full p-2 bg-[#2b2938] rounded-lg text-left hover:bg-[#343048] 
                           transition-colors group flex items-center justify-between"
                >
                  <div>
                    <span className="text-white block">{connection.name}</span>
                    <span className="text-[#a29db8] text-sm">{connection.relationship}</span>
                  </div>
                  <ChevronRight size={16} className="text-[#3b19e6] opacity-0 group-hover:opacity-100 
                                                   transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#a29db8] mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name..."
              className="w-full px-3 py-2 bg-[#2b2938] border border-[#403c53] 
                       rounded-lg text-white focus:border-[#3b19e6] outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[#a29db8] mb-2">
              Relationship
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full px-3 py-2 bg-[#2b2938] border border-[#403c53] 
                       rounded-lg text-white focus:border-[#3b19e6] outline-none"
              required
            >
              <option value="">Select relationship...</option>
              {commonRelationships.map(rel => (
                <option key={rel} value={rel.toLowerCase()}>
                  {rel}
                </option>
              ))}
              <option value="other">Other...</option>
            </select>
          </div>

          {relationship === 'other' && (
            <div>
              <label className="block text-sm text-[#a29db8] mb-2">
                Custom Relationship
              </label>
              <input
                type="text"
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="Enter relationship..."
                className="w-full px-3 py-2 bg-[#2b2938] border border-[#403c53] 
                         rounded-lg text-white focus:border-[#3b19e6] outline-none"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={!name || !relationship}
            className="w-full py-2 bg-[#3b19e6] text-white rounded-lg 
                     hover:bg-[#2f14b8] transition-colors disabled:opacity-50 
                     disabled:cursor-not-allowed"
          >
            Add Connection
          </button>
        </form>
      </div>
    </div>
  );
}