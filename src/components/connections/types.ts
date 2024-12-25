import type { Connection } from '../../types';

export interface ConnectionsPanelProps {
  userId?: string;
  storyId?: string;
  onAddConnection?: (data: { name: string; relationship: string }) => void;
}

export interface ConnectionsListProps {
  connections: Connection[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectConnection: (connection: Connection) => void;
}

export interface ConnectionDetailProps {
  connection: Connection;
  onBack: () => void;
}