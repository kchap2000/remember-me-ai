import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import type { Connection } from '../../types';

interface ConnectionSuggestionProps {
  name: string;
  onAdd: (connection: { name: string; relationship: string }) => void;
  onIgnore: () => void;
}

export function ConnectionSuggestion({ name, onAdd, onIgnore }: ConnectionSuggestionProps) {
  const [relationship, setRelationship] = useState('');
  const commonRelationships = [
    'Mother', 'Father', 'Sister', 'Brother', 'Friend', 
    'Teacher', 'Boss', 'Colleague', 'Aunt', 'Uncle'
  ];

  return (
    <div className="p-4 bg-[#2b2938] rounded-lg border border-[#403c53] relative">
      <button
        onClick={onIgnore}
        className="absolute top-2 right-2 text-[#a29db8] hover:text-white 
                 transition-colors"
      >
        <X size={16} />
      </button>

      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="text-[#3b19e6]" size={20} />
        <h3 className="text-white font-medium">New Connection Found</h3>
      </div>

      <p className="text-[#a29db8] mb-4">
        Would you like to add "{name}" as a connection?
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-[#a29db8] mb-2">
            Relationship
          </label>
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="w-full px-3 py-2 bg-[#1e1c26] border border-[#403c53] 
                     rounded-lg text-white focus:border-[#3b19e6] outline-none"
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
          <input
            type="text"
            placeholder="Enter relationship..."
            onChange={(e) => setRelationship(e.target.value)}
            className="w-full px-3 py-2 bg-[#1e1c26] border border-[#403c53] 
                     rounded-lg text-white focus:border-[#3b19e6] outline-none"
          />
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onAdd({ name, relationship })}
            disabled={!relationship}
            className="w-full py-2 px-4 bg-[#3b19e6] text-white rounded-lg 
                     hover:bg-[#2f14b8] transition-colors disabled:opacity-50 
                     disabled:cursor-not-allowed"
          >
            Add Connection
          </button>
          <button
            onClick={onIgnore}
            className="py-2 px-4 border border-[#403c53] text-[#a29db8] 
                     rounded-lg hover:bg-[#343048] transition-colors"
          >
            Ignore
          </button>
        </div>
      </div>
    </div>
  );
}