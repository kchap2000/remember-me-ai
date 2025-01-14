import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '../layout/Card';
import { ConnectionsList } from './ConnectionsList';
import { ConnectionDetail } from './ConnectionDetail';
import { AddConnectionModal } from '../story/AddConnectionModal';
import { useConnectionsStore } from '../../store/useConnectionsStore';
import { cn } from '../../utils/cn';
import { components } from '../../styles/components';
import { Connection } from '../../types';

interface ConnectionsPanelProps {
  userId?: string;
  storyId?: string;
  onAddConnection?: (data: { name: string; relationship: string }) => void;
}

export function ConnectionsPanel({ 
  userId, 
  storyId, 
  onAddConnection 
}: ConnectionsPanelProps) {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);

  // Get store functions
  const { 
    connections,
    storyConnections,
    fetchUserConnections,
    fetchStoryConnections
  } = useConnectionsStore();

  // Load connections on mount or when storyId/userId changes
  useEffect(() => {
    const loadConnections = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (storyId) {
          await fetchStoryConnections(storyId);
        } else if (userId) {
          await fetchUserConnections(userId);
        }
      } catch (err) {
        setError('Failed to load connections');
        console.error('Error loading connections:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadConnections();
  }, [storyId, userId, fetchStoryConnections, fetchUserConnections]);

  const handleAddConnection = (data: { name: string; relationship: string }) => {
    try {
      if (onAddConnection) {
        onAddConnection(data);
      }
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding connection:', err);
      setError('Failed to add connection');
    }
  };

  return (
    <Card
      variant="elevated"
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <h2 className="text-xl font-bold text-text-primary">Connections</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-text-secondary">
            Loading connections...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full p-4 animate-fade-in">
            <p className="text-accent-error animate-fade-in">{error}</p>
          </div>
        ) : selectedConnection ? (
          <ConnectionDetail
            connection={selectedConnection}
            onBack={() => setSelectedConnection(null)}
            storyId={storyId}
          />
        ) : (
          <ConnectionsList
            connections={storyId ? storyConnections : connections}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSelectConnection={setSelectedConnection}
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border-subtle">
        <button
          onClick={() => setShowAddModal(true)}
          className={cn(
            components.button.base,
            components.button.variants.primary,
            components.button.sizes.md,
            "w-full flex items-center justify-center gap-2"
          )}
        >
          <Plus size={20} />
          <span>Add Connection</span>
        </button>
      </div>

      {/* Add Connection Modal */}
      {showAddModal && (
        <AddConnectionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddConnection}
          userId={userId}
          content=""
          storyId={storyId || ''}
          storyTitle=""
          selectedYear={new Date().getFullYear()}
        />
      )}
    </Card>
  );
}