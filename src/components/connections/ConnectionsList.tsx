import React from 'react';
import { Search } from 'lucide-react';
import { Connection } from '../../types';
import { LIFE_PHASES } from '../../config/timeline.config';

interface ConnectionsListProps {
  connections: Connection[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectConnection: (connection: Connection) => void;
}

export function ConnectionsList({ 
  connections, 
  searchTerm, 
  onSearchChange, 
  onSelectConnection 
}: ConnectionsListProps) {
  const filteredConnections = connections.filter(connection =>
    connection.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 sticky top-0 bg-[#16133f]/95 backdrop-blur-sm z-10 border-b border-[#2b2938]">
        <div className="relative">
          <input
            type="text"
            placeholder="Search connections..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#2b2938] text-white 
                     placeholder-[#5b5676] border border-[#2b2938] 
                     focus:border-[#3b19e6] focus:outline-none"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-[#5b5676]" size={20} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2b2938] scrollbar-track-transparent">
        {filteredConnections.map((connection) => {
          const phase = LIFE_PHASES.find(
            p => p.id === connection.firstAppearance.phaseId
          );
          
          return (
            <div
              key={connection.id}
              onClick={() => onSelectConnection(connection)}
              className="p-4 cursor-pointer hover:bg-[#2b2938] transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-1 group-hover:translate-x-1 transition-transform">
                <span className="font-medium text-white">{connection.name}</span>
                <span className="text-sm text-[#a29db8]">
                  {connection.relationship}
                </span>
              </div>
              <p className="text-sm text-[#a29db8]">
                First appeared: {connection.firstAppearance.storyTitle}
              </p>
              <p className="text-xs" style={{ color: phase?.color }}>
                {phase?.name}
              </p>
            </div>
          );
        })}
        {filteredConnections.length === 0 && (
          <div className="flex items-center justify-center h-full text-[#a29db8] p-4 text-center">
            No connections found
          </div>
        )}
      </div>
    </div>
  );
}